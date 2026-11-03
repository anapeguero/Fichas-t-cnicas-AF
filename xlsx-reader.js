/* Minimal XLSX reader for the catalog: handles Excel .xlsx ZIP containers without third-party CDNs.
   Compatible with Excel saved as XLSX (shared strings or inline strings).
   Only reads values and hyperlinks; never executes workbook macros or formulas. */
(function () {
  'use strict';
  const txt = new TextDecoder('utf-8');
  const u16 = (d, p) => d.getUint16(p, true);
  const u32 = (d, p) => d.getUint32(p, true);
  const MAX_BYTES = 30 * 1024 * 1024;
  function parseXml(bytes) {
    const doc = new DOMParser().parseFromString(txt.decode(bytes), 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('Un XML de Excel no se pudo leer.');
    return doc;
  }
  function elements(el, tag) { return [...el.getElementsByTagNameNS('*', tag)]; }
  function first(el, tag) { return elements(el, tag)[0]; }
  function attr(element, name) { return element?.getAttribute(name) || ''; }
  function cleanPart(path) {
    const p = String(path || '').replace(/^\//, '');
    if (!p || p.split('/').includes('..')) throw new Error('Ruta interna XLSX no válida.');
    return p;
  }
  async function unzipEntries(buffer) {
    const data = new DataView(buffer);
    const length = data.byteLength;
    let eocd = -1;
    for (let i = length - 22; i >= Math.max(0, length - 66000); i--) {
      if (u32(data, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('No es un archivo XLSX válido (ZIP).');
    const count = u16(data, eocd + 10);
    const offset = u32(data, eocd + 16);
    if (count > 3000 || offset >= length) throw new Error('El archivo Excel es demasiado grande o incorrecto.');
    const entries = new Map();
    let cursor = offset;
    for (let i = 0; i < count; i++) {
      if (cursor + 46 > length || u32(data, cursor) !== 0x02014b50) throw new Error('Índice XLSX incompleto.');
      const compression = u16(data, cursor + 10);
      const compressed = u32(data, cursor + 20);
      const uncompressed = u32(data, cursor + 24);
      const nameLength = u16(data, cursor + 28);
      const extraLength = u16(data, cursor + 30);
      const commentLength = u16(data, cursor + 32);
      const localOffset = u32(data, cursor + 42);
      const name = txt.decode(new Uint8Array(buffer, cursor + 46, nameLength));
      cursor += 46 + nameLength + extraLength + commentLength;
      if (uncompressed > MAX_BYTES) throw new Error('Una hoja del Excel excede el tamaño admitido.');
      entries.set(name, { compression, compressed, localOffset });
    }
    async function read(name) {
      const key = cleanPart(name);
      const entry = entries.get(key);
      if (!entry) return null;
      const off = entry.localOffset;
      if (off + 30 > length || u32(data, off) !== 0x04034b50) throw new Error('Entrada ZIP incorrecta.');
      const start = off + 30 + u16(data, off + 26) + u16(data, off + 28);
      if (start + entry.compressed > length) throw new Error('Entrada ZIP truncada.');
      const raw = new Uint8Array(buffer, start, entry.compressed);
      if (entry.compression === 0) return raw;
      if (entry.compression !== 8) throw new Error('Método de compresión XLSX no compatible.');
      if (typeof DecompressionStream !== 'function') throw new Error('Este navegador no admite descompresión XLSX. Abre el sitio en Chrome o Edge actualizado.');
      const decompressed = new Blob([raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      const buf = await new Response(decompressed).arrayBuffer();
      if (buf.byteLength > MAX_BYTES) throw new Error('La hoja Excel es demasiado grande.');
      return new Uint8Array(buf);
    }
    return read;
  }
  function colNumber(reference) {
    const letters = /^([A-Z]+)/i.exec(reference || '')?.[1]?.toUpperCase() || '';
    let n = 0;
    for (const letter of letters) n = n * 26 + letter.charCodeAt(0) - 64;
    return n - 1;
  }
  function stringsOf(el) { return elements(el, 't').map(t => t.textContent).join(''); }
  function resolveWorkbookTarget(target) {
    const t = String(target || '').replace(/^\//, '');
    return cleanPart(t.startsWith('xl/') ? t : 'xl/' + t);
  }
  async function readCatalogXlsx(buffer) {
    const read = await unzipEntries(buffer);
    const workbook = await read('xl/workbook.xml');
    const wbRels = await read('xl/_rels/workbook.xml.rels');
    if (!workbook || !wbRels) throw new Error('Faltan partes esenciales de Excel.');
    const doc = parseXml(workbook);
    const sheets = elements(doc, 'sheet');
    const chosen = sheets.find(s => attr(s, 'name').toLocaleLowerCase('es') === 'equipos') || sheets[0];
    if (!chosen) throw new Error('El Excel no contiene hojas.');
    const relId = attr(chosen, 'r:id') || chosen.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    const rel = elements(parseXml(wbRels), 'Relationship').find(r => attr(r, 'Id') === relId);
    if (!rel) throw new Error('No se encontró la hoja Equipos.');
    const target = resolveWorkbookTarget(attr(rel, 'Target'));
    const worksheet = await read(target);
    if (!worksheet) throw new Error('No se pudo abrir la hoja Equipos.');
    const shared = await read('xl/sharedStrings.xml');
    const lookup = shared ? elements(parseXml(shared), 'si').map(stringsOf) : [];
    const sheet = parseXml(worksheet);
    const data = [];
    for (const row of elements(sheet, 'sheetData').flatMap(x => elements(x, 'row'))) {
      const values = [];
      for (const cell of elements(row, 'c')) {
        const column = colNumber(attr(cell, 'r'));
        if (column < 0 || column > 100) continue;
        const t = attr(cell, 't');
        let value = '';
        if (t === 'inlineStr') value = stringsOf(first(cell, 'is') || cell);
        else {
          const v = first(cell, 'v')?.textContent ?? '';
          value = t === 's' ? (lookup[Number(v)] ?? '') : v;
        }
        values[column] = String(value).trim();
      }
      if (values.some(Boolean)) data.push(values);
    }
    if (data.length < 2) return [];
    // Excel-generated hyperlinks with custom visible text (relationship targets).
    const filename = target.split('/').pop();
    const relationPath = target.slice(0, target.lastIndexOf('/')) + '/_rels/' + filename + '.rels';
    const sheetRelsFile = await read(relationPath);
    if (sheetRelsFile) {
      const rels = new Map(elements(parseXml(sheetRelsFile), 'Relationship').map(e => [attr(e, 'Id'), attr(e, 'Target')]));
      for (const h of elements(sheet, 'hyperlink')) {
        const href = rels.get(attr(h, 'r:id')) || attr(h, 'location');
        const ref = attr(h, 'ref');
        const m = /^(\D+)(\d+)$/.exec(ref);
        if (!href || !m || !/^https:\/\//i.test(href)) continue;
        const rowIdx = Number(m[2]) - 1;
        const colIdx = colNumber(ref);
        if (data[rowIdx] && colIdx >= 0) data[rowIdx][colIdx] = href;
      }
    }
    const norm = s => String(s || '').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
    const headers = data[0].map(norm);
    const pick = (row, label) => row[headers.indexOf(norm(label))] || '';
    if (!headers.includes('equipo') || !headers.includes('codigo')) throw new Error('El Excel necesita las columnas Código y Equipo.');
    return data.slice(1).filter(row => pick(row, 'Código') && pick(row, 'Equipo')).map(row => {
      const formats = pick(row, 'Formatos');
      return {
        codigo: pick(row, 'Código'),
        equipo: pick(row, 'Equipo'),
        categoria: pick(row, 'Categoría') || 'Sin categoría',
        formatos: formats.split(/[,;|]/).map(s=>s.trim()).filter(Boolean),
        proveedor: pick(row, 'Proveedor') || 'No indicado',
        marca: pick(row, 'Marca') || 'No indicada',
        modelo: pick(row, 'Modelo') || 'No indicado',
        estado: pick(row, 'Estado') || 'En revisión',
        foto: pick(row, 'Foto'),
        ficha: pick(row, 'Ficha técnica'),
        otros: pick(row, 'Otros documentos'),
        fecha: pick(row, 'Última actualización'),
        detalle: pick(row, 'Observaciones')
      };
    });
  }
  window.readCatalogXlsx = readCatalogXlsx;
})();

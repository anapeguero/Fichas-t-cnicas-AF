/* Catálogo Técnico de Activos Fijos — demostración estática. Sin APIs ni credenciales. */
(() => {
'use strict';
const catalogo = Array.isArray(window.CATALOGO_EJEMPLO) ? window.CATALOGO_EJEMPLO : [];
const state = {page:'inicio',selected:catalogo[0]?.codigo||'',tab:'resumen',search:'',formato:'',categoria:'',proveedor:'',estado:'',compare:[],excelUrl:readStorage('catalogoAF_onedrive','')};
const $ = (id) => document.getElementById(id);
const icon = (id) => `<svg aria-hidden="true"><use href="#ic-${id}"></use></svg>`;
const escapeHTML = (v) => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unique = (list)=>[...new Set(list)].sort((a,b)=>a.localeCompare(b,'es'));
const equipoByCode = (code)=>catalogo.find(x=>x.codigo===code);
const labelDate = (date)=> {const d=new Date(date+'T12:00:00');return isNaN(d)?'—':d.toLocaleDateString('es-DO',{year:'numeric',month:'short',day:'numeric'});};
const status = (name) => `<span class="status-pill ${name==='Estándar'?'status-ok':'status-review'}">${name==='Estándar'?icon('check'):icon('clock')}${escapeHTML(name)}</span>`;
const getDoc=(item) => (item?.documentos||[]).find(d=>/ficha técnica/i.test(d.nombre));
const safeHttp=(text)=> {try{const u=new URL(String(text));return u.protocol==='https:'?u.href:null;}catch{return null;}};
function readStorage(key,fallback){try{return localStorage.getItem(key)||fallback;}catch{return fallback;}}
function storeStorage(key,value){try{localStorage.setItem(key,value);}catch{}}
let toastTimer;
function toast(message){const el=$('toast');el.textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),4500);}
function stats(){
 $('kpiEquipos').textContent=catalogo.filter(x=>x.estado==='Estándar').length;
 $('kpiFormatos').textContent=unique(catalogo.flatMap(x=>x.formatos)).length;
 $('kpiCategorias').textContent=unique(catalogo.map(x=>x.categoria)).length;
 $('kpiProveedores').textContent=unique(catalogo.map(x=>x.proveedor)).length;
}
function fillOptions(id,items){let sel=$(id);for(const it of unique(items)){const o=document.createElement('option');o.value=it;o.textContent=it;sel.add(o);}}
function filtered(){return catalogo.filter(item=>{
  const q=state.search.trim().toLocaleLowerCase('es');
  const text=[item.codigo,item.equipo,item.categoria,item.proveedor,item.marca,item.modelo,...item.formatos].join(' ').toLocaleLowerCase('es');
  return (!q||text.includes(q)) && (!state.formato||item.formatos.includes(state.formato)) && (!state.categoria||item.categoria===state.categoria) && (!state.proveedor||item.proveedor===state.proveedor) && (!state.estado||item.estado===state.estado);
});}
function setSearch(value,src){state.search=value;if(src!=='table')$('tableSearch').value=value;if(src!=='global')$('globalSearch').value=value;renderDashboard();if(state.page!=='inicio'&&state.page!=='catalogo')setPage('catalogo');}
function renderDashboard(){
 const list=filtered();
 if(!list.some(x=>x.codigo===state.selected))state.selected=list[0]?.codigo||'';
 $('equipmentRows').innerHTML=list.map(item=>`<tr tabindex="0" role="button" data-code="${escapeHTML(item.codigo)}" class="${item.codigo===state.selected?'selected':''}" aria-label="Seleccionar ${escapeHTML(item.equipo)}"><td>${escapeHTML(item.codigo)}</td><td><div class="equipment-name"><img alt="" src="${escapeHTML(item.imagen)}"><span>${escapeHTML(item.equipo)}</span></div></td><td>${escapeHTML(item.categoria)}</td><td class="formats-cell">${escapeHTML(item.formatos.join(', '))}</td><td>${escapeHTML(item.proveedor)}</td><td>${status(item.estado)}</td></tr>`).join('');
 $('tableEmpty').hidden=list.length>0;
 $('resultCount').textContent=`${list.length} ${list.length===1?'equipo':'equipos'}`;
 renderDetail();renderMatrix();renderDocuments();
}
function selectItem(code){if(!equipoByCode(code))return;state.selected=code;state.tab='resumen';renderDashboard();}
function renderDetail(){
 const it=equipoByCode(state.selected);if(!it){$('detailPanel').innerHTML='<div class="empty-state">Selecciona un equipo para ver sus detalles.</div>';return;}
 const tabs=[['resumen','info','Resumen'],['especificaciones','list','Especificaciones'],['ficha','file','Ficha técnica'],['historial','clock','Historial']];
 const d=getDoc(it);const haveDoc=!!safeHttp(d?.url);
 let body='';
 if(state.tab==='resumen'){
   const fields=[['Código',it.codigo],['Modelo',it.modelo],['Marca',it.marca],['Proveedor de referencia',it.proveedor],['Categoría',it.categoria],['Formatos aplicables',it.formatos.join(', ')],['Estado del registro',it.estado],['Última revisión (demo)',labelDate(it.fecha)],['Observaciones',it.detalle]];
   body=`<table class="spec-table"><tbody>${fields.map(([k,v])=>`<tr><th>${escapeHTML(k)}</th><td>${escapeHTML(v)}</td></tr>`).join('')}</tbody></table>`;
 }else if(state.tab==='especificaciones'){
   body=`<div class="detail-message"><strong>Especificaciones en la ficha adjunta</strong><br>Para simplificar el mantenimiento, este catálogo muestra solo datos de identificación. Dimensiones, voltajes, capacidades, materiales y demás especificaciones se consultan directamente en el PDF aprobado por Compras.<br><button class="btn outline ${haveDoc?'':'disabled'}" ${haveDoc?'':'disabled'} data-action="open-document" data-code="${escapeHTML(it.codigo)}">${icon('file')} Abrir ficha técnica</button></div>`;
 }else if(state.tab==='ficha'){
   body=`<div class="detail-message"><strong>${haveDoc?'Ficha técnica disponible en OneDrive':'Ficha técnica aún no vinculada'}</strong><br>${haveDoc?'Este botón abrirá el documento original en Microsoft 365 respetando los permisos de acceso.':'Los enlaces de la demostración están vacíos. Cuando se configure el catálogo real, aquí podrás abrir el PDF sin copiarlo al repositorio.'}<br><button class="btn outline ${haveDoc?'':'disabled'}" ${haveDoc?'':'disabled'} data-action="open-document" data-code="${escapeHTML(it.codigo)}">${icon('external')} Abrir PDF en OneDrive</button></div>`;
 }else{
   body=`<div class="mini-hist"><div class="mini-hist-row"><strong>${escapeHTML(labelDate(it.fecha))}</strong><br>Fecha de referencia del registro de demostración</div><div class="mini-hist-row">El historial real deberá mantenerse en OneDrive/Excel, con las versiones o fechas de revisión del departamento.</div></div>`;
 }
 $('detailPanel').innerHTML=`<div class="detail-top"><div class="detail-image"><img src="${escapeHTML(it.imagen)}" alt="Ilustración de ${escapeHTML(it.equipo)}"></div><div class="detail-meta"><h2>${escapeHTML(it.equipo)}</h2><div class="detail-tags"><span class="code-pill">${escapeHTML(it.codigo)}</span>${status(it.estado)}</div><div class="detail-caption"><strong>Categoría:</strong> ${escapeHTML(it.categoria)}<br><strong>Proveedor de referencia:</strong> ${escapeHTML(it.proveedor)}</div></div><div class="detail-actions"><button class="btn primary" data-action="open-document" data-code="${escapeHTML(it.codigo)}">${icon('file')} Ver ficha técnica</button><button class="btn outline" data-action="open-document" data-code="${escapeHTML(it.codigo)}">${icon('download')} Descargar PDF</button><button class="btn outline" data-action="compare" data-code="${escapeHTML(it.codigo)}">${icon('scale')} ${state.compare.includes(it.codigo)?'Quitar de comparar':'Comparar'}</button></div></div><div class="detail-tabs">${tabs.map(([id,ic,label])=>`<button type="button" class="detail-tab ${id===state.tab?'active':''}" data-tab="${id}">${icon(ic)} ${label}</button>`).join('')}</div><div id="detailContent">${body}</div>`;
}
function renderMatrix(){const it=equipoByCode(state.selected);if(!it){$('formatMatrix').innerHTML='';return;}
 const formats=unique(catalogo.flatMap(x=>x.formatos));
 $('formatMatrix').innerHTML=`<table class="matrix-table"><thead><tr><th>Equipo</th>${formats.map(x=>`<th>${escapeHTML(x)}</th>`).join('')}</tr></thead><tbody><tr><td><div class="matrix-name"><img src="${escapeHTML(it.imagen)}" alt="">${escapeHTML(it.equipo)} (${escapeHTML(it.codigo)})</div></td>${formats.map(f=>`<td>${it.formatos.includes(f)?status(it.estado):'<span class="doc-status">—</span>'}</td>`).join('')}</tr></tbody></table>`;
}
function renderDocuments(){const it=equipoByCode(state.selected);if(!it){$('linkedDocuments').innerHTML='';return;}
 $('linkedDocuments').innerHTML=(it.documentos||[]).map(d=>{const yes=!!safeHttp(d.url);return `<div class="doc-row"><span class="doc-pdf">PDF</span><span class="doc-name">${escapeHTML(d.nombre)}.pdf</span><span class="doc-status">${yes?'OneDrive':'No vinculado'}</span>${yes?`<button class="doc-link" title="Abrir documento" data-action="open-url" data-url="${escapeHTML(d.url)}">${icon('external')}</button>`:`<span class="doc-link" title="Documento no vinculado" aria-hidden="true" style="opacity:.4">${icon('download')}</span>`}</div>`;}).join('');
}
function openDocument(code){const item=equipoByCode(code);const document=getDoc(item);if(!safeHttp(document?.url)){toast('Este es un catálogo de ejemplo. La ficha técnica aún no tiene enlace de OneDrive.');return;}window.open(safeHttp(document.url),'_blank','noopener,noreferrer');}
function addCompare(code){if(state.compare.includes(code)){state.compare=state.compare.filter(x=>x!==code);toast('Equipo retirado del comparador.');}else if(state.compare.length<2){state.compare.push(code);toast('Equipo agregado al comparador. Puedes seleccionar otro equipo.');}else{state.compare=[state.compare[1],code];toast('Se reemplazó el equipo más antiguo del comparador.');}renderCompareCount();renderDetail();if(state.page==='comparador')renderSecondary();}
function renderCompareCount(){let el=$('compareCounter');el.textContent=state.compare.length;el.hidden=!state.compare.length;}
function secondaryHeader(title,subtitle,tools=''){return `<div class="secondary-head"><div><h2>${title}</h2><p>${subtitle}</p></div>${tools}</div>`;}
function renderSecondary(){
 const area=$('secondaryPage');let html='';
 if(state.page==='fichas'){
   html=secondaryHeader('Fichas técnicas','Documentos asociados a los equipos registrados')+`<div class="section-grid">${catalogo.map(it=>`<div class="tile" data-action="select-and-show" data-code="${escapeHTML(it.codigo)}"><img src="${escapeHTML(it.imagen)}" alt=""><h3>${escapeHTML(it.equipo)}</h3><p>${escapeHTML(it.codigo)} · ${escapeHTML(it.proveedor)}</p><span class="tile-badge">${getDoc(it)?.url?'Ficha vinculada':'Pendiente de vínculo'}</span></div>`).join('')}</div>`;
 }else if(state.page==='formatos'){
 const formatos=unique(catalogo.flatMap(x=>x.formatos));
 html=secondaryHeader('Estándares por formato','Matriz de referencia por tipo de tienda')+`<div class="section-card"><div style="overflow:auto"><table class="simple-table"><thead><tr><th>Equipo</th>${formatos.map(f=>`<th>${escapeHTML(f)}</th>`).join('')}</tr></thead><tbody>${catalogo.map(it=>`<tr><td><strong>${escapeHTML(it.equipo)}</strong><br><span style="font-size:10px;color:#93a1ad">${escapeHTML(it.codigo)}</span></td>${formatos.map(f=>`<td>${it.formatos.includes(f)?status(it.estado):'—'}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`;
 }else if(state.page==='proveedores'){
 const proveedores=unique(catalogo.map(x=>x.proveedor));html=secondaryHeader('Proveedores','Proveedores asociados a los registros demostrativos')+`<div class="section-grid">${proveedores.map(p=>`<div class="tile" data-action="provider" data-provider="${escapeHTML(p)}"><span class="kpi-icon">${icon('handshake')}</span><h3>${escapeHTML(p)}</h3><p>${catalogo.filter(x=>x.proveedor===p).length} equipos en el catálogo</p></div>`).join('')}</div>`;
 }else if(state.page==='comparador'){
 const items=state.compare.map(equipoByCode).filter(Boolean);html=secondaryHeader('Comparador de equipos','Selecciona hasta dos equipos desde el catálogo',`<button class="btn outline" data-action="clear-compare">${icon('x')} Limpiar</button>`)+`<div class="compare-grid">${items.length?items.map(it=>`<div class="compare-item"><img src="${escapeHTML(it.imagen)}" alt=""><h3>${escapeHTML(it.equipo)}</h3><table class="spec-table"><tr><th>Código</th><td>${escapeHTML(it.codigo)}</td></tr><tr><th>Marca</th><td>${escapeHTML(it.marca)}</td></tr><tr><th>Modelo</th><td>${escapeHTML(it.modelo)}</td></tr><tr><th>Proveedor</th><td>${escapeHTML(it.proveedor)}</td></tr><tr><th>Formatos</th><td>${escapeHTML(it.formatos.join(', '))}</td></tr><tr><th>Estado</th><td>${escapeHTML(it.estado)}</td></tr></table><button class="btn outline" data-action="open-document" data-code="${escapeHTML(it.codigo)}">${icon('file')} Ver ficha</button></div>`).join(''):'<div class="placeholder-ct">No hay equipos seleccionados. Vuelve al catálogo, abre un equipo y pulsa «Comparar».</div>'}</div>`;
 }else if(state.page==='documentos'){
 html=secondaryHeader('Documentos','Referencias a fichas y documentos técnicos alojados en OneDrive')+`<div class="section-card"><table class="simple-table"><thead><tr><th>Equipo</th><th>Documento</th><th>Disponibilidad</th><th>Acción</th></tr></thead><tbody>${catalogo.flatMap(it=>(it.documentos||[]).map(d=>`<tr><td>${escapeHTML(it.equipo)}</td><td>${escapeHTML(d.nombre)}</td><td>${safeHttp(d.url)?'Vinculado':'Pendiente'}</td><td>${safeHttp(d.url)?`<button data-action="open-url" data-url="${escapeHTML(d.url)}">Abrir PDF</button>`:'—'}</td></tr>`)).join('')}</tbody></table></div>`;
 }else if(state.page==='onedrive'){
 const url=safeHttp(state.excelUrl);
 html=secondaryHeader('Excel en OneDrive','Vista del libro maestro de Activos Fijos')+`<div class="section-card"><div class="onedrive-intro">El libro se consulta desde Microsoft 365. <strong>No se copia ni se descarga al repositorio.</strong> Solo se podrá visualizar incrustado cuando la configuración de tu organización lo permita. El catálogo gráfico de «Inicio» es una demostración independiente y no extrae automáticamente las filas del Excel privado.</div><div class="onedrive-toolbar"><div class="security-note">${url?'Enlace configurado para este navegador. No está almacenado en GitHub.':'Todavía no has vinculado un Excel en este navegador.'}</div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn outline" data-action="edit-excel">${icon('link')} ${url?'Cambiar enlace':'Vincular Excel'}</button>${url?`<button class="btn primary" data-action="open-excel">${icon('external')} Abrir en OneDrive</button>`:''}</div></div><div class="excel-embed">${url?`<iframe src="${escapeHTML(url)}" title="Excel de OneDrive" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen"></iframe>`:`<div class="excel-placeholder">${icon('file')}<h3>Tu Excel aparecerá aquí</h3><p>Utiliza «Vincular Excel» y pega la dirección permitida por Microsoft 365. Si la organización bloquea la inserción, podrás abrir el archivo en una pestaña de OneDrive.</p><button class="btn primary" data-action="edit-excel">${icon('link')} Vincular Excel</button></div>`}</div><p style="font-size:11px;color:#708d9f;line-height:1.6">Importante: Microsoft puede impedir el iframe mediante inicio de sesión o políticas del navegador. En ese caso, «Abrir en OneDrive» es la alternativa sin intervención técnica. Ninguna de las dos opciones concede permisos nuevos.</p></div>`;
 }
 area.innerHTML=html;
}
function setPage(page){state.page=page;const isMain=['inicio','catalogo'].includes(page);$('mainDashboard').hidden=!isMain;$('secondaryPage').hidden=isMain;document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.page===page));if(isMain)renderDashboard();else renderSecondary();window.scrollTo({top:0,behavior:'instant'});}
function showExcelDialog(){const dlg=$('configDialog');$('excelUrlInput').value=state.excelUrl||'';dlg.showModal();}
function validateMicrosoftUrl(text){const url=safeHttp(text);if(!url)return null;const host=new URL(url).hostname.toLowerCase();if(host==='1drv.ms'||host==='onedrive.live.com'||host==='onedrive.com'||host==='excel.officeapps.live.com'||host.endsWith('.sharepoint.com')||host.endsWith('.officeapps.live.com')||host.endsWith('.microsoft365.com'))return url;return null;}
function setup(){
 stats();fillOptions('filterFormato',catalogo.flatMap(x=>x.formatos));fillOptions('filterCategoria',catalogo.map(x=>x.categoria));fillOptions('filterProveedor',catalogo.map(x=>x.proveedor));fillOptions('filterEstado',catalogo.map(x=>x.estado));renderDashboard();
 $('sidebarNav').addEventListener('click',e=>{const btn=e.target.closest('[data-page]');if(btn)setPage(btn.dataset.page);});
 for(const [name,key] of [['filterFormato','formato'],['filterCategoria','categoria'],['filterProveedor','proveedor'],['filterEstado','estado']])$(name).addEventListener('change',e=>{state[key]=e.target.value;renderDashboard();});
 $('globalSearch').addEventListener('input',e=>setSearch(e.target.value,'global'));
 $('tableSearch').addEventListener('input',e=>setSearch(e.target.value,'table'));
 $('equipmentRows').addEventListener('click',e=>{const row=e.target.closest('tr[data-code]');if(row)selectItem(row.dataset.code);});
 $('equipmentRows').addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){const row=e.target.closest('tr[data-code]');if(row){e.preventDefault();selectItem(row.dataset.code);}}});
 document.addEventListener('click',e=>{
   const tab=e.target.closest('[data-tab]');if(tab){state.tab=tab.dataset.tab;renderDetail();return;}
   const btn=e.target.closest('[data-action]');if(!btn)return;
   const a=btn.dataset.action;
   if(a==='open-document')openDocument(btn.dataset.code);
   else if(a==='compare')addCompare(btn.dataset.code);
   else if(a==='open-url'){const url=safeHttp(btn.dataset.url);if(url)window.open(url,'_blank','noopener,noreferrer');}
   else if(a==='clear-compare'){state.compare=[];renderCompareCount();renderSecondary();}
   else if(a==='select-and-show'){selectItem(btn.dataset.code);setPage('inicio');}
   else if(a==='provider'){state.proveedor=btn.dataset.provider;$('filterProveedor').value=state.proveedor;setPage('inicio');}
   else if(a==='edit-excel')showExcelDialog();
   else if(a==='open-excel'){const link=validateMicrosoftUrl(state.excelUrl);if(link)window.open(link,'_blank','noopener,noreferrer');}
 });
 $('excelForm').addEventListener('submit',e=>{e.preventDefault();const raw=$('excelUrlInput').value.trim();const url=validateMicrosoftUrl(raw);if(!url){toast('Escribe una dirección HTTPS válida de OneDrive, SharePoint o Excel de Microsoft 365.');return;}state.excelUrl=url;storeStorage('catalogoAF_onedrive',url);$('configDialog').close();renderSecondary();toast('Enlace guardado en este navegador. Comprueba si Microsoft permite la visualización integrada.');});
 $('closeConfig').addEventListener('click',()=> $('configDialog').close());
 $('clearExcelUrl').addEventListener('click',()=>{state.excelUrl='';try{localStorage.removeItem('catalogoAF_onedrive');}catch{}$('configDialog').close();if(state.page==='onedrive')renderSecondary();toast('Se quitó el enlace de este navegador.');});
 $('helpBtn').addEventListener('click',()=>toast('Usa los filtros para localizar equipos. En «Excel en OneDrive» puedes vincular y consultar el libro corporativo.'));
 $('notificationsBtn').addEventListener('click',()=>toast('Vista de ejemplo: no hay notificaciones ni conexión automática con sistemas corporativos.'));
}
setup();
})();

/* Catálogo Técnico de Activos Fijos — se alimenta de data/catalogo.xlsx. */
(() => {
'use strict';
const catalogo = []; 
const state = {page:'inicio',selected:catalogo[0]?.codigo||'',tab:'resumen',search:'',formato:'',categoria:'',proveedor:'',estado:'',compare:[]};
const $ = (id) => document.getElementById(id);
const icon = (id) => `<svg aria-hidden="true"><use href="#ic-${id}"></use></svg>`;
const escapeHTML = (v) => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const unique = (list)=>[...new Set(list)].sort((a,b)=>a.localeCompare(b,'es'));
const equipoByCode = (code)=>catalogo.find(x=>x.codigo===code);
const labelDate = (date)=> {const d=new Date(date+'T12:00:00');return isNaN(d)?'—':d.toLocaleDateString('es-DO',{year:'numeric',month:'short',day:'numeric'});};
const status = (name) => `<span class="status-pill ${name==='Estándar'?'status-ok':'status-review'}">${name==='Estándar'?icon('check'):icon('clock')}${escapeHTML(name)}</span>`;
const getDoc=(item) => (item?.documentos||[]).find(d=>/ficha técnica/i.test(d.nombre));
const safeHttp=(text)=> {
  const value=String(text||'').trim();
  if(!value) return null;
  if(/^https:\/\//i.test(value)){try{return new URL(value).href;}catch{return null;}}
  // Files uploaded to assets/fichas/ are public on GitHub Pages.
  const clean=value.replace(/^assets\/fichas\//i,'');
  if(/^[^\\/:*?"<>|]+\.pdf$/i.test(clean) && !clean.includes('..')) return 'assets/fichas/'+encodeURIComponent(clean);
  return null;
};
const safePhoto=(value)=> {
  const v=String(value||'').trim();
  if(/^https:\/\//i.test(v)) {try{return new URL(v).href;}catch{return 'assets/fotos/sin-foto.svg';}}
  const f=v.replace(/^assets\/fotos\//i,'');
  if(f && !f.includes('..') && /^[^\\/:*?"<>|]+\.(png|jpe?g|webp|gif|svg)$/i.test(f)) return 'assets/fotos/'+encodeURIComponent(f);
  return 'assets/fotos/sin-foto.svg';
};
const dateValue=(s)=>{const t=String(s||'').trim();if(/^\d{5}(\.0+)?$/.test(t)){const d=new Date(Date.UTC(1899,11,30)+Number(t)*86400000);return d.toISOString().slice(0,10);}return t;};
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
function fillOptions(id,items){let sel=$(id);while(sel.options.length>1)sel.remove(1);for(const it of unique(items)){const o=document.createElement('option');o.value=it;o.textContent=it;sel.add(o);}}
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
   const fields=[['Código',it.codigo],['Modelo',it.modelo],['Marca',it.marca],['Proveedor de referencia',it.proveedor],['Categoría',it.categoria],['Formatos aplicables',it.formatos.join(', ')],['Estado del registro',it.estado],['Última actualización',labelDate(it.fecha)],['Observaciones',it.detalle]];
   body=`<table class="spec-table"><tbody>${fields.map(([k,v])=>`<tr><th>${escapeHTML(k)}</th><td>${escapeHTML(v)}</td></tr>`).join('')}</tbody></table>`;
 }else if(state.tab==='especificaciones'){
   body=`<div class="detail-message"><strong>Especificaciones en la ficha adjunta</strong><br>Para simplificar el mantenimiento, este catálogo muestra solo datos de identificación. Dimensiones, voltajes, capacidades, materiales y demás especificaciones se consultan directamente en el PDF aprobado por Compras.<br><button class="btn outline ${haveDoc?'':'disabled'}" ${haveDoc?'':'disabled'} data-action="open-document" data-code="${escapeHTML(it.codigo)}">${icon('file')} Abrir ficha técnica</button></div>`;
 }else if(state.tab==='ficha'){
   body=`<div class="detail-message"><strong>${haveDoc?'Ficha técnica vinculada':'Ficha técnica aún no vinculada'}</strong><br>${haveDoc?'El enlace abrirá el documento adjunto. Si está en OneDrive, se aplicarán sus permisos de acceso.':'Agrega el enlace del PDF en la columna «Ficha técnica» del Excel maestro.'}<br><button class="btn outline ${haveDoc?'':'disabled'}" ${haveDoc?'':'disabled'} data-action="open-document" data-code="${escapeHTML(it.codigo)}">${icon('external')} Abrir ficha técnica</button></div>`;
 }else{
   body=`<div class="mini-hist"><div class="mini-hist-row"><strong>${escapeHTML(labelDate(it.fecha))}</strong><br>Última actualización indicada en el Excel</div><div class="mini-hist-row">Para ver modificaciones anteriores del catálogo, consulta el historial de cambios del archivo en GitHub.</div></div>`;
 }
 $('detailPanel').innerHTML=`<div class="detail-top"><div class="detail-image"><img src="${escapeHTML(it.imagen)}" alt="Fotografía de ${escapeHTML(it.equipo)}"></div><div class="detail-meta"><h2>${escapeHTML(it.equipo)}</h2><div class="detail-tags"><span class="code-pill">${escapeHTML(it.codigo)}</span>${status(it.estado)}</div><div class="detail-caption"><strong>Categoría:</strong> ${escapeHTML(it.categoria)}<br><strong>Proveedor de referencia:</strong> ${escapeHTML(it.proveedor)}</div></div><div class="detail-actions"><button class="btn primary" data-action="open-document" data-code="${escapeHTML(it.codigo)}">${icon('file')} Ver ficha técnica</button><button class="btn outline" data-action="open-document" data-code="${escapeHTML(it.codigo)}">${icon('download')} Abrir PDF</button><button class="btn outline" data-action="compare" data-code="${escapeHTML(it.codigo)}">${icon('scale')} ${state.compare.includes(it.codigo)?'Quitar de comparar':'Comparar'}</button></div></div><div class="detail-tabs">${tabs.map(([id,ic,label])=>`<button type="button" class="detail-tab ${id===state.tab?'active':''}" data-tab="${id}">${icon(ic)} ${label}</button>`).join('')}</div><div id="detailContent">${body}</div>`;
}
function renderMatrix(){const it=equipoByCode(state.selected);if(!it){$('formatMatrix').innerHTML='';return;}
 const formats=unique(catalogo.flatMap(x=>x.formatos));
 $('formatMatrix').innerHTML=`<table class="matrix-table"><thead><tr><th>Equipo</th>${formats.map(x=>`<th>${escapeHTML(x)}</th>`).join('')}</tr></thead><tbody><tr><td><div class="matrix-name"><img src="${escapeHTML(it.imagen)}" alt="">${escapeHTML(it.equipo)} (${escapeHTML(it.codigo)})</div></td>${formats.map(f=>`<td>${it.formatos.includes(f)?status(it.estado):'<span class="doc-status">—</span>'}</td>`).join('')}</tr></tbody></table>`;
}
function renderDocuments(){const it=equipoByCode(state.selected);if(!it){$('linkedDocuments').innerHTML='';return;}
 $('linkedDocuments').innerHTML=(it.documentos||[]).map(d=>{const yes=!!safeHttp(d.url);return `<div class="doc-row"><span class="doc-pdf">PDF</span><span class="doc-name">${escapeHTML(d.nombre)}.pdf</span><span class="doc-status">${yes?'Disponible':'No vinculado'}</span>${yes?`<button class="doc-link" title="Abrir documento" data-action="open-url" data-url="${escapeHTML(d.url)}">${icon('external')}</button>`:`<span class="doc-link" title="Documento no vinculado" aria-hidden="true" style="opacity:.4">${icon('download')}</span>`}</div>`;}).join('');
}
function openDocument(code){const item=equipoByCode(code);const document=getDoc(item);if(!safeHttp(document?.url)){toast('No hay ficha técnica vinculada. Agrega su enlace en el Excel maestro.');return;}window.open(safeHttp(document.url),'_blank','noopener,noreferrer');}
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
 const proveedores=unique(catalogo.map(x=>x.proveedor));html=secondaryHeader('Proveedores','Proveedores de los equipos del catálogo')+`<div class="section-grid">${proveedores.map(p=>`<div class="tile" data-action="provider" data-provider="${escapeHTML(p)}"><span class="kpi-icon">${icon('handshake')}</span><h3>${escapeHTML(p)}</h3><p>${catalogo.filter(x=>x.proveedor===p).length} equipos en el catálogo</p></div>`).join('')}</div>`;
 }else if(state.page==='comparador'){
 const items=state.compare.map(equipoByCode).filter(Boolean);html=secondaryHeader('Comparador de equipos','Selecciona hasta dos equipos desde el catálogo',`<button class="btn outline" data-action="clear-compare">${icon('x')} Limpiar</button>`)+`<div class="compare-grid">${items.length?items.map(it=>`<div class="compare-item"><img src="${escapeHTML(it.imagen)}" alt=""><h3>${escapeHTML(it.equipo)}</h3><table class="spec-table"><tr><th>Código</th><td>${escapeHTML(it.codigo)}</td></tr><tr><th>Marca</th><td>${escapeHTML(it.marca)}</td></tr><tr><th>Modelo</th><td>${escapeHTML(it.modelo)}</td></tr><tr><th>Proveedor</th><td>${escapeHTML(it.proveedor)}</td></tr><tr><th>Formatos</th><td>${escapeHTML(it.formatos.join(', '))}</td></tr><tr><th>Estado</th><td>${escapeHTML(it.estado)}</td></tr></table><button class="btn outline" data-action="open-document" data-code="${escapeHTML(it.codigo)}">${icon('file')} Ver ficha</button></div>`).join(''):'<div class="placeholder-ct">No hay equipos seleccionados. Vuelve al catálogo, abre un equipo y pulsa «Comparar».</div>'}</div>`;
 }else if(state.page==='documentos'){
 html=secondaryHeader('Documentos','Enlaces a las fichas y documentos de los equipos')+`<div class="section-card"><table class="simple-table"><thead><tr><th>Equipo</th><th>Documento</th><th>Disponibilidad</th><th>Acción</th></tr></thead><tbody>${catalogo.flatMap(it=>(it.documentos||[]).map(d=>`<tr><td>${escapeHTML(it.equipo)}</td><td>${escapeHTML(d.nombre)}</td><td>${safeHttp(d.url)?'Vinculado':'Pendiente'}</td><td>${safeHttp(d.url)?`<button data-action="open-url" data-url="${escapeHTML(d.url)}">Abrir PDF</button>`:'—'}</td></tr>`)).join('')}</tbody></table></div>`;
 }else if(state.page==='actualizar'){
 html=secondaryHeader('Cómo actualizar el catálogo','Reemplaza el Excel en GitHub para actualizar automáticamente los datos')+`<div class="section-card update-guide"><h3>1. Edita el Excel</h3><p>Abre <code>data/catalogo.xlsx</code> y actualiza la hoja <strong>Equipos</strong>. Conserva el nombre del archivo y los encabezados. No es necesario editar JavaScript.</p><h3>2. Añade fotografías</h3><p>Sube imágenes JPG, PNG, WEBP o SVG a <code>assets/fotos/</code> y escribe el nombre exacto en la columna <strong>Foto</strong> (ejemplo: <code>rack-real.jpg</code>). También admite URLs HTTPS públicas de imágenes.</p><h3>3. Coloca las fichas técnicas</h3><p>Pega la dirección HTTPS del PDF en la columna <strong>Ficha técnica</strong>. Si la ficha está en OneDrive, se abrirá según los permisos que ya tenga cada persona.</p><h3>4. Publica el cambio</h3><p>En GitHub, abre <code>data/</code>, selecciona <strong>Add file → Upload files</strong>, arrastra el Excel actualizado y guarda con <strong>Commit changes</strong>. Los visitantes podrán ver la versión actualizada cuando GitHub Pages la publique.</p><h3>5. Permisos de edición</h3><p>Solo los propietarios y colaboradores con permiso de escritura en GitHub pueden modificar el Excel y las fotos. Los visitantes del dashboard no necesitan contraseña para consultar.</p><div class="guide-note"><strong>Privacidad:</strong> un GitHub Pages público es visible desde Internet. Publica únicamente datos, fotografías y archivos autorizados para difusión externa. Los enlaces a OneDrive mantienen sus permisos, pero el texto del Excel en GitHub es público.</div>${getRepoUrl()?`<a class="btn primary" href="${escapeHTML(getRepoUrl())}/tree/main/data" target="_blank" rel="noopener noreferrer">${icon('external')} Ir al Excel en GitHub</a>`:''}</div>`;
 }
 area.innerHTML=html;
}
function setPage(page){state.page=page;const isMain=['inicio','catalogo'].includes(page);$('mainDashboard').hidden=!isMain;$('secondaryPage').hidden=isMain;document.querySelectorAll('.nav-link').forEach(b=>b.classList.toggle('active',b.dataset.page===page));if(isMain)renderDashboard();else renderSecondary();window.scrollTo({top:0,behavior:'instant'});}

function getRepoUrl(){
 const config=String(window.CATALOGO_CONFIG?.repoUrl||'').trim();
 if(/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(config)) return config.replace(/\/$/,'');
 // GitHub Pages project-site URL: https://user.github.io/repo/
 const match=/^([a-z0-9-]+)\.github\.io$/i.exec(location.hostname);
 const project=location.pathname.split('/').filter(Boolean)[0];
 if(match && project) return 'https://github.com/'+match[1]+'/'+project;
 return '';
}
async function loadWorkbook(){
 try{
   if(typeof window.readCatalogXlsx!=='function') throw new Error('Falta el lector de Excel xlsx-reader.js');
   const resp=await fetch('data/catalogo.xlsx?version='+Date.now(),{cache:'no-store'});
   if(!resp.ok) throw new Error('No se encontró data/catalogo.xlsx (HTTP '+resp.status+').');
   const rows=await window.readCatalogXlsx(await resp.arrayBuffer());
   const seen=new Set();
   catalogo.length=0;
   for(const x of rows){
     if(seen.has(x.codigo)){console.warn('Código duplicado omitido:',x.codigo);continue;}
     seen.add(x.codigo);
     const docs=[];
     if(safeHttp(x.ficha)) docs.push({nombre:'Ficha técnica',url:safeHttp(x.ficha)});
     else docs.push({nombre:'Ficha técnica',url:''});
     if(safeHttp(x.otros)) docs.push({nombre:'Otros documentos',url:safeHttp(x.otros)});
     catalogo.push({...x,formatos:x.formatos||[],imagen:safePhoto(x.foto),fecha:dateValue(x.fecha),documentos:docs});
   }
   const isDemo=catalogo.some(x=>/ejemplo/i.test(x.proveedor)) && catalogo.length>0;
   $('demoRibbon').hidden=!isDemo;
   state.selected=catalogo[0]?.codigo||'';
   state.compare=[];
   renderCompareCount();
   stats();
   fillOptions('filterFormato',catalogo.flatMap(x=>x.formatos));
   fillOptions('filterCategoria',catalogo.map(x=>x.categoria));
   fillOptions('filterProveedor',catalogo.map(x=>x.proveedor));
   fillOptions('filterEstado',catalogo.map(x=>x.estado));
   renderDashboard();
   if(!catalogo.length) toast('El Excel no contiene equipos. Agrega filas en la hoja Equipos.');
 }catch(err){
   console.error('No se pudo cargar el catálogo:',err);
   $('demoRibbon').hidden=true;
   $('equipmentRows').innerHTML='<tr><td colspan="6"><strong>No se pudo abrir el Excel.</strong> Comprueba que existe data/catalogo.xlsx y conserva la hoja Equipos. Consulta Cómo actualizar.</td></tr>';
   $('detailPanel').innerHTML='<div class="empty-state">El catálogo no está disponible. '+escapeHTML(err.message)+'</div>';
   $('tableEmpty').hidden=true;
   toast('Error al cargar Excel: '+err.message);
 }
}
function setup(){
 // If a photo does not exist, show a neutral placeholder without breaking the layout.
 document.addEventListener('error',e=>{
   if(e.target?.tagName==='IMG' && !e.target.dataset.photoFallback){
     e.target.dataset.photoFallback='1';e.target.src='assets/fotos/sin-foto.svg';
   }
 },true);
 const repo=getRepoUrl();
 if(repo){$('editRepoLink').href=repo+'/tree/main/data';$('editRepoLink').hidden=false;}
 $('equipmentRows').innerHTML='<tr><td colspan="6">Cargando equipos desde el Excel...</td></tr>';
 loadWorkbook();
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
 });
 $('helpBtn').addEventListener('click',()=>toast('Filtra por formato o categoría y selecciona un equipo. Los cambios se hacen reemplazando data/catalogo.xlsx en GitHub.'));
 $('notificationsBtn').addEventListener('click',()=>toast('El catálogo se actualiza cuando se reemplaza el Excel en GitHub. No hay notificaciones automáticas.'));
}
setup();
})();

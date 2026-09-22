const navItems = document.querySelectorAll('[data-view]');
const pages = document.querySelectorAll('.page');
const breadcrumb = document.getElementById('breadcrumbCurrent');
const sidebar = document.getElementById('sidebar');
document.addEventListener('change', event => { if (event.target.id === 'componentSort' && typeof renderComponents === 'function') { localStorage.setItem(bikeStorageKey('componentSort'), event.target.value); renderComponents(); } });

const labels = { hoy: 'Mis motos', dashboard: 'Mis motos', motos: 'Mis motos', vida: 'Libro de vida', mantenimiento: 'Mantenimiento', componentes: 'Componentes', uso: 'Gráficos', tecnico: 'Banco técnico' };
function ensureUsageView() {
  const nav = document.querySelector('.nav');
  if (nav && !nav.querySelector('[data-view="uso"]')) {
    const label = document.createElement('p'); label.className = 'nav-label'; label.textContent = 'Análisis'; nav.append(label);
    const button = document.createElement('button'); button.className = 'nav-item'; button.dataset.view = 'uso'; button.innerHTML = '<span class="nav-icon">▥</span>Gráficos'; button.addEventListener('click', () => showView('uso')); nav.append(button);
  }
  const main = document.querySelector('.main-content');
  if (main && !document.getElementById('view-uso')) {
    const page = document.createElement('div'); page.className = 'page hidden'; page.id = 'view-uso';
    page.innerHTML = '<section class="page-heading"><div><p class="eyebrow">Análisis de uso</p><h1>Gráficos</h1><p class="subtitle">Evolución de horas, kilómetros y cambios de componentes.</p></div></section><section class="component-usage-panel panel"><div class="card-top"><div><h3>Horas frente a kilómetros</h3><p>Evolución basada únicamente en los mantenimientos registrados.</p></div></div><div class="component-usage-layout"><div class="component-usage-chart"><label class="chart-orientation">Vista<select id="chartOrientation"><option value="hoursKm">Horas frente a km</option><option value="kmHours" selected>Km frente a horas</option></select></label><svg id="componentUsageChart" viewBox="0 0 700 330" role="img" aria-label="Gráfico de horas frente a kilómetros"></svg><p class="component-chart-empty" hidden>No hay suficientes registros con horas y kilómetros para dibujar el gráfico.</p></div><aside class="component-usage-filters"><strong>Resaltar componentes</strong><small>Selecciona ninguno, uno o varios.</small><div id="componentUsageOptions"></div></aside></div><div class="component-usage-data"><h3>Datos utilizados</h3><p>Solo eventos de mantenimiento. La curva usa las filas con horas y kilómetros reales.</p><div id="componentUsageDataTable"></div></div></section>';
    main.insertBefore(page, main.querySelector('#view-tecnico') || null);
  }
}
ensureUsageView();
const bikeDefaults = { brand: 'KTM', model: '250 EXC TPI', year: '2021', plate: '9038 LKN', realHours: 195, markerHours: 195, realKm: 2908, markerKm: 2908, maintenanceUnit: 'hours', itvNextDate: '2028-07-08', insuranceExpiryDate: '2026-10-16' };
const bikeModelCatalog = { ktm250f: { brand: 'KTM', model: 'EXC 250 F', engine: '4T', maintenanceUnit: 'hours', photo: 'assets/ktm-250-f.png' }, ktm250tpi: { brand: 'KTM', model: '250 TPI / 300 TPI', engine: '2T', maintenanceUnit: 'hours', photo: 'assets/ktm-250-exc-tpi-2021.png' }, ktm350f: { brand: 'KTM', model: 'EXC 350 F', engine: '4T', maintenanceUnit: 'hours', photo: 'assets/ktm-350-f.png' }, yamaha450: { brand: 'Yamaha', model: 'WR 450', engine: '4T', maintenanceUnit: 'hours', photo: 'assets/yamaha-wr450-2010.jpg' } };
const legacyProfile = JSON.parse(localStorage.getItem('motoProfile') || 'null');
let bikeProfiles = JSON.parse(localStorage.getItem('motoProfiles') || 'null');
if (!Array.isArray(bikeProfiles) || !bikeProfiles.length) {
  const starterModels = Object.entries(bikeModelCatalog).map(([key, template], index) => ({ id: `moto-${key}`, ...bikeDefaults, brand: template.brand, model: template.model, engine: template.engine, photo: template.photo, maintenancePlanId: key === 'yamaha450' ? 'yamaha-wr450-1000km' : 'ktm-base', year: index === 1 ? '2021' : '', plate: '', realHours: 0, markerHours: 0, realKm: 0, markerKm: 0 }));
  bikeProfiles = legacyProfile ? [{ id: 'moto-1', ...bikeDefaults, ...(legacyProfile || {}) }] : starterModels;
  localStorage.setItem('motoCatalogBackup', JSON.stringify({ createdAt: new Date().toISOString(), profiles: starterModels }));
}
bikeProfiles.forEach(profile => { if (!profile.maintenanceUnit) profile.maintenanceUnit = 'hours'; if (profile.brand === 'Yamaha' && /^WR 450 \(2010\)$/i.test(profile.model || '')) profile.model = 'WR 450'; });
localStorage.setItem('motoProfiles', JSON.stringify(bikeProfiles));
if (!localStorage.getItem('motoCatalogBackup')) {
  const catalogProfiles = Object.entries(bikeModelCatalog).map(([key, template], index) => ({ id: `moto-${key}`, ...bikeDefaults, brand: template.brand, model: template.model, engine: template.engine, photo: template.photo, maintenancePlanId: key === 'yamaha450' ? 'yamaha-wr450-1000km' : 'ktm-base', year: index === 1 ? '2021' : '', plate: '', realHours: 0, markerHours: 0, realKm: 0, markerKm: 0 }));
  localStorage.setItem('motoCatalogBackup', JSON.stringify({ createdAt: new Date().toISOString(), profiles: catalogProfiles }));
}
let activeBikeId = localStorage.getItem('activeBikeId') || bikeProfiles[0].id;
if (!bikeProfiles.some(profile => profile.id === activeBikeId)) activeBikeId = bikeProfiles[0].id;
function bikeStorageKey(name) { return `${name}:${activeBikeId}`; }
function saveEvents() { localStorage.setItem(bikeStorageKey('motoEvents'), JSON.stringify(events)); }

function showView(view) {
  const targetView = view === 'hoy' || view === 'dashboard' ? 'motos' : view;
  if (targetView === 'motos' && view === 'motos') sessionStorage.setItem('motoShowAll', '1');
  if ((typeof workshopOpen !== 'undefined' && workshopOpen || document.body.classList.contains('workshop-mode')) && targetView !== 'mantenimiento') return;
  if (view === 'vida' && typeof refreshMaintenanceLifeEvents === 'function') {
    try { refreshMaintenanceLifeEvents(); } catch (error) { console.error('No se pudo actualizar el Libro de vida.', error); }
  }
  if (targetView === 'componentes' && typeof syncComponentsFromEvents === 'function') {
    try { syncComponentsFromEvents(); } catch (error) { console.error('No se pudo actualizar Componentes.', error); }
  }
  if (targetView === 'componentes' && typeof renderComponents === 'function') renderComponents();
  if (targetView === 'mantenimiento') {
    if (typeof renderMaintenancePlan === 'function') renderMaintenancePlan();
    if (typeof renderMaintenanceChecklist === 'function') renderMaintenanceChecklist();
  }
  if (targetView === 'uso' && typeof renderComponentUsageChart === 'function') renderComponentUsageChart();
  pages.forEach(page => page.classList.toggle('hidden', page.id !== `view-${targetView}`));
  sessionStorage.setItem('motoLastView', targetView);
  document.querySelectorAll('.nav-item[data-view]').forEach(item => item.classList.toggle('active', item.dataset.view === targetView));
  breadcrumb.textContent = labels[targetView] || 'Mis motos';
  sidebar.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navItems.forEach(item => item.addEventListener('click', () => showView(item.dataset.view)));
document.getElementById('mobileMenu').addEventListener('click', () => sidebar.classList.toggle('open'));

const appShell = document.querySelector('.app-shell');
const sidebarToggle = document.getElementById('sidebarToggle');
const profileButton = document.querySelector('.top-actions .profile-mini');
if (profileButton) {
  profileButton.type = 'button';
  profileButton.setAttribute('aria-haspopup', 'true');
  profileButton.setAttribute('aria-expanded', 'false');
  const profileMenu = document.createElement('div');
  profileMenu.className = 'profile-menu hidden';
  profileMenu.innerHTML = '<strong>Cuenta</strong><button type="button" class="profile-logout">Cerrar sesión</button>';
  profileButton.closest('.top-actions')?.appendChild(profileMenu);
  const closeProfileMenu = () => { profileMenu.classList.add('hidden'); profileButton.setAttribute('aria-expanded', 'false'); };
  profileButton.addEventListener('click', event => { event.stopPropagation(); const open = profileMenu.classList.toggle('hidden'); profileButton.setAttribute('aria-expanded', String(!open)); });
  profileMenu.addEventListener('click', event => { if (event.target.closest('.profile-logout')) { if (/pages\.dev$/.test(window.location.hostname)) window.location.href = '/cdn-cgi/access/logout'; else closeProfileMenu(); } });
  document.addEventListener('click', event => { if (!profileMenu.contains(event.target) && event.target !== profileButton) closeProfileMenu(); });
}
function setSidebarCollapsed(collapsed, persist = true) {
  if (!appShell || !sidebarToggle) return;
  appShell.classList.toggle('sidebar-collapsed', collapsed);
  sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
  sidebarToggle.setAttribute('aria-label', collapsed ? 'Mostrar barra lateral' : 'Ocultar barra lateral');
  const label = sidebarToggle.querySelector('.sidebar-toggle-label');
  const icon = sidebarToggle.querySelector('[aria-hidden]');
  if (label) label.textContent = collapsed ? 'Mostrar' : 'Ocultar';
  if (icon) icon.textContent = collapsed ? '›' : '‹';
  if (persist) localStorage.setItem('sidebarCollapsed', collapsed ? '1' : '0');
}
setSidebarCollapsed(localStorage.getItem('sidebarCollapsed') === '1', false);
sidebarToggle?.addEventListener('click', () => setSidebarCollapsed(!appShell.classList.contains('sidebar-collapsed')));

// Ayudas breves para los controles principales. También se muestran al enfocar
// con teclado, para que la función sea clara sin añadir texto permanente.
function setActionTooltip(element, text) {
  if (!element) return;
  element.dataset.tooltip = text;
  element.setAttribute('aria-label', text);
}
document.querySelectorAll('#addEvent, #addEventDash, #addEventVida, #addEventMaint').forEach(element => setActionTooltip(element, 'Registro resumido de una salida, incidencia o trabajo realizado.'));

const modal = document.getElementById('eventModal');
let editingIndex = null;
let eventReturnView = 'vida';
let eventAttachmentDraft = [];
const attachmentAccept = 'image/*,video/*,.pdf,.doc,.docx,.txt';
function attachmentId() { return `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}
function compressImage(file) {
  if (!file.type?.startsWith('image/')) return readFileAsDataUrl(file).then(data => ({ data, type: file.type || 'application/octet-stream', size: file.size }));
  return new Promise((resolve, reject) => {
    const image = new Image();
    const source = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(source);
      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
      canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', .78);
      resolve({ data, type: 'image/jpeg', size: Math.round(data.length * .75) });
    };
    image.onerror = () => { URL.revokeObjectURL(source); reject(new Error('No se pudo cargar la imagen.')); };
    image.src = source;
  });
}
function filesToAttachments(fileList) {
  return Promise.all([...fileList].map(async file => {
    if (file.size > 15 * 1024 * 1024) { window.alert(`El archivo ${file.name} supera el límite de 15 MB.`); return null; }
    const prepared = await compressImage(file);
    return { id: attachmentId(), name: file.name, type: prepared.type, size: prepared.size, data: prepared.data };
  })).then(items => items.filter(Boolean));
}
function attachmentMarkup(attachments = [], className = 'event-attachments') {
  return `<div class="${className}">${attachments.map(file => file.type?.startsWith('image/') ? `<a class="attachment-thumbnail" href="${file.data}" target="_blank" rel="noopener" title="Abrir ${safeText(file.name)}"><img src="${file.data}" alt="${safeText(file.name)}" loading="lazy" /></a>` : `<a class="attachment-chip" href="${file.data}" download="${safeText(file.name)}" target="_blank" rel="noopener"><span>${file.type?.startsWith('video/') ? '▶' : '▤'}</span>${safeText(file.name)}</a>`).join('')}</div>`;
}
function openAttachmentViewer(link) {
  const image = link.querySelector('img');
  if (!image) return;
  const viewer = document.createElement('div');
  viewer.className = 'attachment-viewer';
  viewer.innerHTML = `<div class="attachment-viewer-card"><button type="button" class="attachment-viewer-close" aria-label="Cerrar">×</button><img src="${image.src}" alt="${image.alt}" /><small>${image.alt}</small></div>`;
  viewer.addEventListener('click', event => { if (event.target === viewer || event.target.closest('.attachment-viewer-close')) viewer.remove(); });
  document.body.appendChild(viewer);
}
document.addEventListener('click', event => { const thumbnail = event.target.closest('.attachment-thumbnail'); if (!thumbnail) return; event.preventDefault(); openAttachmentViewer(thumbnail); });
function renderEventAttachmentDraft() { const box = document.getElementById('eventAttachmentList'); if (box) box.innerHTML = attachmentMarkup(eventAttachmentDraft); }
const realReadingRow = document.createElement('div');
realReadingRow.className = 'form-row';
realReadingRow.innerHTML = '<label>Horas reales del evento<input id="eventRealHours" type="number" step="1" /><span>Se usará en el título del mantenimiento.</span></label><label>Km reales del evento<input id="eventRealKm" type="number" step="1" /><span>Uso real acumulado en ese momento.</span></label>';
document.getElementById('eventCost').closest('label').before(realReadingRow);
const maintenanceParts = document.createElement('fieldset');
maintenanceParts.className = 'maintenance-parts';
maintenanceParts.innerHTML = '<legend>Componentes intervenidos</legend><label><input type="checkbox" value="Pistón" /> Pistón</label><label><input type="checkbox" value="Segmentos" /> Segmentos</label><label><input type="checkbox" value="Cilindro" /> Cilindro</label><label><input type="checkbox" value="Biela" /> Biela</label>';
document.getElementById('eventType').closest('label').after(maintenanceParts);
const componentCatalog = ['Cadena', 'Corona', 'Piñón', 'Pastillas de freno delanteras', 'Pastillas de freno traseras', 'Líquido de frenos', 'Líquido de embrague', 'Cámara delantera', 'Cámara trasera', 'Mousse delantero', 'Mousse trasero', 'Aceite del cambio', 'Bujía', 'Líquido refrigerante', 'Fibra del escape', 'Pistón', 'Segmentos', 'Biela', 'Filtro de aire', 'Servicio de horquilla', 'Servicio de amortiguador', 'Tamiz de combustible', 'Filtro del depósito de combustible', 'Guía de cadena', 'Embrague', 'Disco de freno delantero', 'Disco de freno trasero', 'Neumático delantero', 'Neumático trasero', 'Rodamiento de rueda delantero', 'Rodamiento de rueda trasero', 'Filtro de combustible', 'Pipa de bujía', 'Cilindro', 'Caja de cambios', 'Bomba de aceite', 'Batería', 'Cojinetes de dirección', 'Cojinetes de basculante', 'Radios', 'Silencioso', 'Distribución de escape', 'Motor de arranque'];
const componentChangeField = document.createElement('fieldset');
componentChangeField.className = 'component-change-field';
componentChangeField.innerHTML = `<legend>Componentes que se van a cambiar</legend><p class="component-change-intro">Selecciona un componente y pulsa + para añadir otro al mismo cambio.</p><div id="componentChangeRows"><label class="component-primary-label">Nombre del componente<select id="eventComponent" data-component-select>${[...componentCatalog].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })).map(component => `<option value="${safeText(component)}">${safeText(component)}</option>`).join('')}<option value="__custom__">Otro componente…</option></select></label></div><button type="button" class="quiet-button add-component-row">＋ Añadir otro componente</button><div class="component-change-details"><label>Marca o referencia<input id="eventComponentReference" placeholder="Ej. KTM 54810011000" /></label><label class="custom-component-label" hidden>Nombre del componente nuevo<input id="eventComponentCustom" placeholder="Ej. KTM 54810011000" /></label></div><small class="component-change-note">Todos se guardarán con la misma fecha y lecturas.</small>`;
maintenanceParts.after(componentChangeField);
componentChangeField.querySelector('.add-component-row').addEventListener('click', () => { const first = componentChangeField.querySelector('[data-component-select]'); const clone = first.cloneNode(true); clone.removeAttribute('id'); clone.value = componentCatalog[0]; clone.dataset.componentSelect = ''; const label = document.createElement('label'); label.className = 'component-primary-label'; label.textContent = 'Otro componente'; label.appendChild(clone); document.getElementById('componentChangeRows').appendChild(label); clone.addEventListener('change', syncComponentDescription); });
const addComponentInEvent = document.createElement('button');
addComponentInEvent.type = 'button';
addComponentInEvent.className = 'quiet-button add-component-in-event';
addComponentInEvent.textContent = '＋ Añadir componente a este evento';
addComponentInEvent.title = 'Añade un componente nuevo sin salir del registro.';
componentChangeField.before(addComponentInEvent);
addComponentInEvent.addEventListener('click', () => {
  document.getElementById('eventType').value = 'Sustitución de componente';
  document.getElementById('eventComponent').value = '__custom__';
  document.getElementById('eventComponentCustom').value = '';
  toggleMaintenanceParts();
  document.getElementById('eventComponentCustom').focus();
});
const eventAttachmentField = document.createElement('div');
eventAttachmentField.className = 'attachment-field';
eventAttachmentField.innerHTML = `<strong>Archivos adjuntos</strong><div class="attachment-pickers"><label class="attachment-picker">＋ Añadir fichero<input id="eventAttachments" type="file" accept="${attachmentAccept}" multiple /></label><label class="attachment-picker">◉ Usar cámara<input id="eventCamera" type="file" accept="image/*,video/*" capture="environment" /></label></div><small>Fotos, vídeos, PDF y otros documentos. Máximo 15 MB por archivo.</small><div id="eventAttachmentList" class="event-attachments"></div>`;
document.querySelector('#eventForm .modal-actions')?.before(eventAttachmentField);
async function addEventFiles(input) {
  try {
    eventAttachmentDraft.push(...await filesToAttachments(input.files));
    renderEventAttachmentDraft();
  } catch (error) {
    console.error('No se pudo preparar el archivo del evento.', error);
    window.alert('No se ha podido cargar la foto. Prueba con otra imagen.');
  } finally { input.value = ''; }
}
document.getElementById('eventAttachments')?.addEventListener('change', event => addEventFiles(event.target));
document.getElementById('eventCamera')?.addEventListener('change', event => addEventFiles(event.target));
function toggleMaintenanceParts() {
  const type = document.getElementById('eventType').value;
  maintenanceParts.hidden = type !== 'Mantenimiento';
  componentChangeField.hidden = type !== 'Sustitución de componente';
  document.querySelector('.custom-component-label').hidden = ![...document.getElementById('eventComponent').selectedOptions].some(option => option.value === '__custom__');
}
function syncComponentDescription() {
  if (document.getElementById('eventType').value !== 'Sustitución de componente') return;
  const select = document.getElementById('eventComponent');
  const selected = [...document.querySelectorAll('#componentChangeRows [data-component-select]')].map(input => input.value).filter(value => value !== '__custom__');
  const name = selected.length ? selected.join(', ') : document.getElementById('eventComponentCustom').value.trim();
  if (!name) return;
  const description = document.getElementById('eventDescription');
  description.value = `Sustitución de ${name}`;
}
document.getElementById('eventComponent').addEventListener('change', () => { toggleMaintenanceParts(); syncComponentDescription(); });
document.getElementById('eventComponentCustom').addEventListener('input', syncComponentDescription);
document.getElementById('eventType').addEventListener('change', () => { toggleMaintenanceParts(); syncComponentDescription(); });
toggleMaintenanceParts();
function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatDate(dateValue) { return new Date(`${dateValue}T12:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', ''); }
function openModal() {
  editingIndex = null;
  eventAttachmentDraft = [];
  modal.querySelector('h2').textContent = 'Registrar evento';
  modal.querySelector('button[type="submit"]').textContent = 'Guardar evento';
  document.getElementById('eventDate').value = todayISO();
  document.getElementById('eventType').value = 'Salida';
  toggleMaintenanceParts();
  document.getElementById('eventHours').value = Number(bikeData.markerHours).toFixed(1);
  document.getElementById('eventKm').value = Math.round(Number(bikeData.markerKm));
  document.getElementById('eventRealHours').value = Math.round(Number(bikeData.realHours));
  document.getElementById('eventRealKm').value = Math.round(Number(bikeData.realKm));
  maintenanceParts.querySelectorAll('input').forEach(input => { input.checked = false; });
  document.getElementById('eventComponent').selectedIndex = 0;
  document.querySelectorAll('#componentChangeRows .component-primary-label:not(:first-child)').forEach(row => row.remove());
  document.getElementById('eventComponentReference').value = '';
  document.getElementById('eventComponentCustom').value = '';
  renderEventAttachmentDraft();
  modal.classList.remove('hidden');
  document.getElementById('eventDescription').focus();
}
function closeModal() { modal.classList.add('hidden'); }
function openDeleteConfirmation(title, onConfirm) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `<section class="modal confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="deleteDialogTitle"><h2 id="deleteDialogTitle">Eliminar evento</h2><p>¿Quieres eliminar “${safeText(title)}” del libro de vida? Esta acción también quitará su ficha de mantenimiento si la tiene.</p><div class="modal-actions"><button type="button" class="quiet-button" data-delete-cancel>Cancelar</button><button type="button" class="primary-button danger-button" data-delete-confirm>Eliminar</button></div></section>`;
  const close = () => backdrop.remove();
  backdrop.querySelector('[data-delete-cancel]').addEventListener('click', close);
  backdrop.querySelector('[data-delete-confirm]').addEventListener('click', () => { close(); onConfirm(); });
  backdrop.addEventListener('click', event => { if (event.target === backdrop) close(); });
  document.body.appendChild(backdrop);
  backdrop.querySelector('[data-delete-cancel]').focus();
}
['addEvent', 'addEventDash', 'addEventVida', 'addEventMaint'].forEach(id => document.getElementById(id)?.addEventListener('click', openModal));
const maintenanceEventButton = document.getElementById('addEventMaint');
if (maintenanceEventButton) maintenanceEventButton.innerHTML = '<span>＋</span> Registrar evento';
const addComponentButton = document.querySelector('#view-componentes .page-heading .primary-button');
if (addComponentButton) {
  addComponentButton.id = 'addComponentButton';
  addComponentButton.addEventListener('click', () => {
    openModal();
    generalEventType.value = 'Sustitución de componente';
  [...document.getElementById('eventComponent').options].forEach(option => { option.selected = false; });
    document.getElementById('eventComponentCustom').value = '';
    document.getElementById('eventDescription').value = 'Sustitución de componente';
    toggleMaintenanceParts();
    document.getElementById('eventComponentCustom').focus();
  });
}
const eventModalSubtitle = document.querySelector('#eventModal .modal-subtitle');
if (eventModalSubtitle) eventModalSubtitle.textContent = 'Añade una salida, gasto, documento o nota a la línea de vida.';
const generalEventType = document.getElementById('eventType');
generalEventType?.querySelector('option[value="Mantenimiento"]')?.remove();
generalEventType?.querySelectorAll('option').forEach(option => { if (option.textContent.trim() === 'Mantenimiento') option.remove(); });
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });

document.querySelectorAll('input[data-task]').forEach(input => {
  const saved = JSON.parse(localStorage.getItem(bikeStorageKey('motoTasks')) || '{}');
  input.checked = Boolean(saved[input.dataset.task]);
  input.addEventListener('change', () => {
    const tasks = JSON.parse(localStorage.getItem(bikeStorageKey('motoTasks')) || '{}');
    tasks[input.dataset.task] = input.checked;
    localStorage.setItem(bikeStorageKey('motoTasks'), JSON.stringify(tasks));
  });
});

document.getElementById('showAllTasks').addEventListener('click', () => showView('mantenimiento'));
const defaultEvents = [
  { type:'Mantenimiento',description:'Revisión inicial y puesta a punto',date:'14 dic 2021',dateISO:'2021-12-14',hours:'50',km:'1772',notes:'Brida de escape, protector de carbono de bufanda, protectores de encendido y embrague, matrícula, GPS, aceite de cambio, filtro del manguito de gasolina y filtro de aire GreenlandMX 154116.' },
  { type:'Mantenimiento',description:'Revisión de 80 horas',date:'25 feb 2022',dateISO:'2022-02-25',hours:'78',km:'2205',notes:'Cambio de filtro del manguito de gasolina y aceite de cambio.' },
  { type:'Mantenimiento',description:'Limpieza de manguera del sensor de presión',date:'10 may 2022',dateISO:'2022-05-10',hours:'100',km:'3253',notes:'Limpieza de la manguera del sensor de presión.' },
  { type:'Mantenimiento',description:'Revisión de 120 horas',date:'20 jun 2022',dateISO:'2022-06-20',hours:'120',km:'3517',cost:'166,15 €',notes:'Aceite Motorex Top Speed 4T 15W/50, filtro de gasolina, mousse delantero, cubierta trasera Mitas C-18, cintas de radios y cámara Tubliss Core 18.' },
  { type:'Mantenimiento',description:'Revisión de 140 horas',date:'25 sep 2022',dateISO:'2022-09-25',hours:'140',km:'4100',notes:'Filtro del manguito de gasolina y dos filtros de aire nuevos.' },
  { type:'Mantenimiento',description:'Revisión de 160 horas y pistón',date:'28 oct 2022',dateISO:'2022-10-28',hours:'160',km:'4400',notes:'Bujía, pistón A Vertex 66,34, medición de cilindro, líquido refrigerante, fibra de escape, aceite de cambio y filtro del manguito de gasolina.' },
  { type:'Mantenimiento',description:'Revisión de 180 horas',date:'03 ene 2023',dateISO:'2023-01-03',hours:'189',km:'5293',notes:'Todo OK. Filtro de gasolina, piñón 14T y corona 50T, y guía de cadena KTM.' },
  { type:'Mantenimiento',description:'Revisión de 200 horas',date:'04 feb 2023',dateISO:'2023-02-04',hours:'200',km:'5686',notes:'Revisión de 40 horas y cambio de aceite Motorex Top Speed 4T 15W/50.' },
  { type:'Mantenimiento',description:'Revisión de 220 horas',date:'09 mar 2023',dateISO:'2023-03-09',hours:'220',km:'6155',notes:'Revisión cada 20 horas, tamiz de combustible y limpieza de la manguera del sensor de presión del cárter.' },
  { type:'Mantenimiento',description:'Aceite de embrague y bufanda',date:'10 abr 2023',dateISO:'2023-04-10',hours:'230',km:'6352',notes:'Aceite de embrague DOT 4, revisión de frenos, bufanda y protector nuevos, y nivel de aceite de cambio correcto.' },
  { type:'Mantenimiento',description:'Revisión de 240 horas',date:'12 may 2023',dateISO:'2023-05-12',hours:'240',km:'6618',cost:'20 €',notes:'Tamiz de combustible y aceite de cambio Motorex Top Speed 4T 15W/50.' },
  { type:'Mantenimiento',description:'Revisión de 260 horas y trabajo mayor',date:'01 jul 2023',dateISO:'2023-07-01',hours:'260',km:'7221',cost:'962,73 €',notes:'Cuentakilómetros nuevo. El documento anota +7.240 km y +256 h. Suspensiones repasadas, pastillas de freno, filtros de combustible, líquidos de frenos y embrague, guía de cadena, muelle, revisión de pistón/cilindro, segmentos, Bendix, rodamientos, bujía, aceite, bufanda y protector.' },
  { type:'Mantenimiento',description:'Revisión de 280 horas',date:'15 nov 2023',dateISO:'2023-11-15',hours:'280',km:'X.XXX',notes:'Revisión de 20 horas, borne negativo de batería y rodamientos de rueda trasera. Kilometraje no indicado.' },
  { type:'Mantenimiento',description:'Revisión de 300 horas y cambio de marcador',date:'30 dic 2023',dateISO:'2023-12-30',hours:'300',km:'8200',notes:'El documento indica 960 km y 44 h entre paréntesis. Aceite de cambio, batería HJTZ5S-FP, microfiltro de gasolina, aceite de embrague, ajuste de maneta y plato de presión. Marcador roto y puesto a cero en horas y kilómetros.' },
  { type:'Mantenimiento',description:'Comprobación después del cambio de marcador',date:'26 ene 2024',dateISO:'2024-01-26',hours:'312',km:'8596',notes:'El documento indica 1.356 km y 56 h entre paréntesis. Comprobación de aceite de cambio y valores TPS.' },
  { type:'Mantenimiento',description:'Revisión de 320 horas y kit de arrastre',date:'22 feb 2024',dateISO:'2024-02-22',hours:'320',km:'8777',notes:'El documento indica 1.537 km y 62 h entre paréntesis. Revisión de 20 horas, nivel de aceite, fibra de escape y kit de arrastre DID 14-52.' },
  { type:'Mantenimiento',description:'Revisión de 340 horas',date:'05 abr 2024',dateISO:'2024-04-05',hours:'340',km:'9106',notes:'El documento indica 1.866 km y 80 h entre paréntesis. Bujía, aceite de cambio, discos de freno, filtro de gasolina y pastillas traseras.' },
  { type:'Mantenimiento',description:'Intervención ampliada de 372 horas',date:'17 jun 2024',dateISO:'2024-06-17',hours:'372',km:'9688',notes:'El documento indica 2.466 km y 106 h entre paréntesis. Filtros y rodamientos, dirección, basculante, suspensiones, líquidos, TPS, reglajes de horquilla y amortiguador, retén de cigüeñal, embrague, Bendix, válvula de escape y pistón C.' },
  { type:'Mantenimiento',description:'Revisión de 40 horas',date:'08 nov 2024',dateISO:'2024-11-08',hours:'146',km:'3306',notes:'El documento indica 10.527 km y 412 h entre paréntesis. Dirección y horquillas, palanca de cambios, neumático, aceite de cambio y discos de freno.' },
  { type:'Mantenimiento',description:'Revisión de 20 horas',date:'19 ene 2025',dateISO:'2025-01-19',hours:'146',km:'3900',notes:'El documento indica 11.140 km y 424 h entre paréntesis. Microfiltro, protector de basculante, radios, piñón, corona, mousse y neumático.' },
  { type:'Mantenimiento',description:'Revisión de 40 horas',date:'31 mar 2025',dateISO:'2025-03-31',hours:'186',km:'4242',notes:'El documento indica 11.482 km y 443 h entre paréntesis. Aceite de cambio, fibra, aceite de embrague, tamiz de combustible y mousse.' },
  { type:'Mantenimiento',description:'Revisión de 20 horas',date:'19 may 2025',dateISO:'2025-05-19',hours:'200',km:'4574',notes:'El documento indica 11.814 km y 456 h entre paréntesis. Microfiltro, radios y comprobación de tensión de batería.' },
  { type:'Mantenimiento',description:'Apertura de motor a 220 horas',date:'29 jun 2025',dateISO:'2025-06-29',hours:'220',km:'4849',cost:'75 €',notes:'El documento indica 12.089 km y 472 h entre paréntesis. Motor abierto: suspensiones, frenos, rodamientos, válvula de escape, bomba de gasolina, pistón/cilindro, biela, rodamientos de cigüeñal, selector, motor de arranque, cableado y juntas.' },
  { type:'Mantenimiento',description:'Revisión de 40 horas',date:'14 nov 2025',dateISO:'2025-11-14',hours:'260',km:'5574',cost:'280 €',notes:'El documento indica 12.814 km y 516 h entre paréntesis. Kit de pata de arranque, aceite de cambio, líquido refrigerante y revisión de horquillas en DMX.' },
  { type:'Mantenimiento',description:'Revisión de 20 horas',date:'26 ene 2026',dateISO:'2026-01-26',hours:'280',km:'6314',notes:'El documento indica 13.554 km y 536 h entre paréntesis. Microfiltro, radios, batería, líquido de embrague, piñón, filtro de aire, kit de transmisión y limpieza de horquillas.' },
  { type:'Mantenimiento',description:'Revisión de 40 horas',date:'13 mar 2026',dateISO:'2026-03-13',hours:'300',km:'6760',realHours:'556',realKm:'14000',notes:'Los valores entre paréntesis del documento son los reales: 556 h y 14.000 km. Aceite de cambio y microfiltro.' },
  { type:'Mantenimiento',description:'Revisión de 80 horas y cilindro',date:'26 jul 2026',dateISO:'2026-07-26',hours:'320',km:'X.XXX',realHours:'576',realKm:'X.XXX',notes:'El valor entre paréntesis es el real. Kilometraje del marcador y real no indicado con una cifra. Rodamientos de rueda, dirección, basculante, suspensiones, filtros, revisión de pistón/cilindro y envío del cilindro a BS para nicasilar.' }
];
const legacyEvents = JSON.parse(localStorage.getItem('motoEvents') || 'null');
let events = JSON.parse(localStorage.getItem(bikeStorageKey('motoEvents')) || 'null') || (activeBikeId === 'moto-1' ? (legacyEvents || defaultEvents) : []);
function isMaintenanceRecord(item) {
  return Boolean(item?.maintenanceEventId) || /^(Revisión|Apertura de motor|Intervención ampliada|Comprobación después|Aceite de embrague y bufanda|Limpieza de manguera)/i.test(String(item?.description || '').trim());
}
const migratedMaintenanceEvents = events.filter(item => item && item.type !== 'Mantenimiento' && isMaintenanceRecord(item));
if (migratedMaintenanceEvents.length) { migratedMaintenanceEvents.forEach(item => { item.type = 'Mantenimiento'; }); localStorage.setItem(bikeStorageKey('motoEvents'), JSON.stringify(events)); }
if (activeBikeId === 'moto-1' && !localStorage.getItem(bikeStorageKey('motoEvents'))) saveEvents();
const ktmComponentImport = [
  ['14/11/2025', '2025-11-14', 516, 12814, 'Motor de arranque', 'Montado Kit Pata de arranque Wallapop 100€'],
  ['14/11/2025', '2025-11-14', 516, 12814, 'Aceite del cambio', 'Cambiado Aceite Cambio'],
  ['14/11/2025', '2025-11-14', 516, 12814, 'Líquido refrigerante', 'Cambiado liquido refrigerante'],
  ['14/11/2025', '2025-11-14', 516, 12814, 'Servicio de horquilla', 'Revision horquillas en DMX 280€. Petados los retenes'],
  ['26/01/2026', '2026-01-26', 536, 13554, 'Líquido de embrague', 'Cambiado liquido embrague (purgando desde la maneta había abajo y tubo conectado al empujador)'],
  ['26/01/2026', '2026-01-26', 536, 13554, 'Piñón', 'Cambiado Piñon 12 dientes OK del anterior cambio'],
  ['13/03/2026', '2026-03-13', 556, 14000, 'Aceite del cambio', 'Cambiar Aceite Cambio'],
  ['13/03/2026', '2026-03-13', 556, 14000, 'Filtro de combustible', 'Microfiltro gasolina'],
  ['26/07/2026', '2026-07-26', 576, '', 'Rodamiento de rueda delantero', 'Cambiado rodamientos rueda delantera'],
  ['26/07/2026', '2026-07-26', 576, '', 'Neumático delantero', 'Nueva caracasa delantera Hulk boy con mouse antiguo'],
  ['26/07/2026', '2026-07-26', 576, '', 'Servicio de horquilla', 'Horquillas y amortiguador mantenimiento en DMX'],
  ['26/07/2026', '2026-07-26', 576, '', 'Servicio de amortiguador', 'Horquillas y amortiguador mantenimiento en DMX'],
  ['26/07/2026', '2026-07-26', 576, '', 'Filtro del depósito de combustible', 'Cambiado filtro gasolina deposito'],
  ['26/07/2026', '2026-07-26', 576, '', 'Cilindro', 'Mandamos Cilindro a BS para Nicasilar. Desmontamos todo menos espigas 185€+25€ +IVA'],
  ['26/07/2026', '2026-07-26', 576, '', 'Pistón', 'Comprar pistón Vertex EXC250 23630A 66,34'],
  ['26/07/2026', '2026-07-26', 576, '', 'Segmentos', 'Piston 66.36. Juego Aros = 0,57 (max 0,4). Piston OK, nuevos segmentos.'],
  ['26/07/2026', '2026-07-26', 576, '', 'Rodamiento de agujas', 'Comprar rodamiento de agujas KTM 54430034000 -> Jaula de agujas 18x22x19,8 KTM EXC 250 Athena']
];
const componentImportKey = bikeStorageKey('ktmComponentImport2026');
if (!localStorage.getItem(componentImportKey)) {
  localStorage.setItem(componentImportKey, 'pending');
  setTimeout(() => {
    if (localStorage.getItem(componentImportKey) === '1') return;
    const imported = ktmComponentImport.map(([date, dateISO, realHours, realKm, name, notes]) => ({ type: 'Sustitución de componente', description: `Sustitución de ${name}`, date: formatDate(dateISO), dateISO, hours: '', km: '', realHours, realKm, componentChange: { name, reference: '' }, componentChanges: [{ name, reference: '' }], attachments: [], cost: '', notes: `Transcripción del documento: ${notes}` }));
    const existingKeys = new Set(events.filter(item => item.type === 'Sustitución de componente').map(item => `${item.dateISO}|${item.componentChange?.name || item.componentChanges?.[0]?.name || item.description}`));
    events = [...imported.filter(item => !existingKeys.has(`${item.dateISO}|${item.componentChange.name}`)), ...events];
    saveEvents();
    localStorage.setItem(componentImportKey, '1');
    syncComponentsFromEvents();
    renderTimeline();
    updateBikeView();
  }, 2500);
}
const spreadsheetComponentImport = [{"date":"14 Dec 2021","realHours":50,"realKm":1772,"name":"Aceite del cambio","notes":"Cambiado","dateISO":"2021-12-14"},{"date":"14 Dec 2021","realHours":50,"realKm":1772,"name":"Filtro de combustible","notes":"Instalado","dateISO":"2021-12-14"},{"date":"14 Dec 2021","realHours":50,"realKm":1772,"name":"Filtro de aire","notes":"GreenlandMX 154116","dateISO":"2021-12-14"},{"date":"20 Jun 2022","realHours":120,"realKm":3517,"name":"Aceite del cambio","notes":"Motorex Top Speed 4T 15W/50","dateISO":"2022-06-20"},{"date":"20 Jun 2022","realHours":120,"realKm":3517,"name":"Filtro de combustible","notes":"Cambiado","dateISO":"2022-06-20"},{"date":"20 Jun 2022","realHours":120,"realKm":3517,"name":"Mousse delantero","notes":"Risemousse","dateISO":"2022-06-20"},{"date":"20 Jun 2022","realHours":120,"realKm":3517,"name":"Neumático trasero","notes":"Mitas C-18","dateISO":"2022-06-20"},{"date":"25 Sep 2022","realHours":140,"realKm":4100,"name":"Filtro de aire","notes":"Dos filtros nuevos","dateISO":"2022-09-25"},{"date":"28 Oct 2022","realHours":160,"realKm":4400,"name":"Filtro de combustible","notes":"Cambiado","dateISO":"2022-10-28"},{"date":"28 Oct 2022","realHours":160,"realKm":4400,"name":"Bujía","notes":"Nueva NGK BR7 ES","dateISO":"2022-10-28"},{"date":"28 Oct 2022","realHours":160,"realKm":4400,"name":"Pistón","notes":"Pistón A Vertex 66,34","dateISO":"2022-10-28"},{"date":"28 Oct 2022","realHours":160,"realKm":4400,"name":"Segmentos","notes":"Nuevos","dateISO":"2022-10-28"},{"date":"28 Oct 2022","realHours":160,"realKm":4400,"name":"Líquido refrigerante","notes":"Cambiado","dateISO":"2022-10-28"},{"date":"28 Oct 2022","realHours":160,"realKm":4400,"name":"Fibra del escape","notes":"Cambiada","dateISO":"2022-10-28"},{"date":"28 Oct 2022","realHours":160,"realKm":4400,"name":"Aceite del cambio","notes":"Motorex Top Speed 4T 15W/50","dateISO":"2022-10-28"},{"date":"03 Jan 2023","realHours":189,"realKm":5293,"name":"Filtro de combustible","notes":"Cambiado","dateISO":"2023-01-03"},{"date":"03 Jan 2023","realHours":189,"realKm":5293,"name":"Piñón","notes":"14T","dateISO":"2023-01-03"},{"date":"03 Jan 2023","realHours":189,"realKm":5293,"name":"Corona","notes":"50T","dateISO":"2023-01-03"},{"date":"03 Jan 2023","realHours":189,"realKm":5293,"name":"Guía de cadena","notes":"KTM","dateISO":"2023-01-03"},{"date":"10 Apr 2023","realHours":230,"realKm":6352,"name":"Aceite del cambio","notes":"Castrol DOT 4","dateISO":"2023-04-10"},{"date":"01 Jul 2023","realHours":256,"realKm":7240,"name":"Pastillas de freno delanteras","notes":"Brembo 07BB04SD","dateISO":"2023-07-01"},{"date":"01 Jul 2023","realHours":256,"realKm":7240,"name":"Pastillas de freno traseras","notes":"Brembo 07BB27SD","dateISO":"2023-07-01"},{"date":"01 Jul 2023","realHours":256,"realKm":7240,"name":"Filtro del depósito de combustible","notes":"Kit 81207090200","dateISO":"2023-07-01"},{"date":"01 Jul 2023","realHours":256,"realKm":7240,"name":"Filtro de combustible","notes":"Cambiado","dateISO":"2023-07-01"},{"date":"01 Jul 2023","realHours":256,"realKm":7240,"name":"Líquido de frenos","notes":"Cambiado","dateISO":"2023-07-01"},{"date":"01 Jul 2023","realHours":256,"realKm":7240,"name":"Aceite del cambio","notes":"Cambiado","dateISO":"2023-07-01"},{"date":"01 Jul 2023","realHours":256,"realKm":7240,"name":"Guía de cadena","notes":"TMD FE2 RCG-KT3-BL2","dateISO":"2023-07-01"},{"date":"01 Jul 2023","realHours":256,"realKm":7240,"name":"Segmentos","notes":"Nuevos 55910006640N8","dateISO":"2023-07-01"},{"date":"01 Jul 2023","realHours":256,"realKm":7240,"name":"Bujía","notes":"Nueva NGK BR7 ES","dateISO":"2023-07-01"},{"date":"01 Jul 2023","realHours":256,"realKm":7240,"name":"Aceite del cambio","notes":"Motorex Top Speed 4T 15W/50","dateISO":"2023-07-01"},{"date":"15 Nov 2023","realHours":280,"realKm":7600,"name":"Rodamiento de rueda trasero","notes":"Ref. 0625060058; kilometraje no indicado","dateISO":"2023-11-15"},{"date":"30 Dec 2023","realHours":300,"realKm":8200,"name":"Aceite del cambio","notes":"Valores entre paréntesis","dateISO":"2023-12-30"},{"date":"30 Dec 2023","realHours":300,"realKm":8200,"name":"Batería","notes":"HJTZ5S-FP","dateISO":"2023-12-30"},{"date":"30 Dec 2023","realHours":300,"realKm":8200,"name":"Filtro de combustible","notes":"Nuevo","dateISO":"2023-12-30"},{"date":"30 Dec 2023","realHours":300,"realKm":8200,"name":"Aceite del cambio","notes":"Cambiado","dateISO":"2023-12-30"},{"date":"30 Dec 2023","realHours":300,"realKm":8200,"name":"Plato de presión del embrague posicion 1","notes":"Posición I","dateISO":"2023-12-30"},{"date":"22 Feb 2024","realHours":320,"realKm":8777,"name":"Fibra del escape","notes":"Cambiada","dateISO":"2024-02-22"},{"date":"22 Feb 2024","realHours":320,"realKm":8777,"name":"Cadena","notes":"Kit DID 14-52","dateISO":"2024-02-22"},{"date":"22 Feb 2024","realHours":320,"realKm":8777,"name":"Piñón","notes":"14T","dateISO":"2024-02-22"},{"date":"22 Feb 2024","realHours":320,"realKm":8777,"name":"Corona","notes":"52T","dateISO":"2024-02-22"},{"date":"05 Apr 2024","realHours":340,"realKm":9106,"name":"Bujía","notes":"Nueva NGK BR7 ES","dateISO":"2024-04-05"},{"date":"05 Apr 2024","realHours":340,"realKm":9106,"name":"Aceite del cambio","notes":"Motorex","dateISO":"2024-04-05"},{"date":"05 Apr 2024","realHours":340,"realKm":9106,"name":"Filtro de combustible","notes":"Cambiado","dateISO":"2024-04-05"},{"date":"05 Apr 2024","realHours":340,"realKm":9106,"name":"Pastillas de freno traseras","notes":"Cambiadas","dateISO":"2024-04-05"},{"date":"17 Jun 2024","realHours":372,"realKm":9688,"name":"Filtro del depósito de combustible","notes":"Mahle KL97","dateISO":"2024-06-17"},{"date":"17 Jun 2024","realHours":372,"realKm":9688,"name":"Rodamiento de rueda delantero","notes":"Cambiados","dateISO":"2024-06-17"},{"date":"17 Jun 2024","realHours":372,"realKm":9688,"name":"Rodamiento de rueda delantero","notes":"Cambiados","dateISO":"2024-06-17"},{"date":"17 Jun 2024","realHours":372,"realKm":9688,"name":"Barra de horquilla derecha","notes":"Sustituida","dateISO":"2024-06-17"},{"date":"17 Jun 2024","realHours":372,"realKm":9688,"name":"Líquido de frenos","notes":"Cambiado","dateISO":"2024-06-17"},{"date":"17 Jun 2024","realHours":372,"realKm":9688,"name":"Aceite del cambio","notes":"Cambiado","dateISO":"2024-06-17"},{"date":"17 Jun 2024","realHours":372,"realKm":9688,"name":"Retén del cigüeñal","notes":"Cambiado","dateISO":"2024-06-17"},{"date":"17 Jun 2024","realHours":372,"realKm":9688,"name":"Silent blocks del embrague","notes":"6 unidades","dateISO":"2024-06-17"},{"date":"17 Jun 2024","realHours":372,"realKm":9688,"name":"Pistón","notes":"Pistón C 23630C","dateISO":"2024-06-17"},{"date":"17 Jun 2024","realHours":372,"realKm":9688,"name":"Segmentos","notes":"Nuevos","dateISO":"2024-06-17"},{"date":"17 Jun 2024","realHours":372,"realKm":9688,"name":"Aceite del cambio","notes":"Motorex","dateISO":"2024-06-17"},{"date":"17 Jun 2024","realHours":372,"realKm":9688,"name":"Casquillo del motor de arranque","notes":"Cambiado","dateISO":"2024-06-17"},{"date":"17 Jun 2024","realHours":372,"realKm":9688,"name":"Junta de tapa del estátor","notes":"Nueva","dateISO":"2024-06-17"},{"date":"17 Jun 2024","realHours":372,"realKm":9688,"name":"Protectores de horquilla","notes":"Sustituidos","dateISO":"2024-06-17"},{"date":"17 Jun 2024","realHours":372,"realKm":9688,"name":"Protector de encendido","notes":"Nuevo","dateISO":"2024-06-17"},{"date":"08 Nov 2024","realHours":412,"realKm":10527,"name":"Palanca de cambios","notes":"Cambiada","dateISO":"2024-11-08"},{"date":"08 Nov 2024","realHours":412,"realKm":10527,"name":"Neumático delantero","notes":"Geomax EN91 EX","dateISO":"2024-11-08"},{"date":"08 Nov 2024","realHours":412,"realKm":10527,"name":"Mousse delantero","notes":"TAC","dateISO":"2024-11-08"},{"date":"08 Nov 2024","realHours":412,"realKm":10527,"name":"Aceite del cambio","notes":"Motorex 15W/50","dateISO":"2024-11-08"},{"date":"08 Nov 2024","realHours":412,"realKm":10527,"name":"Disco de freno delantero","notes":"Cambiado","dateISO":"2024-11-08"},{"date":"08 Nov 2024","realHours":412,"realKm":10527,"name":"Disco de freno trasero","notes":"Cambiado","dateISO":"2024-11-08"},{"date":"19 Jan 2025","realHours":424,"realKm":11140,"name":"Filtro de combustible","notes":"Cambiado","dateISO":"2025-01-19"},{"date":"19 Jan 2025","realHours":424,"realKm":11140,"name":"Piñón","notes":"Nuevo","dateISO":"2025-01-19"},{"date":"19 Jan 2025","realHours":424,"realKm":11140,"name":"Corona","notes":"Nueva","dateISO":"2025-01-19"},{"date":"19 Jan 2025","realHours":424,"realKm":11140,"name":"Mousse delantero","notes":"X-Grip Hulk boy / EV-2 Soft","dateISO":"2025-01-19"},{"date":"19 Jan 2025","realHours":424,"realKm":11140,"name":"Neumático trasero","notes":"Dunlop Geomax EN91 EX","dateISO":"2025-01-19"},{"date":"31 Mar 2025","realHours":443,"realKm":11482,"name":"Aceite del cambio","notes":"Cambiado","dateISO":"2025-03-31"},{"date":"31 Mar 2025","realHours":443,"realKm":11482,"name":"Fibra del escape","notes":"Cambiada","dateISO":"2025-03-31"},{"date":"31 Mar 2025","realHours":443,"realKm":11482,"name":"Aceite del cambio","notes":"Cambiado","dateISO":"2025-03-31"},{"date":"31 Mar 2025","realHours":443,"realKm":11482,"name":"Filtro de combustible","notes":"Cambiado","dateISO":"2025-03-31"},{"date":"31 Mar 2025","realHours":443,"realKm":11482,"name":"Mousse trasero","notes":"Risemousse / Plews Extreme B","dateISO":"2025-03-31"},{"date":"29 Jun 2025","realHours":472,"realKm":12089,"name":"Servicio de horquilla","notes":"Data Racing","dateISO":"2025-06-29"},{"date":"29 Jun 2025","realHours":472,"realKm":12089,"name":"Servicio de amortiguador","notes":"Data Racing","dateISO":"2025-06-29"},{"date":"29 Jun 2025","realHours":472,"realKm":12089,"name":"Pastillas de freno delanteras","notes":"Brembo","dateISO":"2025-06-29"},{"date":"29 Jun 2025","realHours":472,"realKm":12089,"name":"Pastillas de freno traseras","notes":"Brembo","dateISO":"2025-06-29"},{"date":"29 Jun 2025","realHours":472,"realKm":12089,"name":"Filtro de combustible","notes":"Cambiado","dateISO":"2025-06-29"},{"date":"29 Jun 2025","realHours":472,"realKm":12089,"name":"Junta tórica de la bomba","notes":"Nueva","dateISO":"2025-06-29"},{"date":"29 Jun 2025","realHours":472,"realKm":12089,"name":"Segmentos","notes":"Nuevos","dateISO":"2025-06-29"},{"date":"29 Jun 2025","realHours":472,"realKm":12089,"name":"Rodamientos del cigüeñal","notes":"Cambiados","dateISO":"2025-06-29"},{"date":"29 Jun 2025","realHours":472,"realKm":12089,"name":"Biela","notes":"Cambiada","dateISO":"2025-06-29"},{"date":"29 Jun 2025","realHours":472,"realKm":12089,"name":"Selector","notes":"Cambiado","dateISO":"2025-06-29"},{"date":"29 Jun 2025","realHours":472,"realKm":12089,"name":"Escobillas del motor de arranque","notes":"Nuevas","dateISO":"2025-06-29"},{"date":"29 Jun 2025","realHours":472,"realKm":12089,"name":"Casquillo del motor de arranque","notes":"Instalado","dateISO":"2025-06-29"},{"date":"14 Nov 2025","realHours":516,"realKm":12814,"name":"Kit de arranque a patada","notes":"Montado","dateISO":"2025-11-14"},{"date":"14 Nov 2025","realHours":516,"realKm":12814,"name":"Aceite del cambio","notes":"Cambiado","dateISO":"2025-11-14"},{"date":"14 Nov 2025","realHours":516,"realKm":12814,"name":"Líquido refrigerante","notes":"Cambiado","dateISO":"2025-11-14"},{"date":"14 Nov 2025","realHours":516,"realKm":12814,"name":"Servicio de horquilla","notes":"DMX","dateISO":"2025-11-14"},{"date":"26 Jan 2026","realHours":536,"realKm":13554,"name":"Aceite del cambio","notes":"Cambiado","dateISO":"2026-01-26"},{"date":"26 Jan 2026","realHours":536,"realKm":13554,"name":"Piñón","notes":"12 dientes","dateISO":"2026-01-26"},{"date":"13 Mar 2026","realHours":556,"realKm":14000,"name":"Aceite del cambio","notes":"Cambiado","dateISO":"2026-03-13"},{"date":"13 Mar 2026","realHours":556,"realKm":14000,"name":"Filtro de combustible","notes":"Cambiado","dateISO":"2026-03-13"},{"date":"26 Jul 2026","realHours":576,"realKm":14000,"name":"Rodamiento de rueda delantero","notes":"Cambiados","dateISO":"2026-07-26"},{"date":"26 Jul 2026","realHours":576,"realKm":14000,"name":"Neumático delantero","notes":"Plews Tough One Spec B","dateISO":"2026-07-26"},{"date":"26 Jul 2026","realHours":576,"realKm":14000,"name":"Servicio de horquilla","notes":"DMX","dateISO":"2026-07-26"},{"date":"26 Jul 2026","realHours":576,"realKm":14000,"name":"Servicio de amortiguador","notes":"DMX","dateISO":"2026-07-26"},{"date":"26 Jul 2026","realHours":576,"realKm":14000,"name":"Filtro del depósito de combustible","notes":"Mahle KL97","dateISO":"2026-07-26"},{"date":"26 Jul 2026","realHours":576,"realKm":14000,"name":"Pistón","notes":"Previsto tras nicasilado; confirmar instalación","dateISO":"2026-07-26"},{"date":"26 Jul 2026","realHours":576,"realKm":14000,"name":"Cilindro","notes":"Nicasilado; confirmar finalización","dateISO":"2026-07-26"},{"date":"26 Jul 2026","realHours":576,"realKm":14000,"name":"Rodamiento de agujas","notes":"Previsto; confirmar instalación","dateISO":"2026-07-26"}];
const correctedComponentImport = [{"dateISO":"2021-12-14","date":"14/12/2021","markerHours":50,"markerKm":1772,"realHours":50,"realKm":1772,"name":"Brida de escape","notes":"Instalada"},{"dateISO":"2021-12-14","date":"14/12/2021","markerHours":50,"markerKm":1772,"realHours":50,"realKm":1772,"name":"Fibra del escape","notes":"Protector de carbono instalado"},{"dateISO":"2021-12-14","date":"14/12/2021","markerHours":50,"markerKm":1772,"realHours":50,"realKm":1772,"name":"Protectores de encendido y embrague","notes":"Instalados"},{"dateISO":"2021-12-14","date":"14/12/2021","markerHours":50,"markerKm":1772,"realHours":50,"realKm":1772,"name":"Aceite del cambio","notes":"Cambiado"},{"dateISO":"2021-12-14","date":"14/12/2021","markerHours":50,"markerKm":1772,"realHours":50,"realKm":1772,"name":"Filtro de combustible","notes":"Instalado"},{"dateISO":"2021-12-14","date":"14/12/2021","markerHours":50,"markerKm":1772,"realHours":50,"realKm":1772,"name":"Filtro de aire","notes":"GreenlandMX 154116"},{"dateISO":"2022-06-20","date":"20/06/2022","markerHours":120,"markerKm":3517,"realHours":120,"realKm":3517,"name":"Aceite del cambio","notes":"Motorex Top Speed 4T 15W/50"},{"dateISO":"2022-06-20","date":"20/06/2022","markerHours":120,"markerKm":3517,"realHours":120,"realKm":3517,"name":"Filtro de combustible","notes":"Cambiado"},{"dateISO":"2022-06-20","date":"20/06/2022","markerHours":120,"markerKm":3517,"realHours":120,"realKm":3517,"name":"Mousse delantero","notes":"Risemousse"},{"dateISO":"2022-06-20","date":"20/06/2022","markerHours":120,"markerKm":3517,"realHours":120,"realKm":3517,"name":"Neumático trasero","notes":"Mitas C-18"},{"dateISO":"2022-06-20","date":"20/06/2022","markerHours":120,"markerKm":3517,"realHours":120,"realKm":3517,"name":"Cámara trasera","notes":"Tubliss Core 18"},{"dateISO":"2022-09-25","date":"25/09/2022","markerHours":140,"markerKm":4100,"realHours":140,"realKm":4100,"name":"Filtro de aire","notes":"Dos filtros nuevos"},{"dateISO":"2022-10-28","date":"28/10/2022","markerHours":160,"markerKm":4400,"realHours":160,"realKm":4400,"name":"Filtro de combustible","notes":"Cambiado"},{"dateISO":"2022-10-28","date":"28/10/2022","markerHours":160,"markerKm":4400,"realHours":160,"realKm":4400,"name":"Bujía","notes":"Nueva NGK BR7 ES"},{"dateISO":"2022-10-28","date":"28/10/2022","markerHours":160,"markerKm":4400,"realHours":160,"realKm":4400,"name":"Pistón","notes":"Pistón A Vertex 66,34"},{"dateISO":"2022-10-28","date":"28/10/2022","markerHours":160,"markerKm":4400,"realHours":160,"realKm":4400,"name":"Segmentos","notes":"Nuevos"},{"dateISO":"2022-10-28","date":"28/10/2022","markerHours":160,"markerKm":4400,"realHours":160,"realKm":4400,"name":"Líquido refrigerante","notes":"Cambiado"},{"dateISO":"2022-10-28","date":"28/10/2022","markerHours":160,"markerKm":4400,"realHours":160,"realKm":4400,"name":"Fibra de escape","notes":"Cambiada"},{"dateISO":"2022-10-28","date":"28/10/2022","markerHours":160,"markerKm":4400,"realHours":160,"realKm":4400,"name":"Aceite del cambio","notes":"Motorex Top Speed 4T 15W/50"},{"dateISO":"2023-01-03","date":"03/01/2023","markerHours":189,"markerKm":5293,"realHours":189,"realKm":5293,"name":"Filtro de combustible","notes":"Cambiado"},{"dateISO":"2023-01-03","date":"03/01/2023","markerHours":189,"markerKm":5293,"realHours":189,"realKm":5293,"name":"Piñón","notes":"14T"},{"dateISO":"2023-01-03","date":"03/01/2023","markerHours":189,"markerKm":5293,"realHours":189,"realKm":5293,"name":"Corona","notes":"50T"},{"dateISO":"2023-01-03","date":"03/01/2023","markerHours":189,"markerKm":5293,"realHours":189,"realKm":5293,"name":"Guía de cadena","notes":"KTM"},{"dateISO":"2023-04-10","date":"10/04/2023","markerHours":230,"markerKm":6352,"realHours":230,"realKm":6352,"name":"Aceite de embrague","notes":"Castrol DOT 4"},{"dateISO":"2023-04-10","date":"10/04/2023","markerHours":230,"markerKm":6352,"realHours":230,"realKm":6352,"name":"Fibra del escape","notes":"Nueva"},{"dateISO":"2023-04-10","date":"10/04/2023","markerHours":230,"markerKm":6352,"realHours":230,"realKm":6352,"name":"Fibra del escape","notes":"Nuevo"},{"dateISO":"2023-07-01","date":"01/07/2023","markerHours":260,"markerKm":7221,"realHours":256,"realKm":7240,"name":"Cuentakilómetros","notes":"Nuevo; valores reales entre paréntesis"},{"dateISO":"2023-07-01","date":"01/07/2023","markerHours":260,"markerKm":7221,"realHours":256,"realKm":7240,"name":"Protección del cuentakilómetros","notes":"NiceCNC"},{"dateISO":"2023-07-01","date":"01/07/2023","markerHours":260,"markerKm":7221,"realHours":256,"realKm":7240,"name":"Maneta de freno","notes":"NiceCNC corta"},{"dateISO":"2023-07-01","date":"01/07/2023","markerHours":260,"markerKm":7221,"realHours":256,"realKm":7240,"name":"Pastillas de freno delanteras","notes":"Brembo 07BB04SD"},{"dateISO":"2023-07-01","date":"01/07/2023","markerHours":260,"markerKm":7221,"realHours":256,"realKm":7240,"name":"Pastillas de freno traseras","notes":"Brembo 07BB27SD"},{"dateISO":"2023-07-01","date":"01/07/2023","markerHours":260,"markerKm":7221,"realHours":256,"realKm":7240,"name":"Filtro del depósito de combustible","notes":"Kit 81207090200"},{"dateISO":"2023-07-01","date":"01/07/2023","markerHours":260,"markerKm":7221,"realHours":256,"realKm":7240,"name":"Tamiz de combustible","notes":"Cambiado"},{"dateISO":"2023-07-01","date":"01/07/2023","markerHours":260,"markerKm":7221,"realHours":256,"realKm":7240,"name":"Líquido de frenos","notes":"Cambiado"},{"dateISO":"2023-07-01","date":"01/07/2023","markerHours":260,"markerKm":7221,"realHours":256,"realKm":7240,"name":"Líquido de embrague","notes":"Cambiado"},{"dateISO":"2023-07-01","date":"01/07/2023","markerHours":260,"markerKm":7221,"realHours":256,"realKm":7240,"name":"Guía de cadena","notes":"TMD FE2 RCG-KT3-BL2"},{"dateISO":"2023-07-01","date":"01/07/2023","markerHours":260,"markerKm":7221,"realHours":256,"realKm":7240,"name":"Segmentos","notes":"Nuevos 55910006640N8"},{"dateISO":"2023-07-01","date":"01/07/2023","markerHours":260,"markerKm":7221,"realHours":256,"realKm":7240,"name":"Bujía","notes":"Nueva NGK BR7 ES"},{"dateISO":"2023-07-01","date":"01/07/2023","markerHours":260,"markerKm":7221,"realHours":256,"realKm":7240,"name":"Aceite del cambio","notes":"Motorex Top Speed 4T 15W/50"},{"dateISO":"2023-07-01","date":"01/07/2023","markerHours":260,"markerKm":7221,"realHours":256,"realKm":7240,"name":"Fibra del escape","notes":"Reparada"},{"dateISO":"2023-07-01","date":"01/07/2023","markerHours":260,"markerKm":7221,"realHours":256,"realKm":7240,"name":"Fibra del escape","notes":"Artefon"},{"dateISO":"2023-11-15","date":"15/11/2023","markerHours":280,"markerKm":null,"realHours":280,"realKm":null,"name":"Rodamiento de rueda trasera","notes":"Ref. 0625060058; kilometraje no indicado"},{"dateISO":"2023-11-15","date":"15/11/2023","markerHours":280,"markerKm":null,"realHours":280,"realKm":null,"name":"Retén de rueda trasero","notes":"Ref. 0760324771"},{"dateISO":"2023-11-15","date":"15/11/2023","markerHours":280,"markerKm":null,"realHours":280,"realKm":null,"name":"Casquillo separador de rueda trasera","notes":"Ref. 77710015000"},{"dateISO":"2023-12-30","date":"30/12/2023","markerHours":300,"markerKm":8200,"realHours":44,"realKm":960,"name":"Aceite del cambio","notes":"Valores entre paréntesis"},{"dateISO":"2023-12-30","date":"30/12/2023","markerHours":300,"markerKm":8200,"realHours":44,"realKm":960,"name":"Batería","notes":"HJTZ5S-FP"},{"dateISO":"2023-12-30","date":"30/12/2023","markerHours":300,"markerKm":8200,"realHours":44,"realKm":960,"name":"Filtro de combustible","notes":"Nuevo"},{"dateISO":"2023-12-30","date":"30/12/2023","markerHours":300,"markerKm":8200,"realHours":44,"realKm":960,"name":"Aceite de embrague","notes":"Cambiado"},{"dateISO":"2023-12-30","date":"30/12/2023","markerHours":300,"markerKm":8200,"realHours":44,"realKm":960,"name":"Plato de presión del embrague","notes":"Posición I"},{"dateISO":"2024-02-22","date":"22/02/2024","markerHours":320,"markerKm":8777,"realHours":62,"realKm":1537,"name":"Fibra de escape","notes":"Cambiada"},{"dateISO":"2024-02-22","date":"22/02/2024","markerHours":320,"markerKm":8777,"realHours":62,"realKm":1537,"name":"Cadena","notes":"Kit DID 14-52"},{"dateISO":"2024-02-22","date":"22/02/2024","markerHours":320,"markerKm":8777,"realHours":62,"realKm":1537,"name":"Piñón","notes":"14T"},{"dateISO":"2024-02-22","date":"22/02/2024","markerHours":320,"markerKm":8777,"realHours":62,"realKm":1537,"name":"Corona","notes":"52T"},{"dateISO":"2024-04-05","date":"05/04/2024","markerHours":340,"markerKm":9106,"realHours":80,"realKm":1866,"name":"Bujía","notes":"Nueva NGK BR7 ES"},{"dateISO":"2024-04-05","date":"05/04/2024","markerHours":340,"markerKm":9106,"realHours":80,"realKm":1866,"name":"Aceite del cambio","notes":"Motorex"},{"dateISO":"2024-04-05","date":"05/04/2024","markerHours":340,"markerKm":9106,"realHours":80,"realKm":1866,"name":"Filtro de combustible","notes":"Cambiado"},{"dateISO":"2024-04-05","date":"05/04/2024","markerHours":340,"markerKm":9106,"realHours":80,"realKm":1866,"name":"Pastillas de freno traseras","notes":"Cambiadas"},{"dateISO":"2024-06-17","date":"17/06/2024","markerHours":372,"markerKm":9688,"realHours":106,"realKm":2466,"name":"Filtro del depósito de combustible","notes":"Mahle KL97"},{"dateISO":"2024-06-17","date":"17/06/2024","markerHours":372,"markerKm":9688,"realHours":106,"realKm":2466,"name":"Rodamiento de rueda delantero","notes":"Cambiados"},{"dateISO":"2024-06-17","date":"17/06/2024","markerHours":372,"markerKm":9688,"realHours":106,"realKm":2466,"name":"Retén de rueda delantero","notes":"Cambiados"},{"dateISO":"2024-06-17","date":"17/06/2024","markerHours":372,"markerKm":9688,"realHours":106,"realKm":2466,"name":"Barra de horquilla derecha","notes":"Sustituida"},{"dateISO":"2024-06-17","date":"17/06/2024","markerHours":372,"markerKm":9688,"realHours":106,"realKm":2466,"name":"Líquido de frenos","notes":"Cambiado"},{"dateISO":"2024-06-17","date":"17/06/2024","markerHours":372,"markerKm":9688,"realHours":106,"realKm":2466,"name":"Líquido de embrague","notes":"Cambiado"},{"dateISO":"2024-06-17","date":"17/06/2024","markerHours":372,"markerKm":9688,"realHours":106,"realKm":2466,"name":"Retén del cigüeñal","notes":"Cambiado"},{"dateISO":"2024-06-17","date":"17/06/2024","markerHours":372,"markerKm":9688,"realHours":106,"realKm":2466,"name":"Silent blocks del embrague","notes":"6 unidades"},{"dateISO":"2024-06-17","date":"17/06/2024","markerHours":372,"markerKm":9688,"realHours":106,"realKm":2466,"name":"Pistón","notes":"Pistón C 23630C"},{"dateISO":"2024-06-17","date":"17/06/2024","markerHours":372,"markerKm":9688,"realHours":106,"realKm":2466,"name":"Segmentos","notes":"Nuevos"},{"dateISO":"2024-06-17","date":"17/06/2024","markerHours":372,"markerKm":9688,"realHours":106,"realKm":2466,"name":"Aceite del cambio","notes":"Motorex"},{"dateISO":"2024-06-17","date":"17/06/2024","markerHours":372,"markerKm":9688,"realHours":106,"realKm":2466,"name":"Casquillo del motor de arranque","notes":"Cambiado"},{"dateISO":"2024-06-17","date":"17/06/2024","markerHours":372,"markerKm":9688,"realHours":106,"realKm":2466,"name":"Junta de tapa del estátor","notes":"Nueva"},{"dateISO":"2024-06-17","date":"17/06/2024","markerHours":372,"markerKm":9688,"realHours":106,"realKm":2466,"name":"Protectores de horquilla","notes":"Sustituidos"},{"dateISO":"2024-06-17","date":"17/06/2024","markerHours":372,"markerKm":9688,"realHours":106,"realKm":2466,"name":"Protector de encendido","notes":"Nuevo"},{"dateISO":"2024-11-08","date":"08/11/2024","markerHours":146,"markerKm":3306,"realHours":412,"realKm":10527,"name":"Palanca de cambios","notes":"Cambiada"},{"dateISO":"2024-11-08","date":"08/11/2024","markerHours":146,"markerKm":3306,"realHours":412,"realKm":10527,"name":"Neumático delantero","notes":"Geomax EN91 EX"},{"dateISO":"2024-11-08","date":"08/11/2024","markerHours":146,"markerKm":3306,"realHours":412,"realKm":10527,"name":"Mousse delantero","notes":"TAC"},{"dateISO":"2024-11-08","date":"08/11/2024","markerHours":146,"markerKm":3306,"realHours":412,"realKm":10527,"name":"Aceite del cambio","notes":"Motorex 15W/50"},{"dateISO":"2024-11-08","date":"08/11/2024","markerHours":146,"markerKm":3306,"realHours":412,"realKm":10527,"name":"Disco de freno delantero","notes":"Cambiado"},{"dateISO":"2024-11-08","date":"08/11/2024","markerHours":146,"markerKm":3306,"realHours":412,"realKm":10527,"name":"Disco de freno trasero","notes":"Cambiado"},{"dateISO":"2025-01-19","date":"19/01/2025","markerHours":146,"markerKm":3900,"realHours":424,"realKm":11140,"name":"Filtro de combustible","notes":"Cambiado"},{"dateISO":"2025-01-19","date":"19/01/2025","markerHours":146,"markerKm":3900,"realHours":424,"realKm":11140,"name":"Piñón","notes":"Nuevo"},{"dateISO":"2025-01-19","date":"19/01/2025","markerHours":146,"markerKm":3900,"realHours":424,"realKm":11140,"name":"Corona","notes":"Nueva"},{"dateISO":"2025-01-19","date":"19/01/2025","markerHours":146,"markerKm":3900,"realHours":424,"realKm":11140,"name":"Mousse delantero","notes":"X-Grip Hulk boy / EV-2 Soft"},{"dateISO":"2025-01-19","date":"19/01/2025","markerHours":146,"markerKm":3900,"realHours":424,"realKm":11140,"name":"Neumático delantero","notes":"Dunlop Geomax EN91 EX"},{"dateISO":"2025-03-31","date":"31/03/2025","markerHours":186,"markerKm":4242,"realHours":443,"realKm":11482,"name":"Aceite del cambio","notes":"Cambiado"},{"dateISO":"2025-03-31","date":"31/03/2025","markerHours":186,"markerKm":4242,"realHours":443,"realKm":11482,"name":"Fibra de escape","notes":"Cambiada"},{"dateISO":"2025-03-31","date":"31/03/2025","markerHours":186,"markerKm":4242,"realHours":443,"realKm":11482,"name":"Aceite de embrague","notes":"Cambiado"},{"dateISO":"2025-03-31","date":"31/03/2025","markerHours":186,"markerKm":4242,"realHours":443,"realKm":11482,"name":"Tamiz de combustible","notes":"Cambiado"},{"dateISO":"2025-03-31","date":"31/03/2025","markerHours":186,"markerKm":4242,"realHours":443,"realKm":11482,"name":"Mousse delantero","notes":"Risemousse / Plews Extreme B"},{"dateISO":"2025-06-29","date":"29/06/2025","markerHours":220,"markerKm":4849,"realHours":472,"realKm":12089,"name":"Servicio de horquilla","notes":"Data Racing"},{"dateISO":"2025-06-29","date":"29/06/2025","markerHours":220,"markerKm":4849,"realHours":472,"realKm":12089,"name":"Pastillas de freno delanteras","notes":"Brembo"},{"dateISO":"2025-06-29","date":"29/06/2025","markerHours":220,"markerKm":4849,"realHours":472,"realKm":12089,"name":"Pastillas de freno traseras","notes":"Brembo"},{"dateISO":"2025-06-29","date":"29/06/2025","markerHours":220,"markerKm":4849,"realHours":472,"realKm":12089,"name":"Filtro de combustible","notes":"Cambiado"},{"dateISO":"2025-06-29","date":"29/06/2025","markerHours":220,"markerKm":4849,"realHours":472,"realKm":12089,"name":"Junta tórica de la bomba","notes":"Nueva"},{"dateISO":"2025-06-29","date":"29/06/2025","markerHours":220,"markerKm":4849,"realHours":472,"realKm":12089,"name":"Segmentos","notes":"Nuevos"},{"dateISO":"2025-06-29","date":"29/06/2025","markerHours":220,"markerKm":4849,"realHours":472,"realKm":12089,"name":"Rodamientos del cigüeñal","notes":"Cambiados"},{"dateISO":"2025-06-29","date":"29/06/2025","markerHours":220,"markerKm":4849,"realHours":472,"realKm":12089,"name":"Biela","notes":"Cambiada"},{"dateISO":"2025-06-29","date":"29/06/2025","markerHours":220,"markerKm":4849,"realHours":472,"realKm":12089,"name":"Selector","notes":"Cambiado"},{"dateISO":"2025-06-29","date":"29/06/2025","markerHours":220,"markerKm":4849,"realHours":472,"realKm":12089,"name":"Escobillas del motor de arranque","notes":"Nuevas"},{"dateISO":"2025-06-29","date":"29/06/2025","markerHours":220,"markerKm":4849,"realHours":472,"realKm":12089,"name":"Casquillo del motor de arranque","notes":"Instalado"},{"dateISO":"2025-11-14","date":"14/11/2025","markerHours":260,"markerKm":5574,"realHours":516,"realKm":12814,"name":"Kit de arranque a patada","notes":"Montado"},{"dateISO":"2025-11-14","date":"14/11/2025","markerHours":260,"markerKm":5574,"realHours":516,"realKm":12814,"name":"Aceite del cambio","notes":"Cambiado"},{"dateISO":"2025-11-14","date":"14/11/2025","markerHours":260,"markerKm":5574,"realHours":516,"realKm":12814,"name":"Líquido refrigerante","notes":"Cambiado"},{"dateISO":"2025-11-14","date":"14/11/2025","markerHours":260,"markerKm":5574,"realHours":516,"realKm":12814,"name":"Servicio de horquilla","notes":"DMX"},{"dateISO":"2026-01-26","date":"26/01/2026","markerHours":280,"markerKm":6314,"realHours":536,"realKm":13554,"name":"Líquido de embrague","notes":"Cambiado"},{"dateISO":"2026-01-26","date":"26/01/2026","markerHours":280,"markerKm":6314,"realHours":536,"realKm":13554,"name":"Piñón","notes":"12 dientes"},{"dateISO":"2026-03-13","date":"13/03/2026","markerHours":300,"markerKm":6760,"realHours":556,"realKm":14000,"name":"Aceite del cambio","notes":"Cambiado"},{"dateISO":"2026-03-13","date":"13/03/2026","markerHours":300,"markerKm":6760,"realHours":556,"realKm":14000,"name":"Filtro de combustible","notes":"Cambiado"},{"dateISO":"2026-07-26","date":"26/07/2026","markerHours":320,"markerKm":null,"realHours":576,"realKm":null,"name":"Rodamiento de rueda delantero","notes":"Cambiados"},{"dateISO":"2026-07-26","date":"26/07/2026","markerHours":320,"markerKm":null,"realHours":576,"realKm":null,"name":"Neumático delantero","notes":"Carcasa nueva; mousse antiguo"},{"dateISO":"2026-07-26","date":"26/07/2026","markerHours":320,"markerKm":null,"realHours":576,"realKm":null,"name":"Servicio de horquilla","notes":"DMX"},{"dateISO":"2026-07-26","date":"26/07/2026","markerHours":320,"markerKm":null,"realHours":576,"realKm":null,"name":"Servicio de amortiguador","notes":"DMX"},{"dateISO":"2026-07-26","date":"26/07/2026","markerHours":320,"markerKm":null,"realHours":576,"realKm":null,"name":"Filtro del depósito de combustible","notes":"Cambiado"},{"dateISO":"2026-07-26","date":"26/07/2026","markerHours":320,"markerKm":null,"realHours":576,"realKm":null,"name":"Pistón","notes":"Previsto tras nicasilado; confirmar instalación"},{"dateISO":"2026-07-26","date":"26/07/2026","markerHours":320,"markerKm":null,"realHours":576,"realKm":null,"name":"Cilindro","notes":"Nicasilado; confirmar finalización"},{"dateISO":"2026-07-26","date":"26/07/2026","markerHours":320,"markerKm":null,"realHours":576,"realKm":null,"name":"Rodamiento de agujas","notes":"Previsto; confirmar instalación"}];
const correctedComponentImportKey = bikeStorageKey('componentSpreadsheetImport20260917c');
if (!localStorage.getItem(correctedComponentImportKey)) {
  const oldComponentEvents = events.filter(item => item.type === 'Sustitución de componente');
  localStorage.setItem(bikeStorageKey('componentEventsBackup20260917c'), JSON.stringify(oldComponentEvents));
  events = events.filter(item => item.type !== 'Sustitución de componente');
  const imported = correctedComponentImport.map(item => ({ type: 'Sustitución de componente', description: `Sustitución de ${item.name}`, date: formatDate(item.dateISO), dateISO: item.dateISO, hours: item.markerHours ?? '', km: item.markerKm ?? '', realHours: item.realHours ?? '', realKm: item.realKm ?? '', componentChange: { name: item.name, reference: '' }, componentChanges: [{ name: item.name, reference: '' }], attachments: [], cost: '', notes: `Transcripción del documento: ${item.notes || ''}` }));
  events.push(...imported); saveEvents(); localStorage.setItem(correctedComponentImportKey, '1');
}
const componentReadingsRepairKey = bikeStorageKey('componentSpreadsheetImport20260917d');
if (!localStorage.getItem(componentReadingsRepairKey)) {
  const imported = correctedComponentImport.map(item => ({ type: 'Sustitución de componente', description: `Sustitución de ${item.name}`, date: formatDate(item.dateISO), dateISO: item.dateISO, hours: item.markerHours ?? '', km: item.markerKm ?? '', realHours: item.realHours ?? '', realKm: item.realKm ?? '', componentChange: { name: item.name, reference: '' }, componentChanges: [{ name: item.name, reference: '' }], attachments: [], cost: '', notes: `Transcripción del documento: ${item.notes || ''}` }));
  localStorage.setItem(bikeStorageKey('componentEventsBackup20260917d'), JSON.stringify(events.filter(item => item.type === 'Sustitución de componente')));
  events = [...events.filter(item => item.type !== 'Sustitución de componente'), ...imported];
  saveEvents(); localStorage.setItem(componentReadingsRepairKey, '1');
}
const spreadsheetComponentImportKey = bikeStorageKey('componentSpreadsheetImport20260915');
if (!localStorage.getItem(spreadsheetComponentImportKey) && !localStorage.getItem(correctedComponentImportKey)) {
  setTimeout(() => {
    const currentComponentEvents = events.filter(item => item.type === 'Sustitución de componente');
    localStorage.setItem(bikeStorageKey('componentEventsBackup20260915'), JSON.stringify(currentComponentEvents));
    const imported = spreadsheetComponentImport.map(item => ({ type: 'Sustitución de componente', description: `Sustitución de ${item.name}`, date: item.date, dateISO: item.dateISO, hours: '', km: '', realHours: item.realHours, realKm: item.realKm, componentChange: { name: item.name, reference: '' }, componentChanges: [{ name: item.name, reference: '' }], attachments: [], cost: '', notes: `Transcripción del documento: ${item.notes}` }));
    events = [...events.filter(item => item.type !== 'Sustitución de componente'), ...imported];
    saveEvents();
    localStorage.setItem(spreadsheetComponentImportKey, '1');
    syncComponentsFromEvents();
    renderTimeline();
    renderComponentUsageChart();
    updateBikeView();
  }, 4000);
}
let sortDirection = localStorage.getItem('motoSortDirection') || 'desc';
let filterType = 'all';
let filterYear = 'all';
function eventIcon(type) { return type === 'Mantenimiento' ? '✓' : type === 'Documento' || type === 'ITV' ? '▣' : type === 'Sustitución de componente' ? '⚙' : type === 'Cambio de marcador' ? '↔' : '⌁'; }
function eventClass(type) { return type === 'Mantenimiento' ? 'green' : type === 'Documento' || type === 'ITV' ? 'blue' : type === 'Sustitución de componente' ? 'purple' : 'orange'; }
function safeText(value) { const el = document.createElement('span'); el.textContent = value ?? ''; return el.innerHTML; }
function readingNumber(value) {
  if (typeof value === 'number') return value;
  const text = String(value ?? '').trim();
  if (!text || /x/i.test(text)) return NaN;
  if (text.includes(',')) return Number(text.replace(/\./g, '').replace(',', '.'));
  if (/^\d{1,3}(\.\d{3})+$/.test(text)) return Number(text.replace(/\./g, ''));
  return Number(text);
}
function wholeReading(value) { const number = readingNumber(value); return Number.isFinite(number) ? Math.round(number).toLocaleString('es-ES') : value; }
function eventReadings(item) {
  const marker = [item.hours ? `${wholeReading(item.hours)} h` : '', item.km ? `${wholeReading(item.km)} km` : ''].filter(Boolean).join(' · ');
  const real = [item.realHours ? `${wholeReading(item.realHours)} h` : '', item.realKm ? `${wholeReading(item.realKm)} km` : ''].filter(Boolean).join(' · ');
  return [marker ? `Marcador: ${marker}` : '', real ? `Reales: ${real}` : ''].filter(Boolean).join(' · ');
}
function realHoursFor(item) {
  if (item.realHours) return item.realHours;
  const notes = String(item.notes || '');
  const noteMatch = notes.match(/(?:\+\s*|entre paréntesis[^:]*:\s*|reales?\s*:\s*)(\d+(?:[.,]\d+)?)\s*h/i) || notes.match(/(\d+(?:[.,]\d+)?)\s*h\s*entre paréntesis/i);
  return noteMatch ? noteMatch[1].replace(',', '.') : item.hours;
}
function realKmFor(item) { return item.realKm || item.km; }
function eventTitle(item) {
  const title = item.type === 'Mantenimiento' ? `${item.description} (${realHoursFor(item) ? wholeReading(realHoursFor(item)) : '—'} h reales)` : item.type === 'Sustitución de componente' && (item.componentChanges?.length || item.componentChange?.name) ? `${item.description} · ${(item.componentChanges || [item.componentChange]).map(change => change.name).join(', ')}` : item.description;
  return safeText(title);
}
function isPistonEvent(item) { return (item.maintenanceParts || []).includes('Pistón') || /cambio pist[oó]n|pist[oó]n\s+[a-c]\b|nuevos segmentos|motor abierto|revisi[oó]n pist[oó]n\/cilindro/i.test(`${item.description} ${item.notes || ''}`); }
function renderUsageChart() {
  const chart = document.querySelector('#view-dashboard .chart-area svg');
  if (!chart) return;
  const points = events.map(item => ({ item, hours: Number(realHoursFor(item)), time: Date.parse(`${item.dateISO || '1970-01-01'}T12:00:00`) })).filter(point => Number.isFinite(point.hours) && Number.isFinite(point.time)).sort((a, b) => a.time - b.time);
  if (points.length < 2) return;
  const maxDataHours = Math.max(...points.map(point => point.hours));
  const maxHours = Math.ceil(maxDataHours / 50) * 50 || 50;
  const yLabels = [maxHours, maxHours * .75, maxHours * .5, maxHours * .25, 0].map(value => `${Math.round(value)} h`);
  const labelsContainer = document.querySelector('#view-dashboard .chart-labels');
  if (labelsContainer) labelsContainer.innerHTML = yLabels.map(label => `<span>${label}</span>`).join('');
  const monthsContainer = document.querySelector('#view-dashboard .months');
  if (monthsContainer) {
    const labelPoints = points.filter((_, index) => index === 0 || index === points.length - 1 || index % Math.max(1, Math.floor(points.length / 4)) === 0).slice(0, 6);
    monthsContainer.innerHTML = labelPoints.map(point => `<span>${safeText(point.item.date || '')}</span>`).join('');
  }
  const coords = points.map((point, index) => ({ ...point, x: points.length === 1 ? 0 : (index / (points.length - 1)) * 600, y: 178 - (point.hours / maxHours) * 150 }));
  const line = coords.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
  const area = `${line} L600 190 L0 190 Z`;
  const pistonPoints = coords.filter(point => isPistonEvent(point.item));
  chart.innerHTML = `<defs><linearGradient id="usage-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#f47b20" stop-opacity=".28"/><stop offset="1" stop-color="#f47b20" stop-opacity="0"/></linearGradient></defs><path d="${area}" fill="url(#usage-fill)"/><path d="${line}" fill="none" stroke="#ef7620" stroke-width="3" vector-effect="non-scaling-stroke"/>${pistonPoints.map(point => `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="5" fill="#fff" stroke="#7d5ab2" stroke-width="3"/><text x="${point.x.toFixed(1)}" y="${Math.max(14, point.y - 10).toFixed(1)}" text-anchor="middle" fill="#7d5ab2" font-size="10" font-weight="700">Pistón</text>`).join('')}`;
}
function renderTimeline() {
  const timeline = document.getElementById('timeline');
  if (!timeline) return;
  const lifeAction = document.getElementById('addEventVida');
  if (lifeAction) { lifeAction.hidden = false; lifeAction.style.display = 'inline-flex'; }
  const generatedMaintenanceKeys = new Set(events.filter(item => item?.maintenanceEventId).map(item => `${item.dateISO || ''}|${String(item.description || '').replace(/\s*\([^)]*reales\)$/, '')}`));
  const orderedEvents = events.map((item, index) => ({ item, index })).filter(({ item }) => {
    if (!item?.maintenanceEventId) {
      const legacyKey = `${item.dateISO || ''}|${String(item.description || '')}`;
      if (generatedMaintenanceKeys.has(legacyKey)) return false;
    }
    return (filterType === 'all' || item.type === filterType) && (filterYear === 'all' || String(item.dateISO || '').startsWith(filterYear));
  }).sort((a, b) => { const result = String(a.item.dateISO || '').localeCompare(String(b.item.dateISO || '')); return sortDirection === 'desc' ? -result : result; });
  timeline.innerHTML = '<div class="timeline-date">HISTORIAL</div>' + (orderedEvents.length ? orderedEvents.map(({ item, index }) => `<div class="timeline-event ${item.type === 'Mantenimiento' ? 'maintenance-entry' : ''}"><div class="timeline-dot ${eventClass(item.type)}"></div><div class="timeline-card"><div class="activity-icon ${eventClass(item.type)}">${eventIcon(item.type)}</div><div class="activity-main"><strong>${eventTitle(item)}</strong><span>${safeText(item.date)}${eventReadings(item) ? ` · ${safeText(eventReadings(item))}` : ''}</span>${item.notes && item.type !== "Mantenimiento" && !item.maintenanceInterval ? `<p>${safeText(item.notes)}</p>` : ""}</div><strong class="activity-cost">${safeText(item.cost || '—')}</strong><button class="event-edit" data-event-index="${index}" aria-label="Editar evento">✎</button><button class="event-delete" data-event-index="${index}" aria-label="Eliminar evento" title="Eliminar evento">🗑</button></div></div>`).join('') : '<div class="panel empty-state"><p>Aún no hay eventos para esta moto.</p><button type="button" class="primary-button empty-life-action">＋ Registrar evento</button></div>');
  timeline.querySelector('.empty-life-action')?.addEventListener('click', openModal);
  timeline.querySelectorAll('.timeline-event').forEach((node, timelineIndex) => {
    const item = orderedEvents[timelineIndex]?.item;
    if (!item?.maintenanceEventId) return;
    const main = node.querySelector('.activity-main');
    const card = node.querySelector('.timeline-card');
    if (item.maintenanceStatus === 'in_progress') {
      const status = document.createElement('span');
      status.className = 'maintenance-status in-progress';
      status.textContent = 'En curso';
      main?.appendChild(status);
    }
    if (item.maintenanceInterval && Number.isFinite(Number(item.maintenancePercent))) {
      const progress = document.createElement('div');
      progress.className = 'life-maintenance-progress';
      progress.innerHTML = `<div><span>Avance de tareas</span><strong>${item.maintenanceCompleted}/${item.maintenanceTotal} · ${item.maintenancePercent}%</strong></div><i><b style="width:${Math.max(0, Math.min(100, Number(item.maintenancePercent)))}%"></b></i>`;
      main?.appendChild(progress);
    }
    if (item.attachments?.length) {
      const attachmentNote = document.createElement('span');
      attachmentNote.className = 'attachment-note';
      attachmentNote.textContent = `📎 Tiene ${item.attachments.length === 1 ? 'un adjunto' : `${item.attachments.length} adjuntos`} · abre la ficha para verlo${item.attachments.length === 1 ? '' : 's'}`;
      main?.appendChild(attachmentNote);
      if (!item.maintenanceInterval) {
        const attachmentButton = document.createElement('button');
        attachmentButton.className = 'event-attachment-open';
        attachmentButton.type = 'button';
        attachmentButton.dataset.eventIndex = orderedEvents[timelineIndex].index;
        attachmentButton.textContent = 'Abrir ficha';
        card?.appendChild(attachmentButton);
      }
    }
    const openButton = document.createElement('button');
    openButton.className = 'maintenance-open-event';
    openButton.type = 'button';
    openButton.dataset.maintenanceInterval = item.maintenanceInterval || '';
    openButton.dataset.eventIndex = orderedEvents[timelineIndex].index;
    openButton.textContent = item.maintenanceStatus === 'in_progress' ? 'Continuar mantenimiento' : 'Abrir mantenimiento';
    card?.appendChild(openButton);
  });
}
renderTimeline();
renderUsageChart();

const importHistoryButton = document.createElement('button');
importHistoryButton.className = 'quiet-button import-history';
importHistoryButton.textContent = 'Importar historial KTM';
importHistoryButton.type = 'button';
importHistoryButton.addEventListener('click', () => {
  if (!confirm('Se reemplazará el historial local actual por los registros del documento Revisiones KTM. ¿Continuar?')) return;
  events = defaultEvents.map(item => ({ ...item }));
  saveEvents();
  renderTimeline();
  renderUsageChart();
  showView(eventReturnView || 'vida');
  eventReturnView = 'vida';
});
document.querySelector('.filters')?.appendChild(importHistoryButton);
const exportButton = [...document.querySelectorAll('.filters .quiet-button')].find(button => button.textContent.includes('Exportar datos'));
let pdfLibraryPromise;
function loadPdfLibrary() {
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if (pdfLibraryPromise) return pdfLibraryPromise;
  pdfLibraryPromise = new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; script.onload = () => resolve(window.jspdf.jsPDF); script.onerror = reject; document.head.appendChild(script); });
  return pdfLibraryPromise;
}
async function exportMaintenancePdf() {
  const JsPDF = await loadPdfLibrary();
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const orange = [239, 118, 32];
  const ink = [32, 35, 41];
  const muted = [118, 120, 113];
  const line = [229, 227, 220];
  const margin = 16;
  let y = 18;
  const ensureSpace = needed => { if (y + needed > pageHeight - 16) { doc.addPage(); y = 18; drawFooter(); } };
  const drawFooter = () => { const pages = doc.internal.getNumberOfPages(); doc.setPage(pages); doc.setDrawColor(...line); doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11); doc.setFontSize(8); doc.setTextColor(...muted); doc.text(`Mis motos · Informe de mantenimiento · ${new Date().toLocaleDateString('es-ES')}`, margin, pageHeight - 6); doc.text(`Página ${pages}`, pageWidth - margin - 14, pageHeight - 6); };
  const text = (value, x, top, size = 10, color = ink, style = 'normal') => { doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color); doc.text(String(value ?? ''), x, top); };
  const wrapped = (value, x, top, width, size = 9, color = ink) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(size); doc.setTextColor(...color); const lines = doc.splitTextToSize(String(value ?? ''), width); doc.text(lines, x, top); return lines.length * (size * .42); };
  doc.setFillColor(...orange); doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 4, 4, 'F');
  text('INFORME DE MANTENIMIENTO', margin + 7, y + 10, 9, [255, 255, 255], 'bold');
  text(`${bikeData.brand} ${bikeData.model}`, margin + 7, y + 19, 18, [255, 255, 255], 'bold');
  text(`Año ${bikeData.year}`, pageWidth - margin - 7, y + 18, 9, [255, 255, 255], 'normal');
  y += 38;
  text('Ficha de la moto', margin, y, 13, ink, 'bold'); y += 7;
  doc.setDrawColor(...line); doc.roundedRect(margin, y, pageWidth - margin * 2, 28, 3, 3, 'S');
  const profileItems = [['Horas reales', `${Math.round(Number(bikeData.realHours)).toLocaleString('es-ES')} h`], ['Horas marcador', `${Math.round(Number(bikeData.markerHours)).toLocaleString('es-ES')} h`], ['Km reales', `${Math.round(Number(bikeData.realKm)).toLocaleString('es-ES')} km`], ['Km marcador', `${Math.round(Number(bikeData.markerKm)).toLocaleString('es-ES')} km`]];
  profileItems.forEach((item, index) => { const x = margin + 7 + index * 43; text(item[0], x, y + 9, 8, muted); text(item[1], x, y + 18, 12, ink, 'bold'); });
  y += 38;
  text('Uso real acumulado', margin, y, 13, ink, 'bold'); y += 6;
  const points = events.map(item => ({ item, hours: Number(realHoursFor(item)) })).filter(point => Number.isFinite(point.hours)).sort((a, b) => String(a.item.dateISO || '').localeCompare(String(b.item.dateISO || '')));
  const chartX = margin, chartY = y, chartW = pageWidth - margin * 2, chartH = 52;
  doc.setDrawColor(...line); doc.roundedRect(chartX, chartY, chartW, chartH, 3, 3, 'S');
  if (points.length > 1) { const maxHours = Math.ceil(Math.max(...points.map(point => point.hours)) / 50) * 50 || 50; const firstTime = points[0].time, lastTime = points[points.length - 1].time, timeRange = Math.max(1, lastTime - firstTime); const coords = points.map(point => ({ ...point, x: chartX + 8 + ((point.time - firstTime) / timeRange) * (chartW - 16), y: chartY + chartH - 8 - (point.hours / maxHours) * (chartH - 16) })); doc.setDrawColor(...line); [0, .5, 1].forEach(level => doc.line(chartX + 8, chartY + chartH - 8 - level * (chartH - 16), chartX + chartW - 8, chartY + chartH - 8 - level * (chartH - 16))); doc.setDrawColor(...orange); doc.setLineWidth(1); coords.forEach((point, index) => { if (index) doc.line(coords[index - 1].x, coords[index - 1].y, point.x, point.y); doc.setFillColor(...orange); doc.circle(point.x, point.y, 1.2, 'F'); if (isPistonEvent(point.item)) { doc.setFillColor(128, 99, 183); doc.setDrawColor(128, 99, 183); doc.circle(point.x, point.y, 2, 'F'); text('Pistón', point.x - 5, Math.max(chartY + 5, point.y - 4), 7, [128, 99, 183], 'bold'); } }); text(`0 h`, chartX + 2, chartY + chartH - 4, 7, muted); text(`${maxHours} h`, chartX + 2, chartY + 8, 7, muted); text('● Pistón', chartX + chartW - 29, chartY + chartH + 7, 7, [128, 99, 183], 'bold'); const firstDate = new Date(firstTime).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }); const lastDate = new Date(lastTime).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }); text(firstDate, chartX + 8, chartY + chartH + 7, 7, muted); text(lastDate, chartX + chartW - 18, chartY + chartH + 7, 7, muted); }
  y += chartH + 12;
  text('Mantenimientos realizados', margin, y, 13, ink, 'bold'); y += 7;
  const maintenanceEvents = events.filter(item => item.type === 'Mantenimiento').sort((a, b) => String(b.dateISO || '').localeCompare(String(a.dateISO || '')));
  const cols = [margin, margin + 25, margin + 105, margin + 148];
  doc.setFillColor(246, 244, 239); doc.rect(margin, y - 5, pageWidth - margin * 2, 9, 'F');
  ['Fecha', 'Mantenimiento', 'Horas reales', 'Km reales'].forEach((label, index) => text(label, cols[index], y + 1, 8, muted, 'bold')); y += 10;
  maintenanceEvents.forEach(item => { const title = item.description || 'Mantenimiento'; const titleLines = doc.splitTextToSize(title, 73); const rowH = Math.max(10, titleLines.length * 4.2 + 3); ensureSpace(rowH); doc.setDrawColor(...line); doc.line(margin, y + rowH - 2, pageWidth - margin, y + rowH - 2); text(item.date || 'Sin fecha', cols[0], y + 3, 8, ink); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...ink); doc.text(titleLines, cols[1], y + 3); text(wholeReading(realHoursFor(item)) + ' h', cols[2], y + 3, 8, ink); text(item.realKm ? `${wholeReading(item.realKm)} km` : '—', cols[3], y + 3, 8, ink); y += rowH; });
  if (!maintenanceEvents.length) { ensureSpace(12); text('Todavía no hay mantenimientos registrados.', margin, y + 3, 9, muted); y += 12; }
  drawFooter();
  doc.save(`informe-mantenimiento-${(bikeData.model || 'moto').toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.pdf`);
}
exportButton?.addEventListener('click', () => exportMaintenancePdf().catch(() => window.alert('No se ha podido generar el PDF. Comprueba la conexión e inténtalo de nuevo.')));
const sortSelect = document.createElement('select');
sortSelect.className = 'filter-button sort-events';
sortSelect.setAttribute('aria-label', 'Ordenar historial');
sortSelect.innerHTML = '<option value="desc">Más reciente primero</option><option value="asc">Más antiguo primero</option>';
sortSelect.value = sortDirection;
sortSelect.addEventListener('change', () => { sortDirection = sortSelect.value; localStorage.setItem('motoSortDirection', sortDirection); renderTimeline(); });
document.querySelector('.filters')?.appendChild(sortSelect);
document.querySelectorAll('.filters > .filter-button:not(.sort-events)').forEach(button => { button.hidden = true; });
const typeSelect = document.createElement('select');
typeSelect.className = 'filter-button';
typeSelect.setAttribute('aria-label', 'Filtrar por tipo');
typeSelect.innerHTML = '<option value="all">Todos los eventos</option>' + [...new Set(events.map(item => String(item.type || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es')).map(type => `<option value="${safeText(type)}">${safeText(type)}</option>`).join('');
typeSelect.addEventListener('change', () => { filterType = typeSelect.value; renderTimeline(); });
document.querySelector('.filters')?.prepend(typeSelect);
const yearSelect = document.createElement('select');
yearSelect.className = 'filter-button';
yearSelect.setAttribute('aria-label', 'Filtrar por año');
const years = [...new Set(events.map(item => String(item.dateISO || '').slice(0, 4)).filter(Boolean))].sort().reverse();
yearSelect.innerHTML = '<option value="all">Todos los años</option>' + years.map(year => `<option value="${year}">${year}</option>`).join('');
yearSelect.addEventListener('change', () => { filterYear = yearSelect.value; renderTimeline(); });
document.querySelector('.filters')?.prepend(yearSelect);

document.addEventListener('click', event => {
  const deleteButton = event.target.closest('.event-delete');
  if (deleteButton) {
    const index = Number(deleteButton.dataset.eventIndex);
    const item = events[index];
    if (!item) return;
    const title = item.description || item.type || 'este evento';
    openDeleteConfirmation(title, () => {
      if (item.maintenanceInterval) {
        const session = readMaintenanceSession(item.maintenanceInterval);
        const ids = new Set([item.maintenanceEventId, session?.eventId].filter(Boolean));
        events = events.filter(candidate => !ids.has(candidate.maintenanceEventId));
        localStorage.removeItem(maintenanceSessionKey(item.maintenanceInterval));
        localStorage.removeItem(checklistStateKey(item.maintenanceInterval));
        if (localStorage.getItem(`motoMaintenanceChecklistInterval:${maintenancePlanKey()}`) === item.maintenanceInterval) localStorage.removeItem(`motoMaintenanceChecklistInterval:${maintenancePlanKey()}`);
      } else {
        events.splice(index, 1);
      }
      saveEvents();
      syncComponentsFromEvents();
      renderTimeline();
      renderUsageChart();
      renderMaintenanceChecklist();
      updateMaintenanceEntryButtons();
      updateBikeView();
    });
    return;
  }
  const attachmentButton = event.target.closest('.event-attachment-open');
  if (attachmentButton) {
    const editButton = document.querySelector(`#timeline .event-edit[data-event-index="${attachmentButton.dataset.eventIndex}"]`);
    editButton?.click();
    return;
  }
  const maintenanceButton = event.target.closest('.maintenance-open-event');
  if (maintenanceButton) {
    const item = events[Number(maintenanceButton.dataset.eventIndex)];
    const currentSession = readMaintenanceSession(item.maintenanceInterval);
    if (item.maintenanceEventId !== (currentSession?.eventId || maintenanceEventId(item.maintenanceInterval))) {
      const detail = document.createElement('div');
      detail.className = 'modal-backdrop';
      detail.innerHTML = `<section class="modal" role="dialog" aria-modal="true" aria-label="Revisión guardada"><h2>${safeText(item.description)}</h2><p>${safeText(item.date)} · ${safeText(eventReadings(item))}</p><p>${safeText(item.notes || '')}</p>${attachmentMarkup(item.attachments || [])}<div>${(item.maintenanceTaskSnapshot || []).map(task => `<p>${task.done ? '✓ Hecha' : task.na ? 'No aplica' : 'Pendiente'} · ${safeText(task.task)}${task.note ? ` — ${safeText(task.note)}` : ''}</p>`).join('')}</div><button type="button" class="primary-button">Cerrar</button></section>`;
      const close = () => { detail.remove(); maintenanceButton.focus(); };
      detail.querySelector('button').addEventListener('click', close);
      detail.addEventListener('click', click => { if (click.target === detail) close(); });
      detail.addEventListener('keydown', key => { if (key.key === 'Escape') close(); });
      document.body.appendChild(detail); detail.querySelector('button').focus();
      return;
    }
    localStorage.setItem(`motoMaintenanceChecklistInterval:${maintenancePlanKey()}`, maintenanceButton.dataset.maintenanceInterval);
    maintenanceReturnView = 'vida';
    workshopOpen = true;
    document.body.classList.add('workshop-mode');
    showView('mantenimiento');
    renderMaintenanceChecklist();
    return;
  }
  const button = event.target.closest('.event-edit');
  if (!button) return;
  const item = events[Number(button.dataset.eventIndex)];
  if (!item) return;
  editingIndex = Number(button.dataset.eventIndex);
  modal.querySelector('h2').textContent = 'Editar evento';
  modal.querySelector('button[type="submit"]').textContent = 'Guardar cambios';
  document.getElementById('eventDate').value = item.dateISO || todayISO();
  document.getElementById('eventType').value = item.type;
  toggleMaintenanceParts();
  maintenanceParts.querySelectorAll('input').forEach(input => { input.checked = (item.maintenanceParts || []).includes(input.value); });
  const savedChanges = item.componentChanges || (item.componentChange ? [item.componentChange] : []);
  const savedComponentName = savedChanges[0]?.name || componentCatalog[0];
  [...document.getElementById('eventComponent').options].forEach(option => { option.selected = savedChanges.some(change => change.name === option.value); });
  document.getElementById('eventComponentReference').value = savedChanges[0]?.reference || '';
  document.getElementById('eventComponentCustom').value = savedComponentName && !componentCatalog.includes(savedComponentName) ? savedComponentName : '';
  toggleMaintenanceParts();
  document.getElementById('eventDescription').value = item.description;
  const correctedReading = typeof correctedComponentImport !== 'undefined' && item.type === 'Sustitución de componente'
    ? correctedComponentImport.find(entry => entry.dateISO === item.dateISO && savedChanges.some(change => change.name === entry.name)) : null;
  document.getElementById('eventHours').value = correctedReading?.markerHours ?? item.hours ?? '';
  document.getElementById('eventKm').value = correctedReading?.markerKm ?? item.km ?? '';
  document.getElementById('eventRealHours').value = correctedReading?.realHours ?? item.realHours ?? item.hours ?? '';
  document.getElementById('eventRealKm').value = correctedReading?.realKm ?? item.realKm ?? item.km ?? '';
  document.getElementById('eventCost').value = (item.cost || '').replace(' €', '').replace(',', '.');
  document.getElementById('eventNotes').value = item.notes || '';
  eventAttachmentDraft = [...(item.attachments || [])];
  renderEventAttachmentDraft();
  modal.classList.remove('hidden');
});

document.getElementById('eventForm').addEventListener('submit', async event => {
  event.preventDefault();
  syncComponentDescription();
  const description = document.getElementById('eventDescription').value.trim();
  if (!description) return;
  let type = document.getElementById('eventType').value;
  const visibleHours = Math.round(Number(document.getElementById('eventHours').value));
  const visibleKm = Math.round(Number(document.getElementById('eventKm').value));
  if (editingIndex === null && Number.isFinite(visibleHours) && document.getElementById('eventHours').value !== '') {
    if (visibleHours >= Number(bikeData.markerHours)) bikeData.realHours = Number(bikeData.realHours) + visibleHours - Number(bikeData.markerHours);
    bikeData.markerHours = visibleHours;
  }
  if (editingIndex === null && Number.isFinite(visibleKm) && document.getElementById('eventKm').value !== '') {
    if (visibleKm >= Number(bikeData.markerKm)) bikeData.realKm = Number(bikeData.realKm) + visibleKm - Number(bikeData.markerKm);
    bikeData.markerKm = visibleKm;
  }
  saveBikeProfiles();
  const actualHours = Math.round(Number(bikeData.realHours)).toLocaleString('es-ES');
  const actualKm = Number(bikeData.realKm).toLocaleString('es-ES');
  const selectedParts = [...maintenanceParts.querySelectorAll('input:checked')].map(input => input.value);
  const partsNote = type === 'Mantenimiento' && selectedParts.length ? `Componentes intervenidos: ${selectedParts.join(', ')}.` : '';
  const selectedNames = [...document.querySelectorAll('#componentChangeRows [data-component-select]')].map(input => input.value).filter(value => value !== '__custom__');
  const customName = document.getElementById('eventComponentCustom').value.trim();
  if (customName) selectedNames.push(customName);
  if (type === 'Sustitución de componente' && !selectedNames.length) return;
  const reference = document.getElementById('eventComponentReference').value.trim();
  const componentChanges = type === 'Sustitución de componente' ? selectedNames.map(name => ({ name, reference })) : [];
  const componentChange = componentChanges[0] || null;
  const componentNote = componentChanges.length ? `Componentes sustituidos: ${componentChanges.map(change => `${change.name}${change.reference ? ` (${change.reference})` : ''}`).join(', ')}.` : '';
  const markerNote = type === 'Cambio de marcador' ? `Marcador actualizado a ${Number.isFinite(visibleHours) ? visibleHours : bikeData.markerHours} h / ${Number.isFinite(visibleKm) ? visibleKm : bikeData.markerKm} km. Uso real acumulado: ${actualHours} h / ${actualKm} km.` : '';
  const selectedDate = document.getElementById('eventDate').value || todayISO();
  const originalEvent = editingIndex === null ? null : events[editingIndex];
  if (isMaintenanceRecord(originalEvent)) type = 'Mantenimiento';
  const editedEvent = { type, description, date: formatDate(selectedDate), dateISO: selectedDate, hours: document.getElementById('eventHours').value, km: document.getElementById('eventKm').value, realHours: document.getElementById('eventRealHours').value, realKm: document.getElementById('eventRealKm').value, maintenanceParts: selectedParts, componentChange, componentChanges, attachments: eventAttachmentDraft, cost: document.getElementById('eventCost').value ? `${document.getElementById('eventCost').value} €` : '', notes: [document.getElementById('eventNotes').value.trim(), partsNote, componentNote, markerNote].filter(Boolean).join(' ') };
  if (originalEvent?.maintenanceEventId) {
    Object.assign(editedEvent, { maintenanceEventId: originalEvent.maintenanceEventId, maintenanceInterval: originalEvent.maintenanceInterval, maintenanceStatus: originalEvent.maintenanceStatus, maintenanceCompleted: originalEvent.maintenanceCompleted, maintenanceTotal: originalEvent.maintenanceTotal, maintenancePercent: originalEvent.maintenancePercent, maintenanceTaskSnapshot: originalEvent.maintenanceTaskSnapshot });
    const session = maintenanceSession(originalEvent.maintenanceInterval);
    session.date = selectedDate;
    session.markerHours = document.getElementById('eventHours').value;
    session.markerKm = document.getElementById('eventKm').value;
    session.realHours = document.getElementById('eventRealHours').value;
    session.realKm = document.getElementById('eventRealKm').value;
    session.eventId = originalEvent.maintenanceEventId;
    localStorage.setItem(maintenanceSessionKey(originalEvent.maintenanceInterval), JSON.stringify(session));
  }
  const recordsToSave = editingIndex === null && componentChanges.length > 1
    ? componentChanges.map(change => ({ ...editedEvent, componentChange: change, componentChanges: [change], notes: [document.getElementById('eventNotes').value.trim(), partsNote, `Componente sustituido: ${change.name}${change.reference ? ` (${change.reference})` : ''}.`, markerNote].filter(Boolean).join(' ') }))
    : [editedEvent];
  if (editingIndex === null) recordsToSave.reverse().forEach(record => events.unshift(record)); else events[editingIndex] = editedEvent;
  componentChanges.forEach(change => updateComponentFromEvent(change, editedEvent));
  syncComponentsFromEvents();
  saveEvents();
  renderTimeline();
  updateBikeView();
  renderMaintenanceChecklist();
  renderUsageChart();
  closeModal();
  event.target.reset();
  editingIndex = null;
  eventAttachmentDraft = [];
  const returnView = eventReturnView || 'vida';
  if (returnView === 'componentes') renderComponents();
  showView(returnView);
  eventReturnView = 'vida';
});

const bikeModal = document.getElementById('bikeModal');
const bikeData = { ...bikeDefaults, ...(bikeProfiles.find(profile => profile.id === activeBikeId) || {}) };
const defaultBikePhoto = 'assets/ktm-250-exc-tpi-2021.png';
function profilePhoto(profile) {
  if (profile.photo) return profile.photo;
  const identity = `${profile.brand || ''} ${profile.model || ''}`.toLocaleLowerCase('es-ES');
  if (identity.includes('yamaha') && identity.includes('wr 450')) return 'assets/yamaha-wr450-2010.jpg';
  const template = Object.values(bikeModelCatalog).find(item => item.brand === profile.brand && item.model === profile.model);
  return template?.photo || (profile.brand === 'KTM' && profile.model === bikeDefaults.model ? defaultBikePhoto : 'assets/moto-sin-foto.svg');
}
const componentDefinitions = [
  ['Cadena', 'Transmisión', 80, '78010267118', 99.96], ['Corona', 'Transmisión', 80, '', null], ['Piñón', 'Transmisión', 80, '79233129014', null], ['Pastillas de freno delanteras', 'Frenos', 80, '', null], ['Pastillas de freno traseras', 'Frenos', 80, '', null], ['Líquido de frenos', 'Frenos', 12, '00062030000', null], ['Líquido de embrague', 'Embrague', 12, '', null], ['Cámara delantera', 'Ruedas', 80, '', null], ['Cámara trasera', 'Ruedas', 80, '', null], ['Mousse delantero', 'Ruedas', 80, '', null], ['Mousse trasero', 'Ruedas', 80, '', null], ['Aceite del cambio', 'Lubricación', 40, '', null], ['Bujía', 'Motor', 80, '', null], ['Líquido refrigerante', 'Refrigeración', 48, '', null], ['Fibra del escape', 'Escape', 80, '', null], ['Pistón', 'Motor', 80, '55530138100', 901.68], ['Segmentos', 'Motor', 80, '54830232000', null], ['Biela', 'Motor', 160, '54830015244', null], ['Filtro de aire', 'Admisión', null, '79006015000', 20.04], ['Servicio de horquilla', 'Suspensión', 40, '', null], ['Servicio de amortiguador', 'Suspensión', 40, '', null], ['Tamiz de combustible', 'Alimentación', 80, '', null], ['Filtro del depósito de combustible', 'Alimentación', 80, '', null], ['Guía de cadena', 'Transmisión', 80, 'A48004970044', 49.08], ['Embrague', 'Motor', 80, '54832011110', null], ['Disco de freno delantero', 'Frenos', 80, '', null], ['Disco de freno trasero', 'Frenos', 80, '', null], ['Neumático delantero', 'Ruedas', null, '', null], ['Neumático trasero', 'Ruedas', null, '', null], ['Filtro de combustible', 'Alimentación', 80, '', null], ['Pipa de bujía', 'Motor', 80, '', null], ['Cilindro', 'Motor', 80, '55530138100', 901.68], ['Caja de cambios', 'Transmisión', 160, '', null], ['Bomba de aceite', 'Lubricación', 80, '', null], ['Batería', 'Electricidad', 40, '', null], ['Rodamiento de rueda delantero', 'Ruedas', 80, '', null], ['Rodamiento de rueda trasero', 'Ruedas', 80, '', null], ['Cojinetes de dirección', 'Dirección', 40, '', null], ['Cojinetes de basculante', 'Chasis', 40, '', null], ['Radios', 'Ruedas', 40, '', null], ['Silencioso', 'Escape', 80, '', null], ['Distribución de escape', 'Motor', 80, '', null], ['Motor de arranque', 'Electricidad', 80, '', null]
].map(([name, category, intervalHours, reference, catalogPrice]) => ({ name, category, intervalHours, reference, catalogPrice, status: 'Pendiente de registrar', detail: 'Sin cambio registrado', tone: 'neutral' }));
function componentStorageKey() { return bikeStorageKey('motoComponents'); }
const storedComponentRecords = JSON.parse(localStorage.getItem(componentStorageKey()) || 'null');
let componentRecords = componentDefinitions.map(definition => ({ ...definition, ...(storedComponentRecords || []).find(item => item.name === definition.name) }));
if (Array.isArray(storedComponentRecords)) storedComponentRecords.filter(item => !['Kit de transmisión', 'Neumáticos'].includes(item.name) && !componentRecords.some(record => record.name === item.name)).forEach(item => componentRecords.push(item));
function saveComponents() { localStorage.setItem(componentStorageKey(), JSON.stringify(componentRecords)); }
function nextChangePlanText(item) {
  const plan = item.nextChangePlan;
  if (!plan?.mode) return '';
  if (plan.mode === 'state') return 'Programado: Por estado';
  if (!plan.value) return '';
  const labels = { hours: 'h marcador', km: 'km marcador', date: '' };
  return `Programado: ${safeText(plan.value)}${labels[plan.mode] ? ` ${labels[plan.mode]}` : ''}`;
}
function updateComponentFromEvent(change, eventRecord) {
  if (!change?.name) return;
  let record = componentRecords.find(item => item.name === change.name);
  if (!record) { record = { name: change.name, status: 'Sustituido recientemente', detail: 'Componente registrado desde un evento', tone: 'good' }; componentRecords.push(record); }
  record.status = 'Sustituido recientemente';
  record.tone = 'good';
  record.detail = `${eventRecord.date} · ${eventRecord.realHours || eventRecord.hours || '—'} h · ${eventRecord.realKm || eventRecord.km || '—'} km`;
  record.lastChange = { date: eventRecord.date, dateISO: eventRecord.dateISO, markerHours: eventRecord.markerHours ?? eventRecord.hours, realHours: eventRecord.realHours, realKm: eventRecord.realKm, cost: eventRecord.cost || '', reference: change.reference || '' };
  record.history = [...(record.history || []).filter(item => item.dateISO !== eventRecord.dateISO || item.reference !== (change.reference || '')), record.lastChange];
  saveComponents();
  renderComponents();
}
const componentMarkerReadings = {"2021-12-14":{"markerHours":50,"markerKm":1772},"2022-06-20":{"markerHours":120,"markerKm":3517},"2022-09-25":{"markerHours":140,"markerKm":4100},"2022-10-28":{"markerHours":160,"markerKm":4400},"2023-01-03":{"markerHours":189,"markerKm":5293},"2023-04-10":{"markerHours":230,"markerKm":6352},"2023-07-01":{"markerHours":260,"markerKm":7221},"2023-11-15":{"markerHours":280,"markerKm":null},"2023-12-30":{"markerHours":300,"markerKm":8200},"2024-02-22":{"markerHours":320,"markerKm":8777},"2024-04-05":{"markerHours":340,"markerKm":9106},"2024-06-17":{"markerHours":372,"markerKm":9688},"2024-11-08":{"markerHours":146,"markerKm":3306},"2025-01-19":{"markerHours":146,"markerKm":3900},"2025-03-31":{"markerHours":186,"markerKm":4242},"2025-06-29":{"markerHours":220,"markerKm":4849},"2025-11-14":{"markerHours":260,"markerKm":5574},"2026-01-26":{"markerHours":280,"markerKm":6314},"2026-03-13":{"markerHours":300,"markerKm":6760},"2026-07-26":{"markerHours":320,"markerKm":null}};
function syncComponentsFromEvents() {
  componentRecords.forEach(record => {
    const changes = events.map((item, eventIndex) => ({ item, eventIndex })).filter(({ item }) => item.type === 'Sustitución de componente' && (item.componentChanges || [item.componentChange]).some(change => change?.name === record.name)).sort((a, b) => String(b.item.dateISO || '').localeCompare(String(a.item.dateISO || '')));
    if (!changes.length) {
      delete record.lastChange;
      delete record.history;
      record.status = 'Pendiente de registrar';
      record.tone = 'neutral';
      record.detail = 'Sin cambio registrado';
      return;
    }
    const latest = changes[0].item;
    record.status = 'Sustituido recientemente';
    record.tone = 'good';
    record.detail = `${latest.date} · ${latest.realHours || latest.hours || '—'} h · ${latest.realKm || latest.km || '—'} km`;
    const latestPart = (latest.componentChanges || [latest.componentChange]).find(change => change?.name === record.name) || {};
    const markerReading = componentMarkerReadings[latest.dateISO];
    if (markerReading) { latest.markerHours = markerReading.markerHours; latest.markerKm = markerReading.markerKm; latest.hours = markerReading.markerHours; latest.km = markerReading.markerKm; }
    record.lastChange = { date: latest.date, dateISO: latest.dateISO, markerHours: markerReading?.markerHours ?? latest.markerHours ?? latest.hours, markerKm: markerReading?.markerKm ?? latest.markerKm ?? latest.km, realHours: latest.realHours, realKm: latest.realKm, cost: latest.cost || '', reference: latestPart.reference || '', eventIndex: changes[0].eventIndex };
    record.history = changes.map(({ item: change, eventIndex }) => { const part = (change.componentChanges || [change.componentChange]).find(component => component?.name === record.name) || {}; const reading = componentMarkerReadings[change.dateISO]; return { date: change.date, dateISO: change.dateISO, markerHours: reading?.markerHours ?? change.markerHours ?? change.hours, markerKm: reading?.markerKm ?? change.markerKm ?? change.km, realHours: change.realHours || change.hours, realKm: change.realKm || change.km, cost: change.cost || '', reference: part.reference || '', eventIndex }; });
  });
  saveComponents();
  renderComponents();
}
function renderComponentUsageChart() {
  const chart = document.getElementById('componentUsageChart');
  const options = document.getElementById('componentUsageOptions');
  if (!chart || !options) return;
  // Use exactly the same maintenance records that are visible in Libro de vida.
  // Older imported records are hidden there when a generated workshop record
  // already represents the same event; they must also be excluded here so the
  // data table and graph cannot show duplicates.
  const generatedMaintenanceKeys = new Set(events.filter(item => item?.maintenanceEventId).map(item => `${item.dateISO || ''}|${String(item.description || '').replace(/\s*\([^)]*reales\)$/, '')}`));
  const visibleEvents = events.filter(item => {
    if (!item?.maintenanceEventId) {
      const legacyKey = `${item.dateISO || ''}|${String(item.description || '')}`;
      if (generatedMaintenanceKeys.has(legacyKey)) return false;
    }
    return true;
  });
  const names = [...new Set(events.flatMap(item => item.type === 'Sustitución de componente' ? (item.componentChanges || [item.componentChange]).map(change => change?.name).filter(Boolean) : []))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  const selected = new Set(JSON.parse(localStorage.getItem(bikeStorageKey('componentChartSelection')) || '[]'));
  options.innerHTML = names.length ? `<div class="component-usage-select-actions"><button type="button" class="quiet-button" data-component-select-all>Seleccionar todo</button><button type="button" class="quiet-button" data-component-select-none>Seleccionar nada</button></div>${names.map(name => `<label><input type="checkbox" value="${safeText(name)}" ${selected.has(name) ? 'checked' : ''} /> <span>${safeText(name)}</span></label>`).join('')}` : '<small>No hay cambios de componentes registrados.</small>';
  options.onclick = event => { const button = event.target.closest('[data-component-select-all],[data-component-select-none]'); if (!button) return; event.preventDefault(); localStorage.setItem(bikeStorageKey('componentChartSelection'), JSON.stringify(button.hasAttribute('data-component-select-all') ? names : [])); renderComponentUsageChart(); };
  const saveSelection = values => { localStorage.setItem(bikeStorageKey('componentChartSelection'), JSON.stringify(values)); renderComponentUsageChart(); };
  const points = visibleEvents.filter(item => item.type === 'Mantenimiento').map(item => ({ item, hours: Number(realHoursFor(item)), km: Number(realKmFor(item)) })).filter(point => Number.isFinite(point.hours) && Number.isFinite(point.km) && point.hours >= 0 && point.km >= 0).sort((a, b) => String(a.item.dateISO || '').localeCompare(String(b.item.dateISO || '')));
  const maintenanceRows = visibleEvents.map(item => ({ item, eventIndex: events.indexOf(item) })).filter(({ item }) => item.type === 'Mantenimiento').sort((a, b) => String(a.item.dateISO || '').localeCompare(String(b.item.dateISO || '')));
  const dataTable = document.getElementById('componentUsageDataTable');
  if (dataTable) dataTable.innerHTML = maintenanceRows.length ? `<div class="component-usage-table-wrap"><table><thead><tr><th>Fecha</th><th>Mantenimiento</th><th>Horas reales</th><th>Km reales</th><th>Gráfico</th><th></th></tr></thead><tbody>${maintenanceRows.map(({ item, eventIndex }) => { const hours = realHoursFor(item); const km = realKmFor(item); const valid = Number.isFinite(Number(hours)) && Number.isFinite(Number(km)); return `<tr><td>${safeText(item.date || '')}</td><td>${safeText(item.description || '')}</td><td>${safeText(hours || '—')}</td><td>${safeText(km || '—')}</td><td><span class="chart-data-status ${valid ? 'included' : 'excluded'}">${valid ? 'Incluido' : 'Sin datos reales'}</span></td><td><button type="button" class="usage-event-edit" data-event-index="${eventIndex}">Editar</button></td></tr>`; }).join('')}</tbody></table></div>` : '<p class="component-chart-empty">No hay eventos de mantenimiento registrados.</p>';
  const empty = chart.parentElement.querySelector('.component-chart-empty');
  if (points.length < 2) { chart.innerHTML = ''; if (empty) empty.hidden = false; return; }
  if (empty) empty.hidden = true;
  const reverseAxes = document.getElementById('chartOrientation')?.value === 'kmHours';
  const rawMaxKm = Math.max(1, ...points.map(point => point.km)); const rawMaxHours = Math.max(1, ...points.map(point => point.hours));
  const maxKm = Math.max(1000, Math.ceil(rawMaxKm / 1000) * 1000); const maxHours = Math.max(40, Math.ceil(rawMaxHours / 40) * 40);
  const x = value => 55 + (value / (reverseAxes ? maxHours : maxKm)) * 610; const y = value => 260 - (value / (reverseAxes ? maxKm : maxHours)) * 220;
  const kmTicks = Array.from({ length: Math.floor(maxKm / 1000) + 1 }, (_, index) => index * 1000);
  const hourTicks = Array.from({ length: Math.floor(maxHours / 40) + 1 }, (_, index) => index * 40);
  const xTicks = reverseAxes ? hourTicks : kmTicks;
  const yTicks = reverseAxes ? kmTicks : hourTicks;
  const datedPoints = points.filter(point => /^\d{4}-\d{2}-\d{2}$/.test(String(point.item.dateISO || '')));
  const datePosition = date => { const target = Date.parse(`${date}T12:00:00`); return datedPoints.reduce((best, point) => Math.abs(Date.parse(`${point.item.dateISO}T12:00:00`) - target) < Math.abs(Date.parse(`${best.item.dateISO}T12:00:00`) - target) ? point : best, datedPoints[0]); };
  const firstDate = datedPoints.length ? new Date(`${datedPoints[0].item.dateISO}T12:00:00`) : null;
  const lastDate = datedPoints.length ? new Date(`${datedPoints[datedPoints.length - 1].item.dateISO}T12:00:00`) : null;
  const monthTicks = [];
  const yearLabels = [];
  if (firstDate && lastDate) {
    for (let cursor = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1); cursor <= lastDate; cursor.setMonth(cursor.getMonth() + 1)) {
      const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-01`;
      const point = datePosition(iso); if (!point) continue;
      const timeX = x(reverseAxes ? point.hours : point.km).toFixed(1);
      monthTicks.push(`<line x1="${timeX}" y1="260" x2="${timeX}" y2="266" stroke="#bdb7aa"/>`);
      if (cursor.getMonth() === 0 || cursor.getTime() === new Date(firstDate.getFullYear(), firstDate.getMonth(), 1).getTime()) {
        yearLabels.push(`<line x1="${timeX}" y1="35" x2="${timeX}" y2="260" stroke="#c9c1b4" stroke-width="1.5" stroke-dasharray="4 4"/>`);
        yearLabels.push(`<text x="${timeX}" y="295" text-anchor="middle" fill="#82847f" font-size="10">${cursor.getFullYear()}</text>`);
      }
    }
  }
  const timeScale = `${monthTicks.join('')}${yearLabels.join('')}`;
  const grid = `${xTicks.map(value => `<line x1="${x(value).toFixed(1)}" y1="35" x2="${x(value).toFixed(1)}" y2="260" stroke="#eee9df"/><text x="${x(value).toFixed(1)}" y="278" text-anchor="middle" fill="#82847f" font-size="10">${Math.round(value).toLocaleString('es-ES')}</text>`).join('')}${yTicks.map(value => `<line x1="55" y1="${y(value).toFixed(1)}" x2="665" y2="${y(value).toFixed(1)}" stroke="#eee9df"/><text x="45" y="${(y(value) + 3).toFixed(1)}" text-anchor="end" fill="#82847f" font-size="10">${value}</text>`).join('')}${timeScale}`;
  const path = points.map((point, index) => `${index ? 'L' : 'M'}${x(reverseAxes ? point.hours : point.km).toFixed(1)} ${y(reverseAxes ? point.km : point.hours).toFixed(1)}`).join(' ');
  const selectedColors = ['#ef7620', '#8063b7', '#30956b', '#4a79c7', '#cf8b19', '#b85555'];
  const componentPoints = events.filter(item => item.type === 'Sustitución de componente').map(item => ({ item, hours: Number(item.realHours), km: Number(item.realKm) })).filter(point => Number.isFinite(point.hours) && Number.isFinite(point.km) && point.hours >= 0 && point.km >= 0);
  const markers = componentPoints.flatMap(point => { const changed = (point.item.componentChanges || [point.item.componentChange]).map(change => change?.name).filter(Boolean); return [...selected].filter(name => changed.includes(name)).map(name => `<circle cx="${x(reverseAxes ? point.hours : point.km).toFixed(1)}" cy="${y(reverseAxes ? point.km : point.hours).toFixed(1)}" r="6" fill="#fff" stroke="${selectedColors[[...selected].indexOf(name) % selectedColors.length]}" stroke-width="3"><title>${safeText(name)} · ${safeText(point.item.date || '')} · ${point.hours} h · ${point.km} km</title></circle>`); }).join('');
  chart.innerHTML = `${grid}<defs><clipPath id="usagePlotClip"><rect x="55" y="35" width="615" height="225"/></clipPath></defs><line x1="55" y1="260" x2="670" y2="260" stroke="#d8d5cd"/>${timeScale}<line x1="55" y1="260" x2="55" y2="35" stroke="#d8d5cd"/><g id="usagePlot" clip-path="url(#usagePlotClip)"><path d="${path}" fill="none" stroke="#ef7620" stroke-width="3"/><g fill="#ef7620">${points.map(point => `<circle cx="${x(reverseAxes ? point.hours : point.km).toFixed(1)}" cy="${y(reverseAxes ? point.km : point.hours).toFixed(1)}" r="3"/>`).join('')}</g>${markers}</g><text x="360" y="316" text-anchor="middle" fill="#82847f" font-size="11">${reverseAxes ? 'Horas reales' : 'Kilómetros reales'} · Tiempo</text><text x="14" y="150" transform="rotate(-90 14 150)" text-anchor="middle" fill="#82847f" font-size="11">${reverseAxes ? 'Kilómetros reales' : 'Horas reales'}</text>`;
  document.getElementById('chartOrientation')?.addEventListener('change', renderComponentUsageChart);
  options.querySelectorAll('input').forEach(input => input.addEventListener('change', () => saveSelection([...options.querySelectorAll('input:checked')].map(field => field.value))));
}
function renderComponents() {
  const grid = document.querySelector('#view-componentes .component-grid');
  if (!grid) return;
  const iconFor = item => /cadena|corona|piñón|guía/i.test(item.name) ? '⛓' : /freno|disco|líquido/i.test(item.name) ? '◉' : /rueda|cámara|mousse|neumático|radios/i.test(item.name) ? '◌' : /horquilla|amortiguador/i.test(item.name) ? '╱' : /motor|pistón|segmentos|biela|embrague|bujía|cilindro/i.test(item.name) ? '⚙' : '◆';
  const imageSources = {
    drivetrain: 'assets/components/drivetrain.svg',
    engine: 'assets/components/engine.svg',
    suspension: 'assets/components/suspension.svg',
    consumables: 'assets/components/consumables.svg',
    wheel: 'assets/components/wheel.svg',
    brakes: 'assets/components/brakes.svg',
    exhaust: 'assets/components/exhaust.svg',
    electrical: 'assets/components/electrical.svg'
  };
  const sourceFor = item => /cadena|corona|piñón|guía/i.test(item.name) ? imageSources.drivetrain : /horquilla|amortiguador|cojinete|rodamiento/i.test(item.name) ? imageSources.suspension : /pistón|segmentos|biela|embrague|cilindro|caja de cambios/i.test(item.name) ? imageSources.engine : /freno|disco/i.test(item.name) ? imageSources.brakes : /cámara|mousse|neumático|radios|rueda/i.test(item.name) ? imageSources.wheel : /escape|silencioso|fibra/i.test(item.name) ? imageSources.exhaust : /batería|motor de arranque/i.test(item.name) ? imageSources.electrical : imageSources.consumables;
  const fallbackFor = item => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="52" viewBox="0 0 64 52"><rect width="64" height="52" rx="9" fill="#fff1e6"/><text x="32" y="34" text-anchor="middle" font-size="24" fill="#ef7620">${iconFor(item)}</text></svg>`)}`;
  const imageFor = item => sourceFor(item);
  const lastChange = item => item.lastChange ? `${safeText(item.lastChange.date)} · ${safeText(item.lastChange.realHours || '—')} h · ${safeText(item.lastChange.realKm || '—')} km` : 'Sin cambio registrado';
  const scheduleLabel = item => ({ hours: 'Horas marcador', km: 'Kilómetros marcador', date: 'Fecha', state: 'Por estado' }[item.nextChangePlan?.mode] || (item.intervalHours ? 'Horas marcador' : 'Por estado'));
  const nextChange = (item, source) => { const plan = item.nextChangePlan; if (source === 'type') return scheduleLabel(item); if (plan?.mode === 'date') return safeText(plan.value || 'Sin fecha'); if (plan?.mode === 'km') return plan.value ? `${safeText(plan.value)} km` : 'Por estado'; if (plan?.mode === 'state') return 'Por estado'; const field = source === 'marker' ? 'markerHours' : 'realHours'; const linkedEvent = Number.isInteger(item.lastChange?.eventIndex) ? events[item.lastChange.eventIndex] : [...events].reverse().find(event => event.type === 'Sustitución de componente' && ((event.componentChanges || [event.componentChange]).some(change => change?.name === item.name) || event.dateISO === item.lastChange?.dateISO)); const storedHours = Number(item.lastChange?.[field] ?? item.history?.[0]?.[field]); const linkedHours = Number(linkedEvent?.[field] ?? (source === 'marker' ? linkedEvent?.hours : linkedEvent?.realHours)); const hours = Number.isFinite(storedHours) && storedHours > 0 ? storedHours : linkedHours; if (!Number.isFinite(hours) || !item.intervalHours) return item.intervalHours ? `${item.intervalHours} h teóricas` : 'Por estado'; return `${Math.round(hours + item.intervalHours).toLocaleString('es-ES')} h`; };
  const nextChangeOverdue = item => { const plan = item.nextChangePlan; if (plan?.mode === 'state') return false; if (plan?.mode === 'date') { const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(plan.value || '')); return !!match && `${match[3]}-${match[2]}-${match[1]}` < todayISO(); } if (plan?.mode === 'km') return Number(plan.value) > 0 && Number(bikeData.markerKm) >= Number(plan.value); const last = Number(item.lastChange?.markerHours ?? item.history?.[0]?.markerHours); return Number.isFinite(last) && Number(item.intervalHours) > 0 && Number(bikeData.markerHours) >= last + Number(item.intervalHours); };
  const averageCost = item => { const values = (item.history || []).map(change => { const raw = String(change.cost || '').replace(/[^0-9,.-]/g, ''); return Number(raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw); }).filter(Number.isFinite); if (!values.length && item.catalogPrice == null) return 'Pendiente'; const total = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : Number(item.catalogPrice); return `${total.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`; };
  const sortMode = document.getElementById('componentSort')?.value || 'name';
  const dateValue = item => { const plan = item.nextChangePlan; if (sortMode.startsWith('next-') && plan?.mode === 'date' && /^\d{2}\/\d{2}\/\d{4}$/.test(plan.value)) { const [day, month, year] = plan.value.split('/'); return `${year}-${month}-${day}`; } return String(item.lastChange?.dateISO || ''); };
  const sortedComponents = componentRecords.filter(item => item.lastChange || (item.history || []).length).sort((a, b) => { if (sortMode === 'name') return String(a.name || '').localeCompare(String(b.name || ''), 'es', { sensitivity: 'base' }); const av = dateValue(a); const bv = dateValue(b); if (!av && bv) return 1; if (av && !bv) return -1; const direction = sortMode.endsWith('oldest') ? 1 : -1; return direction * av.localeCompare(bv); });
  const table = sortedComponents.length ? `<div class="component-table-scroll"><table class="component-table"><thead><tr><th scope="col"><button class="component-sort-trigger" data-sort-column="name">Componente <span>▾</span></button></th><th scope="col"><button class="component-sort-trigger" data-sort-column="last">Cambio realizado <span>▾</span></button></th><th scope="col"><button class="component-sort-trigger" data-sort-column="next">Programar por <span>▾</span></button></th><th scope="col">Próximo cambio horas marcador</th></tr></thead><tbody>${sortedComponents.map(item => { const history = (item.history?.length ? item.history : [item.lastChange]).filter(Boolean).sort((a, b) => String(b.dateISO || '').localeCompare(String(a.dateISO || ''))); const hasHistory = history.length > 1; const groupId = `component-group-${encodeURIComponent(item.name)}`; const actions = change => `<button class="component-record-edit" data-event-index="${change.eventIndex}" aria-label="Editar registro">✎</button><button class="component-record-delete" data-event-index="${change.eventIndex}" aria-label="Eliminar registro">🗑</button>`; return `<tr class="component-group-row"><th scope="row"><button type="button" class="component-history-toggle" data-component-group="${groupId}" aria-expanded="false" ${hasHistory ? '' : 'disabled'}>▸</button><strong>${safeText(item.name)}</strong><small>${safeText(item.category || 'Otros')}${item.reference ? ` · Ref. ${safeText(item.reference)}` : ''}</small></th><td>${lastChange(item)} ${actions(history[0])}</td><td><span>${nextChange(item, 'type')}</span> <button type="button" class="component-next-edit" data-component-name="${safeText(item.name)}">Editar</button></td><td><span>${nextChange(item, 'marker')}</span></td></tr>${history.slice(1).map(change => `<tr class="component-history-row" data-component-parent="${groupId}" hidden><th scope="row"><span>↳ ${safeText(item.name)}</span></th><td>${safeText(change.date || 'Sin fecha')} · ${safeText(change.realHours || '—')} h · ${safeText(change.realKm || '—')} km ${actions(change)}</td><td>—</td></tr>`).join('')}`; }).join('')}</tbody></table></div>` : '<div class="component-empty-state">Todavía no hay cambios de componentes registrados en el Libro de vida.</div>';
  grid.innerHTML = `${table}<p class="component-source-note">Solo se muestran componentes sustituidos o cambiados desde un evento.</p>`;
  grid.querySelectorAll('.component-group-row').forEach((row, index) => { if (nextChangeOverdue(sortedComponents[index])) row.querySelector('td:last-child span')?.classList.add('component-overdue'); });
  renderComponentUsageChart();
  grid.querySelectorAll('.component-thumbnail').forEach(image => image.addEventListener('error', () => { image.src = image.dataset.fallback; }, { once: true }));
}
document.addEventListener('click', event => { const button = event.target.closest('.usage-event-edit'); if (!button) return; event.preventDefault(); eventReturnView = 'uso'; const target = document.querySelector(`#timeline .event-edit[data-event-index="${button.dataset.eventIndex}"]`); if (target) target.click(); else { showView('vida'); const retry = document.querySelector(`#timeline .event-edit[data-event-index="${button.dataset.eventIndex}"]`); retry?.click(); } });
document.addEventListener('click', event => { const toggle = event.target.closest('.component-history-toggle'); if (!toggle || toggle.disabled) return; const expanded = toggle.getAttribute('aria-expanded') === 'true'; toggle.setAttribute('aria-expanded', String(!expanded)); toggle.textContent = expanded ? '▸' : '▾'; document.querySelectorAll(`[data-component-parent="${toggle.dataset.componentGroup}"]`).forEach(row => { row.hidden = expanded; }); });
document.addEventListener('click', event => { const trigger = event.target.closest('.component-sort-trigger'); if (!trigger) return; const column = trigger.dataset.sortColumn; const key = bikeStorageKey(`componentSortDir:${column}`); const direction = localStorage.getItem(key) === 'asc' ? 'desc' : 'asc'; localStorage.setItem(key, direction); const select = document.getElementById('componentSort'); if (select) select.value = column === 'name' ? 'name' : `${column === 'last' ? 'last' : 'next'}-${direction === 'asc' ? 'oldest' : 'newest'}`; renderComponents(); });
document.addEventListener('click', event => { const button = event.target.closest('.component-record-edit,.component-record-delete'); if (!button) return; const index = Number(button.dataset.eventIndex); const item = events[index]; if (!item) { window.alert('Este registro ya no está disponible. Recarga la aplicación para actualizar la lista.'); return; } if (button.classList.contains('component-record-delete')) { openDeleteConfirmation(`Sustitución de ${button.closest('tr')?.querySelector('th strong')?.textContent || 'componente'}`, () => { if (Array.isArray(item.componentChanges) && item.componentChanges.length > 1) { const componentName = button.closest('tr')?.querySelector('th strong')?.textContent?.trim(); item.componentChanges = item.componentChanges.filter(change => change.name !== componentName); item.componentChange = item.componentChanges[0] || null; } else events.splice(index, 1); saveEvents(); syncComponentsFromEvents(); renderTimeline(); renderUsageChart(); updateBikeView(); }); return; } eventReturnView = 'componentes'; showView('vida'); const target = document.querySelector(`#timeline .event-edit[data-event-index="${index}"]`); if (target) target.click(); else window.alert('Este registro ya no está disponible. Recarga la aplicación para actualizar la lista.'); });
document.addEventListener('click', event => {
  const button = event.target.closest('.component-next-edit');
  if (!button) return;
  const record = componentRecords.find(item => item.name === button.dataset.componentName);
  if (!record) return;
  const storedPlan = record.nextChangePlan;
  const markerBase = Number(record.lastChange?.markerHours);
  const calculatedMarker = Number.isFinite(markerBase) && record.intervalHours ? Math.round(markerBase + record.intervalHours) : '';
  const current = storedPlan?.mode === 'hours' && Number(storedPlan.value) === Number(record.intervalHours) && calculatedMarker ? calculatedMarker : (storedPlan?.value || calculatedMarker || '');
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `<section class="modal component-plan-dialog" role="dialog" aria-modal="true"><button type="button" class="modal-close" aria-label="Cerrar">×</button><p class="eyebrow">Programación</p><h2>Próximo cambio</h2><p class="modal-subtitle">${safeText(record.name)}</p><label>Programar por<select data-plan-mode><option value="hours">Horas marcador</option><option value="km">Kilómetros marcador</option><option value="date">Fecha</option><option value="state">Por estado</option></select></label><label data-plan-value-label>Valor<input data-plan-value value="${safeText(current)}" placeholder="Horas, kilómetros o DD/MM/AAAA" /></label><div class="modal-actions"><button type="button" class="quiet-button" data-plan-cancel>Cancelar</button><button type="button" class="primary-button" data-plan-save>Guardar</button></div></section>`;
  document.body.appendChild(backdrop);
  const mode = backdrop.querySelector('[data-plan-mode]'); const input = backdrop.querySelector('[data-plan-value]');
  if (record.nextChangePlan?.mode) mode.value = record.nextChangePlan.mode;
  const updatePlaceholder = () => { const valueLabel = backdrop.querySelector('[data-plan-value-label]'); const isDate = mode.value === 'date'; if (isDate && record.nextChangePlan?.mode !== 'date') input.value = ''; input.placeholder = 'DD/MM/AAAA'; input.disabled = !isDate; valueLabel.hidden = !isDate; valueLabel.style.display = isDate ? '' : 'none'; };
  mode.addEventListener('change', updatePlaceholder); updatePlaceholder(); input.focus();
  const close = () => backdrop.remove();
  backdrop.querySelector('[data-plan-cancel]').addEventListener('click', close); backdrop.querySelector('.modal-close').addEventListener('click', close);
  backdrop.querySelector('[data-plan-save]').addEventListener('click', () => { const value = input.value.trim(); if (mode.value === 'date' && (!value || !/^\d{2}\/\d{2}\/\d{4}$/.test(value))) { window.alert('Indica la fecha con formato DD/MM/AAAA.'); return; } record.nextChangePlan = { mode: mode.value, value: mode.value === 'date' ? value : '' }; saveComponents(); close(); renderComponents(); });
  backdrop.addEventListener('click', event => { if (event.target === backdrop) close(); });
});
function maintenanceSchedule(label) { return MaintenanceSchedule.calculate(events, label, bikeData.realHours, todayISO()); }
function scheduleText(schedule) {
  const format = value => Number(value).toLocaleString('es-ES', { maximumFractionDigits: 3 });
  if (schedule.status === 'not_hourly') return 'Este intervalo no se calcula por horas.';
  if (schedule.status === 'no_history') return 'Sin revisión válida de referencia. Registra una revisión completada con fecha y horas reales.';
  const basis = `Última válida: ${format(schedule.base)} h · ${schedule.last.dateISO}. Próxima: ${format(schedule.due)} h reales.`;
  if (schedule.status === 'inconsistent') return `${basis} Revisa las horas actuales: son inferiores a las de la revisión o no son válidas.`;
  if (schedule.status === 'overdue') return `${basis} Retraso de ${format(-schedule.remaining)} h: supera el margen del 25 % (${format(schedule.tolerance)} h).`;
  if (schedule.status === 'within_margin') return `${basis} Retraso de ${format(-schedule.remaining)} h, dentro del margen del 25 % (${format(schedule.tolerance)} h).`;
  if (schedule.status === 'due') return `${basis} Toca ahora.`;
  return `${basis} Faltan ${format(schedule.remaining)} h.`;
}
function nextMaintenanceSchedule() {
  const schedules = ['Cada 20 horas', 'Cada 40 horas'].map(maintenanceSchedule);
  return schedules.find(schedule => schedule.status === 'inconsistent') || schedules.filter(schedule => schedule.remaining != null).sort((a, b) => a.due - b.due)[0] || schedules[0];
}
function markSchedule(element, schedule) {
  element.dataset.scheduleStatus = schedule.status;
  let badge = element.querySelector('.schedule-badge');
  if (!badge) { badge = document.createElement('div'); badge.className = 'schedule-badge'; element.appendChild(badge); }
  badge.textContent = ({ overdue: '⚠ Margen del 25 % superado', within_margin: '⚠ Revisión pendiente · dentro del margen del 25 %', due: '⚠ Revisión pendiente · toca ahora', inconsistent: '⚠ Revisar las horas registradas', no_history: 'Sin revisión válida de referencia' })[schedule.status] || '';
  badge.hidden = !badge.textContent;
}
function renderTodayView() {
  const view = document.getElementById('view-hoy');
  if (!view) return;
  const currentHours = Math.round(Number(bikeData.realHours));
  const nextMaintenance = nextMaintenanceSchedule();
  const latestEvents = [...events].sort((a, b) => String(b.dateISO || '').localeCompare(String(a.dateISO || ''))).slice(0, 3);
  view.querySelector('.page-heading .subtitle').textContent = `Esto es lo que necesita tu ${bikeData.brand} hoy.`;
  view.querySelector('.hero-card h2').textContent = `${bikeData.brand} ${bikeData.model}`;
  view.querySelector('.hero-card p').textContent = latestEvents[0] ? `Último registro: ${latestEvents[0].date}` : 'Todavía no hay registros para esta moto.';
  const firstTask = view.querySelector('#taskGrid .task-card');
  if (firstTask) {
    firstTask.querySelector('.task-due').textContent = nextMaintenance.status === 'overdue' ? 'Fuera de margen' : nextMaintenance.status === 'within_margin' ? 'Dentro del margen' : nextMaintenance.status === 'due' ? 'Toca ahora' : nextMaintenance.status === 'upcoming' ? `En ${nextMaintenance.remaining.toLocaleString('es-ES')} h` : 'Revisar referencia';
    firstTask.querySelector('h3').textContent = `Revisión · ${nextMaintenance.label}`;
    firstTask.querySelector('p').textContent = scheduleText(nextMaintenance);
    // A dashboard checkbox is not evidence of a completed workshop checklist.
    firstTask.querySelector('.check-row')?.remove();
    markSchedule(firstTask.querySelector('.task-content'), nextMaintenance);
  }
  const activityCard = view.querySelector('.activity-card');
  if (activityCard) activityCard.innerHTML = latestEvents.length ? latestEvents.map(item => `<div class="activity-item"><div class="activity-icon ${eventClass(item.type)}">${eventIcon(item.type)}</div><div class="activity-main"><strong>${eventTitle(item)}</strong><span>${safeText(item.date)}${eventReadings(item) ? ` · ${safeText(eventReadings(item))}` : ''}</span></div><strong class="activity-cost">${safeText(item.cost || '—')}</strong></div>`).join('') : '<div class="empty-state">Todavía no hay actividad registrada para esta moto.</div>';
}
function updateBikeView() {
  renderBikeIdentity();
  const setText = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value; };
  setText('bikeName', `${bikeData.brand} ${bikeData.model}`);
  setText('bikeSubtitle', `${bikeData.year}`);
  setText('bikeBrand', bikeData.brand);
  setText('bikeModel', bikeData.model);
  setText('bikeYear', bikeData.year);
  const bikePhoto = document.getElementById('bikePhoto');
  if (bikePhoto) bikePhoto.src = profilePhoto(bikeData);
  const heroBikePhoto = document.getElementById('heroBikePhoto');
  if (heroBikePhoto) { heroBikePhoto.src = profilePhoto(bikeData); heroBikePhoto.alt = `${bikeData.brand} ${bikeData.model}`; }
  setText('realHours', `${Math.round(Number(bikeData.realHours)).toLocaleString('es-ES')} h`);
  setText('markerHours', `${Math.round(Number(bikeData.markerHours)).toLocaleString('es-ES')} h`);
  setText('realKm', `${Number(bikeData.realKm).toLocaleString('es-ES')} km`);
  setText('markerKm', `${Number(bikeData.markerKm).toLocaleString('es-ES')} km`);
  const displayDate = value => value ? formatDate(value) : 'Sin indicar';
  setText('bikeItvNext', displayDate(bikeData.itvNextDate));
  setText('bikeInsuranceExpiry', displayDate(bikeData.insuranceExpiryDate));
  const dashboardCards = document.querySelectorAll('#view-dashboard .stat-card');
  if (dashboardCards.length >= 2) {
    const realHours = Math.round(Number(bikeData.realHours)).toLocaleString('es-ES');
    const realKm = Math.round(Number(bikeData.realKm)).toLocaleString('es-ES');
    const markerHours = Math.round(Number(bikeData.markerHours)).toLocaleString('es-ES');
    const markerKm = Math.round(Number(bikeData.markerKm)).toLocaleString('es-ES');
    dashboardCards[0].querySelector('strong').innerHTML = `${realHours} <small>h</small>`;
    dashboardCards[1].querySelector('strong').innerHTML = `${realKm} <small>km</small>`;
    dashboardCards[0].querySelector('.stat-reference')?.remove();
    dashboardCards[1].querySelector('.stat-reference')?.remove();
    dashboardCards[0].insertAdjacentHTML('beforeend', `<span class="stat-reference">Marcador: ${markerHours} h</span>`);
    dashboardCards[1].insertAdjacentHTML('beforeend', `<span class="stat-reference">Marcador: ${markerKm} km</span>`);
    const totalCost = events.reduce((sum, item) => { const value = readingNumber(String(item.cost || '').replace('€', '').trim()); return sum + (Number.isFinite(value) ? value : 0); }, 0);
    if (dashboardCards[3]) {
      dashboardCards[3].querySelector('strong').innerHTML = `${totalCost.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <small>€</small>`;
      dashboardCards[3].querySelector('em').textContent = `${events.length} ${events.length === 1 ? 'evento registrado' : 'eventos registrados'}`;
    }
    if (dashboardCards[2]) {
      const currentHours = Math.round(Number(bikeData.realHours));
      const next = nextMaintenanceSchedule();
      dashboardCards[2].querySelector('strong').textContent = next.due != null ? `${next.due.toLocaleString('es-ES')} h` : 'Sin referencia';
      dashboardCards[2].querySelector('em').textContent = `${next.label}. ${scheduleText(next)}`;
      markSchedule(dashboardCards[2], next);
    }
  }
  document.querySelector('#view-dashboard .page-heading .subtitle').textContent = `Una lectura rápida del estado y uso de tu ${bikeData.brand} ${bikeData.model}.`;
  const intervals = document.querySelectorAll('#view-mantenimiento .interval-card');
  if (intervals.length >= 2) {
    const currentHours = Math.round(Number(bikeData.realHours));
    const quick = maintenanceSchedule('Cada 20 horas');
    const extended = maintenanceSchedule('Cada 40 horas');
    intervals[0].querySelector('h2').textContent = 'Revisión de 20 horas';
    intervals[0].querySelector('strong').textContent = quick.due != null ? `${quick.due.toLocaleString('es-ES')} h` : 'Sin referencia';
    intervals[0].querySelector('p').textContent = scheduleText(quick);
    intervals[1].querySelector('h2').textContent = 'Revisión de 40 horas';
    intervals[1].querySelector('strong').textContent = extended.due != null ? `${extended.due.toLocaleString('es-ES')} h` : 'Sin referencia';
    intervals[1].querySelector('p').textContent = scheduleText(extended);
    markSchedule(intervals[0], quick);
    markSchedule(intervals[1], extended);
    [quick, extended].forEach((schedule, index) => {
      intervals[index].querySelector('.interval-foot').textContent = `Margen de planificación: ${schedule.interval * 0.25} h (25 %). Aviso informativo, sin bloquear salidas.`;
      intervals[index].querySelector('.interval-label').textContent = schedule.label;
      const progress = intervals[index].querySelector('.progress-line');
      progress.hidden = schedule.remaining == null;
      progress.querySelector('i').style.width = `${schedule.remaining == null ? 0 : Math.min(100, Math.max(0, (1 - schedule.remaining / schedule.interval) * 100))}%`;
    });
  }
  const upcomingTask = document.querySelector('#view-dashboard .next-work');
  if (upcomingTask) {
    const next = nextMaintenanceSchedule();
    upcomingTask.querySelector('.work-date strong').textContent = next.due != null ? next.due.toLocaleString('es-ES') : '—';
    upcomingTask.querySelector('.work-date span').textContent = 'h reales';
    upcomingTask.querySelector('.work-date + div > strong').textContent = `Revisión · ${next.label}`;
    upcomingTask.querySelector('p').textContent = scheduleText(next);
    markSchedule(upcomingTask.querySelector('.work-date + div'), next);
  }
  renderTodayView();
  renderAllBikeProfiles();
}
function selectBike(id) {
  if (!bikeProfiles.some(profile => profile.id === id)) return;
  // Pulsar una moto siempre lleva a su página de inicio (Mis motos),
  // incluso si ya era la moto seleccionada.
  if (id === activeBikeId) {
    sessionStorage.setItem('motoShowAll', '0');
    showView('motos');
    return;
  }
  saveBikeProfiles();
  sessionStorage.setItem('motoShowAll', '0');
  sessionStorage.setItem('motoReturnView', 'motos');
  localStorage.setItem('activeBikeId', id);
  window.location.reload();
}
function renderBikeIdentity() {
  const name = `${bikeData.brand} ${bikeData.model}`;
  const detail = `${bikeData.year}`;
  document.title = `Mis motos · ${name}`;
  pages.forEach(page => {
    if (page.id === 'view-motos') return;
    let identity = page.querySelector('.selected-bike-context');
    if (!identity) {
      identity = document.createElement('div');
      identity.className = 'selected-bike-context';
      identity.innerHTML = '<img class="selected-bike-photo" /><div class="selected-bike-details"><small>Moto seleccionada</small><strong></strong><span></span><em class="selected-bike-marker"></em></div><button type="button" class="quiet-button">Cambiar moto</button>';
      identity.querySelector('button').addEventListener('click', () => showView('motos'));
      page.querySelector('.page-heading').after(identity);
    }
    identity.querySelector('strong').textContent = name;
    identity.querySelector('span').textContent = detail;
    const markerText = `${Number(bikeData.markerHours || 0).toLocaleString('es-ES')} h marcador · ${Number(bikeData.markerKm || 0).toLocaleString('es-ES')} km marcador`;
    identity.querySelector('.selected-bike-marker').textContent = markerText;
    identity.querySelector('.selected-bike-photo').src = profilePhoto(bikeData);
    identity.querySelector('.selected-bike-photo').alt = name;
  });
}
function latestMaintenanceEvent() {
  return [...events].filter(item => item.type === 'Mantenimiento').sort((a, b) => String(b.dateISO || '').localeCompare(String(a.dateISO || '')))[0] || null;
}
function renderAllBikeProfiles() {
  const view = document.getElementById('view-motos');
  const selected = view.querySelector('.bike-profile');
  selected.classList.add('selected-profile');
  selected.querySelector('.status-pill')?.remove();
  selected.querySelector('.profile-id').textContent = `ID · ${activeBikeId}`;
  selected.querySelector('#bikePhoto').alt = `${bikeData.brand} ${bikeData.model}`;
  selected.querySelector('.photo-label').textContent = profilePhoto(bikeData).endsWith('moto-sin-foto.svg') ? 'Añade una foto desde Editar ficha' : `${bikeData.brand} ${bikeData.model}`;
  if (!selected.querySelector('.delete-bike-button') && bikeProfiles.length > 1) { const button = document.createElement('button'); button.type = 'button'; button.className = 'primary-button delete-bike-button'; button.textContent = 'Eliminar ficha'; button.addEventListener('click', () => deleteBike(activeBikeId)); selected.querySelector('.profile-title')?.appendChild(button); }
  const latest = latestMaintenanceEvent();
  const selectedGrid = selected.querySelector('.detail-grid');
  if (selectedGrid) {
    const displayDate = value => value ? formatDate(value) : 'Sin indicar';
    selectedGrid.innerHTML = `<div><span>Horas reales</span><strong>${Math.round(Number(bikeData.realHours)).toLocaleString('es-ES')} h</strong></div><div><span>Kilómetros reales</span><strong>${Number(bikeData.realKm).toLocaleString('es-ES')} km</strong></div><div><span>Próxima ITV</span><strong>${safeText(displayDate(bikeData.itvNextDate))}</strong></div><div><span>Caducidad del seguro</span><strong>${safeText(displayDate(bikeData.insuranceExpiryDate))}</strong></div><div class="last-maintenance-detail"><span>Último mantenimiento</span><strong>${safeText(latest?.description || 'Sin mantenimientos registrados')}</strong><small>${safeText(latest?.date || 'Registra el primero desde Mantenimiento')}</small></div>`;
  }
  view.querySelector('.page-heading .subtitle').textContent = `${bikeProfiles.length} ${bikeProfiles.length === 1 ? 'moto guardada' : 'motos guardadas'}. Selecciona una ficha para consultar su actividad y mantenimiento.`;
  let others = view.querySelector('.other-bike-profiles');
  if (!others) {
    others = document.createElement('div');
    others.className = 'other-bike-profiles';
    selected.after(others);
  }
  others.replaceChildren();
  if (sessionStorage.getItem('motoShowAll') === '1') bikeProfiles.filter(profile => profile.id !== activeBikeId).forEach(profile => {
    const card = document.createElement('section');
    card.className = 'bike-profile';
    card.innerHTML = '<div class="profile-visual"></div><div class="profile-details"><div class="profile-title"><div><h2></h2><p></p></div><button type="button" class="primary-button">Seleccionar moto</button></div><div class="detail-grid"></div></div>';
    card.querySelector('h2').textContent = `${profile.brand} ${profile.model}`;
    card.querySelector('.profile-title p').textContent = `${profile.year}`;
    card.querySelector('button').addEventListener('click', () => selectBike(profile.id));
    const deleteButton = document.createElement('button'); deleteButton.type = 'button'; deleteButton.className = 'primary-button delete-bike-button'; deleteButton.textContent = 'Eliminar ficha'; deleteButton.addEventListener('click', () => deleteBike(profile.id)); card.querySelector('.profile-title')?.appendChild(deleteButton);
    const photoSrc = profilePhoto(profile);
    if (!photoSrc.endsWith('moto-sin-foto.svg')) {
      const photo = document.createElement('img');
      photo.src = photoSrc;
      photo.alt = `${profile.brand} ${profile.model}`;
      card.querySelector('.profile-visual').appendChild(photo);
    } else {
      card.querySelector('.profile-visual').textContent = 'Sin foto';
    }
    const displayDate = value => value ? formatDate(value) : 'Sin indicar';
    const fields = [['Marca', profile.brand], ['Modelo', profile.model], ['Año', profile.year],  ['Horas reales', `${Number(profile.realHours || 0).toLocaleString('es-ES')} h`], ['Kilómetros reales', `${Number(profile.realKm || 0).toLocaleString('es-ES')} km`], ['Próxima ITV', displayDate(profile.itvNextDate)], ['Caducidad del seguro', displayDate(profile.insuranceExpiryDate)], ['Horas del marcador', `${Number(profile.markerHours || 0).toLocaleString('es-ES')} h`], ['Kilómetros del marcador', `${Number(profile.markerKm || 0).toLocaleString('es-ES')} km`]];
    fields.forEach(([label, value]) => {
      const field = document.createElement('div');
      const caption = document.createElement('span');
      const content = document.createElement('strong');
      caption.textContent = label;
      content.textContent = value;
      field.append(caption, content);
      card.querySelector('.detail-grid').appendChild(field);
    });
    others.appendChild(card);
  });
}
function deleteBike(id) {
  const profile = bikeProfiles.find(item => item.id === id);
  if (!profile || bikeProfiles.length < 2) return;
  if (!window.confirm(`¿Eliminar la moto ${profile.brand} ${profile.model}? Sus datos de esta cuenta se conservarán en la copia de seguridad antes de borrarla.`)) return;
  if (!localStorage.getItem('motoCatalogBackup')) localStorage.setItem('motoCatalogBackup', JSON.stringify({ createdAt: new Date().toISOString(), profiles: bikeProfiles }));
  const deleted = JSON.parse(localStorage.getItem('motoDeletedProfiles') || '[]');
  if (!deleted.includes(id)) deleted.push(id);
  localStorage.setItem('motoDeletedProfiles', JSON.stringify(deleted));
  bikeProfiles = bikeProfiles.filter(item => item.id !== id);
  localStorage.setItem('motoProfiles', JSON.stringify(bikeProfiles));
  Object.keys(localStorage).filter(key => key.endsWith(`:${id}`)).forEach(key => localStorage.removeItem(key));
  activeBikeId = bikeProfiles[0].id; localStorage.setItem('activeBikeId', activeBikeId); window.location.reload();
}
updateBikeView();
syncComponentsFromEvents();
function saveBikeProfiles() {
  const current = { ...bikeData, id: activeBikeId };
  const index = bikeProfiles.findIndex(profile => profile.id === activeBikeId);
  if (index >= 0) bikeProfiles[index] = current; else bikeProfiles.push(current);
  localStorage.setItem('motoProfiles', JSON.stringify(bikeProfiles));
  localStorage.setItem('motoProfile', JSON.stringify(current));
}
function renderBikeSwitcher() {
  const switcher = document.querySelector('.bike-switcher');
  if (!switcher) return;
  const sections = [{ view: 'vida', label: 'Libro de vida', icon: '↗', tooltip: 'Consulta el historial de salidas, mantenimientos y documentos.' }, { view: 'mantenimiento', label: 'Mantenimiento', icon: '⌁', tooltip: 'Inicia una revisión y completa sus tareas.' }, { view: 'componentes', label: 'Componentes', icon: '◫', tooltip: 'Consulta el estado y la vida útil de los componentes.' }, { view: 'uso', label: 'Gráficos', icon: '▥', tooltip: 'Analiza horas, kilómetros y cambios de componentes.' }];
  switcher.innerHTML = `<button type="button" class="bike-list-heading" id="allBikesButton">Mis motos</button><div class="bike-tree" aria-label="Mis motos">${bikeProfiles.map(profile => `<div class="bike-tree-item"><button type="button" class="bike-list-item ${profile.id === activeBikeId ? 'active' : ''}" aria-pressed="${profile.id === activeBikeId}" data-bike-id="${safeText(profile.id)}"><img src="${profilePhoto(profile)}" alt="" /><span><strong>${safeText(`${profile.brand} ${profile.model}`)}</strong><small>${safeText(`${profile.year}`)}</small></span><b aria-hidden="true">${profile.id === activeBikeId ? '⌄' : '›'}</b></button>${profile.id === activeBikeId ? `<div class="bike-section-list">${sections.map(section => `<button type="button" class="bike-section-item" data-section-view="${section.view}" data-tooltip="${section.tooltip}"><span>${section.icon}</span>${section.label}</button>`).join('')}</div>` : ''}</div>`).join('')}</div><button type="button" class="sidebar-add-bike" id="addBikeSidebar"><span>＋</span> Añadir moto</button>`;
  switcher.querySelector('#allBikesButton')?.addEventListener('click', () => { sessionStorage.setItem('motoShowAll', '1'); showView('motos'); });
  switcher.querySelectorAll('.bike-list-item').forEach(button => button.addEventListener('click', () => selectBike(button.dataset.bikeId)));
  switcher.querySelectorAll('.bike-section-item').forEach(button => button.addEventListener('click', event => { event.stopPropagation(); showView(button.dataset.sectionView); }));
}
renderBikeSwitcher();
document.querySelectorAll('.nav-item[data-view]').forEach(item => item.remove());
document.querySelector('.nav')?.remove();
let creatingBike = false;
const addBikeButton = document.createElement('button');
addBikeButton.className = 'primary-button sidebar-only-add-bike';
addBikeButton.id = 'addBike';
addBikeButton.innerHTML = '<span>＋</span> Añadir moto';
document.querySelector('.bike-switcher')?.addEventListener('click', event => { if (event.target.closest('#addBikeSidebar')) addBikeButton.click(); });
document.querySelector('#view-motos .page-heading')?.appendChild(addBikeButton);
const editBikeButton = document.getElementById('editBike');
document.querySelector('#view-motos .profile-title')?.appendChild(editBikeButton);
addBikeButton.addEventListener('click', () => {
  creatingBike = true;
  newBikeRealHoursEdited = false;
  newBikeRealKmEdited = false;
  bikeModal.dataset.mode = 'new';
  bikeModal.querySelector('h2').textContent = 'Añadir moto';
  document.getElementById('formBrand').value = '';
  document.getElementById('formBikeTemplate').value = 'custom';
  document.getElementById('formModel').value = '';
  document.getElementById('formYear').value = new Date().getFullYear();
  document.getElementById('formPlate').value = '';
  document.getElementById('formMaintenanceUnit').value = 'hours';
  document.getElementById('formRealHours').value = 0;
  document.getElementById('formMarkerHours').value = 0;
  document.getElementById('formRealKm').value = 0;
  document.getElementById('formMarkerKm').value = 0;
  document.getElementById('formItvNext').value = '';
  document.getElementById('formInsuranceExpiry').value = '';
  document.getElementById('formPhoto').value = '';
  bikeModal.classList.remove('hidden');
});
document.getElementById('formBikeTemplate').addEventListener('change', event => { const template = bikeModelCatalog[event.target.value]; const preview = document.getElementById('bikeTemplatePreview'); if (!template) { if (preview) preview.src = 'assets/ktm-250-exc-tpi-2021.png'; return; } document.getElementById('formBrand').value = template.brand; document.getElementById('formModel').value = template.model; document.getElementById('formMaintenanceUnit').value = template.maintenanceUnit; if (preview) { preview.src = template.photo; preview.alt = `Vista lateral de ${template.brand} ${template.model}`; } });
document.getElementById('editBike').addEventListener('click', () => {
  creatingBike = false;
  bikeModal.dataset.mode = 'edit';
  bikeModal.querySelector('h2').textContent = 'Editar datos básicos';
  document.getElementById('formBrand').value = bikeData.brand;
  document.getElementById('formBikeTemplate').value = (bikeData.brand === 'KTM' && /250.*TPI/i.test(bikeData.model)) ? 'ktm250tpi' : Object.entries(bikeModelCatalog).find(([, template]) => template.brand === bikeData.brand && template.model === bikeData.model)?.[0] || 'custom';
  document.getElementById('formModel').value = bikeData.model;
  document.getElementById('formYear').value = bikeData.year;
  document.getElementById('formPlate').value = bikeData.plate;
  document.getElementById('formMaintenanceUnit').value = bikeData.maintenanceUnit || 'hours';
  document.getElementById('formRealHours').value = bikeData.realHours;
  document.getElementById('formMarkerHours').value = bikeData.markerHours;
  document.getElementById('formRealKm').value = bikeData.realKm;
  document.getElementById('formMarkerKm').value = bikeData.markerKm;
  document.getElementById('formItvNext').value = bikeData.itvNextDate || '';
  document.getElementById('formInsuranceExpiry').value = bikeData.insuranceExpiryDate || '';
  document.getElementById('formPhoto').value = '';
  bikeModal.classList.remove('hidden');
});
let newBikeRealHoursEdited = false;
let newBikeRealKmEdited = false;
document.getElementById('formRealHours').addEventListener('input', () => { if (bikeModal.dataset.mode === 'new') newBikeRealHoursEdited = true; });
document.getElementById('formRealKm').addEventListener('input', () => { if (bikeModal.dataset.mode === 'new') newBikeRealKmEdited = true; });
const syncNewBikeReading = (target) => event => { if (bikeModal.dataset.mode === 'new') document.getElementById(target).value = event.target.value; };
document.getElementById('formMarkerHours').addEventListener('input', syncNewBikeReading('formRealHours'));
document.getElementById('formMarkerHours').addEventListener('change', syncNewBikeReading('formRealHours'));
document.getElementById('formMarkerKm').addEventListener('input', syncNewBikeReading('formRealKm'));
document.getElementById('formMarkerKm').addEventListener('change', syncNewBikeReading('formRealKm'));
function closeBikeModal() { bikeModal.classList.add('hidden'); }
document.getElementById('closeBikeModal').addEventListener('click', closeBikeModal);
document.getElementById('cancelBikeModal').addEventListener('click', closeBikeModal);
bikeModal.addEventListener('click', event => { if (event.target === bikeModal) closeBikeModal(); });
document.getElementById('bikeForm').addEventListener('submit', event => {
  event.preventDefault();
  if (creatingBike) {
    const newId = `moto-${Date.now()}`;
    const selectedTemplate = bikeModelCatalog[document.getElementById('formBikeTemplate').value];
    const newProfile = { id: newId, brand: document.getElementById('formBrand').value.trim(), model: document.getElementById('formModel').value.trim(), engine: selectedTemplate?.engine || '', photo: selectedTemplate?.photo || '', maintenancePlanId: document.getElementById('formBikeTemplate').value === 'yamaha450' ? 'yamaha-wr450-1000km' : 'ktm-base', year: document.getElementById('formYear').value, plate: document.getElementById('formPlate').value.trim(), maintenanceUnit: document.getElementById('formMaintenanceUnit').value, realHours: Math.round(Number(document.getElementById('formRealHours').value)), markerHours: Math.round(Number(document.getElementById('formMarkerHours').value)), realKm: Math.round(Number(document.getElementById('formRealKm').value)), markerKm: Math.round(Number(document.getElementById('formMarkerKm').value)), itvNextDate: document.getElementById('formItvNext').value, insuranceExpiryDate: document.getElementById('formInsuranceExpiry').value };
    const file = document.getElementById('formPhoto').files[0];
    const finishNewBike = () => { bikeProfiles.push(newProfile); activeBikeId = newId; localStorage.setItem('motoProfiles', JSON.stringify(bikeProfiles)); localStorage.setItem('activeBikeId', activeBikeId); events = []; saveEvents(); window.setTimeout(() => window.location.reload(), 1200); };
    if (file) { compressImage(file).then(prepared => { newProfile.photo = prepared.data; finishNewBike(); }).catch(() => window.alert('No se ha podido cargar la foto de la moto. Prueba con otra imagen.')); } else finishNewBike();
    return;
  }
  bikeData.brand = document.getElementById('formBrand').value.trim();
  bikeData.model = document.getElementById('formModel').value.trim();
  bikeData.year = document.getElementById('formYear').value;
  bikeData.plate = document.getElementById('formPlate').value.trim();
  bikeData.maintenanceUnit = document.getElementById('formMaintenanceUnit').value;
  bikeData.realHours = Math.round(Number(document.getElementById('formRealHours').value));
  bikeData.markerHours = Math.round(Number(document.getElementById('formMarkerHours').value));
  bikeData.realKm = Math.round(Number(document.getElementById('formRealKm').value));
  bikeData.markerKm = Math.round(Number(document.getElementById('formMarkerKm').value));
  bikeData.itvNextDate = document.getElementById('formItvNext').value;
  bikeData.insuranceExpiryDate = document.getElementById('formInsuranceExpiry').value;
  const file = document.getElementById('formPhoto').files[0];
  const save = () => { saveBikeProfiles(); maintenancePlan = filterMaintenancePlan(JSON.parse(localStorage.getItem(maintenancePlanKey()) || 'null') || maintenancePlanForProfile(bikeData)); updateBikeView(); renderBikeSwitcher(); renderMaintenancePlan(); renderMaintenanceChecklist(); closeBikeModal(); };
  if (file) { compressImage(file).then(prepared => { bikeData.photo = prepared.data; save(); }).catch(() => window.alert('No se ha podido cargar la foto de la moto. Prueba con otra imagen.')); } else save();
});

const defaultMaintenancePlan = {
  source: 'Plan base KTM · tabla aprobada',
  sections: [
    { label: 'Después de 10 horas', kind: 'Revisión inicial', tasks: ['Realizar el mantenimiento de la horquilla.', 'Comprobar la memoria de errores después del recorrido de prueba.'] },
    { label: 'Después de 20 horas', kind: 'Revisión inicial', tasks: ['Realizar el mantenimiento del amortiguador.'] },
    { label: 'Cada 10 horas', kind: 'Uso deportivo', tasks: ['Leer la memoria de errores.', 'Comprobar el sistema eléctrico.', 'Comprobar y cargar la batería.', 'Controlar las pastillas de freno delanteras.', 'Controlar las pastillas de freno traseras.', 'Comprobar los discos de freno.', 'Comprobar los tubos de freno.', 'Controlar el nivel del líquido de freno trasero.', 'Controlar la carrera del pedal de freno.', 'Comprobar el chasis.', 'Comprobar el basculante.', 'Comprobar el estado de los neumáticos.', 'Comprobar la presión de los neumáticos.', 'Comprobar la holgura del rodamiento de rueda.', 'Comprobar los cubos de las ruedas.', 'Comprobar la tensión de los radios.', 'Comprobar la cadena, corona, piñón y guía.', 'Comprobar la tensión de la cadena.', 'Lubricar todas las piezas móviles.', 'Controlar el nivel del líquido de embrague hidráulico.', 'Comprobar el nivel del líquido de frenos delantero.', 'Comprobar la carrera de la maneta de freno.', 'Comprobar las mangueras y manguitos.', 'Comprobar el nivel del líquido refrigerante.', 'Comprobar los cables y cables Bowden.', 'Limpiar el filtro de aire y su caja.', 'Comprobar tornillos y tuercas de seguridad.', 'Comprobar el tamiz de combustible.', 'Comprobar la presión de combustible.', 'Comprobar el ajuste del faro.', 'Comprobar el régimen de ralentí.', 'Hacer el control final y un recorrido de prueba.', 'Leer la memoria de errores después del recorrido de prueba.', 'Registrar el mantenimiento en KTM Dealer.net.'] },
    { label: 'Cada 20 horas', kind: 'Base recomendada', tasks: ['Leer la memoria de errores.', 'Comprobar el sistema eléctrico.', 'Comprobar y cargar la batería.', 'Controlar las pastillas de freno delanteras.', 'Controlar las pastillas de freno traseras.', 'Comprobar los discos de freno.', 'Comprobar los tubos de freno.', 'Controlar el nivel del líquido de freno trasero.', 'Controlar la carrera del pedal de freno.', 'Comprobar el chasis.', 'Comprobar el basculante.', 'Comprobar la holgura del cojinete del basculante.', 'Comprobar la holgura del cojinete giratorio del amortiguador.', 'Comprobar el estado de los neumáticos.', 'Comprobar la presión de los neumáticos.', 'Comprobar la holgura del rodamiento de rueda.', 'Comprobar los cubos de las ruedas.', 'Comprobar el alabeo de las llantas.', 'Comprobar la tensión de los radios.', 'Comprobar la cadena, corona, piñón y guía.', 'Comprobar la tensión de la cadena.', 'Lubricar todas las piezas móviles.', 'Controlar el nivel del líquido de embrague hidráulico.', 'Comprobar el nivel del líquido de frenos delantero.', 'Comprobar la carrera de la maneta de freno.', 'Comprobar la holgura del cojinete de la dirección.', 'Comprobar la caja de láminas, la membrana y la brida de succión.', 'Comprobar mangueras, manguitos y nivel de refrigerante.', 'Comprobar los cables y cables Bowden.', 'Limpiar el filtro de aire y su caja.', 'Comprobar tornillos y tuercas relevantes para la seguridad.', 'Sustituir o comprobar el tamiz de combustible.', 'Comprobar la presión de combustible.', 'Comprobar el ajuste del faro.', 'Comprobar el régimen de ralentí.', 'Hacer el control final y un recorrido de prueba.', 'Leer la memoria de errores después del recorrido de prueba.', 'Registrar el mantenimiento en KTM Dealer.net.'] },
    { label: 'Cada 40 horas', kind: 'Base ampliada', tasks: ['Leer la memoria de errores.', 'Comprobar el sistema eléctrico.', 'Comprobar y cargar la batería.', 'Controlar las pastillas de freno delanteras.', 'Controlar las pastillas de freno traseras.', 'Comprobar los discos de freno.', 'Comprobar la estanqueidad de los tubos de freno.', 'Controlar el nivel del líquido de freno trasero.', 'Controlar la carrera del pedal de freno.', 'Comprobar el chasis.', 'Comprobar el basculante.', 'Comprobar la holgura del cojinete del basculante.', 'Comprobar la holgura del cojinete giratorio del amortiguador.', 'Comprobar el estado de los neumáticos.', 'Comprobar la presión de los neumáticos.', 'Comprobar la holgura del rodamiento de rueda.', 'Comprobar los cubos de las ruedas.', 'Comprobar el alabeo de las llantas.', 'Comprobar la tensión de los radios.', 'Comprobar la cadena, corona, piñón y guía.', 'Comprobar la tensión de la cadena.', 'Lubricar todas las piezas móviles.', 'Controlar el nivel del líquido de embrague hidráulico.', 'Comprobar el nivel del líquido de frenos delantero.', 'Comprobar la carrera de la maneta de freno.', 'Comprobar la holgura del cojinete de la dirección.', 'Comprobar la caja de láminas, la membrana y la brida de succión.', 'Comprobar mangueras, manguitos y nivel de refrigerante.', 'Comprobar los cables y cables Bowden.', 'Limpiar el filtro de aire y su caja.', 'Comprobar tornillos y tuercas relevantes para la seguridad.', 'Sustituir el tamiz de combustible.', 'Comprobar la presión de combustible.', 'Comprobar el ajuste del faro.', 'Comprobar el régimen de ralentí.', 'Sustituir la bujía y la pipa.', 'Sustituir el aceite del cambio.', 'Sustituir la fibra de vidrio del silencioso.', 'Realizar el mantenimiento de la horquilla.', 'Realizar el mantenimiento del amortiguador.', 'Leer la memoria de errores después del recorrido de prueba.', 'Registrar el mantenimiento en KTM Dealer.net.'] },
    { label: 'Cada 80 horas', kind: 'Motor', tasks: ['Sustituir el filtro de combustible.', 'Sustituir el pistón.', 'Comprobar el cilindro.', 'Sustituir la bomba de aceite.', 'Limpiar el tamiz de aceite.', 'Limpiar el tamiz de aceite del depósito.', 'Limpiar la cubierta de protección del sensor de presión.', 'Realizar el servicio secundario del motor.', 'Comprobar el funcionamiento y la suavidad de la distribución de escape.', 'Comprobar el embrague.'] },
    { label: 'Cada 40 horas deportivas', kind: 'Motor ampliado', tasks: ['Sustituir el filtro de combustible.', 'Sustituir el pistón.', 'Comprobar el cilindro.', 'Limpiar la cubierta de protección del sensor de presión.', 'Realizar el servicio secundario del motor.', 'Comprobar la distribución de escape.', 'Realizar el servicio principal del motor.', 'Sustituir la biela.', 'Sustituir el rodamiento de la biela.', 'Comprobar el gorrón elevador.', 'Limpiar las conexiones del tubo del sensor de presión.', 'Comprobar el cambio de marchas.', 'Comprobar la caja de cambios.', 'Sustituir todos los apoyos del motor.', 'Controlar el mecanismo del motor de arranque.'] },
    { label: 'Cada 12 meses', kind: 'Anual', tasks: ['Sustituir el líquido de frenos delantero.', 'Sustituir el líquido de frenos trasero.', 'Cambiar el líquido de embrague hidráulico.', 'Engrasar el cojinete de la dirección.', 'Limpiar la manguera del sensor de presión.', 'Limpiar la cubierta de protección del sensor de presión.'] },
  ]
};
const yamahaWr450MaintenancePlan = {
  source: 'Manual de taller Yamaha WR450F 2004 · páginas 181-183',
  sections: [{ label: 'Cada 1.000 km', kind: 'Plan Yamaha WR450F', tasks: [
    'Sustituir el aceite del motor.',
    'Inspeccionar los juegos de válvula con el motor frío; comprobar desgaste de asientos y vástagos y sustituir cuando sea necesario.',
    'Inspeccionar los muelles de válvula; comprobar longitud libre e inclinación y sustituir cuando sea necesario.',
    'Inspeccionar los empujadores de válvula; comprobar arañazos y desgaste y sustituir cuando sea necesario.',
    'Inspeccionar los árboles de levas; revisar la superficie y el sistema de descompresión y sustituir cuando sea necesario.',
    'Inspeccionar los piñones de los árboles de levas; comprobar daños y desgaste de los dientes y sustituir cuando sea necesario.',
    'Inspeccionar el pistón; limpiar y eliminar depósitos de carbonilla y sustituir si presenta grietas o daños.',
    'Inspeccionar y sustituir los aros del pistón cuando proceda; comprobar el huelgo del extremo del aro.',
    'Inspeccionar el bulón del pistón y sustituirlo cuando sea necesario.',
    'Inspeccionar y limpiar la culata; eliminar depósitos de carbonilla y cambiar la junta cuando proceda.',
    'Inspeccionar y limpiar el cilindro; sustituirlo cuando sea necesario.',
    'Sustituir el filtro de aceite.',
    'Limpiar el filtro tamiz del bastidor.',
    'Ajustar de nuevo la tuerca del rotor.',
    'Limpiar el silenciador y sustituirlo cuando sea necesario.',
    'Inspeccionar y limpiar el cárter.',
    'Limpiar y sustituir el aceite de las horquillas delanteras; utilizar aceite de suspensión “01”.',
    'Limpiar y engrasar el cabezal de dirección; sustituir el cojinete cuando sea necesario.',
    'Sustituir la bujía cuando sea necesario.',
    'Sustituir el embrague, el cojinete de la transmisión, el líquido refrigerante y el filtro de aire cuando sea necesario.',
    'Inspeccionar la horquilla de selección, la leva de selección y la barra guía; reparar o sustituir cuando sea necesario.',
    'Inspeccionar el sistema de arranque en caliente y los bornes de la batería; corregir cuando sea necesario.',
    'Sustituir los retenes de aceite de la horquilla y los cojinetes de rueda cuando sea necesario.',
    'Engrasar el amortiguador trasero y lubricar el soporte lateral cuando sea necesario.',
    'Inspeccionar el tope de la cadena y sustituirlo cuando sea necesario.',
    'Sustituir las pastillas y el líquido de frenos cuando sea necesario.'
  ]}]
};
function maintenancePlanKey() { return `motoMaintenancePlan:${encodeURIComponent(activeBikeId)}`; }
function isSelectableMaintenanceSection(section) {
  const label = String(section?.label || '');
  return !/tareas detectadas|despu[eé]s de\s+(?:10|15|20)\s+horas?|cada\s+10\s+horas|deportiv|competici[oó]n|inicial/i.test(label);
}
function filterMaintenancePlan(plan) { return { ...plan, sections: (plan.sections || []).filter(isSelectableMaintenanceSection) }; }
function maintenancePlanForProfile(profile) { const identity = `${profile?.brand || ''} ${profile?.model || ''}`; return /yamaha.*wr\s*450|wr\s*450/i.test(identity) ? yamahaWr450MaintenancePlan : defaultMaintenancePlan; }
const maintenancePlanFallback = maintenancePlanForProfile(bikeData);
const storedMaintenancePlan = JSON.parse(localStorage.getItem(maintenancePlanKey()) || 'null');
let maintenancePlan = filterMaintenancePlan(/yamaha.*wr\s*450|wr\s*450/i.test(`${bikeData.brand || ''} ${bikeData.model || ''}`) ? maintenancePlanFallback : (storedMaintenancePlan || maintenancePlanFallback));
for (let storageIndex = 0; storageIndex < localStorage.length; storageIndex += 1) {
  const storageKey = localStorage.key(storageIndex);
  if (!storageKey?.startsWith(`motoMaintenanceCustomPlan:${maintenancePlanKey()}:`)) continue;
  try {
    const custom = JSON.parse(localStorage.getItem(storageKey));
    if (custom?.sourceLabels?.length && Array.isArray(custom.tasks) && !maintenancePlan.sections.some(section => section.label === custom.label)) maintenancePlan.sections.push(custom);
  } catch { /* Ignore an obsolete custom plan and keep the base plan usable. */ }
}
function renderMaintenancePlan() {
  const page = document.getElementById('view-mantenimiento');
  if (!page) return;
  let container = document.getElementById('maintenancePlan');
  if (!container) {
    container = document.createElement('section');
    container.id = 'maintenancePlan';
    container.className = 'panel maintenance-plan-panel';
    page.appendChild(container);
  }
  const visibleSections = maintenancePlan.sections.filter(section => !section.sourceLabels && isSelectableMaintenanceSection(section));
  container.innerHTML = `<div class="card-top"><div><h3>Plan de mantenimiento</h3><p>${safeText(maintenancePlan.source)}</p></div><button class="quiet-button" id="uploadPlanButton">Importar plan PDF/JSON</button></div><div class="plan-grid">${visibleSections.map(section => `<article class="plan-card"><span class="interval-label">${safeText(section.kind)}</span><h3>${safeText(section.label)}</h3><ul>${section.tasks.map(task => `<li>${safeText(task)}</li>`).join('')}</ul></article>`).join('')}</div><p class="plan-status" id="planStatus">El plan se guarda solo para esta moto y este navegador.</p>`;
  document.getElementById('uploadPlanButton').addEventListener('click', () => document.getElementById('maintenancePlanFile').click());
}
function maintenanceCustomPlanKey(label) { return `motoMaintenanceCustomPlan:${maintenancePlanKey()}:${encodeURIComponent(label)}`; }
function maintenanceSectionsForSelection() { return maintenancePlan.sections.filter(section => !section.sourceLabels && isSelectableMaintenanceSection(section)); }
function maintenanceSectionForLabel(label) {
  const existing = maintenancePlan.sections.find(section => section.label === label);
  if (existing) return existing;
  try { return JSON.parse(localStorage.getItem(maintenanceCustomPlanKey(label)) || 'null'); } catch { return null; }
}
function renderMaintenanceLauncher() {
  const summary = document.querySelector('#view-mantenimiento .maintenance-summary');
  if (!summary || workshopOpen) return;
  const sections = maintenanceSectionsForSelection();
  const activeCombined = maintenancePlan.sections.filter(section => section.sourceLabels && hasMaintenanceProgress(section.label));
  summary.className = 'maintenance-summary maintenance-launcher';
  summary.innerHTML = `<div class="maintenance-launch-card"><div class="maintenance-launch-header"><div><span class="interval-label">NUEVA REVISIÓN</span><h2>Iniciar mantenimiento</h2><p>Selecciona uno o varios mantenimientos. Las tareas repetidas se mostrarán una sola vez.</p></div><button type="button" class="primary-button" id="startSelectedMaintenance" data-tooltip="Selecciona una o varias revisiones y abre su ficha de mantenimiento.">Iniciar mantenimiento</button></div><div class="maintenance-selection" role="group" aria-label="Mantenimientos disponibles">${sections.map(section => `<label><input type="checkbox" value="${safeText(section.label)}" /> <span><strong>${safeText(section.label)}</strong><small>${section.tasks.length} tareas · ${safeText(section.kind)}</small></span></label>`).join('')}</div>${activeCombined.length ? `<div class="maintenance-active-list"><strong>Revisiones en curso</strong>${activeCombined.map(section => `<button type="button" class="quiet-button active-maintenance-button" data-maintenance-label="${safeText(section.label)}">Continuar: ${safeText(section.label)}</button>`).join('')}</div>` : ''}</div>`;
  summary.querySelectorAll('.active-maintenance-button').forEach(button => button.addEventListener('click', () => {
    localStorage.setItem(`motoMaintenanceChecklistInterval:${maintenancePlanKey()}`, button.dataset.maintenanceLabel);
    maintenanceSession(button.dataset.maintenanceLabel);
    workshopOpen = true;
    document.body.classList.add('workshop-mode');
    renderMaintenanceChecklist();
  }));
  summary.querySelector('#startSelectedMaintenance').addEventListener('click', () => {
    const labels = [...summary.querySelectorAll('input:checked')].map(input => input.value);
    if (!labels.length) { window.alert('Selecciona al menos un mantenimiento.'); return; }
    const selected = labels.map(maintenanceSectionForLabel).filter(Boolean);
    const seen = new Set();
    const tasks = selected.flatMap(section => section.tasks).filter(task => { const normalized = String(task).trim().toLocaleLowerCase('es-ES'); if (seen.has(normalized)) return false; seen.add(normalized); return true; });
    const combinedLabel = labels.join(' + ');
    const combined = { label: combinedLabel, kind: 'Selección combinada', tasks, sourceLabels: labels };
    localStorage.setItem(maintenanceCustomPlanKey(combinedLabel), JSON.stringify(combined));
    if (!maintenancePlan.sections.some(section => section.label === combinedLabel)) maintenancePlan.sections.push(combined);
    localStorage.setItem(`motoMaintenanceChecklistInterval:${maintenancePlanKey()}`, combinedLabel);
    maintenanceSession(combinedLabel);
    syncMaintenanceProgressEvent(combinedLabel);
    workshopOpen = true;
    document.body.classList.add('workshop-mode');
    renderMaintenanceChecklist();
  });
}
const maintenancePlanFile = document.createElement('input');
maintenancePlanFile.id = 'maintenancePlanFile';
maintenancePlanFile.type = 'file';
maintenancePlanFile.accept = 'application/pdf,.pdf,application/json,.json';
maintenancePlanFile.hidden = true;
document.body.appendChild(maintenancePlanFile);
async function extractPlanFromPdf(file) {
  const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  let text = '';
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    text += `${content.items.map(item => item.str).join(' ')}\n`;
  }
  const normalized = text.replace(/\s+/g, ' ');
  const found = [];
  const patterns = [
    [/cada 10 horas[^.]{0,80}(de servicio bajo condiciones deportivas|de servicio deportivo)?/i, 'Cada 10 horas', 'Uso deportivo'],
    [/cada 20 horas/i, 'Cada 20 horas', 'Base recomendada'],
    [/cada 40 horas[^.]{0,80}(de servicio bajo condiciones deportivas|de servicio deportivo)?/i, 'Cada 40 horas deportivas', 'Motor ampliado'],
    [/cada 40 horas/i, 'Cada 40 horas', 'Base ampliada'],
    [/cada 80 horas/i, 'Cada 80 horas', 'Motor'],
    [/cada 12 meses/i, 'Cada 12 meses', 'Anual'],
    [/cada 48 meses/i, 'Cada 48 meses', 'Cuatro años']
  ];
  patterns.forEach(([pattern, label, kind]) => { if (pattern.test(normalized) && !found.some(section => section.label === label)) found.push({ label, kind, tasks: ['Consultar el checklist del PDF importado para este intervalo.'] }); });
  if (!found.length) throw new Error('No se han encontrado intervalos reconocibles en el PDF.');
  const taskLines = normalized.replace(/\s+(?=(?:Leer|Comprobar|Controlar|Sustituir|Realizar|Limpiar|Cambiar|Engrasar|Lubricar|Verificar|Registrar)\b)/gi, '\n').split('\n').map(line => line.trim()).filter(line => line.length > 24 && !/programa de servicio|intervalo peri[oó]dico|intervalo [uú]nico/i.test(line)).slice(0, 28);
  if (taskLines.length) found.push({ label: 'Tareas detectadas en el PDF', kind: 'Checklist importado', tasks: taskLines });
  return { source: `Plan importado · ${file.name}`, sections: found };
}
async function extractPlanFromJson(file) {
  const plan = JSON.parse(await file.text());
  if (!plan || !Array.isArray(plan.sections) || !plan.sections.length) throw new Error('El JSON no contiene secciones de mantenimiento.');
  const sections = plan.sections.map(section => ({
    label: String(section.label || '').trim(),
    kind: String(section.kind || 'Mantenimiento'),
    tasks: Array.isArray(section.tasks) ? section.tasks.map(task => String(task).trim()).filter(Boolean) : []
  })).filter(section => section.label && section.tasks.length);
  if (!sections.length) throw new Error('El JSON no contiene tareas válidas.');
  return { source: plan.source || `Plan importado · ${file.name}`, sections };
}
maintenancePlanFile.addEventListener('change', async () => {
  const file = maintenancePlanFile.files[0];
  if (!file) return;
  const status = document.getElementById('planStatus');
  if (status) status.textContent = 'Leyendo el PDF…';
  try {
    const imported = file.name.toLowerCase().endsWith('.json') ? await extractPlanFromJson(file) : await extractPlanFromPdf(file);
    maintenancePlan = filterMaintenancePlan(imported);
    localStorage.setItem(maintenancePlanKey(), JSON.stringify(maintenancePlan));
    renderMaintenancePlan();
  } catch (error) {
    if (status) status.textContent = 'No se ha podido leer el PDF. El plan anterior se mantiene.';
    window.alert('No se ha podido leer el plan. Comprueba que el PDF contiene texto seleccionable o que el JSON tiene secciones y tareas válidas.');
  } finally { maintenancePlanFile.value = ''; }
});
renderMaintenancePlan();

function checklistStateKey(sectionLabel) { return `motoMaintenanceTasks:${maintenancePlanKey()}:${encodeURIComponent(sectionLabel)}`; }
function maintenanceSessionKey(sectionLabel) { return `motoMaintenanceSession:${maintenancePlanKey()}:${encodeURIComponent(sectionLabel)}`; }
function readChecklistState(sectionLabel) { return JSON.parse(localStorage.getItem(checklistStateKey(sectionLabel)) || '{}'); }
function readMaintenanceSession(sectionLabel) { return JSON.parse(localStorage.getItem(maintenanceSessionKey(sectionLabel)) || 'null'); }
function hasMaintenanceProgress(sectionLabel) { const state = readChecklistState(sectionLabel); return Boolean(readMaintenanceSession(sectionLabel) || state.notes?.trim() || Object.values(state).some(item => item?.done || item?.na || item?.note)); }
function maintenanceIsComplete(sectionLabel) { const section = maintenancePlan?.sections?.find(item => item.label === sectionLabel); if (!section) return false; const state = readChecklistState(sectionLabel); return section.tasks.length > 0 && section.tasks.every((_, index) => state[index]?.done || state[index]?.na); }
function maintenanceProgress(sectionLabel) { const section = maintenancePlan?.sections?.find(item => item.label === sectionLabel); if (!section) return { completed: 0, total: 0, percent: 0 }; const state = readChecklistState(sectionLabel); const completed = section.tasks.filter((_, index) => state[index]?.done || state[index]?.na).length; return { completed, total: section.tasks.length, percent: section.tasks.length ? Math.round((completed / section.tasks.length) * 100) : 0 }; }
function maintenanceEventId(sectionLabel) { return `maintenance-${maintenancePlanKey()}-${encodeURIComponent(sectionLabel)}`; }
function maintenanceSession(sectionLabel) {
  const stored = readMaintenanceSession(sectionLabel);
  const session = stored || { date: todayISO(), markerHours: readingNumber(bikeData.markerHours), markerKm: readingNumber(bikeData.markerKm), eventId: `${maintenanceEventId(sectionLabel)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
  const previous = events.find(item => item.maintenanceEventId === (session.eventId || maintenanceEventId(sectionLabel)));
  // Freeze real readings once. Existing event readings take precedence during migration.
  if (session.realHours == null) session.realHours = previous?.realHours ?? (Number(bikeData.realHours) - Number(bikeData.markerHours) + Number(session.markerHours));
  if (session.realKm == null) session.realKm = previous?.realKm ?? (Number(bikeData.realKm) - Number(bikeData.markerKm) + Number(session.markerKm));
  localStorage.setItem(maintenanceSessionKey(sectionLabel), JSON.stringify(session));
  return session;
}
function applyMaintenanceReadingsToBike(session) {
  if (!session) return;
  const markerHours = MaintenanceSchedule.hours(session.markerHours);
  const markerKm = MaintenanceSchedule.hours(session.markerKm);
  const realHours = MaintenanceSchedule.hours(session.realHours);
  const realKm = MaintenanceSchedule.hours(session.realKm);
  if ([markerHours, markerKm, realHours, realKm].some(value => value === null)) return;
  bikeData.markerHours = markerHours;
  bikeData.markerKm = markerKm;
  bikeData.realHours = realHours;
  bikeData.realKm = realKm;
  saveBikeProfiles();
  updateBikeView();
}
function estimateRealReading(markerValue, sessionMarker, sessionReal, currentMarker, currentReal) {
  const marker = MaintenanceSchedule.hours(markerValue);
  const baseMarker = MaintenanceSchedule.hours(sessionMarker);
  const baseReal = MaintenanceSchedule.hours(sessionReal);
  const fallbackMarker = MaintenanceSchedule.hours(currentMarker);
  const fallbackReal = MaintenanceSchedule.hours(currentReal);
  if (marker === null) return null;
  if (baseMarker !== null && baseReal !== null) return Math.max(0, Math.round((baseReal + marker - baseMarker) * 100) / 100);
  if (fallbackMarker !== null && fallbackReal !== null) return Math.max(0, Math.round((fallbackReal + marker - fallbackMarker) * 100) / 100);
  return marker;
}
function refreshMaintenanceLifeEvents() {
  if (!maintenancePlan?.sections) return;
  maintenancePlan.sections.filter(section => !/tareas detectadas/i.test(section.label)).forEach(section => {
    if (!hasMaintenanceProgress(section.label)) return;
    if (maintenanceIsComplete(section.label)) syncCompletedMaintenanceEvent(section.label);
    else syncMaintenanceProgressEvent(section.label);
  });
  const seen = new Map();
  const duplicateIndexes = [];
  events.forEach((item, index) => {
    if (!item.maintenanceInterval) return;
    const key = `${item.maintenanceInterval}|${item.dateISO || ''}|${item.realHours || ''}|${item.realKm || ''}`;
    const previousIndex = seen.get(key);
    if (previousIndex === undefined) { seen.set(key, index); return; }
    const previous = events[previousIndex];
    const previousScore = previous.maintenanceStatus === 'completed' ? 2 : 1;
    const currentScore = item.maintenanceStatus === 'completed' ? 2 : 1;
    if (currentScore > previousScore) { duplicateIndexes.push(previousIndex); seen.set(key, index); } else duplicateIndexes.push(index);
  });
  if (duplicateIndexes.length) { events = events.filter((_, index) => !duplicateIndexes.includes(index)); saveEvents(); }
}
function syncMaintenanceProgressEvent(sectionLabel) {
  const section = maintenancePlan?.sections?.find(item => item.label === sectionLabel);
  if (!section || !hasMaintenanceProgress(sectionLabel)) return;
  const session = maintenanceSession(sectionLabel);
  const progress = maintenanceProgress(sectionLabel);
  const freeNotes = String(readChecklistState(sectionLabel).notes || '').trim();
  const taskAttachments = section.tasks.flatMap((_, index) => readChecklistState(sectionLabel)[index]?.attachments || []);
  const matchingEvent = !events.some(item => item.maintenanceEventId === session.eventId) ? events.find(item => item.maintenanceInterval === sectionLabel && item.realHours === session.realHours && item.realKm === session.realKm) : null;
  const id = session.eventId || matchingEvent?.maintenanceEventId || maintenanceEventId(sectionLabel);
  const event = { maintenanceEventId: id, maintenanceInterval: sectionLabel, maintenanceStatus: maintenanceIsComplete(sectionLabel) ? 'completed' : 'in_progress', maintenanceCompleted: progress.completed, maintenanceTotal: progress.total, maintenancePercent: progress.percent, attachments: taskAttachments, type: 'Mantenimiento', description: `Revisión · ${sectionLabel}${maintenanceIsComplete(sectionLabel) ? '' : ' (en curso)'}`, date: formatDate(session.date || todayISO()), dateISO: session.date || todayISO(), hours: readingNumber(session.markerHours), km: readingNumber(session.markerKm), realHours: readingNumber(session.realHours), realKm: readingNumber(session.realKm), notes: [`Mantenimiento: ${progress.completed} de ${progress.total} tareas resueltas.`, freeNotes].filter(Boolean).join(' ') };
  const existingIndex = events.findIndex(item => item.maintenanceEventId === id);
  if (existingIndex >= 0) events[existingIndex] = { ...events[existingIndex], ...event };
  else events.unshift(event);
  session.eventId = id;
  localStorage.setItem(maintenanceSessionKey(sectionLabel), JSON.stringify(session));
  saveEvents();
  renderTimeline();
  renderUsageChart();
  updateBikeView();
}
function syncCompletedMaintenanceEvent(sectionLabel) {
  if (!maintenanceIsComplete(sectionLabel)) {
    syncMaintenanceProgressEvent(sectionLabel);
    return;
  }
  const section = maintenancePlan?.sections?.find(item => item.label === sectionLabel);
  if (!section) return;
  const session = maintenanceSession(sectionLabel);
  const state = readChecklistState(sectionLabel);
  const progress = maintenanceProgress(sectionLabel);
  const taskAttachments = section.tasks.flatMap((_, index) => state[index]?.attachments || []);
  const taskNotes = section.tasks.map((task, index) => state[index]?.note ? `${task}: ${state[index].note}` : '').filter(Boolean).join(' · ');
  const freeNotes = String(state.notes || '').trim();
  const matchingEvent = !events.some(item => item.maintenanceEventId === session.eventId) ? events.find(item => item.maintenanceInterval === sectionLabel && item.realHours === session.realHours && item.realKm === session.realKm) : null;
  const id = session.eventId || matchingEvent?.maintenanceEventId || maintenanceEventId(sectionLabel);
  const completedDate = session.date || todayISO();
  const event = {
    maintenanceEventId: id,
    maintenanceInterval: sectionLabel,
    maintenanceStatus: 'completed',
    maintenanceCompleted: progress.completed,
    maintenanceTotal: progress.total,
    maintenancePercent: progress.percent,
    maintenanceTaskSnapshot: section.tasks.map((task, index) => ({ task, done: Boolean(state[index]?.done), na: Boolean(state[index]?.na), note: state[index]?.note || '' })),
    attachments: taskAttachments,
    type: 'Mantenimiento',
    description: `Revisión · ${sectionLabel}`,
    date: formatDate(completedDate),
    dateISO: completedDate,
    hours: Math.round(readingNumber(session.markerHours)),
    km: Math.round(readingNumber(session.markerKm)),
    realHours: readingNumber(session.realHours),
    realKm: readingNumber(session.realKm),
    notes: [`Mantenimiento completado (${section.tasks.length} tareas).`, taskNotes, freeNotes].filter(Boolean).join(' ')
  };
  const existingIndex = events.findIndex(item => item.maintenanceEventId === id);
  if (existingIndex >= 0) events[existingIndex] = { ...events[existingIndex], ...event };
  else events.unshift(event);
  session.eventId = id;
  session.completed = true;
  session.completedAt = session.completedAt || todayISO();
  localStorage.setItem(maintenanceSessionKey(sectionLabel), JSON.stringify(session));
  saveEvents();
  renderTimeline();
  renderUsageChart();
  updateBikeView();
}
function closeWorkshop(sectionLabel) {
  const progress = maintenanceProgress(sectionLabel);
  try {
    applyMaintenanceReadingsToBike(readMaintenanceSession(sectionLabel));
    if (progress.total > 0 && progress.completed === progress.total) syncCompletedMaintenanceEvent(sectionLabel);
    else syncMaintenanceProgressEvent(sectionLabel);
  } catch (error) {
    console.error('No se pudo sincronizar el mantenimiento al cerrar el taller.', error);
  } finally {
    workshopOpen = false;
    document.body.classList.remove('workshop-mode');
    renderMaintenanceChecklist();
    updateMaintenanceEntryButtons();
    const returnView = maintenanceReturnView || 'vida';
    maintenanceReturnView = null;
    showView(returnView);
  }
}
let workshopOpen = false;
let maintenanceReturnView = null;
function renderMaintenanceChecklist() {
  const panel = document.querySelector('#view-mantenimiento .checklist-panel');
  if (!panel || !maintenancePlan) return;
  panel.hidden = !workshopOpen;
  const availableSections = maintenancePlan.sections.filter(section => isSelectableMaintenanceSection(section) || section.sourceLabels);
  if (!availableSections.length) return;
  const currentHours = Math.round(Number(bikeData.realHours));
  const savedLabel = localStorage.getItem(`motoMaintenanceChecklistInterval:${maintenancePlanKey()}`);
  const defaultLabel = availableSections.find(section => /cada 20 horas/i.test(section.label))?.label || availableSections[0].label;
  const selectedLabel = availableSections.some(section => section.label === savedLabel) ? savedLabel : defaultLabel;
  const selectedSection = availableSections.find(section => section.label === selectedLabel) || availableSections[0];
  const selectedSchedule = maintenanceSchedule(selectedSection.label);
  const state = readChecklistState(selectedSection.label);
  const session = workshopOpen ? maintenanceSession(selectedSection.label) : { date: todayISO(), markerHours: bikeData.markerHours, markerKm: bikeData.markerKm, realHours: bikeData.realHours, realKm: bikeData.realKm };
  const completed = selectedSection.tasks.filter((_, index) => state[index]?.done || state[index]?.na).length;
  const pendingPrevious = selectedLabel === 'Cada 40 horas' && !maintenanceIsComplete('Cada 20 horas');
  const complete = selectedSection.tasks.length > 0 && completed === selectedSection.tasks.length;
  panel.innerHTML = `<div class="card-top"><div><h3>Lista de tareas · ${safeText(selectedSection.label)}</h3><p>${safeText(scheduleText(selectedSchedule))} Marca cada tarea o indica si no aplica.</p></div><div class="checklist-actions"><div class="checklist-select"><label for="checklistInterval">Intervalo</label><select id="checklistInterval">${availableSections.map(section => `<option value="${safeText(section.label)}" ${section.label === selectedLabel ? 'selected' : ''}>${safeText(section.label)}</option>`).join('')}</select></div><button class="quiet-button workshop-button" id="workshopModeButton" type="button" data-tooltip="Guarda automáticamente los cambios y vuelve a la vista de mantenimiento.">Cerrar modo taller</button><button class="quiet-button reset-maintenance-button" id="resetMaintenanceButton" type="button" data-tooltip="Borra el avance y las notas de esta revisión para empezar de nuevo.">Resetear mantenimiento</button></div></div>${pendingPrevious ? '<div class="maintenance-warning">La revisión de 20 horas todavía no está terminada. Puedes continuar con esta revisión, pero quedan tareas pendientes.</div>' : ''}${complete ? '<div class="maintenance-complete"><span>✓</span><strong>Mantenimiento realizado</strong><small>Todas las tareas están resueltas. Puedes cerrar la hoja.</small></div>' : ''}<div class="maintenance-session"><strong>Datos de esta revisión</strong><p class="session-help">Al cambiar las lecturas del marcador, las horas y kilómetros reales se calculan automáticamente. Puedes corregirlos.</p><div class="session-fields"><label class="session-date-field">Fecha<input id="sessionDate" type="date" value="${safeText(session.date)}" /></label><div class="reading-group marker-reading"><strong>Marcador</strong><span>Lo que indica el cuadro de la moto</span><label>Horas<input id="sessionHours" type="number" step="1" value="${safeText(session.markerHours)}" /></label><label>Kilómetros<input id="sessionKm" type="number" step="1" value="${safeText(session.markerKm)}" /></label></div><div class="reading-group real-reading"><strong>Uso real acumulado</strong><span>Se calcula automáticamente y se puede editar</span><label>Horas<input id="sessionRealHours" type="number" min="0" step="any" value="${safeText(session.realHours)}" /></label><label>Kilómetros<input id="sessionRealKm" type="number" min="0" step="any" value="${safeText(session.realKm)}" /></label></div><button class="quiet-button" id="saveSessionButton" type="button">Guardar datos</button></div></div><div class="checklist-progress">${completed} de ${selectedSection.tasks.length} tareas resueltas</div><div id="maintenanceTasks">${selectedSection.tasks.map((task, index) => { const itemState = state[index] || {}; return `<div class="maintenance-task ${itemState.done || itemState.na ? 'done' : ''}" data-task-index="${index}"><div class="task-controls"><label><input type="checkbox" data-task-action="done" ${itemState.done ? 'checked' : ''} /> Hecha</label><label><input type="checkbox" data-task-action="na" ${itemState.na ? 'checked' : ''} /> No aplica</label></div><div><strong>${safeText(task)}</strong><textarea data-task-action="note" rows="2" placeholder="Nota de esta tarea">${safeText(itemState.note || '')}</textarea></div></div>`; }).join('')}</div><div class="maintenance-free-notes"><label for="maintenanceNotes">Notas adicionales</label><textarea id="maintenanceNotes" rows="4" placeholder="Anota aquí cualquier trabajo u observación que no esté en las tareas.">${safeText(state.notes || '')}</textarea><small>Estas notas se guardan con el mantenimiento y aparecen en el Libro de vida.</small></div><div class="workshop-footer"><button class="workshop-button workshop-close-bottom" id="workshopModeButtonBottom" type="button" data-tooltip="Guarda automáticamente los cambios y vuelve a la vista de mantenimiento.">Cerrar modo taller</button></div>`;
  document.getElementById('saveSessionButton').textContent = 'Guardar marcador y uso real';
  markSchedule(panel.querySelector('.card-top > div'), selectedSchedule);
  const realHoursInput = document.getElementById('sessionRealHours');
  const realKmInput = document.getElementById('sessionRealKm');
  let manualRealHours = false;
  let manualRealKm = false;
  realHoursInput.addEventListener('input', () => { manualRealHours = true; });
  realKmInput.addEventListener('input', () => { manualRealKm = true; });
  document.getElementById('sessionHours').addEventListener('input', event => {
    if (!manualRealHours) {
      const estimate = estimateRealReading(event.target.value, session.markerHours, session.realHours, bikeData.markerHours, bikeData.realHours);
      if (estimate !== null) realHoursInput.value = estimate;
    }
  });
  document.getElementById('sessionKm').addEventListener('input', event => {
    if (!manualRealKm) {
      const estimate = estimateRealReading(event.target.value, session.markerKm, session.realKm, bikeData.markerKm, bikeData.realKm);
      if (estimate !== null) realKmInput.value = estimate;
    }
  });
  if (complete) {
    const nextButton = document.createElement('button');
    nextButton.type = 'button'; nextButton.className = 'primary-button'; nextButton.textContent = 'Comenzar una nueva revisión';
    nextButton.addEventListener('click', () => {
      syncCompletedMaintenanceEvent(selectedSection.label);
      localStorage.removeItem(maintenanceSessionKey(selectedSection.label));
      localStorage.removeItem(checklistStateKey(selectedSection.label));
      maintenanceSession(selectedSection.label);
      syncMaintenanceProgressEvent(selectedSection.label);
      renderMaintenanceChecklist(); updateMaintenanceEntryButtons();
    });
    panel.querySelector('.maintenance-complete').appendChild(nextButton);
  }
  const intervalSelect = document.getElementById('checklistInterval');
  const maintenanceNotesInput = document.getElementById('maintenanceNotes');
  maintenanceNotesInput.addEventListener('input', () => {
    const nextState = readChecklistState(selectedSection.label);
    nextState.notes = maintenanceNotesInput.value;
    localStorage.setItem(checklistStateKey(selectedSection.label), JSON.stringify(nextState));
    syncMaintenanceProgressEvent(selectedSection.label);
  });
  panel.querySelectorAll('[data-task-index]').forEach(task => {
    const taskIndex = task.dataset.taskIndex;
    const taskState = state[taskIndex] || {};
    const attachmentField = document.createElement('div');
    attachmentField.className = 'task-attachment-field';
    attachmentField.innerHTML = `<div class="attachment-pickers"><label class="attachment-picker">＋ Fichero<input type="file" data-task-attachment="file" accept="${attachmentAccept}" multiple /></label><label class="attachment-picker">◉ Cámara<input type="file" data-task-attachment="camera" accept="image/*,video/*" capture="environment" /></label></div>${attachmentMarkup(taskState.attachments || [], 'task-attachments')}`;
    task.children[1]?.appendChild(attachmentField);
    attachmentField.querySelectorAll('input[data-task-attachment]').forEach(input => input.addEventListener('change', async event => {
      try {
        const nextState = readChecklistState(selectedSection.label);
        const added = await filesToAttachments(event.target.files);
        nextState[taskIndex] = { ...(nextState[taskIndex] || {}), attachments: [...(nextState[taskIndex]?.attachments || []), ...added] };
        localStorage.setItem(checklistStateKey(selectedSection.label), JSON.stringify(nextState));
        syncMaintenanceProgressEvent(selectedSection.label);
        renderMaintenanceChecklist();
      } catch (error) {
        console.error('No se pudo guardar el archivo de la tarea.', error);
        window.alert('No se ha podido guardar este archivo. Si ocupa mucho, prueba con una imagen más pequeña.');
      } finally {
        event.target.value = '';
      }
    }));
  });
  intervalSelect.addEventListener('change', () => { localStorage.setItem(`motoMaintenanceChecklistInterval:${maintenancePlanKey()}`, intervalSelect.value); renderMaintenanceChecklist(); });
  document.getElementById('workshopModeButton').addEventListener('click', () => closeWorkshop(selectedSection.label));
  document.getElementById('workshopModeButtonBottom').addEventListener('click', () => closeWorkshop(selectedSection.label));
  document.getElementById('saveSessionButton').addEventListener('click', () => {
    const values = ['sessionHours', 'sessionKm', 'sessionRealHours', 'sessionRealKm'].map(id => MaintenanceSchedule.hours(document.getElementById(id).value));
    const date = document.getElementById('sessionDate').value;
    if (values.some(value => value === null) || !date || date > todayISO()) { window.alert('Indica una fecha no futura y lecturas válidas, iguales o mayores que cero.'); return; }
    const sessionData = { ...maintenanceSession(selectedSection.label), date, markerHours: values[0], markerKm: values[1], realHours: values[2], realKm: values[3] };
    localStorage.setItem(maintenanceSessionKey(selectedSection.label), JSON.stringify(sessionData));
    applyMaintenanceReadingsToBike(sessionData);
    syncCompletedMaintenanceEvent(selectedSection.label);
    renderMaintenanceChecklist();
  });
  document.getElementById('resetMaintenanceButton').addEventListener('click', () => {
    if (!window.confirm(`Se perderán las marcas y notas de ${selectedSection.label}. ¿Quieres resetear este mantenimiento?`)) return;
    const savedSession = readMaintenanceSession(selectedSection.label);
    localStorage.removeItem(maintenanceSessionKey(selectedSection.label));
    localStorage.removeItem(checklistStateKey(selectedSection.label));
    const generatedEventIds = new Set([maintenanceEventId(selectedSection.label), savedSession?.eventId].filter(Boolean));
    events = events.filter(item => !generatedEventIds.has(item.maintenanceEventId));
    saveEvents();
    updateBikeView();
    renderTimeline();
    renderUsageChart();
    workshopOpen = false;
    document.body.classList.remove('workshop-mode');
    renderMaintenanceChecklist();
    updateMaintenanceEntryButtons();
    const returnView = maintenanceReturnView;
    maintenanceReturnView = null;
    if (returnView) showView(returnView);
  });
  panel.querySelectorAll('[data-task-action]').forEach(control => control.addEventListener('change', () => {
    const task = control.closest('[data-task-index]');
    const taskIndex = task.dataset.taskIndex;
    const nextState = readChecklistState(selectedSection.label);
    nextState[taskIndex] = { ...(nextState[taskIndex] || {}), [control.dataset.taskAction]: control.type === 'checkbox' ? control.checked : control.value };
    if (control.dataset.taskAction === 'done' && control.checked) { task.querySelector('[data-task-action="na"]').checked = false; nextState[taskIndex].na = false; }
    if (control.dataset.taskAction === 'na' && control.checked) { task.querySelector('[data-task-action="done"]').checked = false; nextState[taskIndex].done = false; }
    localStorage.setItem(checklistStateKey(selectedSection.label), JSON.stringify(nextState));
    syncCompletedMaintenanceEvent(selectedSection.label);
    renderMaintenanceChecklist();
    updateMaintenanceEntryButtons();
  }));
}
renderMaintenanceChecklist();
function setupMaintenanceEntryPoints() { renderMaintenanceLauncher(); }
function updateMaintenanceEntryButtons() { renderMaintenanceLauncher(); }
setupMaintenanceEntryPoints();

const backupPanel = document.createElement('section');
backupPanel.className = 'panel backup-panel';
backupPanel.innerHTML = `<h3>Copia de seguridad</h3><p>Guarda todas tus motos, historiales, planes, revisiones en curso, fotos y archivos adjuntos en un archivo. Puedes recuperarlos en este navegador o llevarlos a otro dispositivo.</p><div class="backup-actions"><button type="button" class="primary-button" id="downloadBackup">Guardar copia</button><button type="button" class="quiet-button" id="restoreBackup">Restaurar copia</button><button type="button" class="quiet-button" id="restoreCatalog">Recuperar catálogo inicial</button><input type="file" id="backupFile" accept=".json,application/json" hidden /></div><p>Al restaurar se sustituirán los datos de todas las motos. Guarda antes una copia de los datos actuales. El archivo contiene tus datos personales y adjuntos; consérvalo en un lugar privado.</p><p id="backupStatus" role="status" aria-live="polite"></p>`;
document.getElementById('view-motos').appendChild(backupPanel);
const backupStatus = document.getElementById('backupStatus');
document.getElementById('restoreCatalog').addEventListener('click', () => { const saved = JSON.parse(localStorage.getItem('motoCatalogBackup') || 'null'); if (!saved?.profiles?.length) { backupStatus.textContent = 'No hay un catálogo inicial guardado.'; return; } if (!window.confirm('Se recuperarán las cuatro motos del catálogo inicial. ¿Continuar?')) return; bikeProfiles = saved.profiles; localStorage.setItem('motoProfiles', JSON.stringify(bikeProfiles)); activeBikeId = bikeProfiles[0].id; localStorage.setItem('activeBikeId', activeBikeId); window.location.reload(); });
document.getElementById('downloadBackup').addEventListener('click', () => {
  try {
    saveBikeProfiles();
    saveEvents();
    localStorage.setItem('activeBikeId', activeBikeId);
    const backup = MotoBackup.create(localStorage);
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `mis-motos-copia-${todayISO()}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    backupStatus.textContent = 'Copia preparada. Comprueba que el archivo se ha guardado en tus descargas.';
  } catch (error) { backupStatus.textContent = `No se ha podido crear la copia. ${error.message}`; }
});
document.getElementById('restoreBackup').addEventListener('click', () => document.getElementById('backupFile').click());
document.getElementById('backupFile').addEventListener('change', async event => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  try {
    const backup = MotoBackup.validate(JSON.parse(await file.text()));
    const profiles = JSON.parse(backup.data.motoProfiles);
    const date = new Date(backup.createdAt).toLocaleString('es-ES');
    if (!window.confirm(`Restaurar copia del ${date}:\n${profiles.map(profile => `${profile.brand} ${profile.model}`).join('\n')}\n\nSe sustituirán los datos de todas las motos de este navegador. ¿Continuar?`)) {
      backupStatus.textContent = 'Restauración cancelada. Tus datos siguen igual.';
      return;
    }
    MotoBackup.restore(localStorage, backup);
    window.location.reload();
  } catch (error) { backupStatus.textContent = `No se ha podido restaurar la copia. ${error instanceof SyntaxError ? 'El archivo no contiene un JSON válido.' : error.message}`; }
});
const returnBikeView = sessionStorage.getItem('motoReturnView');
const lastView = sessionStorage.getItem('motoLastView');
if (returnBikeView && labels[returnBikeView]) showView(returnBikeView);
else if (lastView && labels[lastView]) showView(lastView);
else showView('motos');
sessionStorage.removeItem('motoReturnView');


document.getElementById('componentSort')?.addEventListener('change', event => { localStorage.setItem(bikeStorageKey('componentSort'), event.target.value); renderComponents(); }); const savedComponentSort = localStorage.getItem(bikeStorageKey('componentSort')); if (savedComponentSort && document.getElementById('componentSort')) document.getElementById('componentSort').value = savedComponentSort;

















 document.body.classList.remove('app-loading');

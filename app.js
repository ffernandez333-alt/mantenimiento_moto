const navItems = document.querySelectorAll('[data-view]');
const pages = document.querySelectorAll('.page');
const breadcrumb = document.getElementById('breadcrumbCurrent');
const sidebar = document.getElementById('sidebar');

const labels = { hoy: 'Centro de control', dashboard: 'Centro de control', motos: 'Mis motos', vida: 'Libro de vida', mantenimiento: 'Mantenimiento', componentes: 'Componentes', documentos: 'Documentos y gastos', tecnico: 'Banco técnico' };
const technicalDashboardTitle = document.querySelector('#view-dashboard h1');
if (technicalDashboardTitle) technicalDashboardTitle.textContent = 'Telemetría y uso';
const technicalDashboardEyebrow = document.querySelector('#view-dashboard .eyebrow');
if (technicalDashboardEyebrow) technicalDashboardEyebrow.textContent = 'Datos técnicos';
const technicalDashboardSubtitle = document.querySelector('#view-dashboard .subtitle');
if (technicalDashboardSubtitle) technicalDashboardSubtitle.textContent = 'Horas, kilómetros, gastos y próximos trabajos de tu KTM.';
const controlSubtitle = document.querySelector('#view-hoy .page-heading .subtitle');
if (controlSubtitle) controlSubtitle.textContent = 'Estado, uso y mantenimiento de tu KTM en una sola vista.';
const bikeDefaults = { brand: 'KTM', model: '250 EXC TPI', year: '2021', plate: '9038 LKN', realHours: 195, markerHours: 195, realKm: 2908, markerKm: 2908 };
const legacyProfile = JSON.parse(localStorage.getItem('motoProfile') || 'null');
let bikeProfiles = JSON.parse(localStorage.getItem('motoProfiles') || 'null');
if (!Array.isArray(bikeProfiles) || !bikeProfiles.length) bikeProfiles = [{ id: 'moto-1', ...bikeDefaults, ...(legacyProfile || {}) }];
let activeBikeId = localStorage.getItem('activeBikeId') || bikeProfiles[0].id;
if (!bikeProfiles.some(profile => profile.id === activeBikeId)) activeBikeId = bikeProfiles[0].id;
function bikeStorageKey(name) { return `${name}:${activeBikeId}`; }
function saveEvents() { localStorage.setItem(bikeStorageKey('motoEvents'), JSON.stringify(events)); }

function showView(view) {
  const controlView = view === 'hoy' || view === 'dashboard';
  if (view === 'vida' && typeof refreshMaintenanceLifeEvents === 'function') {
    try { refreshMaintenanceLifeEvents(); } catch (error) { console.error('No se pudo actualizar el Libro de vida.', error); }
  }
  pages.forEach(page => page.classList.toggle('hidden', controlView ? !['view-hoy', 'view-dashboard'].includes(page.id) : page.id !== `view-${view}`));
  document.querySelectorAll('.nav-item[data-view]').forEach(item => item.classList.toggle('active', item.dataset.view === (controlView ? 'hoy' : view)));
  breadcrumb.textContent = labels[view] || 'Centro de control';
  sidebar.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navItems.forEach(item => item.addEventListener('click', () => showView(item.dataset.view)));
document.getElementById('mobileMenu').addEventListener('click', () => sidebar.classList.toggle('open'));

const modal = document.getElementById('eventModal');
let editingIndex = null;
let eventAttachmentDraft = [];
const attachmentAccept = 'image/*,video/*,.pdf,.doc,.docx,.txt';
function attachmentId() { return `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function filesToAttachments(fileList) {
  return Promise.all([...fileList].map(file => new Promise((resolve, reject) => {
    if (file.size > 15 * 1024 * 1024) { window.alert(`El archivo ${file.name} supera el límite de 15 MB.`); resolve(null); return; }
    const reader = new FileReader();
    reader.onload = () => resolve({ id: attachmentId(), name: file.name, type: file.type || 'application/octet-stream', size: file.size, data: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  }))).then(items => items.filter(Boolean));
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
const eventAttachmentField = document.createElement('div');
eventAttachmentField.className = 'attachment-field';
eventAttachmentField.innerHTML = `<strong>Archivos adjuntos</strong><div class="attachment-pickers"><label class="attachment-picker">＋ Añadir fichero<input id="eventAttachments" type="file" accept="${attachmentAccept}" multiple /></label><label class="attachment-picker">◉ Usar cámara<input id="eventCamera" type="file" accept="image/*,video/*" capture="environment" /></label></div><small>Fotos, vídeos, PDF y otros documentos. Máximo 15 MB por archivo.</small><div id="eventAttachmentList" class="event-attachments"></div>`;
document.querySelector('#eventForm .modal-actions')?.before(eventAttachmentField);
document.getElementById('eventAttachments')?.addEventListener('change', async event => { eventAttachmentDraft.push(...await filesToAttachments(event.target.files)); renderEventAttachmentDraft(); event.target.value = ''; });
document.getElementById('eventCamera')?.addEventListener('change', async event => { eventAttachmentDraft.push(...await filesToAttachments(event.target.files)); renderEventAttachmentDraft(); event.target.value = ''; });
function toggleMaintenanceParts() { maintenanceParts.hidden = document.getElementById('eventType').value !== 'Mantenimiento'; }
document.getElementById('eventType').addEventListener('change', toggleMaintenanceParts);
toggleMaintenanceParts();
function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatDate(dateValue) { return new Date(`${dateValue}T12:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', ''); }
function openModal() {
  editingIndex = null;
  eventAttachmentDraft = [];
  modal.querySelector('h2').textContent = 'Registrar evento';
  modal.querySelector('button[type="submit"]').textContent = 'Guardar evento';
  document.getElementById('eventDate').value = todayISO();
  document.getElementById('eventHours').value = Number(bikeData.markerHours).toFixed(1);
  document.getElementById('eventKm').value = Math.round(Number(bikeData.markerKm));
  document.getElementById('eventRealHours').value = Math.round(Number(bikeData.realHours));
  document.getElementById('eventRealKm').value = Math.round(Number(bikeData.realKm));
  maintenanceParts.querySelectorAll('input').forEach(input => { input.checked = false; });
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
if (activeBikeId === 'moto-1' && !localStorage.getItem(bikeStorageKey('motoEvents'))) saveEvents();
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
  const noteMatch = String(item.notes || '').match(/(\d+(?:[.,]\d+)?)\s*h(?: entre paréntesis)?/i);
  return noteMatch ? noteMatch[1].replace(',', '.') : item.hours;
}
function eventTitle(item) {
  const title = item.type === 'Mantenimiento' ? `${item.description} (${realHoursFor(item) ? wholeReading(realHoursFor(item)) : '—'} h reales)` : item.description;
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
  const orderedEvents = events.map((item, index) => ({ item, index })).filter(({ item }) => (filterType === 'all' || item.type === filterType) && (filterYear === 'all' || String(item.dateISO || '').startsWith(filterYear))).sort((a, b) => { const result = String(a.item.dateISO || '').localeCompare(String(b.item.dateISO || '')); return sortDirection === 'desc' ? -result : result; });
  timeline.innerHTML = '<div class="timeline-date">HISTORIAL</div>' + orderedEvents.map(({ item, index }) => `<div class="timeline-event"><div class="timeline-dot ${eventClass(item.type)}"></div><div class="timeline-card"><div class="activity-icon ${eventClass(item.type)}">${eventIcon(item.type)}</div><div class="activity-main"><strong>${eventTitle(item)}</strong><span>${safeText(item.date)}${eventReadings(item) ? ` · ${safeText(eventReadings(item))}` : ''}</span>${item.notes ? `<p>${safeText(item.notes)}</p>` : ''}</div><strong class="activity-cost">${safeText(item.cost || '—')}</strong><button class="event-edit" data-event-index="${index}" aria-label="Editar evento">✎</button><button class="event-delete" data-event-index="${index}" aria-label="Eliminar evento" title="Eliminar evento">🗑</button></div></div>`).join('');
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
  showView('vida');
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
  text(`Año ${bikeData.year} · ${bikeData.plate || 'Sin matrícula'}`, pageWidth - margin - 7, y + 18, 9, [255, 255, 255], 'normal');
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
typeSelect.innerHTML = '<option value="all">Todos los eventos</option>' + [...new Set(events.map(item => item.type))].sort().map(type => `<option value="${safeText(type)}">${safeText(type)}</option>`).join('');
typeSelect.addEventListener('change', () => { filterType = typeSelect.value; renderTimeline(); });
document.querySelector('.filters')?.prepend(typeSelect);
const yearSelect = document.createElement('select');
yearSelect.className = 'filter-button';
yearSelect.setAttribute('aria-label', 'Filtrar por año');
const years = [...new Set(events.map(item => String(item.dateISO || '').slice(0, 4)).filter(Boolean))].sort().reverse();
yearSelect.innerHTML = '<option value="all">Todos los años</option>' + years.map(year => `<option value="${year}">${year}</option>`).join('');
yearSelect.addEventListener('change', () => { filterYear = yearSelect.value; renderTimeline(); });
document.querySelector('.filters')?.prepend(yearSelect);

document.getElementById('timeline').addEventListener('click', event => {
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
  document.getElementById('eventDescription').value = item.description;
  document.getElementById('eventHours').value = item.hours || '';
  document.getElementById('eventKm').value = item.km || '';
  document.getElementById('eventRealHours').value = item.realHours || item.hours || '';
  document.getElementById('eventRealKm').value = item.realKm || item.km || '';
  document.getElementById('eventCost').value = (item.cost || '').replace(' €', '').replace(',', '.');
  document.getElementById('eventNotes').value = item.notes || '';
  eventAttachmentDraft = [...(item.attachments || [])];
  renderEventAttachmentDraft();
  modal.classList.remove('hidden');
});

document.getElementById('eventForm').addEventListener('submit', async event => {
  event.preventDefault();
  const description = document.getElementById('eventDescription').value.trim();
  if (!description) return;
  const type = document.getElementById('eventType').value;
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
  const markerNote = type === 'Cambio de marcador' ? `Marcador actualizado a ${Number.isFinite(visibleHours) ? visibleHours : bikeData.markerHours} h / ${Number.isFinite(visibleKm) ? visibleKm : bikeData.markerKm} km. Uso real acumulado: ${actualHours} h / ${actualKm} km.` : '';
  const selectedDate = document.getElementById('eventDate').value || todayISO();
  const editedEvent = { type, description, date: formatDate(selectedDate), dateISO: selectedDate, hours: document.getElementById('eventHours').value, km: document.getElementById('eventKm').value, realHours: document.getElementById('eventRealHours').value, realKm: document.getElementById('eventRealKm').value, maintenanceParts: selectedParts, attachments: eventAttachmentDraft, cost: document.getElementById('eventCost').value ? `${document.getElementById('eventCost').value} €` : '', notes: [document.getElementById('eventNotes').value.trim(), partsNote, markerNote].filter(Boolean).join(' ') };
  if (editingIndex === null) events.unshift(editedEvent); else events[editingIndex] = editedEvent;
  saveEvents();
  renderTimeline();
  updateBikeView();
  renderMaintenanceChecklist();
  renderUsageChart();
  closeModal();
  event.target.reset();
  editingIndex = null;
  eventAttachmentDraft = [];
  showView('vida');
});

const bikeModal = document.getElementById('bikeModal');
const bikeData = { ...bikeDefaults, ...(bikeProfiles.find(profile => profile.id === activeBikeId) || {}) };
const defaultBikePhoto = 'assets/ktm-250-exc-tpi-2021.png';
function profilePhoto(profile) {
  return profile.photo || (profile.brand === 'KTM' && profile.model === bikeDefaults.model ? defaultBikePhoto : 'assets/moto-sin-foto.svg');
}
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
  document.getElementById('bikeName').textContent = `${bikeData.brand} ${bikeData.model}`;
  document.getElementById('bikeSubtitle').textContent = `${bikeData.year} · ${bikeData.plate || bikeData.id}`;
  document.getElementById('bikeBrand').textContent = bikeData.brand;
  document.getElementById('bikeModel').textContent = bikeData.model;
  document.getElementById('bikeYear').textContent = bikeData.year;
  document.getElementById('bikePlate').textContent = bikeData.plate || 'Sin identificar';
  document.getElementById('bikePhoto').src = profilePhoto(bikeData);
  document.getElementById('heroBikePhoto').src = profilePhoto(bikeData);
  document.getElementById('heroBikePhoto').alt = `${bikeData.brand} ${bikeData.model}`;
  document.getElementById('realHours').textContent = `${Math.round(Number(bikeData.realHours)).toLocaleString('es-ES')} h`;
  document.getElementById('markerHours').textContent = `${Math.round(Number(bikeData.markerHours)).toLocaleString('es-ES')} h`;
  document.getElementById('realKm').textContent = `${Number(bikeData.realKm).toLocaleString('es-ES')} km`;
  document.getElementById('markerKm').textContent = `${Number(bikeData.markerKm).toLocaleString('es-ES')} km`;
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
  if (id === activeBikeId || !bikeProfiles.some(profile => profile.id === id)) return;
  saveBikeProfiles();
  const currentPage = [...pages].find(page => !page.classList.contains('hidden'));
  sessionStorage.setItem('motoReturnView', currentPage?.id.replace('view-', '') || 'hoy');
  localStorage.setItem('activeBikeId', id);
  window.location.reload();
}
function renderBikeIdentity() {
  const name = `${bikeData.brand} ${bikeData.model}`;
  const detail = `${bikeData.year} · ${bikeData.plate || bikeData.id}`;
  document.title = `Mis motos · ${name} · ${bikeData.plate || bikeData.id}`;
  pages.forEach(page => {
    if (page.id === 'view-motos') return;
    let identity = page.querySelector('.selected-bike-context');
    if (!identity) {
      identity = document.createElement('div');
      identity.className = 'selected-bike-context';
      identity.innerHTML = '<img class="selected-bike-photo" /><div class="selected-bike-details"><small>Moto seleccionada</small><strong></strong><span></span></div><button type="button" class="quiet-button">Cambiar moto</button>';
      identity.querySelector('button').addEventListener('click', () => showView('motos'));
      page.querySelector('.page-heading').after(identity);
    }
    identity.querySelector('strong').textContent = name;
    identity.querySelector('span').textContent = detail;
    identity.querySelector('.selected-bike-photo').src = profilePhoto(bikeData);
    identity.querySelector('.selected-bike-photo').alt = name;
  });
}
function renderAllBikeProfiles() {
  const view = document.getElementById('view-motos');
  const selected = view.querySelector('.bike-profile');
  selected.classList.add('selected-profile');
  selected.querySelector('.status-pill').textContent = '✓ Moto seleccionada';
  selected.querySelector('.profile-id').textContent = `ID · ${activeBikeId}`;
  selected.querySelector('#bikePhoto').alt = `${bikeData.brand} ${bikeData.model}`;
  selected.querySelector('.photo-label').textContent = profilePhoto(bikeData).endsWith('moto-sin-foto.svg') ? 'Añade una foto desde Editar ficha' : `${bikeData.brand} ${bikeData.model}`;
  view.querySelector('.page-heading .subtitle').textContent = `${bikeProfiles.length} ${bikeProfiles.length === 1 ? 'moto guardada' : 'motos guardadas'}. Selecciona una ficha para consultar su actividad y mantenimiento.`;
  let others = view.querySelector('.other-bike-profiles');
  if (!others) {
    others = document.createElement('div');
    others.className = 'other-bike-profiles';
    selected.after(others);
  }
  others.replaceChildren();
  bikeProfiles.filter(profile => profile.id !== activeBikeId).forEach(profile => {
    const card = document.createElement('section');
    card.className = 'bike-profile';
    card.innerHTML = '<div class="profile-visual"></div><div class="profile-details"><div class="profile-title"><div><h2></h2><p></p></div><button type="button" class="primary-button">Seleccionar moto</button></div><div class="detail-grid"></div></div>';
    card.querySelector('h2').textContent = `${profile.brand} ${profile.model}`;
    card.querySelector('.profile-title p').textContent = `${profile.year} · ${profile.plate || profile.id}`;
    card.querySelector('button').addEventListener('click', () => selectBike(profile.id));
    if (profile.photo || (profile.brand === 'KTM' && profile.model === bikeDefaults.model)) {
      const photo = document.createElement('img');
      photo.src = profile.photo || defaultBikePhoto;
      photo.alt = `${profile.brand} ${profile.model}`;
      card.querySelector('.profile-visual').appendChild(photo);
    } else {
      card.querySelector('.profile-visual').textContent = 'Sin foto';
    }
    const fields = [['Marca', profile.brand], ['Modelo', profile.model], ['Año', profile.year], ['Matrícula / ID', profile.plate || profile.id], ['Horas reales', `${Number(profile.realHours || 0).toLocaleString('es-ES')} h`], ['Horas del marcador', `${Number(profile.markerHours || 0).toLocaleString('es-ES')} h`], ['Kilómetros reales', `${Number(profile.realKm || 0).toLocaleString('es-ES')} km`], ['Kilómetros del marcador', `${Number(profile.markerKm || 0).toLocaleString('es-ES')} km`]];
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
  view.querySelector('.profile-section-heading h2').textContent = `Configuración de mantenimiento · ${bikeData.brand} ${bikeData.model}`;
  view.querySelector('.profile-section-heading p').textContent = `Moto seleccionada: ${bikeData.plate || activeBikeId}. Intervalos usados para generar avisos.`;
}
updateBikeView();
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
  switcher.innerHTML = `<div class="bike-list" aria-label="Mis motos">${bikeProfiles.map(profile => `<button type="button" class="bike-list-item ${profile.id === activeBikeId ? 'active' : ''}" aria-pressed="${profile.id === activeBikeId}" data-bike-id="${safeText(profile.id)}"><img src="${profilePhoto(profile)}" alt="" /><span><strong>${safeText(`${profile.brand} ${profile.model}`)}</strong><small>${safeText(`${profile.year} · ${profile.plate || profile.id}`)}</small></span></button>`).join('')}</div>`;
  switcher.querySelectorAll('.bike-list-item').forEach(button => button.addEventListener('click', () => selectBike(button.dataset.bikeId)));
}
renderBikeSwitcher();
let creatingBike = false;
const addBikeButton = document.createElement('button');
addBikeButton.className = 'primary-button';
addBikeButton.id = 'addBike';
addBikeButton.innerHTML = '<span>＋</span> Añadir moto';
document.querySelector('#view-motos .page-heading')?.appendChild(addBikeButton);
const editBikeButton = document.getElementById('editBike');
document.querySelector('#view-motos .profile-title')?.appendChild(editBikeButton);
addBikeButton.addEventListener('click', () => {
  creatingBike = true;
  bikeModal.dataset.mode = 'new';
  bikeModal.querySelector('h2').textContent = 'Añadir moto';
  document.getElementById('formBrand').value = '';
  document.getElementById('formModel').value = '';
  document.getElementById('formYear').value = new Date().getFullYear();
  document.getElementById('formPlate').value = '';
  document.getElementById('formRealHours').value = 0;
  document.getElementById('formMarkerHours').value = 0;
  document.getElementById('formRealKm').value = 0;
  document.getElementById('formMarkerKm').value = 0;
  document.getElementById('formPhoto').value = '';
  bikeModal.classList.remove('hidden');
});
document.getElementById('editBike').addEventListener('click', () => {
  creatingBike = false;
  bikeModal.dataset.mode = 'edit';
  bikeModal.querySelector('h2').textContent = 'Editar datos básicos';
  document.getElementById('formBrand').value = bikeData.brand;
  document.getElementById('formModel').value = bikeData.model;
  document.getElementById('formYear').value = bikeData.year;
  document.getElementById('formPlate').value = bikeData.plate;
  document.getElementById('formRealHours').value = bikeData.realHours;
  document.getElementById('formMarkerHours').value = bikeData.markerHours;
  document.getElementById('formRealKm').value = bikeData.realKm;
  document.getElementById('formMarkerKm').value = bikeData.markerKm;
  document.getElementById('formPhoto').value = '';
  bikeModal.classList.remove('hidden');
});
function closeBikeModal() { bikeModal.classList.add('hidden'); }
document.getElementById('closeBikeModal').addEventListener('click', closeBikeModal);
document.getElementById('cancelBikeModal').addEventListener('click', closeBikeModal);
bikeModal.addEventListener('click', event => { if (event.target === bikeModal) closeBikeModal(); });
document.getElementById('bikeForm').addEventListener('submit', event => {
  event.preventDefault();
  if (creatingBike) {
    const newId = `moto-${Date.now()}`;
    const newProfile = { id: newId, brand: document.getElementById('formBrand').value.trim(), model: document.getElementById('formModel').value.trim(), year: document.getElementById('formYear').value, plate: document.getElementById('formPlate').value.trim(), realHours: Math.round(Number(document.getElementById('formRealHours').value)), markerHours: Math.round(Number(document.getElementById('formMarkerHours').value)), realKm: Math.round(Number(document.getElementById('formRealKm').value)), markerKm: Math.round(Number(document.getElementById('formMarkerKm').value)) };
    const file = document.getElementById('formPhoto').files[0];
    const finishNewBike = () => { saveBikeProfiles(); activeBikeId = newId; bikeProfiles.push(newProfile); localStorage.setItem('motoProfiles', JSON.stringify(bikeProfiles)); localStorage.setItem('activeBikeId', activeBikeId); events = []; saveEvents(); window.location.reload(); };
    if (file) { const reader = new FileReader(); reader.onload = () => { newProfile.photo = reader.result; finishNewBike(); }; reader.readAsDataURL(file); } else finishNewBike();
    return;
  }
  bikeData.brand = document.getElementById('formBrand').value.trim();
  bikeData.model = document.getElementById('formModel').value.trim();
  bikeData.year = document.getElementById('formYear').value;
  bikeData.plate = document.getElementById('formPlate').value.trim();
  bikeData.realHours = Math.round(Number(document.getElementById('formRealHours').value));
  bikeData.markerHours = Math.round(Number(document.getElementById('formMarkerHours').value));
  bikeData.realKm = Math.round(Number(document.getElementById('formRealKm').value));
  bikeData.markerKm = Math.round(Number(document.getElementById('formMarkerKm').value));
  const file = document.getElementById('formPhoto').files[0];
  const save = () => { saveBikeProfiles(); maintenancePlan = filterMaintenancePlan(JSON.parse(localStorage.getItem(maintenancePlanKey()) || 'null') || defaultMaintenancePlan); updateBikeView(); renderBikeSwitcher(); renderMaintenancePlan(); renderMaintenanceChecklist(); closeBikeModal(); };
  if (file) { const reader = new FileReader(); reader.onload = () => { bikeData.photo = reader.result; save(); }; reader.readAsDataURL(file); } else save();
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
    { label: 'Cada 48 meses', kind: 'Cuatro años', tasks: ['Sustituir el líquido de frenos delantero.', 'Sustituir el líquido de frenos trasero.', 'Cambiar el líquido de embrague hidráulico.', 'Engrasar el cojinete de la dirección.', 'Limpiar la manguera del sensor de presión.', 'Limpiar la cubierta de protección del sensor de presión.', 'Sustituir el líquido refrigerante.'] }
  ]
};
function maintenancePlanKey() { return `motoMaintenancePlan:${encodeURIComponent(activeBikeId)}`; }
function isSelectableMaintenanceSection(section) {
  const label = String(section?.label || '');
  return !/tareas detectadas|despu[eé]s de\s+(?:10|15|20)\s+horas?|cada\s+10\s+horas|deportiv|competici[oó]n|inicial/i.test(label);
}
function filterMaintenancePlan(plan) { return { ...plan, sections: (plan.sections || []).filter(isSelectableMaintenanceSection) }; }
let maintenancePlan = filterMaintenancePlan(JSON.parse(localStorage.getItem(maintenancePlanKey()) || 'null') || defaultMaintenancePlan);
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
  summary.innerHTML = `<div class="maintenance-launch-card"><div class="maintenance-launch-header"><div><span class="interval-label">NUEVA REVISIÓN</span><h2>Iniciar mantenimiento</h2><p>Selecciona uno o varios mantenimientos. Las tareas repetidas se mostrarán una sola vez.</p></div><button type="button" class="primary-button" id="startSelectedMaintenance">Iniciar mantenimiento</button></div><div class="maintenance-selection" role="group" aria-label="Mantenimientos disponibles">${sections.map(section => `<label><input type="checkbox" value="${safeText(section.label)}" /> <span><strong>${safeText(section.label)}</strong><small>${section.tasks.length} tareas · ${safeText(section.kind)}</small></span></label>`).join('')}</div>${activeCombined.length ? `<div class="maintenance-active-list"><strong>Revisiones en curso</strong>${activeCombined.map(section => `<button type="button" class="quiet-button active-maintenance-button" data-maintenance-label="${safeText(section.label)}">Continuar: ${safeText(section.label)}</button>`).join('')}</div>` : ''}</div>`;
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
function hasMaintenanceProgress(sectionLabel) { const state = readChecklistState(sectionLabel); return Boolean(readMaintenanceSession(sectionLabel) || Object.values(state).some(item => item?.done || item?.na || item?.note)); }
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
}
function syncMaintenanceProgressEvent(sectionLabel) {
  const section = maintenancePlan?.sections?.find(item => item.label === sectionLabel);
  if (!section || !hasMaintenanceProgress(sectionLabel)) return;
  const session = maintenanceSession(sectionLabel);
  const progress = maintenanceProgress(sectionLabel);
  const taskAttachments = section.tasks.flatMap((_, index) => readChecklistState(sectionLabel)[index]?.attachments || []);
  const id = session.eventId || maintenanceEventId(sectionLabel);
  const event = { maintenanceEventId: id, maintenanceInterval: sectionLabel, maintenanceStatus: maintenanceIsComplete(sectionLabel) ? 'completed' : 'in_progress', maintenanceCompleted: progress.completed, maintenanceTotal: progress.total, maintenancePercent: progress.percent, attachments: taskAttachments, type: 'Mantenimiento', description: `Revisión · ${sectionLabel}${maintenanceIsComplete(sectionLabel) ? '' : ' (en curso)'}`, date: formatDate(session.date || todayISO()), dateISO: session.date || todayISO(), hours: readingNumber(session.markerHours), km: readingNumber(session.markerKm), realHours: readingNumber(session.realHours), realKm: readingNumber(session.realKm), notes: `Mantenimiento: ${progress.completed} de ${progress.total} tareas resueltas.` };
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
  const id = session.eventId || maintenanceEventId(sectionLabel);
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
    notes: [`Mantenimiento completado (${section.tasks.length} tareas).`, taskNotes].filter(Boolean).join(' ')
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
  panel.innerHTML = `<div class="card-top"><div><h3>Lista de tareas · ${safeText(selectedSection.label)}</h3><p>${safeText(scheduleText(selectedSchedule))} Marca cada tarea o indica si no aplica.</p></div><div class="checklist-actions"><div class="checklist-select"><label for="checklistInterval">Intervalo</label><select id="checklistInterval">${availableSections.map(section => `<option value="${safeText(section.label)}" ${section.label === selectedLabel ? 'selected' : ''}>${safeText(section.label)}</option>`).join('')}</select></div><button class="quiet-button workshop-button" id="workshopModeButton" type="button">Cerrar modo taller</button><button class="quiet-button reset-maintenance-button" id="resetMaintenanceButton" type="button">Resetear mantenimiento</button></div></div>${pendingPrevious ? '<div class="maintenance-warning">La revisión de 20 horas todavía no está terminada. Puedes continuar con esta revisión, pero quedan tareas pendientes.</div>' : ''}${complete ? '<div class="maintenance-complete"><span>✓</span><strong>Mantenimiento realizado</strong><small>Todas las tareas están resueltas. Puedes cerrar la hoja.</small></div>' : ''}<div class="maintenance-session"><strong>Datos de esta revisión</strong><p class="session-help">Al cambiar las lecturas del marcador, las horas y kilómetros reales se calculan automáticamente. Puedes corregirlos.</p><div class="session-fields"><label class="session-date-field">Fecha<input id="sessionDate" type="date" value="${safeText(session.date)}" /></label><div class="reading-group marker-reading"><strong>Marcador</strong><span>Lo que indica el cuadro de la moto</span><label>Horas<input id="sessionHours" type="number" step="1" value="${safeText(session.markerHours)}" /></label><label>Kilómetros<input id="sessionKm" type="number" step="1" value="${safeText(session.markerKm)}" /></label></div><div class="reading-group real-reading"><strong>Uso real acumulado</strong><span>Se calcula automáticamente y se puede editar</span><label>Horas<input id="sessionRealHours" type="number" min="0" step="any" value="${safeText(session.realHours)}" /></label><label>Kilómetros<input id="sessionRealKm" type="number" min="0" step="any" value="${safeText(session.realKm)}" /></label></div><button class="quiet-button" id="saveSessionButton" type="button">Guardar datos</button></div></div><div class="checklist-progress">${completed} de ${selectedSection.tasks.length} tareas resueltas</div><div id="maintenanceTasks">${selectedSection.tasks.map((task, index) => { const itemState = state[index] || {}; return `<div class="maintenance-task ${itemState.done || itemState.na ? 'done' : ''}" data-task-index="${index}"><div class="task-controls"><label><input type="checkbox" data-task-action="done" ${itemState.done ? 'checked' : ''} /> Hecha</label><label><input type="checkbox" data-task-action="na" ${itemState.na ? 'checked' : ''} /> No aplica</label></div><div><strong>${safeText(task)}</strong><textarea data-task-action="note" rows="2" placeholder="Nota de esta tarea">${safeText(itemState.note || '')}</textarea></div></div>`; }).join('')}</div><div class="workshop-footer"><button class="workshop-button workshop-close-bottom" id="workshopModeButtonBottom" type="button">Cerrar modo taller</button></div>`;
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
backupPanel.innerHTML = `<h3>Copia de seguridad</h3><p>Guarda todas tus motos, historiales, planes, revisiones en curso, fotos y archivos adjuntos en un archivo. Puedes recuperarlos en este navegador o llevarlos a otro dispositivo.</p><div class="backup-actions"><button type="button" class="primary-button" id="downloadBackup">Guardar copia</button><button type="button" class="quiet-button" id="restoreBackup">Restaurar copia</button><input type="file" id="backupFile" accept=".json,application/json" hidden /></div><p>Al restaurar se sustituirán los datos de todas las motos. Guarda antes una copia de los datos actuales. El archivo contiene tus datos personales y adjuntos; consérvalo en un lugar privado.</p><p id="backupStatus" role="status" aria-live="polite"></p>`;
document.getElementById('view-motos').appendChild(backupPanel);
const backupStatus = document.getElementById('backupStatus');
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
if (returnBikeView && labels[returnBikeView]) showView(returnBikeView);
else showView('hoy');
sessionStorage.removeItem('motoReturnView');

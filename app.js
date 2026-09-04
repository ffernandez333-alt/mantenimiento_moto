const navItems = document.querySelectorAll('[data-view]');
const pages = document.querySelectorAll('.page');
const breadcrumb = document.getElementById('breadcrumbCurrent');
const sidebar = document.getElementById('sidebar');

const labels = { hoy: 'Hoy', dashboard: 'Dashboard', motos: 'Mis motos', vida: 'Libro de vida', mantenimiento: 'Mantenimiento', componentes: 'Componentes', documentos: 'Documentos y gastos', tecnico: 'Banco técnico' };

function showView(view) {
  pages.forEach(page => page.classList.toggle('hidden', page.id !== `view-${view}`));
  document.querySelectorAll('.nav-item[data-view]').forEach(item => item.classList.toggle('active', item.dataset.view === view));
  breadcrumb.textContent = labels[view] || 'Hoy';
  sidebar.classList.remove('open');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navItems.forEach(item => item.addEventListener('click', () => showView(item.dataset.view)));
document.getElementById('mobileMenu').addEventListener('click', () => sidebar.classList.toggle('open'));

const modal = document.getElementById('eventModal');
let editingIndex = null;
function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatDate(dateValue) { return new Date(`${dateValue}T12:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', ''); }
function openModal() {
  editingIndex = null;
  modal.querySelector('h2').textContent = 'Registrar evento';
  modal.querySelector('button[type="submit"]').textContent = 'Guardar evento';
  document.getElementById('eventDate').value = todayISO();
  document.getElementById('eventHours').value = Number(bikeData.markerHours).toFixed(1);
  document.getElementById('eventKm').value = Math.round(Number(bikeData.markerKm));
  modal.classList.remove('hidden');
  document.getElementById('eventDescription').focus();
}
function closeModal() { modal.classList.add('hidden'); }
['addEvent', 'addEventDash', 'addEventVida', 'addEventMaint'].forEach(id => document.getElementById(id)?.addEventListener('click', openModal));
document.getElementById('closeModal').addEventListener('click', closeModal);
document.getElementById('cancelModal').addEventListener('click', closeModal);
modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });

document.querySelectorAll('input[data-task]').forEach(input => {
  const saved = JSON.parse(localStorage.getItem('motoTasks') || '{}');
  input.checked = Boolean(saved[input.dataset.task]);
  input.addEventListener('change', () => {
    const tasks = JSON.parse(localStorage.getItem('motoTasks') || '{}');
    tasks[input.dataset.task] = input.checked;
    localStorage.setItem('motoTasks', JSON.stringify(tasks));
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
let events = JSON.parse(localStorage.getItem('motoEvents') || 'null') || defaultEvents;
function eventIcon(type) { return type === 'Mantenimiento' ? '✓' : type === 'Documento' || type === 'ITV' ? '▣' : type === 'Sustitución de componente' ? '⚙' : type === 'Cambio de marcador' ? '↔' : '⌁'; }
function eventClass(type) { return type === 'Mantenimiento' ? 'green' : type === 'Documento' || type === 'ITV' ? 'blue' : type === 'Sustitución de componente' ? 'purple' : 'orange'; }
function safeText(value) { const el = document.createElement('span'); el.textContent = value ?? ''; return el.innerHTML; }
function eventReadings(item) {
  const marker = [item.hours ? `${item.hours} h` : '', item.km ? `${item.km} km` : ''].filter(Boolean).join(' · ');
  const real = [item.realHours ? `${item.realHours} h` : '', item.realKm ? `${item.realKm} km` : ''].filter(Boolean).join(' · ');
  return [marker ? `Marcador: ${marker}` : '', real ? `Reales: ${real}` : ''].filter(Boolean).join(' · ');
}
function renderTimeline() {
  const timeline = document.getElementById('timeline');
  if (!timeline) return;
  timeline.innerHTML = '<div class="timeline-date">HISTORIAL</div>' + events.map((item, index) => `<div class="timeline-event"><div class="timeline-dot ${eventClass(item.type)}"></div><div class="timeline-card"><div class="activity-icon ${eventClass(item.type)}">${eventIcon(item.type)}</div><div class="activity-main"><strong>${safeText(item.description)}</strong><span>${safeText(item.date)}${eventReadings(item) ? ` · ${safeText(eventReadings(item))}` : ''}</span>${item.notes ? `<p>${safeText(item.notes)}</p>` : ''}</div><strong class="activity-cost">${safeText(item.cost || '—')}</strong><button class="event-edit" data-event-index="${index}" aria-label="Editar evento">✎</button></div></div>`).join('');
}
renderTimeline();

const importHistoryButton = document.createElement('button');
importHistoryButton.className = 'quiet-button import-history';
importHistoryButton.textContent = 'Importar historial KTM';
importHistoryButton.type = 'button';
importHistoryButton.addEventListener('click', () => {
  if (!confirm('Se reemplazará el historial local actual por los registros del documento Revisiones KTM. ¿Continuar?')) return;
  events = defaultEvents.map(item => ({ ...item }));
  localStorage.setItem('motoEvents', JSON.stringify(events));
  renderTimeline();
  showView('vida');
});
document.querySelector('.filters')?.appendChild(importHistoryButton);

document.getElementById('timeline').addEventListener('click', event => {
  const button = event.target.closest('.event-edit');
  if (!button) return;
  const item = events[Number(button.dataset.eventIndex)];
  if (!item) return;
  editingIndex = Number(button.dataset.eventIndex);
  modal.querySelector('h2').textContent = 'Editar evento';
  modal.querySelector('button[type="submit"]').textContent = 'Guardar cambios';
  document.getElementById('eventDate').value = item.dateISO || todayISO();
  document.getElementById('eventType').value = item.type;
  document.getElementById('eventDescription').value = item.description;
  document.getElementById('eventHours').value = item.hours || '';
  document.getElementById('eventKm').value = item.km || '';
  document.getElementById('eventCost').value = (item.cost || '').replace(' €', '').replace(',', '.');
  document.getElementById('eventNotes').value = item.notes || '';
  modal.classList.remove('hidden');
});

document.getElementById('eventForm').addEventListener('submit', event => {
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
  localStorage.setItem('motoProfile', JSON.stringify(bikeData));
  const actualHours = Number(bikeData.realHours).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
  const actualKm = Number(bikeData.realKm).toLocaleString('es-ES');
  const markerNote = type === 'Cambio de marcador' ? `Marcador actualizado a ${Number.isFinite(visibleHours) ? visibleHours : bikeData.markerHours} h / ${Number.isFinite(visibleKm) ? visibleKm : bikeData.markerKm} km. Uso real acumulado: ${actualHours} h / ${actualKm} km.` : '';
  const selectedDate = document.getElementById('eventDate').value || todayISO();
  const editedEvent = { type, description, date: formatDate(selectedDate), dateISO: selectedDate, hours: document.getElementById('eventHours').value, km: document.getElementById('eventKm').value, realHours: editingIndex === null ? '' : events[editingIndex].realHours, realKm: editingIndex === null ? '' : events[editingIndex].realKm, cost: document.getElementById('eventCost').value ? `${document.getElementById('eventCost').value} €` : '', notes: [document.getElementById('eventNotes').value.trim(), markerNote].filter(Boolean).join(' ') };
  if (editingIndex === null) events.unshift(editedEvent); else events[editingIndex] = editedEvent;
  localStorage.setItem('motoEvents', JSON.stringify(events));
  renderTimeline();
  updateBikeView();
  closeModal();
  event.target.reset();
  editingIndex = null;
  showView('vida');
});

const bikeModal = document.getElementById('bikeModal');
const bikeDefaults = { brand: 'KTM', model: '250 EXC TPI', year: '2021', plate: '9038 LKN', realHours: 194.6, markerHours: 194.6, realKm: 2908, markerKm: 2908 };
const bikeData = { ...bikeDefaults, ...JSON.parse(localStorage.getItem('motoProfile') || '{}') };
const defaultBikePhoto = 'assets/ktm-250-exc-tpi-2021.png';
function updateBikeView() {
  document.getElementById('bikeName').textContent = `${bikeData.brand} ${bikeData.model}`;
  document.getElementById('bikeSubtitle').textContent = `Enduro · ${bikeData.year} · 2 tiempos`;
  document.getElementById('bikeBrand').textContent = bikeData.brand;
  document.getElementById('bikeModel').textContent = bikeData.model;
  document.getElementById('bikeYear').textContent = bikeData.year;
  document.getElementById('bikePlate').textContent = bikeData.plate || 'Sin identificar';
  document.getElementById('bikePhoto').src = bikeData.photo || defaultBikePhoto;
  document.getElementById('heroBikePhoto').src = bikeData.photo || defaultBikePhoto;
  document.getElementById('realHours').textContent = `${Number(bikeData.realHours).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1})} h`;
  document.getElementById('markerHours').textContent = `${Number(bikeData.markerHours).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1})} h`;
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
  }
}
updateBikeView();
document.getElementById('editBike').addEventListener('click', () => {
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
  bikeData.brand = document.getElementById('formBrand').value.trim();
  bikeData.model = document.getElementById('formModel').value.trim();
  bikeData.year = document.getElementById('formYear').value;
  bikeData.plate = document.getElementById('formPlate').value.trim();
  bikeData.realHours = Math.round(Number(document.getElementById('formRealHours').value));
  bikeData.markerHours = Math.round(Number(document.getElementById('formMarkerHours').value));
  bikeData.realKm = Math.round(Number(document.getElementById('formRealKm').value));
  bikeData.markerKm = Math.round(Number(document.getElementById('formMarkerKm').value));
  const file = document.getElementById('formPhoto').files[0];
  const save = () => { localStorage.setItem('motoProfile', JSON.stringify(bikeData)); updateBikeView(); closeBikeModal(); };
  if (file) { const reader = new FileReader(); reader.onload = () => { bikeData.photo = reader.result; save(); }; reader.readAsDataURL(file); } else save();
});

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
function todayISO() { return new Date().toISOString().slice(0, 10); }
function formatDate(dateValue) { return new Date(`${dateValue}T12:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', ''); }
function openModal() {
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
  { type: 'Salida', description: 'Salida · Sierra de Espadán', date: '31 ago 2026', hours: '194,6', km: '2.908', cost: '', notes: 'Ruta con terreno seco y bastante piedra suelta.' },
  { type: 'Sustitución de componente', description: 'Sustitución · Pastillas de freno traseras', date: '18 ago 2026', hours: '194,6', km: '2.840', cost: '42,50 €', notes: '' },
  { type: 'Mantenimiento', description: 'Mantenimiento · Revisión de 40 horas', date: '02 ago 2026', hours: '190,4', km: '', cost: '86,20 €', notes: 'Aceite de motor, filtro de aceite, limpieza de filtro de aire y aprietes generales.' },
  { type: 'Documento', description: 'Documento · Informe ITV', date: '08 jul 2026', hours: '', km: '', cost: '', notes: 'ITV favorable.' }
];
let events = JSON.parse(localStorage.getItem('motoEvents') || 'null') || defaultEvents;
function eventIcon(type) { return type === 'Mantenimiento' ? '✓' : type === 'Documento' || type === 'ITV' ? '▣' : type === 'Sustitución de componente' ? '⚙' : type === 'Cambio de marcador' ? '↔' : '⌁'; }
function eventClass(type) { return type === 'Mantenimiento' ? 'green' : type === 'Documento' || type === 'ITV' ? 'blue' : type === 'Sustitución de componente' ? 'purple' : 'orange'; }
function safeText(value) { const el = document.createElement('span'); el.textContent = value ?? ''; return el.innerHTML; }
function renderTimeline() {
  const timeline = document.getElementById('timeline');
  if (!timeline) return;
  timeline.innerHTML = '<div class="timeline-date">HISTORIAL</div>' + events.map(item => `<div class="timeline-event"><div class="timeline-dot ${eventClass(item.type)}"></div><div class="timeline-card"><div class="activity-icon ${eventClass(item.type)}">${eventIcon(item.type)}</div><div class="activity-main"><strong>${safeText(item.description)}</strong><span>${safeText(item.date)}${item.hours ? ` · ${safeText(item.hours)} h` : ''}${item.km ? ` · ${safeText(item.km)} km` : ''}</span>${item.notes ? `<p>${safeText(item.notes)}</p>` : ''}</div><strong class="activity-cost">${safeText(item.cost || '—')}</strong></div></div>`).join('');
}
renderTimeline();

document.getElementById('eventForm').addEventListener('submit', event => {
  event.preventDefault();
  const description = document.getElementById('eventDescription').value.trim();
  if (!description) return;
  const type = document.getElementById('eventType').value;
  const visibleHours = Number(document.getElementById('eventHours').value);
  const visibleKm = Number(document.getElementById('eventKm').value);
  if (Number.isFinite(visibleHours) && document.getElementById('eventHours').value !== '') {
    if (visibleHours >= Number(bikeData.markerHours)) bikeData.realHours = Number(bikeData.realHours) + visibleHours - Number(bikeData.markerHours);
    bikeData.markerHours = visibleHours;
  }
  if (Number.isFinite(visibleKm) && document.getElementById('eventKm').value !== '') {
    if (visibleKm >= Number(bikeData.markerKm)) bikeData.realKm = Number(bikeData.realKm) + visibleKm - Number(bikeData.markerKm);
    bikeData.markerKm = visibleKm;
  }
  localStorage.setItem('motoProfile', JSON.stringify(bikeData));
  const actualHours = Number(bikeData.realHours).toLocaleString('es-ES',{minimumFractionDigits:1,maximumFractionDigits:1});
  const actualKm = Number(bikeData.realKm).toLocaleString('es-ES');
  const markerNote = type === 'Cambio de marcador' ? `Marcador actualizado a ${Number.isFinite(visibleHours) ? visibleHours : bikeData.markerHours} h / ${Number.isFinite(visibleKm) ? visibleKm : bikeData.markerKm} km. Uso real acumulado: ${actualHours} h / ${actualKm} km.` : '';
  const selectedDate = document.getElementById('eventDate').value || todayISO();
  events.unshift({ type, description, date: formatDate(selectedDate), dateISO: selectedDate, hours: document.getElementById('eventHours').value, km: document.getElementById('eventKm').value, cost: document.getElementById('eventCost').value ? `${document.getElementById('eventCost').value} €` : '', notes: [document.getElementById('eventNotes').value.trim(), markerNote].filter(Boolean).join(' ') });
  localStorage.setItem('motoEvents', JSON.stringify(events));
  renderTimeline();
  updateBikeView();
  closeModal();
  event.target.reset();
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
  bikeData.realHours = Number(document.getElementById('formRealHours').value);
  bikeData.markerHours = Number(document.getElementById('formMarkerHours').value);
  bikeData.realKm = Number(document.getElementById('formRealKm').value);
  bikeData.markerKm = Number(document.getElementById('formMarkerKm').value);
  const file = document.getElementById('formPhoto').files[0];
  const save = () => { localStorage.setItem('motoProfile', JSON.stringify(bikeData)); updateBikeView(); closeBikeModal(); };
  if (file) { const reader = new FileReader(); reader.onload = () => { bikeData.photo = reader.result; save(); }; reader.readAsDataURL(file); } else save();
});

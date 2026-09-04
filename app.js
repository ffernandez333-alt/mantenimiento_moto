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
function openModal() { modal.classList.remove('hidden'); document.getElementById('eventDescription').focus(); }
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
document.getElementById('eventForm').addEventListener('submit', event => {
  event.preventDefault();
  const description = document.getElementById('eventDescription').value.trim();
  if (!description) return;
  const timeline = document.getElementById('timeline');
  const item = document.createElement('div');
  item.className = 'timeline-event';
  item.innerHTML = `<div class="timeline-dot orange"></div><div class="timeline-card"><div class="activity-icon orange">✦</div><div class="activity-main"><strong>${description}</strong><span>Hoy · Evento registrado</span></div><strong class="activity-cost">—</strong></div>`;
  timeline.appendChild(item);
  closeModal();
  event.target.reset();
  showView('vida');
});

const bikeModal = document.getElementById('bikeModal');
const bikeDefaults = { brand: 'KTM', model: '250 EXC TPI', year: '2021', plate: '9038 LKN' };
const bikeData = { ...bikeDefaults, ...JSON.parse(localStorage.getItem('motoProfile') || '{}') };
function updateBikeView() {
  document.getElementById('bikeName').textContent = `${bikeData.brand} ${bikeData.model}`;
  document.getElementById('bikeSubtitle').textContent = `Enduro · ${bikeData.year} · 2 tiempos`;
  document.getElementById('bikeBrand').textContent = bikeData.brand;
  document.getElementById('bikeModel').textContent = bikeData.model;
  document.getElementById('bikeYear').textContent = bikeData.year;
  document.getElementById('bikePlate').textContent = bikeData.plate || 'Sin identificar';
}
updateBikeView();
document.getElementById('editBike').addEventListener('click', () => {
  document.getElementById('formBrand').value = bikeData.brand;
  document.getElementById('formModel').value = bikeData.model;
  document.getElementById('formYear').value = bikeData.year;
  document.getElementById('formPlate').value = bikeData.plate;
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
  localStorage.setItem('motoProfile', JSON.stringify(bikeData));
  updateBikeView();
  closeBikeModal();
});

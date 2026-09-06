/* Versioned backups contain only this application's local data. */
const MotoBackup = (() => {
  const exactKeys = ['motoProfiles', 'motoProfile', 'activeBikeId', 'motoEvents', 'motoTasks', 'motoSortDirection'];
  const prefixes = ['motoEvents:', 'motoTasks:', 'motoMaintenancePlan:', 'motoMaintenanceTasks:', 'motoMaintenanceSession:', 'motoMaintenanceChecklistInterval:'];
  const owns = key => exactKeys.includes(key) || prefixes.some(prefix => key.startsWith(prefix));
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  function snapshot(storage) {
    const data = {};
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (owns(key)) data[key] = storage.getItem(key);
    }
    return data;
  }
  function validate(backup) {
    const fail = () => { throw new Error('El archivo no es una copia válida de Mis motos o pertenece a una versión incompatible.'); };
    if (!object(backup) || backup.app !== 'mis-motos' || backup.version !== 1 || !object(backup.data) || !Number.isFinite(Date.parse(backup.createdAt))) fail();
    const parsed = {};
    for (const [key, value] of Object.entries(backup.data)) {
      if (!owns(key) || typeof value !== 'string') fail();
      if (key === 'activeBikeId' || key.startsWith('motoMaintenanceChecklistInterval:')) { parsed[key] = value; continue; }
      if (key === 'motoSortDirection') { if (!['asc', 'desc'].includes(value)) fail(); continue; }
      try { parsed[key] = JSON.parse(value); } catch { fail(); }
      const entry = parsed[key];
      if (key === 'motoProfiles') {
        if (!Array.isArray(entry) || !entry.length || entry.some(profile => !object(profile) || typeof profile.id !== 'string' || !profile.id || typeof profile.brand !== 'string' || typeof profile.model !== 'string') || new Set(entry.map(profile => profile.id)).size !== entry.length) fail();
      } else if (key === 'motoEvents' || key.startsWith('motoEvents:')) {
        if (!Array.isArray(entry) || entry.some(event => !object(event) || typeof event.type !== 'string' || typeof event.date !== 'string')) fail();
      } else if (key.startsWith('motoMaintenancePlan:')) {
        if (!object(entry) || !Array.isArray(entry.sections) || entry.sections.some(section => !object(section) || typeof section.label !== 'string' || !Array.isArray(section.tasks) || section.tasks.some(task => typeof task !== 'string'))) fail();
      } else if (!object(entry)) fail();
    }
    if (!Array.isArray(parsed.motoProfiles) || !parsed.motoProfiles.some(profile => profile.id === parsed.activeBikeId)) fail();
    return backup;
  }
  function create(storage) {
    return validate({ app: 'mis-motos', version: 1, createdAt: new Date().toISOString(), data: snapshot(storage) });
  }
  function restore(storage, backup) {
    validate(backup);
    const previous = snapshot(storage);
    const replace = data => {
      Object.keys(snapshot(storage)).forEach(key => storage.removeItem(key));
      Object.entries(data).forEach(([key, value]) => storage.setItem(key, value));
    };
    try { replace(backup.data); }
    catch (error) {
      replace(previous);
      throw new Error('No hay espacio suficiente o el navegador ha impedido guardar la copia. Se han conservado los datos anteriores.');
    }
  }
  return { create, validate, restore };
})();
if (typeof module !== 'undefined') module.exports = MotoBackup;

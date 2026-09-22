/* Sincroniza el almacenamiento local con la base de datos central de Cloudflare. */
(() => {
  const remoteEndpoint = 'https://mantenimiento-moto.pages.dev/api/state';
  const endpoint = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.') ? remoteEndpoint : '/api/state';
  const storage = window.localStorage;
  const setItem = storage.setItem.bind(storage);
  const removeItem = storage.removeItem.bind(storage);
  let hydrating = true;
  let timer = null;
  let available = false;
  const localSnapshot = () => { try { return MotoBackup.create(storage).data; } catch { return {}; } };
  const hasApplicationData = data => Object.keys(data).some(key => key === 'motoProfiles' || key.startsWith('motoEvents:') || key === 'motoEvents');
  const snapshotsMatch = (left, right) => {
    const keys = new Set([...Object.keys(left || {}), ...Object.keys(right || {})]);
    return [...keys].every(key => left?.[key] === right?.[key]);
  };
  const schedulePush = () => {
    if (hydrating || !available) return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try { await fetch(endpoint, { method: 'PUT', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: localSnapshot() }) }); } catch { /* Continúa en local si no hay conexión. */ }
    }, 700);
  };
  storage.setItem = (key, value) => { setItem(key, value); schedulePush(); };
  storage.removeItem = key => { removeItem(key); schedulePush(); };
  async function hydrate() {
    try {
      if (localStorage.getItem('motoRestorePending') === '1') {
        const restored = localSnapshot();
        const response = await fetch(endpoint, { method: 'PUT', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: restored }) });
        if (response.ok) localStorage.removeItem('motoRestorePending');
        hydrating = false;
        return;
      }
      const response = await fetch(endpoint, { cache: 'no-store', credentials: 'include' });
      if (!response.ok) return;
      available = true;
      const remote = await response.json();
      const local = localSnapshot();
      // Una importación corregida de componentes tiene prioridad sobre una
      // copia remota antigua que aún no contiene las lecturas de marcador.
      const correctedComponentKey = Object.keys(local).find(key => key.includes('componentSpreadsheetImport20260917'));
      const remoteData = { ...(remote.data || {}) };
      // Las altas de motos deben fusionarse: una copia remota antigua no puede
      // borrar una moto creada localmente mientras terminaba la sincronización.
      try {
        const localProfiles = JSON.parse(local.motoProfiles || '[]');
        const remoteProfiles = JSON.parse(remoteData.motoProfiles || '[]');
        if (Array.isArray(localProfiles) && Array.isArray(remoteProfiles)) {
          const merged = [...remoteProfiles];
          localProfiles.forEach(profile => { const index = merged.findIndex(item => item.id === profile.id); if (index >= 0) merged[index] = { ...merged[index], ...profile }; else merged.push(profile); });
          remoteData.motoProfiles = JSON.stringify(merged);
        }
      } catch { /* Conserva la copia remota si los perfiles no tienen formato válido. */ }
      if (correctedComponentKey) {
        Object.keys(local).filter(key => key.startsWith('motoEvents')).forEach(key => {
          try {
            const localEvents = JSON.parse(local[key]); const remoteEvents = JSON.parse(remoteData[key] || '[]');
            const componentEvents = localEvents.filter(item => item?.type === 'Sustitución de componente');
            remoteData[key] = JSON.stringify([...remoteEvents.filter(item => item?.type !== 'Sustitución de componente'), ...componentEvents]);
          } catch { /* Conserva la copia remota si el formato no es válido. */ }
        });
      }
      if (remote.data && Object.keys(remote.data).length && !snapshotsMatch(local, remoteData)) {
        Object.keys(local).forEach(key => removeItem(key));
        Object.entries(remoteData).forEach(([key, value]) => setItem(key, value));
        const reloadKey = 'motoCloudSyncReloadAt';
        const lastReload = Number(sessionStorage.getItem(reloadKey) || 0);
        if (!lastReload || Date.now() - lastReload > 15000) {
          sessionStorage.setItem(reloadKey, String(Date.now()));
          window.location.reload();
          return;
        }
        // Evita un ciclo de recargas si el código local y la copia remota
        // están normalizando datos en momentos distintos.
        hydrating = false;
        schedulePush();
        return;
      } else if (hasApplicationData(local)) {
        await fetch(endpoint, { method: 'PUT', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: local }) });
      }
    } catch { /* Desarrollo local o caída temporal: se conserva el modo local. */ }
    hydrating = false;
  }
  hydrate();
  window.setInterval(hydrate, 60000);
})();

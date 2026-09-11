/* Sincroniza el almacenamiento local con la base de datos central de Cloudflare. */
(() => {
  const endpoint = '/api/state';
  const storage = window.localStorage;
  const setItem = storage.setItem.bind(storage);
  const removeItem = storage.removeItem.bind(storage);
  let hydrating = true;
  let timer = null;
  let available = false;
  const localSnapshot = () => { try { return MotoBackup.create(storage).data; } catch { return {}; } };
  const hasApplicationData = data => Object.keys(data).some(key => key === 'motoProfiles' || key.startsWith('motoEvents:') || key === 'motoEvents');
  const schedulePush = () => {
    if (hydrating || !available) return;
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try { await fetch(endpoint, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: localSnapshot() }) }); } catch { /* Continúa en local si no hay conexión. */ }
    }, 700);
  };
  storage.setItem = (key, value) => { setItem(key, value); schedulePush(); };
  storage.removeItem = key => { removeItem(key); schedulePush(); };
  async function hydrate() {
    try {
      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) return;
      available = true;
      const remote = await response.json();
      const local = localSnapshot();
      if (remote.data && Object.keys(remote.data).length) {
        if (!hasApplicationData(local)) {
          Object.keys(local).forEach(key => removeItem(key));
          Object.entries(remote.data).forEach(([key, value]) => setItem(key, value));
          window.location.reload();
          return;
        }
      } else if (hasApplicationData(local)) {
        await fetch(endpoint, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ data: local }) });
      }
    } catch { /* Desarrollo local o caída temporal: se conserva el modo local. */ }
    hydrating = false;
  }
  hydrate();
})();

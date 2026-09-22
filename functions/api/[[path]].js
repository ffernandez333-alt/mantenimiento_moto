const json = (body, status = 200, request) => {
  const origin = request?.headers.get('Origin') || '';
  const allowed = ['https://mantenimiento-moto.pages.dev', 'http://localhost:8123', 'http://127.0.0.1:8123', 'http://192.168.1.141:8123'];
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': allowed.includes(origin) ? origin : 'https://mantenimiento-moto.pages.dev',
    'access-control-allow-credentials': 'true',
    'access-control-allow-methods': 'GET, PUT, OPTIONS',
    'access-control-allow-headers': 'content-type'
  };
  return new Response(JSON.stringify(body), { status, headers });
};

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return json(null, 204, context.request);
  if (!context.env.DB) return json({ error: 'La base de datos no está configurada.' }, 503, context.request);
  const identity = context.request.headers.get('Cf-Access-Authenticated-User-Email') || context.request.headers.get('cf-access-authenticated-user-email') || `local:${context.request.headers.get('Origin') || 'unknown'}`;
  const userKey = identity.trim().toLowerCase().slice(0, 240);
  await context.env.DB.prepare('CREATE TABLE IF NOT EXISTS app_user_state (user_key TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL)').run();
  if (context.request.method === 'GET') {
    const row = await context.env.DB.prepare('SELECT payload, updated_at FROM app_user_state WHERE user_key = ?').bind(userKey).first();
    return json(row ? { data: JSON.parse(row.payload), updatedAt: row.updated_at } : { data: null, updatedAt: null }, 200, context.request);
  }
  if (context.request.method === 'PUT') {
    const body = await context.request.json().catch(() => null);
    if (!body || !body.data || typeof body.data !== 'object' || Array.isArray(body.data)) return json({ error: 'Copia de datos no válida.' }, 400, context.request);
    const updatedAt = new Date().toISOString();
    await context.env.DB.prepare('INSERT INTO app_user_state (user_key, payload, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_key) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at').bind(userKey, JSON.stringify(body.data), updatedAt).run();
    return json({ ok: true, updatedAt }, 200, context.request);
  }
  return json({ error: 'Método no permitido.' }, 405, context.request);
}

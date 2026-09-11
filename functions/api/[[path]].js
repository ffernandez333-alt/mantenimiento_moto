const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, PUT, OPTIONS',
    'access-control-allow-headers': 'content-type'
  }
});

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, PUT, OPTIONS', 'access-control-allow-headers': 'content-type' } });
  if (!context.env.DB) return json({ error: 'La base de datos no está configurada.' }, 503);
  if (context.request.method === 'GET') {
    const row = await context.env.DB.prepare('SELECT payload, updated_at FROM app_state WHERE id = 1').first();
    return json(row ? { data: JSON.parse(row.payload), updatedAt: row.updated_at } : { data: null, updatedAt: null });
  }
  if (context.request.method === 'PUT') {
    const body = await context.request.json().catch(() => null);
    if (!body || !body.data || typeof body.data !== 'object' || Array.isArray(body.data)) return json({ error: 'Copia de datos no válida.' }, 400);
    const updatedAt = new Date().toISOString();
    await context.env.DB.prepare('INSERT INTO app_state (id, payload, updated_at) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at').bind(JSON.stringify(body.data), updatedAt).run();
    return json({ ok: true, updatedAt });
  }
  return json({ error: 'Método no permitido.' }, 405);
}

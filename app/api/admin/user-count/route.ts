import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function getPool() {
  if (globalThis.__pgPool) return globalThis.__pgPool;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  globalThis.__pgPool = pool;
  return pool;
}

export async function GET() {
  try {
    const pool = getPool();
    const res = await pool.query('SELECT COUNT(*)::int AS count FROM auth.users');
    const count = res.rows?.[0]?.count ?? 0;
    return new Response(JSON.stringify({ ok: true, count: Number(count) }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

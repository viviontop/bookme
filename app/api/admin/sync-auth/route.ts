import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const secret = req.headers.get('x-sync-secret') ?? '';
  if (!process.env.SYNC_SECRET || secret !== process.env.SYNC_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    // Use pg directly to read auth.users and upsert into app User via Prisma (separately)
    const { Pool } = await import('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const res = await pool.query('SELECT id, email, raw_user_meta_data, created_at FROM auth.users');
    const rows: any[] = res.rows || [];

    // Upsert each user using Prisma client (import lazily)
    const { default: prisma } = await import('../../../../lib/prisma');
    let upserted = 0;
    for (const r of rows) {
      let meta = r.raw_user_meta_data;
      if (typeof meta === 'string' && meta.length) {
        try { meta = JSON.parse(meta); } catch (e) { meta = null; }
      }
      const name = meta ? (meta.full_name ?? meta.fullName ?? null) : null;
      await prisma.user.upsert({
        where: { id: r.id },
        update: { email: r.email, name },
        create: { id: r.id, email: r.email, name, createdAt: r.created_at },
      });
      upserted++;
    }

    await pool.end();
    return new Response(JSON.stringify({ ok: true, upserted }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

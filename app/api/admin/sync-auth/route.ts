import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const secret = req.headers.get('x-sync-secret') ?? '';
  if (!process.env.SYNC_SECRET || secret !== process.env.SYNC_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { default: prisma } = await import('../../../../lib/prisma');

    // Read auth.users directly from Postgres (requires service-role permissions on DATABASE_URL)
    const rows: Array<any> = await prisma.$queryRawUnsafe(`SELECT id, email, user_metadata, created_at FROM auth.users`);

    let upserted = 0;
    for (const r of rows) {
      const name = r.user_metadata ? (r.user_metadata.full_name ?? r.user_metadata.fullName ?? null) : null;
      await prisma.user.upsert({
        where: { id: r.id },
        update: { email: r.email, name },
        create: { id: r.id, email: r.email, name, createdAt: r.created_at },
      });
      upserted++;
    }

    return new Response(JSON.stringify({ ok: true, upserted }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

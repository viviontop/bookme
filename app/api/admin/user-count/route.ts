export async function GET() {
  try {
    const { default: prisma } = await import('../../../../lib/prisma');
    const rows: Array<any> = await prisma.$queryRawUnsafe(`SELECT COUNT(*) AS count FROM auth.users`);
    const count = rows?.[0]?.count ?? 0;
    return new Response(JSON.stringify({ ok: true, count: Number(count) }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

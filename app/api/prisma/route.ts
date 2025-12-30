import prisma from '../../../lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({ take: 10 });
    return new Response(JSON.stringify(users), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

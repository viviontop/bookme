async function getUserFromHeader(headers: Headers) {
  const auth = headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const { default: supabaseAdmin } = await import('../../../lib/supabaseAdmin');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return data?.user ?? null;
}

export async function GET() {
  try {
    const { default: prisma } = await import('../../../lib/prisma');
    const services = await prisma.service.findMany({ include: { seller: true } });
    return new Response(JSON.stringify(services), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await getUserFromHeader(request.headers);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }
    const { title, description, price, sellerId } = body;
    if (!title || !price || !sellerId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Ensure the authenticated user is the seller creating this service
    if (sellerId !== user.id) {
      return new Response(JSON.stringify({ error: 'sellerId must match authenticated user' }), { status: 403 });
    }

    const { default: prisma } = await import('../../../lib/prisma');
    const service = await prisma.service.create({
      data: { title, description: description ?? null, price: Number(price), sellerId },
    });

    return new Response(JSON.stringify(service), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

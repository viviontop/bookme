import prisma from '../../../lib/prisma';
import supabaseAdmin from '../../../lib/supabaseAdmin';

async function getUserFromHeader(headers: Headers) {
  const auth = headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error) return null;
  return data?.user ?? null;
}

export async function GET() {
  try {
    const appointments = await prisma.appointment.findMany({
      include: { service: true, buyer: true },
      orderBy: { datetime: 'asc' },
    });
    return new Response(JSON.stringify(appointments), {
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
    const { serviceId, buyerId, datetime, status } = body;
    if (!serviceId || !buyerId || !datetime) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }

    // Ensure the authenticated user is the buyer creating this appointment
    if (buyerId !== user.id) {
      return new Response(JSON.stringify({ error: 'buyerId must match authenticated user' }), { status: 403 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        serviceId,
        buyerId,
        datetime: new Date(datetime),
        status: status ?? 'pending',
      },
    });

    return new Response(JSON.stringify(appointment), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

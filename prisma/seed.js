const prisma = require('../lib/prisma.cjs');

async function main() {
  // clear existing data (safe for demo)
  await prisma.appointment.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();

  const alice = await prisma.user.create({ data: { email: 'alice@example.com', name: 'Alice' } });
  const bob = await prisma.user.create({ data: { email: 'bob@example.com', name: 'Bob' } });

  const service1 = await prisma.service.create({
    data: {
      title: 'Haircut Basic',
      description: 'A quick trim and style',
      price: 2000,
      sellerId: alice.id,
    },
  });

  const service2 = await prisma.service.create({
    data: {
      title: 'Photography Session',
      description: '1 hour portrait session',
      price: 5000,
      sellerId: bob.id,
    },
  });

  await prisma.appointment.create({
    data: {
      serviceId: service1.id,
      buyerId: bob.id,
      datetime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      status: 'confirmed',
    },
  });

  console.log('Seeded sample users, services, and an appointment.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

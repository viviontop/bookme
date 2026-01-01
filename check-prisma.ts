import prisma from './lib/prisma'

async function main() {
    console.log("Prisma keys:", Object.keys(prisma))
    // @ts-ignore
    console.log("prisma.follow:", !!prisma.follow)
    // @ts-ignore
    console.log("prisma.user:", !!prisma.user)
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })

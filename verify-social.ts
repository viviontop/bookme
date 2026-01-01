import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            showFollowers: true,
            showFollowing: true,
            _count: {
                select: {
                    followers: true,
                    following: true
                }
            }
        }
    })

    console.log("Users and their social stats:")
    console.table(users.map(u => ({
        id: u.id,
        username: u.username,
        showFollowers: u.showFollowers,
        showFollowing: u.showFollowing,
        followers: u._count.followers,
        following: u._count.following
    })))

    const follows = await (prisma as any).follow.findMany()
    console.log("\nFollow relationships:")
    console.table(follows)
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect()
    })

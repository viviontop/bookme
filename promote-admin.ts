
import 'dotenv/config'
import prisma from './lib/prisma'

async function main() {
    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            take: 1
        })

        if (users.length === 0) {
            console.log("No users found to promote.")
            return
        }

        const user = users[0]
        console.log(`Promoting user ${user.email} (${user.name}) to admin...`)

        await prisma.user.update({
            where: { id: user.id },
            data: { role: 'admin' }
        })

        console.log("Successfully promoted user to admin.")
    } catch (e) {
        console.error("Error promoting user:", e)
    }
}

main()

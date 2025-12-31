import "dotenv/config"
import prisma from "./lib/prisma"

async function main() {
    try {
        console.log("Testing database connection...")
        const userCount = await prisma.user.count()
        console.log("Successfully connected. User count:", userCount)

        // Also try to list services to be sure
        const serviceCount = await prisma.service.count()
        console.log("Service count:", serviceCount)

    } catch (e) {
        console.error("Database connection failed:", e)
    }
}

main()

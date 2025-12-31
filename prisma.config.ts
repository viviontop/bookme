import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        // Use the direct connection string for migrations when provided (bypasses pgbouncer)
        url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"],
    },
});

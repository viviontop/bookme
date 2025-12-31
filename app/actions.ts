"use server"

import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import type { User, Service } from "@/lib/types"

const prisma = new PrismaClient()

export async function getServices() {
    try {
        const services = await prisma.service.findMany({
            include: {
                seller: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        return services.map(s => ({
            id: s.id,
            sellerId: s.sellerId,
            title: s.title,
            description: s.description || "",
            price: s.price,
            duration: s.duration,
            category: s.category,
            images: s.images,
            isActive: s.isActive,
            createdAt: s.createdAt.toISOString()
        }))
    } catch (error) {
        console.error("Error fetching services:", error)
        return []
    }
}

export async function getUsers() {
    try {
        const users = await prisma.user.findMany()
        return users.map(u => ({
            id: u.id,
            email: u.email,
            username: u.username || undefined,
            role: "buyer" as any, // Default, needed in schema
            firstName: u.name?.split(" ")[0] || "",
            lastName: u.name?.split(" ")[1] || "",
            birthDate: "",
            phone: "",
            createdAt: u.createdAt.toISOString(),
            isVerified: true
        }))
    } catch (error) {
        console.error("Error fetching users:", error)
        return []
    }
}

export async function createService(data: any) { // Typed as any momentarily to bridge gap
    try {
        const service = await prisma.service.create({
            data: {
                title: data.title,
                description: data.description,
                price: data.price,
                duration: data.duration,
                category: data.category,
                images: data.images,
                isActive: data.isActive,
                sellerId: data.sellerId,
            }
        })
        revalidatePath("/")
        return { success: true, service }
    } catch (error) {
        console.error("Error creating service:", error)
        return { success: false, error: String(error) }
    }
}

export async function registerUserDB(data: {
    id: string
    email: string
    username: string
    firstName: string
    lastName: string
}) {
    try {
        await prisma.user.upsert({
            where: { id: data.id },
            update: {
                email: data.email,
                username: data.username,
                name: `${data.firstName} ${data.lastName}`,
            },
            create: {
                id: data.id,
                email: data.email,
                username: data.username,
                name: `${data.firstName} ${data.lastName}`,
            },
        })
        return { success: true }
    } catch (error) {
        console.error("Error registering user in DB:", error)
        return { success: false, error: String(error) }
    }
}

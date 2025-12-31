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

        return services.map((s: any) => ({
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
        return users.map((u: any) => ({
            id: u.id,
            email: u.email,
            username: u.username || undefined,
            role: "buyer" as const, // Default, needed in schema
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

export async function createService(data: any) {
    try {
        if (!data.sellerId) {
            return { success: false, error: "Authentication required (missing sellerId)" }
        }

        // Ensure images is an array of strings
        const images = Array.isArray(data.images) ? data.images : []

        const service = await prisma.service.create({
            data: {
                title: data.title,
                description: data.description,
                price: parseFloat(data.price), // Ensure number
                duration: parseInt(data.duration), // Ensure number
                category: data.category || "General",
                images: images,
                isActive: data.isActive ?? true,
                sellerId: data.sellerId,
                rating: 0,
                reviewCount: 0
            }
        })
        revalidatePath("/")
        revalidatePath("/feed")
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
    console.log("Registering user in DB:", data) // Audit log
    try {
        if (!data.username) {
            console.error("Username is missing for DB registration")
            return { success: false, error: "Username is required" }
        }

        const user = await prisma.user.upsert({
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
        console.log("User registered in DB successfully:", user.id)
        return { success: true }
    } catch (error) {
        console.error("Error registering user in DB:", error)
        return { success: false, error: `Database error: ${String(error)}` }
    }
}

export async function getUserByUsername(username: string) {
    try {
        // Remove @ if present
        const cleanUsername = username.replace("@", "")

        const user = await prisma.user.findUnique({
            where: { username: cleanUsername },
            include: {
                services: true
            }
        })

        if (!user) return null

        // Map to frontend user type (simplified)
        return {
            id: user.id,
            email: user.email,
            username: user.username || undefined,
            firstName: user.name?.split(" ")[0] || "",
            lastName: user.name?.split(" ")[1] || "",
            role: "seller" as any,
            avatar: user.avatar || undefined,
            bio: user.bio || undefined,
            location: user.location || undefined,
            createdAt: user.createdAt.toISOString(),
            isVerified: true
        }
    } catch (error) {
        console.error("Error fetching user by username:", error)
        return null
    }
}

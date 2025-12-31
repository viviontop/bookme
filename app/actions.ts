"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import type { User, Service } from "@/lib/types"

// Removed local instantiation


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
            createdAt: s.createdAt.toISOString(),
            seller: s.seller ? {
                id: s.seller.id,
                email: s.seller.email,
                username: s.seller.username || undefined,
                name: s.seller.name,
                firstName: s.seller.name?.split(" ")[0] || "",
                lastName: s.seller.name?.split(" ")[1] || "",
                role: "seller" as const,
                avatar: s.seller.avatar || undefined,
                bio: s.seller.bio || undefined,
                location: s.seller.location || undefined,
                createdAt: s.seller.createdAt.toISOString(),
                isVerified: true
            } : undefined
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
            role: u.role || "buyer", // Use actual role from DB
            firstName: u.name?.split(" ")[0] || "",
            lastName: u.name?.split(" ")[1] || "",
            birthDate: "",
            phone: "",
            avatar: u.avatar || undefined,
            bio: u.bio || undefined,
            location: u.location || undefined,
            banner: u.banner || undefined,
            bannerAspectRatio: u.bannerAspectRatio || undefined,
            kycStatus: u.kycStatus || "pending",
            createdAt: u.createdAt.toISOString(),
            isVerified: u.isVerified || false
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

export async function deleteService(serviceId: string, userId: string) {
    try {
        // Verify ownership or admin status
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: { seller: true }
        })

        if (!service) return { success: false, error: "Service not found" }

        const user = await prisma.user.findUnique({ where: { id: userId } })

        if (!user) return { success: false, error: "User not found" }

        if (service.sellerId !== userId && user.role !== "admin") {
            return { success: false, error: "Unauthorized" }
        }

        // Hard delete
        await prisma.service.delete({ where: { id: serviceId } })

        revalidatePath("/")
        revalidatePath("/feed")

        return { success: true }
    } catch (error) {
        console.error("Error deleting service:", error)
        return { success: false, error: String(error) }
    }
}

export async function makeUserAdmin(email: string) {
    try {
        const user = await prisma.user.update({
            where: { email },
            data: { role: "admin" }
        })
        return { success: true, user }
    } catch (error) {
        console.error("Error making user admin:", error)
    }
}

export async function updateUser(userId: string, data: any) {
    try {
        const prismaData: any = {}

        if (data.role) prismaData.role = data.role
        if (data.username) prismaData.username = data.username
        if (data.bio) prismaData.bio = data.bio
        if (data.location) prismaData.location = data.location
        if (data.avatar) prismaData.avatar = data.avatar
        if (data.banner) prismaData.banner = data.banner
        if (data.bannerAspectRatio) prismaData.bannerAspectRatio = data.bannerAspectRatio
        if (typeof data.isVerified === 'boolean') prismaData.isVerified = data.isVerified
        if (data.kycStatus) prismaData.kycStatus = data.kycStatus

        await prisma.user.update({
            where: { id: userId },
            data: prismaData
        })

        revalidatePath("/")
        revalidatePath("/admin")
        revalidatePath(`/profile/${userId}`)

        return { success: true }
    } catch (error) {
        console.error("Error updating user:", error)
        return { success: false, error: String(error) }
    }
}

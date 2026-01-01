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


export async function getUserById(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) return null

        return {
            id: user.id,
            email: user.email,
            username: user.username || undefined,
            role: user.role || "buyer",
            firstName: user.name?.split(" ")[0] || "",
            lastName: user.name?.split(" ")[1] || "",
            birthDate: "",
            phone: "",
            avatar: user.avatar || undefined,
            bio: user.bio || undefined,
            location: user.location || undefined,
            banner: user.banner || undefined,
            bannerAspectRatio: user.bannerAspectRatio || undefined,
            kycStatus: user.kycStatus || "pending",
            createdAt: user.createdAt.toISOString(),
            isVerified: user.isVerified || false,
            acceptOnlyFromFollowed: user.acceptOnlyFromFollowed,
            showFollowers: user.showFollowers,
            showFollowing: user.showFollowing
        }
    } catch (error) {
        console.error("Error fetching user by ID:", error)
        return null
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
            isVerified: u.isVerified || false,
            acceptOnlyFromFollowed: u.acceptOnlyFromFollowed,
            showFollowers: u.showFollowers,
            showFollowing: u.showFollowing
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
    role?: string
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
                role: data.role,
            },
            create: {
                id: data.id,
                email: data.email,
                username: data.username,
                name: `${data.firstName} ${data.lastName}`,
                role: data.role || "buyer",
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

        // Map to frontend user type with all fields
        return {
            id: user.id,
            email: user.email,
            username: user.username || undefined,
            firstName: user.name?.split(" ")[0] || "",
            lastName: user.name?.split(" ")[1] || "",
            role: user.role as any,
            avatar: user.avatar || undefined,
            bio: user.bio || undefined,
            location: user.location || undefined,
            banner: user.banner || undefined,
            bannerAspectRatio: user.bannerAspectRatio || undefined,
            birthDate: "",
            phone: "",
            kycStatus: user.kycStatus as any,
            createdAt: user.createdAt.toISOString(),
            isVerified: user.isVerified,
            acceptOnlyFromFollowed: user.acceptOnlyFromFollowed,
            showFollowers: user.showFollowers,
            showFollowing: user.showFollowing
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
        if (typeof data.acceptOnlyFromFollowed === 'boolean') prismaData.acceptOnlyFromFollowed = data.acceptOnlyFromFollowed
        if (typeof data.showFollowers === 'boolean') prismaData.showFollowers = data.showFollowers
        if (typeof data.showFollowing === 'boolean') prismaData.showFollowing = data.showFollowing

        await prisma.user.update({
            where: { id: userId },
            data: prismaData
        })

        revalidatePath("/")
        revalidatePath("/admin")
        revalidatePath("/settings")
        revalidatePath(`/profile/${userId}`)
        revalidatePath("/chat")

        return { success: true }
    } catch (error) {
        console.error("Error updating user:", error)
        return { success: false, error: String(error) }
    }
}

export async function followUser(followerId: string, followingId: string) {
    try {
        await prisma.follow.create({
            data: { followerId, followingId }
        })
        revalidatePath(`/profile/${followingId}`)
        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export async function unfollowUser(followerId: string, followingId: string) {
    try {
        await prisma.follow.delete({
            where: { followerId_followingId: { followerId, followingId } }
        })
        revalidatePath(`/profile/${followingId}`)
        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export async function blockUser(blockerId: string, blockedId: string) {
    try {
        // Also unfollow automatically if blocking
        await prisma.$transaction([
            prisma.block.create({ data: { blockerId, blockedId } }),
            prisma.follow.deleteMany({
                where: {
                    OR: [
                        { followerId: blockerId, followingId: blockedId },
                        { followerId: blockedId, followingId: blockerId }
                    ]
                }
            })
        ])
        revalidatePath("/chat")
        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export async function unblockUser(blockerId: string, blockedId: string) {
    try {
        await prisma.block.delete({
            where: { blockerId_blockedId: { blockerId, blockedId } }
        })
        revalidatePath("/chat")
        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export async function getSocialStats(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { showFollowers: true, showFollowing: true }
        })
        if (!user) return { followers: 0, following: 0 }

        const [followers, following] = await Promise.all([
            user.showFollowers ? prisma.follow.count({ where: { followingId: userId } }) : Promise.resolve(0),
            user.showFollowing ? prisma.follow.count({ where: { followerId: userId } }) : Promise.resolve(0)
        ])
        return { followers, following }
    } catch (error) {
        return { followers: 0, following: 0 }
    }
}

export async function getFollowers(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { showFollowers: true }
        })
        // If not found or private, only allow if current user is owner? 
        // For simplicity, let's just respect the flag for everyone.
        if (!user || !user.showFollowers) return []

        const followers = await prisma.follow.findMany({
            where: { followingId: userId },
            include: { follower: true }
        })
        return followers.map(f => ({
            id: f.follower.id,
            username: f.follower.username,
            firstName: f.follower.name?.split(" ")[0] || "",
            lastName: f.follower.name?.split(" ")[1] || "",
            avatar: f.follower.avatar
        }))
    } catch (error) {
        return []
    }
}

export async function getFollowing(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { showFollowing: true }
        })
        if (!user || !user.showFollowing) return []

        const following = await prisma.follow.findMany({
            where: { followerId: userId },
            include: { following: true }
        })
        return following.map(f => ({
            id: f.following.id,
            username: f.following.username,
            firstName: f.following.name?.split(" ")[0] || "",
            lastName: f.following.name?.split(" ")[1] || "",
            avatar: f.following.avatar
        }))
    } catch (error) {
        return []
    }
}

export async function checkSocialRelation(currentUserId: string, targetUserId: string) {
    try {
        const [follow, blocked, blocking] = await Promise.all([
            prisma.follow.findUnique({ where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } } }),
            prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId: targetUserId, blockedId: currentUserId } } }),
            prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId: currentUserId, blockedId: targetUserId } } })
        ])
        return {
            isFollowing: !!follow,
            isBlockedBy: !!blocked,
            isBlocking: !!blocking
        }
    } catch (error) {
        return { isFollowing: false, isBlockedBy: false, isBlocking: false }
    }
}

export async function getSocialDataDB(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                following: { select: { followingId: true } },
                followers: { select: { followerId: true } },
                blocks: { select: { blockedId: true } },
                blockedBy: { select: { blockerId: true } }
            }
        })

        if (!user) return null

        return {
            following: user.following.map(f => f.followingId),
            followers: user.followers.map(f => f.followerId),
            blocking: user.blocks.map(b => b.blockedId),
            blockedBy: user.blockedBy.map(b => b.blockerId)
        }
    } catch (error) {
        console.error("Error fetching social data:", error)
        return null
    }
}

export async function sendMessage(senderId: string, receiverId: string, content: string, fileUrl?: string, fileType?: string) {
    try {
        // 1. Check if blocked
        const blocked = await prisma.block.findFirst({
            where: {
                OR: [
                    { blockerId: senderId, blockedId: receiverId },
                    { blockerId: receiverId, blockedId: senderId }
                ]
            }
        })

        if (blocked) {
            return { success: false, error: "You cannot message this user." }
        }

        // 2. Check privacy settings (Message Request logic)
        const receiver = await prisma.user.findUnique({
            where: { id: receiverId },
            select: { acceptOnlyFromFollowed: true }
        })

        let conversationStatus = "active"
        if (receiver?.acceptOnlyFromFollowed) {
            const isFollowing = await prisma.follow.findUnique({
                where: { followerId_followingId: { followerId: receiverId, followingId: senderId } }
            })
            if (!isFollowing) {
                conversationStatus = "request"
            }
        }

        const conversationId = [senderId, receiverId].sort().join("-")

        const conversation = await prisma.conversation.upsert({
            where: { id: conversationId },
            update: {
                lastMessageAt: new Date(),
                // If it was already archived or a request, might keep it as is or update to active if sender is followed?
                // For now, let's keep it simple.
            },
            create: {
                id: conversationId,
                participantIds: [senderId, receiverId],
                status: conversationStatus,
                participants: {
                    connect: [{ id: senderId }, { id: receiverId }]
                }
            }
        })

        const message = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                senderId,
                receiverId,
                content,
                fileUrl,
                fileType,
                read: false
            }
        })

        return {
            success: true, message: {
                ...message,
                createdAt: message.createdAt.toISOString()
            }
        }
    } catch (error) {
        console.error("Error sending message:", error)
        return { success: false, error: String(error) }
    }
}

export async function getConversations(userId: string) {
    try {
        const conversations = await prisma.conversation.findMany({
            where: {
                participantIds: {
                    has: userId
                }
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: "desc"
                    },
                    take: 1
                }
            },
            orderBy: {
                lastMessageAt: "desc"
            }
        })

        return await Promise.all(conversations.map(async (c) => {
            const unreadCount = await prisma.message.count({
                where: {
                    conversationId: c.id,
                    receiverId: userId,
                    read: false
                }
            })

            return {
                id: c.id,
                participantIds: c.participantIds,
                lastMessage: c.messages[0] ? {
                    id: c.messages[0].id,
                    content: c.messages[0].content,
                    fileUrl: c.messages[0].fileUrl,
                    fileType: c.messages[0].fileType,
                    createdAt: c.messages[0].createdAt.toISOString(),
                    senderId: c.messages[0].senderId,
                    receiverId: c.messages[0].receiverId,
                    read: c.messages[0].read
                } : undefined,
                lastMessageAt: c.lastMessageAt.toISOString(),
                unreadCount,
                status: c.status
            }
        }))
    } catch (error) {
        console.error("Error getting conversations:", error)
        return []
    }
}

export async function updateConversationStatus(conversationId: string, status: string) {
    try {
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { status }
        })
        revalidatePath("/chat")
        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export async function getMessages(conversationId: string) {
    try {
        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "asc" }
        })

        return messages.map(m => ({
            ...m,
            createdAt: m.createdAt.toISOString()
        }))
    } catch (error) {
        console.error("Error getting messages:", error)
        return []
    }
}

export async function markAsRead(conversationId: string, userId: string) {
    try {
        await prisma.message.updateMany({
            where: {
                conversationId,
                receiverId: userId,
                read: false
            },
            data: {
                read: true
            }
        })
        return { success: true }
    } catch (error) {
        console.error("Error marking as read:", error)
        return { success: false, error: String(error) }
    }
}

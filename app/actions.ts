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
                firstName: s.seller.firstName || s.seller.name?.split(" ")[0] || "",
                lastName: s.seller.lastName || s.seller.name?.split(" ")[1] || "",
                role: s.seller.role as any,
                avatar: s.seller.avatar || undefined,
                bio: s.seller.bio || undefined,
                location: s.seller.location || undefined,
                createdAt: s.seller.createdAt.toISOString(),
                isVerified: s.seller.isVerified,
                acceptOnlyFromFollowed: s.seller.acceptOnlyFromFollowed ?? false,
                showFollowers: s.seller.showFollowers ?? true,
                showFollowing: s.seller.showFollowing ?? true
            } : undefined
        }))
    } catch (error) {
        console.error("Error fetching services:", error)
        return []
    }
}


export async function getUserById(userId: string) {
    try {
        const user = await (prisma as any).user.findUnique({
            where: { id: userId },
            include: {
                services: true
            }
        })

        if (!user) return null

        return {
            ...user,
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            firstName: user.firstName || user.name?.split(" ")[0] || "",
            lastName: user.lastName || user.name?.split(" ")[1] || "",
            avatar: user.avatar,
            bio: user.bio,
            location: user.location,
            banner: user.banner,
            bannerAspectRatio: user.bannerAspectRatio,
            createdAt: user.createdAt.toISOString(),
            isVerified: user.isVerified,
            kycStatus: user.kycStatus,
            acceptOnlyFromFollowed: user.acceptOnlyFromFollowed ?? false,
            showFollowers: user.showFollowers ?? true,
            showFollowing: user.showFollowing ?? true,
            services: user.services.map((s: any) => ({
                ...s,
                createdAt: s.createdAt.toISOString()
            }))
        } as any
    } catch (error) {
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
            role: u.role as any,
            firstName: u.firstName || u.name?.split(" ")[0] || "",
            lastName: u.lastName || u.name?.split(" ")[1] || "",
            birthDate: "",
            phone: "",
            avatar: u.avatar || undefined,
            bio: u.bio || undefined,
            location: u.location || undefined,
            banner: u.banner || undefined,
            bannerAspectRatio: u.bannerAspectRatio || undefined,
            kycStatus: u.kycStatus as any,
            createdAt: u.createdAt.toISOString(),
            isVerified: u.isVerified,
            acceptOnlyFromFollowed: u.acceptOnlyFromFollowed ?? false,
            showFollowers: u.showFollowers ?? true,
            showFollowing: u.showFollowing ?? true
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
        if (!data.title) {
            return { success: false, error: "Title is required" }
        }
        if (isNaN(parseFloat(data.price))) {
            return { success: false, error: "Invalid price format" }
        }

        // Ensure images is an array of strings
        const images = Array.isArray(data.images) ? data.images : []

        const service = await (prisma as any).service.create({
            data: {
                title: data.title,
                description: data.description || "",
                price: parseFloat(data.price),
                duration: parseInt(data.duration) || 60,
                category: data.category || "General",
                images: images,
                isActive: data.isActive ?? true,
                sellerId: data.sellerId,
            }
        })

        try {
            revalidatePath("/")
            revalidatePath("/feed")
            revalidatePath(`/${data.username || ''}`)
        } catch (revalidateError) {
            console.warn("Revalidation failed:", revalidateError)
        }

        return { success: true, service }
    } catch (error) {
        console.error("CRITICAL: Error creating service:", error)
        return { success: false, error: `Database error: ${error instanceof Error ? error.message : String(error)}` }
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

        const user = await (prisma as any).user.upsert({
            where: { id: data.id },
            update: {
                email: data.email,
                username: data.username,
                name: `${data.firstName} ${data.lastName}`,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role,
            },
            create: {
                id: data.id,
                email: data.email,
                username: data.username,
                name: `${data.firstName} ${data.lastName}`,
                firstName: data.firstName,
                lastName: data.lastName,
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
        const user = await (prisma as any).user.findUnique({
            where: { username },
            include: {
                services: {
                    include: {
                        seller: true
                    }
                },
                following: true,
                followers: true,
                blocks: true,
                blockedBy: true
            }
        })

        if (!user) return null

        return {
            ...user,
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
            firstName: user.firstName || user.name?.split(" ")[0] || "",
            lastName: user.lastName || user.name?.split(" ")[1] || "",
            avatar: user.avatar,
            bio: user.bio,
            location: user.location,
            banner: user.banner,
            bannerAspectRatio: user.bannerAspectRatio,
            createdAt: user.createdAt.toISOString(),
            isVerified: user.isVerified,
            kycStatus: user.kycStatus,
            acceptOnlyFromFollowed: user.acceptOnlyFromFollowed ?? false,
            showFollowers: user.showFollowers ?? true,
            showFollowing: user.showFollowing ?? true,
            services: (user.services || []).map((s: any) => ({
                ...s,
                createdAt: s.createdAt.toISOString()
            }))
        } as any
    } catch (error) {
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

        // Match firstName/lastName fields if they exist in schema
        if (data.firstName) {
            prismaData.firstName = data.firstName
            prismaData.name = `${data.firstName} ${data.lastName || ''}`
        }
        if (data.lastName) {
            prismaData.lastName = data.lastName
            prismaData.name = `${data.firstName || ''} ${data.lastName}`
        }

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
    if (!(prisma as any).follow) return { success: false, error: "Follow model not available in Prisma" }
    try {
        await (prisma as any).follow.create({
            data: { followerId, followingId }
        })

        // Notify user
        const follower = await (prisma as any).user.findUnique({ where: { id: followerId }, select: { firstName: true, lastName: true, username: true } })
        await createNotification(
            followingId,
            "FOLLOW",
            `${follower.firstName} ${follower.lastName} (@${follower.username}) followed you`,
            `/profile/${follower.username || followerId}`
        )

        revalidatePath(`/profile/${followingId}`)
        return { success: true }
    } catch (error: any) {
        if (error.code === 'P2002') return { success: true }
        return { success: false, error: String(error) }
    }
}

export async function unfollowUser(followerId: string, followingId: string) {
    if (!(prisma as any).follow) return { success: false, error: "Follow model not available" }
    try {
        await (prisma as any).follow.delete({
            where: {
                followerId_followingId: { followerId, followingId }
            }
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
            (prisma as any).block.create({ data: { blockerId, blockedId } }),
            (prisma as any).follow.deleteMany({
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
        await (prisma as any).block.delete({
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
        if (!(prisma as any).follow) return { followers: 0, following: 0 }
        const user = await (prisma as any).user.findUnique({
            where: { id: userId },
            select: { showFollowers: true, showFollowing: true }
        })
        if (!user) return { followers: 0, following: 0 }

        const [followers, following] = await Promise.all([
            (user.showFollowers ?? true) ? (prisma as any).follow.count({ where: { followingId: userId } }) : Promise.resolve(0),
            (user.showFollowing ?? true) ? (prisma as any).follow.count({ where: { followerId: userId } }) : Promise.resolve(0)
        ])
        return { followers, following }
    } catch (error) {
        console.error("Error getting social stats:", error)
        return { followers: 0, following: 0 }
    }
}

export async function getFollowers(userId: string) {
    try {
        const user = await (prisma as any).user.findUnique({
            where: { id: userId },
            select: { showFollowers: true }
        })
        if (!user || (user as any).showFollowers === false) return []

        const followers = await (prisma as any).follow.findMany({
            where: { followingId: userId },
            include: { follower: true }
        })
        return followers.map((f: any) => ({
            id: f.follower.id,
            username: f.follower.username,
            firstName: f.follower.firstName || f.follower.name?.split(" ")[0] || "",
            lastName: f.follower.lastName || f.follower.name?.split(" ")[1] || "",
            avatar: f.follower.avatar
        }))
    } catch (error) {
        console.error("Error getting followers:", error)
        return []
    }
}

export async function getFollowing(userId: string) {
    try {
        const user = await (prisma as any).user.findUnique({
            where: { id: userId },
            select: { showFollowing: true }
        })
        if (!user || (user as any).showFollowing === false) return []

        const following = await (prisma as any).follow.findMany({
            where: { followerId: userId },
            include: { following: true }
        })
        return following.map((f: any) => ({
            id: f.following.id,
            username: f.following.username,
            firstName: f.following.firstName || f.following.name?.split(" ")[0] || "",
            lastName: f.following.lastName || f.following.name?.split(" ")[1] || "",
            avatar: f.following.avatar
        }))
    } catch (error) {
        console.error("Error getting following:", error)
        return []
    }
}

export async function checkSocialRelation(currentUserId: string, targetUserId: string) {
    try {
        const [follow, blocked, blocking] = await Promise.all([
            (prisma as any).follow.findUnique({ where: { followerId_followingId: { followerId: currentUserId, followingId: targetUserId } } }),
            (prisma as any).block.findUnique({ where: { blockerId_blockedId: { blockerId: targetUserId, blockedId: currentUserId } } }),
            (prisma as any).block.findUnique({ where: { blockerId_blockedId: { blockerId: currentUserId, blockedId: targetUserId } } })
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
        } as any)

        if (!user) return {
            following: [],
            followers: [],
            blocking: [],
            blockedBy: []
        }

        return {
            following: ((user as any).following || []).map((f: any) => f.followingId),
            followers: ((user as any).followers || []).map((f: any) => f.followerId),
            blocking: ((user as any).blocks || []).map((b: any) => b.blockedId),
            blockedBy: ((user as any).blockedBy || []).map((b: any) => b.blockerId)
        }
    } catch (error) {
        console.error("Error fetching social data:", error)
        return null
    }
}

export async function sendMessage(senderId: string, receiverId: string, content: string, fileUrl?: string, fileType?: string) {
    if (!(prisma as any).message || !(prisma as any).conversation) {
        return { success: false, error: "Messaging models not available" }
    }
    try {
        // Find or create conversation
        let conversation = await (prisma as any).conversation.findFirst({
            where: {
                participantIds: {
                    hasEvery: [senderId, receiverId]
                }
            }
        })

        if (!conversation) {
            conversation = await (prisma as any).conversation.create({
                data: {
                    participantIds: [senderId, receiverId],
                    status: "request" // Start as request
                }
            })
        }

        const message = await (prisma as any).message.create({
            data: {
                conversationId: conversation.id,
                senderId,
                receiverId,
                content,
                fileUrl,
                fileType
            }
        })

        // Update lastMessageAt
        await (prisma as any).conversation.update({
            where: { id: conversation.id },
            data: { lastMessageAt: new Date() }
        })

        return {
            success: true, message: {
                ...message,
                createdAt: message.createdAt.toISOString()
            }
        }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export async function getConversations(userId: string) {
    try {
        const conversations = await (prisma as any).conversation.findMany({
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

        return await Promise.all(conversations.map(async (c: any) => {
            const unreadCount = await (prisma as any).message.count({
                where: {
                    conversationId: c.id,
                    receiverId: userId,
                    read: false
                }
            })

            return {
                id: c.id,
                participantIds: c.participantIds || [],
                lastMessage: c.messages && c.messages[0] ? {
                    id: c.messages[0].id,
                    content: c.messages[0].content,
                    fileUrl: c.messages[0].fileUrl,
                    fileType: c.messages[0].fileType,
                    createdAt: c.messages[0].createdAt ? c.messages[0].createdAt.toISOString() : new Date().toISOString(),
                    senderId: c.messages[0].senderId,
                    receiverId: c.messages[0].receiverId,
                    read: c.messages[0].read
                } : undefined,
                lastMessageAt: c.lastMessageAt ? c.lastMessageAt.toISOString() : new Date().toISOString(),
                unreadCount,
                status: c.status || "active"
            }
        }))
    } catch (error) {
        console.error("Error getting conversations:", error)
        return []
    }
}

export async function updateConversationStatus(conversationId: string, status: string) {
    try {
        await (prisma as any).conversation.update({
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
        const messages = await (prisma as any).message.findMany({
            where: { conversationId },
            orderBy: { createdAt: "desc" },
            take: 50
        })

        // Reverse to maintain chronological order for UI
        return messages.reverse().map((m: any) => ({
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
        await (prisma as any).message.updateMany({
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

// Notifications
export async function getNotifications(userId: string) {
    try {
        const notifications = await (prisma as any).notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        })
        return notifications.map((n: any) => ({
            ...n,
            createdAt: n.createdAt.toISOString()
        }))
    } catch (error) {
        console.error("Error getting notifications:", error)
        return []
    }
}

export async function markNotificationRead(id: string) {
    try {
        await (prisma as any).notification.update({
            where: { id },
            data: { read: true }
        })
        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export async function createNotification(userId: string, type: string, content: string, link?: string) {
    try {
        await (prisma as any).notification.create({
            data: {
                userId,
                type,
                content,
                link,
                read: false
            }
        })
        return { success: true }
    } catch (error) {
        console.error("Error creating notification:", error)
        return { success: false }
    }
}

// Appointments
export async function createAppointment(data: any) {
    try {
        const appointment = await (prisma as any).appointment.create({
            data: {
                serviceId: data.serviceId,
                buyerId: data.buyerId,
                datetime: new Date(`${data.date}T${data.time}:00`),
                status: "pending"
            }
        })

        // Notify seller
        const service = await (prisma as any).service.findUnique({
            where: { id: data.serviceId },
            select: { sellerId: true, title: true }
        })
        if (service) {
            await createNotification(
                service.sellerId,
                "APPOINTMENT",
                `New booking request for ${service.title}`,
                "/appointments"
            )
        }

        return { success: true, appointment }
    } catch (error) {
        console.error("Error creating appointment:", error)
        return { success: false, error: String(error) }
    }
}

export async function getAppointments(userId: string) {
    try {
        const appointments = await (prisma as any).appointment.findMany({
            where: {
                OR: [
                    { buyerId: userId },
                    { service: { sellerId: userId } }
                ]
            },
            include: {
                service: true,
                buyer: true
            },
            orderBy: { datetime: "asc" }
        })
        return appointments.map((a: any) => ({
            ...a,
            date: a.datetime.toISOString().split('T')[0],
            time: a.datetime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            createdAt: a.createdAt.toISOString()
        }))
    } catch (error) {
        console.error("Error getting appointments:", error)
        return []
    }
}

export async function updateAppointment(id: string, status: string) {
    try {
        const apt = await (prisma as any).appointment.update({
            where: { id },
            data: { status },
            include: { service: true }
        })

        // Notify buyer
        await createNotification(
            apt.buyerId,
            "APPOINTMENT",
            `Your appointment for ${apt.service.title} has been ${status}`,
            "/appointments"
        )

        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

// Availability
export async function getAvailability(sellerId: string) {
    try {
        return await (prisma as any).availability.findMany({
            where: { sellerId }
        })
    } catch (error) {
        return []
    }
}

export async function updateAvailability(sellerId: string, slots: any[]) {
    try {
        // Simple replace for now
        await (prisma as any).availability.deleteMany({
            where: { sellerId }
        })
        await (prisma as any).availability.createMany({
            data: slots.map(s => ({
                sellerId,
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
                isActive: s.isActive ?? true
            }))
        })
        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export async function deleteMessage(messageId: string, userId: string) {
    try {
        const message = await (prisma as any).message.findUnique({
            where: { id: messageId }
        })

        if (!message) return { success: false, error: "Message not found" }
        if (message.senderId !== userId) return { success: false, error: "Unauthorized" }

        await (prisma as any).message.delete({
            where: { id: messageId }
        })

        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

export async function forwardMessage(messageId: string, receiverId: string, userId: string) {
    try {
        const sourceMessage = await (prisma as any).message.findUnique({
            where: { id: messageId }
        })

        if (!sourceMessage) return { success: false, error: "Source message not found" }

        return await sendMessage(userId, receiverId, sourceMessage.content, sourceMessage.fileUrl, sourceMessage.fileType)
    } catch (error) {
        return { success: false, error: String(error) }
    }
}

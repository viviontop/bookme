"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react"
import { useAuth } from "./auth-context"
import { Message, Conversation, SocialStats, SocialRelation } from "./types"
import {
  getConversations as getConversationsDB,
  getMessages as getMessagesDB,
  sendMessage as sendMessageDB,
  markAsRead as markAsReadDB,
  getSocialDataDB,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  updateUser as updateUserDB,
  updateConversationStatus
} from "@/app/actions"

interface MessagingContextType {
  messages: Message[]
  conversations: Conversation[]
  sendMessage: (receiverId: string, content: string, fileUrl?: string, fileType?: string) => Promise<{ success: boolean, error?: string, message?: Message }>
  getConversation: (userId: string) => Conversation | null
  getMessages: (conversationId: string) => Message[]
  markAsRead: (conversationId: string) => Promise<void>
  getUnreadCount: () => number

  // Social
  follow: (userId: string) => Promise<void>
  unfollow: (userId: string) => Promise<void>
  block: (userId: string) => Promise<void>
  unblock: (userId: string) => Promise<void>
  isFollowing: (userId: string) => boolean
  isBlocking: (userId: string) => boolean
  isBlockedBy: (userId: string) => boolean
  getSocialStats: (userId: string) => SocialStats
  acceptRequest: (conversationId: string) => Promise<void>
  updatePrivacy: (acceptOnlyFromFollowed: boolean) => Promise<void>
  setActiveConversation: (conversationId: string | null) => void
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export function MessagingProvider({ children }: { readonly children: ReactNode }) {
  const { user, updateUser: updateAuthUser } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [follows, setFollows] = useState<{ following: string[], followers: string[] }>({ following: [], followers: [] })
  const [blocks, setBlocks] = useState<{ blocking: string[], blockedBy: string[] }>({ blocking: [], blockedBy: [] })

  const prevUnreadCount = useRef(0)
  const notificationSound = useRef<HTMLAudioElement | null>(null)
  const syncState = useRef({
    count: 0,
    unreadSum: 0,
    lastMsgId: null as string | null | undefined
  })

  useEffect(() => {
    notificationSound.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3")
  }, [])

  // Load conversations and social data from DB
  useEffect(() => {
    if (!user?.id) return

    const loadData = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return

      try {
        const [dbConversations, socialData] = await Promise.all([
          getConversationsDB(user.id),
          getSocialDataDB(user.id)
        ])

        if (Array.isArray(dbConversations)) {
          const unreadSum = dbConversations.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0)
          const lastMsgId = dbConversations.length > 0 ? dbConversations[0].lastMessage?.id : null

          const hasChanges =
            dbConversations.length !== syncState.current.count ||
            unreadSum !== syncState.current.unreadSum ||
            lastMsgId !== syncState.current.lastMsgId

          if (hasChanges) {
            setConversations(dbConversations as any)

            if (unreadSum > syncState.current.unreadSum) {
              notificationSound.current?.play().catch(() => { })
            }

            syncState.current = {
              count: dbConversations.length,
              unreadSum,
              lastMsgId
            }
          }
        }

        if (socialData) {
          setFollows({
            following: Array.isArray(socialData.following) ? socialData.following : [],
            followers: Array.isArray(socialData.followers) ? socialData.followers : []
          })
          setBlocks({
            blocking: Array.isArray(socialData.blocking) ? socialData.blocking : [],
            blockedBy: Array.isArray(socialData.blockedBy) ? socialData.blockedBy : []
          })
        }
      } catch (error) {
        console.error("Failed to load data:", error)
      }
    }

    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [user?.id])

  // Faster polling for active chat
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([])
      return
    }

    const loadMessages = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return

      try {
        const dbMessages = await getMessagesDB(activeConversationId)
        if (!Array.isArray(dbMessages)) return

        // Filter out pending messages that might have been confirmed by polling
        const hasNewMessages = dbMessages.length !== messages.filter(m => m.status !== 'pending').length ||
          (dbMessages.length > 0 && messages.length > 0 &&
            dbMessages[dbMessages.length - 1].id !== messages[messages.length - 1].id)

        if (hasNewMessages) {
          // If we had pending messages, we want to keep them if they aren't in dbMessages yet
          setMessages((prev) => {
            const pending = prev.filter(m => m.status === 'pending')
            // Only keep pending that aren't somehow already in dbMessages (rare)
            const uniquePending = pending.filter(pm => !dbMessages.some(dm => dm.content === pm.content && dm.createdAt === pm.createdAt))
            return [...dbMessages as any, ...uniquePending]
          })
        }
      } catch (error) {
        console.error("Failed to load messages:", error)
      }
    }

    loadMessages()
    const interval = setInterval(loadMessages, 3000)
    return () => clearInterval(interval)
  }, [activeConversationId, messages.length])

  const sendMessage = async (receiverId: string, content: string, fileUrl?: string, fileType?: string) => {
    if (!user?.id) return { success: false, error: "Not authenticated" }

    // Optimistic Update
    const tempId = `temp-${Date.now()}`
    const optimisticMessage: Message = {
      id: tempId,
      conversationId: activeConversationId || "pending",
      senderId: user.id,
      receiverId,
      content,
      fileUrl,
      fileType,
      createdAt: new Date().toISOString(),
      read: false,
      status: "pending"
    }

    setMessages((prev) => [...prev, optimisticMessage])

    // Trigger server call
    try {
      const result = await sendMessageDB(user.id, receiverId, content, fileUrl, fileType)

      if (result.success && result.message) {
        // Replace optimistic message with real message
        setMessages((prev) =>
          prev.map((m) => m.id === tempId ? { ...result.message, status: "sent" } as any : m)
        )

        // Refresh conversations to update last message
        const dbConversations = await getConversationsDB(user.id)
        if (Array.isArray(dbConversations)) {
          setConversations(dbConversations as any)
        }
        return result as any
      } else {
        // Mark as error
        setMessages((prev) =>
          prev.map((m) => m.id === tempId ? { ...m, status: "error" } : m)
        )
        return { success: false, error: result.error || "Failed to send message" }
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => m.id === tempId ? { ...m, status: "error" } : m)
      )
      return { success: false, error: "Network error" }
    }
  }

  const follow = async (userId: string) => {
    if (!user?.id) return
    const result = await followUser(user.id, userId)
    if (result.success) {
      setFollows(prev => ({ ...prev, following: [...prev.following, userId] }))
    }
  }

  const unfollow = async (userId: string) => {
    if (!user?.id) return
    const result = await unfollowUser(user.id, userId)
    if (result.success) {
      setFollows(prev => ({ ...prev, following: prev.following.filter(id => id !== userId) }))
    }
  }

  const block = async (userId: string) => {
    if (!user?.id) return
    const result = await blockUser(user.id, userId)
    if (result.success) {
      setBlocks(prev => ({ ...prev, blocking: [...prev.blocking, userId] }))
      setFollows(prev => ({
        following: prev.following.filter(id => id !== userId),
        followers: prev.followers.filter(id => id !== userId)
      }))
    }
  }

  const unblock = async (userId: string) => {
    if (!user?.id) return
    const result = await unblockUser(user.id, userId)
    if (result.success) {
      setBlocks(prev => ({ ...prev, blocking: prev.blocking.filter(id => id !== userId) }))
    }
  }

  const getConversation = (userId: string) => {
    return conversations.find(c => c.participantIds.includes(userId)) || null
  }

  const getMessages = (conversationId: string) => {
    return messages.filter(m => m.conversationId === conversationId)
  }

  const markAsRead = async (conversationId: string) => {
    if (!user?.id) return
    await markAsReadDB(conversationId, user.id)
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
    )
  }

  const getUnreadCount = () => {
    return conversations.reduce((total, c) => total + (c.unreadCount || 0), 0)
  }

  const isFollowing = (userId: string) => follows.following.includes(userId)
  const isBlocking = (userId: string) => blocks.blocking.includes(userId)
  const isBlockedBy = (userId: string) => blocks.blockedBy.includes(userId)

  const getSocialStats = (userId: string): SocialStats => {
    if (userId === user?.id) {
      return { followers: follows.followers.length, following: follows.following.length }
    }
    return { followers: 0, following: 0 }
  }

  const acceptRequest = async (conversationId: string) => {
    await updateConversationStatus(conversationId, "active")
    if (user?.id) {
      const dbConversations = await getConversationsDB(user.id)
      if (Array.isArray(dbConversations)) {
        setConversations(dbConversations as any)
      }
    }
  }

  const updatePrivacy = async (acceptOnlyFromFollowed: boolean) => {
    if (!user?.id) return
    await updateUserDB(user.id, { acceptOnlyFromFollowed })
    updateAuthUser({ ...user, acceptOnlyFromFollowed })
  }

  const setActiveConversation = (id: string | null) => setActiveConversationId(id)

  const value = {
    messages,
    conversations,
    sendMessage,
    getConversation,
    getMessages,
    markAsRead,
    getUnreadCount,
    follow,
    unfollow,
    block,
    unblock,
    isFollowing,
    isBlocking,
    isBlockedBy,
    getSocialStats,
    acceptRequest,
    updatePrivacy,
    setActiveConversation
  }

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>
}

export const useMessaging = () => {
  const context = useContext(MessagingContext)
  if (context === undefined) {
    throw new Error("useMessaging must be used within a MessagingProvider")
  }
  return context
}

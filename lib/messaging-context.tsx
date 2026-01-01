"use client"

import { createContext, useContext, useState, useEffect, useMemo, useRef, type ReactNode } from "react"
import { useAuth } from "./auth-context"
import type { Message, Conversation } from "./types"
import {
  sendMessage as sendMessageDB,
  getConversations as getConversationsDB,
  getMessages as getMessagesDB,
  markAsRead as markAsReadDB
} from "@/app/actions"

interface MessagingContextType {
  messages: Message[]
  conversations: Conversation[]
  sendMessage: (receiverId: string, content: string, fileUrl?: string, fileType?: string) => Promise<void>
  getConversation: (userId: string) => Conversation | null
  getMessages: (conversationId: string) => Message[]
  markAsRead: (conversationId: string) => Promise<void>
  getUnreadCount: () => number
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export function MessagingProvider({ children }: { readonly children: ReactNode }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const prevUnreadCount = useRef(0)
  const notificationSound = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    notificationSound.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3")
  }, [])

  // Load data from DB
  useEffect(() => {
    if (!user?.id) return

    const loadData = async () => {
      try {
        const dbConversations = await getConversationsDB(user.id)

        // Only update if something changed to reduce re-renders
        const newUnreadCount = dbConversations.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0)

        if (JSON.stringify(dbConversations) !== JSON.stringify(conversations)) {
          setConversations(dbConversations as any)

          // Play sound if unread count increased
          if (newUnreadCount > prevUnreadCount.current) {
            notificationSound.current?.play().catch(() => { })
          }
          prevUnreadCount.current = newUnreadCount
        }
      } catch (error) {
        console.error("Failed to load conversations:", error)
      }
    }

    loadData()
    const interval = setInterval(loadData, 4000)
    return () => clearInterval(interval)
  }, [user?.id, conversations])

  const sendMessage = async (receiverId: string, content: string, fileUrl?: string, fileType?: string) => {
    if (!user?.id) return

    const result = await sendMessageDB(user.id, receiverId, content, fileUrl, fileType)

    if (result.success && result.message) {
      const newMessage = result.message as unknown as Message
      setMessages((prev) => [...prev, newMessage])

      // Update local conversations state
      const conversationId = newMessage.conversationId
      setConversations((prev) => {
        const existing = prev.find(c => c.id === conversationId)
        if (existing) {
          return prev.map(c => c.id === conversationId ? {
            ...c,
            lastMessage: newMessage,
            lastMessageAt: newMessage.createdAt,
          } : c)
        } else {
          return [...prev, {
            id: conversationId,
            participantIds: [user.id, receiverId].sort(),
            lastMessage: newMessage,
            lastMessageAt: newMessage.createdAt,
            unreadCount: 0
          }]
        }
      })
    }
  }

  const getConversation = (userId: string) => {
    if (!user?.id) return null

    const conversationId = [user.id, userId].sort((a, b) => a.localeCompare(b)).join("-")
    return conversations.find((c) => c.id === conversationId) || null
  }

  const getMessages = (conversationId: string) => {
    // Fetch messages from DB if not already loaded for this conversation
    // This is a bit tricky with the current state-based approach
    // We'll update the effect to fetch messages when a conversation is active
    return messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  // Effect to fetch messages when messages array is requested for a specific conversation
  // Or simpler: just fetch messages for all conversations periodically? 
  // No, let's fetch messages for the current view.
  // The ChatContent component calls getMessages(conversationId)

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)

  useEffect(() => {
    if (!activeConversationId) return

    const loadMessages = async () => {
      try {
        const dbMessages = await getMessagesDB(activeConversationId)
        // Only update if message count or last message ID changed
        if (dbMessages.length !== messages.length || (dbMessages.length > 0 && messages.length > 0 && dbMessages[dbMessages.length - 1].id !== messages[messages.length - 1].id)) {
          setMessages(dbMessages as any)
        }
      } catch (error) {
        console.error("Failed to load messages:", error)
      }
    }

    loadMessages()
    const interval = setInterval(loadMessages, 2000) // Faster polling for active chat
    return () => clearInterval(interval)
  }, [activeConversationId, messages.length])

  // We need to expose a way to set the active conversation
  // But wait, getMessages is called by the component.
  // Let's modify getMessages to also trigger a sync.

  const getMessagesWithSync = (conversationId: string) => {
    if (activeConversationId !== conversationId) {
      setActiveConversationId(conversationId)
    }
    return getMessages(conversationId)
  }

  const markAsRead = async (conversationId: string) => {
    if (!user?.id) return

    await markAsReadDB(conversationId, user.id)

    // Update local state
    setMessages((prev) => prev.map((m) =>
      m.conversationId === conversationId && m.receiverId === user.id ? { ...m, read: true } : m
    ))

    setConversations((prev) => prev.map((c) =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    ))
  }

  const getUnreadCount = () => {
    if (!user?.id) return 0

    return conversations
      .filter((c) => c.participantIds.includes(user.id))
      .reduce((sum, c) => sum + c.unreadCount, 0)
  }

  const value = useMemo(
    () => ({
      messages,
      conversations,
      sendMessage,
      getConversation,
      getMessages: getMessagesWithSync,
      markAsRead,
      getUnreadCount,
    }),
    [messages, conversations, user?.id, activeConversationId]
  )

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>
}

export function useMessaging() {
  const context = useContext(MessagingContext)
  if (!context) throw new Error("useMessaging must be used within MessagingProvider")
  return context
}

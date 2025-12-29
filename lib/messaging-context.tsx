"use client"

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react"
import { useAuth } from "./auth-context"
import type { Message, Conversation } from "./types"

interface MessagingContextType {
  messages: Message[]
  conversations: Conversation[]
  sendMessage: (receiverId: string, content: string) => void
  getConversation: (userId: string) => Conversation | null
  getMessages: (conversationId: string) => Message[]
  markAsRead: (conversationId: string) => void
  getUnreadCount: () => number
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export function MessagingProvider({ children }: { readonly children: ReactNode }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      const storedMessages = localStorage.getItem("messages")
      const storedConversations = localStorage.getItem("conversations")
      
      if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages)
          setMessages(parsedMessages)
        } catch {
          setMessages([])
        }
      }
      
      if (storedConversations) {
        try {
          const parsedConversations = JSON.parse(storedConversations)
          setConversations(parsedConversations)
        } catch {
          setConversations([])
        }
      }
    }
    
    loadData()
    
    // Refresh data when window gains focus (so users see new messages)
    const handleFocus = () => {
      loadData()
    }
    
    // Also refresh periodically to catch new messages
    const interval = setInterval(loadData, 2000)
    
    window.addEventListener("focus", handleFocus)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", handleFocus)
    }
  }, [])

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0 || localStorage.getItem("messages")) {
      localStorage.setItem("messages", JSON.stringify(messages))
    }
  }, [messages])

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (conversations.length > 0 || localStorage.getItem("conversations")) {
      localStorage.setItem("conversations", JSON.stringify(conversations))
    }
  }, [conversations])

  const sendMessage = (receiverId: string, content: string) => {
    if (!user?.id) return

    const conversationId = [user.id, receiverId].sort((a, b) => a.localeCompare(b)).join("-")
    const newMessage: Message = {
      id: crypto.randomUUID(),
      conversationId,
      senderId: user.id,
      receiverId,
      content,
      createdAt: new Date().toISOString(),
      read: false,
    }

    // Use functional updates to ensure we have the latest state
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, newMessage]
      // Save immediately
      localStorage.setItem("messages", JSON.stringify(updatedMessages))
      return updatedMessages
    })

    // Update or create conversation for BOTH users
    setConversations((prevConversations) => {
      const existingConv = prevConversations.find((c) => c.id === conversationId)
      
      if (existingConv) {
        // Update existing conversation
        const updated = prevConversations.map((c) => {
          if (c.id === conversationId) {
            // Increment unread count for the receiver (not the sender)
            return {
              ...c,
              lastMessage: newMessage,
              lastMessageAt: newMessage.createdAt,
              unreadCount: user.id === receiverId ? 0 : (c.unreadCount || 0) + 1,
            }
          }
          return c
        })
        localStorage.setItem("conversations", JSON.stringify(updated))
        return updated
      } else {
        // Create new conversation - both participants should see it
        const newConversation: Conversation = {
          id: conversationId,
          participantIds: [user.id, receiverId].sort((a, b) => a.localeCompare(b)),
          lastMessage: newMessage,
          lastMessageAt: newMessage.createdAt,
          unreadCount: 1, // Receiver has 1 unread message
        }
        const updated = [...prevConversations, newConversation]
        localStorage.setItem("conversations", JSON.stringify(updated))
        return updated
      }
    })
  }

  const getConversation = (userId: string) => {
    if (!user?.id) return null

    const conversationId = [user.id, userId].sort((a, b) => a.localeCompare(b)).join("-")
    return conversations.find((c) => c.id === conversationId) || null
  }

  const getMessages = (conversationId: string) => {
    return messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  const markAsRead = (conversationId: string) => {
    if (!user?.id) return

    // Mark messages as read for the current user
    const updatedMessages = messages.map((m) =>
      m.conversationId === conversationId && m.receiverId === user.id ? { ...m, read: true } : m
    )
    setMessages(updatedMessages)

    // Reset unread count for this conversation
    const updated = conversations.map((c) =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    )
    setConversations(updated)
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
      getMessages,
      markAsRead,
      getUnreadCount,
    }),
    [messages, conversations, user?.id]
  )

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>
}

export function useMessaging() {
  const context = useContext(MessagingContext)
  if (!context) throw new Error("useMessaging must be used within MessagingProvider")
  return context
}

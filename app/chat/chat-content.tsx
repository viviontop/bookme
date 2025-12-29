"use client"

import { useEffect, useState, useRef, useMemo, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { useMessaging } from "@/lib/messaging-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageCircle, Send, Search } from "lucide-react"
import Link from "next/link"

function ChatWithParams() {
  const { user } = useAuth()
  const { users } = useData()
  const { conversations, messages, getMessages, sendMessage, markAsRead, getUnreadCount } = useMessaging()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check for userId in URL params
  useEffect(() => {
    const userId = searchParams.get("userId")
    if (userId && users.some((u) => u.id === userId)) {
      setSelectedUserId(userId)
      // Clean up URL
      router.replace("/chat", { scroll: false })
    }
  }, [searchParams, users, router])

  const conversationIdRef = useRef<string | null>(null)
  
  const conversationId = useMemo(() => {
    if (!selectedUserId || !user?.id) return null
    return [user.id, selectedUserId].sort((a, b) => a.localeCompare(b)).join("-")
  }, [selectedUserId, user?.id])

  const currentMessages = useMemo(() => {
    if (!conversationId) return []
    return getMessages(conversationId)
  }, [conversationId, getMessages, messages]) // Depend on messages array to update when new messages arrive

  useEffect(() => {
    if (selectedUserId && user?.id && conversationId) {
      // Only mark as read if this is a different conversation
      if (conversationIdRef.current !== conversationId) {
        conversationIdRef.current = conversationId
        // Check conversation and mark as read only if needed
        const conversation = conversations.find((c) => c.id === conversationId)
        if (conversation && conversation.unreadCount > 0) {
          // Use requestAnimationFrame to avoid infinite loop
          requestAnimationFrame(() => {
            markAsRead(conversationId)
          })
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId, user?.id, conversationId]) // Intentionally exclude conversations and markAsRead to prevent infinite loop

  useEffect(() => {
    if (currentMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [currentMessages.length]) // Only depend on message count, not the input

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted-foreground">Please log in to access messages</p>
      </div>
    )
  }

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedUserId) return
    sendMessage(selectedUserId, messageInput)
    setMessageInput("")
  }

  const getConversationUser = (conversation: typeof conversations[0]) => {
    const otherUserId = conversation.participantIds.find((id) => id !== user.id)
    return users.find((u) => u.id === otherUserId)
  }

  const filteredConversations = conversations
    .filter((c) => c.participantIds.includes(user.id))
    .filter((c) => {
      if (!searchQuery) return true
      const otherUser = getConversationUser(c)
      return (
        otherUser?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        otherUser?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        otherUser?.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
    .sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
      return dateB - dateA
    })

  const selectedUser = selectedUserId ? users.find((u) => u.id === selectedUserId) : null
  const unreadCount = getUnreadCount()

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Conversations List */}
      <div className="w-full border-r border-border md:w-80">
        <div className="flex h-16 items-center border-b border-border px-4">
          <h2 className="text-lg font-semibold">Messages</h2>
          {unreadCount > 0 && (
            <Badge variant="default" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-8rem)]">
          {filteredConversations.length === 0 ? (
            <div className="flex h-full items-center justify-center p-4">
              <div className="text-center">
                <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No conversations yet</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredConversations.map((conversation) => {
                const otherUser = getConversationUser(conversation)
                if (!otherUser) return null

                return (
                  <button
                    key={conversation.id}
                    onClick={() => setSelectedUserId(otherUser.id)}
                    className={`w-full p-4 text-left transition-colors hover:bg-muted ${
                      selectedUserId === otherUser.id ? "bg-muted" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={otherUser.avatar || "/placeholder.svg"} alt={otherUser.firstName} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {otherUser.firstName[0]}
                          {otherUser.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground truncate">
                            {otherUser.firstName} {otherUser.lastName}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <Badge variant="default" className="ml-2 shrink-0">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {conversation.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conversation.lastMessage.content}
                          </p>
                        )}
                        {conversation.lastMessageAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(conversation.lastMessageAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="flex h-16 items-center border-b border-border px-4">
              <Link href={`/profile/${selectedUser.id}`} className="flex items-center gap-3 flex-1">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.avatar || "/placeholder.svg"} alt={selectedUser.firstName} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {selectedUser.firstName[0]}
                    {selectedUser.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
              </Link>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {currentMessages.map((message) => {
                  const isOwn = message.senderId === user.id
                  const sender = users.find((u) => u.id === message.senderId)

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex gap-2 max-w-[80%] ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                        {!isOwn && (
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={sender?.avatar || "/placeholder.svg"} alt={sender?.firstName || "User"} />
                            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                              {sender?.firstName?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`rounded-lg px-4 py-2 ${isOwn ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          <p className="text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <div className="border-t border-border p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSendMessage()
                }}
                className="flex gap-2"
              >
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!messageInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <MessageCircle className="mx-auto h-16 w-16 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium text-foreground">Select a conversation</p>
              <p className="mt-2 text-sm text-muted-foreground">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function ChatContent() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground animate-pulse" />
          <p className="mt-4 text-muted-foreground">Loading messages...</p>
        </div>
      </div>
    }>
      <ChatWithParams />
    </Suspense>
  )
}


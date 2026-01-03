"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMessaging } from "@/lib/messaging-context"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { MessageBubble } from "@/components/message-bubble"
import {
  Search,
  Send,
  MoreVertical,
  ArrowLeft,
  User,
  Image as ImageIcon,
  Paperclip,
  X,
  Loader2,
  FileText,
  ChevronLeft,
  MessageCircle,
  Settings,
  ShieldOff,
  UserPlus,
  UserMinus,
  Ban,
  Slash,
  Inbox,
  Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Forward } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabaseClient"
import { toast } from "sonner"

export function ChatContent() {
  const {
    messages,
    conversations,
    sendMessage,
    markAsRead,
    follow,
    unfollow,
    block,
    unblock,
    isFollowing,
    isBlocking,
    isBlockedBy,
    acceptRequest,
    updatePrivacy,
    setActiveConversation,
    deleteMessage,
    forwardMessage
  } = useMessaging()
  const { user } = useAuth()
  const { users: allUsers } = useData()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [messageInput, setMessageInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showChatOnMobile, setShowChatOnMobile] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<{ file: File, preview: string } | null>(null)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"conversations" | "requests">("conversations")
  const [forwardMessageId, setForwardMessageId] = useState<string | null>(null)
  const [forwardSearchQuery, setForwardSearchQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Handle URL params for starting a new chat
  useEffect(() => {
    if (!searchParams) return
    const userId = searchParams.get("userId")
    if (userId && Array.isArray(allUsers) && allUsers.some((u) => u.id === userId)) {
      setSelectedUserId(userId)
      setShowChatOnMobile(true)
      // Clean up URL
      const newPath = window.location.pathname
      window.history.replaceState(null, '', newPath)
    }
  }, [searchParams, allUsers])

  // Get conversation for selected user
  const currentConversation = useMemo(() => {
    if (!selectedUserId || !user?.id || !Array.isArray(conversations)) return null
    return conversations.find((c: any) =>
      c.participantIds?.includes(selectedUserId) &&
      c.participantIds?.includes(user.id)
    )
  }, [conversations, selectedUserId, user?.id])

  // Update active conversation in context
  useEffect(() => {
    setActiveConversation(currentConversation?.id || null)
  }, [currentConversation?.id, setActiveConversation])

  useEffect(() => {
    if (selectedUserId && user?.id && currentConversation) {
      if (currentConversation.unreadCount > 0) {
        requestAnimationFrame(() => {
          markAsRead(currentConversation.id)
        })
      }
    }
  }, [selectedUserId, user?.id, currentConversation, markAsRead])

  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages.length])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB")
        return
      }
      const preview = URL.createObjectURL(file)
      setSelectedFile({ file, preview })
    }
  }

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile) || !selectedUserId || isUploading) return

    const content = messageInput
    setMessageInput("")

    let fileUrl = undefined
    let fileType = undefined

    if (selectedFile) {
      setIsUploading(true)
      try {
        const fileExt = selectedFile.file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${user?.id}/${fileName}`

        const { data, error } = await supabase.storage
          .from('chat-attachments')
          .upload(filePath, selectedFile.file)

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
          .from('chat-attachments')
          .getPublicUrl(filePath)

        fileUrl = publicUrl
        fileType = selectedFile.file.type
        setSelectedFile(null)
      } catch (error: any) {
        toast.error("Failed to upload file")
        console.error(error)
        setIsUploading(false)
        return
      }
    }

    const result = await sendMessage(selectedUserId, content, fileUrl, fileType)
    if (!result.success) {
      toast.error(result.error || "Failed to send message")
    }

    setIsUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const filteredConversations = useMemo(() => {
    if (!Array.isArray(conversations) || !Array.isArray(allUsers)) return []
    return conversations.filter((c: any) => {
      if (activeTab === "conversations" && c.status !== "active") return false
      if (activeTab === "requests" && c.status !== "request") return false

      const otherUserId = c.participantIds?.find((id: string) => id !== user?.id)
      const otherUser = allUsers.find((u: any) => u.id === otherUserId)
      if (!otherUser) return false

      const fullName = `${otherUser.firstName} ${otherUser.lastName}`.toLowerCase()
      const username = (otherUser.username || "").toLowerCase()
      const query = searchQuery.toLowerCase()

      return fullName.includes(query) || username.includes(query)
    }).sort((a: any, b: any) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
      return dateB - dateA
    })
  }, [conversations, allUsers, user?.id, searchQuery, activeTab])

  const selectedUser = selectedUserId ? allUsers?.find((u: any) => u.id === selectedUserId) : null

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Please sign in to access messages.</p>
        <Button className="mt-4" onClick={() => router.push('/signin')}>Sign In</Button>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background relative overflow-hidden">
      {/* Sidebar - Independent Scroll */}
      <div className={cn(
        "w-full md:w-80 border-r border-border flex flex-col h-full bg-card",
        showChatOnMobile ? "hidden md:flex" : "flex"
      )}>
        <div className="flex-none p-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Messages</h1>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Privacy Settings</h4>
                    <p className="text-sm text-muted-foreground">Control who can send you messages.</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="privacy-toggle" className="text-sm">Only from followed users</Label>
                    <Switch
                      id="privacy-toggle"
                      checked={user?.acceptOnlyFromFollowed || false}
                      onCheckedChange={(val) => updatePrivacy(val)}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex p-0.5 bg-muted rounded-lg">
            <button
              onClick={() => setActiveTab("conversations")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all",
                activeTab === "conversations" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Inbox className="h-3.5 w-3.5" />
              Chats
            </button>
            <button
              onClick={() => setActiveTab("requests")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all relative",
                activeTab === "requests" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Requests
              {conversations?.filter((c: any) => c.status === "request").length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground font-bold">
                  {conversations.filter((c: any) => c.status === "request").length}
                </span>
              )}
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              className="pl-9 bg-background/50 border-primary/10 transition-colors focus:border-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            <div className="p-2 space-y-1">
              {filteredConversations.map((c: any) => {
                const otherUserId = c.participantIds?.find((id: string) => id !== user?.id)
                const otherUser = allUsers.find((u: any) => u.id === otherUserId)
                if (!otherUser) return null

                return (
                  <div key={c.id} className="group relative">
                    <button
                      onClick={() => {
                        setSelectedUserId(otherUser.id)
                        setShowChatOnMobile(true)
                      }}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg w-full text-left transition-colors relative pr-12",
                        selectedUserId === otherUser.id ? "bg-muted shadow-sm" : "hover:bg-muted/50"
                      )}
                    >
                      <Avatar className="h-10 w-10 border border-primary/5">
                        <AvatarImage src={otherUser.avatar || "/placeholder.svg"} alt={otherUser.firstName} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {otherUser.firstName?.[0]}
                          {otherUser.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm truncate">
                            {otherUser.firstName} {otherUser.lastName}
                          </p>
                          {c.unreadCount > 0 && (
                            <Badge variant="default" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[10px] font-bold">
                              {c.unreadCount > 99 ? "99+" : c.unreadCount}
                            </Badge>
                          )}
                        </div>
                        {c.lastMessage && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                            {c.lastMessage.fileUrl && (
                              <ImageIcon className="h-3 w-3 shrink-0" />
                            )}
                            <span className="truncate">{c.lastMessage.content || (c.lastMessage.fileUrl ? "Sent a file" : "")}</span>
                            <span className="ml-auto text-[9px] shrink-0 opacity-70">
                              {formatDistanceToNow(new Date(c.lastMessage.createdAt), { addSuffix: false })}
                            </span>
                          </div>
                        )}
                        {c.status === "request" && (
                          <p className="text-[10px] text-primary font-medium mt-0.5">Message Request</p>
                        )}
                      </div>
                    </button>
                    {!isFollowing(otherUser.id) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity bg-primary/10 text-primary hover:bg-primary/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          follow(otherUser.id)
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-8">
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-3">
                  <MessageCircle className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {activeTab === "conversations" ? "No conversations yet" : "No message requests"}
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area - Independent Scroll */}
      <div className={cn(
        "flex-1 flex flex-col h-full bg-background relative overflow-hidden",
        !selectedUserId && "hidden md:flex",
        selectedUserId && "flex"
      )}>
        {selectedUser ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header - Fixed */}
            <div className="flex-none h-16 border-b border-border flex items-center px-4 gap-3 bg-card/50 backdrop-blur-md z-10">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden hover:bg-primary/10"
                onClick={() => setShowChatOnMobile(false)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Link href={`/profile/${selectedUser.username || selectedUser.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
                <Avatar className="h-10 w-10 border border-primary/10">
                  <AvatarImage src={selectedUser.avatar} alt="User" />
                  <AvatarFallback className="bg-primary/20 text-primary-foreground font-bold">
                    {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left overflow-hidden">
                  <p className="font-bold text-sm truncate">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                    Online
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                {!isFollowing(selectedUser.id) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="hidden sm:flex h-8 gap-2 rounded-full border-primary/20 hover:bg-primary/10 text-primary"
                    onClick={() => follow(selectedUserId!)}
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    Follow
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted rounded-full">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Chat Options</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => router.push(`/profile/${selectedUser.username || selectedUser.id}`)}>
                      <User className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                    {isFollowing(selectedUserId!) ? (
                      <DropdownMenuItem onClick={() => unfollow(selectedUserId!)}>
                        <UserMinus className="mr-2 h-4 w-4" />
                        Unfollow
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => follow(selectedUserId!)}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Follow
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {isBlocking(selectedUserId!) ? (
                      <DropdownMenuItem onClick={() => unblock(selectedUserId!)} className="text-green-600 focus:text-green-600">
                        <Slash className="mr-2 h-4 w-4" />
                        Unblock User
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => block(selectedUserId!)} className="text-destructive focus:text-destructive">
                        <Ban className="mr-2 h-4 w-4" />
                        Block User
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Message Area - Scrollable */}
            <ScrollArea className="flex-1 overflow-y-auto bg-muted/5">
              <div className="p-4 space-y-4 max-w-4xl mx-auto pb-8">
                {messages?.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === user?.id}
                    sender={allUsers?.find((u: any) => u.id === message.senderId)}
                    onImageClick={(url: string) => setLightboxImage(url)}
                    onDelete={(id) => {
                      if (confirm("Are you sure you want to delete this message?")) {
                        deleteMessage(id)
                      }
                    }}
                    onForward={(id) => setForwardMessageId(id)}
                  />
                ))}
                <div ref={messagesEndRef} className="h-4" />
              </div>
            </ScrollArea>

            {/* Footer / Input - Stable Fixed */}
            <div className="flex-none border-t border-border p-4 bg-card/8 backdrop-blur-md">
              {currentConversation?.status === "request" && (
                <div className="mb-4 p-4 rounded-2xl border border-primary/20 bg-primary/5 text-center space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold">Message Request</p>
                    <p className="text-xs text-muted-foreground">Do you want to let {selectedUser.firstName} send you messages?</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      onClick={() => acceptRequest(currentConversation.id)}
                      className="bg-primary hover:bg-primary/90 px-8 rounded-full font-bold shadow-md h-9"
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => block(selectedUserId!)}
                      className="text-destructive border-destructive/20 hover:bg-destructive/10 rounded-full px-8 h-9"
                    >
                      Block
                    </Button>
                  </div>
                </div>
              )}

              {isBlockedBy(selectedUserId!) || isBlocking(selectedUserId!) ? (
                <div className="p-6 text-center bg-muted/30 border border-dashed rounded-2xl">
                  <ShieldOff className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-medium text-muted-foreground italic">
                    {isBlocking(selectedUserId!) ? "You have blocked this user. Unblock to send messages." : "You cannot send messages to this user."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-w-5xl mx-auto">
                  {selectedFile && (
                    <div className="relative inline-block w-24 h-24 mb-2 animate-in zoom-in-95 fill-mode-both duration-300">
                      {selectedFile.file.type.startsWith('image/') ? (
                        <img src={selectedFile.preview} alt="Upload preview" className="w-full h-full object-cover rounded-2xl border-2 border-primary/20 shadow-xl" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted rounded-2xl border-2 border-primary/20 shadow-xl">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <Button
                        size="icon"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-lg border-2 border-background hover:scale-110 transition-transform"
                        onClick={() => setSelectedFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSendMessage()
                    }}
                    className="flex gap-2 items-center"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-10 w-10 hover:bg-primary/10 hover:text-primary transition-all rounded-full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading || currentConversation?.status === "request"}
                    >
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder={currentConversation?.status === "request" ? "Accept request to reply..." : "Type a message..."}
                      className="flex-1 h-11 bg-background/50 border-primary/10 focus:border-primary transition-all duration-300 rounded-2xl px-5 shadow-inner"
                      disabled={currentConversation?.status === "request"}
                    />
                    <Button
                      type="submit"
                      disabled={(!messageInput.trim() && !selectedFile) || isUploading || currentConversation?.status === "request"}
                      className="shrink-0 gap-2 h-11 px-6 rounded-2xl shadow-lg hover:shadow-primary/20 transition-all active:scale-95 bg-primary text-primary-foreground font-bold"
                    >
                      {isUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <span className="hidden sm:inline">Send</span>
                          <Send className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-muted/5">
            <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center mb-6 animate-pulse">
              <MessageCircle className="h-10 w-10 text-primary/20" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Select a conversation</h3>
            <p className="text-sm text-muted-foreground max-w-xs text-center">
              Choose someone from your existing chats or start a new conversation from their profile.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setLightboxImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full h-12 w-12"
            onClick={() => setLightboxImage(null)}
          >
            <X className="h-8 w-8" />
          </Button>
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage}
              alt="Full preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl animate-in zoom-in-95 duration-300"
            />
          </div>
        </div>
      )}

      {/* Forward Message Dialog */}
      <Dialog open={!!forwardMessageId} onOpenChange={(open) => !open && setForwardMessageId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Forward Message</DialogTitle>
            <DialogDescription>
              Choose a conversation to forward this message to.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                className="pl-9"
                value={forwardSearchQuery}
                onChange={(e) => setForwardSearchQuery(e.target.value)}
              />
            </div>
            <ScrollArea className="h-[300px] border rounded-md">
              <div className="p-2 space-y-1">
                {conversations
                  .filter((c: any) => c.status === "active")
                  .map((c: any) => {
                    const otherUserId = c.participantIds?.find((id: string) => id !== user?.id)
                    const otherUser = allUsers.find((u: any) => u.id === otherUserId)
                    if (!otherUser) return null

                    const fullName = `${otherUser.firstName} ${otherUser.lastName}`.toLowerCase()
                    if (forwardSearchQuery && !fullName.includes(forwardSearchQuery.toLowerCase())) return null

                    return (
                      <button
                        key={c.id}
                        onClick={async () => {
                          if (forwardMessageId) {
                            const result = await forwardMessage(forwardMessageId, otherUser.id)
                            if (result.success) {
                              toast.success("Message forwarded")
                              setForwardMessageId(null)
                            } else {
                              toast.error(result.error || "Failed to forward message")
                            }
                          }
                        }}
                        className="flex items-center gap-3 p-2 rounded-lg w-full text-left hover:bg-muted transition-colors"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={otherUser.avatar} />
                          <AvatarFallback>{otherUser.firstName?.[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{otherUser.firstName} {otherUser.lastName}</span>
                        <Forward className="ml-auto h-4 w-4 text-muted-foreground" />
                      </button>
                    )
                  })}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setForwardMessageId(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

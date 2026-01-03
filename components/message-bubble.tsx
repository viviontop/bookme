import { memo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileText, Maximize2, Check, CheckCheck, Clock, AlertCircle, Trash2, Forward, MoreVertical } from "lucide-react"
import { Message } from "@/lib/types"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface MessageBubbleProps {
    message: Message
    isOwn: boolean
    sender: any
    onImageClick: (url: string) => void
    onDelete?: (id: string) => void
    onForward?: (id: string) => void
}

// Helper for relative time
const formatRelativeTime = (date: Date | string) => {
    const now = new Date()
    const msgDate = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - msgDate.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return msgDate.toLocaleDateString()
}

export const MessageBubble = memo(({ message, isOwn, sender, onImageClick, onDelete, onForward }: MessageBubbleProps) => {
    return (
        <div className={`flex ${isOwn ? "justify-end" : "justify-start"} group/bubble`}>
            <div className={`flex gap-2 max-w-[80%] ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                {!isOwn && (
                    <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={sender?.avatar || "/placeholder.svg"} alt={sender?.firstName || "User"} />
                        <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                            {sender?.firstName?.[0] || "U"}
                        </AvatarFallback>
                    </Avatar>
                )}
                <div className={`rounded-xl px-4 py-2 ${isOwn ? "bg-primary text-primary-foreground shadow-md" : "bg-card border shadow-sm"}`}>
                    {message.fileUrl && (
                        <div className="mb-2">
                            {message.fileType?.startsWith('image/') ? (
                                <div className="relative group overflow-hidden rounded-lg">
                                    <img
                                        src={message.fileUrl}
                                        alt="Message attachment"
                                        className="max-w-full max-h-[300px] object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                                        onClick={() => onImageClick(message.fileUrl!)}
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                        <Maximize2 className="h-6 w-6 text-white drop-shadow-md" />
                                    </div>
                                </div>
                            ) : (
                                <a
                                    href={message.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm hover:underline transition-colors ${isOwn ? "bg-primary-foreground/10 border-primary-foreground/20" : "bg-muted border-border"
                                        }`}
                                >
                                    <FileText className="h-5 w-5 shrink-0" />
                                    <span className="truncate max-w-[200px]">Download File</span>
                                </a>
                            )}
                        </div>
                    )}
                    {message.content && <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>}
                    <div className="flex items-center justify-end gap-1 mt-1">
                        <p className={`text-[10px] ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {formatRelativeTime(message.createdAt)}
                        </p>
                        {isOwn && (
                            <div className="flex items-center">
                                {message.status === "pending" ? (
                                    <Clock className="h-3 w-3 text-primary-foreground/50 animate-pulse" />
                                ) : message.status === "error" ? (
                                    <AlertCircle className="h-3 w-3 text-red-400" />
                                ) : message.read ? (
                                    <div className="flex items-center gap-0.5">
                                        <span className="text-[9px] text-primary-foreground/90 font-medium">Read</span>
                                        <CheckCheck className="h-3.5 w-3.5 text-green-400" />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-0.5">
                                        <span className="text-[9px] text-primary-foreground/70">Sent</span>
                                        <Check className="h-3 w-3 text-primary-foreground/80" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Menu */}
                <div className={`flex items-start opacity-0 group-hover/bubble:opacity-100 transition-opacity ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align={isOwn ? "end" : "start"}>
                            <DropdownMenuItem onClick={() => onForward?.(message.id)}>
                                <Forward className="mr-2 h-4 w-4" />
                                <span>Forward</span>
                            </DropdownMenuItem>
                            {isOwn && (
                                <DropdownMenuItem
                                    onClick={() => onDelete?.(message.id)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    )
})

MessageBubble.displayName = "MessageBubble"

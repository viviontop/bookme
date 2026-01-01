"use client"

import { Bell, UserPlus, Calendar, MessageCircle, Info } from "lucide-react"
import { useData } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

export function NotificationBell() {
    const { notifications, markNotificationAsRead } = useData()
    const unreadCount = notifications.filter((n) => !n.read).length

    const getIcon = (type: string) => {
        switch (type) {
            case "FOLLOW":
                return <UserPlus className="h-4 w-4 text-blue-500" />
            case "APPOINTMENT":
                return <Calendar className="h-4 w-4 text-green-500" />
            case "MESSAGE":
                return <MessageCircle className="h-4 w-4 text-primary" />
            default:
                return <Info className="h-4 w-4 text-muted-foreground" />
        }
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -right-1 -top-1 h-4 min-w-[1rem] rounded-full px-1 py-0 text-[10px] flex items-center justify-center border-2 border-background"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b px-4 py-2">
                    <h4 className="text-sm font-semibold">Notifications</h4>
                    {unreadCount > 0 && (
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                            {unreadCount} New
                        </span>
                    )}
                </div>
                <ScrollArea className="h-80">
                    {notifications.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                            <Bell className="h-8 w-8 text-muted-foreground/30" />
                            <p className="mt-2 text-sm text-muted-foreground">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => (
                                <Link
                                    key={n.id}
                                    href={n.link || "#"}
                                    onClick={() => markNotificationAsRead(n.id)}
                                    className={cn(
                                        "flex gap-3 border-b p-4 transition-colors hover:bg-muted/50",
                                        !n.read && "bg-primary/5"
                                    )}
                                >
                                    <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                                    <div className="flex flex-col gap-1">
                                        <p className={cn("text-xs leading-normal", !n.read ? "font-semibold text-foreground" : "text-muted-foreground")}>
                                            {n.content}
                                        </p>
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    {!n.read && (
                                        <div className="ml-auto mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </ScrollArea>
                <div className="border-t p-2">
                    <Button variant="ghost" className="w-full text-xs" size="sm" asChild>
                        <Link href="/settings/notifications">View all settings</Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}

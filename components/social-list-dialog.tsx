
import React, { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { getFollowers, getFollowing } from "@/app/actions"
import Link from "next/link"
import { useMessaging } from "@/lib/messaging-context"

interface SocialListDialogProps {
    userId: string
    type: "followers" | "following"
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function SocialListDialog({ userId, type, open, onOpenChange }: SocialListDialogProps) {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const { follow, unfollow, isFollowing } = useMessaging()

    useEffect(() => {
        if (open) {
            loadUsers()
        }
    }, [open, userId, type])

    async function loadUsers() {
        setLoading(true)
        try {
            const result = type === "followers" ? await getFollowers(userId) : await getFollowing(userId)
            setUsers(result)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="capitalize">{type}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-2">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                    ) : users.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No {type} yet.</p>
                    ) : (
                        users.map((u) => (
                            <div key={u.id} className="flex items-center justify-between gap-3">
                                <Link
                                    href={`/profile/${u.username || u.id}`}
                                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                    onClick={() => onOpenChange(false)}
                                >
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={u.avatar} />
                                        <AvatarFallback>{u.firstName?.[0]}{u.lastName?.[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm leading-none">{u.firstName} {u.lastName}</p>
                                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                                    </div>
                                </Link>
                                {/* Optional: Add follow/unfollow button here if you want to allow following from lists */}
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"

export function UserSync() {
    const { user } = useAuth()
    const { syncUser } = useData()

    useEffect(() => {
        if (user) {
            syncUser(user)
        }
    }, [user, syncUser])

    return null
}

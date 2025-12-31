import { notFound, redirect } from "next/navigation"
import { getUserByUsername } from "@/app/actions"

// Simple server component that redirects username to ID-based route
export default async function UsernameProfileRedirect({
    params
}: {
    params: Promise<{ username: string }>
}) {
    const resolvedParams = await params
    let username = decodeURIComponent(resolvedParams.username)

    // Handle @ prefix if present in URL
    if (username.startsWith("%40")) username = username.substring(3)
    if (username.startsWith("@")) username = username.substring(1)

    const user = await getUserByUsername(username)

    if (!user) {
        notFound()
    }

    // Redirect to the ID-based profile page
    redirect(`/profile/${user.id}`)
}

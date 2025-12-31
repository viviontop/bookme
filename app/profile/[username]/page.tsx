import { notFound, redirect } from "next/navigation"
import { getUserByUsername, getServices } from "@/app/actions"

// Simple server component that redirects username to ID-based route
export default async function UsernameProfileRedirect({ params }: { params: { username: string } }) {
    const resolvedParams = await params
    let username = decodeURIComponent(resolvedParams.username)

    // Handle @ prefix if present in URL
    if (username.startsWith("%40")) username = username.substring(3)
    if (username.startsWith("@")) username = username.substring(1)

    const user = await getUserByUsername(username)

    if (!user) {
        notFound()
    }

    // Redirect to the ID-based profile page which has all the features
    redirect(`/profile/${user.id}`)
}

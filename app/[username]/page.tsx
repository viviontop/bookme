import { notFound } from "next/navigation"
import { getUserByUsername } from "@/app/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Calendar, Star, Shield, Mail } from "lucide-react"
import Link from "next/link"

export default async function UserProfilePage({ params }: { params: { username: string } }) {
    const resolvedParams = await params
    let username = decodeURIComponent(resolvedParams.username)

    // Handle @ prefix if present in URL
    if (username.startsWith("%40")) username = username.substring(3)
    if (username.startsWith("@")) username = username.substring(1)

    const user = await getUserByUsername(username)

    if (!user) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            {/* Banner */}
            <div className="h-48 w-full bg-gradient-to-r from-primary/10 to-primary/5 md:h-64 relative">
                {/* You could add a banner image here if available */}
            </div>

            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                <div className="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
                    <div className="flex">
                        <Avatar className="h-24 w-24 rounded-full ring-4 ring-background sm:h-32 sm:w-32">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.firstName} />
                            <AvatarFallback className="text-3xl">
                                {user.firstName[0]}
                                {user.lastName[0]}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="mt-6 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-between sm:space-x-6 sm:pb-1">
                        <div className="min-w-0 flex-1 sm:hidden md:block">
                            <h1 className="truncate text-2xl font-bold text-foreground">
                                {user.firstName} {user.lastName}
                            </h1>
                            <p className="text-sm text-muted-foreground">@{user.username || "username"}</p>
                        </div>
                        <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                            {/* Actions could go here */}
                        </div>
                    </div>
                </div>

                <div className="mt-6 hidden min-w-0 flex-1 sm:block md:hidden">
                    <h1 className="truncate text-2xl font-bold text-foreground">
                        {user.firstName} {user.lastName}
                    </h1>
                    <p className="text-sm text-muted-foreground">@{user.username || "username"}</p>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
                    {/* Sidebar info */}
                    <div className="space-y-6">
                        <Card>
                            <CardContent className="p-4 space-y-4">
                                {user.bio && (
                                    <div>
                                        <h3 className="font-semibold mb-2">About</h3>
                                        <p className="text-sm text-muted-foreground">{user.bio}</p>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    {user.location || "No location set"}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    Joined {new Date(user.createdAt).toLocaleDateString()}
                                </div>
                                {user.isVerified && (
                                    <div className="flex items-center gap-2 text-sm text-primary font-medium">
                                        <Shield className="h-4 w-4" />
                                        KYC Verified
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content (Services placeholder) */}
                    <div className="md:col-span-2 space-y-6">
                        <h2 className="text-xl font-semibold">Services</h2>
                        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                            This user hasn't posted any services yet or they are fetched dynamically via other components.
                            {/* You could re-use ServiceCard here if we fetched services in the action */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

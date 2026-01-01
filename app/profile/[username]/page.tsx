"use client"

import { useEffect, useMemo, useState, use, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { seedDemoData } from "@/lib/seed-data"
import type { Service, User, SocialStats } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ServiceCard } from "@/components/service-card"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Star,
  MapPin,
  Shield,
  Calendar,
  MessageCircle,
  Edit,
  Plus,
  UserPlus,
  UserMinus,
  Ban,
  Slash,
  MoreHorizontal
} from "lucide-react"
import { BookingDialog } from "@/components/booking-dialog"
import { AddServiceDialog } from "@/components/add-service-dialog"
import { ReviewsList } from "@/components/reviews-list"
import { BannerCropper } from "@/components/banner-cropper"
import { useMessaging } from "@/lib/messaging-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { SocialListDialog } from "@/components/social-list-dialog"
import { getSocialStats as getSocialStatsDB } from "@/app/actions"

export default function ProfilePage({ params }: { readonly params: Promise<{ username: string }> }) {
  const resolvedParams = use(params)
  const { user: currentUser, isLoading: authLoading, updateUser } = useAuth()
  const { services, users, reviews, getSellerRating, getBuyerRating, updateUser: updateUserData } = useData()
  const { follow, unfollow, block, unblock, isFollowing, isBlocking, getSocialStats } = useMessaging()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showBooking, setShowBooking] = useState(false)
  const [showAddService, setShowAddService] = useState(false)
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [usersLoaded, setUsersLoaded] = useState(false)
  const [socialStats, setSocialStats] = useState<SocialStats>({ followers: 0, following: 0 })
  const [socialListType, setSocialListType] = useState<"followers" | "following" | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    seedDemoData()
  }, [])

  const usernameParam = useMemo(() => {
    return resolvedParams.username
  }, [resolvedParams.username])

  const profileUser = useMemo(() => {
    if (!usernameParam) return null
    if (currentUser && (currentUser.username === usernameParam || currentUser.id === usernameParam)) {
      return currentUser
    }
    let foundUser = users.find((u) => u.username === usernameParam) || users.find((u) => u.id === usernameParam)
    if (foundUser && currentUser?.id === foundUser.id) return currentUser
    return foundUser
  }, [users, usernameParam, currentUser])

  useEffect(() => {
    if (users.length > 0 || currentUser) {
      const timer = setTimeout(() => setUsersLoaded(true), 200)
      return () => clearTimeout(timer)
    }
  }, [users.length, currentUser])

  useEffect(() => {
    if (profileUser?.id) {
      getSocialStatsDB(profileUser.id).then(setSocialStats)
    }
  }, [profileUser?.id, getSocialStats])

  const userServices = useMemo(() => {
    if (!profileUser) return []
    return services.filter((s) => s.sellerId === profileUser.id && s.isActive)
  }, [services, profileUser])

  const userReviews = useMemo(() => {
    if (!profileUser) return []
    return reviews.filter((r) => r.revieweeId === profileUser.id)
  }, [reviews, profileUser])

  const isOwnProfile = currentUser?.id === profileUser?.id
  const isSeller = profileUser?.role === "seller"
  const canCreateServices = isSeller || profileUser?.role === "admin"
  const { rating, count } = profileUser ? (isSeller ? getSellerRating(profileUser.id) : getBuyerRating(profileUser.id)) : { rating: 0, count: 0 }

  if (authLoading || !currentUser || !usersLoaded) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm">
          {/* Banner Area */}
          <div className="relative h-48 md:h-64 bg-primary/5 overflow-hidden">
            {profileUser.banner ? (
              <Image src={profileUser.banner} alt="Banner" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
            )}
            {isOwnProfile && (
              <div className="absolute top-4 right-4">
                <Button variant="secondary" size="sm" className="bg-background/80 backdrop-blur-md" onClick={() => fileInputRef.current?.click()}>
                  <Edit className="h-4 w-4 mr-2" /> Change Banner
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = () => {
                      setImageToCrop(reader.result as string)
                      setShowCropDialog(true)
                    }
                    reader.readAsDataURL(file)
                  }
                }} />
              </div>
            )}
          </div>

          <CardContent className="relative px-6 pb-6">
            <div className="flex flex-col md:flex-row gap-6 -mt-12 items-start md:items-end mb-6">
              <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                <AvatarImage src={profileUser.avatar} />
                <AvatarFallback className="text-3xl font-bold bg-primary text-primary-foreground uppercase">
                  {profileUser.firstName?.[0]}{profileUser.lastName?.[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-3xl font-bold">{profileUser.firstName} {profileUser.lastName}</h1>
                      {profileUser.isVerified && <Shield className="h-5 w-5 text-blue-500" fill="currentColor" />}
                    </div>
                    <p className="text-muted-foreground font-medium">@{profileUser.username || "user"}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOwnProfile ? (
                      <Link href="/settings">
                        <Button variant="outline" className="rounded-full px-6 font-bold shadow-sm border-primary/20 hover:bg-primary/5 hover:text-primary">
                          <Edit className="h-4 w-4 mr-2" /> Edit Profile
                        </Button>
                      </Link>
                    ) : (
                      <>
                        <Button
                          variant={isFollowing(profileUser.id) ? "outline" : "default"}
                          className="rounded-full px-8 font-bold shadow-lg"
                          onClick={() => {
                            if (isFollowing(profileUser.id)) {
                              unfollow(profileUser.id).then(() => {
                                getSocialStatsDB(profileUser.id).then(setSocialStats)
                              })
                            } else {
                              follow(profileUser.id).then(() => {
                                getSocialStatsDB(profileUser.id).then(setSocialStats)
                              })
                            }
                          }}
                        >
                          {isFollowing(profileUser.id) ? "Unfollow" : "Follow"}
                        </Button>
                        <Button
                          variant="secondary"
                          className="rounded-full px-6 font-bold shadow-sm"
                          onClick={() => router.push(`/chat?userId=${profileUser.id}`)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" /> Message
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            {isBlocking(profileUser.id) ? (
                              <DropdownMenuItem onClick={() => unblock(profileUser.id)} className="text-green-600 font-medium">
                                <Slash className="h-4 w-4 mr-2" /> Unblock
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => block(profileUser.id)} className="text-destructive font-medium">
                                <Ban className="h-4 w-4 mr-2" /> Block User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div
                    className={cn("flex items-center gap-1.5", (profileUser.showFollowers || isOwnProfile) && "cursor-pointer hover:opacity-70")}
                    onClick={() => (profileUser.showFollowers || isOwnProfile) && setSocialListType("followers")}
                  >
                    <span className="font-bold text-lg">{socialStats.followers}</span>
                    <span className="text-muted-foreground uppercase tracking-tight text-[10px] font-bold">Followers</span>
                  </div>
                  <div
                    className={cn("flex items-center gap-1.5", (profileUser.showFollowing || isOwnProfile) && "cursor-pointer hover:opacity-70")}
                    onClick={() => (profileUser.showFollowing || isOwnProfile) && setSocialListType("following")}
                  >
                    <span className="font-bold text-lg">{socialStats.following}</span>
                    <span className="text-muted-foreground uppercase tracking-tight text-[10px] font-bold">Following</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground font-medium">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-foreground font-bold">{rating.toFixed(1)}</span>
                    <span>({count} reviews)</span>
                  </div>
                  {profileUser.location && (
                    <div className="flex items-center gap-1 text-muted-foreground font-medium">
                      <MapPin className="h-4 w-4" />
                      <span>{profileUser.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-muted-foreground font-medium">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(profileUser.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>

            {profileUser.bio && (
              <div className="bg-muted/30 p-4 rounded-2xl mb-6">
                <p className="text-sm leading-relaxed text-muted-foreground italic">&ldquo;{profileUser.bio}&rdquo;</p>
              </div>
            )}

            <Tabs defaultValue="services" className="w-full">
              <TabsList className="w-full justify-start bg-transparent border-b rounded-none px-0 h-12 gap-8">
                <TabsTrigger value="services" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 font-bold text-muted-foreground data-[state=active]:text-foreground">
                  Services
                </TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-0 font-bold text-muted-foreground data-[state=active]:text-foreground">
                  Reviews ({userReviews.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="services" className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Offerings</h2>
                  {isOwnProfile && canCreateServices && (
                    <Button size="sm" onClick={() => setShowAddService(true)} className="rounded-full">
                      <Plus className="h-4 w-4 mr-2" /> Add Service
                    </Button>
                  )}
                </div>
                {userServices.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {userServices.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        seller={service.seller as any}
                        onClick={() => {
                          setSelectedService(service)
                          setShowBooking(true)
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/10 rounded-2xl border border-dashed">
                    <p className="text-muted-foreground">No services offered yet.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reviews" className="mt-6">
                <ReviewsList reviews={userReviews} users={users} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {selectedService && (
        <BookingDialog
          service={selectedService}
          seller={profileUser}
          open={showBooking}
          onOpenChange={setShowBooking}
        />
      )}

      {isOwnProfile && (
        <AddServiceDialog
          open={showAddService}
          onOpenChange={setShowAddService}
        />
      )}

      {imageToCrop && (
        <BannerCropper
          imageSrc={imageToCrop}
          open={showCropDialog}
          onOpenChange={setShowCropDialog}
          onCropComplete={(croppedImage, aspectRatio) => {
            if (currentUser) {
              updateUser({ banner: croppedImage, bannerAspectRatio: aspectRatio })
              updateUserData(currentUser.id, { banner: croppedImage, bannerAspectRatio: aspectRatio })
            }
            setShowCropDialog(false)
          }}
        />
      )}

      {profileUser && socialListType && (
        <SocialListDialog
          userId={profileUser.id}
          type={socialListType}
          open={!!socialListType}
          onOpenChange={(open) => !open && setSocialListType(null)}
        />
      )}
    </div>
  )
}

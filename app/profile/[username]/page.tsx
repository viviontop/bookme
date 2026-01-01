"use client"

import { useEffect, useMemo, useState, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { seedDemoData } from "@/lib/seed-data"
import type { Service, User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { ServiceCard } from "@/components/service-card"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, MapPin, Shield, Calendar, MessageCircle, Edit, Plus } from "lucide-react"
import { BookingDialog } from "@/components/booking-dialog"
import { AddServiceDialog } from "@/components/add-service-dialog"
import { ReviewsList } from "@/components/reviews-list"
import { BannerCropper } from "@/components/banner-cropper"

export default function ProfilePage({ params }: { readonly params: Promise<{ username: string }> }) {
  const resolvedParams = use(params)
  const { user: currentUser, isLoading: authLoading, updateUser } = useAuth()
  const { services, users, reviews, getSellerRating, getBuyerRating, updateUser: updateUserData } = useData()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showBooking, setShowBooking] = useState(false)
  const [showAddService, setShowAddService] = useState(false)
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [usersLoaded, setUsersLoaded] = useState(false)

  useEffect(() => {
    seedDemoData()
  }, [])

  // Extract username from params
  const usernameParam = useMemo(() => {
    return resolvedParams.username
  }, [resolvedParams.username])

  // Find user by username
  const profileUser = useMemo(() => {
    if (!usernameParam) return null

    // If viewing own profile and currentUser matches, use currentUser immediately
    if (currentUser) {
      if (currentUser.username === usernameParam || currentUser.id === usernameParam) {
        return currentUser
      }
    }

    // Try to find by username first
    let foundUser = users.find((u) => u.username === usernameParam)

    // If not found by username, try by id (for backward compatibility)
    if (!foundUser) {
      foundUser = users.find((u) => u.id === usernameParam)
    }

    // If viewing own profile, use currentUser to get latest data
    if (foundUser && currentUser?.id === foundUser.id) {
      return currentUser
    }

    return foundUser
  }, [users, usernameParam, currentUser])

  // Track when users are loaded (check if we have users or if enough time has passed)
  useEffect(() => {
    // If we have users loaded or currentUser, mark as loaded
    if (users.length > 0 || currentUser) {
      const timer = setTimeout(() => {
        setUsersLoaded(true)
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [users.length, currentUser])

  // Redirect to username URL if user has a username and we're accessing by ID
  useEffect(() => {
    if (profileUser?.username && usernameParam === profileUser.id) {
      router.replace(`/profile/${profileUser.username}`, { scroll: false })
    }
  }, [profileUser, usernameParam, router])

  const userServices = useMemo(() => {
    if (!profileUser) return []
    return services.filter((s) => s.sellerId === profileUser.id && s.isActive)
  }, [services, profileUser])

  const userReviews = useMemo(() => {
    if (!profileUser) return []
    return reviews.filter((r) => r.revieweeId === profileUser.id)
  }, [reviews, profileUser])

  const isOwnProfile = currentUser?.id === profileUser?.id

  // Open add service dialog if coming from navigation
  useEffect(() => {
    if (profileUser && searchParams.get("addService") === "true" && isOwnProfile && (currentUser?.role === "seller" || currentUser?.role === "admin")) {
      setShowAddService(true)
      // Clean up URL
      const profileUrl = profileUser.username ? `/profile/${profileUser.username}` : `/profile/${profileUser.id}`
      router.replace(profileUrl, { scroll: false })
    }
  }, [searchParams, isOwnProfile, currentUser?.role, router, profileUser])

  const isSeller = profileUser?.role === "seller"
  const isAdmin = profileUser?.role === "admin"
  const canCreateServices = isSeller || isAdmin
  const { rating, count } = profileUser ? (isSeller ? getSellerRating(profileUser.id) : getBuyerRating(profileUser.id)) : { rating: 0, count: 0 }

  // Initialize banner preview and reset when profileUser changes
  useEffect(() => {
    if (profileUser?.banner) {
      setBannerPreview(profileUser.banner)
    } else {
      setBannerPreview(null)
    }
  }, [profileUser?.banner, profileUser?.id])

  const handleBannerCropComplete = (croppedImage: string, aspectRatio?: number) => {
    if (currentUser) {
      const updateData: Partial<User> = { banner: croppedImage }
      if (aspectRatio) {
        updateData.bannerAspectRatio = aspectRatio
      }
      updateUser(updateData)
      updateUserData(currentUser.id, updateData)
      setBannerPreview(croppedImage)
    }
    setImageToCrop(null)
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file")
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageToCrop(reader.result as string)
        setShowCropDialog(true)
      }
      reader.readAsDataURL(file)
    }
  }

  if (authLoading || !currentUser) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Wait for users to load before showing "User not found"
  if (!usersLoaded) {
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
      <div className="mx-auto max-w-5xl px-4 py-6">
        {/* Profile Header */}
        <Card className="overflow-hidden">
          <div className="relative w-full bg-gradient-to-r from-primary/20 to-primary/5 overflow-hidden">
            <div
              className="relative w-full"
              style={{
                aspectRatio: profileUser.bannerAspectRatio
                  ? `${profileUser.bannerAspectRatio} / 1`
                  : '3 / 1',
                minHeight: '12rem',
                maxHeight: '28rem'
              }}
            >
              {bannerPreview || profileUser.banner ? (
                <Image
                  src={bannerPreview || profileUser.banner || ""}
                  alt="Profile banner"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 1024px"
                />
              ) : null}
            </div>
            {isOwnProfile && (
              <div className="absolute right-4 top-4">
                <input
                  type="file"
                  id="banner-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerChange}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => document.getElementById("banner-upload")?.click()}
                  className="bg-background/80 backdrop-blur-sm"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Change Banner
                </Button>
              </div>
            )}
          </div>
          <CardContent className="relative pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
              <Avatar className="-mt-16 h-32 w-32 border-4 border-card">
                <AvatarImage src={profileUser.avatar || "/placeholder.svg"} alt={profileUser.firstName} />
                <AvatarFallback className="bg-primary text-3xl text-primary-foreground">
                  {profileUser.firstName[0]}
                  {profileUser.lastName[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground">
                    {profileUser.firstName} {profileUser.lastName}
                  </h1>
                  <p className="text-muted-foreground">@{profileUser.username || "username"}</p>
                  {profileUser.isVerified && (
                    <Badge variant="secondary" className="gap-1">
                      <Shield className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                  <Badge variant="outline" className="capitalize">
                    {profileUser.role}
                  </Badge>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {rating > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      {rating} ({count} reviews)
                    </span>
                  )}
                  {profileUser.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {profileUser.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined{" "}
                    {new Date(profileUser.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                </div>

                {profileUser.bio && <p className="mt-3 text-sm text-muted-foreground">{profileUser.bio}</p>}
              </div>

              {isOwnProfile ? (
                <Button variant="outline" onClick={() => router.push("/settings")} className="bg-transparent">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    // Start conversation and navigate to chat
                    router.push(`/chat?userId=${profileUser.id}`)
                  }}
                  className="rounded-full px-6 font-bold shadow-lg transition-transform active:scale-95"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Message
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="mt-6">
          <Tabs defaultValue={(canCreateServices || userServices.length > 0) ? "services" : "reviews"}>
            <TabsList>
              {(canCreateServices || userServices.length > 0) && <TabsTrigger value="services">Services ({userServices.length})</TabsTrigger>}
              <TabsTrigger value="reviews">Reviews ({userReviews.length})</TabsTrigger>
            </TabsList>

            {(canCreateServices || userServices.length > 0) && (
              <TabsContent value="services" className="mt-6">
                {isOwnProfile && (
                  <Button className="mb-6" onClick={() => setShowAddService(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Service
                  </Button>
                )}

                {userServices.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {userServices.map((service) => (
                      <ServiceCard key={service.id} service={service} seller={profileUser} />
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">
                      {isOwnProfile ? "You haven't added any services yet" : "No services available"}
                    </p>
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent value="reviews" className="mt-6">
              <ReviewsList reviews={userReviews} users={users} />
            </TabsContent>
          </Tabs>
        </div >
      </div >

      {/* Booking Dialog */}
      {
        selectedService && profileUser && (
          <BookingDialog
            open={showBooking}
            onOpenChange={setShowBooking}
            service={selectedService}
            seller={profileUser}
          />
        )
      }

      {/* Add Service Dialog */}
      {
        isOwnProfile && (currentUser.role === "seller" || currentUser.role === "admin") && (
          <AddServiceDialog open={showAddService} onOpenChange={setShowAddService} />
        )
      }

      {/* Banner Cropper Dialog */}
      {
        imageToCrop && (
          <BannerCropper
            open={showCropDialog}
            onOpenChange={setShowCropDialog}
            imageSrc={imageToCrop}
            onCropComplete={handleBannerCropComplete}
          />
        )
      }
    </div >
  )
}

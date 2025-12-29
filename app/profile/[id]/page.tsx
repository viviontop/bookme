"use client"

import { useEffect, useMemo, useState, use } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { seedDemoData } from "@/lib/seed-data"
import type { Service } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, MapPin, Shield, Clock, Calendar, MessageCircle, Edit, Plus } from "lucide-react"
import { BookingDialog } from "@/components/booking-dialog"
import { AddServiceDialog } from "@/components/add-service-dialog"
import { ReviewsList } from "@/components/reviews-list"

export default function ProfilePage({ params }: { readonly params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { user: currentUser, isLoading: authLoading } = useAuth()
  const { services, users, reviews, getSellerRating, getBuyerRating } = useData()
  const router = useRouter()

  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showBooking, setShowBooking] = useState(false)
  const [showAddService, setShowAddService] = useState(false)

  useEffect(() => {
    seedDemoData()
  }, [])

  useEffect(() => {
    if (!authLoading && !currentUser) {
      router.push("/login")
    }
  }, [authLoading, currentUser, router])

  const profileUser = useMemo(() => {
    return users.find((u) => u.id === resolvedParams.id)
  }, [users, resolvedParams.id])

  const userServices = useMemo(() => {
    return services.filter((s) => s.sellerId === resolvedParams.id && s.isActive)
  }, [services, resolvedParams.id])

  const userReviews = useMemo(() => {
    return reviews.filter((r) => r.revieweeId === resolvedParams.id)
  }, [reviews, resolvedParams.id])

  const isOwnProfile = currentUser?.id === resolvedParams.id
  const isSeller = profileUser?.role === "seller"
  const { rating, count } = isSeller ? getSellerRating(resolvedParams.id) : getBuyerRating(resolvedParams.id)

  if (authLoading || !currentUser) {
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
          <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5" />
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
                isSeller && (
                  <Button
                    onClick={() => {
                      // Start conversation and navigate to chat
                      router.push(`/chat?userId=${resolvedParams.id}`)
                    }}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Message
                  </Button>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="mt-6">
          <Tabs defaultValue={isSeller ? "services" : "reviews"}>
            <TabsList>
              {isSeller && <TabsTrigger value="services">Services ({userServices.length})</TabsTrigger>}
              <TabsTrigger value="reviews">Reviews ({userReviews.length})</TabsTrigger>
            </TabsList>

            {isSeller && (
              <TabsContent value="services" className="mt-6">
                {isOwnProfile && (
                  <Button className="mb-6" onClick={() => setShowAddService(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Service
                  </Button>
                )}

                {userServices.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {userServices.map((service) => (
                      <Card key={service.id} className="overflow-hidden">
                        <div className="relative aspect-video">
                          <Image
                            src={service.images[0] || "/placeholder.svg?height=200&width=400&query=service"}
                            alt={service.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground">{service.title}</h3>
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
                            </div>
                            <Badge variant="secondary" className="ml-2 shrink-0">
                              ${service.price}
                            </Badge>
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {service.duration} min
                              </span>
                              <Badge variant="outline">{service.category}</Badge>
                            </div>
                            {!isOwnProfile && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedService(service)
                                  setShowBooking(true)
                                }}
                              >
                                Book Now
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
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
        </div>
      </div>

      {/* Booking Dialog */}
      {selectedService && profileUser && (
        <BookingDialog
          open={showBooking}
          onOpenChange={setShowBooking}
          service={selectedService}
          seller={profileUser}
        />
      )}

      {/* Add Service Dialog */}
      {isOwnProfile && currentUser.role === "seller" && (
        <AddServiceDialog open={showAddService} onOpenChange={setShowAddService} />
      )}
    </div>
  )
}

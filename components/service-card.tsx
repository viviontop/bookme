"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import type { Service, User } from "@/lib/types"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { deleteService } from "@/app/actions"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Star, Clock, MapPin, Shield, X, ChevronLeft, ChevronRight, Trash, Flag } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface ServiceCardProps {
  service: Service
  seller: User
}

export function ServiceCard({ service, seller }: ServiceCardProps) {
  const { getSellerRating } = useData()
  const { user: currentUser } = useAuth()
  const router = useRouter()
  const { rating, count } = getSellerRating(seller.id)

  // State for report and delete
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")

  const isOwner = currentUser?.id === seller.id
  const isAdmin = currentUser?.role === "admin"

  const handleDelete = async () => {
    if (!currentUser || (!isOwner && !isAdmin)) return

    if (confirm("Are you sure you want to delete this service?")) {
      const result = await deleteService(service.id, currentUser.id)
      if (result.success) {
        toast.success("Service deleted successfully")
        router.refresh()
      } else {
        toast.error(result.error || "Failed to delete service")
      }
    }
  }

  const handleReport = () => {
    toast.success("Report submitted. We'll review it shortly.")
    setIsReportOpen(false)
    setReportReason("")
  }

  // Feed Carousel
  const [feedEmblaRef, feedEmblaApi] = useEmblaCarousel({ loop: true })

  // Modal Carousel
  const [modalEmblaRef, modalEmblaApi] = useEmblaCarousel({ loop: true })

  const handlePrev = (e: React.MouseEvent, api: any) => {
    e.preventDefault()
    e.stopPropagation()
    api?.scrollPrev()
  }

  const handleNext = (e: React.MouseEvent, api: any) => {
    e.preventDefault()
    e.stopPropagation()
    api?.scrollNext()
  }

  const images = service.images.length > 0 ? service.images : ["/placeholder.svg?height=300&width=400&query=service"]

  // Component for the Seller Info (used in both Card and Modal)
  const SellerInfo = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center gap-2 ${className}`}>
      <Link href={`/profile/${seller.username || seller.id}`} onClick={(e) => e.stopPropagation()}>
        <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarImage src={seller.avatar || "/placeholder.svg"} alt={seller.firstName} />
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">
            {seller.firstName[0]}
            {seller.lastName[0]}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/profile/${seller.username || seller.id}`} onClick={(e) => e.stopPropagation()}>
          <p className="truncate text-sm font-medium text-foreground cursor-pointer hover:underline">
            {seller.firstName} {seller.lastName}
          </p>
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {rating > 0 ? (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {rating} ({count})
            </span>
          ) : (
            <span>New</span>
          )}
          {seller.isVerified && (
            <span className="flex items-center gap-0.5 text-primary">
              <Shield className="h-3 w-3" />
              Verified
            </span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer border-border/50">
          {/* Feed Image Carousel */}
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            <div className="h-full w-full" ref={feedEmblaRef}>
              <div className="flex h-full w-full touch-pan-y">
                {images.map((img, index) => (
                  <div className="flex-[0_0_100%] min-w-0 relative" key={index}>
                    <Image
                      src={img}
                      alt={`${service.title} - Image ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            </div>

            {images.length > 1 && (
              <>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full opacity-0 shadow-md transition-opacity group-hover:opacity-100 disabled:opacity-0"
                  onClick={(e) => handlePrev(e, feedEmblaApi)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full opacity-0 shadow-md transition-opacity group-hover:opacity-100 disabled:opacity-0"
                  onClick={(e) => handleNext(e, feedEmblaApi)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1 pointer-events-none">
                  {images.map((_, i) => (
                    <div key={i} className="h-1.5 w-1.5 rounded-full bg-white/50 backdrop-blur-sm shadow-sm" />
                  ))}
                </div>
              </>
            )}

            <div className="absolute right-2 top-2 pointer-events-none">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-md font-semibold">
                ${service.price}
              </Badge>
            </div>
          </div>

          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">{service.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
              </div>
            </div>

            <div className="mt-3">
              <SellerInfo />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {service.duration} min
              </span>
              {seller.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {seller.location}
                </span>
              )}
              <Badge variant="outline" className="text-xs font-normal">
                {service.category}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>

      {/* Service Detail Modal - Premium Design */}
      <DialogContent className="max-w-7xl h-[90vh] p-0 overflow-hidden gap-0 bg-background border-none shadow-2xl">
        <DialogTitle className="sr-only">{service.title}</DialogTitle>

        <div className="grid md:grid-cols-[1.6fr_1fr] h-full">
          {/* Left: Image Carousel */}
          <div className="relative bg-gradient-to-br from-black via-gray-900 to-black overflow-hidden group/modal-carousel">
            <div className="h-full w-full" ref={modalEmblaRef}>
              <div className="flex h-full w-full touch-pan-y">
                {images.map((img, index) => (
                  <div className="flex-[0_0_100%] min-w-0 relative h-full flex items-center justify-center" key={index}>
                    <Image
                      src={img}
                      alt={`${service.title} - Image ${index + 1}`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 60vw"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Carousel Navigation */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:text-white border border-white/20 opacity-0 group-hover/modal-carousel:opacity-100 transition-all shadow-2xl"
                  onClick={(e) => handlePrev(e, modalEmblaApi)}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white/20 hover:text-white border border-white/20 opacity-0 group-hover/modal-carousel:opacity-100 transition-all shadow-2xl"
                  onClick={(e) => handleNext(e, modalEmblaApi)}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>

                {/* Dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      className="h-2 w-2 rounded-full bg-white/40 hover:bg-white/60 transition-all backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        modalEmblaApi?.scrollTo(i)
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Action Buttons Overlay */}
            <div className="absolute top-6 right-6 z-20 flex gap-2">
              {(isOwner || isAdmin) && (
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={handleDelete}
                  title="Delete Service"
                  className="h-10 w-10 rounded-full shadow-xl bg-red-500 hover:bg-red-600 border-2 border-white/20"
                >
                  <Trash className="h-5 w-5" />
                </Button>
              )}

              {currentUser && !isOwner && (
                <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Report Service"
                      className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 border-2 border-white/20 text-white shadow-xl"
                    >
                      <Flag className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Report Service</DialogTitle>
                      <DialogDescription>Please describe why you are reporting this service.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="reason" className="mb-2 block">Reason</Label>
                      <Textarea
                        id="reason"
                        placeholder="This service violates terms because..."
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsReportOpen(false)}>Cancel</Button>
                      <Button onClick={handleReport}>Submit Report</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>

          {/* Right: Service Details */}
          <div className="flex flex-col h-full overflow-hidden bg-background">
            {/* Header Section */}
            <div className="p-8 border-b border-border/50">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-4xl font-bold text-foreground mb-3 leading-tight">{service.title}</h2>
                  <Badge variant="secondary" className="text-sm font-medium px-3 py-1">
                    {service.category}
                  </Badge>
                </div>
                <div className="text-right ml-4">
                  <div className="text-5xl font-bold text-primary">${service.price}</div>
                  <div className="text-sm text-muted-foreground mt-1">per session</div>
                </div>
              </div>

              {/* Seller Info */}
              <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/50">
                <SellerInfo />
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8">
              {/* Service Details */}
              <div className="space-y-6">
                <div className="flex items-center gap-6 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span className="font-medium">{service.duration} minutes</span>
                  </div>
                  {seller.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      <span className="font-medium">{seller.location}</span>
                    </div>
                  )}
                </div>

                {service.description && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-primary"></div>
                      About This Service
                    </h3>
                    <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {service.description}
                    </p>
                  </div>
                )}

                {/* Additional Info Cards */}
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="text-sm text-muted-foreground mb-1">Duration</div>
                    <div className="text-2xl font-bold text-foreground">{service.duration}m</div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                    <div className="text-sm text-muted-foreground mb-1">Category</div>
                    <div className="text-2xl font-bold text-foreground truncate">{service.category}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border/50 bg-muted/20">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 text-base font-semibold"
                  asChild
                >
                  <Link href={`/profile/${seller.username || seller.id}`}>
                    View Profile
                  </Link>
                </Button>
                <Button
                  className="flex-1 h-12 text-base font-semibold shadow-lg bg-primary hover:bg-primary/90"
                >
                  Book Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Service, User } from "@/lib/types"
import { useData } from "@/lib/data-context"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import { Star, Clock, MapPin, Shield, X, ChevronLeft, ChevronRight } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import { Button } from "@/components/ui/button"

interface ServiceCardProps {
  service: Service
  seller: User
}

export function ServiceCard({ service, seller }: ServiceCardProps) {
  const { getSellerRating } = useData()
  const { rating, count } = getSellerRating(seller.id)

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
      <Link href={seller.username ? `/${seller.username}` : `/profile/${seller.id}`} onClick={(e) => e.stopPropagation()}>
        <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarImage src={seller.avatar || "/placeholder.svg"} alt={seller.firstName} />
          <AvatarFallback className="bg-primary text-xs text-primary-foreground">
            {seller.firstName[0]}
            {seller.lastName[0]}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={seller.username ? `/${seller.username}` : `/profile/${seller.id}`} onClick={(e) => e.stopPropagation()}>
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

      {/* Service Detail Modal */}
      <DialogContent className="max-w-4xl p-0 overflow-hidden gap-0 sm:max-h-[90vh] bg-background border-none shadow-2xl">
        {/* Hidden title for screen readers */}
        <DialogTitle className="sr-only">{service.title}</DialogTitle>

        <div className="grid md:grid-cols-[1.2fr_1fr] h-full max-h-[90vh]">
          {/* Modal Carousel */}
          <div className="relative bg-black aspect-video md:aspect-auto md:h-full overflow-hidden">
            <div className="h-full w-full absolute inset-0 md:relative" ref={modalEmblaRef}>
              <div className="flex h-full w-full touch-pan-y">
                {images.map((img, index) => (
                  <div className="flex-[0_0_100%] min-w-0 relative h-full flex items-center justify-center bg-black/90" key={index}>
                    <Image
                      src={img}
                      alt={`${service.title} - Detail Image ${index + 1}`}
                      fill
                      className="object-contain"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>
            </div>
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-black/20 text-white hover:bg-black/40 hover:text-white"
                  onClick={(e) => handlePrev(e, modalEmblaApi)}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-black/20 text-white hover:bg-black/40 hover:text-white"
                  onClick={(e) => handleNext(e, modalEmblaApi)}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>

          {/* Modal Details */}
          <div className="flex flex-col h-full bg-background overflow-hidden relative">
            {/* Close button provided by DialogContent usually, but explicit one sometimes safer if customized */}

            <div className="p-6 md:p-8 flex-1 overflow-y-auto">
              <div className="flex items-start justify-between mb-4">
                <Badge variant="secondary" className="text-xs font-medium px-2 py-0.5">{service.category}</Badge>
                <div className="text-2xl font-bold text-primary">${service.price}</div>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-foreground leading-tight">{service.title}</h2>

              <SellerInfo className="mb-8 p-4 bg-muted/40 rounded-xl border border-border/50" />

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold mb-2 text-foreground uppercase tracking-wider">About this Service</h4>
                  <p className="text-sm md:text-base leading-relaxed text-muted-foreground whitespace-pre-wrap">{service.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-border">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Duration</span>
                    <div className="flex items-center gap-2 font-medium">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>{service.duration} mins</span>
                    </div>
                  </div>
                  {seller.location && (
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Location</span>
                      <div className="flex items-center gap-2 font-medium">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span>{seller.location}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 border-t border-border bg-muted/5 flex justify-between items-center gap-4">
              <Button variant="outline" className="flex-1" asChild>
                <Link href={seller.username ? `/${seller.username}` : `/profile/${seller.id}`}>
                  View Profile
                </Link>
              </Button>
              <Button className="flex-[2] text-base font-semibold shadow-lg shadow-primary/20">Book Now</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

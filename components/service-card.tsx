"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import type { Service, User } from "@/lib/types"
import { useData } from "@/lib/data-context"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Star, Clock, MapPin, Shield } from "lucide-react"

interface ServiceCardProps {
  service: Service
  seller: User
}

import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "./ui/button"

export function ServiceCard({ service, seller }: ServiceCardProps) {
  const { getSellerRating } = useData()
  const { rating, count } = getSellerRating(seller.id)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    emblaApi?.scrollPrev()
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    emblaApi?.scrollNext()
  }

  const images = service.images.length > 0 ? service.images : ["/placeholder.svg?height=300&width=400&query=service"]

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="h-full w-full" ref={emblaRef}>
          <div className="flex h-full w-full touch-pan-y">
            {images.map((img, index) => (
              <div className="flex-[0_0_100%] min-w-0 relative" key={index}>
                <Link href={seller.username ? `/${seller.username}` : `/profile/${seller.id}`} className="block h-full w-full">
                  <Image
                    src={img}
                    alt={`${service.title} - Image ${index + 1}`}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>
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
              onClick={handlePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full opacity-0 shadow-md transition-opacity group-hover:opacity-100 disabled:opacity-0"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
              {images.map((_, i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-white/50 backdrop-blur-sm" />
              ))}
            </div>
          </>
        )}

        <div className="absolute right-2 top-2 pointer-events-none">
          <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm">
            ${service.price}
          </Badge>
        </div>
      </div>
      <Link href={seller.username ? `/${seller.username}` : `/profile/${seller.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold text-foreground">{service.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={seller.avatar || "/placeholder.svg"} alt={seller.firstName} />
              <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                {seller.firstName[0]}
                {seller.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {seller.firstName} {seller.lastName}
              </p>
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
            <Badge variant="outline" className="text-xs">
              {service.category}
            </Badge>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}

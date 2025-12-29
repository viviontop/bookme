"use client"

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

export function ServiceCard({ service, seller }: ServiceCardProps) {
  const { getSellerRating } = useData()
  const { rating, count } = getSellerRating(seller.id)

  return (
    <Link href={`/profile/${seller.id}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={service.images[0] || "/placeholder.svg?height=300&width=400&query=service"}
            alt={service.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute right-2 top-2">
            <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm">
              ${service.price}
            </Badge>
          </div>
        </div>
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
      </Card>
    </Link>
  )
}

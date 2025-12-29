"use client"

import type { Review, User } from "@/lib/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
import Link from "next/link"

interface ReviewsListProps {
  reviews: Review[]
  users: User[]
}

export function ReviewsList({ reviews, users }: ReviewsListProps) {
  if (reviews.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No reviews yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const reviewer = users.find((u) => u.id === review.reviewerId)
        return (
          <Card 
            key={review.id} 
            className="transition-all hover:shadow-md cursor-pointer"
          >
            <CardContent className="p-4">
              <Link href={reviewer ? `/profile/${reviewer.id}` : "#"}>
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarImage src={reviewer?.avatar || "/placeholder.svg"} alt={reviewer?.firstName || "User"} />
                    <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                      {reviewer?.firstName?.[0] || "U"}
                      {reviewer?.lastName?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-foreground hover:text-primary transition-colors">
                        {reviewer?.firstName || "Anonymous"} {reviewer?.lastName || ""}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 transition-colors ${
                            i < review.rating 
                              ? "fill-yellow-500 text-yellow-500" 
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-medium text-foreground">
                        {review.rating}.0
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

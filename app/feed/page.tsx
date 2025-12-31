"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { seedDemoData } from "@/lib/seed-data"
import { ServiceCard } from "@/components/service-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw } from "lucide-react"

const categories = ["All", "Beauty", "Photography", "Fitness", "Wellness"]

export default function FeedPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { services, users } = useData()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [shuffleKey, setShuffleKey] = useState(0)

  // Removed useEffect auth check to allow guest access

  // Get sellers from users list
  const sellers = useMemo(() => {
    return users.filter((u) => u.role === "seller")
  }, [users])

  // Shuffle and filter services
  const recommendedServices = useMemo(() => {
    let filtered = services.filter((s) => s.isActive)
    if (selectedCategory !== "All") {
      filtered = filtered.filter((s) => s.category === selectedCategory)
    }

    // Deterministic shuffle based on shuffleKey
    const shuffled = [...filtered]
    // Use a seeded random function for deterministic shuffling
    let seed = shuffleKey
    const seededRandom = () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }

    // Fisher-Yates shuffle with seeded random
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return shuffled
  }, [services, selectedCategory, shuffleKey])

  // Removed loading spinner to allow optimistic rendering or guest view

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Discover Services</h1>
          <p className="mt-1 text-muted-foreground">Find the perfect professional for your needs</p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="flex-wrap">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Button variant="outline" size="sm" onClick={() => setShuffleKey((k) => k + 1)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Shuffle
          </Button>
        </div>

        {/* Services Grid */}
        {recommendedServices.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {recommendedServices.map((service) => {
              const seller = service.seller || sellers.find((s) => s.id === service.sellerId)
              if (!seller) return null
              return <ServiceCard key={service.id} service={service} seller={seller} />
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg text-muted-foreground">No services found in this category</p>
            <Button variant="link" onClick={() => setSelectedCategory("All")}>
              View all services
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

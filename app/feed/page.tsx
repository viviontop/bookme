"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { seedDemoData } from "@/lib/seed-data"
import { ServiceCard } from "@/components/service-card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, LayoutGrid, Filter, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

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
    <div className="min-h-[calc(100vh-4rem)] bg-background relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[160px] -z-10" />

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
              Discover <span className="text-primary italic">Excellence</span>
            </h1>
            <p className="text-muted-foreground font-medium max-w-md">
              Connect with top-tier professionals and book services that transform your lifestyle.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 border border-border/50 text-xs font-bold text-muted-foreground">
              <LayoutGrid className="h-3.5 w-3.5" />
              {recommendedServices.length} Results
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShuffleKey((k) => k + 1)}
              className="rounded-full px-4 font-bold border-2 hover:bg-primary hover:text-primary-foreground transition-all active:scale-95"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Shuffle Feed
            </Button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 overflow-x-auto no-scrollbar pb-2"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/30 rounded-2xl border border-border/40 font-bold text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              Categories
            </div>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-auto">
              <TabsList className="bg-transparent gap-2 p-0 h-auto">
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat}
                    value={cat}
                    className="rounded-2xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl border-2 border-transparent hover:border-border transition-all font-bold text-sm"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </motion.div>

        {/* Services Grid */}
        <AnimatePresence mode="popLayout">
          {recommendedServices.length > 0 ? (
            <motion.div
              key={`${selectedCategory}-${shuffleKey}`}
              className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              initial="hidden"
              animate="show"
              variants={{
                show: {
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
            >
              {recommendedServices.map((service) => {
                const seller = service.seller || sellers.find((s) => s.id === service.sellerId)
                if (!seller) return null
                return (
                  <motion.div
                    key={service.id}
                    variants={{
                      hidden: { opacity: 0, y: 30, scale: 0.95 },
                      show: { opacity: 1, y: 0, scale: 1 }
                    }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                  >
                    <ServiceCard service={service} seller={seller} />
                  </motion.div>
                )
              })}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="p-6 rounded-full bg-muted/30 mb-6">
                <LayoutGrid className="h-12 w-12 text-muted-foreground/40" />
              </div>
              <p className="text-xl font-black text-foreground mb-2">No experiences found</p>
              <p className="text-muted-foreground max-w-xs mb-6">We couldn't find any services in {selectedCategory}. Try another category or explore everything.</p>
              <Button variant="default" className="rounded-full px-8 font-bold h-12" onClick={() => setSelectedCategory("All")}>
                Explore All Services
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

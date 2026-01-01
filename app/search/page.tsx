"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { ServiceCard } from "@/components/service-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Search, SlidersHorizontal, X, MessageCircle, Users } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

const categories = ["All", "Beauty", "Photography", "Fitness", "Wellness"]
const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
]

export default function SearchPage() {
  const { user } = useAuth()
  const { services, users, getSellerRating } = useData()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "All")
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "recommended")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [searchMode, setSearchMode] = useState<"services" | "people">("services")

  const sellers = useMemo(() => {
    return users.filter((u) => u.role === "seller")
  }, [users])

  const filteredServices = useMemo(() => {
    let filtered = services.filter((s) => s.isActive)

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((s) => {
        const seller = s.seller || sellers.find((sel) => sel.id === s.sellerId)
        return (
          s.title.toLowerCase().includes(query) ||
          s.description.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query) ||
          seller?.firstName.toLowerCase().includes(query) ||
          seller?.lastName.toLowerCase().includes(query) ||
          seller?.username?.toLowerCase().includes(query) ||
          seller?.location?.toLowerCase().includes(query)
        )
      })
    }

    if (category !== "All") {
      filtered = filtered.filter((s) => s.category === category)
    }

    filtered = filtered.filter((s) => s.price >= priceRange[0] && s.price <= priceRange[1])

    if (verifiedOnly) {
      filtered = filtered.filter((s) => {
        const seller = s.seller || sellers.find((sel) => sel.id === s.sellerId)
        return seller?.isVerified
      })
    }

    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => a.price - b.price)
        break
      case "price-high":
        filtered.sort((a, b) => b.price - a.price)
        break
      case "rating":
        filtered.sort((a, b) => {
          const ratingA = getSellerRating(a.sellerId).rating
          const ratingB = getSellerRating(b.sellerId).rating
          return ratingB - ratingA
        })
        break
      default:
        filtered.sort(() => Math.random() - 0.5)
    }

    return filtered
  }, [services, sellers, searchQuery, category, sortBy, priceRange, verifiedOnly, getSellerRating])

  const filteredPeople = useMemo(() => {
    if (!searchQuery) return users

    const query = searchQuery.toLowerCase().replace("@", "")
    return users.filter((u) =>
      u.username?.toLowerCase().includes(query) ||
      u.firstName.toLowerCase().includes(query) ||
      u.lastName.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    )
  }, [users, searchQuery])

  const activeFiltersCount = [category !== "All", verifiedOnly, priceRange[0] > 0 || priceRange[1] < 500].filter(
    Boolean,
  ).length

  const clearFilters = () => {
    setCategory("All")
    setVerifiedOnly(false)
    setPriceRange([0, 500])
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Search Header */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={searchMode === "services" ? "Search services, categories, or keywords..." : "Search people by name or @username..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Mode Toggle */}
        <div className="mb-8">
          <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as any)} className="w-full max-w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="services" className="gap-2">
                <Search className="h-4 w-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="people" className="gap-2">
                <Users className="h-4 w-4" />
                People
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {searchMode === "services" ? (
          <>
            {/* Filters Bar */}
            <div className="mb-6 flex overflow-x-auto no-scrollbar pb-2 items-center gap-3">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-6">
                    <div className="space-y-3">
                      <Label>
                        Price Range: ${priceRange[0]} - ${priceRange[1]}
                      </Label>
                      <Slider
                        value={priceRange}
                        onValueChange={(v) => setPriceRange(v as [number, number])}
                        min={0}
                        max={500}
                        step={10}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="verified"
                        checked={verifiedOnly}
                        onChange={(e) => setVerifiedOnly(e.target.checked)}
                        className="h-4 w-4 rounded border-border"
                      />
                      <Label htmlFor="verified" className="cursor-pointer">
                        Verified providers only
                      </Label>
                    </div>

                    <Button variant="outline" className="w-full bg-transparent" onClick={clearFilters}>
                      Clear Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              )}

              <span className="ml-auto text-sm text-muted-foreground">{filteredServices.length} results</span>
            </div>

            {filteredServices.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredServices.map((service) => {
                  const seller = service.seller || sellers.find((s) => s.id === service.sellerId)
                  if (!seller) return null
                  return <ServiceCard key={service.id} service={service} seller={seller} />
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-lg font-medium text-foreground">No services found</p>
                <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters</p>
                <Button variant="link" onClick={clearFilters}>
                  Clear all filters
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Discovery</h2>
              <span className="text-sm text-muted-foreground">{filteredPeople.length} users found</span>
            </div>
            {filteredPeople.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredPeople.map(profile => (
                  <div
                    key={profile.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-card border hover:shadow-lg transition-all cursor-pointer group hover:border-primary/50 overflow-hidden relative"
                    onClick={() => router.push(`/profile/${profile.username || profile.id}`)}
                  >
                    <div className="h-14 w-14 rounded-full overflow-hidden relative border-2 border-background shadow-sm shrink-0">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt={profile.firstName} className="object-cover h-full w-full transition-transform group-hover:scale-110" />
                      ) : (
                        <div className="h-full w-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-lg">
                          {profile.firstName[0]}{profile.lastName[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-semibold truncate text-foreground">{profile.firstName} {profile.lastName}</p>
                        {profile.isVerified && (
                          <div className="h-3.5 w-3.5 rounded-full bg-primary flex items-center justify-center shrink-0">
                            <svg className="h-2 w-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                        <span className="text-primary/70">@</span>
                        {profile.username || "anonymous"}
                      </p>
                      {profile.role === "seller" && profile.bio && (
                        <p className="text-xs text-muted-foreground/80 truncate mt-1 italic">{profile.bio}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 rounded-full hover:bg-primary/20 hover:text-primary transition-colors h-10 w-10"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/chat?userId=${profile.id}`)
                      }}
                    >
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Users className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-lg font-medium text-foreground">No users found</p>
                <p className="mt-1 text-sm text-muted-foreground">Try searching for a different name or username</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

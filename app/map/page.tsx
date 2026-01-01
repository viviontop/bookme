"use client"

import { useState, useMemo } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, DollarSign, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { MapComponent } from "@/components/map-component"

export default function MapPage() {
  const { user, isLoading } = useAuth()
  const { services, users } = useData()
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)

  // Generate coordinates for services
  const getCoordinates = (location?: string) => {
    if (!location) {
      return {
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lng: -74.006 + (Math.random() - 0.5) * 0.1,
      }
    }

    const locationMap: Record<string, { lat: number; lng: number }> = {
      "New York, NY": { lat: 40.7128, lng: -74.006 },
      "Los Angeles, CA": { lat: 34.0522, lng: -118.2437 },
      "Chicago, IL": { lat: 41.8781, lng: -87.6298 },
      "Miami, FL": { lat: 25.7617, lng: -80.1918 },
      "San Francisco, CA": { lat: 37.7749, lng: -122.4194 },
    }

    return locationMap[location] || { lat: 40.7128, lng: -74.006 }
  }

  const activeServices = services.filter((s) => s.isActive)
  const selectedService = selectedServiceId ? services.find((s) => s.id === selectedServiceId) : null
  const selectedSeller = selectedService ? users.find((u) => u.id === selectedService.sellerId) : null

  const servicesWithCoords = useMemo(() => {
    return activeServices.map((service) => {
      const seller = users.find((u) => u.id === service.sellerId)
      const coords = getCoordinates(seller?.location)
      return {
        ...service,
        seller,
        ...coords,
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeServices, users])

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">Service Map</h1>
          <p className="mt-2 text-sm text-muted-foreground">Browse services by location on the world map</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="h-[40vh] md:h-[600px] overflow-hidden border border-border/60 bg-card shadow-sm">
              <CardContent className="p-0 h-full relative">
                <MapComponent
                  services={servicesWithCoords}
                  onServiceClick={setSelectedServiceId}
                  selectedServiceId={selectedServiceId}
                />
              </CardContent>
            </Card>
          </div>

          {/* Service List */}
          <div className="space-y-4">
            <Card className="bg-card border border-border/60 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Services ({activeServices.length})</CardTitle>
                <CardDescription className="text-xs">Click on map pins or list items</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                  {activeServices.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-muted-foreground">No active services available</p>
                    </div>
                  ) : (
                    activeServices.map((service) => {
                      const seller = users.find((u) => u.id === service.sellerId)
                      return (
                        <button
                          key={service.id}
                          onClick={() => setSelectedServiceId(service.id)}
                          className={`w-full text-left p-3 rounded-lg border transition-all duration-300 ${selectedServiceId === service.id
                              ? "border-primary/40 bg-primary/5 shadow-md"
                              : "border-border/40 bg-card/50 hover:bg-accent/50 hover:border-border/60 hover:shadow-sm"
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage src={seller?.avatar || "/placeholder.svg"} alt={seller?.firstName || "Seller"} />
                              <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                                {seller?.firstName?.[0] || "S"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">{service.title}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {seller?.firstName} {seller?.lastName}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  ${service.price}
                                </Badge>
                                {seller?.location && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {seller.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Selected Service Details */}
            {selectedService && selectedSeller && (
              <Card className="bg-card border border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold">Service Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedService.images[0] && (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-border/40 shadow-sm">
                      <Image
                        src={selectedService.images[0]}
                        alt={selectedService.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground text-base">{selectedService.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{selectedService.description}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground">${selectedService.price}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{selectedService.duration} min</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-3 border-t border-border/40">
                    <Avatar className="h-10 w-10 ring-2 ring-border/40">
                      <AvatarImage src={selectedSeller.avatar || "/placeholder.svg"} alt={selectedSeller.firstName} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {selectedSeller.firstName[0]}
                        {selectedSeller.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-foreground">
                        {selectedSeller.firstName} {selectedSeller.lastName}
                      </p>
                      {selectedSeller.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {selectedSeller.location}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Link href={`/profile/${selectedSeller.username || selectedSeller.id}`} className="flex-1">
                      <Button
                        variant="outline"
                        className="w-full"
                      >
                        View Profile
                      </Button>
                    </Link>
                    <Link href={`/profile/${selectedSeller.username || selectedSeller.id}`} className="flex-1">
                      <Button className="w-full">
                        Book Now
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

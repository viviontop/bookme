"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import type { Service, User } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

// Import Leaflet CSS - will be handled by Next.js

interface MapComponentProps {
  services: Array<Service & { seller?: User; lat: number; lng: number }>
  onServiceClick: (serviceId: string) => void
  selectedServiceId?: string | null
}

// Dynamic import of MapContainer to avoid SSR issues - import Leaflet inside
const DynamicMapContainer = dynamic(
  () => {
    return Promise.all([
      import("react-leaflet"),
      import("leaflet")
    ]).then(([reactLeaflet, L]) => {
      // Fix for default marker icons in Next.js - only run on client
      if (globalThis.window !== undefined) {
        delete (L.default.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        })
      }

      const { MapContainer, TileLayer, Marker, Popup, useMap } = reactLeaflet

      function MapBounds({ services }: { services: Array<{ lat: number; lng: number }> }) {
        const map = useMap()

        useEffect(() => {
          if (services.length === 0) {
            map.setView([20, 0], 2) // Show entire world
            return
          }

          if (services.length === 1) {
            map.setView([services[0].lat, services[0].lng], 10)
            return
          }

          const bounds = L.default.latLngBounds(services.map((s) => [s.lat, s.lng] as [number, number]))
          map.fitBounds(bounds, { padding: [50, 50] })
        }, [services, map])

        return null
      }

      function LocationButton() {
        const map = useMap()
        let isLocating = false

        useEffect(() => {
          const handleLocationClick = () => {
            if (!navigator.geolocation) {
              alert("Geolocation is not supported by your browser")
              return
            }

            isLocating = true
            updateButton()

            navigator.geolocation.getCurrentPosition(
              (position) => {
                const { latitude, longitude } = position.coords
                map.setView([latitude, longitude], 13)
                
                // Add a marker for user's location
                const userIcon = L.default.divIcon({
                  className: "user-location-marker",
                  html: `
                    <div style="
                      background-color: #6366f1;
                      width: 32px;
                      height: 32px;
                      border-radius: 50%;
                      border: 4px solid white;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                    ">
                      <div style="
                        background-color: #6366f1;
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                      "></div>
                    </div>
                  `,
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                })

                // Remove existing user location marker if any
                const existingMarker = (map as unknown as { _userLocationMarker?: typeof L.default.Marker.prototype })._userLocationMarker
                if (existingMarker) {
                  map.removeLayer(existingMarker)
                }

                const marker = L.default.marker([latitude, longitude], { icon: userIcon }).addTo(map)
                ;(map as unknown as { _userLocationMarker?: typeof L.default.Marker.prototype })._userLocationMarker = marker

                isLocating = false
                updateButton()
              },
              (error) => {
                isLocating = false
                updateButton()
                let message = "Error getting your location: "
                switch (error.code) {
                  case error.PERMISSION_DENIED:
                    message += "Permission denied. Please allow location access."
                    break
                  case error.POSITION_UNAVAILABLE:
                    message += "Location information unavailable."
                    break
                  case error.TIMEOUT:
                    message += "Location request timed out."
                    break
                  default:
                    message += "An unknown error occurred."
                    break
                }
                alert(message)
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
              }
            )
          }

          // Create custom control container
          const controlContainer = L.default.DomUtil.create("div", "leaflet-control leaflet-bar")
          controlContainer.style.marginTop = "10px"
          controlContainer.style.marginRight = "10px"

          const button = L.default.DomUtil.create("button", "leaflet-control-locate", controlContainer)
          button.title = "Show my location"
          button.style.cssText = `
            background-color: white;
            border: 1px solid rgba(0,0,0,0.15);
            border-radius: 6px;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          `

          const updateButton = () => {
            if (isLocating) {
              button.innerHTML = `
                <div style="
                  width: 18px;
                  height: 18px;
                  border: 2px solid #6366f1;
                  border-top: 2px solid transparent;
                  border-radius: 50%;
                  animation: spin 1s linear infinite;
                "></div>
              `
              button.style.cursor = "wait"
            } else {
              button.innerHTML = `
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #6366f1; width: 18px; height: 18px;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              `
              button.style.cursor = "pointer"
            }
          }

          updateButton()

          L.default.DomEvent.on(button, "click", (e) => {
            L.default.DomEvent.stopPropagation(e)
            L.default.DomEvent.preventDefault(e)
            handleLocationClick()
          })

          L.default.DomEvent.on(button, "mouseenter", () => {
            if (!isLocating) {
              button.style.backgroundColor = "#f5f5f5"
              button.style.transform = "translateY(-1px)"
              button.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)"
            }
          })

          L.default.DomEvent.on(button, "mouseleave", () => {
            button.style.backgroundColor = "white"
            button.style.transform = "translateY(0)"
            button.style.boxShadow = "0 1px 3px rgba(0,0,0,0.1)"
          })

          const control = new L.default.Control({ position: "topright" })
          control.onAdd = () => controlContainer
          control.addTo(map)

          return () => {
            map.removeControl(control)
          }
        }, [map])

        return null
      }

      return function MapWrapper({
        services,
        onServiceClick,
        selectedServiceId,
      }: MapComponentProps) {
        // Create custom icon for markers
        const createCustomIcon = (isSelected: boolean) => {
          return L.default.divIcon({
            className: "custom-marker",
            html: `
              <div style="
                background-color: ${isSelected ? "#6366f1" : "#ef4444"};
                width: 28px;
                height: 28px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 3px solid white;
                box-shadow: 0 3px 10px rgba(0,0,0,0.4);
                transition: all 0.3s ease;
                cursor: pointer;
              ">
                <div style="
                  transform: rotate(45deg);
                  width: 100%;
                  height: 100%;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "></div>
              </div>
            `,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
          })
        }

        return (
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            className="rounded-lg"
            scrollWheelZoom={true}
          >
            {/* Light/White theme tile layer */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapBounds services={services} />
            <LocationButton />
            {services.map((service) => {
              const isSelected = selectedServiceId === service.id
              return (
                <Marker
                  key={service.id}
                  position={[service.lat, service.lng]}
                  icon={createCustomIcon(isSelected)}
                  eventHandlers={{
                    click: () => {
                      onServiceClick(service.id)
                    },
                  }}
                >
                  <Popup className="custom-popup" closeButton={true}>
                    <Card className="w-64 border-0 shadow-lg bg-card">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{service.title}</CardTitle>
                        <CardDescription className="text-xs">
                          {service.seller?.firstName} {service.seller?.lastName}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-medium">${service.price}</span>
                          {service.seller?.location && (
                            <span className="text-muted-foreground">{service.seller.location}</span>
                          )}
                        </div>
                        <Link href={`/profile/${service.seller?.username || service.sellerId}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-7 text-xs transition-all duration-200 hover:bg-muted hover:scale-[1.02]"
                          >
                            View Profile
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        )
      }
    })
  },
  { ssr: false }
)

export function MapComponent(props: Readonly<MapComponentProps>) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return <DynamicMapContainer {...props} />
}

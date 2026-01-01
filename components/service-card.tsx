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
import { Star, Clock, MapPin, Shield, X, ChevronLeft, ChevronRight, Trash, Flag, Calendar, Sparkles } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import { motion, AnimatePresence } from "framer-motion"
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
    <div className={`flex items-center gap-3 ${className}`}>
      <Link href={`/profile/${seller.username || seller.id}`} onClick={(e) => e.stopPropagation()}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          <Avatar className="h-10 w-10 border-2 border-background shadow-sm cursor-pointer ring-1 ring-border/50">
            <AvatarImage src={seller.avatar || "/placeholder.svg"} alt={seller.firstName} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {seller.firstName[0]}
              {seller.lastName[0]}
            </AvatarFallback>
          </Avatar>
        </motion.div>
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/profile/${seller.username || seller.id}`} onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col">
            <p className="truncate text-sm font-semibold text-foreground cursor-pointer hover:text-primary transition-colors leading-tight">
              {seller.firstName} {seller.lastName}
            </p>
            <p className="truncate text-[11px] text-muted-foreground/80 cursor-pointer">
              @{seller.username || "username"}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
          {rating > 0 ? (
            <span className="flex items-center gap-0.5 font-medium">
              <Star className="h-2.5 w-2.5 fill-yellow-500 text-yellow-500" />
              {rating}
              <span className="opacity-60">({count})</span>
            </span>
          ) : (
            <span className="text-primary/70 font-medium">New</span>
          )}
          {seller.isVerified && (
            <span className="flex items-center gap-0.5 text-primary/80">
              <Shield className="h-2.5 w-2.5" />
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
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] cursor-pointer border-border/40 bg-card/50 backdrop-blur-sm">
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
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Glass Overlays */}
              <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full opacity-0 shadow-xl transition-all duration-300 hover:scale-110 group-hover:opacity-90 disabled:opacity-0 bg-white/20 backdrop-blur-md border-white/30 text-white"
                    onClick={(e) => handlePrev(e, feedEmblaApi)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full opacity-0 shadow-xl transition-all duration-300 hover:scale-110 group-hover:opacity-90 disabled:opacity-0 bg-white/20 backdrop-blur-md border-white/30 text-white"
                    onClick={(e) => handleNext(e, feedEmblaApi)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 pointer-events-none">
                    {images.map((_, i) => (
                      <div key={i} className="h-1 w-3 rounded-full bg-white/40 shadow-sm transition-all duration-300 group-hover:bg-white/70" />
                    ))}
                  </div>
                </>
              )}

              <div className="absolute right-3 top-3 pointer-events-none">
                <div className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-sm font-bold shadow-xl">
                  ${service.price}
                </div>
              </div>
            </div>

            <CardContent className="p-4 pt-4">
              <div className="space-y-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">
                    {service.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/90 leading-relaxed font-medium">
                    {service.description}
                  </p>
                </div>

                <div className="pt-1 border-t border-border/50">
                  <SellerInfo />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
                    <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full border border-border/30">
                      <Clock className="h-3 w-3" />
                      {service.duration}m
                    </span>
                    {seller.location && (
                      <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-full border border-border/30">
                        <MapPin className="h-3 w-3" />
                        {seller.location.split(',')[0]}
                      </span>
                    )}
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0 uppercase tracking-wider bg-primary/5 text-primary border-primary/10">
                    {service.category}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </DialogTrigger>

      {/* Service Detail Modal - Clean & Wide */}
      <DialogContent className="max-w-[98vw] md:max-w-7xl h-[98vh] md:h-[85vh] p-0 overflow-hidden gap-0 bg-background/80 backdrop-blur-xl border-white/20 shadow-2xl flex flex-col md:grid md:grid-cols-5">
        <DialogTitle className="sr-only">{service.title}</DialogTitle>

        {/* Left: Image Carousel (3/5 width on desktop, top on mobile) */}
        <div className="h-[40vh] md:h-full md:col-span-3 relative bg-black/40 overflow-hidden group/modal shrink-0">
          <div className="h-full w-full" ref={modalEmblaRef}>
            <div className="flex h-full w-full">
              {images.map((img, index) => (
                <div className="flex-[0_0_100%] min-w-0 relative h-full flex items-center justify-center" key={index}>
                  <Image
                    src={img}
                    alt={`${service.title} - ${index + 1}`}
                    fill
                    className="object-cover md:object-contain"
                    priority={index === 0}
                  />
                  {/* Artistic gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Overlay */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 border border-white/20 opacity-0 group-hover/modal:opacity-100 transition-all duration-300"
                onClick={(e) => handlePrev(e, modalEmblaApi)}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 backdrop-blur-xl text-white hover:bg-white/20 border border-white/20 opacity-0 group-hover/modal:opacity-100 transition-all duration-300"
                onClick={(e) => handleNext(e, modalEmblaApi)}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>

              {/* Progress Indicators */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    className="h-1.5 w-6 rounded-full bg-white/30 hover:bg-white/60 transition-all duration-300 cursor-pointer overflow-hidden relative"
                    onClick={(e) => {
                      e.stopPropagation()
                      modalEmblaApi?.scrollTo(i)
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* Floating Badges */}
          <div className="absolute top-6 left-6 flex gap-2">
            <Badge className="bg-white/20 backdrop-blur-xl border border-white/30 text-white font-bold px-4 py-1.5">
              {service.category}
            </Badge>
          </div>
        </div>

        {/* Right: Details (2/5 width) */}
        <div className="md:col-span-2 flex flex-col flex-1 h-full bg-card/30 backdrop-blur-md border-l border-border/50 relative overflow-hidden">
          <div className="absolute top-4 right-4 z-50">
            <DialogTrigger asChild>
              <button className="h-10 w-10 rounded-full bg-muted/50 hover:bg-muted transition-colors flex items-center justify-center">
                <X className="h-5 w-5" />
              </button>
            </DialogTrigger>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar pt-6 md:pt-12">
            <div className="px-6 md:px-8 pb-10 space-y-6 md:space-y-8">
              {/* Header Section */}
              <div className="space-y-3 md:space-y-4">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight md:leading-[0.9] text-foreground">
                  {service.title}
                </h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-black text-primary">${service.price}</span>
                  <span className="text-muted-foreground font-medium uppercase tracking-tighter text-xs md:sm">/ session</span>
                </div>
              </div>

              {/* Seller Profile Card */}
              <div className="p-4 md:p-6 rounded-2xl md:rounded-3xl bg-muted/30 border border-border/40 backdrop-blur-sm group/profile overflow-hidden relative transition-all hover:bg-muted/50">
                <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover/profile:bg-primary/20 transition-all duration-700" />
                <div className="relative z-10">
                  <SellerInfo />
                  <div className="mt-4 flex items-center gap-3 md:gap-4 text-[10px] md:text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1.2 md:gap-1.5"><Calendar className="h-3 md:h-3.5 w-3 md:w-3.5" /> Established 2024</span>
                    <span className="flex items-center gap-1.2 md:gap-1.5 text-primary"><Shield className="h-3 md:h-3.5 w-3 md:w-3.5" /> Identity Verified</span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-muted/20 border border-border/30 flex flex-col gap-0.5 md:gap-1">
                  <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Duration</span>
                  <div className="flex items-center gap-1.5 md:gap-2 text-foreground font-semibold text-sm md:text-base">
                    <Clock className="h-3.5 md:h-4 w-3.5 md:w-4 text-primary" />
                    {service.duration}m
                  </div>
                </div>
                <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-muted/20 border border-border/30 flex flex-col gap-0.5 md:gap-1">
                  <span className="text-[9px] md:text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Location</span>
                  <div className="flex items-center gap-1.5 md:gap-2 text-foreground font-semibold text-sm md:text-base">
                    <MapPin className="h-3.5 md:h-4 w-3.5 md:w-4 text-primary" />
                    {seller.location?.split(',')[0] || "Remote"}
                  </div>
                </div>
              </div>

              {/* Description */}
              {service.description && (
                <div className="space-y-3">
                  <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-2">
                    <div className="h-6 w-1 bg-primary rounded-full" />
                    Experience Details
                  </h3>
                  <p className="text-muted-foreground leading-relaxed font-medium">
                    {service.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-6 md:p-8 md:pb-10 border-t border-border/40 bg-card/60 backdrop-blur-3xl">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 md:h-16 rounded-xl md:rounded-2xl border-2 text-base md:text-lg font-bold transition-all hover:bg-muted active:scale-95"
                onClick={() => router.push(`/profile/${seller.username || seller.id}`)}
              >
                View Profile
              </Button>
              <Button
                className="flex-1 h-12 md:h-16 rounded-xl md:rounded-2xl text-base md:text-lg font-black shadow-[0_10px_30px_-10px_rgba(var(--primary),0.5)] transition-all hover:translate-y-[-2px] hover:shadow-[0_15px_35px_-10px_rgba(var(--primary),0.6)] active:scale-95"
              >
                Book Now
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

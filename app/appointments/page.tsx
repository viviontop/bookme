"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { seedDemoData } from "@/lib/seed-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, MapPin, Star, Check, X, MessageCircle, CreditCard, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { PaymentDialog } from "@/components/payment-dialog"

export default function AppointmentsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const { appointments, services, users, updateAppointment, addReview } = useData()
  const router = useRouter()

  const [showReviewDialog, setShowReviewDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null)
  const [paymentAppointment, setPaymentAppointment] = useState<string | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState("")

  useEffect(() => {
    seedDemoData()
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [authLoading, user, router])

  const myAppointments = useMemo(() => {
    if (!user) return []
    const filtered = appointments.filter((a) => (user.role === "buyer" ? a.buyerId === user.id : a.sellerId === user.id))
    return filtered.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
  }, [appointments, user])

  const pendingAppointments = myAppointments.filter((a) => a.status === "pending")
  const approvedAppointments = myAppointments.filter((a) => a.status === "approved")
  const confirmedAppointments = myAppointments.filter((a) => a.status === "confirmed" || a.status === "paid")
  const pastAppointments = myAppointments.filter((a) => a.status === "completed" || a.status === "cancelled" || a.status === "rejected")

  const handleAccept = (id: string) => {
    updateAppointment(id, { status: "confirmed" })
  }

  const handleDecline = (id: string) => {
    updateAppointment(id, { status: "cancelled" })
  }

  const handleComplete = (id: string) => {
    updateAppointment(id, { status: "completed" })
  }

  const openReviewDialog = (appointmentId: string) => {
    setSelectedAppointment(appointmentId)
    setReviewRating(5)
    setReviewComment("")
    setShowReviewDialog(true)
  }

  const submitReview = () => {
    if (!user || !selectedAppointment) return

    const appointment = appointments.find((a) => a.id === selectedAppointment)
    if (!appointment) return

    const revieweeId = user.role === "buyer" ? appointment.sellerId : appointment.buyerId

    addReview({
      appointmentId: selectedAppointment,
      reviewerId: user.id,
      revieweeId,
      rating: reviewRating,
      comment: reviewComment,
    })

    setShowReviewDialog(false)
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Debug: Log appointments for troubleshooting
  if (globalThis.window !== undefined && process.env.NODE_ENV === "development") {
    console.log("All appointments:", appointments)
    console.log("My appointments:", myAppointments)
    console.log("User:", user)
    console.log("Pending:", pendingAppointments)
    console.log("Approved:", approvedAppointments)
    console.log("Confirmed:", confirmedAppointments)
    console.log("LocalStorage appointments:", localStorage.getItem("appointments"))
  }

  const AppointmentCard = ({
    appointment,
    showActions = false,
  }: {
    appointment: (typeof myAppointments)[0]
    showActions?: boolean
  }) => {
    const service = services.find((s) => s.id === appointment.serviceId)
    const otherUser = users.find((u) => u.id === (user.role === "buyer" ? appointment.sellerId : appointment.buyerId))

    const statusColors = {
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      approved: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      rejected: "bg-destructive/10 text-destructive border-destructive/20",
      paid: "bg-primary/10 text-primary border-primary/20",
      confirmed: "bg-primary/10 text-primary border-primary/20",
      completed: "bg-green-500/10 text-green-600 border-green-500/20",
      cancelled: "bg-destructive/10 text-destructive border-destructive/20",
    }

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href={`/profile/${otherUser?.id}`} className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={otherUser?.avatar || "/placeholder.svg"} alt={otherUser?.firstName} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {otherUser?.firstName?.[0]}
                  {otherUser?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">
                  {otherUser?.firstName} {otherUser?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{service?.title}</p>
              </div>
            </Link>

            <div className="flex flex-1 flex-wrap items-center gap-3 text-sm text-muted-foreground sm:justify-center">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(appointment.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {appointment.time}
              </span>
              {otherUser?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {otherUser.location}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn("capitalize", statusColors[appointment.status])}>
                {appointment.status}
              </Badge>

              {(appointment.status === "approved" || appointment.status === "pending") && user.role === "buyer" && service && (
                <Button
                  size="sm"
                  onClick={() => {
                    setPaymentAppointment(appointment.id)
                    setShowPaymentDialog(true)
                  }}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  PAY ${service.price.toFixed(2)}
                </Button>
              )}

              {showActions && appointment.status === "pending" && user.role === "seller" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-transparent"
                    onClick={() => handleDecline(appointment.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={() => handleAccept(appointment.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                </>
              )}

              {showActions && appointment.status === "confirmed" && user.role === "seller" && (
                <Button size="sm" onClick={() => handleComplete(appointment.id)}>
                  Complete
                </Button>
              )}

              {appointment.status === "completed" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent"
                  onClick={() => openReviewDialog(appointment.id)}
                >
                  <Star className="mr-1 h-4 w-4" />
                  Review
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
            <p className="mt-1 text-muted-foreground">
              {user.role === "buyer" ? "Manage your bookings" : "Manage your client appointments"}
            </p>
          </div>
          {user.role === "buyer" && (
            <Link href="/search">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Book Appointment
              </Button>
            </Link>
          )}
          {user.role === "seller" && (
            <Link href="/appointments/seller">
              <Button variant="outline">
                Manage Requests
              </Button>
            </Link>
          )}
        </div>

        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">
              Upcoming
              {confirmedAppointments.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 rounded-full px-1.5">
                  {confirmedAppointments.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending
              {pendingAppointments.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 rounded-full px-1.5">
                  {pendingAppointments.length}
                </Badge>
              )}
            </TabsTrigger>
            {user.role === "buyer" && approvedAppointments.length > 0 && (
              <TabsTrigger value="approved">
                Payment Required
                <Badge variant="secondary" className="ml-2 h-5 min-w-5 rounded-full px-1.5">
                  {approvedAppointments.length}
                </Badge>
              </TabsTrigger>
            )}
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6 space-y-4">
            {confirmedAppointments.length > 0 ? (
              confirmedAppointments.map((apt) => <AppointmentCard key={apt.id} appointment={apt} showActions />)
            ) : (
              <div className="py-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No upcoming appointments</p>
                {user.role === "buyer" && (
                  <Link href="/search">
                    <Button variant="link">Find services to book</Button>
                  </Link>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-6 space-y-4">
            {pendingAppointments.length > 0 ? (
              pendingAppointments.map((apt) => <AppointmentCard key={apt.id} appointment={apt} showActions />)
            ) : (
              <div className="py-12 text-center">
                <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No pending requests</p>
              </div>
            )}
          </TabsContent>

          {user.role === "buyer" && (
            <TabsContent value="approved" className="mt-6 space-y-4">
              {approvedAppointments.length > 0 ? (
                approvedAppointments.map((apt) => <AppointmentCard key={apt.id} appointment={apt} showActions />)
              ) : (
                <div className="py-12 text-center">
                  <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">No payments required</p>
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="past" className="mt-6 space-y-4">
            {pastAppointments.length > 0 ? (
              pastAppointments.map((apt) => <AppointmentCard key={apt.id} appointment={apt} />)
            ) : (
              <div className="py-12 text-center">
                <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">No past appointments</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              Share your experience with this {user?.role === "buyer" ? "provider" : "client"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button key={i} type="button" onClick={() => setReviewRating(i + 1)}>
                    <Star
                      className={cn(
                        "h-8 w-8 transition-colors",
                        i < reviewRating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground/30",
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                placeholder="Share your experience..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="bg-transparent" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitReview} disabled={!reviewComment.trim()}>
              Submit Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      {paymentAppointment && (() => {
        const appointment = appointments.find((a) => a.id === paymentAppointment)
        if (!appointment) return null
        const service = services.find((s) => s.id === appointment.serviceId)
        const seller = users.find((u) => u.id === appointment.sellerId)
        if (!service || !seller) return null

        return (
          <PaymentDialog
            open={showPaymentDialog}
            onOpenChange={setShowPaymentDialog}
            appointment={appointment}
            service={service}
            seller={seller}
          />
        )
      })()}
    </div>
  )
}

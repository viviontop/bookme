"use client"

import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { AppointmentCard } from "./appointment-card"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AvailabilityManager } from "@/components/availability-manager"
import { Calendar, Settings } from "lucide-react"

export default function SellerAppointmentsPage() {
  const { user } = useAuth()
  const { appointments, services, users, updateAppointment } = useData()

  if (!user?.role || user.role !== "seller") {
    return (
      <div className="container mx-auto py-8">
        <p className="text-muted-foreground">You must be a seller to view this page.</p>
      </div>
    )
  }

  const sellerAppointments = appointments
    .filter((a) => a.sellerId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const pendingAppointments = sellerAppointments.filter((a) => a.status === "pending")
  const approvedAppointments = sellerAppointments.filter((a) => a.status === "approved")
  const otherAppointments = sellerAppointments.filter(
    (a) => !["pending", "approved"].includes(a.status),
  )

  const handleApprove = (appointmentId: string) => {
    updateAppointment(appointmentId, "approved")
  }

  const handleReject = (appointmentId: string) => {
    updateAppointment(appointmentId, "rejected")
  }


  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-foreground tracking-tight italic uppercase">Seller Dashboard</h1>
        <p className="text-muted-foreground mt-2 font-medium">Manage your bookings and availability program</p>
      </div>

      <Tabs defaultValue="appointments" className="space-y-8">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="appointments" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Calendar className="h-4 w-4" />
            Appointments
          </TabsTrigger>
          <TabsTrigger value="availability" className="gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Settings className="h-4 w-4" />
            Booking Program
          </TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {pendingAppointments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                Pending Approval
                <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{pendingAppointments.length}</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {pendingAppointments.map((appointment) => {
                  const service = services.find((s) => s.id === appointment.serviceId)
                  const buyer = users.find((u) => u.id === appointment.buyerId)
                  if (!service || !buyer) return null
                  return (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      service={service}
                      buyer={buyer}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {approvedAppointments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-muted-foreground">
                Approved - Awaiting Payment
                <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">{approvedAppointments.length}</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 opacity-80">
                {approvedAppointments.map((appointment) => {
                  const service = services.find((s) => s.id === appointment.serviceId)
                  const buyer = users.find((u) => u.id === appointment.buyerId)
                  if (!service || !buyer) return null
                  return (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      service={service}
                      buyer={buyer}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {otherAppointments.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-muted-foreground opacity-60">History</h2>
              <div className="grid gap-4 md:grid-cols-2 opacity-60">
                {otherAppointments.map((appointment) => {
                  const service = services.find((s) => s.id === appointment.serviceId)
                  const buyer = users.find((u) => u.id === appointment.buyerId)
                  if (!service || !buyer) return null
                  return (
                    <AppointmentCard
                      key={appointment.id}
                      appointment={appointment}
                      service={service}
                      buyer={buyer}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {sellerAppointments.length === 0 && (
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
              <CardContent className="py-20 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No appointments yet. Share your profile to get bookings!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="availability" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <AvailabilityManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}


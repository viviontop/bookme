"use client"

import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Card, CardContent } from "@/components/ui/card"
import { AppointmentCard } from "./appointment-card"

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
    updateAppointment(appointmentId, {
      status: "approved",
      approvedAt: new Date().toISOString(),
    })
  }

  const handleReject = (appointmentId: string) => {
    updateAppointment(appointmentId, {
      status: "rejected",
      rejectedAt: new Date().toISOString(),
    })
  }


  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">My Appointments</h1>
        <p className="text-muted-foreground mt-2">Manage your appointment requests</p>
      </div>

      {pendingAppointments.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Pending Approval ({pendingAppointments.length})</h2>
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
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Approved - Awaiting Payment ({approvedAppointments.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">
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
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">Other Appointments ({otherAppointments.length})</h2>
          <div className="grid gap-4 md:grid-cols-2">
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
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No appointments yet</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


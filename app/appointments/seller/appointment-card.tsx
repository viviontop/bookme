"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, X, Clock, Calendar, User } from "lucide-react"
import { format } from "date-fns"
import type { Appointment, Service, User as UserType } from "@/lib/types"

interface AppointmentCardProps {
  appointment: Appointment
  service: Service
  buyer: UserType
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export function AppointmentCard({ appointment, service, buyer, onApprove, onReject }: AppointmentCardProps) {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      approved: "secondary",
      rejected: "destructive",
      paid: "default",
      confirmed: "default",
      completed: "default",
      cancelled: "destructive",
    }

    return <Badge variant={variants[status] || "outline"}>{status.toUpperCase()}</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={buyer.avatar || "/placeholder.svg"} alt={buyer.firstName} />
              <AvatarFallback>
                {buyer.firstName[0]}
                {buyer.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                {buyer.firstName} {buyer.lastName}
              </CardTitle>
              <CardDescription>{buyer.email}</CardDescription>
            </div>
          </div>
          {getStatusBadge(appointment.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <p className="font-medium text-foreground">{service.title}</p>
            <p className="text-sm text-muted-foreground">{service.description}</p>
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(appointment.date), "MMM dd, yyyy")}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {appointment.time}
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              ${service.price}
            </div>
          </div>

          {appointment.status === "pending" && (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onApprove(appointment.id)}
              >
                <Check className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                onClick={() => onReject(appointment.id)}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
          )}

          {appointment.status === "approved" && (
            <p className="text-sm text-muted-foreground">
              Waiting for buyer to complete payment...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}


"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import type { Service, User } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Clock, DollarSign, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
]

interface BookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: Service
  seller: User
}

export function BookingDialog({ open, onOpenChange, service, seller }: BookingDialogProps) {
  const { user } = useAuth()
  const { createAppointment, appointments } = useData()

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isBooked, setIsBooked] = useState(false)

  const handleBook = () => {
    if (!user || !selectedDate || !selectedTime) return

    // Calculate payment amounts (97.5% to seller, 2.5% platform fee)
    const amount = service.price
    const platformFee = amount * 0.025
    const sellerEarnings = amount * 0.975

    createAppointment({
      buyerId: user.id,
      sellerId: seller.id,
      serviceId: service.id,
      date: selectedDate.toISOString().split("T")[0],
      time: selectedTime,
      status: "confirmed", // Auto-confirm and process payment
      amount,
      sellerEarnings,
      platformFee,
      paidAt: new Date().toISOString(),
    })

    setIsBooked(true)
  }

  const handleClose = () => {
    setSelectedDate(undefined)
    setSelectedTime(null)
    setIsBooked(false)
    onOpenChange(false)
  }

  // Get booked slots for the selected date
  const bookedSlots = selectedDate
    ? appointments
        .filter(
          (a) =>
            a.sellerId === seller.id && a.date === selectedDate.toISOString().split("T")[0] && a.status !== "cancelled",
        )
        .map((a) => a.time)
    : []

  if (isBooked) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">Booking Confirmed!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your appointment has been confirmed and payment has been processed. You&apos;re all set!
            </p>
            <div className="mt-6 rounded-lg bg-muted p-4 text-left">
              <p className="text-sm font-medium text-foreground">{service.title}</p>
              <p className="text-sm text-muted-foreground">
                {selectedDate?.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}{" "}
                at {selectedTime}
              </p>
            </div>
            <Button className="mt-6 w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Book Appointment</DialogTitle>
          <DialogDescription>Select a date and time for your appointment</DialogDescription>
        </DialogHeader>

        {/* Service Info */}
        <div className="flex items-center gap-3 rounded-lg bg-muted p-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={seller.avatar || "/placeholder.svg"} alt={seller.firstName} />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {seller.firstName[0]}
              {seller.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-foreground">{service.title}</p>
            <p className="text-sm text-muted-foreground">
              with {seller.firstName} {seller.lastName}
            </p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="mb-1">
              <DollarSign className="mr-1 h-3 w-3" />
              {service.price}
            </Badge>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {service.duration} min
            </p>
          </div>
        </div>

        {/* Date Selection */}
        <div className="space-y-3">
          <Label>Select Date</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date() || date.getDay() === 0}
            className="rounded-md border"
          />
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div className="space-y-3">
            <Label>Select Time</Label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((time) => {
                const isBooked = bookedSlots.includes(time)
                return (
                  <Button
                    key={time}
                    variant={selectedTime === time ? "default" : "outline"}
                    size="sm"
                    disabled={isBooked}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      isBooked && "cursor-not-allowed opacity-50",
                      selectedTime !== time && "bg-transparent",
                    )}
                  >
                    {time}
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" className="flex-1 bg-transparent" onClick={handleClose}>
            Cancel
          </Button>
          <Button className="flex-1" disabled={!selectedDate || !selectedTime} onClick={handleBook}>
            Request Booking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

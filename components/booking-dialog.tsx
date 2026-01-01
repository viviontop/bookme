"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  const { createAppointment, appointments, fetchSellerAvailability } = useData()
  const router = useRouter()

  useEffect(() => {
    if (open && seller?.id) {
      fetchSellerAvailability(seller.id)
    }
  }, [open, seller?.id, fetchSellerAvailability])

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [isBooked, setIsBooked] = useState(false)

  const handleBook = () => {
    if (!user || !selectedDate || !selectedTime) return

    // Create appointment with pending status
    createAppointment({
      buyerId: user.id,
      sellerId: seller.id,
      serviceId: service.id,
      date: selectedDate.toISOString().split("T")[0],
      time: selectedTime,
    })

    setIsBooked(true)
    // Redirect to appointments page after a short delay
    setTimeout(() => {
      handleClose()
      router.push("/appointments")
    }, 1500)
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
          a.sellerId === seller.id && a.date === selectedDate.toISOString().split("T")[0] && a.status !== "cancelled" && a.status !== "rejected",
      )
      .map((a) => a.time)
    : []

  const { availability } = useData()
  const sellerAvail = availability.filter(a => a.sellerId === seller.id)

  // If seller has no availability settings at all, use a default schedule for now
  const hasDefinedSchedule = sellerAvail.length > 0

  const currentDayAvail = selectedDate
    ? sellerAvail.find(a => a.dayOfWeek === selectedDate.getDay() && a.isActive)
    : null

  const filteredTimeSlots = timeSlots.filter(slot => {
    // If they have no schedule, default to 09:00 - 17:00 for demo purposes
    if (!hasDefinedSchedule) {
      return slot >= "09:00" && slot <= "17:00" && selectedDate?.getDay() !== 0
    }
    if (!currentDayAvail) return false
    return slot >= currentDayAvail.startTime && slot <= currentDayAvail.endTime
  })

  if (isBooked) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">Booking Created!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Redirecting to appointments page to complete payment...
            </p>
            <div className="mt-6 rounded-lg bg-muted p-4 text-left w-full">
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
            disabled={(date) => {
              if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true
              if (!hasDefinedSchedule) return date.getDay() === 0 // Default: No Sundays
              const day = date.getDay()
              return !sellerAvail.some(a => a.dayOfWeek === day && a.isActive)
            }}
            className="rounded-md border shadow-sm"
          />
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div className="space-y-3">
            <Label>Select Time</Label>
            <div className="grid grid-cols-4 gap-2">
              {filteredTimeSlots.length > 0 ? filteredTimeSlots.map((time) => {
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
              }) : (
                <div className="col-span-4 py-4 text-center text-sm text-muted-foreground italic">
                  No slots available for this day.
                </div>
              )}
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

"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import type { Appointment, Service, User } from "@/lib/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Check, Lock } from "lucide-react"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointment: Appointment
  service: Service
  seller: User
}

export function PaymentDialog({ open, onOpenChange, appointment, service, seller }: PaymentDialogProps) {
  const { user } = useAuth()
  const { updateAppointment } = useData()
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvv, setCvv] = useState("")
  const [name, setName] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaid, setIsPaid] = useState(false)

  const handlePayment = async () => {
    if (!cardNumber || !expiry || !cvv || !name) return

    setIsProcessing(true)

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Calculate payment amounts (97.5% to seller, 2.5% platform fee)
    const amount = service.price
    const platformFee = amount * 0.025
    const sellerEarnings = amount * 0.975

    // Update appointment with payment details
    updateAppointment(appointment.id, {
      status: "paid",
      amount,
      sellerEarnings,
      platformFee,
      paidAt: new Date().toISOString(),
    })

    // After payment, automatically confirm the appointment
    setTimeout(() => {
      updateAppointment(appointment.id, {
        status: "confirmed",
      })
    }, 500)

    setIsProcessing(false)
    setIsPaid(true)
  }

  const handleClose = () => {
    setCardNumber("")
    setExpiry("")
    setCvv("")
    setName("")
    setIsProcessing(false)
    setIsPaid(false)
    onOpenChange(false)
  }

  if (isPaid) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-foreground">Payment Successful!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your appointment has been confirmed. You&apos;re all set!
            </p>
            <div className="mt-6 rounded-lg bg-muted p-4 text-left w-full">
              <p className="text-sm font-medium text-foreground">{service.title}</p>
              <p className="text-sm text-muted-foreground">
                with {seller.firstName} {seller.lastName}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Amount paid: ${service.price.toFixed(2)}
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
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Pay for your approved appointment with {seller.firstName} {seller.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Service Info */}
          <div className="rounded-lg bg-muted p-4">
            <p className="font-medium text-foreground">{service.title}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(appointment.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}{" "}
              at {appointment.time}
            </p>
            <p className="text-2xl font-bold text-foreground mt-2">${service.price.toFixed(2)}</p>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input
                id="cardName"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s/g, "")
                  if (value.length <= 16 && /^\d*$/.test(value)) {
                    setCardNumber(value.replace(/(.{4})/g, "$1 ").trim())
                  }
                }}
                maxLength={19}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry">Expiry (MM/YY)</Label>
                <Input
                  id="expiry"
                  placeholder="12/25"
                  value={expiry}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "")
                    if (value.length <= 4) {
                      setExpiry(value.replace(/(.{2})/, "$1/").trim())
                    }
                  }}
                  maxLength={5}
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "")
                    if (value.length <= 3) {
                      setCvv(value)
                    }
                  }}
                  maxLength={3}
                />
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span>Your payment is secure and encrypted</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={!cardNumber || !expiry || !cvv || !name || isProcessing}
              onClick={handlePayment}
            >
              {isProcessing ? (
                "Processing..."
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay ${service.price.toFixed(2)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


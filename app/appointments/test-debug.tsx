"use client"

import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function AppointmentDebug() {
  const { user } = useAuth()
  const { appointments, services, users } = useData()

  if (!user) return null

  const myAppointments = appointments.filter((a) => 
    user.role === "buyer" ? a.buyerId === user.id : a.sellerId === user.id
  )

  return (
    <Card className="mb-4 border-yellow-500">
      <CardContent className="p-4">
        <h3 className="font-bold text-yellow-600 mb-2">Debug Info</h3>
        <p className="text-sm">Total appointments in system: {appointments.length}</p>
        <p className="text-sm">My appointments: {myAppointments.length}</p>
        <p className="text-sm">My user ID: {user.id}</p>
        <p className="text-sm">My role: {user.role}</p>
        <div className="mt-2">
          <p className="text-sm font-semibold">All appointment IDs:</p>
          <ul className="text-xs list-disc list-inside">
            {appointments.map((a) => (
              <li key={a.id}>
                ID: {a.id}, Buyer: {a.buyerId}, Seller: {a.sellerId}, Status: {a.status}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-2">
          <p className="text-sm font-semibold">My appointments:</p>
          <ul className="text-xs list-disc list-inside">
            {myAppointments.map((a) => (
              <li key={a.id}>
                ID: {a.id}, Status: {a.status}, Date: {a.date}, Time: {a.time}
              </li>
            ))}
          </ul>
        </div>
        <Button
          size="sm"
          className="mt-2"
          onClick={() => {
            console.log("All appointments:", appointments)
            console.log("My appointments:", myAppointments)
            console.log("User:", user)
            console.log("LocalStorage:", localStorage.getItem("appointments"))
          }}
        >
          Log to Console
        </Button>
      </CardContent>
    </Card>
  )
}


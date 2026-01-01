"use client"

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react"
import type { Service, Availability, Appointment, Review, User, Notification } from "./types"
import {
  getServices,
  getUsers,
  createService,
  registerUserDB,
  updateUser as updateUserDB,
  getNotifications,
  markNotificationRead,
  createAppointment as createAppointmentDB,
  getAppointments as getAppointmentsDB,
  updateAppointment as updateAppointmentDB,
  getAvailability,
  updateAvailability
} from "@/app/actions"
import { useAuth } from "./auth-context"


interface DataContextType {
  services: Service[]
  availability: Availability[]
  appointments: Appointment[]
  reviews: Review[]
  users: User[]
  notifications: Notification[]
  addService: (service: Omit<Service, "id">) => Promise<{ success: boolean; error?: string }>
  updateService: (id: string, data: Partial<Service>) => void
  deleteService: (id: string) => void
  setAvailability: (avail: Omit<Availability, "id">[]) => Promise<void>
  createAppointment: (appt: any) => Promise<any>
  updateAppointment: (id: string, status: string) => Promise<void>
  addReview: (review: Omit<Review, "id" | "createdAt">) => void
  getSellerRating: (sellerId: string) => { rating: number; count: number }
  getBuyerRating: (buyerId: string) => { rating: number; count: number }
  updateUser: (id: string, data: Partial<User>) => void
  approveKYC: (userId: string) => void
  rejectKYC: (userId: string) => void
  getSellerEarnings: (sellerId: string) => { total: number; monthly: Record<string, number> }
  getTotalSales: () => { total: number; platformFee: number; sellersEarnings: number }
  getUserStats: (userId: string) => { earnings: number; appointments: number; monthlyEarnings: Record<string, number> }
  clearAppointments: () => void
  syncUser: (user: User) => void
  fetchNotifications: () => Promise<void>
  markNotificationAsRead: (id: string) => Promise<void>
  fetchSellerAvailability: (sellerId: string) => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { readonly children: ReactNode }) {
  const [services, setServices] = useState<Service[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [availability, setAvailabilityState] = useState<Availability[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { user } = useAuth()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dbServices, dbUsers] = await Promise.all([getServices(), getUsers()])
        if (dbServices) setServices(dbServices as Service[])
        if (dbUsers) setUsers(dbUsers as User[])

        if (user) {
          const [dbAppts, dbAvail, dbNotifs] = await Promise.all([
            getAppointmentsDB(user.id),
            getAvailability(user.id),
            getNotifications(user.id)
          ])
          setAppointments(dbAppts as any)
          setAvailabilityState(dbAvail as any)
          setNotifications(dbNotifs as any)
        }
      } catch (error) {
        console.error("Failed to load data from DB:", error)
      }

      // Reviews still in local storage for now
      try {
        const storedReviews = localStorage.getItem("reviews")
        if (storedReviews) setReviews(JSON.parse(storedReviews))
      } catch (error) {
        console.error("Error loading reviews from local storage:", error)
      }
    }
    loadData()

    // Poll for notifications every 30 seconds if user is logged in
    let interval: NodeJS.Timeout
    if (user) {
      interval = setInterval(() => {
        fetchNotifications()
      }, 30000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [user])

  const addService = async (service: Omit<Service, "id">) => {
    const res = await createService(service)
    if (res.success && res.service) {
      const newService = {
        ...service,
        id: res.service.id,
        createdAt: res.service.createdAt.toISOString()
      } as Service
      const updated = [newService, ...services]
      setServices(updated)
      return { success: true }
    }
    return { success: false, error: res.error }
  }

  const updateService = (id: string, data: Partial<Service>) => {
    // Placeholder for future server action
    console.log("Update service not implemented yet for DB", id, data)
  }

  const deleteService = (id: string) => {
    // Placeholder for future server action
    console.log("Delete service not implemented yet for DB", id)
  }

  const setAvailabilityData = async (avail: Omit<Availability, "id">[]) => {
    if (!user) return
    const res = await updateAvailability(user.id, avail)
    if (res.success) {
      const dbAvail = await getAvailability(user.id)
      setAvailabilityState(dbAvail as any)
    }
  }

  const createAppointment = async (appt: any) => {
    const res = await createAppointmentDB(appt)
    if (res.success) {
      if (user) {
        const dbAppts = await getAppointmentsDB(user.id)
        setAppointments(dbAppts as any)
      }
      return res.appointment
    }
    return null
  }

  const updateAppointment = async (id: string, status: string) => {
    const res = await updateAppointmentDB(id, status)
    if (res.success && user) {
      const dbAppts = await getAppointmentsDB(user.id)
      setAppointments(dbAppts as any)
    }
  }

  const clearAppointments = () => {
    setAppointments([])
  }

  const fetchNotifications = async () => {
    if (!user) return
    const dbNotifs = await getNotifications(user.id)
    setNotifications(dbNotifs as any)
  }

  const markNotificationAsRead = async (id: string) => {
    const res = await markNotificationRead(id)
    if (res.success) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }
  }

  const fetchSellerAvailability = async (sellerId: string) => {
    const dbAvail = await getAvailability(sellerId)
    setAvailabilityState(prev => {
      const others = prev.filter(a => a.sellerId !== sellerId)
      return [...others, ...(dbAvail as any)]
    })
  }

  const addReview = (review: Omit<Review, "id" | "createdAt">) => {
    const newReview = { ...review, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    const updated = [...reviews, newReview]
    setReviews(updated)
    localStorage.setItem("reviews", JSON.stringify(updated))
  }

  const getSellerRating = (sellerId: string) => {
    const sellerReviews = reviews.filter((r) => r.revieweeId === sellerId)
    if (sellerReviews.length === 0) return { rating: 0, count: 0 }
    const avg = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length
    return { rating: Math.round(avg * 10) / 10, count: sellerReviews.length }
  }

  const getBuyerRating = (buyerId: string) => {
    const buyerReviews = reviews.filter((r) => r.revieweeId === buyerId)
    if (buyerReviews.length === 0) return { rating: 0, count: 0 }
    const avg = buyerReviews.reduce((sum, r) => sum + r.rating, 0) / buyerReviews.length
    return { rating: Math.round(avg * 10) / 10, count: buyerReviews.length }
  }

  const updateUser = async (id: string, data: Partial<User>) => {
    const updated = users.map((u) => (u.id === id ? { ...u, ...data } : u))
    setUsers(updated)
    // Persist to database
    await updateUserDB(id, data)
  }

  const approveKYC = (userId: string) => {
    updateUser(userId, { kycStatus: "verified", isVerified: true })
  }

  const rejectKYC = (userId: string) => {
    updateUser(userId, { kycStatus: "rejected", isVerified: false })
  }

  const getSellerEarnings = (sellerId: string) => {
    const paidAppointments = appointments.filter(
      (a) => a.sellerId === sellerId && (a.status === "confirmed" || a.status === "completed") && a.sellerEarnings
    )
    const total = paidAppointments.reduce((sum, a) => sum + (a.sellerEarnings || 0), 0)

    const monthly: Record<string, number> = {}
    for (const a of paidAppointments) {
      if (a.paidAt) {
        const date = new Date(a.paidAt)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        monthly[monthKey] = (monthly[monthKey] || 0) + (a.sellerEarnings || 0)
      }
    }

    return { total, monthly }
  }

  const getTotalSales = () => {
    const paidAppointments = appointments.filter(
      (a) => (a.status === "confirmed" || a.status === "completed") && a.amount
    )
    const total = paidAppointments.reduce((sum, a) => sum + (a.amount || 0), 0)
    const platformFee = paidAppointments.reduce((sum, a) => sum + (a.platformFee || 0), 0)
    const sellersEarnings = paidAppointments.reduce((sum, a) => sum + (a.sellerEarnings || 0), 0)

    return { total, platformFee, sellersEarnings }
  }

  const getUserStats = (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (user?.role !== "seller") {
      return { earnings: 0, appointments: 0, monthlyEarnings: {} }
    }

    const earningsData = getSellerEarnings(userId)
    const userAppointments = appointments.filter((a) => a.sellerId === userId)

    return {
      earnings: earningsData.total,
      appointments: userAppointments.length,
      monthlyEarnings: earningsData.monthly,
    }
  }

  const syncUser = (user: User) => {
    // This is primarily used by the UserSync component to ensure current user is in the list
    // We can just add it to state if not present
    const exists = users.find((u) => u.id === user.id)
    if (!exists) {
      setUsers(prev => [...prev, user])
    }
    // Also ensuring it's in DB is handled by registerUserDB call in auth-context or here
    // For now, let's trust the auth-flow to do the heavy lifting
  }

  const value = useMemo(
    () => ({
      services,
      availability,
      appointments,
      reviews,
      users,
      notifications,
      addService,
      updateService,
      deleteService,
      setAvailability: setAvailabilityData,
      createAppointment,
      updateAppointment,
      addReview,
      getSellerRating,
      getBuyerRating,
      updateUser,
      approveKYC,
      rejectKYC,
      getSellerEarnings,
      getTotalSales,
      getUserStats,
      clearAppointments,
      syncUser,
      fetchNotifications,
      markNotificationAsRead,
      fetchSellerAvailability,
    }),
    [services, availability, appointments, reviews, users, notifications]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error("useData must be used within DataProvider")
  return context
}

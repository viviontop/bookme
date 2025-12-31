"use client"

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from "react"
import type { Service, Availability, Appointment, Review, User } from "./types"
import { getServices, getUsers, createService, registerUserDB } from "@/app/actions"

interface DataContextType {
  services: Service[]
  availability: Availability[]
  appointments: Appointment[]
  reviews: Review[]
  users: User[]
  addService: (service: Omit<Service, "id">) => Promise<{ success: boolean; error?: string }>
  updateService: (id: string, data: Partial<Service>) => void
  deleteService: (id: string) => void
  setAvailability: (avail: Omit<Availability, "id">[]) => void
  createAppointment: (appt: Omit<Appointment, "id" | "createdAt">) => void
  updateAppointment: (id: string, data: Partial<Appointment>) => void
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
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { readonly children: ReactNode }) {
  const [services, setServices] = useState<Service[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [availability, setAvailabilityState] = useState<Availability[]>([])

  useEffect(() => {
    const loadData = async () => {
      // Load real data from DB
      try {
        const [dbServices, dbUsers] = await Promise.all([getServices(), getUsers()])
        if (dbServices) setServices(dbServices as Service[])
        if (dbUsers) setUsers(dbUsers as User[])
      } catch (error) {
        console.error("Failed to load data from DB:", error)
      }

      // Load local storage for other items for now
      try {
        const storedAppointments = localStorage.getItem("appointments")
        const storedReviews = localStorage.getItem("reviews")
        const storedAvailability = localStorage.getItem("availability")

        if (storedAppointments) setAppointments(JSON.parse(storedAppointments))
        if (storedReviews) setReviews(JSON.parse(storedReviews))
        if (storedAvailability) setAvailabilityState(JSON.parse(storedAvailability))
      } catch (error) {
        console.error("Error loading local storage:", error)
      }
    }
    loadData()
  }, [])

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

  const setAvailabilityData = (avail: Omit<Availability, "id">[]) => {
    const withIds = avail.map((a) => ({ ...a, id: crypto.randomUUID() }))
    setAvailabilityState(withIds)
    localStorage.setItem("availability", JSON.stringify(withIds))
  }

  const createAppointment = (appt: Omit<Appointment, "id" | "createdAt">) => {
    const newAppt = { ...appt, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    const updated = [...appointments, newAppt]
    setAppointments(updated)
    localStorage.setItem("appointments", JSON.stringify(updated))
    return newAppt
  }

  const updateAppointment = (id: string, data: Partial<Appointment>) => {
    const updated = appointments.map((a) => (a.id === id ? { ...a, ...data } : a))
    setAppointments(updated)
    localStorage.setItem("appointments", JSON.stringify(updated))
  }

  const clearAppointments = () => {
    setAppointments([])
    localStorage.setItem("appointments", "[]")
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

  const updateUser = (id: string, data: Partial<User>) => {
    const updated = users.map((u) => (u.id === id ? { ...u, ...data } : u))
    setUsers(updated)
    // We might want to sync this to DB too if it's profile update
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
    }),
    [services, availability, appointments, reviews, users]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) throw new Error("useData must be used within DataProvider")
  return context
}

"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, UserRole } from "./types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

interface RegisterData {
  email: string
  password: string
  role: UserRole
  firstName: string
  lastName: string
  birthDate: string
  phone: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem("currentUser")
    if (stored) {
      setUser(JSON.parse(stored))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const users: User[] = JSON.parse(localStorage.getItem("users") || "[]")
    const found = users.find((u) => u.email === email && u.password === password)
    if (found) {
      setUser(found)
      localStorage.setItem("currentUser", JSON.stringify(found))
      return true
    }
    return false
  }

  const register = async (data: RegisterData): Promise<boolean> => {
    const users: User[] = JSON.parse(localStorage.getItem("users") || "[]")
    if (users.some((u) => u.email === data.email)) {
      return false
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date().toISOString(),
      isVerified: false,
      kycStatus: "pending",
    }

    users.push(newUser)
    localStorage.setItem("users", JSON.stringify(users))
    setUser(newUser)
    localStorage.setItem("currentUser", JSON.stringify(newUser))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("currentUser")
  }

  const updateUser = (data: Partial<User>) => {
    if (!user) return
    const updated = { ...user, ...data }
    setUser(updated)
    localStorage.setItem("currentUser", JSON.stringify(updated))

    const users: User[] = JSON.parse(localStorage.getItem("users") || "[]")
    const idx = users.findIndex((u) => u.id === user.id)
    if (idx >= 0) {
      users[idx] = updated
      localStorage.setItem("users", JSON.stringify(users))
    }
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}

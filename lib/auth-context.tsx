"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, UserRole } from "./types"
import supabase from "./supabaseClient"
import { registerUserDB, getUserById } from "@/app/actions"


interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  updateUser: (data: Partial<User>) => void
}

interface RegisterData {
  email: string
  username: string
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
    let mounted = true

    // Helper to load user with DB profile
    const loadUserWithProfile = async (supabaseUser: any) => {
      if (!mounted) return

      // Fetch the actual user profile from database to get correct role
      const dbUser = await getUserById(supabaseUser.id)

      if (dbUser) {
        // Merge Supabase auth data with DB profile
        setUser({
          ...fromSupabaseUser(supabaseUser),
          role: dbUser.role as UserRole,
          avatar: dbUser.avatar,
          bio: dbUser.bio,
          location: dbUser.location,
          banner: dbUser.banner,
          bannerAspectRatio: dbUser.bannerAspectRatio,
          kycStatus: dbUser.kycStatus as any,
          isVerified: dbUser.isVerified
        })
      } else {
        // Fallback to metadata if DB user not found
        setUser(fromSupabaseUser(supabaseUser))
      }
    }

    // Initialize from Supabase session
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      const session = data.session
      if (session?.user) {
        await loadUserWithProfile(session.user)
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      if (session?.user) {
        await loadUserWithProfile(session.user)
      } else {
        setUser(null)
      }
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const { error, data } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: error.message }

    if (data.user) {
      // Fetch DB profile to get correct role
      const dbUser = await getUserById(data.user.id)
      if (dbUser) {
        setUser({
          ...fromSupabaseUser(data.user),
          role: dbUser.role as UserRole,
          avatar: dbUser.avatar,
          bio: dbUser.bio,
          location: dbUser.location,
          banner: dbUser.banner,
          bannerAspectRatio: dbUser.bannerAspectRatio,
          kycStatus: dbUser.kycStatus as any,
          isVerified: dbUser.isVerified
        })
      } else {
        setUser(fromSupabaseUser(data.user))
      }
    }

    return { success: true }
  }

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    const { email, username, password, role, firstName, lastName, birthDate, phone } = data
    const fullName = `${firstName} ${lastName}`.trim()
    const { error, data: res } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          role,
          firstName,
          lastName,
          full_name: fullName,
          birthDate,
          phone
        },
      },
    })

    if (!error && res.user) {
      // Force sync to DB to ensure username is saved
      const dbResult = await registerUserDB({
        id: res.user.id,
        email,
        username,
        firstName,
        lastName
      })

      if (!dbResult.success) {
        // If DB save fails, we should probably warn the user or fail the registration
        // For now, let's return the error so the UI sees it
        console.error("Failed to save user to DB:", dbResult.error)
        return { success: false, error: "Account created but profile setup failed. Please contact support." }
      }
    }

    if (error) return { success: false, error: error.message || String(error) }
    if (res.user) setUser(fromSupabaseUser(res.user))
    return { success: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const updateUser = (data: Partial<User>) => {
    if (!user) return
    const updated = { ...user, ...data }
    setUser(updated)
    // If you maintain a profile table, you would also persist changes via an API route here
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

function fromSupabaseUser(u: any): User {
  return {
    id: u.id,
    email: u.email ?? "",
    username: u.user_metadata?.username ?? undefined,
    password: "", // never store password client-side
    role: (u.user_metadata?.role as UserRole) || "buyer",
    firstName: u.user_metadata?.firstName ?? "",
    lastName: u.user_metadata?.lastName ?? "",
    birthDate: u.user_metadata?.birthDate ?? "",
    phone: u.user_metadata?.phone ?? "",
    avatar: u.user_metadata?.avatar ?? undefined,
    banner: undefined,
    bannerAspectRatio: undefined,
    bio: u.user_metadata?.bio ?? undefined,
    location: u.user_metadata?.location ?? undefined,
    createdAt: u.created_at ?? new Date().toISOString(),
    isVerified: !!u.email_confirmed_at,
    kycStatus: "pending",
    kycDocuments: undefined,
  }
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error("useAuth must be used within AuthProvider")
  return context
}

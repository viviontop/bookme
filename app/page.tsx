"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { seedDemoData } from "@/lib/seed-data"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, Star, Shield, Users } from "lucide-react"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    seedDemoData()
    if (!isLoading && user) {
      router.push("/feed")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">B</span>
            </div>
            <span className="text-xl font-semibold text-foreground">BookMe</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="px-4 py-20 text-center">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Book appointments with trusted professionals
            </h1>
            <p className="mt-6 text-pretty text-lg text-muted-foreground">
              Connect with verified service providers, browse their portfolios, check availability, and book
              appointments in seconds.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  Browse Services
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border bg-muted/50 px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-center text-3xl font-bold text-foreground">
              Everything you need to book and sell services
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl bg-card p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Easy Booking</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  View real-time availability and book appointments instantly with your preferred provider.
                </p>
              </div>
              <div className="rounded-xl bg-card p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Verified Reviews</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Read honest reviews from real customers to make informed decisions.
                </p>
              </div>
              <div className="rounded-xl bg-card p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">KYC Verified</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  All service providers are identity-verified for your safety and peace of mind.
                </p>
              </div>
              <div className="rounded-xl bg-card p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">Growing Community</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Join thousands of buyers and sellers connecting every day.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card px-4 py-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
          <p>&copy; 2025 BookMe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

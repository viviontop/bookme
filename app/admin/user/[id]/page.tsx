"use client"

import { useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { ArrowLeft, DollarSign, Calendar, TrendingUp } from "lucide-react"
import Link from "next/link"
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts"

export default function UserStatsPage() {
  const { user: currentUser, isLoading } = useAuth()
  const { users, appointments, services, getUserStats } = useData()
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const profileUser = useMemo(() => {
    return users.find((u) => u.id === userId)
  }, [users, userId])

  useEffect(() => {
    if (!isLoading && (!currentUser || currentUser.role !== "admin")) {
      router.push("/feed")
    }
  }, [currentUser, isLoading, router])

  if (isLoading || !currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!profileUser) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    )
  }

  const stats = getUserStats(userId)
  const userAppointments = appointments.filter((a) => a.sellerId === userId)
  const userServices = services.filter((s) => s.sellerId === userId)
  const completedAppointments = userAppointments.filter((a) => a.status === "completed" || a.status === "confirmed")

  // Prepare monthly earnings chart data
  const chartData = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    chartData.push({
      month: monthName,
      earnings: stats.monthlyEarnings[monthKey] || 0,
    })
  }

  const chartConfig = {
    earnings: {
      label: "Earnings",
      color: "#f59e0b", // Bright amber/orange - visible in both themes
    },
  }

  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const thisMonthEarnings = stats.monthlyEarnings[currentMonth] || 0

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {profileUser.firstName} {profileUser.lastName}
            </h1>
            <p className="text-muted-foreground">{profileUser.email}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.earnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${thisMonthEarnings.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.appointments}</div>
              <p className="text-xs text-muted-foreground">{completedAppointments.length} completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Services</CardTitle>
              <Badge variant="outline" className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userServices.filter((s) => s.isActive).length}</div>
              <p className="text-xs text-muted-foreground">{userServices.length} total</p>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Chart */}
        <Card className="border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Monthly Earnings</CardTitle>
            <CardDescription>Earnings trend over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => value.slice(0, 3)}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: "#f59e0b" }}
                              />
                              <span className="text-sm font-medium text-foreground">
                                {payload[0].payload.month}
                              </span>
                            </div>
                            <p className="mt-1 text-lg font-bold text-foreground">
                              ${typeof payload[0].value === "number" ? payload[0].value.toFixed(2) : "0.00"}
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="earnings"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fill="url(#colorEarnings)"
                    dot={{ fill: "#f59e0b", r: 5 }}
                    activeDot={{ r: 7, stroke: "#f59e0b", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


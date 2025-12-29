"use client"

import { useData } from "@/lib/data-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { DollarSign, TrendingUp, Calendar } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts"

interface SellerEarningsProps {
  readonly sellerId: string
}

export function SellerEarnings({ sellerId }: SellerEarningsProps) {
  const { getSellerEarnings, appointments } = useData()
  const { total, monthly } = getSellerEarnings(sellerId)
  
  const completedAppointments = appointments.filter(
    (a) => a.sellerId === sellerId && (a.status === "completed" || a.status === "confirmed")
  )

  // Prepare chart data (last 6 months)
  const chartData = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const monthName = date.toLocaleDateString("en-US", { month: "short" })
    chartData.push({
      month: monthName,
      earnings: monthly[monthKey] || 0,
    })
  }

  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const thisMonthEarnings = monthly[currentMonth] || 0

  const chartConfig = {
    earnings: {
      label: "Earnings",
      color: "#8b5cf6", // Bright purple - visible in both themes
    },
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${total.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${thisMonthEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Bookings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Total appointments</p>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Chart */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Monthly Earnings</CardTitle>
          <CardDescription>Your earnings trend over the last 6 months</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
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
                        const value = typeof payload[0].value === "number" ? payload[0].value : 0
                        return (
                          <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: "#8b5cf6" }}
                              />
                              <span className="text-sm font-medium text-foreground">
                                {payload[0]?.payload.month}
                              </span>
                            </div>
                            <p className="mt-1 text-lg font-bold text-foreground">
                              ${value.toFixed(2)}
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
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fill="url(#colorEarnings)"
                    dot={{ fill: "#8b5cf6", r: 5 }}
                    activeDot={{ r: 7, stroke: "#8b5cf6", strokeWidth: 2 }}
                  />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

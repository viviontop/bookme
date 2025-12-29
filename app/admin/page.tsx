"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import {
  Users,
  Calendar,
  Shield,
  CheckCircle,
  XCircle,
  DollarSign,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function AdminPage() {
  const { user, isLoading } = useAuth()
  const {
    users,
    services,
    appointments,
    reviews,
    getTotalSales,
    getUserStats,
    approveKYC,
    rejectKYC,
    clearAppointments,
  } = useData()
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [kycAction, setKycAction] = useState<"approve" | "reject" | null>(null)
  const [showClearAppointmentsDialog, setShowClearAppointmentsDialog] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/feed")
    }
  }, [user, isLoading, router])

  if (isLoading || !user || user.role !== "admin") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const sellers = users.filter((u) => u.role === "seller")
  const buyers = users.filter((u) => u.role === "buyer")
  const verifiedUsers = users.filter((u) => u.isVerified)
  const pendingKYC = users.filter((u) => u.kycStatus === "pending" || u.kycStatus === "submitted")
  const activeServices = services.filter((s) => s.isActive)
  const salesData = getTotalSales()

  // Prepare sales chart data (last 6 months)
  const salesChartData = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const monthName = date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    
    const monthAppointments = appointments.filter(
      (a) => (a.status === "completed" || a.status === "confirmed") && a.paidAt && a.paidAt.startsWith(monthKey)
    )
    const monthTotal = monthAppointments.reduce((sum, a) => sum + (a.amount || 0), 0)
    const monthPlatformFee = monthAppointments.reduce((sum, a) => sum + (a.platformFee || 0), 0)
    
    salesChartData.push({
      month: monthName,
      total: monthTotal,
      platformFee: monthPlatformFee,
    })
  }

  const chartConfig = {
    total: {
      label: "Total Sales",
      color: "#3b82f6", // Bright blue - visible in both themes
    },
    platformFee: {
      label: "Platform Fee",
      color: "#10b981", // Bright green - visible in both themes
    },
  }

  const stats = [
    {
      title: "Total Sales",
      value: `$${salesData.total.toFixed(2)}`,
      icon: DollarSign,
      description: `Platform fee: $${salesData.platformFee.toFixed(2)}`,
    },
    {
      title: "Total Users",
      value: users.length,
      icon: Users,
      description: `${sellers.length} sellers, ${buyers.length} buyers`,
    },
    {
      title: "Active Services",
      value: activeServices.length,
      icon: Calendar,
      description: `${services.length} total services`,
    },
    {
      title: "Appointments",
      value: appointments.length,
      icon: Calendar,
      description: `${appointments.filter((a) => a.status === "completed" || a.status === "confirmed").length} paid`,
    },
  ]

  const handleKYCApproval = (userId: string, action: "approve" | "reject") => {
    if (action === "approve") {
      approveKYC(userId)
    } else {
      rejectKYC(userId)
    }
    setSelectedUser(null)
    setKycAction(null)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Manage users, services, and platform content</p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowClearAppointmentsDialog(true)}
          >
            Clear All Appointments
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sales Overview */}
        <Card className="mb-6 border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Sales Overview</CardTitle>
            <CardDescription>Total sales and platform revenue trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <div className="p-4 rounded-lg bg-muted/50 border border-border/40">
                <p className="text-sm text-muted-foreground mb-1">Total Sales</p>
                <p className="text-2xl font-bold">${salesData.total.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Platform Fee (2.5%)</p>
                <p className="text-2xl font-bold text-primary">${salesData.platformFee.toFixed(2)}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border/40">
                <p className="text-sm text-muted-foreground mb-1">Sellers Earnings (97.5%)</p>
                <p className="text-2xl font-bold">${salesData.sellersEarnings.toFixed(2)}</p>
              </div>
            </div>
            <ChartContainer config={chartConfig} className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPlatformFee" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              {payload[0].payload.month}
                            </p>
                            {payload.map((entry, index) => (
                              <div key={index} className="flex items-center justify-between gap-4 mt-1">
                                <div className="flex items-center gap-2">
                                  <div
                                    className="h-3 w-3 rounded-full"
                                    style={{ 
                                      backgroundColor: entry.dataKey === "total" ? "#3b82f6" : "#10b981" 
                                    }}
                                  />
                                  <span className="text-sm text-foreground">
                                    {entry.dataKey === "total" ? "Total Sales" : "Platform Fee"}
                                  </span>
                                </div>
                                <span className="text-sm font-bold text-foreground">
                                  ${typeof entry.value === "number" ? entry.value.toFixed(2) : "0.00"}
                                </span>
                              </div>
                            ))}
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#colorTotal)"
                    dot={{ fill: "#3b82f6", r: 5 }}
                    activeDot={{ r: 7, stroke: "#3b82f6", strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="platformFee"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#colorPlatformFee)"
                    dot={{ fill: "#10b981", r: 5 }}
                    activeDot={{ r: 7, stroke: "#10b981", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <div className="flex justify-center">
            <TabsList className="w-fit">
              <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
              <TabsTrigger value="services">Services ({services.length})</TabsTrigger>
              <TabsTrigger value="appointments">Appointments ({appointments.length})</TabsTrigger>
              <TabsTrigger value="kyc">KYC Verification ({pendingKYC.length})</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage user accounts and view statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Earnings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>KYC</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => {
                      const stats = getUserStats(u.id)
                      // Generate deterministic status based on user ID
                      const statusHash = u.id.split("").reduce((acc, char) => acc + (char.codePointAt(0) || 0), 0)
                      const statusOptions: Array<"online" | "busy" | "offline"> = ["online", "busy", "offline"]
                      const userStatus = statusOptions[statusHash % 3]
                      
                      return (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div
                                className={`h-2.5 w-2.5 rounded-full ${
                                  userStatus === "online"
                                    ? "bg-green-500"
                                    : userStatus === "busy"
                                      ? "bg-yellow-500"
                                      : "bg-gray-400"
                                }`}
                                title={userStatus.charAt(0).toUpperCase() + userStatus.slice(1)}
                              />
                              {u.firstName} {u.lastName}
                            </div>
                          </TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {u.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {u.role === "seller" ? (
                              <span className="font-medium">${stats.earnings.toFixed(2)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {u.isVerified ? (
                              <Badge variant="secondary" className="gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge variant="outline">Unverified</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                u.kycStatus === "verified"
                                  ? "default"
                                  : u.kycStatus === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {u.kycStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Link href={`/profile/${u.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              {u.role === "seller" && (
                                <Link href={`/admin/user/${u.id}`}>
                                  <Button variant="outline" size="sm">
                                    Stats
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Services</CardTitle>
                <CardDescription>Manage service listings</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((service) => {
                      const seller = users.find((u) => u.id === service.sellerId)
                      return (
                        <TableRow key={service.id}>
                          <TableCell className="font-medium">{service.title}</TableCell>
                          <TableCell>
                            {seller ? `${seller.firstName} ${seller.lastName}` : "Unknown"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{service.category}</Badge>
                          </TableCell>
                          <TableCell>${service.price}</TableCell>
                          <TableCell>
                            {service.isActive ? (
                              <Badge variant="default">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Appointments</CardTitle>
                <CardDescription>View and manage appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appt) => {
                      const buyer = users.find((u) => u.id === appt.buyerId)
                      const seller = users.find((u) => u.id === appt.sellerId)
                      return (
                        <TableRow key={appt.id}>
                          <TableCell>{new Date(appt.date).toLocaleDateString()}</TableCell>
                          <TableCell>{appt.time}</TableCell>
                          <TableCell>
                            {buyer ? `${buyer.firstName} ${buyer.lastName}` : "Unknown"}
                          </TableCell>
                          <TableCell>
                            {seller ? `${seller.firstName} ${seller.lastName}` : "Unknown"}
                          </TableCell>
                          <TableCell>
                            {appt.amount ? `$${appt.amount.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                appt.status === "confirmed"
                                  ? "default"
                                  : appt.status === "completed"
                                    ? "secondary"
                                    : appt.status === "cancelled"
                                      ? "destructive"
                                      : "outline"
                              }
                            >
                              {appt.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>KYC Verification</CardTitle>
                <CardDescription>Review and verify user identity documents</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingKYC.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingKYC.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">
                            {u.firstName} {u.lastName}
                          </TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{u.kycStatus}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(u.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Link href={`/settings/kyc?userId=${u.id}`}>
                                <Button variant="outline" size="sm">
                                  Review
                                </Button>
                              </Link>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(u.id)
                                  setKycAction("approve")
                                }}
                                className="gap-1"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(u.id)
                                  setKycAction("reject")
                                }}
                                className="gap-1"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-12 text-center">
                    <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">No pending KYC verifications</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* KYC Approval/Rejection Dialog */}
      <AlertDialog
        open={selectedUser !== null && kycAction !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUser(null)
            setKycAction(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {kycAction === "approve" ? "Approve KYC Verification?" : "Reject KYC Verification?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {kycAction === "approve"
                ? "This will verify the user's identity and grant them full access to the platform."
                : "This will reject the user's KYC submission. They can resubmit their documents."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && kycAction && handleKYCApproval(selectedUser, kycAction)}
            >
              {kycAction === "approve" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Appointments Dialog */}
      <AlertDialog open={showClearAppointmentsDialog} onOpenChange={setShowClearAppointmentsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Appointments</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all appointments? This action cannot be undone.
              <br />
              <span className="font-semibold text-foreground mt-2 block">
                This will delete {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearAppointments()
                setShowClearAppointmentsDialog(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

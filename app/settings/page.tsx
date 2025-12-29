"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { seedDemoData } from "@/lib/seed-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { User, Shield, Bell, Lock, LogOut, ChevronRight, Check, AlertCircle, Clock, DollarSign } from "lucide-react"
import { SellerEarnings } from "@/components/seller-earnings"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { user, isLoading: authLoading, updateUser, logout } = useAuth()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState("profile")
  const [isSaving, setIsSaving] = useState(false)
  const [savedMessage, setSavedMessage] = useState("")

  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    bio: "",
    location: "",
  })

  useEffect(() => {
    seedDemoData()
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
    if (user) {
      setProfileData({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        bio: user.bio || "",
        location: user.location || "",
      })
    }
  }, [authLoading, user, router])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    updateUser(profileData)
    setTimeout(() => {
      setIsSaving(false)
      setSavedMessage("Profile updated successfully")
      setTimeout(() => setSavedMessage(""), 3000)
    }, 500)
  }

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const menuItems = [
    { id: "profile", label: "Profile", icon: User },
    ...(user.role === "seller" ? [{ id: "earnings", label: "Earnings", icon: DollarSign }] : []),
    { id: "kyc", label: "Identity Verification", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
  ]

  const kycStatusConfig = {
    pending: {
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      icon: Clock,
      label: "Not Started",
    },
    submitted: {
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      icon: Clock,
      label: "Under Review",
    },
    verified: {
      color: "bg-green-500/10 text-green-600 border-green-500/20",
      icon: Check,
      label: "Verified",
    },
    rejected: {
      color: "bg-destructive/10 text-destructive border-destructive/20",
      icon: AlertCircle,
      label: "Rejected",
    },
  }

  const kycStatus = kycStatusConfig[user.kycStatus]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-muted-foreground">Manage your account preferences</p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar */}
          <aside className="w-full shrink-0 lg:w-64">
            <Card>
              <CardContent className="p-2">
                <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                        activeTab === item.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                      <ChevronRight className="ml-auto h-4 w-4" />
                    </button>
                  ))}
                  <Separator className="my-2" />
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Content */}
          <main className="flex-1">
            {activeTab === "profile" && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal details and public profile</CardDescription>
                </CardHeader>
                <CardContent>
                  {savedMessage && (
                    <Alert className="mb-6">
                      <Check className="h-4 w-4" />
                      <AlertDescription>{savedMessage}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.firstName} />
                        <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <Button type="button" variant="outline" size="sm" className="bg-transparent">
                          Change Photo
                        </Button>
                        <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or GIF. Max 2MB</p>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={user.email} disabled className="bg-muted" />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="City, State"
                        value={profileData.location}
                        onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      />
                    </div>

                    {user.role === "seller" && (
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          placeholder="Tell clients about yourself..."
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          rows={4}
                        />
                      </div>
                    )}

                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {activeTab === "earnings" && user.role === "seller" && (
              <Card>
                <CardHeader>
                  <CardTitle>Earnings</CardTitle>
                  <CardDescription>Track your earnings and revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <SellerEarnings sellerId={user.id} />
                </CardContent>
              </Card>
            )}

            {activeTab === "kyc" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Identity Verification (KYC)</CardTitle>
                      <CardDescription>Verify your identity to unlock all features</CardDescription>
                    </div>
                    <Badge variant="outline" className={cn("gap-1", kycStatus.color)}>
                      <kycStatus.icon className="h-3 w-3" />
                      {kycStatus.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {user.kycStatus === "verified" ? (
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Your identity has been verified. You have full access to all platform features.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Identity verification is required for sellers to accept payments and for accessing 18+
                          content. Complete KYC to build trust with clients.
                        </AlertDescription>
                      </Alert>

                      <div className="rounded-lg border border-border p-4">
                        <h3 className="font-medium text-foreground">What you&apos;ll need:</h3>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            Government-issued ID (passport, driver&apos;s license)
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />A selfie holding your ID
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-primary" />
                            Proof of address (utility bill, bank statement)
                          </li>
                        </ul>
                      </div>

                      <Link href="/settings/kyc">
                        <Button className="w-full">
                          <Shield className="mr-2 h-4 w-4" />
                          Start Verification
                        </Button>
                      </Link>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === "notifications" && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { id: "email_bookings", label: "Booking notifications", desc: "Get notified about new bookings" },
                    { id: "email_reminders", label: "Appointment reminders", desc: "Reminders before appointments" },
                    { id: "email_marketing", label: "Marketing emails", desc: "Tips and promotional content" },
                  ].map((pref) => (
                    <div
                      key={pref.id}
                      className="flex items-center justify-between rounded-lg border border-border p-4"
                    >
                      <div>
                        <p className="font-medium text-foreground">{pref.label}</p>
                        <p className="text-sm text-muted-foreground">{pref.desc}</p>
                      </div>
                      <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeTab === "security" && (
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Password</p>
                        <p className="text-sm text-muted-foreground">Last changed: Never</p>
                      </div>
                      <Button variant="outline" size="sm" className="bg-transparent">
                        Change
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <Button variant="outline" size="sm" className="bg-transparent">
                        Enable
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium text-destructive">Danger Zone</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                    <Button variant="destructive" size="sm" className="mt-4">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

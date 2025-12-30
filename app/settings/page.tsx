"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-context"
import { seedDemoData } from "@/lib/seed-data"
import type { User } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { User as UserIcon, Shield, Bell, Lock, LogOut, ChevronRight, Check, AlertCircle, Clock, DollarSign } from "lucide-react"
import { SellerEarnings } from "@/components/seller-earnings"
import { ImageCropper } from "@/components/image-cropper"
import { cn } from "@/lib/utils"

export default function SettingsPage() {
  const { user, isLoading: authLoading, updateUser, logout } = useAuth()
  const { appointments, services, reviews, updateUser: updateUserData } = useData()
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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [cropType, setCropType] = useState<"avatar" | "banner">("avatar")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [phoneVerification, setPhoneVerification] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [showVerificationStep, setShowVerificationStep] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [show2FADialog, setShow2FADialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

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
      // Initialize avatar preview with user's current avatar
      setAvatarPreview(user.avatar || null)
    }
  }, [authLoading, user, router])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setSavedMessage("Please select an image file")
        setTimeout(() => setSavedMessage(""), 3000)
        return
      }
      // Validate file size (5MB for cropping, will be compressed after)
      if (file.size > 5 * 1024 * 1024) {
        setSavedMessage("Image size must be less than 5MB")
        setTimeout(() => setSavedMessage(""), 3000)
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageToCrop(reader.result as string)
        setCropType("avatar")
        setShowCropDialog(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = (croppedImage: string) => {
    if (cropType === "avatar") {
      setAvatarPreview(croppedImage)
    }
    setImageToCrop(null)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    const updateData: Partial<User> = { ...profileData }
    
    // If avatar was changed, use the preview (which is the cropped image)
    // Otherwise, preserve the existing avatar
    if (avatarPreview && avatarPreview !== user?.avatar) {
      updateData.avatar = avatarPreview
    } else if (user?.avatar) {
      // Preserve existing avatar if not changed
      updateData.avatar = user.avatar
    }
    
    // Preserve existing banner if not changed
    if (user?.banner) {
      updateData.banner = user.banner
    }
    
    updateUser(updateData)
    // Also update in data context to keep it in sync
    if (user) {
      updateUserData(user.id, updateData)
    }
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

  const handleChangePassword = () => {
    setShowPasswordDialog(true)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  const handleSavePassword = () => {
    if (!user) return

    // Validate current password
    if (currentPassword !== user.password) {
      setSavedMessage("Current password is incorrect")
      setTimeout(() => setSavedMessage(""), 3000)
      return
    }

    // Validate new password
    if (newPassword.length < 6) {
      setSavedMessage("New password must be at least 6 characters")
      setTimeout(() => setSavedMessage(""), 3000)
      return
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setSavedMessage("New passwords do not match")
      setTimeout(() => setSavedMessage(""), 3000)
      return
    }

    // Update password
    updateUser({ password: newPassword })
    updateUserData(user.id, { password: newPassword })
    setShowPasswordDialog(false)
    setSavedMessage("Password changed successfully")
    setTimeout(() => setSavedMessage(""), 3000)
  }

  const handleToggle2FA = () => {
    if (twoFactorEnabled) {
      // Disable 2FA
      setTwoFactorEnabled(false)
      setSavedMessage("Two-Factor Authentication disabled")
      setTimeout(() => setSavedMessage(""), 3000)
    } else {
      // Show 2FA setup dialog
      setShow2FADialog(true)
    }
  }

  const handleEnable2FA = () => {
    // In a real app, this would generate a QR code and secret
    // For demo purposes, we'll just enable it
    setTwoFactorEnabled(true)
    setShow2FADialog(false)
    setSavedMessage("Two-Factor Authentication enabled")
    setTimeout(() => setSavedMessage(""), 3000)
  }

  const handleDeleteAccount = () => {
    setShowDeleteDialog(true)
    setPhoneVerification("")
    setVerificationCode("")
    setShowVerificationStep(false)
  }

  const handleDeleteVerification = () => {
    if (!user) return
    
    // Verify phone number matches
    if (phoneVerification !== user.phone) {
      setSavedMessage("Phone number does not match")
      setTimeout(() => setSavedMessage(""), 3000)
      return
    }
    
    // Generate a simple verification code (in production, this would be sent via SMS)
    const expectedCode = user.phone.slice(-4) // Last 4 digits as verification code
    
    if (verificationCode !== expectedCode) {
      setSavedMessage("Invalid verification code")
      setTimeout(() => setSavedMessage(""), 3000)
      return
    }
    
    // Delete account
    const users: User[] = JSON.parse(localStorage.getItem("users") || "[]")
    const updatedUsers = users.filter((u) => u.id !== user.id)
    localStorage.setItem("users", JSON.stringify(updatedUsers))
    
    // Clear appointments, services, reviews related to this user
    const updatedAppointments = appointments.filter(
      (a) => a.buyerId !== user.id && a.sellerId !== user.id
    )
    localStorage.setItem("appointments", JSON.stringify(updatedAppointments))
    
    const updatedServices = services.filter((s) => s.sellerId !== user.id)
    localStorage.setItem("services", JSON.stringify(updatedServices))
    
    const updatedReviews = reviews.filter(
      (r) => r.reviewerId !== user.id && r.revieweeId !== user.id
    )
    localStorage.setItem("reviews", JSON.stringify(updatedReviews))
    
    // Logout and redirect
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
    { id: "profile", label: "Profile", icon: UserIcon },
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
                        <AvatarImage src={avatarPreview || user.avatar || "/placeholder.svg"} alt={user.firstName} />
                        <AvatarFallback className="bg-primary text-2xl text-primary-foreground">
                          {user.firstName[0]}
                          {user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <input
                          type="file"
                          id="avatar-upload"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="bg-transparent"
                          onClick={() => document.getElementById("avatar-upload")?.click()}
                        >
                          Change Photo
                        </Button>
                        <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or GIF. Max 5MB</p>
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
                      <Button variant="outline" size="sm" className="bg-transparent" onClick={handleChangePassword}>
                        Change
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">
                          {twoFactorEnabled ? "Enabled" : "Add an extra layer of security"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" className="bg-transparent" onClick={handleToggle2FA}>
                        {twoFactorEnabled ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium text-destructive">Danger Zone</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                    </p>
                    <Button variant="destructive" size="sm" className="mt-4" onClick={handleDeleteAccount}>
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>

      {/* Image Cropper Dialog */}
      {imageToCrop && (
        <ImageCropper
          open={showCropDialog}
          onOpenChange={setShowCropDialog}
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          aspectRatio={cropType === "avatar" ? 1 : 16 / 9}
          cropShape={cropType === "avatar" ? "round" : "rect"}
        />
      )}

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and choose a new one</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePassword}>Change Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Two-Factor Authentication Dialog */}
      <Dialog open={show2FADialog} onOpenChange={setShow2FADialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Add an extra layer of security to your account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Two-Factor Authentication (2FA) adds an extra layer of security to your account. 
                You'll need to enter a code from your authenticator app when signing in.
              </AlertDescription>
            </Alert>
            <div className="rounded-lg border border-border p-4 space-y-2">
              <p className="text-sm font-medium">How it works:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code that will be shown</li>
                <li>Enter the 6-digit code to verify</li>
                <li>You'll be asked for a code each time you sign in</li>
              </ul>
            </div>
            <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
              <div className="text-center">
                <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  QR code will be generated after enabling
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShow2FADialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEnable2FA}>Enable 2FA</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {!showVerificationStep ? (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="phone-verification">Enter your phone number to verify</Label>
                  <Input
                    id="phone-verification"
                    type="tel"
                    placeholder="Enter phone number"
                    value={phoneVerification}
                    onChange={(e) => setPhoneVerification(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    We'll send a verification code to confirm your identity
                  </p>
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (!user) return
                    if (phoneVerification !== user.phone) {
                      setSavedMessage("Phone number does not match")
                      setTimeout(() => setSavedMessage(""), 3000)
                      return
                    }
                    setShowVerificationStep(true)
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Enter the verification code sent to your phone. For demo purposes, use the last 4 digits of your phone number.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="Enter 4-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={4}
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setShowVerificationStep(false)
                  setPhoneVerification("")
                  setVerificationCode("")
                }}>
                  Back
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteVerification}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

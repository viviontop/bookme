"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Home, Search, Calendar, Settings, LogOut, User, Menu, X, Shield, MessageCircle, MapPin, Plus } from "lucide-react"
import { useState } from "react"
import { useMessaging } from "@/lib/messaging-context"
import { useData } from "@/lib/data-context"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"

export function Navigation() {
  const { user, logout } = useAuth()
  const { appointments } = useData()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Always call hook, but handle errors gracefully
  let unreadCount = 0
  try {
    const messaging = useMessaging()
    unreadCount = messaging.getUnreadCount()
  } catch {
    // Messaging context not available
  }

  // Count appointments that need payment (for buyers)
  const pendingPaymentCount = user?.role === "buyer" 
    ? appointments.filter((a) => a.buyerId === user.id && (a.status === "pending" || a.status === "approved")).length
    : 0

  if (!user) return null

  const navItems = [
    { href: "/feed", icon: Home, label: "Feed" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/appointments", icon: Calendar, label: "Appointments" },
    { href: "/chat", icon: MessageCircle, label: "Messages" },
    { href: "/map", icon: MapPin, label: "Map" },
  ]

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            {/* Hamburger Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                      <span className="text-lg font-bold text-primary-foreground">B</span>
                    </div>
                    <span className="text-xl font-semibold text-foreground">BookMe</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-8 flex flex-col gap-2">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={pathname === item.href ? "secondary" : "ghost"}
                        className="w-full justify-start gap-2 relative"
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                        {item.href === "/chat" && unreadCount > 0 && (
                          <Badge variant="default" className="ml-auto h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                            {unreadCount > 9 ? "9+" : unreadCount}
                          </Badge>
                        )}
                        {item.href === "/appointments" && pendingPaymentCount > 0 && (
                          <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" title={`${pendingPaymentCount} appointment(s) need payment`} />
                        )}
                      </Button>
                    </Link>
                  ))}
                  <div className="my-2 border-t border-border" />
                  {user.role === "seller" && (
                    <>
                      <Link href="/appointments/seller">
                        <Button
                          variant={pathname === "/appointments/seller" ? "secondary" : "ghost"}
                          className="w-full justify-start gap-2"
                        >
                          <Calendar className="h-4 w-4" />
                          Manage Requests
                        </Button>
                      </Link>
                      <Link href={`/profile/${user.id}?addService=true`}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Service
                        </Button>
                      </Link>
                    </>
                  )}
                  {user.role === "admin" && (
                    <>
                      <Link href="/admin">
                        <Button
                          variant={pathname === "/admin" ? "secondary" : "ghost"}
                          className="w-full justify-start gap-2"
                        >
                          <Shield className="h-4 w-4" />
                          Admin
                        </Button>
                      </Link>
                      <Link href={`/profile/${user.id}?addService=true`}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Service
                        </Button>
                      </Link>
                    </>
                  )}
                  <Link href="/settings">
                    <Button
                      variant={pathname === "/settings" ? "secondary" : "ghost"}
                      className="w-full justify-start gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Button>
                  </Link>
                  <Link href={`/profile/${user.id}`}>
                    <Button
                      variant={pathname === `/profile/${user.id}` ? "secondary" : "ghost"}
                      className="w-full justify-start gap-2"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Button>
                  </Link>
                  <div className="my-2 border-t border-border" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-destructive"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/feed" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">B</span>
              </div>
              <span className="text-xl font-semibold text-foreground">BookMe</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
              <div className="hidden items-center gap-1 md:flex">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button variant={pathname === item.href ? "secondary" : "ghost"} size="sm" className="gap-2 relative">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                      {item.href === "/appointments" && pendingPaymentCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 border-2 border-card" title={`${pendingPaymentCount} appointment(s) need payment`} />
                      )}
                    </Button>
                  </Link>
                ))}
                {(user.role === "seller" || user.role === "admin") && (
                  <Link href={`/profile/${user.id}?addService=true`}>
                    <Button variant="default" size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Service
                    </Button>
                  </Link>
                )}
              </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />
            
            {/* Settings Button */}
            <Link href="/settings">
              <Button
                variant={pathname === "/settings" ? "secondary" : "ghost"}
                size="icon"
                className="h-9 w-9"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.firstName} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.firstName} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${user.id}`} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="border-t border-border bg-card p-4 md:hidden">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant={pathname === item.href ? "secondary" : "ghost"} className="w-full justify-start gap-2 relative">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                    {item.href === "/appointments" && pendingPaymentCount > 0 && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" title={`${pendingPaymentCount} appointment(s) need payment`} />
                    )}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>
  )
}

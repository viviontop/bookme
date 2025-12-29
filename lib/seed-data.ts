import type { User, Service, Review } from "./types"

export function seedDemoData() {
  if (globalThis.window === undefined) return
  
  // Always ensure admin user exists and has correct role
  const existingUsers: User[] = JSON.parse(localStorage.getItem("users") || "[]")
  const adminIndex = existingUsers.findIndex((u) => u.email === "becheruandrei9@gmail.com")
  
  const adminUser: User = {
    id: "admin-1",
    email: "becheruandrei9@gmail.com",
    password: "admin123",
    role: "admin",
    firstName: "Admin",
    lastName: "User",
    birthDate: "1990-01-01",
    phone: "+1234567890",
    avatar: "/placeholder.svg",
    bio: "Platform Administrator",
    location: "Global",
    createdAt: "2024-01-01",
    isVerified: true,
    kycStatus: "verified",
  }
  
  if (adminIndex >= 0) {
    // Update existing admin user to ensure correct role
    existingUsers[adminIndex] = { ...existingUsers[adminIndex], ...adminUser, role: "admin" }
  } else {
    // Add admin user if it doesn't exist
    existingUsers.push(adminUser)
  }
  localStorage.setItem("users", JSON.stringify(existingUsers))
  
  if (localStorage.getItem("seeded")) return

  const demoUsers: User[] = [
    {
      id: "seller-1",
      email: "sarah@example.com",
      password: "demo123",
      role: "seller",
      firstName: "Sarah",
      lastName: "Johnson",
      birthDate: "1990-05-15",
      phone: "+1234567890",
      avatar: "/professional-woman-portrait.png",
      bio: "Premium companion offering exclusive experiences. Discreet and professional.",
      location: "New York, NY",
      createdAt: "2024-01-01",
      isVerified: true,
      kycStatus: "verified",
    },
    {
      id: "seller-2",
      email: "mike@example.com",
      password: "demo123",
      role: "seller",
      firstName: "Mike",
      lastName: "Chen",
      birthDate: "1988-08-22",
      phone: "+1234567891",
      avatar: "/professional-woman-portrait.png",
      bio: "Elite companion providing unforgettable experiences. Available for travel.",
      location: "Los Angeles, CA",
      createdAt: "2024-01-15",
      isVerified: true,
      kycStatus: "verified",
    },
    {
      id: "seller-3",
      email: "emma@example.com",
      password: "demo123",
      role: "seller",
      firstName: "Emma",
      lastName: "Williams",
      birthDate: "1995-03-10",
      phone: "+1234567892",
      avatar: "/professional-woman-portrait.png",
      bio: "Sophisticated companion offering premium services. Discreet and elegant.",
      location: "Chicago, IL",
      createdAt: "2024-02-01",
      isVerified: true,
      kycStatus: "verified",
    },
    {
      id: "seller-4",
      email: "david@example.com",
      password: "demo123",
      role: "seller",
      firstName: "David",
      lastName: "Park",
      birthDate: "1992-11-30",
      phone: "+1234567893",
      avatar: "/professional-woman-portrait.png",
      bio: "Exotic companion specializing in luxury experiences. Available 24/7.",
      location: "Miami, FL",
      createdAt: "2024-02-15",
      isVerified: true,
      kycStatus: "verified",
    },
    {
      id: "seller-5",
      email: "lisa@example.com",
      password: "demo123",
      role: "seller",
      firstName: "Lisa",
      lastName: "Martinez",
      birthDate: "1987-07-18",
      phone: "+1234567894",
      avatar: "/professional-woman-portrait.png",
      bio: "Premium OnlyFans creator and companion. Exclusive content and experiences available.",
      location: "San Francisco, CA",
      createdAt: "2024-03-01",
      isVerified: true,
      kycStatus: "verified",
    },
  ]

  const demoServices: Service[] = [
    {
      id: "service-1",
      sellerId: "seller-1",
      title: "Premium Companion Experience",
      description: "Exclusive one-on-one companionship with a sophisticated and discreet professional.",
      price: 500,
      duration: 120,
      category: "Companionship",
      images: ["/professional-woman-portrait.png"],
      isActive: true,
    },
    {
      id: "service-2",
      sellerId: "seller-1",
      title: "Extended Evening Package",
      description: "Full evening experience with dinner and premium companionship services.",
      price: 1000,
      duration: 240,
      category: "Companionship",
      images: ["/professional-woman-portrait.png"],
      isActive: true,
    },
    {
      id: "service-3",
      sellerId: "seller-2",
      title: "Travel Companion",
      description: "Elite companion available for travel and events. Discreet and professional.",
      price: 800,
      duration: 180,
      category: "Companionship",
      images: ["/professional-woman-portrait.png"],
      isActive: true,
    },
    {
      id: "service-4",
      sellerId: "seller-2",
      title: "Weekend Getaway",
      description: "Exclusive weekend experience with luxury accommodations included.",
      price: 2500,
      duration: 1440,
      category: "Companionship",
      images: ["/professional-woman-portrait.png"],
      isActive: true,
    },
    {
      id: "service-5",
      sellerId: "seller-3",
      title: "VIP Companion Session",
      description: "Premium one-on-one experience tailored to your preferences.",
      price: 600,
      duration: 120,
      category: "Companionship",
      images: ["/professional-woman-portrait.png"],
      isActive: true,
    },
    {
      id: "service-6",
      sellerId: "seller-3",
      title: "Dinner Date Experience",
      description: "Elegant dinner companion for social events and private dining.",
      price: 400,
      duration: 180,
      category: "Companionship",
      images: ["/professional-woman-portrait.png"],
      isActive: true,
    },
    {
      id: "service-7",
      sellerId: "seller-4",
      title: "Exotic Companion Experience",
      description: "Luxury companionship with personalized attention and discretion.",
      price: 700,
      duration: 120,
      category: "Companionship",
      images: ["/professional-woman-portrait.png"],
      isActive: true,
    },
    {
      id: "service-8",
      sellerId: "seller-4",
      title: "24/7 Availability",
      description: "Premium companion available around the clock for your convenience.",
      price: 1200,
      duration: 480,
      category: "Companionship",
      images: ["/professional-woman-portrait.png"],
      isActive: true,
    },
    {
      id: "service-9",
      sellerId: "seller-5",
      title: "OnlyFans Premium Subscription",
      description: "Exclusive access to premium content and personalized experiences.",
      price: 300,
      duration: 30,
      category: "Content",
      images: ["/professional-woman-portrait.png"],
      isActive: true,
    },
    {
      id: "service-10",
      sellerId: "seller-5",
      title: "Custom Content Creation",
      description: "Personalized content creation and exclusive OnlyFans experiences.",
      price: 500,
      duration: 60,
      category: "Content",
      images: ["/professional-woman-portrait.png"],
      isActive: true,
    },
  ]

  const demoReviews: Review[] = [
    {
      id: "review-1",
      appointmentId: "appt-1",
      reviewerId: "buyer-1",
      revieweeId: "seller-1",
      rating: 5,
      comment: "Absolutely amazing experience! Professional, discreet, and exceeded all expectations. Highly recommend!",
      createdAt: "2024-06-15",
    },
    {
      id: "review-2",
      appointmentId: "appt-2",
      reviewerId: "buyer-2",
      revieweeId: "seller-1",
      rating: 5,
      comment: "Top-tier service. Very professional and made me feel completely comfortable. Will definitely book again.",
      createdAt: "2024-06-20",
    },
    {
      id: "review-3",
      appointmentId: "appt-3",
      reviewerId: "buyer-1",
      revieweeId: "seller-2",
      rating: 5,
      comment: "Perfect travel companion. Elegant, sophisticated, and made the entire trip memorable. Worth every penny!",
      createdAt: "2024-07-01",
    },
    {
      id: "review-4",
      appointmentId: "appt-4",
      reviewerId: "buyer-3",
      revieweeId: "seller-3",
      rating: 5,
      comment: "Exceptional service and attention to detail. Very professional and discreet. Highly satisfied!",
      createdAt: "2024-07-10",
    },
    {
      id: "review-5",
      appointmentId: "appt-5",
      reviewerId: "buyer-2",
      revieweeId: "seller-4",
      rating: 5,
      comment: "Incredible experience from start to finish. Professional, elegant, and exceeded expectations. Will return!",
      createdAt: "2024-07-15",
    },
  ]

  // Merge existing users with demo users (avoid duplicates)
  const allUsers = [...existingUsers]
  for (const demoUser of demoUsers) {
    if (!allUsers.some((u) => u.id === demoUser.id || u.email === demoUser.email)) {
      allUsers.push(demoUser)
    }
  }
  
  localStorage.setItem("users", JSON.stringify(allUsers))
  localStorage.setItem("services", JSON.stringify(demoServices))
  localStorage.setItem("reviews", JSON.stringify(demoReviews))
  localStorage.setItem("seeded", "true")
}

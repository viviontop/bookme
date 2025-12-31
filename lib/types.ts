export type UserRole = "buyer" | "seller" | "admin"

export interface User {
  id: string
  email: string
  username?: string
  password?: string
  role: UserRole
  firstName: string
  lastName: string
  birthDate: string
  phone: string
  avatar?: string
  banner?: string
  bannerAspectRatio?: number
  bio?: string
  location?: string
  createdAt: string
  isVerified: boolean
  kycStatus: "pending" | "submitted" | "verified" | "rejected"
  kycDocuments?: {
    idFront?: string
    idBack?: string
    selfie?: string
  }
}

export interface Service {
  id: string
  sellerId: string
  title: string
  description: string
  price: number
  duration: number // in minutes
  category: string
  images: string[]
  isActive: boolean
}

export interface Availability {
  id: string
  sellerId: string
  dayOfWeek: number // 0-6
  startTime: string // HH:MM
  endTime: string // HH:MM
  isAvailable: boolean
}

export interface Appointment {
  id: string
  buyerId: string
  sellerId: string
  serviceId: string
  date: string
  time: string
  status: "pending" | "approved" | "rejected" | "paid" | "confirmed" | "completed" | "cancelled"
  createdAt: string
  amount?: number // Total amount paid
  sellerEarnings?: number // 97.5% of amount
  platformFee?: number // 2.5% of amount
  paidAt?: string // When payment was completed
  approvedAt?: string // When seller approved
  rejectedAt?: string // When seller rejected
}

export interface Review {
  id: string
  appointmentId: string
  reviewerId: string
  revieweeId: string
  rating: number
  comment: string
  createdAt: string
}

export interface SellerProfile extends User {
  services: Service[]
  availability: Availability[]
  rating: number
  reviewCount: number
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  receiverId: string
  content: string
  createdAt: string
  read: boolean
}

export interface Conversation {
  id: string
  participantIds: string[]
  lastMessage?: Message
  lastMessageAt?: string
  unreadCount: number
}

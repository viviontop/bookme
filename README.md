# BookMe - Appointment Booking Platform

A modern, full-featured appointment booking platform built with Next.js, React, and TypeScript.

## Features

- 🔐 **User Authentication** - Secure login and registration system
- 👥 **Multi-Role Support** - Buyers, Sellers, and Admin roles
- 💬 **Real-time Messaging** - Built-in chat system with unread notifications
- 🗺️ **Interactive Map** - View services on a world map with location pins
- 📊 **Admin Dashboard** - Comprehensive admin panel with user management, KYC verification, and analytics
- 💰 **Earnings Tracking** - Sellers can track their earnings with detailed charts
- 🌓 **Dark/Light Mode** - Beautiful theme toggle
- 📱 **Responsive Design** - Works on all devices

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Charts**: Recharts
- **Maps**: Leaflet & React-Leaflet
- **State Management**: React Context API
- **Storage**: localStorage (for demo purposes)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/viviontop/bookme.git
cd bookme
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Demo Accounts

### Admin Account
- Email: `nuh uh`
- Password: `admin123`

### Seller Account
- Email: `seller@example.com`
- Password: `password123`

### Buyer Account
- Email: `buyer@example.com`
- Password: `password123`

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   ├── chat/              # Messaging interface
│   ├── map/               # Map view
│   └── ...
├── components/            # React components
│   ├── ui/               # UI component library
│   └── ...
├── lib/                  # Utilities and contexts
│   ├── auth-context.tsx  # Authentication context
│   ├── data-context.tsx  # Data management context
│   └── messaging-context.tsx # Messaging context
└── ...
```

## Key Features

### Admin Dashboard
- User management and statistics
- KYC verification system
- Service and appointment management
- Sales analytics with charts
- Individual user statistics

### Messaging System
- Real-time chat interface
- Unread message counts
- Conversation history
- Search functionality

### Map Feature
- Interactive world map
- Service location pins
- "My Location" button with geolocation
- Clickable service details

### Earnings Tracking
- Total and monthly earnings
- Visual charts and graphs
- Platform fee calculations (2.5% platform cut)

## Deployment

### ⚠️ Important: GitHub Pages Won't Work!

**GitHub Pages only serves static HTML files** and cannot run Next.js applications. You **must** use a platform that supports Node.js.

### Deploy to Vercel (Recommended - FREE)

Vercel is made by the creators of Next.js and is the best option:

1. **Go to**: https://vercel.com
2. **Sign in** with your GitHub account
3. Click **"Add New..."** → **"Project"**
4. **Import** your `viviontop/bookme` repository
5. Click **"Deploy"** (settings are auto-detected)
6. **Wait 2-3 minutes** - your site will be live!

Your website will be at: `https://bookme-xyz.vercel.app`

### Deploy to Netlify (Alternative - FREE)

1. **Go to**: https://netlify.com
2. **Sign in** with your GitHub account
3. Click **"Add new site"** → **"Import an existing project"**
4. Select `viviontop/bookme`
5. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Click **"Deploy site"**

### Why Not GitHub Pages?

- GitHub Pages = Static HTML only
- Next.js = Needs Node.js server + build process
- **They're incompatible!**

See `DEPLOY_TO_VERCEL.md` for detailed instructions.

## License

This project is private and proprietary.

## Support

For issues or questions, please open an issue on GitHub.


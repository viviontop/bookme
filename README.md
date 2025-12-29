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

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Click "Deploy"

### Deploy to Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Import your GitHub repository
4. Build command: `npm run build`
5. Publish directory: `.next`

## License

This project is private and proprietary.

## Support

For issues or questions, please open an issue on GitHub.


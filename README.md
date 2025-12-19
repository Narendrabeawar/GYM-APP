# 🏋️ GymFlow - Modern Gym Management System

A beautiful, feature-rich gym management application built with Next.js 16, shadcn/ui, Framer Motion, and Supabase.

## ✨ Features

- 🔐 **Authentication** - Secure sign in/sign up with Supabase Auth
- 📊 **Admin Dashboard** - Comprehensive overview with stats and analytics
- 👥 **Member Management** - Track members, memberships, and status
- 💪 **Trainer Management** - Manage trainers and their schedules
- 💳 **Payment Processing** - Handle membership payments and renewals
- 📅 **Attendance Tracking** - Monitor member check-ins and activity
- 📱 **Mobile Responsive** - Beautiful UI on all devices
- 🎨 **Modern Design** - Glassmorphism, gradients, and smooth animations
- ⚡ **Fast & Optimized** - Built with Next.js 16 and Turbopack

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Components:** shadcn/ui
- **Animations:** Framer Motion
- **Database & Auth:** Supabase
- **Styling:** Tailwind CSS 4.x
- **Type Safety:** TypeScript
- **Forms:** React Hook Form + Zod
- **Package Manager:** pnpm

## 📁 Project Structure

```
gym/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Authentication pages (signin/signup)
│   │   ├── (admin)/         # Admin dashboard pages
│   │   │   ├── dashboard/
│   │   │   ├── members/
│   │   │   ├── trainers/
│   │   │   ├── plans/
│   │   │   ├── attendance/
│   │   │   ├── payments/
│   │   │   └── settings/
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page (redirects to signin)
│   ├── components/
│   │   └── ui/              # shadcn/ui components
│   ├── lib/
│   │   ├── supabase/        # Supabase clients (client & server)
│   │   └── utils.ts
│   ├── features/            # Feature-based modules
│   │   ├── auth/
│   │   ├── dashboard/
│   │   └── members/
│   ├── types/               # TypeScript type definitions
│   ├── constants/           # App constants and configs
│   ├── utils/               # Utility functions
│   └── middleware.ts        # Auth middleware
├── public/
├── .env.example             # Environment variables template
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- A Supabase account (free tier works great!)

### Installation

1. **Clone the repository** (if not already in this directory)
   ```bash
   cd c:\Users\Narendra\Desktop\gym
   ```

2. **Install dependencies** (already done ✅)
   ```bash
   pnpm install
   ```

3. **Set up Supabase**
   
   a. Go to [https://supabase.com](https://supabase.com) and create a new project
   
   b. Copy your project URL and anon key from Project Settings > API
   
   c. Create a `.env.local` file in the root directory:
   ```bash
   # Copy the example file
   copy .env.example .env.local
   ```
   
   d. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_NAME=GymFlow
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase database** (Run these SQL commands in Supabase SQL Editor)

   ```sql
   -- Enable UUID extension
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   -- Create profiles table
   CREATE TABLE profiles (
     id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
     full_name TEXT,
     role TEXT DEFAULT 'admin',
     avatar_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
   );

   -- Enable Row Level Security
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Users can view own profile" ON profiles
     FOR SELECT USING (auth.uid() = id);

   CREATE POLICY "Users can update own profile" ON profiles
     FOR UPDATE USING (auth.uid() = id);
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Usage

### Creating an Admin Account

1. Go to [http://localhost:3000/signup](http://localhost:3000/signup)
2. Fill in your details and create an account
3. Check your email for verification (if email confirmation is enabled in Supabase)
4. Sign in at [http://localhost:3000/signin](http://localhost:3000/signin)

### Default Features Available

- ✅ **Sign In/Sign Up Pages** - Fully functional with Supabase auth
- ✅ **Admin Dashboard** - Beautiful overview with stats
- ✅ **Responsive Layout** - Works on mobile and desktop
- ✅ **Protected Routes** - Middleware protects admin pages
- ⏳ **Member Management** - Coming next!
- ⏳ **Payment Processing** - Coming next!

## 🎨 Design Features

- **Glassmorphism** - Modern glass-effect cards
- **Gradient Backgrounds** - Beautiful animated gradients
- **Smooth Animations** - Powered by Framer Motion
- **Dark Mode** - Elegant dark theme throughout
- **Responsive Design** - Mobile-first approach
- **Micro-interactions** - Delightful hover and click effects

## 🔒 Security

- JWT-based authentication via Supabase
- Protected routes with middleware
- Secure password handling
- Row Level Security (RLS) in database

## 📦 Available Scripts

```bash
# Development
pnpm dev          # Start dev server with Turbopack
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint

# Components
npx shadcn@latest add [component-name]  # Add new shadcn component
```

## 🌟 Next Steps

To continue building your gym management system:

1. **Add Database Tables** - Create tables for members, trainers, plans, etc.
2. **Implement CRUD Operations** - Add functionality for managing members
3. **Add Charts** - Use Recharts for analytics visualization
4. **Payment Integration** - Connect Razorpay or Stripe
5. **Email Notifications** - Set up automated emails
6. **Reports** - Generate PDF reports for members

## 🤝 Contributing

This is your personal project! Feel free to customize it as needed.

## 📄 License

Private project - All rights reserved

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- shadcn for the beautiful UI components
- Supabase for the backend infrastructure
- Framer Motion for smooth animations

---

Built with ❤️ using Next.js 16, shadcn/ui, Framer Motion, and Supabase

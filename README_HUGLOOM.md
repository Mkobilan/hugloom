# HugLoom - ElderCare Connect

HugLoom is a social-first app for caregivers, designed to be a "Facebook for caregivers" with a cozy, supportive aesthetic.

## Features Implemented

### 1. Core Social Features
- **Community Feed**: Share posts, view updates from your circle.
- **Interactions**: "Hug" posts, comment, and share.
- **Create Post**: Share what's on your heart with text and media support (UI).

### 2. Care Coordination
- **Care Calendar**: Monthly view of appointments and tasks.
- **Medications Tracker**: List medications and log doses.
- **Dashboard**: Quick access to tasks, chats, and local support.

### 3. Authentication & Security
- **Supabase Auth**: Magic Link login flow.
- **RLS Policies**: Basic security for user data.
- **Middleware**: Route protection for dashboard and internal pages.

### 4. Design System
- **Cozy Aesthetic**: Terracotta, Sage, and Cream color palette.
- **Typography**: Manrope (Headings), Inter (Body), Kalam (Handwritten).
- **Components**: Custom "Soft Card" UI with gentle shadows and rounded corners.

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Environment Variables**:
   Ensure `.env.local` is populated with your Supabase keys:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

3. **Database Setup**:
   Run the SQL in `supabase/schema.sql` in your Supabase SQL Editor to set up tables and policies.

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## Next Steps
- **Mobile App**: Run `npx expo start` to launch the mobile version (requires Expo setup).
- **Real-time**: Enable Supabase Realtime for instant feed updates.
- **Marketplace**: Build the marketplace for medical goods.
- **Private Groups**: Implement group creation and joining logic.

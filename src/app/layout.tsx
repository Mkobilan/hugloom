import type { Metadata, Viewport } from "next";
import { Manrope, Inter, Kalam } from "next/font/google";
import "./globals.css";

import { NotificationListener } from "@/components/notifications/NotificationListener";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";
import { ChunkErrorHandler } from "@/components/ChunkErrorHandler";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const kalam = Kalam({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-hand",
});

export const metadata: Metadata = {
  title: {
    template: '%s | HugLoom',
    default: 'HugLoom - Caregiver Support & Community',
  },
  description: "Join HugLoom, the supportive community for caregivers. Manage care schedules, track medications, and find emotional support. The 'Facebook for Caregivers'.",
  keywords: [
    "Caregiver App", "Elder Care Support", "Caregiver Support Group", "Family Caregiver App", "Dementia Care App",
    "Care Calendar", "Medication Tracker", "Caregiver Forum", "Elderly Care", "Care Coordination"
  ],
  verification: {
    google: 'wnwX0v0OGT7E25CuYA6r3_NjExggVU9PFITJXnpMp8U',
  },
  openGraph: {
    title: 'HugLoom - Caregiver Support & Community',
    description: "Join HugLoom, the supportive community for caregivers. Manage care schedules, track medications, and find emotional support.",
    siteName: 'HugLoom',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HugLoom - Caregiver Support & Community',
    description: "Join HugLoom, the supportive community for caregivers.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "HugLoom",
  },
};

export const viewport: Viewport = {
  themeColor: "#e11d48",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import { Toaster } from 'sonner';

import { AppearanceProvider } from "@/components/providers/AppearanceProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${inter.variable} ${kalam.variable} antialiased bg-background text-foreground font-sans`}
      >
        <AppearanceProvider>
          <ChunkErrorHandler />
          <ServiceWorkerRegistration />
          <NotificationListener />
          <Toaster position="top-center" />
          {children}
        </AppearanceProvider>
      </body>
    </html>
  );
}

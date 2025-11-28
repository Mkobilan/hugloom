import type { Metadata, Viewport } from "next";
import { Manrope, Inter, Kalam } from "next/font/google";
import "./globals.css";

import { NotificationListener } from "@/components/notifications/NotificationListener";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";

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
  title: "HugLoom - Caregiver Community",
  description: "A social hub for caregivers.",
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
          <ServiceWorkerRegistration />
          <NotificationListener />
          <Toaster position="top-center" />
          {children}
        </AppearanceProvider>
      </body>
    </html>
  );
}

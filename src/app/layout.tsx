import type { Metadata } from "next";
import { Manrope, Inter, Kalam } from "next/font/google";
import "./globals.css";

import { NotificationListener } from "@/components/notifications/NotificationListener";

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
  title: "HugLoom - ElderCare Connect",
  description: "A social hub for caregivers.",
};

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} ${inter.variable} ${kalam.variable} antialiased bg-background text-foreground font-sans`}
      >
        <NotificationListener />
        <Toaster position="top-center" />
        {children}
      </body>
    </html>
  );
}

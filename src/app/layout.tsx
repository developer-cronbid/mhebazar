import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteLayout from "@/components/layout/SiteLayout";
import { Suspense } from "react";
import Loading from "./loading";
import { Toaster } from "sonner";
import { UserProvider } from "@/context/UserContext";
import WhatsAppChat from "@/components/elements/WhatsAppChat";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// A simple version number to force browser to re-fetch the favicon
const FAVICON_VERSION = 'v1.2'; // Changed version to force cache refresh

export const metadata: Metadata = {
  title: "Material Handling Equipment Manufacturer and Supplier in India | MHE Bazar",
  description: "MHE Bazar is a leading supplier of material handling equipment like forklifts, scissor lifts, and reach trucks. Rentals, sales, and maintenance are available in India.",
  icons: {
    icon: [
      { url: `/favicon.ico?v=${FAVICON_VERSION}` },
      { url: `/favicon-16x16.png?v=${FAVICON_VERSION}`, sizes: "16x16", type: "image/png" },
      { url: `/favicon-32x32.png?v=${FAVICON_VERSION}`, sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: `/apple-touch-icon.png?v=${FAVICON_VERSION}`, sizes: "180x180" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Yahaan par hum manual favicon link add kar rahe hain */}
        <link rel="icon" href={`/favicon.ico?v=${FAVICON_VERSION}`} sizes="any" />
        {/* Cache-control meta tag to prevent caching */}
        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta http-equiv="Pragma" content="no-cache" />
        <meta http-equiv="Expires" content="0" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased font-inter`}>
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            className: "bg-white text-gray-800 shadow-lg",
            style: {
              fontFamily: "var(--font-geist-sans)",
              fontSize: "14px",
            },
          }}
        />

        <UserProvider>
          <SiteLayout>
            <Suspense fallback={<Loading />}>
              {children}
            </Suspense>
          </SiteLayout>
          <WhatsAppChat />
        </UserProvider>
      </body>
    </html>
  );
}

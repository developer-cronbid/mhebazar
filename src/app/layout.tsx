import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SiteLayout from "@/components/layout/SiteLayout";
import { Suspense } from "react";
import Loading from "./loading";
import { Toaster } from "sonner";
import { UserProvider } from "@/context/UserContext";
import WhatsAppChat from "@/components/elements/WhatsAppChat";

// Import Inter font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Favicon version for cache busting
const FAVICON_VERSION = "v1.2";

export const metadata: Metadata = {
  title: "Material Handling Equipment Manufacturer and Supplier in India | MHE Bazar",
  description:
    "MHE Bazar is a leading supplier of material handling equipment like forklifts, scissor lifts, and reach trucks. Rentals, sales, and maintenance are available in India.",
  icons: {
    icon: [
      { url: `/favicon.ico?v=${FAVICON_VERSION}` },
      {
        url: `/favicon-16x16.png?v=${FAVICON_VERSION}`,
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: `/favicon-32x32.png?v=${FAVICON_VERSION}`,
        sizes: "32x32",
        type: "image/png",
      },
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
    <html lang="en" className={inter.variable}>
      <head>
        {/* Manual favicon link */}
        <link
          rel="icon"
          href={`/favicon.ico?v=${FAVICON_VERSION}`}
          sizes="any"
        />
        {/* Cache-control to prevent caching */}
        <meta
          httpEquiv="Cache-Control"
          content="no-cache, no-store, must-revalidate"
        />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className="antialiased font-sans">
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            className: "bg-white text-gray-800 shadow-lg",
            style: {
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
            },
          }}
        />

        <UserProvider>
          <SiteLayout>
            <Suspense fallback={<Loading />}>{children}</Suspense>
          </SiteLayout>
          <WhatsAppChat />
        </UserProvider>
      </body>
    </html>
  );
}

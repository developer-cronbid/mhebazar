import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SiteLayout from "@/components/layout/SiteLayout";
import { Suspense } from "react";
import Loading from "./loading";
import { Toaster } from "sonner";
import { UserProvider } from "@/context/UserContext";
import Script from "next/script";
import Canonical from "@/components/Canonical"; // Assuming this is the correct path
import "@/utils/disableConsole"; // Import the console disabling utility

// Import Inter font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Favicon version for cache busting
const FAVICON_VERSION = "v1.2";

export const metadata: Metadata = {
  title:
    "Material Handling Equipment Manufacturer and Supplier in India | MHE Bazar",
  description:
    "MHE Bazar is a leading supplier of material handling equipment like forklifts, scissor lifts, and reach trucks. Rentals, sales, and maintenance are available in India.",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

// --- FIX 1: Move viewport config from 'metadata' to the dedicated 'viewport' export ---
// This permanently addresses the 'Unsupported metadata viewport' warning.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};
// -----------------------------------------------------------------------------------

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://api.mhebazar.in" />
        
        {/* Microsoft Clarity Tracking Script */}
        <Script
          id="clarity-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "tkd3v3kvbs");
            `,
          }}
        />
        
        {/* MANDATORY FIX: Canonical tags must be wrapped in Suspense.
            This allows client-side hooks (usePathname, useSearchParams) to resolve
            in a component rendered in the static RootLayout's <head>.
        */}
        <Suspense>
          <Canonical />
        </Suspense> 
        {/* ----------------------------------------------------------- */}
        
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
        </UserProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SiteLayout from "@/components/layout/SiteLayout";
import { Suspense } from "react";
import Loading from "./loading";
import { Toaster } from "sonner";
import { UserProvider } from "@/context/UserContext";
import Script from "next/script";
import Canonical from "@/components/Canonical";
import "@/utils/disableConsole";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
  // ✅ FIX: Moved 'verification' OUTSIDE of 'icons'
  verification: {
    google: "ipMSyejTl5WkQNzT5LVvc4U4ykIzonjK5xBhqDQoyFM",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        
        {/* CWV FIX: Add preconnect hints for faster resource loading (TTFB/LCP) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://api.mhebazar.in" />
        {/* Assuming NEXT_PUBLIC_API_BASE_URL might be different */}
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_BASE_URL} /> 

        {/* Google Analytics Script - Strategy 'afterInteractive' is good */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-QV2CVBNETT"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-QV2CVBNETT');
            `,
          }}
        />

        {/* Microsoft Clarity - Strategy 'afterInteractive' is good */}
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

        {/* Product JSON-LD Schema (Ensure this is valid JSON to prevent CLS or errors) */}
       

        <Suspense>
          <Canonical />
        </Suspense>
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
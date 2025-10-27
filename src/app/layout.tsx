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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://api.mhebazar.in" />

        {/* ✅ Google Analytics Script */}
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

        {/* Microsoft Clarity */}
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

        {/* Product JSON-LD Schema */}
        {/* ✅ Product JSON-LD Schema (from SEO team) */}
        <Script
          id="product-schema"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              {
                "@context": "https://schema.org/",
                "@type": "Product",
                "name": "{{instance.name}}",
                "image": "https://{{ request.get_host }}{{instance.list_pic.url}}",
                "description": "{{instance.About_Tour|striptags}}",
                "mpn": "",
                "offers": {
                  "@type": "AggregateOffer",
                  "url": "https://{{ request.get_host }}{{ request.path }}",
                  "priceCurrency": "INR",
                  "price": "{{instance.price_striked}}"
                }
              }
            `,
          }}
        />

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

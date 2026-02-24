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
  verification: {
    google: "ipMSyejTl5WkQNzT5LVvc4U4ykIzonjK5xBhqDQoyFM",
    other: {
      "msvalidate.01": "4D950976E7CE3FE0672C1877057600CE",
    },
  },
  other: {
    "ahrefs-site-verification":
      "f00084defcc447953c70500593c316fa8f9da95dfa69d289a02069a7f3304e88",
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

        {/* Preconnects */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://api.mhebazar.in" />

        {/* ✅ Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];
              w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
              var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
              j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;
              f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-MV4K7WG');
            `,
          }}
        />

        {/* ✅ Organization Schema */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              legalName: "mhebazar",
              url: "https://www.mhebazar.in/",
              logo: "https://www.mhebazar.in/mhe-logo.png",
              contactPoint: {
                "@type": "ContactPoint",
                telephone: "+91 928 909 4445",
                contactType: "customer service",
              },
              address: {
                "@type": "PostalAddress",
                streetAddress:
                  "E-228, Goyla Vihar, Block D, Lajpat Nagar I, Lajpat Nagar",
                addressLocality: "New Delhi",
                addressRegion: "Delhi",
                postalCode: "110024",
                addressCountry: "IN",
              },
              sameAs: [
                "https://www.linkedin.com/company/mhe-bazar/",
                "https://www.instagram.com/mhebazar.in/",
                "https://www.facebook.com/mhebazar.in/",
                "https://www.youtube.com/@mhebazar",
              ],
            }),
          }}
        />

        <Script
          id="homepage-breadcrumb-schema"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Material Handling Equipment Manufacturer and Supplier in India | MHE Bazar",
                  "item": "https://www.mhebazar.in/"
                }
              ]
            })
          }}
        />

        <Suspense>
          <Canonical />
        </Suspense>
      </head>

      <body className="antialiased font-sans">
        {/* ✅ GTM NoScript */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MV4K7WG"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <Toaster position="top-right" richColors closeButton />

        <UserProvider>
          <SiteLayout>
            <Suspense fallback={<Loading />}>{children}</Suspense>
          </SiteLayout>
        </UserProvider>
      </body>
    </html>
  );
}
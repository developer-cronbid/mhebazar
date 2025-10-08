import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SiteLayout from "@/components/layout/SiteLayout";
import { Suspense } from "react";
import Loading from "./loading";
import { Toaster } from "sonner";
import { UserProvider } from "@/context/UserContext";
import Script from "next/script";
import { headers } from "next/headers";

// Font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// ✅ Dynamically generate metadata for each page (SSR, no "use client")
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = "https://www.mhebazar.in";
  const headersList = headers();
  const currentPath = (await headersList).get("x-invoke-path") || "/";

  // Safely build canonical URL
  const canonicalUrl = `${baseUrl}${currentPath === "/" ? "" : currentPath}`;

  return {
    title:
      "Material Handling Equipment Manufacturer and Supplier in India | MHE Bazar",
    description:
      "MHE Bazar is a leading supplier of material handling equipment like forklifts, scissor lifts, and reach trucks. Rentals, sales, and maintenance are available in India.",
    alternates: {
      canonical: canonicalUrl, // ✅ Auto per-page canonical
    },
    icons: {
      icon: [
        { url: "/favicon-32x32.png", sizes: "any" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    viewport: {
      width: "device-width",
      initialScale: 1,
      maximumScale: 1,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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

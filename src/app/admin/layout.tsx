import Navbar from "@/components/admin/Navbar";
import Sidebar from "@/components/admin/Sidebar";
import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";



// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Material Handling Equipment Manufacturer and Supplier in India | MHE Bazar",
  description: "MHE Bazar is a leading supplier of material handling equipment like forklifts, scissor lifts, and reach trucks. Rentals, sales, and maintenance are available in India.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Navbar />
            {children}
          </div>
        </div>
  );
}

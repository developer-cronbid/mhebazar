import Navbar from "@/components/admin/Navbar";
import Sidebar from "@/components/admin/Sidebar";
import type { Metadata } from "next";

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
          <div className="flex-1 flex flex-col overflow-y-auto">
            <Navbar />
            {/* The main scrolling content area is now enabled with overflow-y-auto */}
            {children}
          </div>
        </div>
  );
}

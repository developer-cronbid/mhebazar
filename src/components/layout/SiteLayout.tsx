"use client";
import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import WhatsAppChat from "@/components/elements/WhatsAppChat";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Agar route /admin se start hota hai toh Navbar/Footer/WhatsApp mat dikhao
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }
  return (
    <>
      <Navbar />
      <div className="">
        {children}
      </div>
      <Footer />
      <WhatsAppChat />
    </>
  );
}
// "use client";
// import { usePathname } from "next/navigation";
// import Navbar from "@/components/layout/Nav";
// import Footer from "@/components/layout/Footer";
// import WhatsAppChat from "@/components/elements/WhatsAppChat";

// export default function SiteLayout({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname();
//   // Hide navbar/footer for admin and home maintenance page
//   if (pathname.startsWith("/admin") || pathname === "/") {
//     return <>{children}</>;
//   }
//   return (
//     <>
//       <Navbar />
//       <div className="">
//         {children}
//       </div>
//       <Footer />
//       <WhatsAppChat />
//     </>
//   );
// }

"use client";
import Maintenance from "@/components/Maintenance";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <Maintenance />;
}
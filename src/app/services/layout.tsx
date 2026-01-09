// src/app/services/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AMC & CMC Services for Material Handling Equipment | MHEBazar",
  description: "Discover reliable CMC maintenance services for your equipment. Ensure peak performance with MHEBazar’s expert solutions. Contact us today!",
  openGraph: {
    title: "AMC Services for Equipment Maintenance | MHEBazar",
    description: "Discover reliable CMC maintenance services for your equipment.",
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
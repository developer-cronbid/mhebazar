// src/app/training/layout.tsx
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Expert Training in Material Handling Equipment | Enhance Your Skills with MHEBazar",
  description: "Get expert Workplace Safety Training and improve efficiency. Learn the best practices in material handling with MHEBazar. Register now!",
  openGraph: {
    title: "Material Handling Equipment Training | MHEBazar",
    description: "Get expert Workplace Safety Training and improve efficiency.",
  },
};

export default function TrainingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
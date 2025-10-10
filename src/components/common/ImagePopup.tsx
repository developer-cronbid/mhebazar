"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";

const ImagePopup = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div className="relative pointer-events-auto animate-scaleIn">
        {/* Close button */}
        <button
          onClick={() => setShow(false)}
          aria-label="Close popup"
          className="absolute -top-3 -right-3 bg-black/80 hover:bg-black p-2 rounded-full transition"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Image */}
        <Image
          src="/invite.jpg"
          alt="Invite"
          width={700}
          height={450}
          priority
          className="max-w-[90vw] max-h-[85vh] object-contain"
        />
      </div>

      {/* Tailwind animation */}
      <style jsx>{`
        @keyframes scaleIn {
          0% {
            transform: scale(0.5) rotate(-5deg);
            opacity: 0;
          }
          70% {
            transform: scale(1.05) rotate(2deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }
        .animate-scaleIn {
          animation: scaleIn 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ImagePopup;

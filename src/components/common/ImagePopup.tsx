"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";

const ImagePopup = () => {
  const [show, setShow] = useState(false);
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    // Show popup after 3 seconds
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShow(false);
    setMinimized(true);
  };

  return (
    <>
      {/* Full Image Popup */}
      {show && (
        // **************************************************************************
        // *** CRITICAL FIX: Added `bg-transparent` to ensure the overlay is clear.
        // **************************************************************************
        <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none bg-white/30 backdrop-blur-md">
          <div className="relative inline-block pointer-events-auto">
            <button
              onClick={handleClose}
              // Close button is now positioned on the corner of the image
              className="absolute -top-4 -right-4 bg-black/80 hover:bg-black p-1.5 rounded-full z-10 shadow-lg"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <Image
              src="/invite.jpg"
              alt="Invite"
              width={450}
              height={450}
              priority
              className="max-w-[90vw] max-h-[100vh]"
            />
          </div>
        </div>
      )}

      {/* Minimized Thumbnail */}
      {minimized && !show && (
        <div
          className="fixed bottom-8 left-8 z-[9999] animate-thumbnailIn cursor-pointer"
          onClick={() => setShow(true)}
        >
          <Image
            src="/invite.jpg"
            alt="Invite Thumbnail"
            width={100}
            height={100}
            className=" shadow-lg object-cover"
          />
        </div>
      )}

      {/* Animations */}
      <style jsx>{`
        @keyframes thumbnailIn {
          0% {
            transform: translateY(-100vh) scale(0.5);
            opacity: 0;
          }
          60% {
            transform: translateY(0) scale(1.1);
            opacity: 1;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        .animate-thumbnailIn {
          animation: thumbnailIn 0.7s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default ImagePopup;
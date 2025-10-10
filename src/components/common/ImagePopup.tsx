"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";

const ImagePopup = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-[2px]"
        >
          {/* Close Button */}
          <motion.button
            onClick={() => setShow(false)}
            whileHover={{ rotate: 90, scale: 1.1 }}
            className="absolute top-6 right-6 md:top-10 md:right-10 p-3 rounded-full backdrop-blur-md bg-white/60 hover:bg-white/80 shadow-lg transition-all duration-300"
          >
            <X className="w-6 h-6 text-gray-900" />
          </motion.button>

          {/* Image Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative rounded-2xl shadow-2xl"
          >
            <Image
              src="/invite.jpg"
              alt="Invite"
              width={800}
              height={500}
              priority
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.25)]"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImagePopup;

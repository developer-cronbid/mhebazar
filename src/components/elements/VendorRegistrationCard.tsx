'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import VendorRegistrationDrawer from '@/components/forms/publicforms/VendorRegistrationForm';

export default function VendorRegistrationCard() {
  const [vendorDrawerOpen, setVendorDrawerOpen] = useState(false);
  const cardRef = useRef(null);
  const inView = useInView(cardRef, { once: true, amount: 0.5 });

  return (
    <section className="w-full px-4 py-4">
      <div className="max-w-[1780px] mx-auto">
        {/* Animated card */}
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 15 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          {/* Left image with fade */}
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={inView ? { x: 0, opacity: 1 } : { x: -100, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative w-full sm:w-[600px] h-[160px] sm:h-[180px]" // Reduced height on mobile
          >
            <Image
              src="/vendorcard.png"
              alt="Register Now"
              fill
              className="object-cover"
              priority
            />
            {/* Responsive gradient: bottom-to-top on mobile, left-to-right on larger screens */}
            <div className="absolute inset-0 bg-gradient-to-b sm:bg-gradient-to-r from-transparent via-white/70 to-white" />
          </motion.div>

          {/* Right content */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={inView ? { x: 0, opacity: 1 } : { x: 100, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-1 flex-col sm:flex-row items-center justify-between gap-4 px-4 py-6 sm:px-8" // Added responsive flex and padding
          >
            <h3 className="text-xl sm:text-[26px] font-bold text-gray-800">
              Vendor registration
            </h3>
            <button
              onClick={() => setVendorDrawerOpen(true)}
              className="bg-[#5CA131] hover:bg-[#4b8527] text-white text-sm sm:text-[18px] px-6 py-2 sm:px-8 sm:py-3 rounded-md transition duration-300 transform hover:scale-105"
            >
              Register Now
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Drawer */}
      <VendorRegistrationDrawer
        open={vendorDrawerOpen}
        onClose={() => setVendorDrawerOpen(false)}
      />
    </section>
  );
}
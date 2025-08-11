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
            className="relative w-full sm:w-[600px] h-[200px] sm:h-[180px]"
          >
            <Image
              src="/vendorcard.png"
              alt="Register Now"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/70 to-white" />
          </motion.div>

          {/* Right content */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={inView ? { x: 0, opacity: 1 } : { x: 100, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-1 items-center justify-between px-8 py-6"
          >
            <h3 className="text-[26px] font-bold text-gray-800">
              Vendor registration
            </h3>
            <button
              onClick={() => setVendorDrawerOpen(true)}
              className="bg-[#5CA131] hover:bg-[#4b8527] text-white text-[18px] px-8 py-3 rounded-md transition duration-300 transform hover:scale-105"
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
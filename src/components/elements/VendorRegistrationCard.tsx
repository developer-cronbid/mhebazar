'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import VendorRegistrationDrawer from '@/components/forms/publicforms/VendorRegistrationForm';

export default function VendorRegistrationCard() {
  const [vendorDrawerOpen, setVendorDrawerOpen] = useState(false);

  return (
    <section className="w-full px-4 py-4">
      <div className="max-w-[1780px] mx-auto">
        {/* Animated card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col sm:flex-row w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          {/* Left image with fade */}
          <div className="relative w-full sm:w-[420px] h-[180px] sm:h-[160px]">
            <Image
              src="/vendorcard.png"
              alt="Register Now"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/80 to-white" />
          </div>

          {/* Right content */}
          <div className="flex flex-1 items-center justify-between px-8 py-6">
            <h3 className="text-[22px] font-bold text-gray-800">
              Vendor registration
            </h3>
            <button
              onClick={() => setVendorDrawerOpen(true)}
              className="bg-[#5CA131] hover:bg-[#4b8527] text-white text-[16px] px-8 py-3 rounded-md transition duration-300 transform hover:scale-105"
            >
              Register Now
            </button>
          </div>
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

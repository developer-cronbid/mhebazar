'use client';

import Image from 'next/image';

export default function VendorRegistrationCard() {
  return (
    <section className="w-full px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
          {/* Left image with fade */}
          <div className="relative w-[40%] h-[160px] sm:h-[180px] md:h-[200px] lg:h-[220px]">
            <Image
              src="/vendorcard.png"
              alt="Register Now"
              fill
              className="object-cover"
              priority
            />
            {/* Fade overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/70 to-white" />
          </div>

          {/* Right content */}
          <div className="flex flex-1 items-center justify-between px-6 py-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-800">
              Vendor registration
            </h3>
            <button className="bg-[#5CA131] hover:bg-green-700 text-white text-sm md:text-base font-medium px-5 py-2 rounded-md transition">
              Register Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

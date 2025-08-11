'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';

// Updated data with values from the provided image
const data = [
  { country: 'India', impressions: 438634 },
  { country: 'United States', impressions: 42076 },
  { country: 'Brazil', impressions: 13830 },
  { country: 'United Kingdom', impressions: 9466 },
  { country: 'Australia', impressions: 5628 },
  { country: 'Vietnam', impressions: 5059 },
  { country: 'Russia', impressions: 4577 },
  { country: 'Indonesia', impressions: 3574 },
  { country: 'Canada', impressions: 3516 },
  { country: 'Malaysia', impressions: 3225 },
  { country: 'South Korea', impressions: 3431 },
  { country: 'United Arab Emirates', impressions: 3150 },
  { country: 'Philippines', impressions: 2820 },
  { country: 'Saudi Arabia', impressions: 2503 },
  { country: 'Germany', impressions: 2259 },
  { country: 'Italy', impressions: 2241 },
  { country: 'Singapore', impressions: 2213 },
];

export default function GlobalMapStats() {
  const [activeTab, setActiveTab] = useState<'impressions' | 'clicks'>('impressions');

  const isTabSwitchingEnabled = false;

  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, amount: 0.2 });

  // Animation variants for the table rows
  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: 'easeOut',
      },
    }),
  };

  return (
    <section ref={sectionRef} className="w-full bg-white py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Global Map</h2>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === 'impressions'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-gray-800'
            }`}
            onClick={() => {
              if (isTabSwitchingEnabled) setActiveTab('impressions');
            }}
          >
            Worldwide Impressions
          </button>
          <button
            className="px-4 py-2 rounded-md text-sm font-medium bg-green-100 text-gray-800"
            onClick={() => {
              if (isTabSwitchingEnabled) setActiveTab('clicks');
            }}
          >
            Date - 1st July - 31st July 2024
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Map Image */}
          <div className="flex-1 lg:flex-none lg:w-[60%]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="max-w-[520px] mx-auto"
            >
              <Image
                src="/about/map.png"
                alt="Global Impressions Map"
                width={520}
                height={300}
                className="w-full h-auto object-contain "
                priority
              />
            </motion.div>
          </div>

          {/* Table */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            className="w-full lg:w-80"
          >
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-50 border-b border-gray-200">
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">Country</th>
                    <th className="py-3 px-4 text-left font-semibold text-gray-700">Impressions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map(({ country, impressions }, index) => (
                    <motion.tr
                      key={country}
                      initial="hidden"
                      animate={inView ? "visible" : "hidden"}
                      variants={rowVariants}
                      custom={index}
                      className="border-b bg-white hover:bg-green-50 transition-colors"
                    >
                      <td className="py-2 px-4 text-gray-700">{country}</td>
                      <td className="py-2 px-4 text-gray-700">
                        {activeTab === 'impressions' ? impressions : Math.floor(impressions / 5)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
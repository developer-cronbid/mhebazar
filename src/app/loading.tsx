'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Forklift GIF */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Image
          src="/forklift.gif"
          alt="Loading..."
          width={200}
          height={200}
          priority
          unoptimized // ensures GIF animation plays correctly
        />
      </motion.div>

      {/* Loading text */}
      <motion.p
        className="mt-6 text-lg font-semibold text-gray-700"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        Loading, please wait...
      </motion.p>
    </motion.div>
  );
}

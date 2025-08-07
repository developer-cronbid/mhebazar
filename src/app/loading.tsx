'use client';

import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center space-y-6">
        {/* Animated Rings */}
        <div className="relative">
          {/* Outer Ring */}
          <motion.div
            className="w-20 h-20 border-4 border-blue-200 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <motion.div
              className="absolute top-0 left-0 w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.div>

          {/* Inner Ring */}
          <motion.div
            className="absolute inset-2 w-12 h-12 border-4 border-purple-200 rounded-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <motion.div
              className="absolute top-0 left-0 w-3 h-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transform -translate-x-1/2 -translate-y-1/2"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          </motion.div>

          {/* Center Dot */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  // 💥 ADD THIS NEW COMPILER BLOCK HERE
    compiler: {
        // Only apply this removal logic when building for production
        removeConsole: process.env.NODE_ENV === 'production'
            ? {
                // Configure SWC to exclude (i.e., keep) only 'error' and 'warn' calls.
                // All other console.* methods (log, info, debug, etc.) will be removed.
                // This is the safest way, as console.error/warn often capture critical, unhandled issues.
                exclude: ['log','error','warn', 'info', 'debug', 'trace', 'dir', 'dirxml', 'assert', 'count', 'time', 'timeEnd', 'group', 'groupCollapsed', 'groupEnd', 'profile', 'profileEnd', 'table', 'clear', 'timeStamp'],
            }
            // In development, set it to false to keep all console statements working
            : false,
    },
    // ------------------------------------

  images: {
    unoptimized: true, // Disable Next.js image optimization
    domains: [
      "api.mhebazar.in",
      "mheback.onrender.com",
      "placehold.co",
      "mhebazar.in",
      "www.mhebazar.in",
      "images.unsplash.com",
      "randomuser.me",
      "ui-avatars.com",
      "localhost",
    ],
    remotePatterns: [
      {
        protocol: "http", // Allowing http protocol
        hostname: "api.mhebazar.in",
        pathname: "/media/**",
      },
      {
        protocol: "https", // Allowing https protocol as well
        hostname: "api.mhebazar.in",
        pathname: "/media/**",
      },
      {
        protocol: 'https',
        hostname: 'mheback.onrender.com',
        port: '',
        pathname: '/media/**', // Or be more specific if needed
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "mhebazar.in",
      },
      {
        protocol: "https",
        hostname: "www.mhebazar.in",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "randomuser.me",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: '/favicon-32x32.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/favicon-16x16.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/favicon-32x32.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/apple-touch-icon.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

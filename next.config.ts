import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // api.mhebazar.in (http + https, all paths)
      {
        protocol: "http",
        hostname: "api.mhebazar.in",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.mhebazar.in",
        pathname: "/**",
      },

      // mhebazar.in (http + https, with + without www, all paths)
      {
        protocol: "http",
        hostname: "mhebazar.in",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "mhebazar.in",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "www.mhebazar.in",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.mhebazar.in",
        pathname: "/**",
      },

      // Baaki jo pehle the unko rakh sakte ho
      {
        protocol: "https",
        hostname: "placehold.co",
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
        pathname: "/**",
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
        source: '/favicon.ico',
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

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mheback.onrender.com",
        pathname: "/media/**", // This is important for dynamic media paths
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
        hostname: "mheback.onrender.com",
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
};

export default nextConfig;

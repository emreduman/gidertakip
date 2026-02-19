import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Rebuild trigger 2026-01-21T15:43:00
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;

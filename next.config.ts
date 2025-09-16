import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'platform-lookaside.fbsbx.com',
      },
      {
        protocol: 'https',
        hostname: 'scontent.xx.fbcdn.net',
      },
      {
        protocol: 'https',
        hostname: 'scontent.fpnh10-1.fna.fbcdn.net',
      },
    ],
  },
  transpilePackages: ["geist"],
  /* config options here */
};

export default nextConfig;

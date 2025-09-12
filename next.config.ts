import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['platform-lookaside.fbsbx.com', 'scontent.xx.fbcdn.net', 'scontent.fpnh10-1.fna.fbcdn.net'],
  },
  transpilePackages: ["geist"],
  /* config options here */
};

export default nextConfig;

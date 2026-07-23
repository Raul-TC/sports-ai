import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imagecache.365scores.com"
      },
    ],
  },
};

export default nextConfig;
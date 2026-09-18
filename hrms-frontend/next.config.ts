import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },

  allowedDevOrigins: ["192.168.31.250"],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },

  allowedDevOrigins: ["192.168.31.250"],

  experimental: {
    // Load only the modules actually used from these barrel-style packages
    // (speeds up dev compiles and shrinks bundles).
    optimizePackageImports: ["recharts", "framer-motion", "date-fns", "lucide-react"],
  },
};

export default nextConfig;

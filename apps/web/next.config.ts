import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.congress.gov" },
      { protocol: "https", hostname: "bioguide.congress.gov" },
      { protocol: "https", hostname: "**.fec.gov" },
    ],
  },
};

export default nextConfig;
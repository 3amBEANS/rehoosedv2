import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // When you open the dev server via Network (e.g. http://172.26.x.x:3000), add
  // comma-separated hostnames to .env.local: ALLOWED_DEV_ORIGINS=172.26.79.127
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS
    ? process.env.ALLOWED_DEV_ORIGINS.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined,
};

export default nextConfig;

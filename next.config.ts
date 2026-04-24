import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [new URL("https://images.unsplash.com/**")],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

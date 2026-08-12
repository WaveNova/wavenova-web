import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

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

export default withNextIntl(nextConfig);

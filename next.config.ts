import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true
});

const nextConfig: NextConfig = {
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  }
};

// @ts-expect-error
const finalConfig = process.env.NODE_ENV === 'development' ? nextConfig : withPWA(nextConfig);

export default finalConfig;

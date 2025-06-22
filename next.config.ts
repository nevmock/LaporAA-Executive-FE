import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // appDir: true, // kalau kamu pakai App Router
  },
  webpack: (config, { isServer }) => {
    // Resolve paths with spaces correctly for Next.js build
    config.watchOptions = {
      ...config.watchOptions,
      followSymlinks: false,
    };
    return config;
  },
};

export default withAnalyzer(nextConfig);

import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Remove webpack config when using Turbopack in development
  // Only apply webpack config for production builds
  webpack: process.env.NODE_ENV === 'production' 
    ? (config, { isServer }) => {
        // Resolve paths with spaces correctly for Next.js build
        config.watchOptions = {
          ...config.watchOptions,
          followSymlinks: false,
        };
        return config;
      }
    : undefined,
};

export default withAnalyzer(nextConfig);

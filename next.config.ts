import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Disable image optimization for external URLs to prevent 500 errors
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.laporaabupati.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'webhook.focuson.id',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/**',
      },
    ],
    // Add image loading timeout and error handling
    loader: 'default',
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
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

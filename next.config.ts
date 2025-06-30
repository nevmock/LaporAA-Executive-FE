import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Transpile packages that have ES module issues
  transpilePackages: ['react-medium-image-zoom'],
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
  // Enhanced webpack config to handle ES modules
  webpack: (config, { isServer, dev }) => {
    // Resolve paths with spaces correctly for Next.js build
    config.watchOptions = {
      ...config.watchOptions,
      followSymlinks: false,
    };

    // Handle ES module imports properly
    config.resolve = config.resolve || {};
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
      '.cjs': ['.cts', '.cjs'],
    };

    // Handle ES modules properly
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    return config;
  },
};

export default withAnalyzer(nextConfig);

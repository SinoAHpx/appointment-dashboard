import type { NextConfig } from "next";

/**
 * Next.js configuration with support for Bun's SQLite driver
 */
const nextConfig: NextConfig = {
  /* config options here */
  // Set to false if sqlite operations are failing in production
  productionBrowserSourceMaps: true,

  webpack: (config, { isServer }) => {
    // Configuring webpack to handle bun:sqlite
    if (isServer) {
      // Add bun:sqlite to externals to prevent server bundling issues
      if (!Array.isArray(config.externals)) {
        config.externals = [config.externals].filter(Boolean);
      }

      config.externals.push('bun:sqlite');
    }

    return config;
  },
};

export default nextConfig;

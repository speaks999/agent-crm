import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable source maps to avoid Bun compatibility issues
  // Bun doesn't fully support source maps yet, which causes warnings with Turbopack
  productionBrowserSourceMaps: false,
  // Suppress source map warnings in development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;

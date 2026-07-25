import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Serve the internal Trace Console at the obscure, unadvertised path
      // `/.a2zanalyticsandreports`. The page itself enforces admin access.
      {
        source: "/.a2zanalyticsandreports",
        destination: "/a2zanalyticsandreports",
      },
    ];
  },
};

export default nextConfig;

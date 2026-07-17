import { loadEnvConfig } from "@next/env";
import type { NextConfig } from "next";

// Turbopack/dev sometimes skips .env; load explicitly so /api/gate sees API defaults.
loadEnvConfig(process.cwd());

const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/welcome", destination: "/welcome.html" }];
  },
};

export default nextConfig;

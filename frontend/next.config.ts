import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Giúp HMR ổn định hơn khi dev trên Windows / 127.0.0.1
  allowedDevOrigins: ["127.0.0.1:3000", "localhost:3000"],
};

export default nextConfig;

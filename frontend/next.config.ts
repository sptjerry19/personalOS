import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  allowedDevOrigins: [
    "127.0.0.1:3000",
    "localhost:3000",
    "127.0.0.1:3001",
    "localhost:3001",
  ],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare quick tunnels use a random *.trycloudflare.com host.
  // Next.js 16 blocks cross-origin /_next/hmr unless the host is listed.
  allowedDevOrigins: ["*.trycloudflare.com", "adhd.gawarago.com"],
};

export default nextConfig;

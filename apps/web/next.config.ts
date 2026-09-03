import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Client-only mock — static HTML so Cloudflare Pages can host it.
  output: "export",
  images: {
    unoptimized: true,
  },
  // next dev / cloudflared still need these when serving locally.
  allowedDevOrigins: ["*.trycloudflare.com", "adhd.gawarago.com"],
};

export default nextConfig;

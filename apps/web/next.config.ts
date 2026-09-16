import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  transpilePackages: ["convex"],
};

export default nextConfig;

if (process.env.npm_lifecycle_event === "dev") {
  initOpenNextCloudflareForDev();
}

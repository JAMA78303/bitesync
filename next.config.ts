import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import path from "node:path";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.1.66", "192.168.1.210"],
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

// Enables importing .mdx modules (blog posts live in content/blog/). MDX files
// are not routes here — pageExtensions is deliberately untouched — so a post
// only becomes a page through app/blog/[slug], which controls metadata,
// structured data and layout for all of them.
const withMDX = createMDX({});

export default withMDX(nextConfig);

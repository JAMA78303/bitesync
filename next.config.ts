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
  // One address for the site. www.bitesync.io served a full copy of every
  // page, which search engines count as duplicates of the bitesync.io ones.
  // /api is left alone: webhooks (Stripe) don't follow redirects.
  async redirects() {
    return [
      {
        source: "/:path((?!api/).*)",
        has: [{ type: "host", value: "www.bitesync.io" }],
        destination: "https://bitesync.io/:path",
        permanent: true,
      },
    ];
  },
};

// Enables importing .mdx modules (blog posts live in content/blog/). MDX files
// are not routes here — pageExtensions is deliberately untouched — so a post
// only becomes a page through app/blog/[slug], which controls metadata,
// structured data and layout for all of them.
//
// remark-gfm adds pipe tables, which base MDX (CommonMark) lacks. Without it a
// comparison table renders as literal text with pipes in it — and comparison
// tables are the point of comparison posts. Named as a string rather than an
// import because Turbopack serialises this config and cannot pass a function.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
  },
});

export default withMDX(nextConfig);

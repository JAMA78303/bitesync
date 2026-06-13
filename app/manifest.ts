import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BiteSync",
    short_name: "BiteSync",
    description: "Plan your week to your macro targets and generate your grocery list",
    start_url: "/planner",
    display: "standalone",
    background_color: "#3a5a40",
    theme_color: "#3a5a40",
    icons: [
      {
        src: "/favicon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BiteSync",
    short_name: "BiteSync",
    description: "Plan your week to your macro targets and generate your grocery list",
    start_url: "/planner",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1A4731",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "16x16",
        type: "image/x-icon",
      },
      {
        src: "/icon.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}

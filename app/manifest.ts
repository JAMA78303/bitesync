import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BiteSync",
    short_name: "BiteSync",
    description: "Meal planning and grocery sync",
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
        src: "/icon",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}

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
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/apple-icon.svg",
        sizes: "180x180",
        type: "image/svg+xml",
      },
    ],
  };
}

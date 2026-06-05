import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Thrive — Raise Your Vibration",
    short_name: "Thrive",
    description:
      "An emotionally intelligent ADHD productivity and personal transformation platform.",
    start_url: "/today",
    display: "standalone",
    background_color: "#0b0712",
    theme_color: "#0b0712",
    orientation: "portrait",
    categories: ["health", "lifestyle", "productivity", "wellness"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

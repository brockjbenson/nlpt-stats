import { APP_FULL_NAME, APP_SHORT_NAME } from "@/lib/app-name";
import type { MetadataRoute } from "next";

// The web app manifest, built per deployment so the staging app is named
// as such. Next.js serves it at /manifest.webmanifest and links it.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_FULL_NAME,
    short_name: APP_SHORT_NAME,
    description: "Northern Lights Poker Tour Stats",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      { src: "/icons/nlpt-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/nlpt-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

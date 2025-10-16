import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mi Ticha",
    short_name: "MiTicha",
    description: "AI-powered learning companion for Sierra Leone students and parents.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/placeholder-logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/placeholder-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/placeholder-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
    shortcuts: [
      {
        name: "Open Dashboard",
        short_name: "Dashboard",
        description: "Jump to the parent dashboard to review progress.",
        url: "/dashboard",
      },
      {
        name: "Student Login",
        short_name: "Student",
        description: "Resume the student learning experience.",
        url: "/student-login",
      },
    ],
    categories: ["education", "productivity"],
    lang: "en",
  }
}

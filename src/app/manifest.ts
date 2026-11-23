import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "GNI-UC 산업AX전공",
    short_name: "GNI-UC",
    description: "5극3특 공유대학 GNI · 울산과학대학교 산업AX전공 홈페이지와 교직원 관리 시스템",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A1838",
    theme_color: "#0A1838",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "교직원 관리", short_name: "관리", url: "/admin", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "공유대학 준비", short_name: "준비", url: "/admin/gni", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}

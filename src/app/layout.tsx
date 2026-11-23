import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/PwaRegister";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://gni-uc.org"),
  title: { default: "GNI-UC 산업AX전공", template: "%s | GNI-UC" },
  description: "5극3특 공유대학 GNI · 울산과학대학교 미래모빌리티 트랙 산업AX전공",
  applicationName: "GNI-UC",
  // 아이폰 '홈 화면에 추가' 시 앱처럼 전체 화면으로 열림
  appleWebApp: { capable: true, title: "GNI-UC", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  // iOS 16.3 이하 호환
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0A1838" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
      </head>
      <body>{children}<PwaRegister /></body>
    </html>
  );
}

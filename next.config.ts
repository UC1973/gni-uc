import type { NextConfig } from "next";

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://qbjevtjeczecysbtridj.supabase.co";
const supabaseWs = supabase.replace(/^https:/, "wss:");
const isProd = process.env.NODE_ENV === "production";

// Next.js가 초기 화면에 인라인 스크립트를 쓰므로 script-src에 'unsafe-inline'을 둡니다.
// 개발 서버는 eval을 쓰므로 CSP는 운영 빌드에만 적용합니다.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "font-src 'self' data: https://cdn.jsdelivr.net",
  "img-src 'self' data: blob:",
  `connect-src 'self' ${supabase} ${supabaseWs}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(isProd ? [{ key: "Content-Security-Policy", value: csp }] : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // 관리 화면·인증 화면은 검색엔진에 노출하지 않고 캐시하지 않음
      { source: "/(admin|login|signup|pending|forgot-password|reset-password)(.*)", headers: [
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
        { key: "Cache-Control", value: "private, no-store" },
      ] },
    ];
  },
};

export default nextConfig;

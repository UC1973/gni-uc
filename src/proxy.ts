import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// 세션 갱신이 필요한 경로에서만 실행 (홈페이지·개인정보 처리방침 등 공개 페이지는 건너뜀)
export const config = {
  matcher: ["/admin/:path*", "/api/:path*", "/auth/:path*", "/login", "/signup", "/pending", "/forgot-password", "/reset-password"],
};

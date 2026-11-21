import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifyAdminsOfSignup } from "@/lib/email";
import { ROLE_LABEL, type Role } from "@/lib/types";

/** 이메일 인증 링크 → 세션 교환 → (승인 대기 계정이면) 사업단에 승인 요청 알림 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/pending";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/pending";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const userId = data.user?.id;
      if (userId) {
        const { data: profile } = await supabase.from("profiles").select("name,email,role,status,university_id").eq("id", userId).single();
        if (profile?.status === "pending") {
          const { data: univ } = await supabase.from("universities").select("name").eq("id", profile.university_id ?? "").maybeSingle();
          await notifyAdminsOfSignup(profile.name, profile.email, univ?.name ?? "소속 미지정", ROLE_LABEL[profile.role as Role]);
        }
      }
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=confirm`);
}

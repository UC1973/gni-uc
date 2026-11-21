import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { notifyAdminsOfSignup } from "@/lib/email";
import { ROLE_LABEL, type Role } from "@/lib/types";

/** 이메일 인증을 마친 승인 대기 계정이면 사업단에 승인 요청 메일 */
export async function notifyIfPending(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("name,email,role,status,university_id").eq("id", userId).single();
  if (profile?.status !== "pending") return;
  const { data: univ } = await supabase.from("universities").select("name").eq("id", profile.university_id ?? "").maybeSingle();
  await notifyAdminsOfSignup(profile.name, profile.email, univ?.name ?? "소속 미지정", ROLE_LABEL[profile.role as Role]);
}

export function safeNext(next: string | null, fallback = "/pending") {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

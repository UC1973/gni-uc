import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * 로그인한 교직원 프로필. 없으면 null
 * - 토큰은 getClaims로 서명(ES256)을 서버에서 바로 검증해 Auth 서버 왕복을 줄입니다.
 * - 같은 요청 안(레이아웃·페이지)에서는 한 번만 조회합니다.
 * - 소속 대학 이름도 함께 받아 별도 조회를 없앱니다.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const uid = auth?.claims?.sub;
  if (!uid) return null;
  const { data } = await supabase.from("profiles").select("*, university:universities(name)").eq("id", uid).maybeSingle();
  return (data as Profile) ?? null;
});

/** 승인된 교직원만 통과. hubOnly면 UC 사업단만 */
export async function requireStaff(opts: { hubOnly?: boolean } = {}): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.status !== "approved") redirect("/pending");
  if (opts.hubOnly && profile.role !== "hub_admin") redirect("/admin");
  return profile;
}

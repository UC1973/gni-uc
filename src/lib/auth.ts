import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/** 로그인한 교직원 프로필. 없으면 null */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", auth.user.id).single();
  return (data as Profile) ?? null;
}

/** 승인된 교직원만 통과. hubOnly면 UC 사업단만 */
export async function requireStaff(opts: { hubOnly?: boolean } = {}): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.status !== "approved") redirect("/pending");
  if (opts.hubOnly && profile.role !== "hub_admin") redirect("/admin");
  return profile;
}

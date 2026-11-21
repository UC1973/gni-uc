"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { notifyAdminsOfSignup, sendSignupReceived } from "@/lib/email";
import { ROLE_LABEL } from "@/lib/types";

export type FormState = { error?: string; ok?: string } | undefined;

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/admin");
  if (!email || !password) return { error: "이메일과 비밀번호를 입력해 주세요." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.message.includes("Email not confirmed")) return { error: "이메일 인증이 아직 완료되지 않았습니다. 메일함을 확인해 주세요." };
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const university_id = String(form.get("university_id") ?? "");
  const role = form.get("role") === "professor" ? "professor" : "univ_staff";
  const univName = String(form.get("university_name") ?? university_id);

  if (!name || !email || !university_id) return { error: "이름, 이메일, 소속 대학을 모두 입력해 주세요." };
  if (password.length < 8) return { error: "비밀번호는 8자 이상이어야 합니다." };

  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, university_id, role },
      emailRedirectTo: `${origin}/auth/callback?next=/pending`,
    },
  });
  if (error) {
    if (error.message.toLowerCase().includes("already")) return { error: "이미 가입된 이메일입니다." };
    return { error: `가입 신청에 실패했습니다: ${error.message}` };
  }

  await Promise.all([
    sendSignupReceived(email, name),
    notifyAdminsOfSignup(name, email, univName, ROLE_LABEL[role]),
  ]);
  return { ok: "가입 신청이 접수되었습니다. 메일함에서 이메일 인증을 완료해 주세요. UC 사업단이 승인하면 로그인할 수 있습니다." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

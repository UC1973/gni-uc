"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { sendSignupReceived } from "@/lib/email";

export type FormState = { error?: string; ok?: string; unconfirmedEmail?: string } | undefined;

async function siteOrigin() {
  return (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://gni-uc.org";
}

/** ALLOWED_EMAIL_DOMAINS="uc.ac.kr,example.ac.kr" 처럼 지정하면 해당 도메인 메일만 가입 가능 */
function emailDomainAllowed(email: string) {
  const allowed = (process.env.ALLOWED_EMAIL_DOMAINS ?? "").split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
  if (!allowed.length) return true;
  const domain = email.split("@")[1] ?? "";
  return allowed.some((d) => domain === d || domain.endsWith(`.${d}`));
}

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/admin");
  if (!email || !password) return { error: "이메일과 비밀번호를 입력해 주세요." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.code === "email_not_confirmed" || error.message.includes("Email not confirmed")) {
      return { error: "이메일 인증이 아직 완료되지 않았습니다. 메일함(스팸함 포함)의 인증 링크를 눌러 주세요.", unconfirmedEmail: email };
    }
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  }
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function resendConfirmation(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "이메일을 입력해 주세요." };
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/pending` },
  });
  if (error) {
    if (error.status === 429) return { error: "잠시 후 다시 시도해 주세요. (메일 재발송은 1분에 한 번 가능합니다)" };
    return { error: "인증 메일을 다시 보내지 못했습니다. 잠시 후 다시 시도해 주세요." };
  }
  return { ok: `${email}로 인증 메일을 다시 보냈습니다. 스팸함도 확인해 주세요.` };
}

export async function signup(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const university_id = String(form.get("university_id") ?? "");
  const role = form.get("role") === "professor" ? "professor" : "univ_staff";

  if (!name || !email || !university_id) return { error: "이름, 이메일, 소속 대학을 모두 입력해 주세요." };
  if (password.length < 8) return { error: "비밀번호는 8자 이상이어야 합니다." };
  if (!emailDomainAllowed(email)) return { error: "참여대학 이메일 주소로만 가입할 수 있습니다." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, university_id, role },
      emailRedirectTo: `${await siteOrigin()}/auth/callback?next=/pending`,
    },
  });
  if (error) {
    if (error.message.toLowerCase().includes("already")) return { error: "이미 가입된 이메일입니다." };
    return { error: "가입 신청에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }
  // 이미 가입된 이메일이면 Supabase는 오류 대신 빈 identities를 돌려줍니다.
  if (data.user && data.user.identities?.length === 0) return { error: "이미 가입된 이메일입니다. 로그인하거나 인증 메일을 다시 받아 주세요." };

  await sendSignupReceived(email, name);
  return { ok: "가입 신청이 접수되었습니다. 메일함(스팸함 포함)의 인증 링크를 눌러 주세요. 인증 후 UC 사업단이 승인하면 로그인할 수 있습니다." };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

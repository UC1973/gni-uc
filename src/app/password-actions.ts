"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/app/auth-actions";

export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "이메일을 입력해 주세요." };
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://gni-uc.org";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/reset-password` });
  if (error?.status === 429) return { error: "잠시 후 다시 시도해 주세요. (메일은 1분에 한 번 보낼 수 있습니다)" };
  // 가입 여부를 노출하지 않기 위해 항상 같은 안내
  return { ok: "가입된 이메일이라면 비밀번호 재설정 메일을 보냈습니다. 메일함(스팸함 포함)을 확인해 주세요." };
}

export async function setNewPassword(_: FormState, form: FormData): Promise<FormState> {
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");
  if (password.length < 8) return { error: "비밀번호는 8자 이상이어야 합니다." };
  if (password !== confirm) return { error: "두 비밀번호가 서로 다릅니다." };
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return { error: "비밀번호는 영문과 숫자를 모두 포함해야 합니다." };

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "링크가 만료되었습니다. 비밀번호 재설정을 다시 요청해 주세요." };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "reauthentication_needed") return { error: "보안을 위해 다시 로그인한 뒤 비밀번호를 바꿔 주세요." };
    if (error.code === "same_password") return { error: "이전과 다른 비밀번호를 입력해 주세요." };
    if (error.code === "weak_password") return { error: "더 안전한 비밀번호를 사용해 주세요. 영문·숫자를 포함하고, 유출된 적 있는 비밀번호는 쓸 수 없습니다." };
    return { error: "비밀번호를 바꾸지 못했습니다. 다시 시도해 주세요." };
  }
  redirect("/admin");
}

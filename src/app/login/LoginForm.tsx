"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "@/app/auth-actions";

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState(login, initialError ? { error: initialError } : undefined);
  return (
    <form action={action}>
      <h1 style={{ fontSize: 26 }}>교직원 로그인</h1>
      <p className="muted small">5개 참여대학 교수·직원 전용입니다.</p>
      {state?.error && <div className="msg err" role="alert">{state.error}</div>}
      <input type="hidden" name="next" value={next} />
      <div className="fld"><label htmlFor="email">이메일</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="fld"><label htmlFor="password">비밀번호</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
      <button className="btn btn-p" style={{ width: "100%", justifyContent: "center" }} disabled={pending}>{pending ? "확인 중…" : "로그인"}</button>
      <p className="small muted" style={{ marginTop: 14, textAlign: "center" }}>계정이 없나요? <Link href="/signup" style={{ color: "var(--blue)", fontWeight: 600 }}>가입 신청</Link></p>
    </form>
  );
}

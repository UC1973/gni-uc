"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, resendConfirmation } from "@/app/auth-actions";

function ResendConfirmation({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendConfirmation, undefined);
  return (
    <form action={action} style={{ marginBottom: 12 }}>
      <input type="hidden" name="email" value={email} />
      {state?.ok && <div className="msg ok" role="status">{state.ok}</div>}
      {state?.error && <div className="msg err" role="alert">{state.error}</div>}
      {!state?.ok && <button className="btn btn-o btn-s" disabled={pending}>{pending ? "보내는 중…" : "인증 메일 다시 보내기"}</button>}
    </form>
  );
}

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState(login, initialError ? { error: initialError } : undefined);
  return (
    <div style={{ width: "100%", maxWidth: 390 }}>
      <form action={action}>
        <h1 style={{ fontSize: 26 }}>교직원 로그인</h1>
        <p className="muted small">5개 참여대학 교수·직원 전용입니다.</p>
        {state?.error && <div className="msg err" role="alert">{state.error}</div>}
        <input type="hidden" name="next" value={next} />
        <div className="fld"><label htmlFor="email">이메일</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
        <div className="fld"><label htmlFor="password">비밀번호</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
        <button className="btn btn-p" style={{ width: "100%", justifyContent: "center" }} disabled={pending}>{pending ? "확인 중…" : "로그인"}</button>
      </form>
      {state?.unconfirmedEmail && <div style={{ marginTop: 12 }}><ResendConfirmation email={state.unconfirmedEmail} /></div>}
      <p className="small muted" style={{ marginTop: 14, textAlign: "center" }}>계정이 없나요? <Link href="/signup" style={{ color: "var(--blue)", fontWeight: 600 }}>가입 신청</Link></p>
    </div>
  );
}

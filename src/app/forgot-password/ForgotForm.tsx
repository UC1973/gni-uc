"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/password-actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);
  return (
    <form action={action} style={{ width: "100%", maxWidth: 390 }}>
      <h1 style={{ fontSize: 26 }}>비밀번호 재설정</h1>
      <p className="muted small">가입한 대학 이메일을 입력하면 새 비밀번호를 정하는 링크를 보내드립니다.</p>
      {state?.error && <div className="msg err" role="alert">{state.error}</div>}
      {state?.ok && <div className="msg ok" role="status">{state.ok}</div>}
      <div className="fld"><label htmlFor="email">이메일</label><input id="email" name="email" type="email" autoComplete="email" required /></div>
      <button className="btn btn-p" style={{ width: "100%", justifyContent: "center" }} disabled={pending}>{pending ? "보내는 중…" : "재설정 메일 받기"}</button>
      <p className="small muted" style={{ marginTop: 14, textAlign: "center" }}><Link href="/login" style={{ color: "var(--blue)", fontWeight: 600 }}>로그인으로 돌아가기</Link></p>
    </form>
  );
}

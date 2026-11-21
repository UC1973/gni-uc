"use client";

import { useActionState } from "react";
import { setNewPassword } from "@/app/password-actions";

export function ResetForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(setNewPassword, undefined);
  return (
    <form action={action} style={{ width: "100%", maxWidth: 390 }}>
      <h1 style={{ fontSize: 26 }}>새 비밀번호 설정</h1>
      <p className="muted small">{email} 계정의 새 비밀번호를 입력해 주세요.</p>
      {state?.error && <div className="msg err" role="alert">{state.error}</div>}
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />
      <div className="fld"><label htmlFor="password">새 비밀번호 (8자 이상, 영문+숫자)</label><input id="password" name="password" type="password" minLength={8} autoComplete="new-password" required /></div>
      <div className="fld"><label htmlFor="confirm">새 비밀번호 확인</label><input id="confirm" name="confirm" type="password" minLength={8} autoComplete="new-password" required /></div>
      <button className="btn btn-p" style={{ width: "100%", justifyContent: "center" }} disabled={pending}>{pending ? "저장 중…" : "비밀번호 저장"}</button>
    </form>
  );
}

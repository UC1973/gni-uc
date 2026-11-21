"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { signup } from "@/app/auth-actions";
import type { University } from "@/lib/types";

export function SignupForm({ universities }: { universities: University[] }) {
  const [state, action, pending] = useActionState(signup, undefined);
  const [uid, setUid] = useState(universities[0]?.id ?? "");
  const selected = universities.find((u) => u.id === uid);
  const domains = selected?.email_domains ?? [];

  if (state?.ok) return <div style={{ maxWidth: 390 }}><h1 style={{ fontSize: 24 }}>신청 완료</h1><div className="msg ok">{state.ok}</div><Link className="btn btn-o" href="/">홈으로</Link></div>;

  return (
    <form action={action}>
      <h1 style={{ fontSize: 26 }}>교직원 가입 신청</h1>
      <p className="muted small">가입 후 이메일 인증 → UC 사업단 승인 순서로 진행됩니다.</p>
      {state?.error && <div className="msg err" role="alert">{state.error}</div>}
      <div className="fld"><label htmlFor="name">이름</label><input id="name" name="name" required maxLength={40} autoComplete="name" /></div>
      <div className="fld"><label htmlFor="university_id">소속 대학</label>
        <select id="university_id" name="university_id" value={uid} onChange={(e) => setUid(e.target.value)}>
          {universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select></div>
      <div className="fld"><label>역할</label><div className="roles" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <label><input type="radio" name="role" value="univ_staff" defaultChecked />대학 담당자</label>
        <label><input type="radio" name="role" value="professor" />교수</label></div>
        <p className="small muted" style={{ marginTop: 6 }}>UC 사업단 권한은 승인 시 사업단이 지정합니다.</p></div>
      <div className="fld"><label htmlFor="email">대학 이메일</label>
        <input id="email" name="email" type="email" required autoComplete="email" placeholder={domains[0] ? `name@${domains[0]}` : undefined} />
        {domains.length > 0 && <p className="small muted" style={{ marginTop: 6 }}>{selected?.name} 메일(@{domains.join(", @")})만 가입할 수 있습니다.</p>}</div>
      <div className="fld"><label htmlFor="password">비밀번호 (8자 이상)</label><input id="password" name="password" type="password" minLength={8} required autoComplete="new-password" /></div>
      <button className="btn btn-p" style={{ width: "100%", justifyContent: "center" }} disabled={pending}>{pending ? "신청 중…" : "가입 신청"}</button>
      <p className="small muted" style={{ marginTop: 14, textAlign: "center" }}>이미 계정이 있나요? <Link href="/login" style={{ color: "var(--blue)", fontWeight: 600 }}>로그인</Link></p>
    </form>
  );
}

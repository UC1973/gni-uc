import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = { title: "새 비밀번호 설정" };

/** 재설정·초대 메일의 링크(/auth/confirm)로 로그인된 상태에서만 열립니다. */
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return (
    <AuthShell>
      {data.user?.email ? <ResetForm email={data.user.email} /> : (
        <div style={{ maxWidth: 390 }}>
          <h1 style={{ fontSize: 24 }}>링크가 만료되었습니다</h1>
          <p className="muted" style={{ margin: "10px 0 20px" }}>비밀번호 재설정 링크는 1시간 동안 한 번만 사용할 수 있습니다. 다시 요청해 주세요.</p>
          <Link className="btn btn-p" href="/forgot-password">재설정 메일 다시 받기</Link>
        </div>
      )}
    </AuthShell>
  );
}

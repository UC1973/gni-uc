import { redirect } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";
import { getProfile } from "@/lib/auth";
import { logout } from "@/app/auth-actions";

export default async function PendingPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.status === "approved") redirect("/admin");
  const rejected = profile.status === "rejected";
  return (
    <AuthShell>
      <div style={{ maxWidth: 390 }}>
        <h1 style={{ fontSize: 24 }}>{rejected ? "가입이 승인되지 않았습니다" : "승인을 기다리고 있습니다"}</h1>
        <p className="muted" style={{ margin: "10px 0 20px" }}>
          {rejected ? "문의는 UC 사업단으로 연락해 주세요." : `${profile.name}님의 이메일 인증이 완료되었습니다. UC 사업단이 승인하면 메일로 알려드립니다.`}
        </p>
        <form action={logout}><button className="btn btn-o">로그아웃</button></form>
      </div>
    </AuthShell>
  );
}

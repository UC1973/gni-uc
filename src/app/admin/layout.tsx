import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { Logo } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AdminNav } from "./AdminNav";
import { logout } from "@/app/auth-actions";
import { ROLE_LABEL } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();
  const hub = profile.role === "hub_admin";
  const supabase = await createClient();
  const { data: univ } = profile.university_id
    ? await supabase.from("universities").select("name").eq("id", profile.university_id).single()
    : { data: null };
  const univName = univ?.name ?? "소속 미지정";
  const scope = hub ? "5개 참여대학 전체 데이터를 관리합니다." : profile.role === "professor" ? "담당 교과목·수강생 위주로 표시됩니다." : `${univName} 데이터만 수정할 수 있습니다.`;

  return (
    <div className="adm">
      <aside className="side">
        <Link className="logo" href="/admin"><Logo sub="사업관리 · 성과관리" /></Link>
        <AdminNav hub={hub} />
        <div className="me">
          <b style={{ color: "#fff" }}>{profile.name}</b><br />{univName} · {ROLE_LABEL[profile.role]}<br />
          <form action={logout} style={{ display: "inline" }}><button className="logout">로그아웃</button></form> · <Link href="/" style={{ display: "inline", padding: 0, fontSize: 12, textDecoration: "underline" }}>홈페이지</Link>
        </div>
      </aside>
      <div className="main">
        <div className="topbar"><div className="right"><span className="small muted">2027학년도 준비</span><ThemeToggle /></div></div>
        <div className="rolebar">권한: <b>{ROLE_LABEL[profile.role]}</b> — {scope}</div>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { Logo } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon } from "@/components/icons";
import { MobileNav, PageTitle, SideNav } from "./AdminNav";
import { logout } from "@/app/auth-actions";
import { ROLE_LABEL } from "@/lib/types";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireStaff();
  const hub = profile.role === "hub_admin";
  const univName = profile.university?.name ?? "소속 미지정";
  const role = ROLE_LABEL[profile.role];
  const scope = hub ? "5개 참여대학 전체 데이터를 관리합니다." : profile.role === "professor" ? "담당 교과목·수강생 위주로 표시됩니다." : `${univName} 데이터만 수정할 수 있습니다.`;

  return (
    <div className="adm">
      <aside className="side">
        <Link className="logo" href="/admin"><Logo sub="사업관리 · 성과관리" /></Link>
        <SideNav hub={hub} />
        <div className="me">
          <span className="avatar">{profile.name.slice(0, 1)}</span>
          <div className="me-t">
            <b>{profile.name}</b>
            <small>{univName} · {role}</small>
          </div>
          <form action={logout}><button className="me-out" aria-label="로그아웃" title="로그아웃"><Icon name="logout" size={18} /></button></form>
        </div>
        <Link href="/" className="side-home"><Icon name="external" size={16} />홈페이지 보기</Link>
      </aside>
      <div className="main">
        <header className="topbar">
          <Link href="/admin" className="tb-mark" aria-label="대시보드"><span className="mark">GNI<br />UC</span></Link>
          <PageTitle />
          <div className="right">
            <span className="chip">2027학년도 준비</span>
            <ThemeToggle />
          </div>
        </header>
        <div className="rolebar"><b>{role}</b> · {scope}</div>
        <div className="content">{children}</div>
      </div>
      <MobileNav hub={hub} name={profile.name} meta={`${univName} · ${role}`} scope={scope} />
    </div>
  );
}

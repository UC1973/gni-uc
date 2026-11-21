import Link from "next/link";
import { Logo } from "@/components/ui";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="login-pg">
      <div className="login-side">
        <Link className="logo" href="/"><Logo /></Link>
        <div>
          <h2>사업관리 ·<br />성과관리시스템</h2>
          <p style={{ color: "#C3CDEB", margin: "10px 0 20px" }}>5개 참여대학 교수·직원 전용</p>
          <ul><li>✓ 교육과정(안) 협의·확정 관리</li><li>✓ 대학별 공문·교육과정표 회신</li><li>✓ 학생 모집·수강·성적 관리</li><li>✓ 성과지표 · 비교과 · 홍보자료</li></ul>
        </div>
        <small style={{ color: "#8996C0" }}>← <Link href="/" style={{ textDecoration: "underline" }}>학생용 홈페이지로</Link></small>
      </div>
      <div className="login-box">{children}</div>
    </div>
  );
}

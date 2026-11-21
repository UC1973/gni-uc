import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, Tag } from "@/components/ui";
import { PageHead } from "@/components/admin";
import type { Course, Issue, Reply, University } from "@/lib/types";

const DAY = 86_400_000;
const daysUntil = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / DAY);

export default async function Dashboard() {
  const me = await requireStaff();
  const supabase = await createClient();
  const [u, c, i, r, s, st, p] = await Promise.all([
    supabase.from("universities").select("*").order("sort"),
    supabase.from("courses").select("*").order("sort"),
    supabase.from("issues").select("*").order("created_at"),
    supabase.from("replies").select("*"),
    supabase.from("site_settings").select("*"),
    supabase.from("students").select("university_id,status"),
    me.role === "hub_admin" ? supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "pending") : Promise.resolve({ count: 0 }),
  ]);
  const univs = (u.data ?? []) as University[];
  const courses = (c.data ?? []) as Course[];
  const issues = (i.data ?? []) as Issue[];
  const replies = (r.data ?? []) as Reply[];
  const settings = Object.fromEntries((s.data ?? []).map((x: { key: string; value: string }) => [x.key, x.value]));
  const students = (st.data ?? []) as { university_id: string; status: string }[];

  const dday = daysUntil(settings.semester_start ?? "2027-03-02");
  const replyD = daysUntil(settings.reply_deadline ?? "2026-12-02");
  const decided = courses.filter((x) => x.status === "ok").length;
  const replied = replies.filter((x) => x.install_doc && x.curriculum_doc).length;
  const open = issues.filter((x) => x.status !== "ok");
  const pendingUsers = p.count ?? 0;

  return (
    <>
      <PageHead title="대시보드" desc={`2027학년도 1학기 산업AX전공 개시 준비 현황`} />
      <div className="kpis num">
        <div className="kpi dday"><div className="l">2027-1학기 개시까지</div><div className="v">{dday > 0 ? `D-${dday}` : "개시"}</div><div className="d">개강 {settings.semester_start ?? "2027-03-02"}</div></div>
        <div className="kpi"><div className="l">교과목 확정</div><div className="v">{decided}<small> / {courses.length}과목</small></div><div className="prog"><i style={{ width: `${courses.length ? (decided / courses.length) * 100 : 0}%` }} /></div><div className="d">(안) {courses.filter((x) => x.status === "draft").length} · 협의 중 {courses.filter((x) => x.status === "wip").length}</div></div>
        <div className="kpi"><div className="l">회신 완료 대학</div><div className="v">{replied}<small> / {univs.length}개</small></div><div className="prog"><i style={{ width: `${univs.length ? (replied / univs.length) * 100 : 0}%` }} /></div><div className="d">마감 {settings.reply_deadline ?? "12.02."}{replyD >= 0 ? ` · D-${replyD}` : " · 마감 지남"}</div></div>
        <div className="kpi"><div className="l">미결 협의사항</div><div className="v" style={{ color: "var(--warn)" }}>{open.length}<small> 건</small></div><div className="d">전체 {issues.length}건 중</div></div>
      </div>

      <div className="cols">
        <div className="panel"><h2>대학별 회신 현황 <Link className="btn btn-o btn-s" href="/admin/univs">관리</Link></h2>
          <table><thead><tr><th>대학</th><th className="c">설치 공문</th><th className="c">교육과정표</th><th>상태</th></tr></thead><tbody>
            {univs.map((x) => {
              const rp = replies.find((y) => y.university_id === x.id);
              const both = rp?.install_doc && rp?.curriculum_doc;
              const some = rp?.install_doc || rp?.curriculum_doc;
              return (
                <tr key={x.id}><td><b>{x.short_name}</b></td>
                  <td className="c">{rp?.install_doc ? "●" : "○"}</td><td className="c">{rp?.curriculum_doc ? "●" : "○"}</td>
                  <td>{both ? <Tag tone="ok">회신 완료</Tag> : some ? <Tag tone="wip">일부 제출</Tag> : <Tag tone="bad">미회신</Tag>}</td></tr>
              );
            })}
          </tbody></table>
        </div>
        <div className="panel"><h2>미결 협의사항 <Link className="btn btn-o btn-s" href="/admin/issues">전체</Link></h2>
          <ul className="todo">
            {pendingUsers > 0 && <li><Tag tone="bad">승인</Tag> 가입 승인 대기 {pendingUsers}명<Link href="/admin/users">→</Link></li>}
            {open.slice(0, 6).map((x) => <li key={x.id}><Badge status={x.status} /> {x.title}</li>)}
            {open.length === 0 && <li className="muted">미결 안건이 없습니다.</li>}
          </ul>
        </div>
      </div>

      <div className="panel"><h2>모집 인원 <span className="aside">총 {univs.reduce((a, x) => a + x.quota, 0)}명(안) · 선발·이수 학생 기준</span></h2>
        {univs.map((x) => {
          const n = students.filter((y) => y.university_id === x.id && y.status !== "중도포기").length;
          return (
            <div className="hbar num" key={x.id}><span>{x.short_name}</span><div className="t"><i style={{ width: `${Math.min(100, (n / Math.max(1, x.quota)) * 100)}%` }} /></div><span style={{ textAlign: "right" }}>{n} / {x.quota}</span></div>
          );
        })}
      </div>
    </>
  );
}

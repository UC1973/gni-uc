import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Tag } from "@/components/ui";
import { PageHead } from "@/components/admin";
import { ROLE_LABEL, type Profile, type Role, type University, type UserStatus } from "@/lib/types";

type Preapproval = {
  email: string; name: string | null; university_id: string; role: Role; position: string | null;
  applied_at: string | null; signed_up: boolean; email_confirmed: boolean; status: UserStatus | null;
};

const ROLES = Object.keys(ROLE_LABEL) as Role[];
const fmt = (at: string) => new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(at));

function progress(x: Preapproval) {
  if (x.status === "approved") return <Tag tone="ok">승인 완료</Tag>;
  if (x.status === "rejected") return <Tag tone="bad">반려</Tag>;
  if (x.signed_up) return x.email_confirmed ? <Tag tone="wip">승인 대기</Tag> : <Tag tone="wip">인증 대기</Tag>;
  return <Tag tone="draft">미가입</Tag>;
}

export default async function MembersPage() {
  await requireStaff({ hubOnly: true });
  const supabase = await createClient();
  const [p, u, pa] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("universities").select("*").order("sort"),
    supabase.rpc("member_preapproval_status"),
  ]);
  const users = (p.data ?? []) as Profile[];
  const univs = (u.data ?? []) as University[];
  const pre = (pa.data ?? []) as Preapproval[];
  const uname = (id: string | null) => univs.find((x) => x.id === id)?.short_name ?? "–";

  const approved = users.filter((x) => x.status === "approved");
  const pending = users.filter((x) => x.status === "pending");
  const rejected = users.filter((x) => x.status === "rejected");
  const unconfirmed = pending.filter((x) => !x.email_confirmed).length;
  const preWaiting = pre.filter((x) => x.status !== "approved").length;

  const byUniv = [...univs.map((x) => x.id), null].map((id) => {
    const rows = users.filter((x) => x.university_id === id);
    return { id, rows, ok: rows.filter((x) => x.status === "approved") };
  }).filter((r) => r.id !== null || r.rows.length > 0);

  return (
    <>
      <PageHead title="가입자 현황" desc="대학·역할별 가입자, 승인 진행 상태, 사전 승인 교직원 가입 여부" />
      <div className="kpis num">
        <div className="kpi"><div className="l">전체 가입자</div><div className="v">{users.length}<small> 명</small></div><div className="d">반려 {rejected.length}명 포함</div></div>
        <div className="kpi"><div className="l">승인</div><div className="v" style={{ color: "var(--ok)" }}>{approved.length}<small> 명</small></div><div className="d">{ROLES.map((r) => `${ROLE_LABEL[r]} ${approved.filter((x) => x.role === r).length}`).join(" · ")}</div></div>
        <div className="kpi"><div className="l">승인 대기</div><div className="v" style={{ color: "var(--warn)" }}>{pending.length}<small> 명</small></div><div className="d">이메일 미인증 {unconfirmed}명</div></div>
        <div className="kpi"><div className="l">사전 승인 교직원</div><div className="v">{pre.length - preWaiting}<small> / {pre.length}명</small></div><div className="d">가입·승인 전 {preWaiting}명</div></div>
      </div>

      {pending.length > 0 && <div className="alert warn">⚠️ <div>승인 대기 {pending.length}명이 있습니다. <Link href="/admin/users">사용자·권한</Link>에서 역할을 지정해 승인하세요.</div></div>}

      <div className="panel" style={{ overflowX: "auto" }}><h2>대학별 가입자 <span className="aside">승인 인원 기준 · 괄호는 승인 대기</span></h2>
        <table><thead><tr><th>대학</th>{ROLES.map((r) => <th key={r} className="c">{ROLE_LABEL[r]}</th>)}<th className="c">승인 대기</th><th className="c">합계</th></tr></thead><tbody>
          {byUniv.map(({ id, rows, ok }) => (
            <tr key={id ?? "none"}><td><b>{id ? uname(id) : "소속 미지정"}</b></td>
              {ROLES.map((r) => {
                const n = ok.filter((x) => x.role === r).length;
                const w = rows.filter((x) => x.status === "pending" && x.role === r).length;
                return <td key={r} className="c">{n}{w > 0 && <span className="small muted"> ({w})</span>}</td>;
              })}
              <td className="c">{rows.filter((x) => x.status === "pending").length}</td>
              <td className="c"><b>{rows.length}</b></td></tr>
          ))}
        </tbody></table></div>

      <div className="panel" style={{ overflowX: "auto" }}><h2>사전 승인 교직원 <span className="aside">본인 가입·이메일 인증 시 자동 승인</span></h2>
        {pre.length === 0 ? <p className="small muted">등록된 사전 승인 교직원이 없습니다.</p> : (
          <table><thead><tr><th>성함</th><th>메일</th><th>소속</th><th>직위</th><th>역할</th><th>진행</th></tr></thead><tbody>
            {pre.map((x) => (
              <tr key={x.email}><td><b>{x.name ?? "–"}</b></td><td className="small">{x.email}</td><td>{uname(x.university_id)}</td>
                <td className="small">{x.position ?? "–"}</td><td>{ROLE_LABEL[x.role]}</td><td>{progress(x)}</td></tr>
            ))}
          </tbody></table>
        )}</div>

      <div className="panel" style={{ overflowX: "auto" }}><h2>최근 가입 신청 <Link className="btn btn-o btn-s" href="/admin/users">승인 처리</Link></h2>
        {users.length === 0 ? <p className="small muted">가입자가 없습니다.</p> : (
          <table><thead><tr><th>신청 시각</th><th>이름</th><th>소속</th><th>역할</th><th>이메일 인증</th><th>상태</th></tr></thead><tbody>
            {users.slice(0, 15).map((x) => (
              <tr key={x.id}><td className="small">{fmt(x.created_at)}</td><td><b>{x.name}</b></td><td>{uname(x.university_id)}</td><td>{ROLE_LABEL[x.role]}</td>
                <td>{x.email_confirmed ? <Tag tone="ok">완료</Tag> : <Tag tone="wip">미인증</Tag>}</td>
                <td>{x.status === "approved" ? <Tag tone="ok">승인</Tag> : x.status === "rejected" ? <Tag tone="bad">반려</Tag> : <Tag tone="wip">승인 대기</Tag>}</td></tr>
            ))}
          </tbody></table>
        )}</div>
    </>
  );
}

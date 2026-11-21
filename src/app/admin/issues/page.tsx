import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui";
import { PageHead, StatusSelect } from "@/components/admin";
import { createIssue, updateIssue } from "../actions";
import { AiSummary } from "./AiSummary";
import type { Issue, Meeting } from "@/lib/types";

export default async function IssuesPage() {
  const me = await requireStaff();
  const hub = me.role === "hub_admin";
  const supabase = await createClient();
  const [i, m] = await Promise.all([
    supabase.from("issues").select("*").order("status").order("created_at"),
    supabase.from("meetings").select("*").order("held_on", { ascending: false }),
  ]);
  const issues = (i.data ?? []) as Issue[];
  const meetings = (m.data ?? []) as Meeting[];

  return (
    <>
      <PageHead title="협의·학사운영" desc="참여대학 협의 안건을 결정 / 미결로 관리합니다." />
      {hub && <AiSummary />}
      {hub && (
        <form action={createIssue} className="panel">
          <h2>안건 등록</h2>
          <div className="form-grid">
            <label>분류<select name="category">{["학사", "교과", "학생", "협력", "일정", "기타"].map((c) => <option key={c}>{c}</option>)}</select></label>
            <label style={{ gridColumn: "span 2" }}>제목<input name="title" required /></label>
            <label style={{ gridColumn: "span 3" }}>내용<input name="detail" /></label>
            <button className="btn btn-p btn-s">등록</button>
          </div>
        </form>
      )}
      <div className="panel">
        {issues.map((x) => (
          <div className="issue" key={x.id}>
            <span className="cat">{x.category}</span>
            <div><b>{x.title}</b><p>{x.detail}</p>{x.decision && <p style={{ color: "var(--ok)" }}>결정: {x.decision}</p>}</div>
            {hub ? (
              <form action={updateIssue} className="inline">
                <input type="hidden" name="id" value={x.id} />
                <input name="decision" defaultValue={x.decision ?? ""} placeholder="결정 내용" aria-label="결정 내용" style={{ width: 160 }} />
                <StatusSelect value={x.status} /><button className="btn btn-o btn-s">저장</button>
              </form>
            ) : <Badge status={x.status} label={x.status === "ok" ? "결정" : undefined} />}
          </div>
        ))}
      </div>
      <div className="panel"><h2>회의 기록</h2>
        <table><thead><tr><th>일자</th><th>회의</th><th>참석</th><th>요약</th></tr></thead><tbody>
          {meetings.map((x) => <tr key={x.id}><td className="num">{x.held_on}</td><td><b>{x.title}</b></td><td>{x.attendees}</td><td className="small muted">{x.summary}</td></tr>)}
        </tbody></table>
      </div>
    </>
  );
}

import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHead } from "@/components/admin";
import { Tag } from "@/components/ui";
import { ACTION_LABEL, TABLE_LABEL, actorText, describe } from "@/lib/audit";
import { queryAudit, type AuditFilter } from "@/lib/audit-query";

const PAGE = 50;
const TONE = { insert: "ok", update: "info", delete: "bad" } as const;

function fmt(at: string) {
  return new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(new Date(at));
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<AuditFilter & { page?: string }> }) {
  await requireStaff({ hubOnly: true });
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const filter: AuditFilter = { table: sp.table || undefined, action: sp.action || undefined, actor: sp.actor || undefined, from: sp.from || undefined, to: sp.to || undefined };
  const supabase = await createClient();
  const [{ rows, count }, people] = await Promise.all([
    queryAudit(filter, [(page - 1) * PAGE, page * PAGE - 1]),
    supabase.from("profiles").select("id,name,university_id").order("name"),
  ]);
  const pages = Math.max(1, Math.ceil(count / PAGE));
  const qs = (p: number) => new URLSearchParams({ ...Object.fromEntries(Object.entries(filter).filter(([, v]) => v)), page: String(p) }).toString();
  const exportQs = new URLSearchParams(Object.fromEntries(Object.entries(filter).filter(([, v]) => v) as [string, string][])).toString();

  return (
    <>
      <PageHead title="변경 이력" desc="누가 언제 무엇을 바꿨는지 자동으로 기록됩니다. 기록은 수정·삭제할 수 없고 UC 사업단만 볼 수 있습니다." />
      <form className="panel tools" method="get" style={{ alignItems: "end" }}>
        <label className="small">대상<br /><select name="table" defaultValue={filter.table ?? ""}><option value="">전체</option>{Object.entries(TABLE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label className="small">작업<br /><select name="action" defaultValue={filter.action ?? ""}><option value="">전체</option>{Object.entries(ACTION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
        <label className="small">사람<br /><select name="actor" defaultValue={filter.actor ?? ""}><option value="">전체</option><option value="system">시스템</option>{(people.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name} ({p.university_id})</option>)}</select></label>
        <label className="small">시작일<br /><input type="date" name="from" defaultValue={filter.from ?? ""} /></label>
        <label className="small">종료일<br /><input type="date" name="to" defaultValue={filter.to ?? ""} /></label>
        <button className="btn btn-p btn-s">조회</button>
        <Link className="btn btn-o btn-s" href="/admin/audit">초기화</Link>
        <a className="btn btn-o btn-s" href={`/admin/audit/export${exportQs ? `?${exportQs}` : ""}`} style={{ marginLeft: "auto" }}>CSV 내려받기</a>
      </form>
      <div className="panel" style={{ overflowX: "auto" }}>
        <h2>기록 <span className="aside num">총 {count.toLocaleString()}건 · {page}/{pages}쪽</span></h2>
        {rows.length === 0 ? <div className="empty">조건에 맞는 기록이 없습니다.</div> : (
          <table className="num">
            <thead><tr><th style={{ minWidth: 150 }}>일시</th><th>사람</th><th>대상</th><th>작업</th><th>항목</th><th>변경 내용</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="small">{fmt(r.at)}</td>
                  <td className="small">{actorText(r)}</td>
                  <td>{TABLE_LABEL[r.table_name] ?? r.table_name}</td>
                  <td><Tag tone={TONE[r.action]}>{ACTION_LABEL[r.action]}</Tag></td>
                  <td className="small"><b>{r.row_label ?? r.row_key}</b></td>
                  <td className="small">{describe(r).map((d, i) => <div key={i}>{d}</div>)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {pages > 1 && (
          <div className="inline" style={{ justifyContent: "center", marginTop: 14 }}>
            {page > 1 && <Link className="btn btn-o btn-s" href={`/admin/audit?${qs(page - 1)}`}>← 이전</Link>}
            <span className="small muted">{page} / {pages}</span>
            {page < pages && <Link className="btn btn-o btn-s" href={`/admin/audit?${qs(page + 1)}`}>다음 →</Link>}
          </div>
        )}
      </div>
    </>
  );
}

import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui";
import { PageHead, StatusSelect } from "@/components/admin";
import { updateKpi } from "../actions";
import type { Kpi } from "@/lib/types";

export default async function KpiPage() {
  const me = await requireStaff();
  const hub = me.role === "hub_admin";
  const supabase = await createClient();
  const { data } = await supabase.from("kpis").select("*").order("sort");
  const kpis = (data ?? []) as Kpi[];

  return (
    <>
      <PageHead title="성과관리" desc="참여대학·교수 입력 → UC 사업단 검증 → GNI 주관대학 보고" />
      <div className="alert warn">⚠️ <div>성과지표 항목·목표값은 GNI(주관대학) 기준이 정해지면 확정합니다. 지금 항목은 예시입니다.</div></div>
      <div className="panel" style={{ overflowX: "auto" }}>
        <table className="num">
          <thead><tr><th>지표</th><th>단위</th><th>목표</th><th>실적</th><th style={{ minWidth: 140 }}>달성률</th><th>상태</th>{hub && <th />}</tr></thead>
          <tbody>
            {kpis.map((k) => {
              const pct = k.target && k.actual !== null ? (Number(k.actual) / Number(k.target)) * 100 : null;
              const fid = `k-${k.id}`;
              return (
                <tr key={k.id}>
                  <td><b>{k.name}</b></td><td>{k.unit}</td>
                  {hub ? (
                    <>
                      <td><input form={fid} name="target" type="number" step="any" defaultValue={k.target ?? ""} placeholder="미정" style={{ width: 90 }} aria-label="목표" /></td>
                      <td><input form={fid} name="actual" type="number" step="any" defaultValue={k.actual ?? ""} placeholder="–" style={{ width: 90 }} aria-label="실적" /></td>
                    </>
                  ) : (<><td>{k.target ?? <span className="muted">미정</span>}</td><td>{k.actual ?? "–"}</td></>)}
                  <td>{pct === null ? <span className="muted">–</span> : <div className="inline"><div className="prog" style={{ flex: 1 }}><i style={{ width: `${Math.min(100, pct)}%` }} /></div>{pct.toFixed(0)}%</div>}</td>
                  <td>{hub ? <StatusSelect form={fid} value={k.status} /> : <Badge status={k.status} />}</td>
                  {hub && <td><form id={fid} action={updateKpi}><input type="hidden" name="id" value={k.id} /><button className="btn btn-o btn-s">저장</button></form></td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

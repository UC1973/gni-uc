import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui";
import { PageHead } from "@/components/admin";
import { setDemand } from "../actions";
import type { ExtraDemand, ExtraProgram, University } from "@/lib/types";

export default async function ExtraPage() {
  const me = await requireStaff();
  const hub = me.role === "hub_admin";
  const supabase = await createClient();
  const [u, p, d] = await Promise.all([
    supabase.from("universities").select("*").order("sort"),
    supabase.from("extra_programs").select("*").order("sort"),
    supabase.from("extra_demand").select("*"),
  ]);
  const univs = (u.data ?? []) as University[];
  const programs = (p.data ?? []) as ExtraProgram[];
  const demand = (d.data ?? []) as ExtraDemand[];
  const get = (pid: number, uid: string) => demand.find((x) => x.program_id === pid && x.university_id === uid)?.count ?? 0;

  return (
    <>
      <PageHead title="비교과" desc="동계 비교과 프로그램 참여 희망 인원을 대학별로 입력합니다. 정규 ND·MD 동계교과와 구분해 준비합니다." />
      <div className="panel" style={{ overflowX: "auto" }}>
        <table className="num">
          <thead><tr><th>프로그램</th><th>상태</th>{univs.map((x) => <th key={x.id} className="c">{x.short_name}</th>)}<th className="c">합계</th></tr></thead>
          <tbody>
            {programs.map((pg) => (
              <tr key={pg.id}>
                <td><b>{pg.name}</b><div className="small muted">{pg.description}</div></td>
                <td><Badge status={pg.status} /></td>
                {univs.map((x) => (
                  <td key={x.id} className="c">
                    {hub || me.university_id === x.id ? (
                      <form action={setDemand} className="inline" style={{ justifyContent: "center" }}>
                        <input type="hidden" name="program_id" value={pg.id} /><input type="hidden" name="university_id" value={x.id} />
                        <input name="count" type="number" min="0" defaultValue={get(pg.id, x.id)} style={{ width: 64 }} aria-label={`${x.short_name} ${pg.name} 인원`} />
                        <button className="btn btn-o btn-s">저장</button>
                      </form>
                    ) : get(pg.id, x.id)}
                  </td>
                ))}
                <td className="c"><b>{univs.reduce((a, x) => a + get(pg.id, x.id), 0)}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel"><h2>협력 확대</h2><p className="small muted">수도권 2개 대학(인하공전·연성대) — 교육과정 개발·비교과 중심 참여, 향후 정규교과 연계 검토</p></div>
    </>
  );
}

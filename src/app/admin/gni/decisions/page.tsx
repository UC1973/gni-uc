import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { Badge } from "@/components/ui";
import { StatusSelect } from "@/components/admin";
import { AREAS, getGniData } from "@/lib/gni-docs";
import { decide } from "../actions";
import { AddPanel, DecisionForm, DocLink, EditToggle, LoadError } from "../parts";

export default async function GniDecisionsPage() {
  const me = await requireStaff();
  const hub = me.role === "hub_admin";
  const { docs, decisions, error } = await getGniData();
  const open = decisions.filter((d) => d.status !== "ok").length;

  return (
    <>
      <LoadError error={error} />
      <p className="small muted" style={{ margin: "0 4px 14px" }}>
        협의가 필요한 안건 {open}건 · 결정 {decisions.length - open}건. 회의 결과는 각 안건에 기록하고, 학사 협의 전반은 <Link href="/admin/issues" style={{ color: "var(--blue)", fontWeight: 600 }}>협의·학사운영</Link>에서 관리합니다.
      </p>
      {hub && <AddPanel label="안건 추가"><DecisionForm docs={docs} /></AddPanel>}
      {AREAS.map((area) => {
        const list = decisions.filter((d) => d.area === area);
        if (list.length === 0) return null;
        return (
          <section className="g-card" key={area}>
            <h2>{area} <span className="more" style={{ color: "var(--muted)" }}>{list.length}건</span></h2>
            {list.map((d) => (
              <div className="dec" key={d.id}>
                <div className="dec-h">
                  <b>{d.title}</b>
                  <Badge status={d.status} label={d.status === "ok" ? "결정" : d.status === "wip" ? "협의 중" : "검토 전"} />
                </div>
                {d.options.length > 0 && <ul>{d.options.map((o, i) => <li key={i}>{o}</li>)}</ul>}
                {d.basis && <p className="basis">{d.basis} <DocLink id={d.doc_id} docs={docs} /></p>}
                {!d.basis && <p className="basis"><DocLink id={d.doc_id} docs={docs} /></p>}
                {d.decision && <div className="res">결정 · {d.decision}</div>}
                {hub && (
                  <>
                    <form action={decide} className="inline-f">
                      <input type="hidden" name="id" value={d.id} />
                      <input name="decision" defaultValue={d.decision ?? ""} placeholder="결정 내용 기록" aria-label="결정 내용" />
                      <StatusSelect value={d.status} />
                      <button className="btn btn-o btn-s">저장</button>
                    </form>
                    <EditToggle label="안건 수정"><DecisionForm d={d} docs={docs} /></EditToggle>
                  </>
                )}
              </div>
            ))}
          </section>
        );
      })}
      {decisions.length === 0 && !error && <div className="empty">등록된 안건이 없습니다.</div>}
    </>
  );
}

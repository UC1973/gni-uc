import { requireStaff } from "@/lib/auth";
import { PHASES, fmtShort, getGniData } from "@/lib/gni-docs";
import { AddPanel, DocLink, DueTag, EditToggle, LoadError, MilestoneForm } from "../parts";
import { Calendar, kstToday } from "./Calendar";

export default async function GniSchedulePage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const me = await requireStaff();
  const { m: qm } = await searchParams;
  const month = qm && /^\d{4}-(0[1-9]|1[0-2])$/.test(qm) ? qm : kstToday().slice(0, 7);
  const hub = me.role === "hub_admin";
  const { docs, schedule, error } = await getGniData();

  return (
    <>
      <LoadError error={error} />
      <Calendar month={month} schedule={schedule} docs={docs} />
      {hub && <AddPanel label="일정 추가"><MilestoneForm docs={docs} /></AddPanel>}
      {PHASES.map((phase) => {
        const list = schedule.filter((m) => m.phase === phase);
        if (list.length === 0) return null;
        return (
          <section className="g-card" key={phase}>
            <h2>{phase} <span className="more" style={{ color: "var(--muted)" }}>{list.length}건</span></h2>
            <ul className="g-list">
              {list.map((m) => (
                <li className="g-row" key={m.id} id={`m-${m.id}`} style={{ flexWrap: "wrap", scrollMarginTop: 130 }}>
                  <div className="when"><b>{Number(m.starts_on.slice(8))}</b><small>{m.starts_on.slice(2, 4)}.{Number(m.starts_on.slice(5, 7))}월</small></div>
                  <div className="body">
                    <b>{m.title}</b>
                    <div className="sub">{fmtShort(m.starts_on)}{m.ends_on ? ` ~ ${fmtShort(m.ends_on)}` : ""} · {m.owner ?? "담당 미정"}</div>
                  </div>
                  <div className="side-r"><DueTag date={m.starts_on} end={m.ends_on} /><DocLink id={m.doc_id} docs={docs} /></div>
                  {hub && <div style={{ flexBasis: "100%" }}><EditToggle><MilestoneForm m={m} docs={docs} /></EditToggle></div>}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
      {schedule.length === 0 && !error && <div className="empty">등록된 일정이 없습니다.</div>}
    </>
  );
}

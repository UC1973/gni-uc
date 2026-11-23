import { requireStaff } from "@/lib/auth";
import { Icon } from "@/components/icons";
import { fmtShort, getGniData } from "@/lib/gni-docs";
import { toggleCheck } from "../actions";
import { AddPanel, CheckForm, DocLink, DueTag, EditToggle, LoadError } from "../parts";

export default async function GniChecklistPage() {
  const me = await requireStaff();
  const hub = me.role === "hub_admin";
  const { docs, checklist, error } = await getGniData();
  const groups = [...new Set(checklist.map((c) => c.grp))];
  const done = checklist.filter((c) => c.done).length;

  return (
    <>
      <LoadError error={error} />
      <p className="small muted" style={{ margin: "0 4px 14px" }}>
        전체 {checklist.length}개 중 {done}개 완료{hub ? " · 네모를 누르면 완료 표시가 바뀝니다." : ""}
      </p>
      {hub && <AddPanel label="할 일 추가"><CheckForm docs={docs} groups={groups} /></AddPanel>}
      <div className="chk-grid">
        {groups.map((g) => {
          const items = checklist.filter((c) => c.grp === g);
          const n = items.filter((c) => c.done).length;
          return (
            <section className="g-card" key={g} style={{ marginBottom: 0 }}>
              <h2>{g} <span className="more" style={{ color: "var(--muted)" }}>{n}/{items.length}</span></h2>
              <div className="ring" style={{ marginTop: -4, marginBottom: 8 }}><i style={{ width: `${items.length ? (n / items.length) * 100 : 0}%` }} /></div>
              {items.map((c) => (
                <div className={`chk-item${c.done ? " done" : ""}`} key={c.id}>
                  {hub ? (
                    <form action={toggleCheck}>
                      <input type="hidden" name="id" value={c.id} />
                      <input type="hidden" name="done" value={c.done ? "0" : "1"} />
                      <button className={`chk-box${c.done ? " on" : ""}`} aria-label={c.done ? `${c.task} 완료 취소` : `${c.task} 완료`} aria-pressed={c.done}>
                        {c.done && <Icon name="check" size={14} />}
                      </button>
                    </form>
                  ) : (
                    <span className={`chk-box${c.done ? " on" : ""}`} aria-label={c.done ? "완료" : "미완료"}>{c.done && <Icon name="check" size={14} />}</span>
                  )}
                  <div className="t">
                    <span>{c.task}</span>
                    <small>{c.owner ?? "담당 미정"}{c.due_on ? ` · ${fmtShort(c.due_on)}` : ""} <DocLink id={c.doc_id} docs={docs} /></small>
                    {hub && <EditToggle><CheckForm c={c} docs={docs} groups={groups} /></EditToggle>}
                  </div>
                  <DueTag date={c.due_on} done={c.done} />
                </div>
              ))}
            </section>
          );
        })}
      </div>
      {checklist.length === 0 && !error && <div className="empty">등록된 할 일이 없습니다.</div>}
    </>
  );
}

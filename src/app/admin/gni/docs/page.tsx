import { requireStaff } from "@/lib/auth";
import { Tag } from "@/components/ui";
import { Icon } from "@/components/icons";
import { fmtDate, fmtShort, getGniData } from "@/lib/gni-docs";
import { AddPanel, DocForm, DueTag, EditToggle, KindTag, LoadError } from "../parts";

const FILE_TAG = { 원본: ["ok", "원본"], 보관본: ["wip", "보관본"], 미확보: ["draft", "원본 필요"] } as const;

export default async function GniDocsPage() {
  const me = await requireStaff();
  const hub = me.role === "hub_admin";
  const { docs, notes, error } = await getGniData({ notes: hub });
  const months = [...new Set(docs.map((d) => d.doc_date.slice(0, 7)))];
  const missing = docs.flatMap((d) => d.attachments).filter((a) => a.file !== "원본").length;

  return (
    <>
      <LoadError error={error} />
      {hub && <AddPanel label="공문·메일 등록"><DocForm /></AddPanel>}
      {missing > 0 && (
        <div className="alert info">
          <Icon name="clip" size={18} />
          <span>붙임 원본이 없는 파일이 {missing}건 있습니다. 그룹웨어 결재 알림의 ‘문서조회’에서 첨부를 받을 수 있습니다.</span>
        </div>
      )}
      {docs.length === 0 && !error && <div className="empty">등록된 공문이 없습니다.</div>}

      {months.map((m) => (
        <section key={m}>
          <h2 className="month">{m.slice(0, 4)}년 {Number(m.slice(5))}월</h2>
          {docs.filter((d) => d.doc_date.startsWith(m)).map((d) => (
            <article key={d.id} id={`d-${d.id}`} className="doc">
              <div className="doc-meta">
                <span className="date">{fmtDate(d.doc_date)}</span>
                <KindTag kind={d.kind} dir={d.direction} />
                {d.doc_no && <span>{d.doc_no}</span>}
              </div>
              <h3>{d.title}</h3>
              <p className="route">{d.sender}{d.recipient ? ` → ${d.recipient}` : ""}</p>

              {d.points.length > 0 && <ul className="pts">{d.points.map((p, i) => <li key={i}>{p}</li>)}</ul>}

              {d.requests.length > 0 && (
                <div className="reqs">
                  {d.requests.map((r, i) => (
                    <div className="req" key={i}>
                      <div className="t">
                        {r.what}
                        {(r.due || r.how) && <small>{r.due ? `${fmtShort(r.due)}${r.time ? ` ${r.time}` : ""}까지` : ""}{r.due && r.how ? " · " : ""}{r.how ?? ""}</small>}
                      </div>
                      <DueTag date={r.due} />
                    </div>
                  ))}
                </div>
              )}

              {d.attachments.length > 0 && (
                <ul className="atts">
                  {d.attachments.map((a, i) => (
                    <li key={i}>
                      <Icon name="clip" size={14} />
                      <span className="nm">{a.name}{a.note && <span className="muted"> — {a.note}</span>}</span>
                      <Tag tone={FILE_TAG[a.file]?.[0] ?? "draft"}>{FILE_TAG[a.file]?.[1] ?? a.file}</Tag>
                    </li>
                  ))}
                </ul>
              )}
              {d.internal_note && <p className="note">학내 처리 · {d.internal_note}</p>}
              {hub && notes.get(d.id) && <p className="note hub">사업단 메모 · {notes.get(d.id)}</p>}
              {hub && <EditToggle><DocForm doc={d} note={notes.get(d.id)} /></EditToggle>}
            </article>
          ))}
        </section>
      ))}
    </>
  );
}

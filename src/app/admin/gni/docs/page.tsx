import { requireStaff } from "@/lib/auth";
import { PageHead } from "@/components/admin";
import { Tag } from "@/components/ui";
import { GNI_DOCS, fmtDate } from "@/lib/gni-docs";
import { DueTag, KindTag, SOURCE_NOTE, dueText } from "../parts";

const FILE_TAG = { 원본: ["ok", "원본"], 보관본: ["wip", "보관본만"], 미확보: ["draft", "원본 미확보"] } as const;

export default async function GniDocsPage() {
  const me = await requireStaff();
  const hub = me.role === "hub_admin";
  const docs = [...GNI_DOCS].sort((a, b) => b.date.localeCompare(a.date));
  const months = [...new Set(docs.map((d) => d.date.slice(0, 7)))];
  const missing = docs.flatMap((d) => d.attachments ?? []).filter((a) => a.file !== "원본").length;

  return (
    <>
      <PageHead title="공문·메일 일자별 정리" desc={SOURCE_NOTE} />
      <div className="alert info">
        <span>📎</span>
        <span>
          붙임 원본이 없는 파일 {missing}건은 그룹웨어 결재 알림의 ‘문서조회’에서 첨부란을 열어 받습니다. 전달 메일은 본문 위 첨부란에서 받을 수 있습니다.
          회의 접속 정보 등 원문에만 있는 세부 내용은 원문 공문을 확인하세요.
        </span>
      </div>
      <div className="tools">
        {months.map((m) => <a key={m} href={`#m-${m}`} className="btn btn-o btn-s">{Number(m.slice(5))}월</a>)}
      </div>

      {months.map((m) => (
        <section key={m} id={`m-${m}`}>
          <h2 style={{ fontSize: 16, margin: "8px 0 10px" }}>{m.slice(0, 4)}년 {Number(m.slice(5))}월</h2>
          {docs.filter((d) => d.date.startsWith(m)).map((d) => (
            <article key={d.id} id={`d-${d.id}`} className="panel" style={{ scrollMarginTop: 72 }}>
              <div className="small muted" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                <b style={{ color: "var(--text)" }}>{fmtDate(d.date)}</b>
                <KindTag kind={d.kind} dir={d.dir} />
                {d.docNo && <span>{d.docNo}</span>}
              </div>
              <h3 style={{ fontSize: 16, marginBottom: 4 }}>{d.title}</h3>
              <p className="small muted">{d.from}{d.to ? ` → ${d.to}` : ""}</p>

              <ul style={{ paddingLeft: 18, margin: "10px 0", fontSize: 14 }}>
                {d.points.map((p) => <li key={p} style={{ margin: "3px 0" }}>{p}</li>)}
                {hub && d.hubOnly?.map((p) => <li key={p} style={{ margin: "3px 0" }}>{p} <Tag tone="info">사업단</Tag></li>)}
              </ul>

              {d.requests && d.requests.length > 0 && (
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead><tr><th>요청사항</th><th>기한</th><th>방법</th><th /></tr></thead>
                    <tbody>
                      {d.requests.map((r) => (
                        <tr key={r.what}>
                          <td>{r.what}</td>
                          <td style={{ whiteSpace: "nowrap" }}>{r.due ? dueText(r.due) : "-"}</td>
                          <td className="small muted">{r.how ?? "-"}</td>
                          <td>{r.due && <DueTag date={r.due.slice(0, 10)} />}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {d.attachments && d.attachments.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div className="small muted" style={{ fontWeight: 600, marginBottom: 4 }}>붙임</div>
                  <ul style={{ listStyle: "none", fontSize: 13 }}>
                    {d.attachments.map((a) => (
                      <li key={a.name} style={{ padding: "3px 0", display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                        <Tag tone={FILE_TAG[a.file][0]}>{FILE_TAG[a.file][1]}</Tag>
                        <span>{a.name}</span>
                        {a.note && <span className="muted">— {a.note}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {d.internal && <p className="small muted" style={{ marginTop: 8 }}>학내 처리: {d.internal}</p>}
            </article>
          ))}
        </section>
      ))}
    </>
  );
}

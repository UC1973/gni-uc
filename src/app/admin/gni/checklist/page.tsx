import { requireStaff } from "@/lib/auth";
import { PageHead } from "@/components/admin";
import { Tag } from "@/components/ui";
import { GNI_CHECKLIST } from "@/lib/gni-docs";
import { DueTag, SOURCE_NOTE, SrcLink, dueText } from "../parts";

export default async function GniChecklistPage() {
  await requireStaff();
  return (
    <>
      <PageHead title="운영 준비 체크리스트" desc={SOURCE_NOTE} />
      <p className="small muted" style={{ marginBottom: 14 }}>
        공문의 요청사항과 회의자료의 협의사항을 할 일로 나눴습니다. ‘완료’는 발송 공문으로 확인된 항목만 표시합니다.
      </p>
      <div className="rf-grid">
        {GNI_CHECKLIST.map((g) => {
          const done = g.items.filter((i) => i.done).length;
          return (
            <div className="rf-card" key={g.title}>
              <h3>{g.title} <span className="small muted" style={{ marginLeft: "auto", fontWeight: 500 }}>{done}/{g.items.length}</span></h3>
              <ul className="todo">
                {g.items.map((i) => (
                  <li key={i.task} style={{ alignItems: "flex-start" }}>
                    <span className="chk" aria-label={i.done ? "완료" : "미완료"}>{i.done ? "✅" : "⬜"}</span>
                    <span style={{ flex: 1 }}>
                      <span style={i.done ? { textDecoration: "line-through", color: "var(--muted)" } : undefined}>{i.task}</span>
                      <br />
                      <span className="small muted">{i.who}{i.due ? ` · ${dueText(i.due)}` : ""}</span> <SrcLink id={i.src} />
                    </span>
                    {i.done ? <Tag tone="ok">완료</Tag> : i.due ? <DueTag date={i.due} /> : null}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </>
  );
}

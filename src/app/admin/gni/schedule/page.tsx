import { requireStaff } from "@/lib/auth";
import { PageHead } from "@/components/admin";
import { GNI_SCHEDULE, fmtDate, type Milestone } from "@/lib/gni-docs";
import { DueTag, SOURCE_NOTE, SrcLink } from "../parts";

const PHASES: Milestone["phase"][] = ["사업 착수", "교육과정 신설", "운영 준비", "학기 운영"];

export default async function GniSchedulePage() {
  await requireStaff();
  const sorted = [...GNI_SCHEDULE].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <>
      <PageHead title="공유대학 준비 일정" desc={SOURCE_NOTE} />
      <div className="steps panel" style={{ padding: 0, overflow: "hidden" }}>
        {PHASES.map((p) => {
          const list = sorted.filter((m) => m.phase === p);
          return (
            <div key={p}>
              <b>{p}</b>
              <small>{fmtDate(list[0].date).slice(2, 8)} ~ {fmtDate(list[list.length - 1].end ?? list[list.length - 1].date).slice(2, 8)} · {list.length}건</small>
            </div>
          );
        })}
      </div>

      {PHASES.map((p) => (
        <div className="panel" key={p}>
          <h2>{p}</h2>
          <div style={{ overflowX: "auto" }}>
            <table>
              <thead><tr><th>일자</th><th>일정</th><th>담당</th><th>근거</th><th>상태</th></tr></thead>
              <tbody>
                {sorted.filter((m) => m.phase === p).map((m) => (
                  <tr key={m.title}>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDate(m.date)}{m.end && <><br /><span className="small muted">~ {fmtDate(m.end)}</span></>}</td>
                    <td><b>{m.title}</b></td>
                    <td className="small">{m.who}</td>
                    <td><SrcLink id={m.src} /></td>
                    <td><DueTag date={m.date} end={m.end} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <p className="small muted">학생 선발은 공문에 ‘12월 예정’으로만 적혀 있어 12월 한 달로 표시했습니다. 1학기 개시일은 대학별 학사일정을 확인해 주세요.</p>
    </>
  );
}

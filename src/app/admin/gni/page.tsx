import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { PageHead } from "@/components/admin";
import { DegBadge } from "@/components/ui";
import { AX_COURSES, GNI_CHECKLIST, GNI_DECISIONS, GNI_DOCS, GNI_SCHEDULE, dday, fmtDate } from "@/lib/gni-docs";
import { DueTag, KindTag, SOURCE_NOTE, SrcLink } from "./parts";

export default async function GniOverviewPage() {
  const me = await requireStaff();
  const hub = me.role === "hub_admin";

  const upcoming = GNI_SCHEDULE.filter((m) => dday(m.end ?? m.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
  const items = GNI_CHECKLIST.flatMap((g) => g.items);
  const done = items.filter((i) => i.done).length;
  const recent = [...GNI_DOCS].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  const next = upcoming[0];

  return (
    <>
      <PageHead title="GNI 공유대학 준비" desc={SOURCE_NOTE} />

      <div className="kpis">
        <div className="kpi dday">
          <div className="l">다음 일정</div>
          <div className="v">{!next ? "-" : dday(next.date) <= 0 ? "진행 중" : `D-${dday(next.date)}`}</div>
          <div className="d">{next ? `${fmtDate(next.date)} ${next.title}` : "예정된 일정 없음"}</div>
        </div>
        <div className="kpi"><div className="l">정리한 공문·메일</div><div className="v">{GNI_DOCS.length}<small>건</small></div><div className="d">2026.08.18. ~ 11.18.</div></div>
        <div className="kpi"><div className="l">결정 필요 사항</div><div className="v">{GNI_DECISIONS.length}<small>건</small></div><div className="d">11.20 회의 협의사항 등</div></div>
        <div className="kpi">
          <div className="l">준비 체크리스트</div><div className="v">{done}<small> / {items.length}</small></div>
          <div className="prog"><i style={{ width: `${Math.round((done / items.length) * 100)}%` }} /></div>
        </div>
      </div>

      <div className="cols">
        <div className="panel">
          <h2>다가오는 일정 <Link href="/admin/gni/schedule" className="aside">전체 일정 →</Link></h2>
          {upcoming.length === 0 ? <div className="empty">남은 일정이 없습니다.</div> : (
            <ul className="todo">
              {upcoming.map((m) => (
                <li key={m.title}>
                  <DueTag date={m.date} end={m.end} />
                  <span><b>{m.title}</b><br /><span className="small muted">{fmtDate(m.date)}{m.end ? ` ~ ${fmtDate(m.end)}` : ""} · {m.who}</span></span>
                  <SrcLink id={m.src} />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="panel">
          <h2>사업 개요</h2>
          <table>
            <tbody>
              <tr><th>사업명</th><td>지역성장 인재양성체계(앵커) 5극3특 공유대학 — GNI(지니)공유대학</td></tr>
              <tr><th>주관대학</th><td>경상국립대학교</td></tr>
              <tr><th>중심대학</th><td>울산과학대·마산대·경남대·국립부경대·동아대</td></tr>
              <tr><th>사업기간</th><td>2026.9.1.~2030.2. (1차년도 ~2027.2.28.)</td></tr>
              <tr><th>울산과학대 역할</th><td>미래모빌리티 혁신제조분야 중심대학, 산업AX전공 직접 운영·참여대학 협력 총괄</td></tr>
              <tr><th>산업AX 참여대학</th><td>김해대·동의과학대·연암공대·한국승강기대 (11개 학과)</td></tr>
              {hub && <tr><th>사업비</th><td>연 300백만원 (1~4차년도 총 1,200백만원)</td></tr>}
            </tbody>
          </table>
          <p className="small muted" style={{ marginTop: 10 }}>근거: <SrcLink id="1022" /> · <SrcLink id="1118" /></p>
        </div>
      </div>

      <div className="panel">
        <h2>산업AX 교육과정(안) <span className="aside">MD 산업AX실무 12학점 · ND 산업AX기초 8학점 · 전공선택</span></h2>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>학년-학기</th><th>교과목</th><th>개설대학</th><th>학점(이론/실습/계)</th><th>구분</th></tr></thead>
            <tbody>
              {AX_COURSES.map((c) => (
                <tr key={c.name}>
                  <td>{c.term}</td>
                  <td><b>{c.name}</b><div className="small muted">{c.en}</div></td>
                  <td>{c.univ}</td><td>{c.credit}</td><td><DegBadge degree={c.deg} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>근거: <SrcLink id="1118" /> 회의자료. 2-2학기·동계 개설대학은 참여대학 분담 협의 후 확정합니다.</p>
      </div>

      <div className="panel">
        <h2>최근 공문·메일 <Link href="/admin/gni/docs" className="aside">전체 보기 →</Link></h2>
        <ul className="todo">
          {recent.map((d) => (
            <li key={d.id}>
              <span className="small muted" style={{ minWidth: 92 }}>{fmtDate(d.date)}</span>
              <KindTag kind={d.kind} dir={d.dir} />
              <span>{d.title}</span>
              <Link href={`/admin/gni/docs#d-${d.id}`}>보기</Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

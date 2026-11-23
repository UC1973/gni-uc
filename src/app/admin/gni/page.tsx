import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { dday, fmtShort, getGniData } from "@/lib/gni-docs";
import { DocLink, DueTag, KindTag, LoadError } from "./parts";

export default async function GniOverviewPage() {
  const me = await requireStaff();
  const hub = me.role === "hub_admin";
  const { docs, schedule, decisions, checklist, error } = await getGniData();

  const upcoming = schedule.filter((m) => dday(m.ends_on ?? m.starts_on) >= 0).slice(0, 6);
  const next = upcoming[0];
  const nextD = next ? dday(next.starts_on) : null;
  const done = checklist.filter((c) => c.done).length;
  const pct = checklist.length ? Math.round((done / checklist.length) * 100) : 0;
  const openDecisions = decisions.filter((d) => d.status !== "ok").length;
  const dueSoon = checklist.filter((c) => !c.done && c.due_on && dday(c.due_on) >= 0).sort((a, b) => a.due_on!.localeCompare(b.due_on!)).slice(0, 4);

  return (
    <>
      <LoadError error={error} />
      <div className="g-hero">
        <div className="g-stat next">
          <div className="l">다음 일정</div>
          <div className="v">{nextD === null ? "—" : nextD <= 0 ? "진행 중" : `D-${nextD}`}</div>
          <div className="d">{next ? `${fmtShort(next.starts_on)} ${next.title}` : "예정된 일정이 없습니다"}</div>
        </div>
        <Link href="/admin/gni/docs" className="g-stat">
          <div className="l">공문·메일</div>
          <div className="v">{docs.length}<small> 건</small></div>
          <div className="d">{docs[0] ? `최근 ${fmtShort(docs[0].doc_date)}` : "등록된 문서 없음"}</div>
        </Link>
        <Link href="/admin/gni/decisions" className="g-stat">
          <div className="l">결정 대기</div>
          <div className="v">{openDecisions}<small> / {decisions.length}</small></div>
          <div className="d">협의가 필요한 안건</div>
        </Link>
        <Link href="/admin/gni/checklist" className="g-stat">
          <div className="l">준비 진행률</div>
          <div className="v">{pct}<small>%</small></div>
          <div className="ring"><i style={{ width: `${pct}%` }} /></div>
        </Link>
      </div>

      <div className="g-grid2">
        <section className="g-card">
          <h2>다가오는 일정 <Link className="more" href="/admin/gni/schedule">전체 일정</Link></h2>
          {upcoming.length === 0 ? <div className="empty">남은 일정이 없습니다.</div> : (
            <ul className="g-list">
              {upcoming.map((m) => (
                <li className="g-row" key={m.id}>
                  <div className="when"><b>{Number(m.starts_on.slice(8))}</b><small>{Number(m.starts_on.slice(5, 7))}월</small></div>
                  <div className="body">
                    <b>{m.title}</b>
                    <div className="sub">{m.owner ?? "담당 미정"}{m.ends_on ? ` · ~${fmtShort(m.ends_on)}` : ""}</div>
                  </div>
                  <div className="side-r"><DueTag date={m.starts_on} end={m.ends_on} /><DocLink id={m.doc_id} docs={docs} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="g-card">
          <h2>사업 개요</h2>
          <ul className="g-list">
            {([
              ["주관", "경상국립대학교"],
              ["중심대학", "울산과학대 · 마산대 · 경남대 · 국립부경대 · 동아대"],
              ["기간", "2026.9.1. ~ 2030.2. (1차년도 ~2027.2.28.)"],
              ["역할", "미래모빌리티 혁신제조분야 중심대학 · 산업AX전공 운영"],
              ["참여대학", "김해대 · 동의과학대 · 연암공대 · 한국승강기대"],
              ...(hub ? [["사업비", "연 300백만원 (4년 총 1,200백만원)"]] : []),
            ] as [string, string][]).map(([k, v]) => (
              <li className="g-row" key={k}>
                <div className="body"><div className="sub">{k}</div><b style={{ fontWeight: 600 }}>{v}</b></div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="g-grid2">
        <section className="g-card">
          <h2>최근 공문·메일 <Link className="more" href="/admin/gni/docs">전체 보기</Link></h2>
          <ul className="g-list">
            {docs.slice(0, 5).map((d) => (
              <li className="g-row" key={d.id}>
                <div className="when"><b>{Number(d.doc_date.slice(8))}</b><small>{Number(d.doc_date.slice(5, 7))}월</small></div>
                <Link className="body" href={`/admin/gni/docs#d-${d.id}`}>
                  <b>{d.title}</b>
                  <div className="sub" style={{ display: "flex", gap: 4, marginTop: 4 }}><KindTag kind={d.kind} dir={d.direction} /></div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="g-card">
          <h2>마감 임박 할 일 <Link className="more" href="/admin/gni/checklist">체크리스트</Link></h2>
          {dueSoon.length === 0 ? <div className="empty">기한이 있는 남은 할 일이 없습니다.</div> : (
            <ul className="g-list">
              {dueSoon.map((c) => (
                <li className="g-row" key={c.id}>
                  <div className="body"><b>{c.task}</b><div className="sub">{c.grp} · {c.owner ?? "담당 미정"} · {fmtShort(c.due_on!)}</div></div>
                  <div className="side-r"><DueTag date={c.due_on} /></div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

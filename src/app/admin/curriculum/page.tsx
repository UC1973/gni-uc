import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui";
import { PageHead } from "@/components/admin";
import { CourseTable } from "./CourseTable";
import { CourseRoadmap } from "@/components/CourseRoadmap";
import { DegBadge } from "@/components/ui";
import { TERMS, type Course } from "@/lib/types";

export default async function CurriculumPage() {
  const me = await requireStaff();
  const hub = me.role === "hub_admin";
  const supabase = await createClient();
  const { data } = await supabase.from("courses").select("*").order("sort");
  const courses = (data ?? []) as Course[];
  const total = courses.reduce((a, c) => a + c.credits, 0);
  const hubCr = courses.filter((c) => c.host.includes("울산과학대")).reduce((a, c) => a + c.credits, 0);
  const ratio = total ? (hubCr / total) * 100 : 0;

  return (
    <>
      <PageHead title="교육과정 관리" desc={hub ? "상태를 '확정'으로 바꾸고 저장하면 학생용 홈페이지에 바로 반영됩니다." : "교육과정은 UC 사업단이 확정합니다. 의견은 협의 안건으로 전달해 주세요."} />
      <div className={`alert ${ratio > 50 ? "warn" : "info"}`}>ℹ️ <div>중심대학(울산과학대) 개설 비율 <b className="num">{hubCr}/{total}학점 ({ratio.toFixed(0)}%)</b> — 50% 이하 원칙 {ratio > 50 ? <b>초과</b> : "충족"}. 개설대학을 바꾸면 다시 계산됩니다.</div></div>

      {(() => {
        const ok = courses.filter((c) => c.status === "ok");
        const cr = (l: typeof courses) => l.reduce((a, c) => a + c.credits, 0);
        const nd = courses.filter((c) => c.degree === "ND");
        const md = courses.filter((c) => c.degree === "MD");
        const pct = courses.length ? Math.round((ok.length / courses.length) * 100) : 0;
        return (
          <section className="panel cr-list">
            <h2>교과목 리스트 <span className="aside">교육과정 확정 현황 · 학생 홈페이지와 같은 내용</span></h2>
            <div className="kpis num cr-kpis">
              <div className="kpi"><div className="l">확정 교과목</div><div className="v">{ok.length}<small> / {courses.length}과목</small></div><div className="prog"><i style={{ width: `${pct}%` }} /></div><div className="d">협의 중 {courses.filter((c) => c.status === "wip").length} · (안) {courses.filter((c) => c.status === "draft").length}</div></div>
              <div className="kpi"><div className="l">확정 학점</div><div className="v">{cr(ok)}<small> / {total}학점</small></div><div className="d">ND {cr(ok.filter((c) => c.degree === "ND"))} · MD {cr(ok.filter((c) => c.degree === "MD"))}</div></div>
              <div className="kpi"><div className="l">나노디그리(ND)</div><div className="v">{cr(nd)}<small> 학점 · {nd.length}과목</small></div><div className="d">산업AX기초</div></div>
              <div className="kpi"><div className="l">마이크로디그리(MD)</div><div className="v">{cr(md)}<small> 학점 · {md.length}과목</small></div><div className="d">산업AX실무</div></div>
            </div>
            <CourseRoadmap courses={courses} />
            <div className="cr-ok">
              <b>확정 교과목 {ok.length}과목</b>
              {ok.length === 0 ? <span className="small muted">아직 확정된 교과목이 없습니다. 아래 표에서 상태를 ‘확정’으로 저장하면 여기와 학생 홈페이지에 반영됩니다.</span> : (
                <ul>{ok.map((c) => <li key={c.id}><DegBadge degree={c.degree} /> <b>{c.name}</b> <span className="small muted num">{TERMS.find(([k]) => k === c.term)?.[1] ?? c.term} · {c.theory}/{c.practice}/{c.credits}학점 · {c.host}{c.course_code ? ` · ${c.course_code}` : ""}</span></li>)}</ul>
              )}
            </div>
          </section>
        );
      })()}
      <h2 className="month">교과목 {hub ? "수정" : "상세"}</h2>
      <CourseTable courses={courses} hub={hub} />
      <div className="panel"><h2>정합성 점검 (11.20. 협의 자료)</h2><ul className="todo">
        <li><Badge status="wip" /> 프로젝트 필수교과(전필) 배치 원칙과 현재 전선 편성표의 관계</li>
        <li><Badge status="wip" /> ND·MD 한 학년 내 이수 가능성 (동계 포함 학점·학사일정)</li>
        <li><Badge status="wip" /> 과목별 개설대학 · 운영 분담 · 책임시수</li>
        <li><Badge status="wip" /> 교과목코드 · 시수 · 평가 · 인정 기준 통일</li>
      </ul></div>
    </>
  );
}

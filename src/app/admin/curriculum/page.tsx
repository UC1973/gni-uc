import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge, DegBadge } from "@/components/ui";
import { PageHead, StatusSelect } from "@/components/admin";
import { updateCourse } from "../actions";
import type { Course } from "@/lib/types";

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

      {courses.map((c) => hub && <form key={c.id} id={`c-${c.id}`} action={updateCourse}><input type="hidden" name="id" value={c.id} /></form>)}
      <div className="panel" style={{ overflowX: "auto" }}>
        <table className="num">
          <thead><tr><th>학기</th><th>과정</th><th>교과목명</th><th className="c">이론/실습/계</th><th>개설대학</th><th>교과목코드</th><th>비고</th><th>상태</th>{hub && <th />}</tr></thead>
          <tbody>
            {courses.map((c) => hub ? (
              <tr key={c.id} className="inline">
                <td>{c.term}</td><td><DegBadge degree={c.degree} /></td>
                <td><input form={`c-${c.id}`} name="name" defaultValue={c.name} aria-label="교과목명" style={{ minWidth: 150 }} /></td>
                <td className="c">{c.theory}/{c.practice}/{c.credits}</td>
                <td><input form={`c-${c.id}`} name="host" defaultValue={c.host} aria-label="개설대학" style={{ minWidth: 120 }} /></td>
                <td><input form={`c-${c.id}`} name="course_code" defaultValue={c.course_code ?? ""} placeholder="미부여" aria-label="교과목코드" style={{ width: 100 }} /></td>
                <td><input form={`c-${c.id}`} name="note" defaultValue={c.note ?? ""} aria-label="비고" style={{ minWidth: 140 }} /></td>
                <td><StatusSelect form={`c-${c.id}`} value={c.status} /></td>
                <td><button form={`c-${c.id}`} className="btn btn-o btn-s">저장</button></td>
              </tr>
            ) : (
              <tr key={c.id}><td>{c.term}</td><td><DegBadge degree={c.degree} /></td><td><b>{c.name}</b></td><td className="c">{c.theory}/{c.practice}/{c.credits}</td><td>{c.host}</td><td className="muted">{c.course_code ?? "미부여"}</td><td className="small" style={{ color: "var(--warn)" }}>{c.note}</td><td><Badge status={c.status} /></td></tr>
            ))}
            <tr><td colSpan={3} style={{ textAlign: "right", fontWeight: 700 }}>합계</td><td className="c"><b>{total}학점</b></td><td colSpan={hub ? 5 : 4} className="small muted">ND {courses.filter((c) => c.degree === "ND").reduce((a, c) => a + c.credits, 0)} + MD {courses.filter((c) => c.degree === "MD").reduce((a, c) => a + c.credits, 0)} · 이수학점표상 모두 선택학점</td></tr>
          </tbody>
        </table>
      </div>
      <div className="panel"><h2>정합성 점검 (11.20. 협의 자료)</h2><ul className="todo">
        <li><Badge status="wip" /> 프로젝트 필수교과(전필) 배치 원칙과 현재 전선 편성표의 관계</li>
        <li><Badge status="wip" /> ND·MD 한 학년 내 이수 가능성 (동계 포함 학점·학사일정)</li>
        <li><Badge status="wip" /> 과목별 개설대학 · 운영 분담 · 책임시수</li>
        <li><Badge status="wip" /> 교과목코드 · 시수 · 평가 · 인정 기준 통일</li>
      </ul></div>
    </>
  );
}

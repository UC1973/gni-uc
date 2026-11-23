import { Badge, DegBadge } from "@/components/ui";
import { StatusSelect } from "@/components/admin";
import { TERMS, type Course } from "@/lib/types";
import { updateCourse } from "../actions";

const termLabel = (t: string) => TERMS.find(([k]) => k === t)?.[1] ?? t;

/** 교육과정표: 넓은 화면은 표, 휴대폰(760px 이하)은 과목별 카드 (data-label로 항목명 표시) */
export function CourseTable({ courses, hub }: { courses: Course[]; hub: boolean }) {
  const total = courses.reduce((a, c) => a + c.credits, 0);
  const sum = (d: Course["degree"]) => courses.filter((c) => c.degree === d).reduce((a, c) => a + c.credits, 0);
  return (
    <>
      {hub && courses.map((c) => <form key={c.id} id={`c-${c.id}`} action={updateCourse}><input type="hidden" name="id" value={c.id} /></form>)}
      <div className="panel ct-wrap">
        <table className="num ct">
          <thead><tr><th>학기</th><th>과정</th><th>교과목명</th><th className="c">이론/실습/계</th><th>개설대학</th><th>교과목코드</th><th>비고</th><th>상태</th>{hub && <th />}</tr></thead>
          <tbody>
            {courses.map((c) => hub ? (
              <tr key={c.id} className="edit-row">
                <td data-label="학기" className="ct-term">{termLabel(c.term)}</td>
                <td data-label="과정" className="ct-deg"><DegBadge degree={c.degree} /></td>
                <td data-label="교과목명" className="ct-name"><input form={`c-${c.id}`} name="name" defaultValue={c.name} aria-label="교과목명" /></td>
                <td data-label="이론/실습/계" className="c">{c.theory}/{c.practice}/{c.credits}</td>
                <td data-label="개설대학"><input form={`c-${c.id}`} name="host" defaultValue={c.host} aria-label="개설대학" /></td>
                <td data-label="교과목코드"><input form={`c-${c.id}`} name="course_code" defaultValue={c.course_code ?? ""} placeholder="미부여" aria-label="교과목코드" /></td>
                <td data-label="비고"><input form={`c-${c.id}`} name="note" defaultValue={c.note ?? ""} aria-label="비고" /></td>
                <td data-label="상태"><StatusSelect form={`c-${c.id}`} value={c.status} /></td>
                <td className="ct-act"><button form={`c-${c.id}`} className="btn btn-o btn-s">저장</button></td>
              </tr>
            ) : (
              <tr key={c.id}>
                <td data-label="학기" className="ct-term">{termLabel(c.term)}</td>
                <td data-label="과정" className="ct-deg"><DegBadge degree={c.degree} /></td>
                <td data-label="교과목명" className="ct-name"><b>{c.name}</b></td>
                <td data-label="이론/실습/계" className="c">{c.theory}/{c.practice}/{c.credits}</td>
                <td data-label="개설대학">{c.host}</td>
                <td data-label="교과목코드" className="muted">{c.course_code ?? "미부여"}</td>
                <td data-label="비고" className="small ct-note" style={{ color: c.note ? "var(--warn)" : "var(--muted)" }}>{c.note ?? "–"}</td>
                <td data-label="상태"><Badge status={c.status} /></td>
              </tr>
            ))}
            <tr className="ct-total">
              <td colSpan={3} style={{ textAlign: "right", fontWeight: 700 }}>합계</td>
              <td className="c"><b>{total}학점</b></td>
              <td colSpan={hub ? 5 : 4} className="small muted">ND {sum("ND")} + MD {sum("MD")} · 이수학점표상 모두 선택학점</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

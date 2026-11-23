import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui";
import { PageHead } from "@/components/admin";
import { CourseTable } from "./CourseTable";
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

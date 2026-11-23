import { Badge, DegBadge } from "@/components/ui";
import { TERMS, type Course } from "@/lib/types";

/** 학기별 교과목 로드맵 (학생 홈페이지·교육과정 관리 공통) */
export function CourseRoadmap({ courses }: { courses: Course[] }) {
  return (
    <div className="road">
      {TERMS.map(([key, label]) => {
        const list = courses.filter((c) => c.term === key);
        return (
          <div className="term" key={key}>
            <h4><span>{label}</span><span className="num">{list.reduce((a, c) => a + c.credits, 0)}학점</span></h4>
            {list.map((c) => (
              <div className="course" key={c.id} style={{ ["--c" as string]: c.degree === "ND" ? "var(--nd)" : "var(--md)" }}>
                <div className="top"><DegBadge degree={c.degree} /><Badge status={c.status} /></div>
                <b>{c.name}</b>
                <div className="meta num"><span>{c.theory}/{c.practice}/{c.credits}학점</span><span>개설: {c.host}</span>{c.course_code && <span>{c.course_code}</span>}</div>
                {c.note && <div className="note">※ {c.note}</div>}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

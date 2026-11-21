import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Tag } from "@/components/ui";
import { PageHead } from "@/components/admin";
import { addStudent, deleteStudent, updateStudentStatus } from "../actions";
import type { Student, University } from "@/lib/types";

const STATES = ["신청", "선발", "이수중", "이수완료", "중도포기"];
const TONE: Record<string, "info" | "ok" | "wip" | "bad" | "draft"> = { 신청: "wip", 선발: "info", 이수중: "info", 이수완료: "ok", 중도포기: "bad" };

export default async function StudentsPage() {
  const me = await requireStaff();
  const hub = me.role === "hub_admin";
  const supabase = await createClient();
  const [u, s] = await Promise.all([supabase.from("universities").select("*").order("sort"), supabase.from("students").select("*").order("created_at", { ascending: false })]);
  const univs = (u.data ?? []) as University[];
  const students = (s.data ?? []) as Student[];
  const myUniv = univs.find((x) => x.id === me.university_id);
  const deptOptions = hub ? [...new Set(univs.flatMap((x) => x.depts))] : myUniv?.depts ?? [];
  const short = (id: string) => univs.find((x) => x.id === id)?.short_name ?? id;
  const canEdit = me.role !== "professor";

  return (
    <>
      <PageHead title="학생관리" desc={hub ? "5개 대학 신청 학생을 관리합니다." : `${myUniv?.name ?? ""} 학생만 표시됩니다.`} />
      <div className="kpis num">
        <div className="kpi"><div className="l">모집 목표(안)</div><div className="v">{hub ? univs.reduce((a, x) => a + x.quota, 0) : myUniv?.quota ?? 0}<small> 명</small></div></div>
        <div className="kpi"><div className="l">신청</div><div className="v">{students.length}<small> 명</small></div></div>
        <div className="kpi"><div className="l">평점 2.5 미만</div><div className="v" style={{ color: "var(--bad)" }}>{students.filter((x) => x.gpa !== null && x.gpa < 2.5).length}<small> 명</small></div></div>
        <div className="kpi"><div className="l">선발·이수</div><div className="v">{students.filter((x) => ["선발", "이수중", "이수완료"].includes(x.status)).length}<small> 명</small></div></div>
      </div>
      {canEdit && (
        <form action={addStudent} className="panel">
          <h2>학생 등록</h2>
          <div className="form-grid">
            {hub && <label>소속 대학<select name="university_id">{univs.map((x) => <option key={x.id} value={x.id}>{x.short_name}</option>)}</select></label>}
            <label>학과<select name="dept">{deptOptions.map((d) => <option key={d}>{d}</option>)}</select></label>
            <label>학번<input name="student_no" required /></label>
            <label>이름<input name="name" required /></label>
            <label>평점<input name="gpa" type="number" step="0.01" min="0" max="4.5" /></label>
            <button className="btn btn-p btn-s">등록</button>
          </div>
        </form>
      )}
      <div className="panel" style={{ overflowX: "auto" }}>
        <table className="num">
          <thead><tr><th>소속</th><th>학과</th><th>학번</th><th>이름</th><th>평점</th><th>상태</th>{canEdit && <th />}</tr></thead>
          <tbody>
            {students.length === 0 && <tr><td colSpan={7}><div className="empty">등록된 학생이 없습니다. 수강신청(2027.02.) 결과를 등록하면 여기에 표시됩니다.</div></td></tr>}
            {students.map((x) => (
              <tr key={x.id}>
                <td>{short(x.university_id)}</td><td>{x.dept}</td><td>{x.student_no}</td><td><b>{x.name}</b></td>
                <td style={{ color: x.gpa !== null && x.gpa < 2.5 ? "var(--bad)" : undefined }}>{x.gpa ?? "–"}</td>
                <td>{canEdit ? (
                  <form action={updateStudentStatus} className="inline"><input type="hidden" name="id" value={x.id} />
                    <select name="status" defaultValue={x.status} aria-label="상태">{STATES.map((s2) => <option key={s2}>{s2}</option>)}</select>
                    <button className="btn btn-o btn-s">변경</button></form>
                ) : <Tag tone={TONE[x.status] ?? "draft"}>{x.status}</Tag>}</td>
                {canEdit && <td><form action={deleteStudent}><input type="hidden" name="id" value={x.id} /><button className="btn btn-o btn-s">삭제</button></form></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel"><h2>성적 입력 방식 <Tag tone="wip">협의 중</Tag></h2><p className="small muted">1안 등급제(상대평가 시 A+·A0 30% 이내) / 2안 S/U — 협의 결과에 따라 성적 입력 화면을 추가합니다.</p></div>
    </>
  );
}

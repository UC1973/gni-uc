export type AuditRow = {
  id: number; at: string; actor_id: string | null; actor_name: string | null; actor_email: string | null; actor_university: string | null;
  table_name: string; row_key: string | null; row_label: string | null; action: "insert" | "update" | "delete";
  changes: Record<string, { from?: unknown; to?: unknown }>;
};

export const TABLE_LABEL: Record<string, string> = {
  profiles: "사용자", courses: "교과목", issues: "협의 안건", meetings: "회의", replies: "대학 회신", reply_files: "회신 파일",
  students: "학생", kpis: "성과지표", notices: "공지", materials: "홍보자료", site_settings: "사이트 설정",
  universities: "참여대학", extra_programs: "비교과", extra_demand: "비교과 수요", audit_log: "변경 이력",
  gni_docs: "GNI 공문·메일", gni_doc_notes: "GNI 사업단 메모", gni_schedule: "GNI 일정", gni_decisions: "GNI 결정 사항", gni_checklist: "GNI 체크리스트",
  gni_surveys: "GNI 의견수렴", meeting_files: "회의 첨부파일", gni_survey_files: "의견수렴 첨부파일", gni_survey_notices: "의견수렴 안내 메일", gni_survey_responses: "GNI 대학 의견",
};
export const ACTION_LABEL = { insert: "추가", update: "수정", delete: "삭제" } as const;

const FIELD_LABEL: Record<string, string> = {
  status: "상태", role: "역할", name: "이름", host: "개설대학", course_code: "교과목코드", note: "비고", decision: "결정",
  install_doc: "설치 공문", curriculum_doc: "교육과정표", enroll_period: "수강신청 기간", grade_period: "성적입력 기간",
  target: "목표", actual: "실적", title: "제목", body: "본문", published: "게시", value: "값", key: "항목", count: "인원",
  gpa: "평점", student_no: "학번", dept: "학과", file_name: "파일명", size_bytes: "크기", kind: "서류", email: "이메일",
  email_confirmed: "이메일 인증", university_id: "대학", category: "분류", detail: "내용", term: "학기", degree: "과정",
  theory: "이론", practice: "실습", credits: "학점", sort: "순서", quota: "모집인원", depts: "학과", email_domains: "메일 도메인",
  object_path: "저장 경로", mime_type: "형식", uploaded_by: "올린 사람", author_id: "작성자", program_id: "프로그램",
  held_on: "일자", attendees: "참석", summary: "요약", material_url: "자료", description: "설명", unit: "단위", caption: "설명", url: "주소",
  is_hub: "중심대학", short_name: "약칭", question: "질문", starts_at: "시작", ends_at: "종료", method: "방법", place: "장소", agenda: "안건", notice: "안내 사항", decisions: "결정 사항", actions: "후속 조치", due_on: "마감일", area: "분야", updated_by: "작성자", survey_id: "의견수렴", before: "기준 일시(이전 기록)",
};
const VALUE_LABEL: Record<string, Record<string, string>> = {
  status: { draft: "(안)", wip: "협의 중", ok: "확정", open: "진행 중", closed: "마감", pending: "승인 대기", approved: "승인", rejected: "반려" },
  role: { hub_admin: "UC 사업단", univ_staff: "대학 담당자", professor: "교수" },
  kind: { install_doc: "신설(설치) 공문", curriculum_doc: "교육과정표" },
};
const HIDDEN = new Set(["object_path", "uploaded_by", "author_id", "id"]);

export function fieldLabel(k: string, table?: string) {
  if (table === "audit_log" && k === "count") return "파기 건수";
  return FIELD_LABEL[k] ?? k;
}

export function formatValue(field: string, v: unknown): string {
  if (v === null || v === undefined) return "없음";
  if (typeof v === "boolean") return v ? "예" : "아니오";
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  const s = String(v);
  if (VALUE_LABEL[field]?.[s]) return VALUE_LABEL[field][s];
  if (field === "size_bytes") { const n = Number(s); return n > 1048576 ? `${(n / 1048576).toFixed(1)}MB` : `${Math.round(n / 1024)}KB`; }
  return s.length > 80 ? `${s.slice(0, 80)}…` : s;
}

/** 화면·CSV용 한 줄 설명 */
export function describe(row: AuditRow): string[] {
  return Object.entries(row.changes)
    .filter(([k]) => !HIDDEN.has(k))
    .map(([k, c]) => {
      const label = fieldLabel(k, row.table_name);
      if (row.action === "update") return `${label}: ${formatValue(k, c.from)} → ${formatValue(k, c.to)}`;
      if (row.action === "insert") return `${label}: ${formatValue(k, c.to)}`;
      return `${label}: ${formatValue(k, c.from)}`;
    });
}

export function actorText(row: AuditRow) {
  if (!row.actor_id) return "시스템";
  return row.actor_name ? `${row.actor_name}${row.actor_university ? ` (${row.actor_university})` : ""}` : (row.actor_email ?? "알 수 없음");
}

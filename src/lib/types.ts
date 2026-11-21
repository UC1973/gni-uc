export type ItemStatus = "draft" | "wip" | "ok";
export type Role = "hub_admin" | "univ_staff" | "professor";
export type UserStatus = "pending" | "approved" | "rejected";

export type University = { id: string; name: string; short_name: string; is_hub: boolean; depts: string[]; quota: number; sort: number; email_domains?: string[] };
export type Profile = { id: string; email: string; name: string; university_id: string | null; role: Role; status: UserStatus; email_confirmed: boolean; created_at: string };
export type Course = { id: number; term: string; name: string; degree: "ND" | "MD"; theory: number; practice: number; credits: number; host: string; course_code: string | null; status: ItemStatus; note: string | null; sort: number };
export type Issue = { id: number; category: string; title: string; detail: string | null; status: ItemStatus; decision: string | null; created_at: string };
export type Meeting = { id: number; held_on: string; title: string; attendees: string | null; summary: string | null; material_url: string | null };
export type Reply = { university_id: string; install_doc: boolean; curriculum_doc: boolean; enroll_period: string | null; grade_period: string | null };
export type Student = { id: number; university_id: string; dept: string; student_no: string; name: string; gpa: number | null; status: string };
export type ExtraProgram = { id: number; name: string; description: string | null; status: ItemStatus; sort: number };
export type ExtraDemand = { program_id: number; university_id: string; count: number };
export type Kpi = { id: number; name: string; unit: string; target: number | null; actual: number | null; status: ItemStatus; sort: number };
export type Notice = { id: number; category: string; title: string; body: string | null; published: boolean; created_at: string };
export type Material = { id: number; kind: string; title: string; caption: string | null; url: string | null; published: boolean; sort: number };

export const ROLE_LABEL: Record<Role, string> = { hub_admin: "UC 사업단", univ_staff: "대학 담당자", professor: "교수" };
export const STATUS_LABEL: Record<ItemStatus, string> = { ok: "확정", wip: "협의 중", draft: "(안)" };
export const TERMS: [string, string][] = [["2-1", "2학년 1학기"], ["2-2", "2학년 2학기"], ["동계", "2학년 동계"]];

"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { sendApproved, sendRejected } from "@/lib/email";
import type { ItemStatus, Role } from "@/lib/types";

const STATUSES: ItemStatus[] = ["draft", "wip", "ok"];
const asStatus = (v: FormDataEntryValue | null): ItemStatus => (STATUSES.includes(v as ItemStatus) ? (v as ItemStatus) : "draft");
const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const numOrNull = (v: FormDataEntryValue | null) => (str(v) === "" ? null : Number(v));

function done(...paths: string[]) {
  paths.forEach((p) => revalidatePath(p));
}

/* ---------- 교육과정 (사업단) ---------- */
export async function updateCourse(form: FormData) {
  await requireStaff({ hubOnly: true });
  const supabase = await createClient();
  const { error } = await supabase.from("courses").update({
    name: str(form.get("name")),
    host: str(form.get("host")),
    course_code: str(form.get("course_code")) || null,
    status: asStatus(form.get("status")),
    note: str(form.get("note")) || null,
    updated_at: new Date().toISOString(),
  }).eq("id", Number(form.get("id")));
  if (error) throw new Error(error.message);
  done("/admin/curriculum", "/admin", "/");
}

/* ---------- 협의 안건 (사업단) ---------- */
export async function createIssue(form: FormData) {
  await requireStaff({ hubOnly: true });
  const supabase = await createClient();
  const { error } = await supabase.from("issues").insert({
    category: str(form.get("category")) || "기타",
    title: str(form.get("title")),
    detail: str(form.get("detail")) || null,
    status: "wip",
  });
  if (error) throw new Error(error.message);
  done("/admin/issues", "/admin");
}
export async function updateIssue(form: FormData) {
  await requireStaff({ hubOnly: true });
  const supabase = await createClient();
  const { error } = await supabase.from("issues").update({
    status: asStatus(form.get("status")),
    decision: str(form.get("decision")) || null,
    updated_at: new Date().toISOString(),
  }).eq("id", Number(form.get("id")));
  if (error) throw new Error(error.message);
  done("/admin/issues", "/admin");
}

/* ---------- 대학별 회신 (사업단 또는 소속 대학) ---------- */
export async function updateReply(form: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("replies").update({
    install_doc: form.get("install_doc") === "on",
    curriculum_doc: form.get("curriculum_doc") === "on",
    enroll_period: str(form.get("enroll_period")) || null,
    grade_period: str(form.get("grade_period")) || null,
    updated_at: new Date().toISOString(),
  }).eq("university_id", str(form.get("university_id")));
  if (error) throw new Error(error.message);
  done("/admin/univs", "/admin");
}

/* ---------- 학생 ---------- */
export async function addStudent(form: FormData) {
  const me = await requireStaff();
  const supabase = await createClient();
  const university_id = me.role === "hub_admin" ? str(form.get("university_id")) : me.university_id;
  const { error } = await supabase.from("students").insert({
    university_id,
    dept: str(form.get("dept")),
    student_no: str(form.get("student_no")),
    name: str(form.get("name")),
    gpa: numOrNull(form.get("gpa")),
    status: "신청",
  });
  if (error) throw new Error(error.code === "23505" ? "이미 등록된 학번입니다." : error.message);
  done("/admin/students", "/admin");
}
export async function updateStudentStatus(form: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("students").update({ status: str(form.get("status")) }).eq("id", Number(form.get("id")));
  if (error) throw new Error(error.message);
  done("/admin/students", "/admin");
}
export async function deleteStudent(form: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("students").delete().eq("id", Number(form.get("id")));
  if (error) throw new Error(error.message);
  done("/admin/students", "/admin");
}

/* ---------- 비교과 수요 ---------- */
export async function setDemand(form: FormData) {
  await requireStaff();
  const supabase = await createClient();
  const { error } = await supabase.from("extra_demand").upsert({
    program_id: Number(form.get("program_id")),
    university_id: str(form.get("university_id")),
    count: Math.max(0, Number(form.get("count") || 0)),
  });
  if (error) throw new Error(error.message);
  done("/admin/extra");
}

/* ---------- 성과지표 (사업단) ---------- */
export async function updateKpi(form: FormData) {
  await requireStaff({ hubOnly: true });
  const supabase = await createClient();
  const { error } = await supabase.from("kpis").update({
    target: numOrNull(form.get("target")),
    actual: numOrNull(form.get("actual")),
    status: asStatus(form.get("status")),
    updated_at: new Date().toISOString(),
  }).eq("id", Number(form.get("id")));
  if (error) throw new Error(error.message);
  done("/admin/kpi");
}

/* ---------- 콘텐츠 (사업단) ---------- */
export async function createNotice(form: FormData) {
  const me = await requireStaff({ hubOnly: true });
  const supabase = await createClient();
  const { error } = await supabase.from("notices").insert({
    category: str(form.get("category")) || "안내",
    title: str(form.get("title")),
    body: str(form.get("body")) || null,
    published: form.get("published") === "on",
    author_id: me.id,
  });
  if (error) throw new Error(error.message);
  done("/admin/cms", "/");
}
export async function toggleNotice(form: FormData) {
  await requireStaff({ hubOnly: true });
  const supabase = await createClient();
  const { error } = await supabase.from("notices").update({ published: form.get("published") === "true" }).eq("id", Number(form.get("id")));
  if (error) throw new Error(error.message);
  done("/admin/cms", "/");
}
export async function deleteNotice(form: FormData) {
  await requireStaff({ hubOnly: true });
  const supabase = await createClient();
  const { error } = await supabase.from("notices").delete().eq("id", Number(form.get("id")));
  if (error) throw new Error(error.message);
  done("/admin/cms", "/");
}
export async function updateSetting(form: FormData) {
  await requireStaff({ hubOnly: true });
  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert({ key: str(form.get("key")), value: str(form.get("value")) });
  if (error) throw new Error(error.message);
  done("/admin/cms", "/", "/admin");
}

/* ---------- 사용자 승인 (사업단) ---------- */
export async function reviewUser(form: FormData) {
  await requireStaff({ hubOnly: true });
  const supabase = await createClient();
  const decision = str(form.get("decision"));
  const role = str(form.get("role")) as Role;
  const status = decision === "approve" ? "approved" : "rejected";
  const update: { status: string; role?: Role } = { status };
  if (["hub_admin", "univ_staff", "professor"].includes(role)) update.role = role;

  const { data, error } = await supabase.from("profiles").update(update).eq("id", str(form.get("id"))).select("email,name").single();
  if (error) throw new Error(error.message);
  if (data) await (status === "approved" ? sendApproved(data.email, data.name) : sendRejected(data.email, data.name));
  done("/admin/users");
}

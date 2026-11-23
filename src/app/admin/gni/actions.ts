"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SURVEY_BUCKET } from "@/lib/survey-files";
import { AREAS, DIRECTIONS, DOC_KINDS, FILE_STATES, PHASES, type Attachment, type DocRequest } from "@/lib/gni-docs";

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const opt = (v: FormDataEntryValue | null) => str(v) || null;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const date = (v: FormDataEntryValue | null) => (DATE.test(str(v)) ? str(v) : null);
const oneOf = <T extends string>(list: readonly T[], v: FormDataEntryValue | null, fallback: T): T => (list.includes(str(v) as T) ? (str(v) as T) : fallback);
const lines = (v: FormDataEntryValue | null) => str(v).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const id = (v: FormDataEntryValue | null) => {
  const n = Number(v);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
};

async function hub() {
  await requireStaff({ hubOnly: true });
  return createClient();
}

function done() {
  revalidatePath("/admin/gni", "layout");
  revalidatePath("/admin");
}

function fail(what: string, error: { message: string } | null) {
  if (error) {
    console.error(`[gni] ${what} 실패`, error);
    throw new Error(`${what}에 실패했습니다.`);
  }
}

/** "내용 | 2026-12-04 16:00 | 방법" */
function parseRequests(v: FormDataEntryValue | null): DocRequest[] {
  return lines(v).map((l) => {
    const [what, when = "", how = ""] = l.split("|").map((x) => x.trim());
    const [d = "", t = ""] = when.split(/\s+/);
    return { what, due: DATE.test(d) ? d : null, time: /^\d{1,2}:\d{2}$/.test(t) ? t : null, how: how || null };
  }).filter((r) => r.what);
}

/** "파일명 | 원본/보관본/미확보 | 메모" */
function parseAttachments(v: FormDataEntryValue | null): Attachment[] {
  return lines(v).map((l) => {
    const [name, file = "", note = ""] = l.split("|").map((x) => x.trim());
    return { name, file: oneOf(FILE_STATES, file, "미확보"), note: note || null };
  }).filter((a) => a.name);
}

/* ---------- 공문·메일 ---------- */
function docFields(form: FormData) {
  const title = str(form.get("title"));
  const doc_date = date(form.get("doc_date"));
  const sender = str(form.get("sender"));
  if (!title || !doc_date || !sender) throw new Error("일자, 보낸 곳, 제목은 꼭 입력해 주세요.");
  return {
    doc_date,
    kind: oneOf(DOC_KINDS, form.get("kind"), "공문"),
    direction: oneOf(DIRECTIONS, form.get("direction"), "수신"),
    sender,
    recipient: opt(form.get("recipient")),
    doc_no: opt(form.get("doc_no")),
    title,
    points: lines(form.get("points")),
    requests: parseRequests(form.get("requests")),
    attachments: parseAttachments(form.get("attachments")),
    internal_note: opt(form.get("internal_note")),
  };
}

async function saveNote(supabase: Awaited<ReturnType<typeof createClient>>, docId: number, note: string | null) {
  const { error } = note
    ? await supabase.from("gni_doc_notes").upsert({ doc_id: docId, note })
    : await supabase.from("gni_doc_notes").delete().eq("doc_id", docId);
  fail("사업단 메모 저장", error);
}

export async function createDoc(form: FormData) {
  const supabase = await hub();
  const { data, error } = await supabase.from("gni_docs").insert(docFields(form)).select("id").single();
  fail("공문 등록", error);
  await saveNote(supabase, data!.id, opt(form.get("hub_note")));
  done();
}

export async function updateDoc(form: FormData) {
  const supabase = await hub();
  const docId = id(form.get("id"));
  if (!docId) return;
  const { error } = await supabase.from("gni_docs").update(docFields(form)).eq("id", docId);
  fail("공문 수정", error);
  await saveNote(supabase, docId, opt(form.get("hub_note")));
  done();
}

export async function deleteDoc(form: FormData) {
  const supabase = await hub();
  const docId = id(form.get("id"));
  if (!docId) return;
  const { error } = await supabase.from("gni_docs").delete().eq("id", docId);
  fail("공문 삭제", error);
  done();
}

/* ---------- 일정 ---------- */
function milestoneFields(form: FormData) {
  const title = str(form.get("title"));
  const starts_on = date(form.get("starts_on"));
  if (!title || !starts_on) throw new Error("일자와 일정 이름은 꼭 입력해 주세요.");
  const ends_on = date(form.get("ends_on"));
  return {
    starts_on,
    ends_on: ends_on && ends_on >= starts_on ? ends_on : null,
    title,
    owner: opt(form.get("owner")),
    phase: oneOf(PHASES, form.get("phase"), "운영 준비"),
    doc_id: id(form.get("doc_id")),
  };
}

export async function saveMilestone(form: FormData) {
  const supabase = await hub();
  const rowId = id(form.get("id"));
  const { error } = rowId
    ? await supabase.from("gni_schedule").update(milestoneFields(form)).eq("id", rowId)
    : await supabase.from("gni_schedule").insert(milestoneFields(form));
  fail("일정 저장", error);
  done();
}

export async function deleteMilestone(form: FormData) {
  const supabase = await hub();
  const rowId = id(form.get("id"));
  if (!rowId) return;
  const { error } = await supabase.from("gni_schedule").delete().eq("id", rowId);
  fail("일정 삭제", error);
  done();
}

/* ---------- 결정 필요 사항 ---------- */
export async function saveDecision(form: FormData) {
  const supabase = await hub();
  const rowId = id(form.get("id"));
  const title = str(form.get("title"));
  if (!title) throw new Error("안건 이름을 입력해 주세요.");
  const row = {
    area: oneOf(AREAS, form.get("area"), "학사"),
    title,
    options: lines(form.get("options")),
    basis: opt(form.get("basis")),
    status: oneOf(["draft", "wip", "ok"] as const, form.get("status"), "wip"),
    decision: opt(form.get("decision")),
    doc_id: id(form.get("doc_id")),
  };
  const { error } = rowId
    ? await supabase.from("gni_decisions").update(row).eq("id", rowId)
    : await supabase.from("gni_decisions").insert({ ...row, sort: 1000 });
  fail("결정 사항 저장", error);
  done();
}

export async function decide(form: FormData) {
  const supabase = await hub();
  const rowId = id(form.get("id"));
  if (!rowId) return;
  const { error } = await supabase
    .from("gni_decisions")
    .update({ status: oneOf(["draft", "wip", "ok"] as const, form.get("status"), "wip"), decision: opt(form.get("decision")) })
    .eq("id", rowId);
  fail("결정 내용 저장", error);
  done();
}

export async function deleteDecision(form: FormData) {
  const supabase = await hub();
  const rowId = id(form.get("id"));
  if (!rowId) return;
  const { error } = await supabase.from("gni_decisions").delete().eq("id", rowId);
  fail("결정 사항 삭제", error);
  done();
}

/* ---------- 체크리스트 ---------- */
export async function saveCheck(form: FormData) {
  const supabase = await hub();
  const rowId = id(form.get("id"));
  const task = str(form.get("task"));
  const grp = str(form.get("grp"));
  if (!task || !grp) throw new Error("분류와 할 일을 입력해 주세요.");
  const row = { grp, task, owner: opt(form.get("owner")), due_on: date(form.get("due_on")), doc_id: id(form.get("doc_id")) };
  const { error } = rowId
    ? await supabase.from("gni_checklist").update(row).eq("id", rowId)
    : await supabase.from("gni_checklist").insert({ ...row, sort: 1000 });
  fail("할 일 저장", error);
  done();
}

export async function toggleCheck(form: FormData) {
  const supabase = await hub();
  const rowId = id(form.get("id"));
  if (!rowId) return;
  const { error } = await supabase.from("gni_checklist").update({ done: str(form.get("done")) === "1" }).eq("id", rowId);
  fail("완료 표시", error);
  done();
}

export async function deleteCheck(form: FormData) {
  const supabase = await hub();
  const rowId = id(form.get("id"));
  if (!rowId) return;
  const { error } = await supabase.from("gni_checklist").delete().eq("id", rowId);
  fail("할 일 삭제", error);
  done();
}

/* ---------- 의견수렴 ---------- */
export async function saveSurvey(form: FormData) {
  const supabase = await hub();
  const rowId = id(form.get("id"));
  const title = str(form.get("title"));
  if (!title) throw new Error("의견수렴 주제를 입력해 주세요.");
  const row = {
    area: oneOf(AREAS, form.get("area"), "교육과정"),
    title,
    question: opt(form.get("question")),
    due_on: date(form.get("due_on")),
    status: oneOf(["open", "closed"] as const, form.get("status"), "open"),
    doc_id: id(form.get("doc_id")),
    decision_id: id(form.get("decision_id")),
  };
  const { error } = rowId
    ? await supabase.from("gni_surveys").update(row).eq("id", rowId)
    : await supabase.from("gni_surveys").insert({ ...row, sort: 1000 });
  fail("의견수렴 저장", error);
  done();
}

export async function setSurveyStatus(form: FormData) {
  const supabase = await hub();
  const rowId = id(form.get("id"));
  if (!rowId) return;
  const { error } = await supabase.from("gni_surveys").update({ status: oneOf(["open", "closed"] as const, form.get("status"), "open") }).eq("id", rowId);
  fail("의견수렴 상태 변경", error);
  done();
}

export async function deleteSurvey(form: FormData) {
  const supabase = await hub();
  const rowId = id(form.get("id"));
  if (!rowId) return;
  // 첨부파일 저장소 정리 (행은 주제 삭제 시 함께 삭제)
  const { data: files } = await supabase.from("gni_survey_files").select("object_path").eq("survey_id", rowId);
  if (files?.length) await supabase.storage.from(SURVEY_BUCKET).remove(files.map((f) => f.object_path));
  const { error } = await supabase.from("gni_surveys").delete().eq("id", rowId);
  fail("의견수렴 삭제", error);
  done();
}

/** 소속 대학 의견 저장 — 대학은 로그인한 계정의 소속으로만 정함 (RLS로도 강제) */
export async function saveResponse(form: FormData) {
  const me = await requireStaff();
  if (me.role === "professor" || !me.university_id) throw new Error("소속 대학 담당자만 의견을 입력할 수 있습니다.");
  const surveyId = id(form.get("survey_id"));
  if (!surveyId) return;
  const body = str(form.get("body")).slice(0, 5000);
  const supabase = await createClient();
  const { error } = body
    ? await supabase.from("gni_survey_responses").upsert({ survey_id: surveyId, university_id: me.university_id, body }, { onConflict: "survey_id,university_id" })
    : await supabase.from("gni_survey_responses").delete().eq("survey_id", surveyId).eq("university_id", me.university_id);
  fail("의견 저장", error);
  done();
}

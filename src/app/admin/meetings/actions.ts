"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { scanFile } from "@/lib/file-scan";
import { extOf } from "@/lib/reply-files";
import { MEETING_ALLOWED_EXT, MEETING_BUCKET, MEETING_MAX_BYTES, MEETING_MAX_FILES, MEETING_METHODS, MEETING_STATUS } from "@/lib/meetings";

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const opt = (v: FormDataEntryValue | null) => str(v) || null;
const lines = (v: FormDataEntryValue | null) => str(v).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
const rid = (v: FormDataEntryValue | null) => { const n = Number(v); return Number.isSafeInteger(n) && n > 0 ? n : null; };
/** datetime-local(KST) → ISO */
const kst = (v: FormDataEntryValue | null) => (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str(v)) ? `${str(v)}:00+09:00` : null);

async function hub() {
  await requireStaff({ hubOnly: true });
  return createClient();
}
function done() {
  revalidatePath("/admin/meetings");
  revalidatePath("/admin/issues");
}
function fail(what: string, error: { message: string } | null) {
  if (error) { console.error(`[meetings] ${what} 실패`, error); throw new Error(`${what}에 실패했습니다.`); }
}

/** 일정 안내 저장 (등록·수정) */
export async function saveMeeting(form: FormData) {
  const supabase = await hub();
  const id = rid(form.get("id"));
  const title = str(form.get("title"));
  const starts_at = kst(form.get("starts_at"));
  if (!title || !starts_at) throw new Error("회의 이름과 일시는 꼭 입력해 주세요.");
  let ends_at = kst(form.get("ends_at"));
  if (ends_at && ends_at < starts_at) ends_at = null;
  const method = str(form.get("method"));
  const status = str(form.get("status"));
  const row = {
    title: title.slice(0, 300), starts_at, ends_at,
    held_on: starts_at.slice(0, 10),
    method: (MEETING_METHODS as readonly string[]).includes(method) ? method : null,
    place: opt(form.get("place"))?.slice(0, 500) ?? null,
    host: opt(form.get("host"))?.slice(0, 200) ?? null,
    agenda: lines(form.get("agenda")),
    notice: opt(form.get("notice"))?.slice(0, 3000) ?? null,
    status: status in MEETING_STATUS ? status : "planned",
  };
  const { error } = id ? await supabase.from("meetings").update(row).eq("id", id) : await supabase.from("meetings").insert(row);
  fail("회의 저장", error);
  done();
}

/** 회의 결과 저장 → 완료로 표시 */
export async function saveResult(form: FormData) {
  const supabase = await hub();
  const id = rid(form.get("id"));
  if (!id) return;
  const { error } = await supabase.from("meetings").update({
    attendees: opt(form.get("attendees")),
    summary: opt(form.get("summary")),
    decisions: lines(form.get("decisions")),
    actions: lines(form.get("actions")),
    status: "done",
  }).eq("id", id);
  fail("회의 결과 저장", error);
  done();
}

export async function deleteMeeting(form: FormData) {
  const supabase = await hub();
  const id = rid(form.get("id"));
  if (!id) return;
  const { data: files } = await supabase.from("meeting_files").select("object_path").eq("meeting_id", id);
  if (files?.length) await supabase.storage.from(MEETING_BUCKET).remove(files.map((f) => f.object_path));
  const { error } = await supabase.from("meetings").delete().eq("id", id);
  fail("회의 삭제", error);
  done();
}

type Result = { ok: true } | { ok: false; error: string };

/** 브라우저가 Storage에 올린 파일을 검사하고 기록 (권한·개수는 RLS·트리거가 다시 확인) */
export async function recordMeetingFile(input: { meetingId: number; path: string; fileName: string; mime: string }): Promise<Result> {
  const me = await requireStaff();
  if (me.role !== "hub_admin") return { ok: false, error: "UC 사업단만 올릴 수 있습니다." };
  const { meetingId, path, fileName, mime } = input;
  if (!Number.isSafeInteger(meetingId) || !path.startsWith(`${meetingId}/`) || path.includes("..")) return { ok: false, error: "잘못된 파일 경로입니다." };
  const supabase = await createClient();
  const drop = () => supabase.storage.from(MEETING_BUCKET).remove([path]);
  if (!MEETING_ALLOWED_EXT.includes(extOf(fileName))) { await drop(); return { ok: false, error: "허용되지 않는 파일 형식입니다." }; }
  const { count } = await supabase.from("meeting_files").select("id", { count: "exact", head: true }).eq("meeting_id", meetingId);
  if ((count ?? 0) >= MEETING_MAX_FILES) { await drop(); return { ok: false, error: `회의 첨부파일은 ${MEETING_MAX_FILES}개까지 올릴 수 있습니다.` }; }
  const { data: blob, error: dlErr } = await supabase.storage.from(MEETING_BUCKET).download(path);
  if (dlErr || !blob) return { ok: false, error: "올린 파일을 확인하지 못했습니다. 다시 올려 주세요." };
  const buf = new Uint8Array(await blob.arrayBuffer());
  if (buf.byteLength === 0 || buf.byteLength > MEETING_MAX_BYTES) { await drop(); return { ok: false, error: "파일은 20MB 이하만 올릴 수 있습니다." }; }
  const scan = await scanFile(buf, extOf(fileName));
  if (!scan.ok) { await drop(); return { ok: false, error: `보안 검사에서 차단되었습니다: ${scan.reason}` }; }
  const { error } = await supabase.from("meeting_files").insert({
    meeting_id: meetingId, object_path: path, file_name: fileName.slice(0, 200),
    size_bytes: buf.byteLength, mime_type: mime.slice(0, 120) || null, sha256: scan.sha256,
  });
  if (error) { await drop(); return { ok: false, error: error.message.includes("GNIUC_FILE_LIMIT") ? `회의 첨부파일은 ${MEETING_MAX_FILES}개까지 올릴 수 있습니다.` : "파일 정보를 저장하지 못했습니다." }; }
  revalidatePath("/admin/meetings");
  return { ok: true };
}

export async function deleteMeetingFile(id: number): Promise<Result> {
  await requireStaff({ hubOnly: true });
  const supabase = await createClient();
  const { data: file } = await supabase.from("meeting_files").select("id,object_path").eq("id", id).maybeSingle();
  if (!file) return { ok: false, error: "파일을 찾을 수 없습니다." };
  const { data: removed, error } = await supabase.from("meeting_files").delete().eq("id", id).select("id");
  if (error || !removed?.length) return { ok: false, error: "삭제 권한이 없습니다." };
  await supabase.storage.from(MEETING_BUCKET).remove([file.object_path]);
  revalidatePath("/admin/meetings");
  return { ok: true };
}

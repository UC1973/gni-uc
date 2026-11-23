"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { scanFile } from "@/lib/file-scan";
import { extOf } from "@/lib/reply-files";
import { SURVEY_ALLOWED_EXT, SURVEY_BUCKET, SURVEY_MAX_BYTES, SURVEY_MAX_FILES } from "@/lib/survey-files";

type Result = { ok: true } | { ok: false; error: string };

/** 브라우저가 Storage에 직접 올린 뒤 파일을 검사하고 기록합니다. 권한·개수 제한은 RLS와 트리거가 다시 확인합니다. */
export async function recordSurveyFile(input: { surveyId: number; path: string; fileName: string; mime: string }): Promise<Result> {
  const me = await requireStaff();
  const { surveyId, path, fileName, mime } = input;
  const univ = me.university_id;
  if (me.role === "professor" || !univ) return { ok: false, error: "소속 대학 담당자만 올릴 수 있습니다." };
  if (!Number.isSafeInteger(surveyId) || !path.startsWith(`${surveyId}/${univ}/`) || path.includes("..")) return { ok: false, error: "잘못된 파일 경로입니다." };

  const supabase = await createClient();
  const drop = () => supabase.storage.from(SURVEY_BUCKET).remove([path]);
  if (!SURVEY_ALLOWED_EXT.includes(extOf(fileName))) { await drop(); return { ok: false, error: "허용되지 않는 파일 형식입니다." }; }

  const { count } = await supabase.from("gni_survey_files").select("id", { count: "exact", head: true }).eq("survey_id", surveyId).eq("university_id", univ);
  if ((count ?? 0) >= SURVEY_MAX_FILES) { await drop(); return { ok: false, error: `첨부파일은 대학별로 ${SURVEY_MAX_FILES}개까지 올릴 수 있습니다.` }; }

  const { data: blob, error: dlErr } = await supabase.storage.from(SURVEY_BUCKET).download(path);
  if (dlErr || !blob) return { ok: false, error: "올린 파일을 확인하지 못했습니다. 다시 올려 주세요." };
  const buf = new Uint8Array(await blob.arrayBuffer());
  if (buf.byteLength === 0 || buf.byteLength > SURVEY_MAX_BYTES) { await drop(); return { ok: false, error: "파일은 10MB 이하만 올릴 수 있습니다." }; }
  const scan = await scanFile(buf, extOf(fileName));
  if (!scan.ok) { await drop(); return { ok: false, error: `보안 검사에서 차단되었습니다: ${scan.reason}` }; }

  const { error } = await supabase.from("gni_survey_files").insert({
    survey_id: surveyId, university_id: univ, object_path: path, file_name: fileName.slice(0, 200),
    size_bytes: buf.byteLength, mime_type: mime.slice(0, 120) || null, sha256: scan.sha256,
  });
  if (error) {
    await drop();
    return { ok: false, error: error.message.includes("GNIUC_FILE_LIMIT") ? `첨부파일은 대학별로 ${SURVEY_MAX_FILES}개까지 올릴 수 있습니다.` : "파일 정보를 저장하지 못했습니다. 마감되었거나 권한이 없을 수 있습니다." };
  }
  revalidatePath("/admin/gni/surveys");
  return { ok: true };
}

export async function deleteSurveyFile(id: number): Promise<Result> {
  await requireStaff();
  const supabase = await createClient();
  const { data: file } = await supabase.from("gni_survey_files").select("id,object_path").eq("id", id).maybeSingle();
  if (!file) return { ok: false, error: "파일을 찾을 수 없습니다." };
  const { data: removed, error } = await supabase.from("gni_survey_files").delete().eq("id", id).select("id");
  if (error || !removed?.length) return { ok: false, error: "삭제 권한이 없습니다. 마감된 의견수렴은 수정할 수 없습니다." };
  await supabase.storage.from(SURVEY_BUCKET).remove([file.object_path]);
  revalidatePath("/admin/gni/surveys");
  return { ok: true };
}

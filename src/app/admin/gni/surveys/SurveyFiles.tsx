"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { extOf, formatBytes } from "@/lib/reply-files";
import { SURVEY_ALLOWED_EXT, SURVEY_BUCKET, SURVEY_MAX_BYTES, SURVEY_MAX_FILES, type SurveyFile } from "@/lib/survey-files";
import { deleteSurveyFile, recordSurveyFile } from "../files-actions";

/** 의견수렴 대학별 첨부파일: 목록(모든 대학 공개) + 소속 대학만 올리기·삭제 */
export function SurveyFiles({ surveyId, universityId, files, canWrite }: { surveyId: number; universityId: string; files: SurveyFile[]; canWrite: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();
  const full = files.length >= SURVEY_MAX_FILES;

  async function upload(file: File) {
    setError("");
    const ext = extOf(file.name);
    if (!SURVEY_ALLOWED_EXT.includes(ext)) return setError(`허용 형식: ${SURVEY_ALLOWED_EXT.join(", ")}`);
    if (file.size > SURVEY_MAX_BYTES) return setError("파일은 10MB 이하만 올릴 수 있습니다.");
    if (full) return setError(`첨부파일은 ${SURVEY_MAX_FILES}개까지 올릴 수 있습니다.`);
    setBusy(true);
    try {
      const path = `${surveyId}/${universityId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await createClient().storage.from(SURVEY_BUCKET).upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (upErr) { setError(upErr.message.includes("mime") ? "허용되지 않는 파일 형식입니다." : /size|large/i.test(upErr.message) ? "파일은 10MB 이하만 올릴 수 있습니다." : "업로드하지 못했습니다. 마감되었거나 권한이 없을 수 있습니다."); return; }
      const res = await recordSurveyFile({ surveyId, path, fileName: file.name, mime: file.type });
      if (!res.ok) { setError(res.error); return; }
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove(f: SurveyFile) {
    if (!confirm(`'${f.file_name}' 파일을 삭제할까요?`)) return;
    setBusy(true);
    const res = await deleteSurveyFile(f.id);
    setBusy(false);
    if (!res.ok) setError(res.error); else startTransition(() => router.refresh());
  }

  if (!canWrite && files.length === 0) return null;
  return (
    <div className="sv-files">
      {files.length > 0 && (
        <ul className="rf-list">
          {files.map((f) => (
            <li key={f.id}>
              <a href={`/admin/gni/files/${f.id}`}>📎 {f.file_name}</a>
              <span className="small muted num">{formatBytes(f.size_bytes)}</span>
              {canWrite && <button type="button" className="rf-del" onClick={() => remove(f)} disabled={busy} aria-label={`${f.file_name} 삭제`}>삭제</button>}
            </li>
          ))}
        </ul>
      )}
      {canWrite && (
        <label className={`btn btn-o btn-s ${busy || full ? "disabled" : ""}`} style={{ marginTop: 6 }}>
          {busy ? "처리 중…" : full ? `첨부 ${SURVEY_MAX_FILES}개 (최대)` : `+ 첨부파일 (${files.length}/${SURVEY_MAX_FILES}, 10MB 이하)`}
          <input ref={input} type="file" hidden disabled={busy || full} accept={SURVEY_ALLOWED_EXT.map((e) => `.${e}`).join(",")} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
      )}
      {error && <div className="msg err" role="alert">{error}</div>}
    </div>
  );
}

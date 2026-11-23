"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { extOf, formatBytes } from "@/lib/reply-files";
import { MEETING_ALLOWED_EXT, MEETING_BUCKET, MEETING_MAX_BYTES, MEETING_MAX_FILES, type MeetingFile } from "@/lib/meetings";
import { deleteMeetingFile, recordMeetingFile } from "./actions";

export function MeetingFiles({ meetingId, files, canWrite }: { meetingId: number; files: MeetingFile[]; canWrite: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();
  const full = files.length >= MEETING_MAX_FILES;

  async function upload(list: FileList) {
    setError("");
    setBusy(true);
    try {
      let n = files.length;
      for (const file of Array.from(list)) {
        const ext = extOf(file.name);
        if (!MEETING_ALLOWED_EXT.includes(ext)) { setError(`허용 형식: ${MEETING_ALLOWED_EXT.join(", ")}`); continue; }
        if (file.size > MEETING_MAX_BYTES) { setError(`${file.name}: 20MB 이하만 올릴 수 있습니다.`); continue; }
        if (n >= MEETING_MAX_FILES) { setError(`첨부파일은 ${MEETING_MAX_FILES}개까지입니다.`); break; }
        const path = `${meetingId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await createClient().storage.from(MEETING_BUCKET).upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
        if (upErr) { setError(`${file.name}: 업로드하지 못했습니다.`); continue; }
        const res = await recordMeetingFile({ meetingId, path, fileName: file.name, mime: file.type });
        if (!res.ok) { setError(`${file.name}: ${res.error}`); continue; }
        n++;
      }
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove(f: MeetingFile) {
    if (!confirm(`'${f.file_name}' 파일을 삭제할까요?`)) return;
    setBusy(true);
    const res = await deleteMeetingFile(f.id);
    setBusy(false);
    if (!res.ok) setError(res.error); else startTransition(() => router.refresh());
  }

  if (!canWrite && files.length === 0) return null;
  return (
    <div className="mt-files">
      <div className="mt-lbl">첨부파일 <span className="muted">{files.length}/{MEETING_MAX_FILES}</span></div>
      {files.length > 0 && (
        <ul className="rf-list">
          {files.map((f) => (
            <li key={f.id}>
              <a href={`/admin/meetings/files/${f.id}`}>📎 {f.file_name}</a>
              <span className="small muted num">{formatBytes(f.size_bytes)}{f.author_name ? ` · ${f.author_name}` : ""}</span>
              {canWrite && <button type="button" className="rf-del" onClick={() => remove(f)} disabled={busy} aria-label={`${f.file_name} 삭제`}>삭제</button>}
            </li>
          ))}
        </ul>
      )}
      {canWrite && (
        <label className={`btn btn-o btn-s ${busy || full ? "disabled" : ""}`} style={{ marginTop: 6 }}>
          {busy ? "처리 중…" : full ? "최대 개수" : "+ 파일 올리기 (20MB 이하, 여러 개 선택 가능)"}
          <input ref={input} type="file" multiple hidden disabled={busy || full} accept={MEETING_ALLOWED_EXT.map((e) => `.${e}`).join(",")} onChange={(e) => e.target.files?.length && upload(e.target.files)} />
        </label>
      )}
      {error && <div className="msg err" role="alert">{error}</div>}
    </div>
  );
}

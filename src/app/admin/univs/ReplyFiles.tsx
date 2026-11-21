"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ALLOWED_EXT, MAX_FILE_BYTES, extOf, formatBytes, type ReplyFile, type ReplyKind } from "@/lib/reply-files";
import { deleteReplyFile, recordReplyFile } from "../files-actions";

export function ReplyFiles({ universityId, kind, label, files, canWrite }: { universityId: string; kind: ReplyKind; label: string; files: ReplyFile[]; canWrite: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  async function upload(file: File) {
    setError("");
    const ext = extOf(file.name);
    if (!ALLOWED_EXT.includes(ext)) return setError(`허용 형식: ${ALLOWED_EXT.join(", ")}`);
    if (file.size > MAX_FILE_BYTES) return setError("20MB 이하 파일만 올릴 수 있습니다.");
    setBusy(true);
    try {
      const path = `${universityId}/${kind}/${crypto.randomUUID()}.${ext}`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage.from("replies").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (upErr) { setError(upErr.message.includes("mime") ? "허용되지 않는 파일 형식입니다." : "업로드하지 못했습니다. 권한이나 파일을 확인해 주세요."); return; }
      const res = await recordReplyFile({ universityId, kind, path, fileName: file.name, size: file.size, mime: file.type });
      if (!res.ok) { setError(res.error); return; }
      startTransition(() => router.refresh());
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove(f: ReplyFile) {
    if (!confirm(`'${f.file_name}' 파일을 삭제할까요?`)) return;
    setBusy(true);
    const res = await deleteReplyFile(f.id);
    setBusy(false);
    if (!res.ok) setError(res.error); else startTransition(() => router.refresh());
  }

  return (
    <div className="rf">
      <div className="rf-head"><b>{label}</b>
        {canWrite && (
          <label className={`btn btn-o btn-s ${busy ? "disabled" : ""}`}>
            {busy ? "처리 중…" : "+ 파일 올리기"}
            <input ref={input} type="file" hidden disabled={busy} accept={ALLOWED_EXT.map((e) => `.${e}`).join(",")} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </label>
        )}
      </div>
      {files.length === 0 ? <p className="small muted">아직 올린 파일이 없습니다.</p> : (
        <ul className="rf-list">
          {files.map((f) => (
            <li key={f.id}>
              <a href={`/admin/files/${f.id}`}>📎 {f.file_name}</a>
              <span className="small muted num">{formatBytes(f.size_bytes)} · {f.created_at.slice(0, 10)}</span>
              {canWrite && <button type="button" className="rf-del" onClick={() => remove(f)} disabled={busy} aria-label={`${f.file_name} 삭제`}>삭제</button>}
            </li>
          ))}
        </ul>
      )}
      {error && <div className="msg err" role="alert">{error}</div>}
    </div>
  );
}

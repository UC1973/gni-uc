"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_EXT, MAX_FILE_BYTES, REPLY_KINDS, extOf, type ReplyKind } from "@/lib/reply-files";

type Result = { ok: true } | { ok: false; error: string };

async function syncFlag(universityId: string, kind: ReplyKind) {
  const supabase = await createClient();
  const { count } = await supabase.from("reply_files").select("id", { count: "exact", head: true }).eq("university_id", universityId).eq("kind", kind);
  await supabase.from("replies").update({ [kind]: (count ?? 0) > 0, updated_at: new Date().toISOString() }).eq("university_id", universityId);
}

/** 브라우저가 Storage에 직접 올린 뒤, 파일 정보를 기록합니다. 권한은 RLS가 다시 확인합니다. */
export async function recordReplyFile(input: { universityId: string; kind: string; path: string; fileName: string; size: number; mime: string }): Promise<Result> {
  const me = await requireStaff();
  const { universityId, kind, path, fileName, size, mime } = input;
  if (!(kind in REPLY_KINDS)) return { ok: false, error: "알 수 없는 서류 종류입니다." };
  if (me.role !== "hub_admin" && (me.role !== "univ_staff" || me.university_id !== universityId)) return { ok: false, error: "소속 대학 담당자만 올릴 수 있습니다." };
  if (!path.startsWith(`${universityId}/${kind}/`) || path.includes("..")) return { ok: false, error: "잘못된 파일 경로입니다." };
  if (!ALLOWED_EXT.includes(extOf(fileName)) || size <= 0 || size > MAX_FILE_BYTES) return { ok: false, error: "허용되지 않는 파일입니다." };

  const supabase = await createClient();
  const { error } = await supabase.from("reply_files").insert({
    university_id: universityId, kind, object_path: path, file_name: fileName.slice(0, 200),
    size_bytes: size, mime_type: mime.slice(0, 120) || null, uploaded_by: me.id,
  });
  if (error) {
    await supabase.storage.from("replies").remove([path]);
    return { ok: false, error: "파일 정보를 저장하지 못했습니다." };
  }
  await syncFlag(universityId, kind as ReplyKind);
  revalidatePath("/admin/univs");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteReplyFile(id: number): Promise<Result> {
  await requireStaff();
  const supabase = await createClient();
  const { data: file } = await supabase.from("reply_files").select("id,university_id,kind,object_path").eq("id", id).maybeSingle();
  if (!file) return { ok: false, error: "파일을 찾을 수 없습니다." };
  const { data: removed, error: sErr } = await supabase.storage.from("replies").remove([file.object_path]);
  if (sErr || !removed?.length) return { ok: false, error: "삭제 권한이 없습니다." };
  const { error } = await supabase.from("reply_files").delete().eq("id", id);
  if (error) return { ok: false, error: "파일 정보를 지우지 못했습니다." };
  await syncFlag(file.university_id, file.kind as ReplyKind);
  revalidatePath("/admin/univs");
  revalidatePath("/admin");
  return { ok: true };
}

import { NextResponse, type NextRequest } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MEETING_BUCKET } from "@/lib/meetings";

/** 회의 첨부파일 내려받기: 승인된 교직원만, 60초짜리 서명 URL (항상 다운로드) */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const me = await getProfile();
  if (!me || me.status !== "approved") return new NextResponse("권한이 없습니다.", { status: 403 });
  const { id } = await ctx.params;
  const supabase = await createClient();
  const { data: file } = await supabase.from("meeting_files").select("object_path,file_name").eq("id", Number(id)).maybeSingle();
  if (!file) return new NextResponse("파일을 찾을 수 없습니다.", { status: 404 });
  const { data, error } = await supabase.storage.from(MEETING_BUCKET).createSignedUrl(file.object_path, 60, { download: file.file_name });
  if (error || !data) return new NextResponse("파일을 열 수 없습니다.", { status: 403 });
  return NextResponse.redirect(data.signedUrl);
}

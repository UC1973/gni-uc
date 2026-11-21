export const REPLY_KINDS = {
  install_doc: "교육과정 신설(설치) 공문",
  curriculum_doc: "교육과정표 (교과목코드 포함)",
} as const;
export type ReplyKind = keyof typeof REPLY_KINDS;

export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const ALLOWED_EXT = ["pdf", "hwp", "hwpx", "xlsx", "xls", "docx", "doc", "zip", "jpg", "jpeg", "png"];

export function extOf(name: string) {
  const m = /\.([A-Za-z0-9]+)$/.exec(name);
  return m ? m[1].toLowerCase() : "";
}

export type ReplyFile = { id: number; university_id: string; kind: ReplyKind; object_path: string; file_name: string; size_bytes: number; created_at: string };

export function formatBytes(n: number) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

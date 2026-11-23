/** 회의 일정·결과 (브라우저·서버 공통) */
export const MEETING_BUCKET = "meeting-files";
export const MEETING_MAX_FILES = 10;
export const MEETING_MAX_BYTES = 20 * 1024 * 1024;
export const MEETING_ALLOWED_EXT = ["pdf", "hwp", "hwpx", "xlsx", "xls", "docx", "doc", "zip", "jpg", "jpeg", "png"];
export const MEETING_METHODS = ["대면", "온라인", "대면+온라인"] as const;
export const MEETING_STATUS = { planned: "예정", done: "완료", canceled: "취소" } as const;

export type MeetingStatus = keyof typeof MEETING_STATUS;
export type MeetingRow = {
  id: number; held_on: string; title: string; attendees: string | null; summary: string | null; material_url: string | null;
  starts_at: string | null; ends_at: string | null; method: (typeof MEETING_METHODS)[number] | null; place: string | null; host: string | null;
  agenda: string[]; notice: string | null; status: MeetingStatus; decisions: string[]; actions: string[];
};
export type MeetingFile = { id: number; meeting_id: number; file_name: string; size_bytes: number; author_name: string | null; created_at: string };

const KST = { timeZone: "Asia/Seoul" } as const;
/** 2026. 11. 26.(목) 14:00 */
export function fmtWhen(m: Pick<MeetingRow, "held_on" | "starts_at" | "ends_at">) {
  if (!m.starts_at) {
    const w = "일월화수목금토"[new Date(`${m.held_on}T00:00:00Z`).getUTCDay()];
    return `${m.held_on.replaceAll("-", ". ")}.(${w})`;
  }
  const d = new Date(m.starts_at);
  const date = new Intl.DateTimeFormat("ko-KR", { ...KST, year: "numeric", month: "numeric", day: "numeric", weekday: "short" }).format(d);
  const t = (x: Date) => new Intl.DateTimeFormat("ko-KR", { ...KST, hour: "2-digit", minute: "2-digit", hour12: false }).format(x);
  return `${date} ${t(d)}${m.ends_at ? `~${t(new Date(m.ends_at))}` : ""}`;
}
/** timestamptz → datetime-local 입력값(KST) */
export function toLocalInput(iso: string | null) {
  if (!iso) return "";
  return new Date(new Date(iso).getTime() + 9 * 3600 * 1000).toISOString().slice(0, 16);
}

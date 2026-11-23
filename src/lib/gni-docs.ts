import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * GNI 공유대학 공문·일정·결정사항·체크리스트 — Supabase gni_* 테이블
 * 조회: 승인된 교직원 / 등록·수정: UC 사업단 (RLS로 강제)
 */

export const DOC_KINDS = ["공문", "메일", "회의"] as const;
export const DIRECTIONS = ["수신", "발신", "내부"] as const;
export const FILE_STATES = ["원본", "보관본", "미확보"] as const;
export const PHASES = ["사업 착수", "교육과정 신설", "운영 준비", "학기 운영"] as const;
export const AREAS = ["교육과정", "수업운영", "학생", "학사", "비교과", "행정"] as const;

export type DocKind = (typeof DOC_KINDS)[number];
export type Direction = (typeof DIRECTIONS)[number];
export type FileState = (typeof FILE_STATES)[number];
export type Phase = (typeof PHASES)[number];
export type Area = (typeof AREAS)[number];

export type DocRequest = { what: string; due: string | null; time: string | null; how: string | null };
export type Attachment = { name: string; file: FileState; note?: string | null };

export type GniDoc = {
  id: number;
  ref: string | null;
  doc_date: string;
  kind: DocKind;
  direction: Direction;
  sender: string;
  recipient: string | null;
  doc_no: string | null;
  title: string;
  points: string[];
  requests: DocRequest[];
  attachments: Attachment[];
  internal_note: string | null;
  updated_at: string;
};
export type Milestone = { id: number; starts_on: string; ends_on: string | null; title: string; owner: string | null; phase: Phase; doc_id: number | null };
export type Decision = { id: number; area: Area; title: string; options: string[]; basis: string | null; status: "draft" | "wip" | "ok"; decision: string | null; doc_id: number | null; sort: number };
export type CheckItem = { id: number; grp: string; task: string; owner: string | null; due_on: string | null; doc_id: number | null; done: boolean; done_at: string | null; sort: number };

export type GniData = {
  docs: GniDoc[];
  notes: Map<number, string>;
  schedule: Milestone[];
  decisions: Decision[];
  checklist: CheckItem[];
  error: string | null;
};

/** 화면에 필요한 GNI 데이터를 한 번에 조회 (사업단 메모는 RLS로 사업단만 받음) */
export async function getGniData(opts: { notes?: boolean } = {}): Promise<GniData> {
  const supabase = await createClient();
  const [d, s, c, k, n] = await Promise.all([
    supabase.from("gni_docs").select("id,ref,doc_date,kind,direction,sender,recipient,doc_no,title,points,requests,attachments,internal_note,updated_at").order("doc_date", { ascending: false }).order("id", { ascending: false }),
    supabase.from("gni_schedule").select("id,starts_on,ends_on,title,owner,phase,doc_id").order("starts_on").order("id"),
    supabase.from("gni_decisions").select("id,area,title,options,basis,status,decision,doc_id,sort").order("sort").order("id"),
    supabase.from("gni_checklist").select("id,grp,task,owner,due_on,doc_id,done,done_at,sort").order("sort").order("id"),
    opts.notes ? supabase.from("gni_doc_notes").select("doc_id,note") : Promise.resolve({ data: [], error: null }),
  ]);
  const error = d.error ?? s.error ?? c.error ?? k.error;
  if (error) console.error("[gni] 조회 실패", error);
  return {
    docs: (d.data ?? []) as GniDoc[],
    notes: new Map(((n.data ?? []) as { doc_id: number; note: string }[]).map((x) => [x.doc_id, x.note])),
    schedule: (s.data ?? []) as Milestone[],
    decisions: (c.data ?? []) as Decision[],
    checklist: (k.data ?? []) as CheckItem[],
    error: error ? "GNI 자료를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요." : null,
  };
}

/** 오늘 기준 남은 일수 (KST) */
export function dday(date: string, today = new Date()) {
  const kst = new Date(today.getTime() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  return Math.round((Date.parse(date) - Date.parse(kst)) / 86400000);
}

export function fmtDate(d: string) {
  const [y, m, day] = d.split("-");
  const w = "일월화수목금토"[new Date(`${d}T00:00:00Z`).getUTCDay()];
  return `${y}.${m}.${day}.(${w})`;
}

export function fmtShort(d: string) {
  const [, m, day] = d.split("-");
  const w = "일월화수목금토"[new Date(`${d}T00:00:00Z`).getUTCDay()];
  return `${Number(m)}.${Number(day)}(${w})`;
}

/** 할 일 목록: 공문 요청사항 중 기한이 남은 것 */
export function openRequests(docs: GniDoc[]) {
  return docs
    .flatMap((d) => d.requests.filter((r) => r.due && dday(r.due) >= 0).map((r) => ({ ...r, due: r.due as string, doc: d })))
    .sort((a, b) => a.due.localeCompare(b.due));
}

/* ---------- 입력 폼 직렬화: 한 줄에 하나, 칸은 | 로 구분 ---------- */
export function requestsToText(rs: DocRequest[]) {
  return rs.map((r) => [r.what, [r.due, r.time].filter(Boolean).join(" "), r.how ?? ""].join(" | ").replace(/( \| )+$/, "")).join("\n");
}
export function attachmentsToText(as: Attachment[]) {
  return as.map((a) => [a.name, a.file, a.note ?? ""].join(" | ").replace(/ \| $/, "")).join("\n");
}

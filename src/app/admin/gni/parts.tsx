import Link from "next/link";
import { Tag } from "@/components/ui";
import { dday, docById, fmtDate, type DocKind, type Direction } from "@/lib/gni-docs";

export const SOURCE_NOTE = "울산과학대학교 그룹웨어 수신·발신 공문과 메일(2026.08.18.~11.18.) 기준 · 2026.11.23. 확인";

export function KindTag({ kind, dir }: { kind: DocKind; dir: Direction }) {
  const tone = kind === "공문" ? "info" : kind === "회의" ? "ok" : "draft";
  return <><Tag tone={tone}>{kind}</Tag> <Tag tone={dir === "발신" ? "wip" : "draft"}>{dir}</Tag></>;
}

export function DueTag({ date, end }: { date: string; end?: string }) {
  const d = dday(date);
  if (end && d <= 0 && dday(end) >= 0) return <Tag tone="ok">진행 중</Tag>;
  if (d < 0) return <Tag tone="draft">지남</Tag>;
  if (d === 0) return <Tag tone="bad">D-day</Tag>;
  return <Tag tone={d <= 7 ? "bad" : d <= 30 ? "wip" : "info"}>D-{d}</Tag>;
}

export function SrcLink({ id }: { id: string }) {
  const d = docById(id);
  if (!d) return null;
  return (
    <Link href={`/admin/gni/docs#d-${d.id}`} className="small" style={{ color: "var(--blue)" }}>
      {d.date.slice(5).replace("-", ".")} {d.kind}
    </Link>
  );
}

export function dueText(due: string) {
  const [d, t] = due.split(" ");
  return t ? `${fmtDate(d)} ${t}` : fmtDate(d);
}

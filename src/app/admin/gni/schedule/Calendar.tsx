import Link from "next/link";
import type { GniDoc, Milestone } from "@/lib/gni-docs";

type Ev = { key: string; title: string; kind: "plan" | "due"; href: string };

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const shift = (ym: string, by: number) => {
  const [y, m] = ym.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}`;
};
export const kstToday = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

/** 월간 달력: 준비 일정(기간 포함)과 공문 요청 기한 */
export function Calendar({ month, schedule, docs }: { month: string; schedule: Milestone[]; docs: GniDoc[] }) {
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const today = kstToday();

  const byDay = new Map<string, Ev[]>();
  const add = (day: string, e: Ev) => byDay.set(day, [...(byDay.get(day) ?? []), e]);
  for (let d = 1; d <= days; d++) {
    const day = iso(y, m, d);
    for (const s of schedule) {
      if (s.starts_on <= day && (s.ends_on ?? s.starts_on) >= day) {
        const cont = s.starts_on < day && d !== 1 && new Date(`${day}T00:00:00Z`).getUTCDay() !== 0;
        add(day, { key: `s${s.id}`, title: cont ? `↳ ${s.title}` : s.title, kind: "plan", href: `#m-${s.id}` });
      }
    }
    for (const doc of docs) doc.requests.forEach((r, i) => {
      if (r.due === day) add(day, { key: `d${doc.id}-${i}`, title: `${r.time ? `${r.time} ` : ""}${r.what}`, kind: "due", href: `/admin/gni/docs#d-${doc.id}` });
    });
  }

  const cells: (number | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const count = new Set([...byDay.values()].flat().map((e) => e.key)).size;

  return (
    <section className="g-card cal">
      <h2>
        {y}년 {m}월 <span className="small muted" style={{ fontWeight: 500 }}>{count}건</span>
        <span className="more cal-nav">
          <Link href={`?m=${shift(month, -1)}`} aria-label="이전 달">‹</Link>
          <Link href="?">오늘</Link>
          <Link href={`?m=${shift(month, 1)}`} aria-label="다음 달">›</Link>
        </span>
      </h2>
      <div className="cal-grid" role="grid" aria-label={`${y}년 ${m}월 일정`}>
        {"일월화수목금토".split("").map((w, i) => <div key={w} className={`cal-w${i === 0 ? " sun" : i === 6 ? " sat" : ""}`}>{w}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} className="cal-d empty-d" />;
          const day = iso(y, m, d);
          const evs = byDay.get(day) ?? [];
          const wd = i % 7;
          return (
            <div key={day} className={`cal-d${day === today ? " today" : ""}${evs.length ? " has" : ""}`}>
              <span className={`n${wd === 0 ? " sun" : wd === 6 ? " sat" : ""}`}>{d}</span>
              {evs.slice(0, 3).map((e) => <Link key={e.key} href={e.href} className={`cal-e ${e.kind}`} title={e.title}>{e.title}</Link>)}
              {evs.length > 3 && <span className="cal-more">+{evs.length - 3}</span>}
            </div>
          );
        })}
      </div>
      <div className="cal-legend small muted"><span><i className="plan" />준비 일정</span><span><i className="due" />공문 요청 기한</span></div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU: [string, string, string, string | null, boolean?][] = [
  ["/admin", "📊", "대시보드", null],
  ["/admin/gni", "🧭", "준비 현황", "공유대학 준비"],
  ["/admin/gni/docs", "📨", "공문·메일(일자별)", null],
  ["/admin/gni/schedule", "🗓", "준비 일정", null],
  ["/admin/gni/decisions", "⚖️", "결정 필요 사항", null],
  ["/admin/gni/checklist", "✅", "준비 체크리스트", null],
  ["/admin/curriculum", "📘", "교육과정 관리", "교육과정"],
  ["/admin/issues", "🗂", "협의·학사운영", null],
  ["/admin/univs", "🏫", "참여대학 현황", null],
  ["/admin/students", "🎓", "학생관리", "학생"],
  ["/admin/extra", "🎟", "비교과", null],
  ["/admin/kpi", "🎯", "성과관리", "사업"],
  ["/admin/cms", "📰", "콘텐츠 관리", null],
  ["/admin/users", "👥", "사용자·권한", null, true],
  ["/admin/audit", "🧾", "변경 이력", null, true],
];

export function AdminNav({ hub }: { hub: boolean }) {
  const path = usePathname();
  // 가장 길게 일치하는 메뉴만 강조 (/admin/gni 와 /admin/gni/docs 구분)
  const active = MENU.map((m) => m[0])
    .filter((h) => path === h || (h !== "/admin" && path.startsWith(`${h}/`)))
    .sort((a, b) => b.length - a.length)[0];
  return (
    <>
      {MENU.filter((m) => !m[4] || hub).map(([href, ico, label, grp]) => {
        const on = href === active;
        return (
          <div key={href}>
            {grp && <div className="grp">{grp}</div>}
            <Link href={href} className={on ? "on" : ""}><span>{ico}</span>{label}</Link>
          </div>
        );
      })}
    </>
  );
}

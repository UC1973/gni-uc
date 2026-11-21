"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const MENU: [string, string, string, string | null, boolean?][] = [
  ["/admin", "📊", "대시보드", null],
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
  return (
    <>
      {MENU.filter((m) => !m[4] || hub).map(([href, ico, label, grp]) => {
        const on = href === "/admin" ? path === "/admin" : path.startsWith(href);
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

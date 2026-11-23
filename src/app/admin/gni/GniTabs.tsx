"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

const TABS: [string, string, IconName][] = [
  ["/admin/gni", "현황", "compass"],
  ["/admin/gni/docs", "공문·메일", "mail"],
  ["/admin/gni/schedule", "일정", "calendar"],
  ["/admin/gni/surveys", "의견수렴", "chat"],
  ["/admin/gni/decisions", "결정 사항", "scale"],
  ["/admin/gni/checklist", "체크리스트", "check"],
];

export function GniTabs() {
  const path = usePathname();
  return (
    <nav className="g-tabs" aria-label="공유대학 준비">
      {TABS.map(([href, label, icon]) => (
        <Link key={href} href={href} className={path === href ? "on" : ""} aria-current={path === href ? "page" : undefined}>
          <Icon name={icon} size={16} />{label}
        </Link>
      ))}
    </nav>
  );
}

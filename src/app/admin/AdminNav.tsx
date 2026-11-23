"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { logout } from "@/app/auth-actions";

type Item = { href: string; label: string; icon: IconName; hubOnly?: boolean };
type Group = { label: string | null; items: Item[] };

const MENU: Group[] = [
  { label: null, items: [
    { href: "/admin", label: "대시보드", icon: "home" },
    { href: "/admin/gni", label: "공유대학 준비", icon: "compass" },
  ] },
  { label: "교육과정", items: [
    { href: "/admin/curriculum", label: "교육과정 관리", icon: "book" },
    { href: "/admin/issues", label: "협의·학사운영", icon: "chat" },
    { href: "/admin/univs", label: "참여대학 현황", icon: "building" },
  ] },
  { label: "학생", items: [
    { href: "/admin/students", label: "학생관리", icon: "cap" },
    { href: "/admin/extra", label: "비교과", icon: "ticket" },
  ] },
  { label: "사업", items: [
    { href: "/admin/kpi", label: "성과관리", icon: "target" },
    { href: "/admin/cms", label: "콘텐츠 관리", icon: "news" },
  ] },
  { label: "관리", items: [
    { href: "/admin/users", label: "사용자·권한", icon: "users", hubOnly: true },
    { href: "/admin/audit", label: "변경 이력", icon: "history", hubOnly: true },
  ] },
];

/** 휴대폰 하단 탭 (마지막 칸은 전체 메뉴) */
const TABS: Item[] = [
  { href: "/admin", label: "홈", icon: "home" },
  { href: "/admin/gni", label: "공유대학", icon: "compass" },
  { href: "/admin/curriculum", label: "교육과정", icon: "book" },
  { href: "/admin/students", label: "학생", icon: "cap" },
];

const ALL = MENU.flatMap((g) => g.items);

function useActive() {
  const path = usePathname();
  const hit = ALL.map((i) => i.href)
    .filter((h) => path === h || (h !== "/admin" && path.startsWith(`${h}/`)))
    .sort((a, b) => b.length - a.length)[0];
  return { path, active: hit };
}

function groupsFor(hub: boolean) {
  return MENU.map((g) => ({ ...g, items: g.items.filter((i) => !i.hubOnly || hub) })).filter((g) => g.items.length);
}

export function SideNav({ hub }: { hub: boolean }) {
  const { active } = useActive();
  return (
    <nav className="snav" aria-label="관리 메뉴">
      {groupsFor(hub).map((g, gi) => (
        <div className="snav-g" key={gi}>
          {g.label && <div className="snav-l">{g.label}</div>}
          {g.items.map((i) => (
            <Link key={i.href} href={i.href} className={i.href === active ? "on" : ""} aria-current={i.href === active ? "page" : undefined}>
              <Icon name={i.icon} size={18} />
              <span>{i.label}</span>
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

export function PageTitle() {
  const { active } = useActive();
  return <span className="tb-title">{ALL.find((i) => i.href === active)?.label ?? "관리"}</span>;
}

export function MobileNav({ hub, name, meta, scope }: { hub: boolean; name: string; meta: string; scope: string }) {
  const { path, active } = useActive();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(path);
  // 페이지가 바뀌면 메뉴를 닫음
  if (seen !== path) {
    setSeen(path);
    setOpen(false);
  }
  useEffect(() => {
    document.documentElement.classList.toggle("sheet-open", open);
    return () => document.documentElement.classList.remove("sheet-open");
  }, [open]);
  const inTabs = TABS.some((t) => t.href === active);

  return (
    <>
      <nav className="tabbar" aria-label="주요 메뉴">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={!open && t.href === active ? "on" : ""}>
            <Icon name={t.icon} size={22} />
            <span>{t.label}</span>
          </Link>
        ))}
        <button type="button" className={open || !inTabs ? "on" : ""} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="all-menu">
          <Icon name={open ? "x" : "grid"} size={22} />
          <span>전체</span>
        </button>
      </nav>

      <div className={`sheet-bg${open ? " show" : ""}`} onClick={() => setOpen(false)} aria-hidden="true" />
      <div id="all-menu" className={`sheet${open ? " show" : ""}`} role="dialog" aria-modal="true" aria-label="전체 메뉴" inert={!open}>
        <div className="sheet-grip" />
        <div className="sheet-me">
          <span className="avatar">{name.slice(0, 1)}</span>
          <div><b>{name}</b><small>{meta}</small></div>
        </div>
        <p className="sheet-scope">{scope}</p>
        {groupsFor(hub).map((g, gi) => (
          <section key={gi}>
            {g.label && <h3>{g.label}</h3>}
            <div className="sheet-grid">
              {g.items.map((i) => (
                <Link key={i.href} href={i.href} className={i.href === active ? "on" : ""}>
                  <Icon name={i.icon} size={22} />
                  <span>{i.label}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
        <div className="sheet-foot">
          <Link href="/"><Icon name="external" size={18} />홈페이지</Link>
          <form action={logout}><button><Icon name="logout" size={18} />로그아웃</button></form>
        </div>
      </div>
    </>
  );
}

"use client";

import { Icon } from "@/components/icons";

export function ThemeToggle() {
  function toggle() {
    const r = document.documentElement;
    const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    r.dataset.theme = dark ? "light" : "dark";
  }
  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label="화면 모드 전환" title="화면 모드 전환">
      <Icon name="moon" size={17} />
    </button>
  );
}

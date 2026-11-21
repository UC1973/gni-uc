"use client";

export function ThemeToggle() {
  function toggle() {
    const r = document.documentElement;
    const dark = r.dataset.theme ? r.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    r.dataset.theme = dark ? "light" : "dark";
  }
  return <button type="button" className="btn btn-o btn-s" onClick={toggle} aria-label="화면 모드 전환">◐</button>;
}

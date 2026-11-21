"use client";

import { useState } from "react";

export function useAi() {
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function run(task: string, input?: string) {
    setBusy(true); setError(""); setText("");
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task, input }) });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? "오류가 발생했습니다."); else setText(json.text);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally { setBusy(false); }
  }
  return { text, error, busy, run };
}

"use client";

import { useAi } from "@/components/AiButton";

export function AiSummary() {
  const { text, error, busy, run } = useAi();
  return (
    <div className="ai-box" style={{ marginBottom: 18 }}>
      <div className="inline" style={{ justifyContent: "space-between" }}>
        <div><b>✨ AI 안건 정리</b><p className="small muted">결정 사항, 다음 회의 안건, 대학별 요청 자료를 정리합니다.</p></div>
        <button type="button" className="btn btn-p btn-s" onClick={() => run("issues-summary")} disabled={busy}>{busy ? "정리 중…" : "정리하기"}</button>
      </div>
      {error && <div className="msg err">{error}</div>}
      {text && <div className="ai-out">{text}</div>}
    </div>
  );
}

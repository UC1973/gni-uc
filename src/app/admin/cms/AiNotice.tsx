"use client";

import { useState } from "react";
import { useAi } from "@/components/AiButton";

export function AiNotice() {
  const [input, setInput] = useState("");
  const { text, error, busy, run } = useAi();
  return (
    <div className="ai-box" style={{ marginBottom: 18 }}>
      <b>✨ AI 공지 초안</b>
      <p className="small muted" style={{ marginBottom: 8 }}>핵심 내용을 적으면 학생용 공지 초안을 만들어 줍니다. 결과는 확인 후 아래 양식에 붙여 넣으세요.</p>
      <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="예: 2027-1학기 산업AX전공 수강신청 2.10~2.12, 대상 11개 학과, 평점 2.5 이상" aria-label="공지 핵심 내용" />
      <button type="button" className="btn btn-p btn-s" style={{ marginTop: 8 }} onClick={() => run("notice-draft", input)} disabled={busy}>{busy ? "작성 중…" : "초안 만들기"}</button>
      {error && <div className="msg err">{error}</div>}
      {text && <div className="ai-out">{text}</div>}
    </div>
  );
}

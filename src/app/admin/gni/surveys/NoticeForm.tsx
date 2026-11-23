"use client";

import { useActionState } from "react";
import { surveyNotice, type NoticeState } from "../actions";

type Univ = { id: string; short_name: string; submitted: boolean };

/** 의견수렴 안내 메일: 문구 작성·저장, 대상 선택 후 발송 (UC 사업단) */
export function NoticeForm({ surveyId, subject, body, univs }: { surveyId: number; subject: string; body: string; univs: Univ[] }) {
  const [state, action, pending] = useActionState<NoticeState, FormData>(surveyNotice, null);
  return (
    <form action={action} onSubmit={(e) => {
      const btn = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
      if (btn?.value === "send" && !confirm("선택한 대상에게 안내 메일을 보낼까요?")) e.preventDefault();
    }}>
      <input type="hidden" name="survey_id" value={surveyId} />
      <div className="fgrid">
        <label className="w4">제목<input name="subject" required maxLength={200} defaultValue={subject} /></label>
        <label className="w4">내용 <span className="hint">{"{주제}"}·{"{마감일}"}은 보낼 때 자동으로 바뀝니다 · 메일에 ‘로그인하고 의견 남기기’ 버튼이 붙습니다</span>
          <textarea name="body" required maxLength={5000} rows={9} defaultValue={body} />
        </label>
        <label>보낼 대상
          <select name="scope" defaultValue="pending"><option value="pending">미제출 대학만</option><option value="all">선택한 대학 전체</option></select>
        </label>
        <div className="w2" style={{ display: "grid", gap: 5, fontSize: 12, fontWeight: 650, color: "var(--muted)" }}>대학
          <div className="nt-univs">
            {univs.map((u) => (
              <label key={u.id}><input type="checkbox" name="univ" value={u.id} defaultChecked />{u.short_name}{u.submitted && <small> (제출)</small>}</label>
            ))}
          </div>
        </div>
        <label className="nt-chk"><span><input type="checkbox" name="professors" /> 교수도 받기</span><span className="hint">기본: UC 사업단·대학 담당자</span></label>
      </div>
      <div className="f-actions">
        {state && <span className={`small ${state.ok ? "" : "nt-err"}`} role="status">{state.message}</span>}
        <button name="intent" value="save" className="btn btn-o btn-s" disabled={pending}>문구 저장</button>
        <button name="intent" value="send" className="btn btn-p btn-s" disabled={pending}>{pending ? "처리 중…" : "안내 메일 보내기"}</button>
      </div>
    </form>
  );
}

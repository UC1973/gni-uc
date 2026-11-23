import Link from "next/link";
import { Tag } from "@/components/ui";
import { Icon } from "@/components/icons";
import {
  AREAS, DIRECTIONS, DOC_KINDS, PHASES, attachmentsToText, dday, requestsToText,
  type CheckItem, type Decision, type DocKind, type Direction, type GniDoc, type Milestone, type Survey,
} from "@/lib/gni-docs";
import { createDoc, deleteCheck, deleteDecision, deleteDoc, deleteMilestone, deleteSurvey, saveCheck, saveDecision, saveMilestone, saveSurvey, updateDoc } from "./actions";

export function KindTag({ kind, dir }: { kind: DocKind; dir: Direction }) {
  const tone = kind === "공문" ? "info" : kind === "회의" ? "ok" : "draft";
  return <><Tag tone={tone}>{kind}</Tag><Tag tone={dir === "발신" ? "wip" : "draft"}>{dir}</Tag></>;
}

export function DueTag({ date, end, done }: { date: string | null; end?: string | null; done?: boolean }) {
  if (done) return <Tag tone="ok">완료</Tag>;
  if (!date) return null;
  const d = dday(date);
  if (end && d <= 0 && dday(end) >= 0) return <Tag tone="ok">진행 중</Tag>;
  if (d < 0) return <Tag tone="draft">지남</Tag>;
  if (d === 0) return <Tag tone="bad">오늘</Tag>;
  return <Tag tone={d <= 7 ? "bad" : d <= 30 ? "wip" : "info"}>D-{d}</Tag>;
}

export function DocLink({ id, docs }: { id: number | null; docs: GniDoc[] }) {
  const d = id ? docs.find((x) => x.id === id) : null;
  if (!d) return null;
  return <Link className="g-link" href={`/admin/gni/docs#d-${d.id}`}>{Number(d.doc_date.slice(5, 7))}.{Number(d.doc_date.slice(8))} {d.kind} →</Link>;
}

function DocSelect({ docs, value }: { docs: GniDoc[]; value?: number | null }) {
  return (
    <select name="doc_id" defaultValue={value ?? ""}>
      <option value="">(연결 안 함)</option>
      {docs.map((d) => <option key={d.id} value={d.id}>{d.doc_date.slice(5).replace("-", ".")} {d.title.slice(0, 40)}</option>)}
    </select>
  );
}

/** 같은 폼의 hidden id를 그대로 사용 (formAction 버튼에는 name을 둘 수 없음) */
function DeleteButton({ action, what }: { action: (f: FormData) => Promise<void>; what: string }) {
  return (
    <button formAction={action} className="btn btn-s btn-d" formNoValidate aria-label={`${what} 삭제`}>
      <Icon name="trash" size={15} />삭제
    </button>
  );
}

/* ---------- 공문 입력 ---------- */
export function DocForm({ doc, note }: { doc?: GniDoc; note?: string }) {
  return (
    <form action={doc ? updateDoc : createDoc}>
      {doc && <input type="hidden" name="id" value={doc.id} />}
      <div className="fgrid">
        <label>일자<input type="date" name="doc_date" required defaultValue={doc?.doc_date ?? ""} /></label>
        <label>구분<select name="kind" defaultValue={doc?.kind ?? "공문"}>{DOC_KINDS.map((k) => <option key={k}>{k}</option>)}</select></label>
        <label>수신·발신<select name="direction" defaultValue={doc?.direction ?? "수신"}>{DIRECTIONS.map((k) => <option key={k}>{k}</option>)}</select></label>
        <label>문서번호<input name="doc_no" defaultValue={doc?.doc_no ?? ""} placeholder="예: 5극3특공유대학사업단-75" /></label>
        <label className="w2">보낸 곳<input name="sender" required defaultValue={doc?.sender ?? ""} placeholder="예: 경상국립대학교 5극3특공유대학사업단" /></label>
        <label className="w2">받는 곳<input name="recipient" defaultValue={doc?.recipient ?? ""} /></label>
        <label className="w4">제목<input name="title" required defaultValue={doc?.title ?? ""} /></label>
        <label className="w4">주요 내용 <span className="hint">한 줄에 하나씩</span><textarea name="points" defaultValue={doc?.points.join("\n") ?? ""} /></label>
        <label className="w4">요청사항 <span className="hint">한 줄에 하나 · 내용 | 2026-12-04 16:00 | 제출 방법</span><textarea name="requests" defaultValue={doc ? requestsToText(doc.requests) : ""} /></label>
        <label className="w4">붙임 <span className="hint">한 줄에 하나 · 파일명 | 원본/보관본/미확보 | 메모</span><textarea name="attachments" defaultValue={doc ? attachmentsToText(doc.attachments) : ""} /></label>
        <label className="w2">학내 처리<input name="internal_note" defaultValue={doc?.internal_note ?? ""} placeholder="예: 교무팀 팀장 참석" /></label>
        <label className="w2">사업단 메모 <span className="hint">사업단만 보임</span><input name="hub_note" defaultValue={note ?? ""} /></label>
      </div>
      <div className="f-actions">
        {doc && <DeleteButton action={deleteDoc} what="공문" />}
        <button className="btn btn-p btn-s">{doc ? "수정 저장" : "공문 등록"}</button>
      </div>
    </form>
  );
}

/* ---------- 일정 입력 ---------- */
export function MilestoneForm({ m, docs }: { m?: Milestone; docs: GniDoc[] }) {
  return (
    <form action={saveMilestone}>
      {m && <input type="hidden" name="id" value={m.id} />}
      <div className="fgrid">
        <label>시작일<input type="date" name="starts_on" required defaultValue={m?.starts_on ?? ""} /></label>
        <label>종료일 <span className="hint">기간일 때</span><input type="date" name="ends_on" defaultValue={m?.ends_on ?? ""} /></label>
        <label>단계<select name="phase" defaultValue={m?.phase ?? "운영 준비"}>{PHASES.map((p) => <option key={p}>{p}</option>)}</select></label>
        <label>담당<input name="owner" defaultValue={m?.owner ?? ""} placeholder="예: 사업단" /></label>
        <label className="w2">일정<input name="title" required defaultValue={m?.title ?? ""} /></label>
        <label className="w2">근거 문서<DocSelect docs={docs} value={m?.doc_id} /></label>
      </div>
      <div className="f-actions">
        {m && <DeleteButton action={deleteMilestone} what="일정" />}
        <button className="btn btn-p btn-s">{m ? "수정 저장" : "일정 추가"}</button>
      </div>
    </form>
  );
}

/* ---------- 결정 필요 사항 입력 ---------- */
export function DecisionForm({ d, docs }: { d?: Decision; docs: GniDoc[] }) {
  return (
    <form action={saveDecision}>
      {d && <input type="hidden" name="id" value={d.id} />}
      {d && <input type="hidden" name="status" value={d.status} />}
      {d && <input type="hidden" name="decision" value={d.decision ?? ""} />}
      <div className="fgrid">
        <label>분야<select name="area" defaultValue={d?.area ?? "학사"}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select></label>
        <label className="w2">안건<input name="title" required defaultValue={d?.title ?? ""} /></label>
        <label>근거 문서<DocSelect docs={docs} value={d?.doc_id} /></label>
        <label className="w4">선택지·검토 내용 <span className="hint">한 줄에 하나씩</span><textarea name="options" defaultValue={d?.options.join("\n") ?? ""} /></label>
        <label className="w4">근거·참고<input name="basis" defaultValue={d?.basis ?? ""} /></label>
      </div>
      <div className="f-actions">
        {d && <DeleteButton action={deleteDecision} what="결정 사항" />}
        <button className="btn btn-p btn-s">{d ? "수정 저장" : "안건 추가"}</button>
      </div>
    </form>
  );
}

/* ---------- 의견수렴 주제 입력 ---------- */
export function SurveyForm({ s, docs, decisions }: { s?: Survey; docs: GniDoc[]; decisions: Decision[] }) {
  return (
    <form action={saveSurvey}>
      {s && <input type="hidden" name="id" value={s.id} />}
      <div className="fgrid">
        <label>분야<select name="area" defaultValue={s?.area ?? "교육과정"}>{AREAS.map((a) => <option key={a}>{a}</option>)}</select></label>
        <label className="w2">주제<input name="title" required defaultValue={s?.title ?? ""} placeholder="예: 나노디그리 개설(포함) 희망 교과목" /></label>
        <label>마감일<input type="date" name="due_on" defaultValue={s?.due_on ?? ""} /></label>
        <label className="w4">요청 내용 <span className="hint">대학 관계자에게 보이는 안내</span><textarea name="question" defaultValue={s?.question ?? ""} placeholder="예: 희망 교과목을 한 줄에 하나씩 · 교과목명 | 학점 | 개설 학기 | 비고" /></label>
        <label>상태<select name="status" defaultValue={s?.status ?? "open"}><option value="open">진행 중</option><option value="closed">마감</option></select></label>
        <label>근거 문서<DocSelect docs={docs} value={s?.doc_id} /></label>
        <label className="w2">연결할 결정 사항
          <select name="decision_id" defaultValue={s?.decision_id ?? ""}>
            <option value="">(연결 안 함)</option>
            {decisions.map((d) => <option key={d.id} value={d.id}>{d.area} · {d.title.slice(0, 40)}</option>)}
          </select>
        </label>
      </div>
      <div className="f-actions">
        {s && <DeleteButton action={deleteSurvey} what="의견수렴" />}
        <button className="btn btn-p btn-s">{s ? "수정 저장" : "의견수렴 등록"}</button>
      </div>
    </form>
  );
}

/* ---------- 체크리스트 입력 ---------- */
export function CheckForm({ c, docs, groups }: { c?: CheckItem; docs: GniDoc[]; groups: string[] }) {
  const listId = `grp-${c?.id ?? "new"}`;
  return (
    <form action={saveCheck}>
      {c && <input type="hidden" name="id" value={c.id} />}
      <div className="fgrid">
        <label>분류<input name="grp" list={listId} required defaultValue={c?.grp ?? ""} /><datalist id={listId}>{groups.map((g) => <option key={g} value={g} />)}</datalist></label>
        <label className="w2">할 일<input name="task" required defaultValue={c?.task ?? ""} /></label>
        <label>담당<input name="owner" defaultValue={c?.owner ?? ""} /></label>
        <label>기한<input type="date" name="due_on" defaultValue={c?.due_on ?? ""} /></label>
        <label className="w2">근거 문서<DocSelect docs={docs} value={c?.doc_id} /></label>
      </div>
      <div className="f-actions">
        {c && <DeleteButton action={deleteCheck} what="할 일" />}
        <button className="btn btn-p btn-s">{c ? "수정 저장" : "할 일 추가"}</button>
      </div>
    </form>
  );
}

export function EditToggle({ label = "수정", children }: { label?: string; children: React.ReactNode }) {
  return (
    <details className="edit">
      <summary><Icon name="edit" size={14} />{label}</summary>
      {children}
    </details>
  );
}

export function AddPanel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="add">
      <summary><Icon name="plus" size={18} />{label}</summary>
      {children}
    </details>
  );
}

export function LoadError({ error }: { error: string | null }) {
  if (!error) return null;
  return <div className="alert warn"><Icon name="alert" size={18} /><span>{error}</span></div>;
}

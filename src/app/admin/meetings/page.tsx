import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Tag } from "@/components/ui";
import { PageHead } from "@/components/admin";
import { Icon } from "@/components/icons";
import { MEETING_METHODS, MEETING_STATUS, fmtWhen, toLocalInput, type MeetingFile, type MeetingRow } from "@/lib/meetings";
import { dday } from "@/lib/gni-docs";
import { deleteMeeting, saveMeeting, saveResult } from "./actions";
import { MeetingFiles } from "./MeetingFiles";

const ST_TONE = { planned: "info", done: "ok", canceled: "draft" } as const;

function ScheduleForm({ m }: { m?: MeetingRow }) {
  return (
    <form action={saveMeeting}>
      {m && <input type="hidden" name="id" value={m.id} />}
      <div className="fgrid">
        <label className="w2">회의<input name="title" required maxLength={300} defaultValue={m?.title ?? ""} placeholder="예: GNI 산업AX전공 학사 협의체 회의" /></label>
        <label>시작<input type="datetime-local" name="starts_at" required defaultValue={toLocalInput(m?.starts_at ?? null) || (m ? `${m.held_on}T10:00` : "")} /></label>
        <label>종료 <span className="hint">선택</span><input type="datetime-local" name="ends_at" defaultValue={toLocalInput(m?.ends_at ?? null)} /></label>
        <label>방법<select name="method" defaultValue={m?.method ?? "온라인"}>{MEETING_METHODS.map((x) => <option key={x}>{x}</option>)}</select></label>
        <label className="w2">장소·접속 링크<input name="place" maxLength={500} defaultValue={m?.place ?? ""} placeholder="예: Zoom 링크 또는 울산과학대 M동 회의실" /></label>
        <label>주관<input name="host" maxLength={200} defaultValue={m?.host ?? ""} placeholder="예: UC 사업단" /></label>
        <label className="w4">안건 <span className="hint">한 줄에 하나씩</span><textarea name="agenda" defaultValue={m?.agenda.join("\n") ?? ""} /></label>
        <label className="w4">안내 사항 <span className="hint">준비물·사전 검토 자료 등</span><textarea name="notice" maxLength={3000} defaultValue={m?.notice ?? ""} /></label>
        <label>상태<select name="status" defaultValue={m?.status ?? "planned"}>{Object.entries(MEETING_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
      </div>
      <div className="f-actions">
        {m && <button formAction={deleteMeeting} className="btn btn-s btn-d" formNoValidate><Icon name="trash" size={15} />삭제</button>}
        <button className="btn btn-p btn-s">{m ? "일정 수정" : "회의 등록"}</button>
      </div>
    </form>
  );
}

function ResultForm({ m }: { m: MeetingRow }) {
  return (
    <form action={saveResult}>
      <input type="hidden" name="id" value={m.id} />
      <div className="fgrid">
        <label className="w4">참석자 <span className="hint">예: 울산과학대 심현미, 김해대 ○○○ (한 줄 또는 쉼표로 구분)</span><textarea name="attendees" defaultValue={m.attendees ?? ""} rows={3} /></label>
        <label className="w4">회의 결과<textarea name="summary" defaultValue={m.summary ?? ""} rows={5} /></label>
        <label className="w2">결정 사항 <span className="hint">한 줄에 하나씩</span><textarea name="decisions" defaultValue={m.decisions.join("\n")} /></label>
        <label className="w2">후속 조치 <span className="hint">한 줄에 하나 · 내용 / 담당 / 기한</span><textarea name="actions" defaultValue={m.actions.join("\n")} /></label>
      </div>
      <div className="f-actions"><button className="btn btn-p btn-s">결과 저장 (완료로 표시)</button></div>
    </form>
  );
}

export default async function MeetingsPage() {
  const me = await requireStaff();
  const hub = me.role === "hub_admin";
  const supabase = await createClient();
  const [m, f] = await Promise.all([
    supabase.from("meetings").select("id,held_on,title,attendees,summary,material_url,starts_at,ends_at,method,place,host,agenda,notice,status,decisions,actions").order("held_on", { ascending: false }).order("starts_at", { ascending: false, nullsFirst: false }),
    supabase.from("meeting_files").select("id,meeting_id,file_name,size_bytes,author_name,created_at").order("created_at"),
  ]);
  const meetings = (m.data ?? []) as MeetingRow[];
  const files = (f.data ?? []) as MeetingFile[];
  const upcoming = meetings.filter((x) => x.status === "planned").reverse();
  const past = meetings.filter((x) => x.status !== "planned");

  const card = (x: MeetingRow) => {
    const d = dday(x.held_on);
    const mf = files.filter((y) => y.meeting_id === x.id);
    const isUrl = x.place && /^https?:\/\//.test(x.place);
    return (
      <article className="g-card mt" key={x.id} id={`m-${x.id}`}>
        <div className="mt-h">
          <div>
            <div className="mt-when"><Icon name="calendar" size={15} />{fmtWhen(x)}</div>
            <h2>{x.title}</h2>
          </div>
          <div className="mt-tags">
            <Tag tone={ST_TONE[x.status]}>{MEETING_STATUS[x.status]}</Tag>
            {x.status === "planned" && d >= 0 && <Tag tone={d <= 3 ? "bad" : "wip"}>{d === 0 ? "오늘" : `D-${d}`}</Tag>}
          </div>
        </div>
        <dl className="mt-meta">
          {x.method && <><dt>방법</dt><dd>{x.method}</dd></>}
          {x.place && <><dt>장소</dt><dd>{isUrl ? <a href={x.place} target="_blank" rel="noopener noreferrer">접속 링크 열기</a> : x.place}</dd></>}
          {x.host && <><dt>주관</dt><dd>{x.host}</dd></>}
        </dl>
        {x.agenda.length > 0 && <div className="mt-sec"><div className="mt-lbl">안건</div><ol>{x.agenda.map((a, i) => <li key={i}>{a}</li>)}</ol></div>}
        {x.notice && <p className="mt-notice">{x.notice}</p>}

        {(x.attendees || x.summary || x.decisions.length > 0 || x.actions.length > 0) && (
          <div className="mt-result">
            <div className="mt-lbl">회의 결과</div>
            {x.attendees && <p className="small"><b>참석</b> · {x.attendees}</p>}
            {x.summary && <p style={{ whiteSpace: "pre-line" }}>{x.summary}</p>}
            {x.decisions.length > 0 && <><div className="mt-sub">결정 사항</div><ul>{x.decisions.map((a, i) => <li key={i}>{a}</li>)}</ul></>}
            {x.actions.length > 0 && <><div className="mt-sub">후속 조치</div><ul>{x.actions.map((a, i) => <li key={i}>{a}</li>)}</ul></>}
          </div>
        )}
        {x.material_url && <p className="small"><a className="g-link" href={x.material_url} target="_blank" rel="noopener noreferrer">관련 자료 →</a></p>}

        <MeetingFiles meetingId={x.id} files={mf} canWrite={hub} />

        {hub && (
          <div className="mt-edit">
            <details className="edit"><summary><Icon name="edit" size={14} />회의 결과 {x.summary || x.attendees ? "수정" : "입력"}</summary><ResultForm m={x} /></details>
            <details className="edit"><summary><Icon name="edit" size={14} />일정 안내 수정</summary><ScheduleForm m={x} /></details>
          </div>
        )}
      </article>
    );
  };

  return (
    <>
      <PageHead title="회의 일정·결과" desc="회의 일정 안내(일시·안건·방법)와 회의 결과(참석자·결과·결정·후속 조치), 첨부파일을 관리합니다." />
      {hub && <details className="add"><summary><Icon name="plus" size={18} />회의 일정 등록</summary><ScheduleForm /></details>}
      <h2 className="month">예정된 회의 {upcoming.length}건</h2>
      {upcoming.length === 0 ? <div className="empty">예정된 회의가 없습니다.</div> : upcoming.map(card)}
      <h2 className="month">지난 회의 {past.length}건</h2>
      {past.length === 0 ? <div className="empty">지난 회의 기록이 없습니다.</div> : past.map(card)}
    </>
  );
}

import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Tag } from "@/components/ui";
import { fmtShort, getGniData, getSurveys } from "@/lib/gni-docs";
import type { University } from "@/lib/types";
import { saveResponse, setSurveyStatus } from "../actions";
import { AddPanel, DocLink, DueTag, EditToggle, LoadError, SurveyForm } from "../parts";
import { SurveyFiles } from "./SurveyFiles";
import { NoticeForm } from "./NoticeForm";
import { SURVEY_NOTICE_DEFAULT_BODY } from "@/lib/email";

const fmtAt = (at: string) => new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(at));

export default async function GniSurveysPage() {
  const me = await requireStaff();
  const hub = me.role === "hub_admin";
  const canWrite = me.role !== "professor" && !!me.university_id;
  const supabase = await createClient();
  const [{ docs, decisions, error: gErr }, { surveys, responses, files, error: sErr }, u] = await Promise.all([
    getGniData(),
    getSurveys(),
    supabase.from("universities").select("id,name,short_name,sort").order("sort"),
  ]);
  const { data: noticeRows } = hub
    ? await supabase.from("gni_survey_notices").select("id,survey_id,audience,recipient_count,sent_by_name,sent_at").order("sent_at", { ascending: false }).limit(200)
    : { data: [] };
  const notices = (noticeRows ?? []) as { id: number; survey_id: number; audience: string; recipient_count: number; sent_by_name: string | null; sent_at: string }[];
  const univs = (u.data ?? []) as Pick<University, "id" | "name" | "short_name">[];
  const open = surveys.filter((s) => s.status === "open").length;

  return (
    <>
      <LoadError error={gErr ?? sErr} />
      <p className="small muted" style={{ margin: "0 4px 14px" }}>
        진행 중 {open}건 · 마감 {surveys.length - open}건. 대학별 관계자는 <b>소속 대학 의견</b>만 입력·수정할 수 있고, 다른 대학 의견은 참고용으로 볼 수 있습니다. 모은 의견은 <Link href="/admin/gni/decisions" style={{ color: "var(--blue)", fontWeight: 600 }}>결정 사항</Link>으로 이어집니다.
      </p>
      {hub && <AddPanel label="의견수렴 주제 등록"><SurveyForm docs={docs} decisions={decisions} /></AddPanel>}
      {surveys.length === 0 && !gErr && !sErr && <div className="empty">진행 중인 의견수렴이 없습니다.</div>}

      {surveys.map((s) => {
        const list = responses.filter((r) => r.survey_id === s.id);
        const sFiles = files.filter((f) => f.survey_id === s.id);
        const submitted = univs.filter((un) => list.some((r) => r.university_id === un.id) || sFiles.some((f) => f.university_id === un.id)).length;
        const mine = list.find((r) => r.university_id === me.university_id);
        const decision = s.decision_id ? decisions.find((d) => d.id === s.decision_id) : null;
        const isOpen = s.status === "open";
        return (
          <section className="g-card" key={s.id} id={`s-${s.id}`}>
            <h2>
              <Tag tone="info">{s.area}</Tag>{s.title}
              <span className="more" style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--muted)" }}>
                {isOpen ? <Tag tone="wip">진행 중</Tag> : <Tag tone="ok">마감</Tag>}
                {isOpen && <DueTag date={s.due_on} />}
              </span>
            </h2>
            {s.question && <p className="small" style={{ whiteSpace: "pre-line", marginBottom: 6 }}>{s.question}</p>}
            <p className="small muted" style={{ marginBottom: 12 }}>
              제출 {submitted} / {univs.length}개 대학{s.due_on ? ` · 마감 ${fmtShort(s.due_on)}` : ""}{" "}
              <DocLink id={s.doc_id} docs={docs} />
              {decision && <> · 결정 사항 <Link className="g-link" href="/admin/gni/decisions">{decision.title.slice(0, 30)} →</Link></>}
            </p>

            <div className="sv-grid">
              {univs.map((un) => {
                const r = list.find((x) => x.university_id === un.id);
                const uFiles = sFiles.filter((x) => x.university_id === un.id);
                const own = un.id === me.university_id;
                return (
                  <div key={un.id} className={`sv-card${own ? " own" : ""}`}>
                    <div className="sv-h"><b>{un.short_name}</b>{own && <Tag tone="info">소속</Tag>}{r || uFiles.length ? <Tag tone="ok">제출</Tag> : <Tag tone="draft">미제출</Tag>}</div>
                    {r ? (
                      <>
                        <ul className="sv-body">{r.body.split("\n").map((l) => l.trim()).filter(Boolean).map((l, i) => <li key={i}>{l}</li>)}</ul>
                        <div className="sv-f">{r.author_name ?? "작성자"} · {fmtAt(r.updated_at)}</div>
                      </>
                    ) : <p className="small muted">{uFiles.length ? "첨부파일만 제출했습니다." : "아직 의견이 없습니다."}</p>}
                    <SurveyFiles surveyId={s.id} universityId={un.id} files={uFiles} canWrite={own && canWrite && isOpen} />
                  </div>
                );
              })}
            </div>

            {canWrite && isOpen && (
              <form action={saveResponse} className="sv-form">
                <input type="hidden" name="survey_id" value={s.id} />
                <label className="small" style={{ fontWeight: 650 }}>
                  {univs.find((x) => x.id === me.university_id)?.short_name ?? "소속 대학"} 의견 {mine ? "수정" : "입력"} <span className="muted" style={{ fontWeight: 500 }}>한 줄에 하나씩 · 비우고 저장하면 삭제</span>
                  <textarea name="body" defaultValue={mine?.body ?? ""} maxLength={5000} rows={4} />
                </label>
                <div className="f-actions"><button className="btn btn-p btn-s">{mine ? "의견 수정" : "의견 제출"}</button></div>
              </form>
            )}
            {canWrite && !isOpen && <p className="small muted" style={{ marginTop: 10 }}>마감된 의견수렴은 수정할 수 없습니다.</p>}

            {hub && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 10 }}>
                <form action={setSurveyStatus}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="status" value={isOpen ? "closed" : "open"} />
                  <button className="btn btn-o btn-s">{isOpen ? "의견수렴 마감" : "다시 열기"}</button>
                </form>
                <div style={{ flexBasis: "100%" }}><EditToggle label="주제 수정"><SurveyForm s={s} docs={docs} decisions={decisions} /></EditToggle></div>
                <div style={{ flexBasis: "100%" }}>
                  <EditToggle label="의견수렴 안내 메일">
                    <NoticeForm
                      surveyId={s.id}
                      subject={s.notice_subject ?? `[GNI 공유대학] 의견수렴 요청 — ${s.title}`}
                      body={s.notice_body ?? SURVEY_NOTICE_DEFAULT_BODY}
                      univs={univs.map((un) => ({ id: un.id, short_name: un.short_name, submitted: list.some((r) => r.university_id === un.id) || sFiles.some((f) => f.university_id === un.id) }))}
                    />
                  </EditToggle>
                  {notices.some((n) => n.survey_id === s.id) && (
                    <div className="nt-log">{notices.filter((n) => n.survey_id === s.id).slice(0, 5).map((n) => (
                      <span key={n.id}>📨 {fmtAt(n.sent_at)} · {n.sent_by_name ?? "사업단"} · {n.audience} · {n.recipient_count}명</span>
                    ))}</div>
                  )}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}

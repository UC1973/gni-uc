import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Tag } from "@/components/ui";
import { PageHead } from "@/components/admin";
import { updateReply } from "../actions";
import type { Reply, University } from "@/lib/types";
import { REPLY_KINDS, type ReplyFile, type ReplyKind } from "@/lib/reply-files";
import { ReplyFiles } from "./ReplyFiles";

export default async function UnivsPage() {
  const me = await requireStaff();
  const hub = me.role === "hub_admin";
  const supabase = await createClient();
  const [u, r, f] = await Promise.all([
    supabase.from("universities").select("*").order("sort"),
    supabase.from("replies").select("*"),
    supabase.from("reply_files").select("id,university_id,kind,object_path,file_name,size_bytes,created_at,scan_status,scan_note").order("created_at"),
  ]);
  const univs = (u.data ?? []) as University[];
  const replies = (r.data ?? []) as Reply[];
  const allFiles = (f.data ?? []) as (ReplyFile & { scan_status: string; scan_note: string | null })[];
  const files = allFiles.filter((x) => x.scan_status === "clean");
  const blocked = allFiles.filter((x) => x.scan_status === "blocked").slice(-10).reverse();
  const fileUnivs = univs.filter((x) => hub || x.id === me.university_id);
  const canWrite = (uid: string) => hub || (me.role === "univ_staff" && me.university_id === uid);

  return (
    <>
      <PageHead title="참여대학 현황" desc="교육과정 설치 결과 회신(신설 공문 + 교육과정표)과 대학별 학사 일정을 모읍니다. 마감 2026.12.02.(수)" />
      <div className="panel" style={{ overflowX: "auto" }}>
        <table className="num">
          <thead><tr><th>대학</th><th>참여학과</th><th className="c">설치 공문</th><th className="c">교육과정표</th><th>수강신청 기간</th><th>성적입력 기간</th><th>모집(안)</th><th /></tr></thead>
          <tbody>
            {univs.map((x) => {
              const rp = replies.find((y) => y.university_id === x.id);
              const editable = hub || me.university_id === x.id;
              const fid = `r-${x.id}`;
              return (
                <tr key={x.id}>
                  <td><b>{x.name}</b> {x.is_hub && <Tag tone="info">중심</Tag>}</td>
                  <td className="small">{x.depts.join(", ")}</td>
                  {editable ? (
                    <>
                      <td className="c"><input form={fid} type="checkbox" name="install_doc" defaultChecked={rp?.install_doc} aria-label={`${x.short_name} 설치 공문`} /></td>
                      <td className="c"><input form={fid} type="checkbox" name="curriculum_doc" defaultChecked={rp?.curriculum_doc} aria-label={`${x.short_name} 교육과정표`} /></td>
                      <td className="inline"><input form={fid} name="enroll_period" defaultValue={rp?.enroll_period ?? ""} placeholder="확인 필요" aria-label="수강신청 기간" /></td>
                      <td className="inline"><input form={fid} name="grade_period" defaultValue={rp?.grade_period ?? ""} placeholder="확인 필요" aria-label="성적입력 기간" /></td>
                      <td>{x.quota}명</td>
                      <td><form id={fid} action={updateReply}><input type="hidden" name="university_id" value={x.id} /><button className="btn btn-o btn-s">저장</button></form></td>
                    </>
                  ) : (
                    <>
                      <td className="c">{rp?.install_doc ? "●" : "○"}</td><td className="c">{rp?.curriculum_doc ? "●" : "○"}</td>
                      <td>{rp?.enroll_period ?? <span className="muted">확인 필요</span>}</td><td>{rp?.grade_period ?? <span className="muted">확인 필요</span>}</td>
                      <td>{x.quota}명</td><td />
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="panel">
        <h2>회신 파일 <span className="aside">PDF·HWP·엑셀·워드·ZIP·이미지 · 파일당 20MB · 올릴 때 보안 검사를 거치며, 통과하면 제출 여부가 자동 체크됩니다</span></h2>
        <div className="rf-grid">
          {fileUnivs.map((x) => (
            <div className="rf-card" key={x.id}>
              <h3>{x.name} {x.is_hub && <Tag tone="info">중심</Tag>}</h3>
              {(Object.keys(REPLY_KINDS) as ReplyKind[]).map((k) => (
                <ReplyFiles key={k} universityId={x.id} kind={k} label={REPLY_KINDS[k]} files={files.filter((y) => y.university_id === x.id && y.kind === k)} canWrite={canWrite(x.id)} />
              ))}
            </div>
          ))}
        </div>
        {hub && blocked.length > 0 && (
          <div className="alert warn" style={{ marginTop: 12 }}>🛡 <div><b>보안 검사에서 차단된 업로드 (최근 {blocked.length}건)</b>
            {blocked.map((b) => <div key={b.id} className="small">{b.created_at.slice(0, 16).replace("T", " ")} · {univs.find((u) => u.id === b.university_id)?.short_name} · {b.file_name} — {b.scan_note}</div>)}
          </div></div>
        )}
        <p className="small muted" style={{ marginTop: 10 }}>{hub ? "사업단은 모든 대학의 파일을 내려받을 수 있습니다." : "소속 대학 파일만 보이며, 다른 대학 파일은 볼 수 없습니다."} 파일은 비공개로 저장되고 내려받기 링크는 60초 동안만 유효합니다.</p>
      </div>
    </>
  );
}

import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Tag } from "@/components/ui";
import { PageHead } from "@/components/admin";
import { updateReply } from "../actions";
import type { Reply, University } from "@/lib/types";

export default async function UnivsPage() {
  const me = await requireStaff();
  const hub = me.role === "hub_admin";
  const supabase = await createClient();
  const [u, r] = await Promise.all([supabase.from("universities").select("*").order("sort"), supabase.from("replies").select("*")]);
  const univs = (u.data ?? []) as University[];
  const replies = (r.data ?? []) as Reply[];

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
      <p className="small muted">회신 파일 업로드(Supabase Storage)는 다음 단계에서 추가합니다. 지금은 제출 여부만 체크합니다.</p>
    </>
  );
}

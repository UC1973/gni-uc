import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Tag } from "@/components/ui";
import { PageHead } from "@/components/admin";
import { reviewUser } from "../actions";
import { ROLE_LABEL, type Profile, type Role, type University } from "@/lib/types";

const ST_TONE = { pending: "wip", approved: "ok", rejected: "bad" } as const;
const ST_LABEL = { pending: "승인 대기", approved: "승인", rejected: "반려" };

export default async function UsersPage() {
  const me = await requireStaff({ hubOnly: true });
  const supabase = await createClient();
  const [p, u] = await Promise.all([
    supabase.from("profiles").select("*").order("status").order("created_at", { ascending: false }),
    supabase.from("universities").select("*"),
  ]);
  const users = (p.data ?? []) as Profile[];
  const univs = (u.data ?? []) as University[];
  const uname = (id: string | null) => univs.find((x) => x.id === id)?.short_name ?? "–";

  return (
    <>
      <PageHead title="사용자·권한" desc="가입 신청을 승인하면 Resend로 승인 메일이 발송됩니다." />
      <div className="panel" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>이름</th><th>이메일</th><th>소속</th><th>상태</th><th>역할 지정 · 처리</th></tr></thead>
          <tbody>
            {users.map((x) => (
              <tr key={x.id}>
                <td><b>{x.name}</b></td><td className="small">{x.email}</td><td>{uname(x.university_id)}</td>
                <td><Tag tone={ST_TONE[x.status]}>{ST_LABEL[x.status]}</Tag></td>
                <td>
                  {x.id === me.id ? <span className="small muted">본인 ({ROLE_LABEL[x.role]})</span> : (
                    <form action={reviewUser} className="inline">
                      <input type="hidden" name="id" value={x.id} />
                      <select name="role" defaultValue={x.role} aria-label="역할">{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
                      <button name="decision" value="approve" className="btn btn-p btn-s">{x.status === "approved" ? "역할 변경" : "승인"}</button>
                      {x.status !== "rejected" && <button name="decision" value="reject" className="btn btn-o btn-s">{x.status === "approved" ? "권한 회수" : "반려"}</button>}
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel" style={{ overflowX: "auto" }}><h2>역할별 권한</h2><table>
        <thead><tr><th>기능</th><th>UC 사업단</th><th>대학 담당자</th><th>교수</th></tr></thead><tbody>
          {[["대시보드", "5개 대학 전체", "소속 대학", "조회"], ["교육과정 관리", "확정·게시", "조회", "조회"], ["협의·학사운영", "안건·결정 기록", "조회", "조회"], ["참여대학 현황", "전체", "소속 대학 회신", "조회"], ["학생관리", "전체", "소속 학생", "조회"], ["비교과", "전체", "소속 대학 입력", "조회"], ["성과지표", "입력·검증", "조회", "조회"], ["콘텐츠·권한", "●", "–", "–"]].map((r) => <tr key={r[0]}><td><b>{r[0]}</b></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}
        </tbody></table></div>
    </>
  );
}

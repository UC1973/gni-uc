import { requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Tag } from "@/components/ui";
import { PageHead } from "@/components/admin";
import { createNotice, deleteNotice, toggleNotice, updateSetting } from "../actions";
import { AiNotice } from "./AiNotice";
import type { Notice } from "@/lib/types";

export default async function CmsPage() {
  const me = await requireStaff();
  const hub = me.role === "hub_admin";
  const supabase = await createClient();
  const [n, s] = await Promise.all([
    supabase.from("notices").select("*").order("created_at", { ascending: false }),
    supabase.from("site_settings").select("*").eq("key", "notice_bar").maybeSingle(),
  ]);
  const notices = (n.data ?? []) as Notice[];

  if (!hub) {
    return (
      <>
        <PageHead title="콘텐츠 관리" desc="홈페이지 공지·홍보자료는 UC 사업단이 게시합니다. 게시 요청은 사업단으로 보내 주세요." />
        <div className="panel"><table><thead><tr><th>분류</th><th>제목</th><th>상태</th></tr></thead><tbody>
          {notices.map((x) => <tr key={x.id}><td><Tag tone="info">{x.category}</Tag></td><td>{x.title}</td><td>{x.published ? <Tag tone="ok">게시중</Tag> : <Tag tone="draft">비공개</Tag>}</td></tr>)}
        </tbody></table></div>
      </>
    );
  }

  return (
    <>
      <PageHead title="콘텐츠 관리" desc="여기서 게시한 내용이 학생용 홈페이지에 바로 반영됩니다." />
      <form action={updateSetting} className="panel">
        <h2>홈페이지 상단 안내 문구</h2>
        <input type="hidden" name="key" value="notice_bar" />
        <div className="inline"><input name="value" defaultValue={s.data?.value ?? ""} aria-label="안내 문구" style={{ flex: 1 }} /><button className="btn btn-o btn-s">저장</button></div>
        <p className="small muted" style={{ marginTop: 6 }}>비워 두면 안내 띠가 숨겨집니다.</p>
      </form>
      <AiNotice />
      <form action={createNotice} className="panel">
        <h2>새 공지</h2>
        <div className="form-grid">
          <label>분류<select name="category">{["안내", "모집", "협의", "행사", "결과"].map((c) => <option key={c}>{c}</option>)}</select></label>
          <label style={{ gridColumn: "span 3" }}>제목<input name="title" required /></label>
        </div>
        <label className="small muted" style={{ display: "block", marginTop: 10 }}>본문<textarea name="body" /></label>
        <div className="inline" style={{ marginTop: 10 }}>
          <label className="small"><input type="checkbox" name="published" defaultChecked /> 바로 게시</label>
          <button className="btn btn-p btn-s" style={{ marginLeft: "auto" }}>등록</button>
        </div>
      </form>
      <div className="panel" style={{ overflowX: "auto" }}><h2>공지 목록</h2>
        <table><thead><tr><th>분류</th><th>제목</th><th>등록일</th><th>상태</th><th /></tr></thead><tbody>
          {notices.map((x) => (
            <tr key={x.id}>
              <td><Tag tone="info">{x.category}</Tag></td><td>{x.title}</td><td className="num small">{x.created_at.slice(0, 10)}</td>
              <td>{x.published ? <Tag tone="ok">게시중</Tag> : <Tag tone="draft">비공개</Tag>}</td>
              <td className="inline">
                <form action={toggleNotice}><input type="hidden" name="id" value={x.id} /><input type="hidden" name="published" value={String(!x.published)} /><button className="btn btn-o btn-s">{x.published ? "내리기" : "게시"}</button></form>
                <form action={deleteNotice}><input type="hidden" name="id" value={x.id} /><button className="btn btn-o btn-s">삭제</button></form>
              </td>
            </tr>
          ))}
        </tbody></table>
      </div>
    </>
  );
}

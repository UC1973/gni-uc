import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Course, Material, Notice, University } from "@/lib/types";

/** Supabase 연결 전에도 화면을 볼 수 있도록 하는 기본값 (seed.sql과 같은 내용) */
const FALLBACK = {
  universities: [
    { id: "uc", name: "울산과학대학교", short_name: "울산과학대", is_hub: true, depts: ["기계공학부", "전기전자공학부", "조선해양시스템공학과"], quota: 10, sort: 1, email_domains: ["uc.ac.kr"] },
    { id: "gh", name: "김해대학교", short_name: "김해대", is_hub: false, depts: ["미래자동차과"], quota: 5, sort: 2, email_domains: ["kimhae.ac.kr"] },
    { id: "dy", name: "동의과학대학교", short_name: "동의과학대", is_hub: false, depts: ["전기자동차과"], quota: 5, sort: 3, email_domains: ["dit.ac.kr"] },
    { id: "ya", name: "연암공과대학교", short_name: "연암공대", is_hub: false, depts: ["전기전자공학과", "스마트전기전자공학과", "기계공학과", "스마트기계공학과", "스마트소프트웨어학과"], quota: 5, sort: 4, email_domains: ["yc.ac.kr"] },
    { id: "ke", name: "한국승강기대학교", short_name: "한국승강기대", is_hub: false, depts: ["승강기검사학과"], quota: 5, sort: 5, email_domains: ["klc.ac.kr"] },
  ] as University[],
  courses: [
    ["2-1", "자동제어실무", "MD", 3, 0, 3, "울산과학대", "draft", null],
    ["2-1", "설비데이터수집분석", "MD", 3, 0, 3, "참여대학 협의", "wip", null],
    ["2-1", "산업IoT기초", "ND", 3, 0, 3, "참여대학 협의", "wip", null],
    ["2-2", "협동로봇운용", "MD", 1, 2, 3, "울산과학대", "draft", null],
    ["2-2", "스마트공장설비관리", "MD", 3, 0, 3, "참여대학 협의", "wip", null],
    ["2-2", "제조데이터분석", "ND", 1, 2, 3, "참여대학 협의", "wip", null],
    ["동계", "AI프로그래밍", "ND", 1, 1, 2, "참여대학 협의", "wip", "교과목명 「AX프로그래밍」으로 변경 예정"],
  ].map((c, i) => ({ id: i + 1, term: c[0], name: c[1], degree: c[2], theory: c[3], practice: c[4], credits: c[5], host: c[6], status: c[7], note: c[8], course_code: null, sort: i + 1 })) as Course[],
  notices: [] as Notice[],
  materials: [] as Material[],
  settings: { notice_bar: "교육과정은 참여대학이 협의하고 있습니다. 확정되면 이 페이지에 바로 반영됩니다." } as Record<string, string>,
};

export async function getPublicData() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return { ...FALLBACK, live: false };
  try {
    const supabase = await createClient();
    const [u, c, n, m, s] = await Promise.all([
      supabase.from("universities").select("*").order("sort"),
      supabase.from("courses").select("*").order("sort"),
      supabase.from("notices").select("*").eq("published", true).order("created_at", { ascending: false }).limit(5),
      supabase.from("materials").select("*").eq("published", true).order("sort"),
      supabase.from("site_settings").select("*"),
    ]);
    if (u.error || c.error) throw u.error ?? c.error;
    return {
      universities: u.data as University[],
      courses: c.data as Course[],
      notices: (n.data ?? []) as Notice[],
      materials: (m.data ?? []) as Material[],
      settings: Object.fromEntries((s.data ?? []).map((r: { key: string; value: string }) => [r.key, r.value])),
      live: true,
    };
  } catch (e) {
    console.error("[public-data] Supabase 조회 실패, 기본값 사용", e);
    return { ...FALLBACK, live: false };
  }
}

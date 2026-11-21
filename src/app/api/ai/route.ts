import { NextResponse, type NextRequest } from "next/server";
import { getProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { aiConfigured, generateText } from "@/lib/ai";

const CONTEXT = "너는 울산과학대학교 5극3특공유대학사업단(GNI-UC)의 행정 보조다. GNI는 경상국립대학교가 주관하는 공유대학이고, UC는 미래모빌리티 트랙 산업AX전공(ND 8학점·MD 12학점, 5개 전문대학)을 운영한다. 한국어 공문체로 간결하게 쓰고, 확정되지 않은 내용은 '협의 중'으로 표현한다. 사실을 지어내지 않는다. 화면에 그대로 표시되므로 마크다운(#, **, 표, |)을 쓰지 말고, 소제목은 【 】로, 항목은 1. 2. 또는 - 로 쓴 일반 텍스트로 답한다.";

export async function POST(req: NextRequest) {
  const me = await getProfile();
  if (!me || me.status !== "approved" || me.role !== "hub_admin") return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  if (!aiConfigured()) return NextResponse.json({ error: "AI 키(OPENAI_API_KEY)가 설정되지 않았습니다." }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as { task?: string; input?: string };
  try {
    if (body.task === "issues-summary") {
      const supabase = await createClient();
      const { data } = await supabase.from("issues").select("category,title,detail,status,decision");
      const lines = (data ?? []).map((x) => `- [${x.category}] ${x.title} (${x.status === "ok" ? "결정" : x.status === "wip" ? "협의 중" : "안"}) ${x.detail ?? ""} ${x.decision ? `→ 결정: ${x.decision}` : ""}`).join("\n");
      const text = await generateText(`${CONTEXT}\n협의 안건 목록을 보고 (1) 결정된 사항 (2) 다음 회의에서 결정해야 할 사항(우선순위 순) (3) 대학별로 요청할 자료를 정리하라.`, lines);
      return NextResponse.json({ text });
    }
    if (body.task === "notice-draft") {
      const input = String(body.input ?? "").slice(0, 2000);
      if (!input.trim()) return NextResponse.json({ error: "공지에 담을 내용을 입력해 주세요." }, { status: 400 });
      const text = await generateText(`${CONTEXT}\n학생 대상 홈페이지 공지사항 초안을 작성하라. 첫 줄은 제목, 이후 본문. 학생이 이해하기 쉬운 말로 쓴다.`, input);
      return NextResponse.json({ text });
    }
    return NextResponse.json({ error: "알 수 없는 작업입니다." }, { status: 400 });
  } catch (e) {
    console.error("[ai]", e);
    return NextResponse.json({ error: "AI 응답을 받지 못했습니다. 모델 ID와 API 키를 확인해 주세요." }, { status: 502 });
  }
}

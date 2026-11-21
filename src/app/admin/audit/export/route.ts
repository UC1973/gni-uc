import { NextResponse, type NextRequest } from "next/server";
import { getProfile } from "@/lib/auth";
import { ACTION_LABEL, TABLE_LABEL, actorText, describe } from "@/lib/audit";
import { queryAudit } from "@/lib/audit-query";

const cell = (v: string) => {
  const s = /^[=+\-@]/.test(v) ? `'${v}` : v;          // 엑셀 수식 주입 방지
  return `"${s.replace(/"/g, '""')}"`;
};

/** 변경 이력 CSV (사업단 전용, 최대 5,000건) */
export async function GET(req: NextRequest) {
  const me = await getProfile();
  if (!me || me.status !== "approved" || me.role !== "hub_admin") return new NextResponse("권한이 없습니다.", { status: 403 });
  const p = req.nextUrl.searchParams;
  const { rows } = await queryAudit(
    { table: p.get("table") ?? undefined, action: p.get("action") ?? undefined, actor: p.get("actor") ?? undefined, from: p.get("from") ?? undefined, to: p.get("to") ?? undefined },
    [0, 4999],
  );
  const lines = [["일시(KST)", "사람", "이메일", "대상", "작업", "항목", "변경 내용"].map(cell).join(",")];
  for (const r of rows) {
    const at = new Date(r.at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", hour12: false });
    lines.push([at, actorText(r), r.actor_email ?? "", TABLE_LABEL[r.table_name] ?? r.table_name, ACTION_LABEL[r.action], r.row_label ?? r.row_key ?? "", describe(r).join(" / ")].map(cell).join(","));
  }
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gni-uc-audit-${date}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}

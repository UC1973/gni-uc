import "server-only";
import { Resend } from "resend";

const FROM = process.env.RESEND_FROM ?? "GNI-UC <onboarding@resend.dev>";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function client() {
  const key = process.env.RESEND_API_KEY;
  return key ? new Resend(key) : null;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string) {
  return `<div style="font-family:Pretendard,Apple SD Gothic Neo,sans-serif;max-width:520px;margin:auto;padding:24px;color:#121A2E">
  <div style="font-weight:800;color:#0E2350;font-size:18px">GNI-UC 산업AX전공</div>
  <div style="font-size:12px;color:#5A6482;margin-bottom:20px">울산과학대학교 5극3특공유대학사업단</div>
  <h2 style="font-size:20px">${title}</h2>${body}
  <p style="margin-top:28px;font-size:12px;color:#5A6482">이 메일은 발신 전용입니다.</p></div>`;
}

/** 발송 실패가 가입·승인 흐름을 막지 않도록 오류는 기록만 합니다. */
async function send(to: string | string[], subject: string, html: string) {
  const resend = client();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY 미설정 — 발송 생략:", subject);
    return;
  }
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) console.error("[email] 발송 실패:", error);
}

export async function sendSignupReceived(to: string, name: string) {
  await send(to, "[GNI-UC] 교직원 가입 신청이 접수되었습니다",
    layout(`${esc(name)}님, 가입 신청이 접수되었습니다`,
      `<p>UC 사업단이 소속과 역할을 확인한 뒤 승인하면 다시 알려드립니다.</p>`));
}

export async function notifyAdminsOfSignup(name: string, email: string, univ: string, role: string) {
  const admins = (process.env.ADMIN_NOTIFY_EMAILS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!admins.length) return;
  await send(admins, `[GNI-UC] 새 가입 신청: ${name.slice(0, 40)} (${univ})`,
    layout("새 교직원 가입 신청",
      `<p><b>${esc(name)}</b> · ${esc(email)}<br>${esc(univ)} · ${esc(role)}</p>
       <p><a href="${SITE}/admin/users" style="display:inline-block;padding:10px 18px;background:#2F6BFF;color:#fff;border-radius:8px;text-decoration:none">승인하러 가기</a></p>`));
}

export async function sendApproved(to: string, name: string) {
  await send(to, "[GNI-UC] 가입이 승인되었습니다",
    layout(`${esc(name)}님, 가입이 승인되었습니다`,
      `<p>이제 사업관리·성과관리시스템을 이용할 수 있습니다.</p>
       <p><a href="${SITE}/login" style="display:inline-block;padding:10px 18px;background:#2F6BFF;color:#fff;border-radius:8px;text-decoration:none">로그인</a></p>`));
}

export async function sendRejected(to: string, name: string) {
  await send(to, "[GNI-UC] 가입 신청 결과 안내",
    layout(`${esc(name)}님의 가입 신청이 승인되지 않았습니다`, `<p>문의는 UC 사업단으로 연락해 주세요.</p>`));
}

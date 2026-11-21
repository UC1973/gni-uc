import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "교직원 로그인" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const err = sp.error === "confirm" ? "인증 링크가 만료되었거나 이미 사용되었습니다. 인증이 끝났다면 바로 로그인해 보시고, 안 되면 로그인 화면에서 인증 메일을 다시 받아 주세요." : undefined;
  return <AuthShell><LoginForm next={sp.next ?? "/admin"} initialError={err} /></AuthShell>;
}

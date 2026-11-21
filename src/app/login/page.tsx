import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "교직원 로그인" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const err = sp.error === "confirm" ? "인증 링크가 만료되었거나 올바르지 않습니다. 다시 시도해 주세요." : undefined;
  return <AuthShell><LoginForm next={sp.next ?? "/admin"} initialError={err} /></AuthShell>;
}

import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { getPublicData } from "@/lib/public-data";
import { SignupForm } from "./SignupForm";

// 사업단이 관리 화면에서 바꾼 내용을 바로 보여주기 위해 요청마다 렌더링합니다.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "교직원 가입 신청" };

export default async function SignupPage() {
  const { universities } = await getPublicData();
  return <AuthShell><SignupForm universities={universities} /></AuthShell>;
}

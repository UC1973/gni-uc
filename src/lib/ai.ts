import "server-only";
import OpenAI from "openai";

/** AI 모델 ID는 환경변수로 바꿀 수 있습니다 (기본: gpt-6.1-terra). */
export const AI_MODEL = process.env.AI_MODEL ?? "gpt-6.1-terra";

export function aiConfigured() {
  return !!process.env.OPENAI_API_KEY;
}

export async function generateText(instructions: string, input: string) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, baseURL: process.env.OPENAI_BASE_URL || undefined });
  const res = await client.responses.create({ model: AI_MODEL, instructions, input });
  return res.output_text;
}

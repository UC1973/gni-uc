/** GNI 의견수렴 첨부파일 규칙 (브라우저·서버 공통) */
export const SURVEY_BUCKET = "survey-files";
export const SURVEY_MAX_FILES = 3;
export const SURVEY_MAX_BYTES = 10 * 1024 * 1024;
export const SURVEY_ALLOWED_EXT = ["pdf", "hwp", "hwpx", "xlsx", "xls", "docx", "doc", "zip", "jpg", "jpeg", "png"];

export type SurveyFile = { id: number; survey_id: number; university_id: string; file_name: string; size_bytes: number; author_name: string | null; created_at: string };

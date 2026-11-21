import "server-only";
import { createHash } from "node:crypto";
import { unzipSync } from "fflate";

/**
 * 업로드 파일 안전 검사 (서버에서 실제 파일 내용을 읽어 판단)
 *  1. 확장자와 실제 파일 형식(시그니처)이 일치하는지 — 이름만 바꾼 실행파일 차단
 *  2. 문서 속 위험 요소 — 매크로(VBA), PDF 자바스크립트·자동실행, HWP 스크립트
 *  3. 압축파일 속 실행파일·스크립트·중첩 압축, 압축 폭탄
 *  4. (선택) VirusTotal 평판 조회 — 파일 내용은 보내지 않고 SHA-256 값만 조회 (VIRUSTOTAL_API_KEY)
 */
export type ScanResult = { ok: true; sha256: string; note?: string } | { ok: false; sha256: string; reason: string };

const OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const ZIP = [0x50, 0x4b, 0x03, 0x04];
const SIGS: Record<string, number[][]> = {
  pdf: [[0x25, 0x50, 0x44, 0x46]],             // %PDF
  hwp: [OLE], doc: [OLE], xls: [OLE],
  hwpx: [ZIP], docx: [ZIP], xlsx: [ZIP], zip: [ZIP],
  jpg: [[0xff, 0xd8, 0xff]], jpeg: [[0xff, 0xd8, 0xff]],
  png: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
};

const DANGEROUS_EXT = /\.(exe|dll|com|scr|pif|msi|msp|bat|cmd|ps1|psm1|vbs|vbe|js|jse|wsf|wsh|hta|lnk|jar|apk|app|sh|reg|cpl|iso|img|vhd|docm|xlsm|pptm|dotm|xltm|html?|svg)$/i;
const NESTED_ARCHIVE = /\.(zip|rar|7z|gz|tar|cab|alz|egg)$/i;
const MAX_UNZIPPED = 200 * 1024 * 1024;
const MAX_ENTRIES = 2000;

const startsWith = (b: Uint8Array, sig: number[]) => sig.every((v, i) => b[i] === v);
const ascii = (b: Uint8Array) => Buffer.from(b).toString("latin1");

function scanZip(buf: Uint8Array, ext: string): string | null {
  let names: string[] = [];
  let total = 0;
  try {
    unzipSync(buf, {
      filter: (f) => {
        names.push(f.name);
        total += f.originalSize;
        return false;                       // 압축은 풀지 않고 목록만 확인
      },
    });
  } catch {
    return "손상되었거나 암호가 걸린 압축 형식입니다.";
  }
  if (names.length > MAX_ENTRIES || total > MAX_UNZIPPED) return "압축을 풀면 지나치게 커지는 파일입니다(압축 폭탄 의심).";
  names = names.map((n) => n.toLowerCase());
  if (names.some((n) => n.includes("../") || n.startsWith("/"))) return "압축 안에 위험한 경로가 있습니다.";
  if (names.some((n) => /vbaproject\.bin$|activex\//.test(n))) return "매크로(VBA)·ActiveX가 들어 있는 문서입니다. 매크로 없는 형식으로 저장해 올려 주세요.";
  if (ext === "zip") {
    const bad = names.find((n) => DANGEROUS_EXT.test(n));
    if (bad) return `압축 안에 실행·스크립트 파일이 있습니다: ${bad.split("/").pop()}`;
    if (names.some((n) => NESTED_ARCHIVE.test(n))) return "압축 안에 또 다른 압축파일이 있습니다. 풀어서 올려 주세요.";
  }
  if (ext === "hwpx" && names.some((n) => /scripts\/|\.js$/.test(n))) return "스크립트가 포함된 한글 문서입니다.";
  return null;
}

function scanPdf(buf: Uint8Array): string | null {
  const s = ascii(buf);
  if (/\/(JavaScript|JS)\b/.test(s)) return "자바스크립트가 포함된 PDF입니다.";
  if (/\/Launch\b/.test(s)) return "외부 프로그램을 실행하는 PDF입니다.";
  if (/\/(EmbeddedFile|RichMedia|XFA)\b/.test(s)) return "다른 파일·동적 양식이 포함된 PDF입니다. 일반 PDF로 다시 저장해 올려 주세요.";
  return null;
}

function scanOle(buf: Uint8Array, ext: string): string | null {
  // OLE 문서 안의 스트림 이름은 UTF-16LE로 저장됨
  const u = Buffer.from(buf).toString("utf16le");
  if (/_VBA_PROJECT/.test(u))   // 매크로 저장 영역 이름 (본문에 "VBA" 글자가 있어도 오탐하지 않도록 좁게) return "매크로(VBA)가 들어 있는 문서입니다. 매크로를 제거해 올려 주세요.";
  if (ext === "hwp" && /DefaultJScript|JScriptVersion/.test(u)) {
    // 한글 문서는 기본 스크립트 스트림이 비어 있어도 존재할 수 있어, 실제 코드 흔적이 있을 때만 차단
    if (/eval\(|ActiveXObject|WScript|Shell\.Application|XMLHTTP/i.test(ascii(buf) + u)) return "스크립트가 포함된 한글 문서입니다.";
  }
  return null;
}

async function virusTotal(sha256: string): Promise<string | null> {
  const key = process.env.VIRUSTOTAL_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch(`https://www.virustotal.com/api/v3/files/${sha256}`, { headers: { "x-apikey": key }, signal: AbortSignal.timeout(8000) });
    if (res.status === 404) return null;                // 알려지지 않은 파일 = 판정 없음
    if (!res.ok) return null;
    const j = (await res.json()) as { data?: { attributes?: { last_analysis_stats?: { malicious?: number } } } };
    const bad = j.data?.attributes?.last_analysis_stats?.malicious ?? 0;
    return bad > 0 ? `백신 ${bad}곳에서 악성으로 판정된 파일입니다.` : null;
  } catch {
    return null;                                         // 조회 실패는 업로드를 막지 않음
  }
}

export async function scanFile(buf: Uint8Array, ext: string): Promise<ScanResult> {
  const sha256 = createHash("sha256").update(buf).digest("hex");
  const sigs = SIGS[ext];
  if (!sigs) return { ok: false, sha256, reason: "허용되지 않는 형식입니다." };
  if (!sigs.some((s) => startsWith(buf, s))) {
    if (startsWith(buf, [0x4d, 0x5a])) return { ok: false, sha256, reason: "실행파일(.exe)의 이름만 바꾼 파일입니다." };
    return { ok: false, sha256, reason: `파일 내용이 .${ext} 형식이 아닙니다. 확장자를 확인해 주세요.` };
  }

  let reason: string | null = null;
  if (ext === "pdf") reason = scanPdf(buf);
  else if (startsWith(buf, ZIP)) reason = scanZip(buf, ext);
  else if (startsWith(buf, OLE)) reason = scanOle(buf, ext);
  if (reason) return { ok: false, sha256, reason };

  const vt = await virusTotal(sha256);
  if (vt) return { ok: false, sha256, reason: vt };
  return { ok: true, sha256, note: process.env.VIRUSTOTAL_API_KEY ? "형식·내용·평판 검사" : "형식·내용 검사" };
}

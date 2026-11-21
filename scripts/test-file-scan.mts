// 회신 파일 보안 검사 시험: npm run test:scan
import { zipSync, strToU8 } from "fflate";
import { scanFile } from "../src/lib/file-scan";
const enc = (s: string) => new TextEncoder().encode(s);
const OLE = [0xd0,0xcf,0x11,0xe0,0xa1,0xb1,0x1a,0xe1];
const ole = (extra: string) => new Uint8Array([...OLE, ...Buffer.from(extra, "utf16le")]);
const cases: [string, Uint8Array, string, boolean][] = [
  ["clean pdf", enc("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF"), "pdf", true],
  ["pdf with JavaScript", enc("%PDF-1.4\n1 0 obj<</S/JavaScript/JS(app.alert(1))>>endobj"), "pdf", false],
  ["pdf with Launch", enc("%PDF-1.4\n<</S/Launch/F(cmd.exe)>>"), "pdf", false],
  ["exe renamed .pdf", new Uint8Array([0x4d,0x5a,0x90,0,3,0]), "pdf", false],
  ["png renamed .hwp", new Uint8Array([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), "hwp", false],
  ["clean zip", zipSync({ "공문.pdf": enc("%PDF-1.4"), "표.xlsx": strToU8("x") }), "zip", true],
  ["zip with exe", zipSync({ "a/setup.exe": strToU8("MZ") }), "zip", false],
  ["zip with nested zip", zipSync({ "inner.zip": strToU8("PK") }), "zip", false],
  ["docx with macro", zipSync({ "word/document.xml": strToU8("<x/>"), "word/vbaProject.bin": strToU8("x") }), "docx", false],
  ["clean xlsx", zipSync({ "xl/workbook.xml": strToU8("<x/>") }), "xlsx", true],
  ["hwp clean", ole("FileHeader BodyText"), "hwp", true],
  ["xls with VBA", ole("_VBA_PROJECT"), "xls", false],
  ["doc mentioning Macros in text", ole("본문: Macros and VBA 교육 안내"), "doc", true],
  ["jpg", new Uint8Array([0xff,0xd8,0xff,0xe0,0,0x10]), "jpg", true],
  ["unknown ext", enc("hello"), "txt", false],
];
let fail = 0;
for (const [name, buf, ext, expectOk] of cases) {
  const r = await scanFile(buf, ext);
  const pass = r.ok === expectOk;
  if (!pass) fail++;
  console.log(`${pass ? "PASS" : "FAIL"} ${name} → ${r.ok ? "허용" : "차단: " + r.reason}`);
}
console.log(fail ? `${fail} FAILED` : "ALL PASSED");

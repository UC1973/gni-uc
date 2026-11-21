-- 회신 파일 안전 검사 결과
alter table public.reply_files
  add column if not exists sha256 text,
  add column if not exists scan_status text not null default 'clean' check (scan_status in ('clean', 'blocked')),
  add column if not exists scan_note text;

-- 차단된 파일은 기록만 남고(저장소에서는 즉시 삭제) 목록·제출 여부에서 제외됩니다.
create index if not exists reply_files_scan_idx on public.reply_files (scan_status);

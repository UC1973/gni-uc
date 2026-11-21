# GNI-UC 산업AX전공 홈페이지 · 성과관리시스템

울산과학대학교 5극3특공유대학사업단(GNI-UC) — 미래모빌리티 트랙 산업AX전공

- 운영 주소: **https://gni-uc.org** (Vercel, DNS도 Vercel에서 관리)
- 메일 발신: `no-reply@gni-uc.org` (Resend, 인증 메일은 Supabase → Resend SMTP)

- **학생용 홈페이지** (`/`) — 로그인 없이 바로 열림. 사업 소개, 이수 로드맵, 학생 혜택, 모집 안내, 홍보자료
- **교직원 관리 시스템** (`/admin`) — 5개 참여대학 교수·직원 전용. 교육과정 확정 관리, 협의 안건, 대학별 회신, 학생·비교과·성과·콘텐츠·권한

| 구성 | 사용 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, Server Actions) |
| DB · 인증 | Supabase (PostgreSQL + Auth + RLS) |
| 메일 | Resend — 가입 접수, 사업단 알림, 승인/반려 메일 (+ Supabase 인증 메일 SMTP) |
| AI | OpenAI 호환 API, 모델 `AI_MODEL` (기본 `gpt-6.1-terra`) — 안건 정리, 공지 초안 |
| 배포 | Vercel (GitHub 연동 자동 배포) |

---

## 1. 처음 설정하기

### Supabase
1. 새 프로젝트를 만들고(리전: Seoul `ap-northeast-2`) SQL을 순서대로 실행합니다.
   - `supabase/migrations/20261121000000_init.sql` — 테이블·권한(RLS)
   - `supabase/migrations/20261121000100_harden.sql` — 권한 함수 비공개 스키마 이동
   - `supabase/migrations/20261121000200_grants.sql` — API 역할 권한
   - `supabase/migrations/20261121000300_email_confirmed.sql` — 승인 화면용 이메일 인증 여부
   - `supabase/migrations/20261121000400_email_domains.sql` — 대학별 메일 도메인, 가입 시 도메인 검사
   - `supabase/migrations/20261121000500_split_policies.sql` — 정책 정리(성능 경고 해소)
   - `supabase/migrations/20261121000600_reply_files.sql` — 회신 파일(비공개 Storage 버킷 `replies`, 대학별 권한)
   - `supabase/migrations/20261121000700_audit_log.sql` — 변경 이력(감사 로그) 트리거, 수정·삭제 불가
   - `supabase/migrations/20261121000800_file_scan.sql` — 회신 파일 보안 검사 결과(sha256, 차단 기록)
   - `supabase/migrations/20261121000900_audit_retention.sql` — 변경 이력 3년 보관 후 자동 파기(pg_cron, 매일 03:00 KST)
   - `supabase/seed.sql` — 11.20. 협의 자료 기준 초기 데이터
   - 현재 운영 DB: Supabase **5P3S** 조직의 **GNI-UC** 프로젝트 (`qbjevtjeczecysbtridj`, 도쿄) — 위 SQL 모두 적용 완료
2. **Authentication → URL Configuration**
   - Site URL: `https://gni-uc.org`
   - Redirect URLs: `https://gni-uc.org/auth/callback`, `https://www.gni-uc.org/auth/callback`, `https://gni-uc.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`
3. **Authentication → Emails → SMTP Settings** (인증 메일을 Resend로 보내기)
   - Host `smtp.resend.com` · Port `465` · User `resend` · Password = Resend API 키
   - Sender: `no-reply@gni-uc.org` / 이름 `GNI-UC 산업AX전공`

### 메일 템플릿
`supabase/templates/*.html` — 가입 인증, 비밀번호 재설정, 로그인 링크, 이메일 변경, 초대, 본인 확인 코드, 비밀번호·이메일 변경 알림.
제목과 연결은 `supabase/config.toml`의 `[auth.email.template.*]`, `[auth.email.notification.*]`에 있으며 아래로 반영합니다.

```bash
supabase config push --remote=qbjevtjeczecysbtridj
```

메일 속 링크는 모두 `/auth/confirm?token_hash=…`로 연결되어, 어느 기기에서 눌러도 동작합니다.

### Resend
1. 발신 도메인을 추가하고 DNS 인증을 완료합니다. (인증 전에는 본인 이메일로만 발송됩니다.)
2. API 키를 만들어 아래 환경변수와 Supabase SMTP에 넣습니다.

### 환경변수
`.env.example`을 `.env.local`로 복사해 채웁니다. Vercel에는 **Settings → Environment Variables**에 같은 값을 넣습니다.

| 변수 | 설명 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase API 설정 |
| `NEXT_PUBLIC_SITE_URL` | 메일 속 링크 주소 |
| `RESEND_API_KEY` / `RESEND_FROM` | 메일 발송 |
| `ADMIN_NOTIFY_EMAILS` | 이메일 인증을 마친 새 가입 신청 알림 받을 사업단 메일 (쉼표 구분) |
| `OPENAI_API_KEY` / `AI_MODEL` / `OPENAI_BASE_URL`(선택) | AI 기능 |

### 교직원 가입·승인 절차
1. `/signup`에서 가입 신청 → 신청자에게 "접수" 메일 (Resend)
2. 신청자가 **이메일 인증 링크** 클릭 → 이때 사업단(`ADMIN_NOTIFY_EMAILS`)에 승인 요청 메일
3. 사업단이 `/admin/users`에서 인증 여부를 보고 역할 지정 후 **승인** → 신청자에게 승인 메일
4. 인증 메일을 못 받은 경우 로그인 화면의 **인증 메일 다시 보내기** 사용
5. **소속 대학 메일로만 가입 가능** — uc.ac.kr · kimhae.ac.kr · dit.ac.kr · yc.ac.kr · klc.ac.kr (`universities.email_domains`, DB 트리거로도 강제)

### 첫 사업단 관리자 지정
가입은 누구나 신청할 수 있지만 권한은 사업단이 승인해야 생깁니다. 첫 관리자는 가입 후 Supabase SQL Editor에서 직접 지정합니다.

```sql
update public.profiles set role = 'hub_admin', status = 'approved' where email = '사업단장@uc.ac.kr';
```

이후 다른 교직원은 `/admin/users`에서 승인합니다.

---

## 2. 로컬 실행

```bash
npm install
npm run dev
```

Supabase 환경변수가 없으면 홈페이지는 기본 데이터로 보이고, 관리 화면은 로그인 화면으로 이동합니다.

---

## 3. 권한 구조

| 기능 | UC 사업단 | 대학 담당자 | 교수 |
|---|---|---|---|
| 교육과정 확정·게시 | ● | 조회 | 조회 |
| 협의 안건 | 등록·결정 | 조회 | 조회 |
| 대학별 회신·학사일정 | 전체 | 소속 대학 | 조회 |
| 학생 | 전체 | 소속 대학 | 조회 |
| 비교과 수요 | 전체 | 소속 대학 | 조회 |
| 성과지표 | 입력·검증 | 조회 | 조회 |
| 콘텐츠 · 사용자 승인 · AI | ● | – | – |

권한은 화면뿐 아니라 DB의 RLS 정책으로도 막혀 있습니다 (`supabase/migrations`).

---

## 4. 다음 단계 (교육과정 확정 후)
- 대학별 회신 파일 업로드 (Supabase Storage)
- 성적평가 방식 확정 후 성적 입력 화면
- 학생지원 기준 확정 후 홈페이지 혜택 갱신
- 홍보자료 파일 업로드

### 회신 파일 보안 검사
업로드된 파일을 서버가 직접 읽어 확인합니다 (`src/lib/file-scan.ts`).
확장자와 실제 형식 일치, 이름만 바꾼 실행파일, 매크로(VBA)·ActiveX 문서, PDF 자바스크립트·자동실행·첨부파일, 압축 속 실행파일·중첩 압축·압축 폭탄.
차단된 파일은 저장소에서 즉시 지우고 기록만 남깁니다(참여대학 현황 › 차단된 업로드). `VIRUSTOTAL_API_KEY`를 넣으면 파일 내용 대신 해시값으로 백신 평판도 조회합니다.

```bash
npm run test:scan   # 15개 사례 시험
```

### 개인정보 처리방침
`/privacy` — 홈페이지 하단과 가입 화면에서 연결. 가입 시 필수 동의를 받아 동의 시각·버전을 계정 정보에 저장합니다.

## 5. 보안 점검

```bash
supabase db query --remote=qbjevtjeczecysbtridj --yes -f supabase/tests/rls_check.sql
```
역할별(타 대학 담당자·교수·승인 대기·비로그인) 권한과 변경 이력 위변조 방지 등 25개 항목을 시험하고, 마지막에 예외로 전부 되돌립니다. 결과는 `RLS_RESULT | ok … ` 형태로 출력되며 `FAIL`이 없어야 합니다.

적용된 보호: RLS(대학별 데이터 분리), 소속 대학 메일 도메인 가입 제한(DB 트리거), 사업단 승인제, 비밀번호 8자+영문·숫자, 유출 비밀번호 차단, 비밀번호 변경 시 재인증, 12시간 미사용 로그아웃, 비공개 파일 저장소 + 60초 서명 URL, CSP·X-Frame-Options 등 보안 헤더, 관리 화면 noindex·no-store, DB SSL 강제, 매일 백업, 변경 이력(14개 테이블, `/admin/audit`, CSV 내려받기, 3년 후 자동 파기).

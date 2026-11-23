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
기존 사이트 작업은 GitHub `UC1973`으로 로그인한 Supabase의 **GNI-UC 조직 → GNI-UC 프로젝트** (`qbjevtjeczecysbtridj`, 도쿄)를 사용합니다. 새 프로젝트를 만들지 않습니다. 아래 초기화 절차는 별도 환경을 새로 구성할 때만 사용합니다.

1. 별도 환경이 필요한 경우 새 프로젝트를 만들고(권장 리전: Seoul `ap-northeast-2`) SQL을 순서대로 실행합니다.
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
   - `supabase/migrations/20261123010000_gni_docs.sql` — GNI 공유대학 공문·일정·결정 사항·체크리스트(교직원 조회, 사업단 편집, 사업단 메모 분리) + 초기 정리본
   - `supabase/seed.sql` — 11.20. 협의 자료 기준 초기 데이터
   - 현재 운영 DB: Supabase **GNI-UC** 조직 (`aqgieoclveecopljvtuo`)의 **GNI-UC** 프로젝트 (`qbjevtjeczecysbtridj`, 도쿄) — 위 SQL 모두 적용 완료
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

### 가입자 현황 (`/admin/members`, UC 사업단 전용)
전체·승인·승인 대기(이메일 미인증 포함) 인원, 대학 × 역할별 가입자, 사전 승인 교직원의 가입·인증·승인 진행(미가입/인증 대기/승인 대기/승인 완료), 최근 가입 신청을 보여 줍니다. 사전 승인 목록은 `public.member_preapproval_status()`(UC 사업단만 결과 반환)로 조회합니다. 승인·역할 변경은 `/admin/users`에서 합니다.

### 사전 승인 교직원
미리 정한 교직원은 새 마이그레이션으로 `private.member_preapprovals`(메일·성함·소속 대학·역할·직위, API 비공개)에 추가합니다. 본인이 `/signup`에서 해당 메일로 가입하고 이메일 인증을 마치면 지정 역할로 자동 승인되어 `/admin`으로 들어갑니다(이미 인증을 마친 승인 대기 계정은 마이그레이션 적용 시 바로 반영). 전화번호 등 연락처는 저장소에 남기지 않습니다.

| 메일 | 소속 | 역할 | 직위 |
|---|---|---|---|
| hmsim@uc.ac.kr | 울산과학대 | UC 사업단 | 5극3특공유대학사업단운영실 운영실장 |
| hhlee3@uc.ac.kr | 울산과학대 | UC 사업단 | 5극3특공유대학사업단운영실 선임연구원 (이흔희) |
| hsbyun@uc.ac.kr | 울산과학대 | 교수 | 교무처 교무처장 (변홍석) |
| gylee@uc.ac.kr | 울산과학대 | 대학 담당자 | 교무팀(교육혁신지원팀) 행정 차장 (이귀영) |
| ihkwon@uc.ac.kr | 울산과학대 | 대학 담당자 | 교무팀(교육혁신지원팀) 행정 사원 (권익현) |

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

### GNI 공유대학 준비 (`/admin/gni`)
- **공문·메일**: UC 사업단이 공문·메일·회의를 등록·수정·삭제(요청 기한·붙임·사업단 메모 포함). 승인된 교직원은 조회.
- **일정**: 월간 달력(준비 일정 + 공문 요청 기한, `?m=YYYY-MM`)을 먼저 보이고, 아래에 단계별 목록.
- **의견수렴** (결정 사항 앞 단계): 사업단이 주제·요청 내용·마감일을 등록하면, 각 대학의 UC 사업단·대학 담당자가 **소속 대학 의견**을 입력·수정합니다. 다른 대학 의견은 참고용 조회만 가능하고, 교수는 조회만, 마감 후에는 수정 불가(RLS `private.can_respond`). 대학별 첨부파일은 주제마다 최대 3개, 파일당 10MB(비공개 버킷 `survey-files`, 형식·내용 보안 검사, 60초 서명 URL로 내려받기)이며 다른 대학 파일은 내려받기만 가능합니다. 주제는 결정 사항과 연결할 수 있습니다. 첫 주제: 나노디그리 개설(포함) 희망 교과목.

## 4. 다음 단계 (교육과정 확정 후)
- 대학별 회신 파일 업로드 (Supabase Storage)
- 성적평가 방식 확정 후 성적 입력 화면
- 학생지원 기준 확정 후 홈페이지 혜택 갱신
- 홍보자료 파일 업로드

### 추후 고려사항 — 대학별 운영 조직
- 운영 구성: 중심대학·참여대학 모두 **교무팀 관계자 2~3명**(대학별 부서 명칭은 다를 수 있음)과 **사업단**(대학에 따라 없을 수 있음)으로 운영합니다. 울산과학대학교는 중심대학이므로 교무팀 관계자 **4명**으로 시작합니다.
- 회원유형(현재): 관리자 송경영 · 중심대학 실무자 심현미, 이흔희(UC 사업단 역할) · 중심대학 교수 변홍석(교무처장, 사전 승인) · 참여대학(대학 담당자·교수).
- 검토 과제: 교무 이슈와 사업단 이슈를 분리해야 할 수 있습니다. 분리 시 `issues`에 담당 조직(교무/사업단) 구분 추가, 교무팀·사업단 소속 표시 또는 역할 세분화, 대학별 사업단 유무 설정, 대학별 RLS 범위 유지를 함께 검토합니다.

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

## 6. GitHub·Supabase·Vercel 연동과 배포

| 서비스 | 기존 운영 대상 |
|---|---|
| GitHub | `UC1973/gni-uc` · 계정 `UC1973` · 운영 브랜치 `main` |
| Supabase | GitHub `UC1973` 로그인 · `GNI-UC` 조직 (`aqgieoclveecopljvtuo`)의 `GNI-UC` · `qbjevtjeczecysbtridj` |
| Vercel | GitHub `UC1973` 연결 · scope `gni-uc`의 `gni-uc` (`prj_CXpjJJhxGjUxY2AutDeFDFj6fAgi`) · `https://gni-uc.org` |

작업 규칙은 [AGENTS.md](AGENTS.md)의 **GitHub·Supabase·Vercel 자동 연동 규칙**을 따릅니다. `CLAUDE.md`도 같은 규칙을 불러옵니다. 각 서비스의 인증은 독립적이므로 GitHub 계정을 전환한 뒤에도 Supabase project ref와 Vercel scope·Git 저장소 연결을 각각 확인합니다.

CLI와 MCP 플러그인의 인증도 별개입니다. 플러그인이 다른 계정에 연결되어 있으면 계정·대상이 검증된 CLI로 작업합니다. 로컬 연결 정보와 `.env.local`은 Git에서 제외하며, DB 설정 값은 출력하지 않습니다.

Supabase 프로젝트의 GitHub 저장소 연결은 `UC1973/gni-uc`, 작업 디렉터리는 `.`, 운영 브랜치는 `main`입니다. `Deploy to production`이 활성화되어 `main`에 병합하면 신규 마이그레이션이 운영 DB에 자동 반영됩니다. `Automatic branching`은 비활성 상태이며, 미리보기 DB 자동 생성은 별도로 요청받은 경우에 설정합니다.

기존 Supabase 계정을 연결하는 Vercel 외부 연동(`icfg_cyPC6HjRohDlNImFTUfT99kZ`)으로 Supabase `GNI-UC`와 Vercel `gni-uc`를 연결합니다. 접근 범위는 이 Vercel 프로젝트 한 개이며, DB 환경변수 동기화 대상은 Production, 공개 변수 접두사는 `NEXT_PUBLIC_`입니다. [Supabase 연결 설정](https://supabase.com/dashboard/project/qbjevtjeczecysbtridj/settings/integrations)과 [Vercel 연동 설정](https://vercel.com/gni-uc/~/integrations/supabase/icfg_cyPC6HjRohDlNImFTUfT99kZ)에서 확인할 수 있습니다.

앱이 사용하는 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`는 연동의 `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`와 일치해야 합니다. 키나 프로젝트 연결을 바꿀 때 이 값도 함께 검증합니다.

배포 요청 시 작업 브랜치를 push하고 `UC1973/gni-uc`의 PR을 생성한 뒤 검사를 확인하여 `main`에 병합합니다. Vercel은 운영 빌드를 만들고, 같은 `main` 커밋의 Supabase 운영 DB 배포 검사(`Supabase Preview`)가 성공하면 `gni-uc.org`를 새 빌드로 전환합니다. [Vercel Deployment Checks](https://vercel.com/gni-uc/gni-uc/settings/build-and-deployment#deployment-checks)에서 이 검사를 Production 필수 항목으로 설정합니다. 실패한 경우 기존 배포가 계속 서비스되며, 오류를 수정해 다시 배포합니다. 병합 커밋의 두 서비스 배포 결과와 운영 도메인 응답을 확인합니다.

앱의 DB 연결은 Vercel에 등록된 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 유지합니다. 운영 URL은 `https://qbjevtjeczecysbtridj.supabase.co`여야 합니다. 마이그레이션은 `supabase/migrations`에 새 파일로 추가하고 PR을 통해 `main`에 병합합니다. 운영 DB 적용 성공 여부는 Supabase 배포 로그와 원격 마이그레이션 이력으로 검증합니다.

자동 배포 설정 시 기존 마이그레이션 10개(`20261121000000`~`20261121000900`)의 실제 반영 상태를 대조하고, SQL을 재실행하지 않고 적용 이력만 등록했습니다. 등록 전후 업무 스키마와 테이블별 행 수가 동일하고, `supabase db push --remote=qbjevtjeczecysbtridj --dry-run --skip-vault`에서 실행 대기 마이그레이션이 없는 것을 확인했습니다.

# GNI-UC 산업AX전공 홈페이지 · 성과관리시스템

울산과학대학교 5극3특공유대학사업단(GNI-UC) — 미래모빌리티 트랙 산업AX전공

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
   - `supabase/seed.sql` — 11.20. 협의 자료 기준 초기 데이터
2. **Authentication → URL Configuration**
   - Site URL: 배포 주소 (예: `https://gni-uc.vercel.app`)
   - Redirect URLs: `https://gni-uc.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`
3. **Authentication → Emails → SMTP Settings** (인증 메일을 Resend로 보내기)
   - Host `smtp.resend.com` · Port `465` · User `resend` · Password = Resend API 키
   - Sender: Resend에서 인증한 도메인의 주소

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
| `ADMIN_NOTIFY_EMAILS` | 새 가입 신청 알림 받을 사업단 메일 (쉼표 구분) |
| `OPENAI_API_KEY` / `AI_MODEL` / `OPENAI_BASE_URL`(선택) | AI 기능 |

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

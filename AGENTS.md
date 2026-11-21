<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## GNI-UC 프로젝트

- 울산과학대학교 산업AX전공 학생용 홈페이지(`/`)와 참여대학 교직원 관리 시스템(`/admin`)을 운영한다. 운영 주소는 `gni-uc.org`다.
- Next.js 16 App Router와 Server Actions를 사용한다. 공개 페이지와 인증 화면은 `src/app`, 교직원 기능은 `src/app/admin`, 공통 UI는 `src/components`, 서비스 연동은 `src/lib`에서 관리한다.
- [README.md](README.md)에 로컬 설정, 배포, 가입·승인 절차, 역할별 권한, 운영 환경 정보가 있다. 변경하는 기능에 해당하는 절을 먼저 읽는다.

## 로컬 개발과 검증

- 새 체크아웃에서는 `npm ci`로 `package-lock.json`에 맞춰 설치하고 `npm run dev`로 실행한다. 환경변수 이름은 `.env.example`을 참고하고 실제 값은 `.env.local`에 보관한다. 환경변수 값은 로그나 커밋에 남기지 않는다.
- 로컬 실행도 `.env.local`에 지정된 Supabase를 사용한다. 가입·승인, 데이터 쓰기, 파일 업로드, 메일 발송의 검증은 개발용 프로젝트와 테스트 계정에서 한다. Supabase 설정 없이 공개 페이지의 기본 데이터와 관리 경로의 로그인 이동을 확인할 수 있다.
- 코드 변경 후 `npm run lint`와 `npm run build`를 실행한다. 회신 파일 검사 변경에는 `npm run test:scan`을, 권한 변경에는 개발용 DB에서 `supabase/tests/rls_check.sql`을 사용한다.

## 권한과 운영

- 교직원 권한 변경 시 서버의 인증·승인 확인(`src/lib/auth.ts`)과 Supabase RLS를 함께 확인한다. 대학별 접근 범위는 DB 정책에서도 유지한다. 스키마 변경은 `supabase/migrations`에 새 마이그레이션으로 추가한다.
- GitHub 연동으로 Vercel에 자동 배포된다. 운영 배포, 운영 DB 마이그레이션, 메일·인증 설정 반영은 해당 작업이 요청된 경우에 수행한다.

## Claude Code와 Codex 인수인계

- 공통 개발 지침은 이 파일에서 관리한다. Claude Code의 `CLAUDE.md`는 이 파일을 불러온다.
- 도구를 바꿔 작업할 때 현재 브랜치, `git status --short`, `git diff`, 최근 커밋을 먼저 확인한다. 이어받을 작업이 있다면 변경 내용, 검증 결과, 남은 작업을 함께 전달한다.

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
- GitHub 연동으로 Vercel에 자동 배포된다. 배포 요청은 아래의 GitHub·Supabase·Vercel 연동 규칙으로 처리한다. 운영 DB 마이그레이션, 메일·인증 설정 반영은 해당 작업이 요청된 경우에 수행한다.

## GitHub·Supabase·Vercel 자동 연동 규칙

이 프로젝트의 저장소 작업, DB 연동, 배포는 별도 대상 지정이 없으면 다음 기존 계정과 프로젝트를 사용한다. GitHub 저장소 이름과 Supabase·Vercel 로그인 계정/조직은 서로 다른 식별자이므로 실제 프로젝트 연결도 함께 확인한다.

| 서비스 | 기본 대상 |
|---|---|
| GitHub | 로그인 `UC1973`, 저장소 `UC1973/gni-uc`, 원격 `https://github.com/UC1973/gni-uc.git`, 운영 브랜치 `main` |
| Supabase | GitHub `UC1973`으로 로그인한 계정의 `GNI` 조직 (`aqgieoclveecopljvtuo`) → `GNI-UC`, project ref `qbjevtjeczecysbtridj` (도쿄) |
| Vercel | GitHub `UC1973`에 연결된 `gni-uc` scope (`team_zi1wPsWRFLlvC38S5w2nV6ML`) → `gni-uc` 프로젝트 (`prj_CXpjJJhxGjUxY2AutDeFDFj6fAgi`), Git 저장소 `UC1973/gni-uc`, 운영 도메인 `https://gni-uc.org` |

- 작업 전에 `git remote -v`, `gh api user --jq .login`, `gh repo view UC1973/gni-uc`로 원격과 계정을 확인한다. `UC1973`이 이미 인증되어 있으면 필요 시 `gh auth switch --hostname github.com --user UC1973`으로 전환한다. 커밋 작성자도 저장소 로컬 Git 설정에서 확인한다.
- Supabase는 MCP 또는 `supabase projects list`로 위 project ref에 대한 접근 권한을 확인한다. CLI 연결이 필요하면 해당 계정으로 인증된 상태에서 `supabase link --project-ref qbjevtjeczecysbtridj`을 사용한다. 원격 DB 명령은 설치된 CLI의 `--help`를 확인하고 대상을 명시한다(v3: `--remote=qbjevtjeczecysbtridj`).
- Vercel은 MCP 또는 `vercel project inspect gni-uc --scope gni-uc --non-interactive`로 scope·프로젝트·Git 저장소를 확인한다. 로컬 연결이 필요하면 확인된 기존 프로젝트에 `vercel link --project gni-uc --scope gni-uc`로 연결한다. `.vercel/project.json`의 조직/프로젝트 ID가 대상과 일치하는지 확인한다.
- 로그인 계정이 다르거나 위 프로젝트가 보이지 않으면 해당 서비스의 인증 문제를 알리고 올바른 계정 연결을 요청한다. 다른 계정의 동명 프로젝트로 대체하거나 새 프로젝트를 만들지 않는다. 이미 인증된 서비스에서 수행할 수 있는 요청 작업은 계속 진행한다.
- CLI와 MCP 플러그인의 인증은 별개다. MCP가 다른 계정에 연결되어 있으면 해당 MCP로 이 프로젝트를 변경하지 않고, 위 계정·프로젝트가 확인된 CLI를 사용한다. 로컬 Vercel 연결은 `.vercel/project.json`, Supabase 연결은 `supabase/.temp/project-ref`로 확인한다.
- DB 연결은 기존 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 재사용하며, 운영 URL의 project ref가 위 대상인지 확인한다. 로컬은 `.env.local`, 운영은 해당 Vercel 프로젝트의 환경변수로 관리하고 비밀값은 출력하거나 커밋하지 않는다. 개발용 DB 검증은 별도로 지정된 개발 프로젝트에서 수행한다.
- `push`, `gh pr`, `merge`, `deploy`를 함께 요청하면 검증 → 작업 브랜치 커밋 → `git push` → `gh pr create --repo UC1973/gni-uc --base main` → PR 검사 확인 → `gh pr merge --repo UC1973/gni-uc` → 운영 배포 확인까지 이어서 수행한다. 사용자가 일부 단계만 요청하거나 배포 보류를 지시하면 그 범위를 따른다. 이미 요청한 단계는 반복 승인을 요구하지 않는다.
- 배포는 `main` 병합에 따른 기존 Vercel Git 자동 배포를 우선한다. 같은 커밋에 `vercel --prod`를 추가 실행해 중복 배포하지 않는다. 자동 배포가 실행되지 않은 경우 원인을 확인하고, 요청 범위 안에서 확인된 프로젝트에만 수동 배포한다.
- 배포 완료는 병합된 커밋 SHA의 Vercel 성공 상태와 운영 도메인 응답을 함께 확인한 뒤 보고한다. DB 연동 변경이 있으면 대상 project ref와 읽기 요청도 확인한다. Git 병합만으로 DB 마이그레이션이 적용되었다고 간주하지 않고, 적용 결과를 별도로 검증한다.

## Claude Code와 Codex 인수인계

- 공통 개발 지침은 이 파일에서 관리한다. Claude Code의 `CLAUDE.md`는 이 파일을 불러온다.
- 도구를 바꿔 작업할 때 현재 브랜치, `git status --short`, `git diff`, 최근 커밋을 먼저 확인한다. 이어받을 작업이 있다면 변경 내용, 검증 결과, 남은 작업을 함께 전달한다.

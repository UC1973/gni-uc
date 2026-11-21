-- API 역할 권한 (최근 Supabase 프로젝트는 public 테이블 권한을 자동 부여하지 않음)
-- 실제로 어떤 행을 보고 바꿀 수 있는지는 RLS 정책이 결정합니다.

-- 비로그인(학생 홈페이지): 공개 테이블 조회만
grant select on public.universities, public.courses, public.notices, public.materials,
               public.site_settings, public.extra_programs to anon;

-- 로그인한 교직원: 테이블 사용 권한 (RLS로 범위 제한)
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- 가입 트리거는 Supabase Auth 역할이 실행
grant usage on schema private to supabase_auth_admin;
grant execute on function private.handle_new_user() to supabase_auth_admin;

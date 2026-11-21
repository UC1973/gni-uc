-- 보안 보강: 권한 확인 함수를 API에 노출되지 않는 private 스키마로 이동
-- (RLS 정책은 함수 OID로 참조하므로 그대로 동작합니다)

create schema if not exists private;
grant usage on schema private to anon, authenticated;

alter function public.my_profile()      set schema private;
alter function public.is_approved()     set schema private;
alter function public.is_hub()          set schema private;
alter function public.my_univ()         set schema private;
alter function public.handle_new_user() set schema private;

-- 가입 트리거 함수는 아무도 직접 호출할 수 없게
revoke execute on function private.handle_new_user() from public, anon, authenticated;

-- 행마다 auth.uid()를 다시 계산하지 않도록
drop policy "self read" on public.profiles;
create policy "self read" on public.profiles for select
  using (id = (select auth.uid()) or private.is_hub());

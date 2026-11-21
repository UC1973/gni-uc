-- 가입 승인 절차 보강: 사업단이 승인 화면에서 이메일 인증 여부를 볼 수 있도록
alter table public.profiles add column if not exists email_confirmed boolean not null default false;

update public.profiles p
   set email_confirmed = (u.email_confirmed_at is not null)
  from auth.users u
 where u.id = p.id;

create or replace function private.sync_email_confirmed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
     set email_confirmed = (new.email_confirmed_at is not null),
         email = new.email
   where id = new.id;
  return new;
end $$;

revoke execute on function private.sync_email_confirmed() from public, anon, authenticated;
grant execute on function private.sync_email_confirmed() to supabase_auth_admin;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update of email_confirmed_at, email on auth.users
  for each row execute function private.sync_email_confirmed();

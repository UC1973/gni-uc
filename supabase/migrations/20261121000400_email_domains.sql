-- 참여대학 이메일 도메인: 소속 대학 메일 주소로만 교직원 가입 허용
alter table public.universities add column if not exists email_domains text[] not null default '{}';

update public.universities set email_domains = array['uc.ac.kr']     where id = 'uc';
update public.universities set email_domains = array['kimhae.ac.kr'] where id = 'gh';
update public.universities set email_domains = array['dit.ac.kr']    where id = 'dy';
update public.universities set email_domains = array['yc.ac.kr']     where id = 'ya';
update public.universities set email_domains = array['klc.ac.kr']    where id = 'ke';

-- 이메일이 선택한 대학의 도메인(또는 그 하위 도메인)인지
create or replace function private.email_matches_university(p_email text, p_university_id text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
      from public.universities u, unnest(u.email_domains) d
     where u.id = p_university_id
       and (lower(split_part(p_email, '@', 2)) = lower(d)
            or lower(split_part(p_email, '@', 2)) like '%.' || lower(d))
  )
$$;

-- 가입 트리거: 앱을 거치지 않고 Auth API로 직접 가입해도 도메인 검사가 적용되도록
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_univ text := nullif(new.raw_user_meta_data->>'university_id', '');
begin
  if v_univ is null or not private.email_matches_university(new.email, v_univ) then
    raise exception 'GNIUC_EMAIL_DOMAIN: 소속 대학 이메일 주소로만 가입할 수 있습니다.'
      using errcode = 'P0001';
  end if;

  insert into public.profiles (id, email, name, university_id, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    v_univ,
    case when new.raw_user_meta_data->>'role' = 'professor' then 'professor'::public.user_role
         else 'univ_staff'::public.user_role end
  );
  return new;
end $$;

revoke execute on function private.email_matches_university(text, text) from public, anon, authenticated;
grant execute on function private.email_matches_university(text, text) to supabase_auth_admin;

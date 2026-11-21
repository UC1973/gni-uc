-- 변경 이력(감사 로그)
-- DB 트리거로 기록하므로 화면·API·SQL 어느 경로로 바꿔도 남습니다.
-- 기록은 추가만 가능(수정·삭제 불가), 조회는 UC 사업단만.

create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_id uuid,
  actor_name text,
  actor_email text,
  actor_university text,
  table_name text not null,
  row_key text,
  row_label text,
  action text not null check (action in ('insert', 'update', 'delete')),
  changes jsonb not null default '{}'::jsonb   -- {필드: {"from": 이전, "to": 이후}}
);
create index audit_log_at_idx on public.audit_log (at desc);
create index audit_log_table_idx on public.audit_log (table_name, at desc);
create index audit_log_actor_idx on public.audit_log (actor_id, at desc);

alter table public.audit_log enable row level security;
create policy "hub read" on public.audit_log for select using (private.is_hub());
grant select on public.audit_log to authenticated;
-- 추가·수정·삭제 권한은 누구에게도 주지 않음 (트리거만 기록)
revoke insert, update, delete, truncate on public.audit_log from anon, authenticated;

create or replace function private.audit_row()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  o jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  n jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  r jsonb := coalesce(n, o);
  diff jsonb := '{}'::jsonb;
  k text;
  p public.profiles;
  ignored text[] := array['updated_at', 'created_at', 'id'];
begin
  if tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(n) loop
      if not (k = any(ignored)) and (o -> k) is distinct from (n -> k) then
        diff := diff || jsonb_build_object(k, jsonb_build_object('from', o -> k, 'to', n -> k));
      end if;
    end loop;
    if diff = '{}'::jsonb then return null; end if;     -- 실제 변경 없음
  elsif tg_op = 'INSERT' then
    for k in select jsonb_object_keys(n) loop
      if not (k = any(ignored)) and n -> k <> 'null'::jsonb then
        diff := diff || jsonb_build_object(k, jsonb_build_object('to', n -> k));
      end if;
    end loop;
  else
    for k in select jsonb_object_keys(o) loop
      if not (k = any(ignored)) and o -> k <> 'null'::jsonb then
        diff := diff || jsonb_build_object(k, jsonb_build_object('from', o -> k));
      end if;
    end loop;
  end if;

  select * into p from public.profiles where id = auth.uid();

  insert into public.audit_log (actor_id, actor_name, actor_email, actor_university, table_name, row_key, row_label, action, changes)
  values (
    auth.uid(), p.name, p.email, p.university_id,
    tg_table_name,
    coalesce(r ->> 'id', r ->> 'key', r ->> 'university_id'),
    coalesce(r ->> 'name', r ->> 'title', r ->> 'file_name', r ->> 'email', r ->> 'key', r ->> 'university_id'),
    lower(tg_op),
    diff
  );
  return null;
end $$;
revoke execute on function private.audit_row() from public, anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['profiles', 'courses', 'issues', 'meetings', 'replies', 'reply_files', 'students',
                           'kpis', 'notices', 'materials', 'site_settings', 'universities',
                           'extra_programs', 'extra_demand']
  loop
    execute format('drop trigger if exists audit_%1$s on public.%1$I', t);
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$I
                    for each row execute function private.audit_row()', t);
  end loop;
end $$;

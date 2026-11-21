-- 변경 이력 보관기간 3년 (개인정보 처리방침 1항)
-- 매일 03:00(KST)에 3년이 지난 기록을 지우고, 지운 사실을 이력에 한 줄 남깁니다.

create extension if not exists pg_cron with schema pg_catalog;

create or replace function private.purge_audit_log(p_keep interval default interval '3 years')
returns integer language plpgsql security definer set search_path = public as $$
declare
  cutoff timestamptz := now() - p_keep;
  n integer;
begin
  delete from public.audit_log where at < cutoff;
  get diagnostics n = row_count;
  if n > 0 then
    insert into public.audit_log (table_name, row_label, action, changes)
    values ('audit_log', '보관기간 경과 기록 자동 파기', 'delete',
            jsonb_build_object('count', jsonb_build_object('from', n),
                               'before', jsonb_build_object('from', to_char(cutoff at time zone 'Asia/Seoul', 'YYYY-MM-DD HH24:MI'))));
  end if;
  return n;
end $$;
revoke execute on function private.purge_audit_log(interval) from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'purge-audit-log';
select cron.schedule('purge-audit-log', '0 18 * * *', $$select private.purge_audit_log()$$);   -- 18:00 UTC = 03:00 KST

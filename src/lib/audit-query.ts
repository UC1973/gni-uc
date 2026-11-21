import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AuditRow } from "@/lib/audit";

export type AuditFilter = { table?: string; action?: string; actor?: string; from?: string; to?: string };

export async function queryAudit(f: AuditFilter, range: [number, number]) {
  const supabase = await createClient();
  let q = supabase.from("audit_log").select("*", { count: "exact" }).order("at", { ascending: false }).range(range[0], range[1]);
  if (f.table) q = q.eq("table_name", f.table);
  if (f.action) q = q.eq("action", f.action);
  if (f.actor === "system") q = q.is("actor_id", null);
  else if (f.actor) q = q.eq("actor_id", f.actor);
  if (f.from) q = q.gte("at", `${f.from}T00:00:00+09:00`);
  if (f.to) q = q.lte("at", `${f.to}T23:59:59+09:00`);
  const { data, count, error } = await q;
  return { rows: (data ?? []) as AuditRow[], count: count ?? 0, error };
}

import { STATUS_LABEL, type ItemStatus } from "@/lib/types";

export function PageHead({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="phead">
      <h1>{title}</h1>
      {desc && <p>{desc}</p>}
    </div>
  );
}

export function StatusSelect({ name = "status", value, form }: { name?: string; value: ItemStatus; form?: string }) {
  return (
    <select name={name} form={form} defaultValue={value} aria-label="상태">
      {(["draft", "wip", "ok"] as ItemStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
    </select>
  );
}

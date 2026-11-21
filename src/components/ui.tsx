import type { ItemStatus } from "@/lib/types";
import { STATUS_LABEL } from "@/lib/types";

const CLS: Record<ItemStatus, string> = { ok: "st-ok", wip: "st-wip", draft: "st-draft" };

export function Badge({ status, label }: { status: ItemStatus; label?: string }) {
  return <span className={`st ${CLS[status]}`}>{label ?? STATUS_LABEL[status]}</span>;
}
export function Tag({ tone, children }: { tone: "ok" | "wip" | "draft" | "bad" | "info"; children: React.ReactNode }) {
  return <span className={`st st-${tone}`}>{children}</span>;
}
export function DegBadge({ degree }: { degree: "ND" | "MD" }) {
  return <span className={`st ${degree === "ND" ? "st-nd" : "st-md"}`}>{degree}</span>;
}
export function Logo({ sub = "5극3특 공유대학 · 울산과학대학교" }: { sub?: string }) {
  return (
    <>
      <span className="mark">GNI<br />UC</span>
      <span>GNI-UC 산업AX전공<small>{sub}</small></span>
    </>
  );
}

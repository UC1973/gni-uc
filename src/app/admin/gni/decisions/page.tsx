import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { PageHead } from "@/components/admin";
import { GNI_DECISIONS, type Decision } from "@/lib/gni-docs";
import { SOURCE_NOTE, SrcLink } from "../parts";

const AREAS: Decision["area"][] = ["교육과정", "수업운영", "학생", "학사", "비교과", "행정"];

export default async function GniDecisionsPage() {
  await requireStaff();
  return (
    <>
      <PageHead title="결정 필요 사항" desc={SOURCE_NOTE} />
      <div className="alert warn">
        <span>⚠️</span>
        <span>
          11.18 회의자료와 11.5 의견조회를 바탕으로 정리한 협의 대상입니다. 11.20 회의 결과는 받은 메일에 없어 반영하지 못했습니다.
          결정된 내용은 <Link href="/admin/issues" style={{ textDecoration: "underline" }}>협의·학사운영</Link>에 기록하세요.
        </span>
      </div>
      {AREAS.map((area) => {
        const list = GNI_DECISIONS.filter((d) => d.area === area);
        if (list.length === 0) return null;
        return (
          <div className="panel" key={area}>
            <h2>{area} <span className="aside">{list.length}건</span></h2>
            {list.map((d) => (
              <div className="issue" key={d.title}>
                <span className="cat">{area}</span>
                <div>
                  <b>{d.title}</b>
                  <ul style={{ paddingLeft: 18, margin: "6px 0", fontSize: 14 }}>
                    {d.options.map((o) => <li key={o}>{o}</li>)}
                  </ul>
                  <p>{d.basis}</p>
                </div>
                <SrcLink id={d.src} />
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

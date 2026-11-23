import { GniTabs } from "./GniTabs";

export default function GniLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="g-head">
        <div>
          <h1>GNI 공유대학 준비</h1>
          <p>경상국립대학교 주관 5극3특 공유대학 · 공문과 준비 사항</p>
        </div>
      </div>
      <GniTabs />
      {children}
    </>
  );
}

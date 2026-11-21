import Link from "next/link";
import { getPublicData } from "@/lib/public-data";
import { Badge, DegBadge, Logo, Tag } from "@/components/ui";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AxGraphic, Circuit } from "@/components/graphics";
import { TERMS, type ItemStatus } from "@/lib/types";

// 사업단이 관리 화면에서 바꾼 내용을 바로 보여주기 위해 요청마다 렌더링합니다.
export const dynamic = "force-dynamic";

export default async function Home() {
  const { universities, courses, notices, materials, settings } = await getPublicData();
  const total = courses.reduce((a, c) => a + c.credits, 0);
  const nd = courses.filter((c) => c.degree === "ND");
  const md = courses.filter((c) => c.degree === "MD");
  const quota = universities.reduce((a, u) => a + u.quota, 0);
  const deptCount = universities.reduce((a, u) => a + u.depts.length, 0);

  const benefits: [string, string, string, ItemStatus][] = [
    ["🎓", "다른 대학 수업도 내 학점으로", "참여대학 교과목을 들으면 소속 대학 학점으로 인정됩니다.", "ok"],
    ["📜", "ND·MD 이수 인정", "산업AX기초 ND, 산업AX실무 MD를 이수하면 디그리를 인정받습니다.", "ok"],
    ["🤖", "다섯 대학의 실습장비", "협동로봇·스마트공장 설비 등 참여대학 장비로 실습합니다.", "ok"],
    ["🏢", "기업 현직자와 함께", "기업 현직자가 수업에 참여하고, 현장 프로젝트형 교과를 운영합니다.", "wip"],
    ["🧾", "자격증·비교과 과정", "AICE, 스마트공장 기능사, 바이브 코딩 전문가 과정 (수요조사 중)", "wip"],
    ["💰", "학생 지원", "장학금 등 지원 기준·금액은 GNI 차원에서 협의 중입니다.", "draft"],
  ];

  return (
    <>
      {settings.notice_bar && <div className="notice-bar"><b>안내</b> · {settings.notice_bar}</div>}
      <header className="ph"><div className="wrap">
        <Link className="logo" href="/"><Logo /></Link>
        <nav>
          <a href="#about">소개</a><a href="#major">산업AX전공</a><a href="#curriculum">교육과정</a>
          <a href="#benefits">학생 혜택</a><a href="#apply">모집 안내</a><a href="#promo">홍보자료</a>
        </nav>
        <div className="right"><ThemeToggle /><Link className="btn btn-o btn-s" href="/login">교직원 로그인</Link></div>
      </div></header>

      <section className="hero"><Circuit /><div className="wrap">
        <div>
          <div className="kicker"><span>5극3특 공유대학</span><span>GNI 전문대학 트랙</span><span>미래모빌리티</span></div>
          <h1>5개 대학이 함께 키우는<br /><em>제조 AX 실무인재</em></h1>
          <p>우리 학교에 다니면서 다섯 대학의 교수진·교과목·실습장비로 산업AI, 자동화, 스마트공장을 배웁니다.</p>
          <div className="cta"><a className="btn btn-p" href="#curriculum">교육과정 보기 →</a><a className="btn btn-o" href="#apply">모집 안내</a></div>
        </div>
        <AxGraphic />
      </div></section>

      <div className="wrap">
        <div className="stats num">
          <div className="stat"><b>{universities.length}개</b><span>참여 전문대학</span></div>
          <div className="stat"><b>{deptCount}개</b><span>참여 학과</span></div>
          <div className="stat"><b>{courses.length}과목 {total}학점</b><span>ND + MD 편성안</span></div>
          <div className="stat"><b>{quota}명</b><span>2027 모집인원(안)</span></div>
        </div>

        <section className="sec" id="about">
          <div className="eyebrow">About</div>
          <h2>GNI-UC는 무엇인가요?</h2>
          <p className="lead"><b>GNI</b>는 경상국립대학교가 주관하는 5극3특 공유대학의 브랜드이고, <b>UC</b>는 울산과학대학교입니다. 울산과학대학교가 중심이 되어 전문대학 트랙인 <b>미래모빌리티 트랙 · 산업AX전공</b>을 운영합니다.</p>
          <div className="tree">
            <div className="node"><span className="lv">사업</span><b>5극3특 공유대학</b></div>
            <div className="node indent1"><span className="lv">공유대학</span><div><b>GNI 공유대학</b> <small>· 주관 경상국립대학교</small></div></div>
            <div className="indent2 sib">
              <div className="node"><span><b>일반대학 모델</b> <small>4개</small></span></div>
              <div className="node" style={{ opacity: 1 }}><span><b>전문대학 트랙</b> <small>2개</small></span></div>
            </div>
            <div className="indent3 sib">
              <div className="node me" style={{ opacity: 1 }}><div><b>GNI-UC · 울산과학대학교</b><br /><small>미래모빌리티 트랙 → <b style={{ color: "var(--blue)" }}>산업AX전공</b></small></div></div>
              <div className="node"><div><b>마산대학교 트랙</b></div></div>
            </div>
          </div>
          <div className="grid3" style={{ marginTop: 28 }}>
            <div className="card"><div className="ico">🏭</div><h3>산업 수요</h3><p>동남권 제조업의 AX 전환과 5극3특 성장엔진 육성에 필요한 현장 인재를 키웁니다.</p></div>
            <div className="card"><div className="ico">🔗</div><h3>교육자원 공유</h3><p>대학마다 흩어진 교수진·교과목·실습장비를 하나의 전공으로 연결합니다.</p></div>
            <div className="card"><div className="ico">🚀</div><h3>GNI 공유대학</h3><p>USG 공유대학 성과를 이어받아 더 넓은 권역 간 협력으로 확대합니다.</p></div>
          </div>
        </section>

        <section className="sec" id="major">
          <div className="eyebrow">Major</div>
          <h2>산업AX전공에서 기르는 역량</h2>
          <p className="lead">AI와 데이터로 제조 현장의 설비를 자동화하고, 실제 공장의 문제를 해결하는 실무 역량을 기릅니다.</p>
          <div className="grid3 comp">
            <div className="card"><div className="tagline">AI · DATA</div><h3>산업AI·데이터 기초</h3><ul><li>Python·전처리·분석</li><li>AI 기초 모델링</li><li>센서·네트워크 데이터 수집</li></ul></div>
            <div className="card"><div className="tagline">CONTROL · ROBOT</div><h3>제조설비 자동화</h3><ul><li>PLC·HMI</li><li>산업용 네트워크</li><li>협동로봇 운용</li></ul></div>
            <div className="card"><div className="tagline">FACTORY · PBL</div><h3>현장문제 해결</h3><ul><li>스마트공장 시스템 운용</li><li>PBL·캡스톤디자인 연계</li><li>생산·품질·설비·안전 문제</li></ul></div>
          </div>
          <div className="jobs"><b>진출 분야</b><span>스마트팩토리</span><span>생산자동화</span><span>설비보전</span><span>제조AX 직무</span></div>
        </section>

        <section className="sec" id="curriculum">
          <div className="eyebrow">Curriculum</div>
          <h2>교육과정 이수 로드맵</h2>
          <p className="lead">나노디그리(ND)와 마이크로디그리(MD)로 구성되며, 소속 대학 이수학점표에서 모두 선택학점으로 인정됩니다.</p>
          <div className="degrees">
            <div className="deg" style={{ background: "linear-gradient(135deg,#0B8798,#12B5C9)" }}><small>NANO DEGREE</small><b>산업AX기초 · {nd.reduce((a, c) => a + c.credits, 0)}학점</b><small>{nd.map((c) => c.name).join(" · ")}</small></div>
            <div className="deg" style={{ background: "linear-gradient(135deg,#1F55DB,#2F6BFF)" }}><small>MICRO DEGREE</small><b>산업AX실무 · {md.reduce((a, c) => a + c.credits, 0)}학점</b><small>{md.map((c) => c.name).join(" · ")}</small></div>
          </div>
          <div className="legend">상태 표시: <Badge status="ok" /> <Badge status="wip" /> <Badge status="draft" /> <span>· 학점은 (이론/실습/계)</span></div>
          <div className="road">
            {TERMS.map(([key, label]) => {
              const list = courses.filter((c) => c.term === key);
              return (
                <div className="term" key={key}>
                  <h4><span>{label}</span><span className="num">{list.reduce((a, c) => a + c.credits, 0)}학점</span></h4>
                  {list.map((c) => (
                    <div className="course" key={c.id} style={{ ["--c" as string]: c.degree === "ND" ? "var(--nd)" : "var(--md)" }}>
                      <div className="top"><DegBadge degree={c.degree} /><Badge status={c.status} /></div>
                      <b>{c.name}</b>
                      <div className="meta num"><span>{c.theory}/{c.practice}/{c.credits}학점</span><span>개설: {c.host}</span></div>
                      {c.note && <div className="note">※ {c.note}</div>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
          <div className="mode">
            <div><b>💻 비대면 수업 (기본)</b><p>공동 LMS와 실시간 화상수업으로, 대학 사이를 이동하지 않아도 됩니다.</p></div>
            <div><b>🔀 실습은 하이브리드</b><p>대면 실습과 실시간 비대면 수업을 과목 특성에 맞게 함께 운영합니다.</p></div>
            <div><b>🏫 필요 시 대면 집합교육</b><p>중심대학·참여대학의 실습장비를 활용해 학기 중 필요할 때 진행합니다.</p></div>
          </div>
        </section>

        <section className="sec" id="univs">
          <div className="eyebrow">Partners</div>
          <h2>함께하는 {universities.length}개 대학 · {deptCount}개 학과</h2>
          <p className="lead">아래 학과 학생이라면 소속 대학에서 산업AX전공에 참여할 수 있습니다.</p>
          <div className="univs">
            {universities.map((u) => (
              <div key={u.id} className={`univ ${u.is_hub ? "hub" : ""}`}>
                {u.is_hub && <Tag tone="info">중심대학</Tag>}
                <b style={{ marginTop: u.is_hub ? 6 : 0 }}>{u.name}</b>
                <ul>{u.depts.map((d) => <li key={d}>· {d}</li>)}</ul>
              </div>
            ))}
          </div>
        </section>

        <section className="sec" id="benefits">
          <div className="eyebrow">Benefits</div>
          <h2>학생 혜택</h2>
          <p className="lead">공유대학에 참여하는 학생에게 주어지는 혜택입니다. 일부 항목은 협의가 끝나면 확정됩니다.</p>
          <div className="grid3">
            {benefits.map(([ico, t, d, s]) => (
              <div className="card" key={t}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}><div className="ico">{ico}</div><Badge status={s} /></div>
                <h3>{t}</h3><p>{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="sec" id="apply">
          <div className="eyebrow">Apply</div>
          <h2>모집 안내 · 추진 일정</h2>
          <p className="lead">2027학년도 1학기부터 교육과정을 운영할 예정입니다.</p>
          <div className="timeline num">
            <div className="tl done"><time>2026.11.20</time><p>5개 대학 교육과정 운영 협의</p></div>
            <div className="tl next"><time>2026.12.02</time><p>대학별 교육과정 설치 결과 회신</p></div>
            <div className="tl"><time>2027.02</time><p>수강신청<br />(울산과학대 2.10.~2.12.)</p></div>
            <div className="tl"><time>2027-1학기</time><p>산업AX전공 교육과정 시작</p></div>
          </div>
          <div className="apply">
            <div className="card"><h3 style={{ marginTop: 0 }}>모집 개요 <Badge status="wip" /></h3>
              <dl className="kv num" style={{ marginTop: 12 }}>
                <dt>모집인원</dt><dd>총 {quota}명(안) — {universities.map((u) => `${u.short_name} ${u.quota}`).join(", ")}</dd>
                <dt>대상</dt><dd>{universities.length}개 대학 {deptCount}개 참여학과 학생 (2학년 편성)</dd>
                <dt>지원자격</dt><dd>타 대학 학점교류 신청 기준 평점평균 2.5 이상</dd>
                <dt>선발방법</dt><dd>성적순 또는 학과 추천 (협의 중)</dd>
              </dl>
            </div>
            <div className="card"><h3 style={{ marginTop: 0 }}>신청 방법 <Badge status="draft" /></h3>
              <p style={{ marginTop: 12 }}>소속 대학 수강신청 기간에 신청하면, 대학이 주관대학에 인원을 알려 학점교류로 연결됩니다. 세부 신청 경로는 확정 후 안내합니다.</p>
            </div>
          </div>
        </section>

        <section className="sec" id="promo">
          <div className="eyebrow">Media</div>
          <h2>홍보자료</h2>
          <p className="lead">학과 안내, 오리엔테이션, SNS에 자유롭게 활용하세요.</p>
          <div className="promo">
            <div className="video"><div className="play">▶</div><span>산업AX전공 소개 영상 (제작 예정)</span></div>
            <div>
              {materials.length === 0 && <div className="empty">홍보자료를 준비하고 있습니다.</div>}
              {materials.map((m) => (
                <div className="dl" key={m.id}>
                  <div className="ft" style={{ background: m.kind === "PDF" ? "var(--bad)" : "var(--navy-2)" }}>{m.kind}</div>
                  <div><b>{m.title}</b><small>{m.caption}</small></div>
                  {m.url ? <a className="btn btn-o btn-s" href={m.url} target="_blank" rel="noreferrer">보기</a> : <span className="btn btn-o btn-s" aria-disabled>준비 중</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="sec grid2" id="notice">
          <div><div className="eyebrow">Notice</div><h2>공지사항</h2>
            <ul className="nlist">
              {notices.length === 0 && <li className="muted">등록된 공지가 없습니다.</li>}
              {notices.map((n) => (
                <li key={n.id}><Tag tone="info">{n.category}</Tag>{n.title}<time>{n.created_at.slice(0, 10).replaceAll("-", ".")}</time></li>
              ))}
            </ul>
          </div>
          <div><div className="eyebrow">FAQ</div><h2>자주 묻는 질문</h2>
            <details><summary>우리 학과도 참여할 수 있나요?</summary><p>위 참여대학 소개에 나온 {deptCount}개 학과 학생이 대상입니다.</p></details>
            <details><summary>다른 대학까지 가서 수업을 들어야 하나요?</summary><p>수업은 비대면이 원칙이고, 실습과목만 하이브리드나 대면 집합교육으로 진행합니다.</p></details>
            <details><summary>ND와 MD는 무엇인가요?</summary><p>ND(나노디그리)는 8학점의 기초 과정, MD(마이크로디그리)는 12학점의 실무 과정입니다.</p></details>
            <details><summary>성적은 어떻게 매기나요?</summary><p>등급제와 S/U(충족/미충족) 중 참여대학이 협의하고 있으며, 확정되면 안내합니다.</p></details>
          </div>
        </section>
      </div>

      <footer className="pf"><div className="wrap">
        <div><b>울산과학대학교 5극3특공유대학사업단 (GNI-UC)</b><br />GNI 공유대학 · 주관 경상국립대학교</div>
        <div><Link href="/login" style={{ textDecoration: "underline" }}>교직원 로그인</Link> · <Link href="/signup" style={{ textDecoration: "underline" }}>교직원 가입 신청</Link></div>
      </div></footer>
    </>
  );
}

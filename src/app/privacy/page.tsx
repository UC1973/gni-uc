import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui";

export const metadata: Metadata = { title: "개인정보 처리방침" };

const EFFECTIVE = "2026년 11월 21일";

const ROWS: [string, string, string, string][] = [
  ["교직원 회원", "이름, 대학 이메일, 소속 대학, 역할, 비밀번호(암호화 저장)", "회원 확인, 가입 승인, 사업관리·성과관리 업무", "탈퇴 또는 권한 회수 후 1년"],
  ["참여 학생", "소속 대학·학과, 학번, 이름, 평점, 이수 상태", "공유대학 모집·선발, 학점교류, 이수 관리, 성과 보고", "사업 종료 후 5년 (성과 증빙)"],
  ["회신 서류", "대학별 교육과정 설치 공문, 교육과정표", "교육과정 설치 확인, 주관대학 제출", "사업 종료 후 5년"],
  ["변경 이력", "작업자 이름·이메일·소속, 일시, 변경 내용", "책임 추적, 보안 사고 대응, 감사", "3년"],
  ["접속 기록", "접속 일시, IP, 브라우저 정보 (서비스 제공사 로그)", "부정 이용 방지, 장애 대응", "최대 7일 (서비스 제공사 정책)"],
];

const VENDORS: [string, string, string][] = [
  ["Supabase Inc.", "데이터베이스·로그인·파일 보관", "일본(도쿄 리전)"],
  ["Vercel Inc.", "웹사이트 호스팅", "미국 등 (전 세계 CDN)"],
  ["Resend Inc.", "가입·승인·비밀번호 안내 메일 발송", "일본(도쿄 리전)"],
  ["AI 서비스 제공사", "사업단의 공지 초안·안건 정리 (학생 개인정보는 보내지 않음)", "미국"],
];

export default function PrivacyPage() {
  return (
    <>
      <header className="ph"><div className="wrap">
        <Link className="logo" href="/"><Logo /></Link>
        <div className="right"><Link className="btn btn-o btn-s" href="/">홈으로</Link></div>
      </div></header>
      <main className="wrap privacy">
        <h1>개인정보 처리방침</h1>
        <p className="muted">울산과학대학교 5극3특공유대학사업단(이하 “사업단”)은 GNI-UC 산업AX전공 홈페이지와 사업관리·성과관리시스템(gni-uc.org)을 운영하면서 「개인정보 보호법」에 따라 정보주체의 개인정보를 보호하고 관련 고충을 처리하기 위해 다음과 같이 처리방침을 둡니다.</p>
        <p className="small muted">시행일: {EFFECTIVE}</p>

        <h2>1. 처리하는 개인정보와 목적, 보유기간</h2>
        <p>학생용 홈페이지는 로그인 없이 이용하며 개인정보를 수집하지 않습니다. 교직원 시스템과 학생 관리에서 아래 정보를 처리합니다.</p>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>구분</th><th>항목</th><th>목적</th><th>보유기간</th></tr></thead>
            <tbody>{ROWS.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={i === 0 ? "" : "small"}>{i === 0 ? <b>{c}</b> : c}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <p className="small muted">보유기간이 지난 정보는 지체 없이 파기합니다. 다른 법령이나 사업 협약에서 더 긴 보존을 요구하는 경우에는 그 기간 동안 보관합니다.</p>

        <h2>2. 수집 방법</h2>
        <ul>
          <li>교직원: 홈페이지 가입 신청 화면에서 본인이 직접 입력합니다.</li>
          <li>학생: 참여대학이 소속 학생의 공유대학 참여 신청 결과를 입력합니다. 학생 본인의 수집·이용 동의는 각 참여대학의 수강신청·학점교류 절차에서 받습니다.</li>
        </ul>

        <h2>3. 제3자 제공</h2>
        <p>사업단은 개인정보를 목적 외로 이용하거나 제3자에게 제공하지 않습니다. 다만 공유대학 사업 수행을 위해 주관대학(경상국립대학교)과 소속 참여대학에 성과 보고·학점 인정에 필요한 범위에서 제공할 수 있으며, 법령에 근거가 있는 경우는 예외로 합니다.</p>

        <h2>4. 처리 위탁 및 국외 이전</h2>
        <p>안정적인 서비스 운영을 위해 아래 업체에 처리를 맡기고 있으며, 해당 업체의 서버가 국외에 있습니다.</p>
        <div style={{ overflowX: "auto" }}>
          <table>
            <thead><tr><th>업체</th><th>맡기는 업무</th><th>보관 위치</th></tr></thead>
            <tbody>{VENDORS.map((v) => <tr key={v[0]}><td><b>{v[0]}</b></td><td className="small">{v[1]}</td><td className="small">{v[2]}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="small muted">이전 방법: 서비스 이용 시 암호화된 네트워크(HTTPS)로 전송됩니다. 국외 이전을 원하지 않으면 가입하지 않거나 탈퇴할 수 있으며, 이 경우 교직원 시스템을 이용할 수 없습니다.</p>

        <h2>5. 파기 절차와 방법</h2>
        <ul>
          <li>보유기간이 끝나거나 목적을 달성한 정보는 매년 1회(2월) 일괄 점검해 파기합니다.</li>
          <li>전자 파일은 복구할 수 없는 방법으로 삭제하고, 백업본은 백업 보관기간(7일)이 지나면 자동으로 지워집니다.</li>
        </ul>

        <h2>6. 안전성 확보 조치</h2>
        <ul>
          <li>소속 대학 메일 인증과 사업단 승인을 거친 교직원만 접근하며, 대학별로 볼 수 있는 정보를 제한합니다.</li>
          <li>비밀번호는 암호화해 저장하고, 유출된 비밀번호 사용을 차단하며, 12시간 미사용 시 자동 로그아웃합니다.</li>
          <li>모든 통신을 암호화하고, 파일은 비공개 저장소에 보관해 60초짜리 일회성 링크로만 내려받을 수 있습니다.</li>
          <li>누가 언제 정보를 바꿨는지 변경 이력을 남기며, 이력은 수정·삭제할 수 없습니다.</li>
        </ul>

        <h2>7. 정보주체의 권리</h2>
        <p>정보주체는 언제든지 자신의 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다. 아래 담당자에게 메일로 요청하면 10일 이내에 처리 결과를 알려드립니다. 학생은 소속 대학 담당 부서를 통해서도 요청할 수 있습니다.</p>

        <h2>8. 개인정보 보호책임자</h2>
        <ul>
          <li>보호책임자: 울산과학대학교 5극3특공유대학사업단장</li>
          <li>연락처: <a href="mailto:kysong@uc.ac.kr">kysong@uc.ac.kr</a></li>
        </ul>
        <p className="small muted">개인정보 침해 신고·상담: 개인정보침해신고센터(privacy.kisa.or.kr, 국번없이 118), 개인정보분쟁조정위원회(kopico.go.kr, 1833-6972)</p>

        <h2>9. 처리방침의 변경</h2>
        <p>이 방침을 바꿀 때는 시행 7일 전에 홈페이지 공지사항으로 알립니다.</p>
      </main>
      <footer className="pf"><div className="wrap"><div><b>울산과학대학교 5극3특공유대학사업단 (GNI-UC)</b></div><div><Link href="/">홈</Link></div></div></footer>
    </>
  );
}

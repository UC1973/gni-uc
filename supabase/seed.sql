-- 초기 데이터 — 2026.11.20. 「GNI공유대학 산업AX전공 교육과정 운영 협의」 자료 기준
-- 교육과정은 확정 전이므로 상태를 (안)/협의 중으로 둡니다.

insert into public.universities (id, name, short_name, is_hub, depts, quota, sort) values
  ('uc', '울산과학대학교', '울산과학대', true,  array['기계공학부','전기전자공학부','조선해양시스템공학과'], 10, 1),
  ('gh', '김해대학교', '김해대', false, array['미래자동차과'], 5, 2),
  ('dy', '동의과학대학교', '동의과학대', false, array['전기자동차과'], 5, 3),
  ('ya', '연암공과대학교', '연암공대', false, array['전기전자공학과','스마트전기전자공학과','기계공학과','스마트기계공학과','스마트소프트웨어학과'], 5, 4),
  ('ke', '한국승강기대학교', '한국승강기대', false, array['승강기검사학과'], 5, 5)
on conflict (id) do nothing;

insert into public.replies (university_id) select id from public.universities on conflict do nothing;
update public.replies set enroll_period = '2027.02.10.~02.12.' where university_id = 'uc';

insert into public.courses (term, name, degree, theory, practice, credits, host, status, note, sort) values
  ('2-1', '자동제어실무',       'MD', 3, 0, 3, '울산과학대',   'draft', null, 1),
  ('2-1', '설비데이터수집분석', 'MD', 3, 0, 3, '참여대학 협의', 'wip',   null, 2),
  ('2-1', '산업IoT기초',        'ND', 3, 0, 3, '참여대학 협의', 'wip',   null, 3),
  ('2-2', '협동로봇운용',       'MD', 1, 2, 3, '울산과학대',   'draft', null, 4),
  ('2-2', '스마트공장설비관리', 'MD', 3, 0, 3, '참여대학 협의', 'wip',   null, 5),
  ('2-2', '제조데이터분석',     'ND', 1, 2, 3, '참여대학 협의', 'wip',   null, 6),
  ('동계', 'AI프로그래밍',      'ND', 1, 1, 2, '참여대학 협의', 'wip',   '교과목명 「AX프로그래밍」으로 변경 예정', 7);

insert into public.issues (category, title, detail, status) values
  ('학사', '교과목별 개설·운영대학 분담', '중심대학 개설 비율 50% 이하 원칙의 적용 기준 확인', 'wip'),
  ('학사', '성적평가 방식', '1안 등급제(상대평가 시 A+·A0 30% 이내) / 2안 S/U — 대학별 학칙 확인', 'wip'),
  ('학생', '학생지원 기준·금액', '경상국립대·부산대 논의로 결정 예정, 재원(출연금·보조금) 집행 기준 차이 확인', 'draft'),
  ('학생', '모집인원 배분·선발기준', '30명(안): 중심대학 10명 + 참여대학 각 5명 / 성적순 또는 학과 추천', 'wip'),
  ('학사', '수강신청 운영 경로', '학점교류 시스템 활용 여부, 대학 간 인원 공문 통보 절차', 'wip'),
  ('교과', 'AI프로그래밍 → AX프로그래밍 명칭 변경', '교과목코드·이수구분·학점 상호 확인과 함께 정리', 'wip'),
  ('교과', '공동개발 서식', '1안 공동 서식 / 2안 대학별 서식 + 강의계획서 통일', 'wip'),
  ('학사', '학사 협의체 구성', '교무처(유사 기관) 간 협의체 — 학사일정·평가·학점교류 공통 기준', 'draft'),
  ('협력', '수도권 대학 참여', '인하공전·연성대 — 교육과정 개발·비교과 중심 참여 검토', 'draft'),
  ('일정', '교육과정 설치 결과 회신', '12.02.(수)까지 신설(설치) 공문 + 교육과정표(교과목코드 포함)', 'wip');

insert into public.meetings (held_on, title, attendees, summary) values
  ('2026-11-20', 'GNI 산업AX전공 교육과정 운영 협의 (Zoom)', '5개 참여대학',
   '교육과정(ND·MD 7과목 20학점) 편성안, 공동 운영 원칙, 학생 모집·학점 인정, 후속 과제(12.02. 공문 회신) 협의');

insert into public.extra_programs (name, description, status, sort) values
  ('AICE 자격증 과정', 'AI 활용 능력 인증', 'draft', 1),
  ('스마트공장 기능사 자격증 과정', '설비·자동화 실무', 'draft', 2),
  ('바이브 코딩 전문가 과정', 'AI 기반 개발 실습', 'draft', 3);

insert into public.kpis (name, unit, status, sort) values
  ('ND·MD 이수자 수', '명', 'draft', 1),
  ('참여 학생 수', '명', 'draft', 2),
  ('공동 개설 교과목 수', '과목', 'draft', 3),
  ('참여 기업·현직자 수', '명', 'draft', 4),
  ('비교과 참여 학생 수', '명', 'draft', 5),
  ('학생 만족도', '점', 'draft', 6);

insert into public.notices (category, title, body, published) values
  ('협의', 'GNI 산업AX전공 교육과정 운영 협의 개최 결과',
   '2026년 11월 20일 5개 참여대학이 산업AX전공 교육과정 운영을 협의했습니다. 교육과정은 확정되는 대로 이 홈페이지에 안내합니다.', true);

insert into public.materials (kind, title, caption, published, sort) values
  ('PDF', '산업AX전공 학생 안내 리플릿', '제작 예정', true, 1),
  ('PDF', '교육과정 운영 협의 자료 (11.20.)', '발표자료', true, 2),
  ('PNG', '모집 포스터 · 카드뉴스', '제작 예정', true, 3);

insert into public.site_settings (key, value) values
  ('notice_bar', '교육과정은 참여대학이 협의하고 있습니다. 확정되면 이 페이지에 바로 반영됩니다. (2026.11.20. 협의안 기준)'),
  ('semester_start', '2027-03-02'),
  ('reply_deadline', '2026-12-02')
on conflict (key) do nothing;

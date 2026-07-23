// data.js - Single source of truth for D-immersion web app
// All mock data: team members, projects, papers, lab meetings.

const D = {};

// --- Team members -----------------------------------------------------
// 호동해 (supervisor), 서준형 (석사), 박인자 (석박통합),
// 유지현 (석박통합), 이지현 (학부), Negassi (박사)
// character: '감정 키워드 + 시바 캐릭터 모티프' — 작은 emoji sticker로 활용
D.team = [
  { id: "hodonghae",     name: "호동해",  alias: null,         role: "professor",  roleLabel: "Supervisor",  color: "#780000", character: "👨‍🚀", characterLabel: "우주비행사 시바" },
  { id: "seojunhyeong",  name: "서준형",  alias: "학생 1",    role: "ms",         roleLabel: "석사과정",   color: "#003049", character: "📚", characterLabel: "책가방 시바" },
  { id: "parkinja",      name: "박인자",  alias: "학생 2",    role: "integrated", roleLabel: "석박통합",   color: "#2a9d8f", character: "🦦", characterLabel: "분석 시바" },
  { id: "yujihyeon",     name: "유지현",  alias: "학생 3",    role: "integrated", roleLabel: "석박통합",   color: "#e76f51", character: "🎉", characterLabel: "축하 시바" },
  { id: "leejihyeon",    name: "이지현",  alias: "학생 4",    role: "undergrad",  roleLabel: "학부연구생", color: "#9a8c98", character: "🐣", characterLabel: "응원 시바" },
  { id: "negassi",       name: "Negassi", alias: "학생 5",   role: "phd",        roleLabel: "박사",       color: "#0077b6", character: "💪", characterLabel: "근력 시바" }
];

const teamById = (id) => D.team.find((m) => m.id === id);

// --- Projects (Liquid metal related, 3 projects) ----------------------
D.projects = [
  {
    id: "p_egain_pdms",
    name: "EGaIn/PDMS 열전도 복합체",
    short: "EGaIn/PDMS",
    description: "EGaIn과 PDMS 복합체의 열전도 특성 및 계면 제어 연구",
    color: "#780000",
    keywords: ["egain", "pdms", "thermal", "conduction", "composite", "열전도", "복합체", "galinstan", "liquid metal", "thermal conductivity"]
  },
  {
    id: "p_wearable_cool",
    name: "액체금속 웨어러블 냉각",
    short: "Wearable Cooling",
    description: "웨어러블 디바이스용 액체금속 기반 마이크로 채널 냉각 시스템",
    color: "#003049",
    keywords: ["wearable", "cooling", "microchannel", "액체금속", "냉각", "wearable device", "heat dissipation", "thermal management"]
  },
  {
    id: "p_4d_meta",
    name: "4D 프린팅 열메타물질",
    short: "4D Printing",
    description: "온도 자극에 의해 형상이 변하는 4D 프린팅 열메타물질 설계",
    color: "#2a9d8f",
    keywords: ["4d", "printing", "metamaterial", "4d printing", "shape memory", "열메타물질", "4d 프린팅", "stimuli", "responsive"]
  }
];

const projectById = (id) => D.projects.find((p) => p.id === id);

// --- AI auto-classify (keyword scoring) -------------------------------
D.classifyPaper = function (paper) {
  const text = (paper.title + " " + (paper.abstract || "") + " " + (paper.authors || "")).toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const proj of D.projects) {
    let score = 0;
    for (const kw of proj.keywords) {
      if (text.includes(kw.toLowerCase())) score += 1;
    }
    if (score > bestScore) { bestScore = score; best = proj; }
  }
  return best ? { projectId: best.id, confidence: Math.min(0.99, 0.55 + bestScore * 0.12) } : { projectId: D.projects[0].id, confidence: 0.4 };
};

// --- Papers (10 mock papers, distributed across 3 projects) ----------
const NOW = new Date("2026-07-23T21:00:00").getTime();
const days = (n) => NOW - n * 86400000;

D.papers = [
  // EGaIn/PDMS (4)
  {
    id: "paper_001",
    title: "High thermal conductivity EGaIn/PDMS composites for flexible electronics",
    authors: "Park J., Kim S., Lee H.",
    journal: "Nature Materials",
    year: 2025,
    doi: "10.1038/s41563-025-xxxxx",
    abstract: "We report EGaIn/PDMS composites with thermal conductivity up to 15 W/mK while maintaining stretchability over 200%.",
    savedAt: days(2),  updatedAt: days(1),
    readStatus: "reading", tags: ["composite", "thermal"], notes: "Section 3의 percolation threshold 부분이 우리 실험과 직접 비교 가능",
    projectId: "p_egain_pdms"
  },
  {
    id: "paper_002",
    title: "Interfacial oxide control in liquid metal polymer composites",
    authors: "Negassi T., Wang X., Hodonghae",
    journal: "Advanced Functional Materials",
    year: 2024,
    doi: "10.1002/adfm.20240xxxx",
    abstract: "Systematic study on Ga2O3 layer formation and its impact on thermal/mechanical coupling in EGaIn composites.",
    savedAt: days(5),  updatedAt: days(3),
    readStatus: "done", tags: ["interface", "oxide"], notes: "Methodology 그대로 차용 가능",
    projectId: "p_egain_pdms"
  },
  {
    id: "paper_003",
    title: "Galinstan-PDMS composites for soft thermal interface materials",
    authors: "Liu Y., Chen Z.",
    journal: "ACS Applied Materials & Interfaces",
    year: 2025,
    abstract: "Galinstan-filled PDMS as TIM with tunable viscosity and high compressibility.",
    savedAt: days(8),  updatedAt: days(8),
    readStatus: "unread", tags: ["TIM", "galinstan"], notes: "",
    projectId: "p_egain_pdms"
  },
  {
    id: "paper_004",
    title: "Thermal percolation in liquid metal elastomer networks",
    authors: "Kim D., Park S., Hodonghae",
    journal: "Science",
    year: 2026,
    abstract: "Theoretical framework for thermal percolation threshold in randomly distributed LM droplets.",
    savedAt: days(12), updatedAt: days(10),
    readStatus: "reading", tags: ["percolation", "theory"], notes: "Equation 4 적용해보기",
    projectId: "p_egain_pdms"
  },

  // Wearable cooling (3)
  {
    id: "paper_005",
    title: "Microchannel cooling using liquid metal for wearable electronics",
    authors: "Seo J., Park I., Lee J.",
    journal: "Nature Communications",
    year: 2024,
    abstract: "EGaIn-filled microchannels achieve 25 W/cm2 heat flux removal under bending.",
    savedAt: days(4), updatedAt: days(2),
    readStatus: "done", tags: ["microchannel", "wearable"], notes: "박인자 실험 채널 형상 그대로 차용",
    projectId: "p_wearable_cool"
  },
  {
    id: "paper_006",
    title: "Stretchable liquid metal heat spreaders for skin-mounted devices",
    authors: "Wang H., Zhang L.",
    journal: "Advanced Materials",
    year: 2025,
    abstract: "Liquid metal heat spreader maintains <5 K temperature rise at 1.5 W/cm2 over 50% strain.",
    savedAt: days(6), updatedAt: days(6),
    readStatus: "unread", tags: ["heat spreader", "stretchable"], notes: "",
    projectId: "p_wearable_cool"
  },
  {
    id: "paper_007",
    title: "Galn-based thermal management for continuous health monitoring patches",
    authors: "Yoo J., Hodonghae, Park I.",
    journal: "Energy & Environmental Science",
    year: 2025,
    abstract: "Long-term reliability of Galn microchannel coolers under skin contact for 30 days.",
    savedAt: days(15), updatedAt: days(11),
    readStatus: "unread", tags: ["health monitoring", "biocompat"], notes: "유지현 reliability 시험 설계 참고",
    projectId: "p_wearable_cool"
  },

  // 4D printing (3)
  {
    id: "paper_008",
    title: "4D printing of liquid metal elastomer composites with shape memory",
    authors: "Yujihyeon, Lee H., Hodonghae",
    journal: "Nature",
    year: 2026,
    abstract: "Demonstrates reversible bending in 3D-printed LM-elastomer composites under thermal cycling.",
    savedAt: days(1), updatedAt: days(0),
    readStatus: "reading", tags: ["shape memory", "4D"], notes: "Methodology part 2A 그대로",
    projectId: "p_4d_meta"
  },
  {
    id: "paper_009",
    title: "Stimuli-responsive thermal metamaterials via additive manufacturing",
    authors: "Chen X., Kim S.",
    journal: "Science Advances",
    year: 2024,
    abstract: "Additively manufactured metamaterial with temperature-tunable thermal conductivity anisotropy.",
    savedAt: days(9), updatedAt: days(9),
    readStatus: "unread", tags: ["metamaterial", "stimuli"], notes: "",
    projectId: "p_4d_meta"
  },
  {
    id: "paper_010",
    title: "Reversible 4D microstructures for adaptive thermal management",
    authors: "Park I., Negassi T., Hodonghae",
    journal: "Materials Horizons",
    year: 2025,
    abstract: "4D micro-lattice structures switch thermal conductivity by 4x between two states.",
    savedAt: days(18), updatedAt: days(13),
    readStatus: "done", tags: ["lattice", "switching"], notes: "이미지 figure 4 인용 가능",
    projectId: "p_4d_meta"
  }
];

// Apply AI classification for any paper missing projectId
for (const p of D.papers) {
  if (!p.projectId) {
    const c = D.classifyPaper(p);
    p.projectId = c.projectId;
    p.aiSuggestedProjectId = c.projectId;
    p.aiConfidence = c.confidence;
  } else {
    p.aiSuggestedProjectId = p.projectId;
    p.aiConfidence = 0.92;
  }
}

// --- Lab meetings (5 sessions: 4 past + 1 upcoming) -------------------
D.labMeetings = [
  // Upcoming
  {
    id: "lm_005",
    date: "2026-07-28",
    scheduledDay: "Mon",
    scheduledTime: "10:00",
    status: "scheduled",
    duration: 60,
    title: "Week 5 Lab Meeting",
    attendees: ["hodonghae", "seojunhyeong", "parkinja", "yujihyeon", "leejihyeon", "negassi"]
  },
  // Past
  {
    id: "lm_004",
    date: "2026-07-21",
    scheduledDay: "Mon",
    scheduledTime: "10:00",
    status: "completed",
    duration: 65,
    title: "Week 4 Lab Meeting",
    attendees: ["hodonghae", "seojunhyeong", "parkinja", "yujihyeon", "leejihyeon", "negassi"],
    transcript: [
      { speaker: "hodonghae",    t: "00:00", text: "자, 월요일 10시. 다들 커피는 들고 왔죠? (학생 4번이 고개를 끄덕) 좋아, 그럼 시작합니다. 오늘도 가볍게." },
      { speaker: "seojunhyeong", t: "00:25", text: "저는 아메리카노 두 잔째예요. 어제 새벽 4시까지 본딩 작업하다가 글루가 손에 굳어서 좀비 상태로 왔습니다." },
      { speaker: "hodonghae",    t: "00:50", text: "좀비도 측정값은 내야죠. 0.5 wt% 결과부터." },
      { speaker: "seojunhyeong", t: "01:05", text: "0.5 wt% EGaIn/PDMS 샘플 열전도도 7.2 W/mK 나왔습니다. 직전 0.3 wt% (5.1) 대비 41% 증가, 0.7 wt% 예상치(8.5)보다는 낮아서 percolation threshold 근처 같아요." },
      { speaker: "hodonghae",    t: "01:35", text: "좋아, 그럼 long-run stability 확인이 핵심이야. 100시간짜리 돌려놨어?" },
      { speaker: "seojunhyeong", t: "01:48", text: "네, 어제 18시부터 시작했고 지금 13시간째. ±0.02 W/mK 이내로 안정적입니다." },
      { speaker: "hodonghae",    t: "02:00", text: "200시간까지 가. 그 정도면 충분히 saturation 얘기할 수 있어. 그리고 0.7 wt% 샘플도 이번주 안에 만들어." },
      { speaker: "seojunhyeong", t: "02:15", text: "네, 금요일까지 PDMS base 10:1로 한 번 더 시도해볼게요. (작은 목소리로) 근데 0.7 wt%는 EGaIn 양이 많아서 curing이 잘 안 되던데..." },
      { speaker: "hodonghae",    t: "02:30", text: "그러면 mixing protocol 다시 봐. 30분 ultrasonic으로分散 좀 더 길게 가." },
      { speaker: "parkinja",     t: "02:50", text: "저는 microchannel 새로 fabrication 했습니다. 폭 200um에서 150um으로 줄였고, 이번에는 inlet manifold도 symmetric하게 다시 깎았어요." },
      { speaker: "hodonghae",    t: "03:10", text: "Pressure drop은?" },
      { speaker: "parkinja",     t: "03:15", text: "이전 대비 30% 증가했는데, 0.8 kPa 정도라서 wearable pump range 안에 있습니다." },
      { speaker: "hodonghae",    t: "03:30", text: "좋아. 이번주는 thermal resistance 측정해. cold plate 붙이고 heat flux 1~5 W/cm2 sweep. thermal contact conductance까지 같이 뽑아와." },
      { speaker: "parkinja",     t: "03:45", text: "네, 그럼 다음주에는 channel optimization으로 넘어가도 될까요?" },
      { speaker: "hodonghae",    t: "03:55", text: "baseline 먼저 확정이야. optimization은 Week 6부터." },
      { speaker: "yujihyeon",    t: "04:10", text: "저는 4D 프린팅 cyclic test 50회까지 돌렸습니다. 형상 recovery 96% 유지요." },
      { speaker: "hodonghae",    t: "04:25", text: "100회까지 가야 의미 있어. 그리고 SEM으로 50회 후 crack 같은 거 없는지 같이 봐. 형상 recovery는 macro만 말하면 안 돼, micro damage도 같이." },
      { speaker: "yujihyeon",    t: "04:40", text: "알겠습니다. SEM은 박인자学长 장비 빌려 쓸 수 있나요?" },
      { speaker: "parkinja",     t: "04:45", text: "수요일 오전 비어있어요. 그때 같이 가." },
      { speaker: "hodonghae",    t: "04:50", text: "좋아, 그럼 그 시간 맞춰서. 학생 4번은?" },
      { speaker: "leejihyeon",   t: "05:00", text: "저는... (살짝 긴장) 논문 리딩 3개 완료했습니다. EGaIn thermal contact, PDMS curing kinetics, LM elastomer review요. 그리고 다음주부터 박인자学长 실험 보조 시작합니다." },
      { speaker: "hodonghae",    t: "05:20", text: "좋아. 첫 보조라 낯설긴 하겠지만, channel cleaning부터 시작하면 금방 적응돼. 질문 생기면 부담 갖지 말고 바로 물어봐." },
      { speaker: "leejihyeon",   t: "05:30", text: "감사합니다. (작게) 근데 safety glasses 어디서 빌려요?" },
      { speaker: "parkinja",     t: "05:35", text: "(웃음) 내일 내가 하나 줄게." },
      { speaker: "negassi",      t: "05:45", text: "저는 지난주 interfacial oxide analysis paper draft v2 공유했습니다. 결과는 0.5 wt% threshold 근처에서 Ga2O3 shell이 200nm로 안정화, 그 이상 wt%에서는 crack이 생기는 패턴." },
      { speaker: "hodonghae",    t: "06:05", text: "Adv. Funct. Mater.에 보낼 수 있겠는데?" },
      { speaker: "negassi",      t: "06:15", text: "이번주 안에 co-authors한테 circulate하고, 다음주 회의 전 internal review 한 번 더 합니다." },
      { speaker: "hodonghae",    t: "06:25", text: "OK. 다들 이번주 action item 정리됐죠? (모두 고개 끄덕) 그럼 한 가지만 더." },
      { speaker: "hodonghae",    t: "06:35", text: "오늘 점심 뭐 먹을까요. 학생 1번이 평소 가던 그 김치찌개 집 아직 하냐." },
      { speaker: "seojunhyeong", t: "06:42", text: "(살짝 긴장했다가 풀리며) 네, 아직 합니다. 12시에 로비에서요?" },
      { speaker: "hodonghae",    t: "06:50", text: "좋아. 그럼 회의 끝. 다들 이번주 화이팅." }
    ],
    entries: [
      {
        memberId: "seojunhyeong",
        progress: 72,
        summary: "0.5 wt% EGaIn/PDMS 샘플의 열전도도가 7.2 W/mK로 측정됨. 0.3 wt%(5.1) 대비 41% 증가했고, percolation threshold가 0.5 wt% 근처에 있을 가능성이 높음.",
        highlights: [
          "0.5 wt% 샘플 hot disk 측정 완료 — 7.2 W/mK (0.3 wt% 대비 +41%)",
          "0.7 wt% 예상치(8.5 W/mK)보다 낮게 나와 percolation threshold가 0.5 wt% 부근으로 추정됨",
          "100h long-run stability test 진행 중 — 18시 시작, 13h 시점 ±0.02 W/mK 이내로 안정",
          "0.7 wt% 샘플은 EGaIn 함량이 높아 curing이 잘 안 되는 문제 확인"
        ],
        challenges: "0.7 wt% 조성에서 curing 불량 — 현재 mixing protocol로는 EGaIn이 균일하게 분산되지 않음.",
        nextSteps: [
          "100h long-run test를 200h까지 연장해 saturation 확정",
          "0.7 wt% 샘플, ultrasonic mixing 시간을 30분으로 늘려 재시도",
          "금요일까지 PDMS 10:1 base로 재제작"
        ],
        feedback: "long-run test는 200h까지 반드시 채워서 saturation을 그래프로 보여줄 것. 0.7 wt%는 mixing 시간을 늘려 다시 시도하고, 그래도 안 되면 dispersant 첨가 옵션도 고려해봐. 그리고 좀비 상태로 실험하지 말고 컨디션 관리도 신경 쓸 것 — 새벽 작업이 반복되면 측정 신뢰도에도 영향을 줄 수 있어."
      },
      {
        memberId: "parkinja",
        progress: 65,
        summary: "Microchannel을 200um → 150um 폭으로 재제작하고 inlet manifold도 symmetric으로 다시 설계함. 새 형상에서 pressure drop이 약 30% 증가한 0.8 kPa로 wearable pump range 안에 들어옴.",
        highlights: [
          "Microchannel 폭 200um → 150um으로 재설계, inlet manifold symmetric 구조로 변경",
          "Pressure drop 0.8 kPa (기존 대비 +30%) — wearable pump range 이내로 확인",
          "Fabrication cycle 약 6시간으로 안정화"
        ],
        challenges: "채널 폭을 줄이면서 pressure drop이 늘어나 pump 스펙과의 여유가 줄어듦.",
        nextSteps: [
          "Cold plate 부착 후 heat flux 1~5 W/cm2 sweep으로 thermal resistance 측정",
          "동일 실험에서 thermal contact conductance 산출",
          "Baseline 확정 전까지 channel optimization 보류"
        ],
        feedback: "이번주는 thermal resistance + thermal contact conductance를 함께 뽑아서 baseline을 확정하는 데 집중해. Optimization은 baseline이 나온 뒤 Week 6부터. 수요일 오전 SEM 장비는 유지현이랑 시간 맞춰서 같이 쓰고, safety glasses도 이지현한테 챙겨줄 것."
      },
      {
        memberId: "yujihyeon",
        progress: 58,
        summary: "4D 프린팅 시편에 대해 cyclic thermal test 50회 진행. 형상 recovery 96% 유지. 거시적 회복률은 양호하지만 micro-scale damage는 SEM으로 확인이 필요한 상태.",
        highlights: [
          "4D 프린팅 cyclic thermal test 50회 완료, 형상 recovery 96% 유지",
          "Printer calibration ±10um 이내로 안정화된 상태 유지"
        ],
        challenges: "Macro 형상 회복률은 양호하지만 micro-scale damage(crack 등) 여부는 아직 미확인.",
        nextSteps: [
          "Cyclic test 100회까지 연장",
          "50회 시점 시편 cross-section SEM 촬영 (수요일 오전, 박인자 장비 공유)"
        ],
        feedback: "100회까지 반드시 채우고, SEM으로 micro damage를 정량화해서 함께 보고할 것 — macro 회복률만으로는 불충분해. 박인자 microchannel 장비 수요일 오전 시간대 맞춰서 같이 진행하고, crack 개수/길이 기준으로 damage index를 정의해봐."
      },
      {
        memberId: "leejihyeon",
        progress: 30,
        summary: "논문 3편 (EGaIn thermal contact / PDMS curing kinetics / LM elastomer review) reading report 제출. Lab safety training 완료, 박인자 microchannel 실험 보조 시작 준비됨.",
        highlights: [
          "논문 3편 reading report 제출 (EGaIn thermal contact / PDMS curing kinetics / LM elastomer review)",
          "Lab safety training 완료",
          "박인자 microchannel 실험 보조 시작 준비 완료"
        ],
        challenges: "아직 직접 손으로 실험한 경험이 없어 실습 데뷔가 필요한 시점.",
        nextSteps: [
          "이번주부터 박인자 보조 시작, channel cleaning부터 익히기",
          "observe + log 작성에 집중"
        ],
        feedback: "채널 클리닝부터 시작해서 천천히 적응하면 돼. 질문 생기면 부담 갖지 말고 바로 물어볼 것. Safety glasses는 박인자가 내일 전달. 4주차까지는 관찰과 기록 위주로 가고, 5주차부터 직접 공정 일부를 맡아볼 것."
      },
      {
        memberId: "negassi",
        progress: 88,
        summary: "Interfacial oxide 분석 paper draft v2 작성 완료. 0.5 wt% threshold 근처에서 Ga2O3 shell이 약 200nm 두께로 안정화되고, 그 이상의 wt%에서는 shell에 micro crack이 생기는 경향을 정량 데이터로 확인함.",
        highlights: [
          "Interfacial oxide 분석 paper draft v2 작성 완료",
          "0.5 wt% threshold 근처에서 Ga2O3 shell 약 200nm로 안정화되는 경향 확인",
          "그 이상 wt%에서는 shell에 micro crack 발생 경향을 정량 데이터로 확인",
          "draft v1(2-3주차) 대비 figure 4개 추가"
        ],
        challenges: "Co-author 리뷰 전, 데이터 해석에 대한 internal 검증이 아직 남아있음.",
        nextSteps: [
          "이번주 안에 co-authors(hodonghae, wang x.)에게 draft circulate",
          "다음주 회의 전 internal review 한 번 더"
        ],
        feedback: "Adv. Funct. Mater.에 투고할 수준으로 보여. Co-author 코멘트 받은 뒤 internal review까지 마치고 다음 회의에서 submission 여부를 논의하자. 서준형의 0.7 wt% curing 이슈와 crack 데이터가 연결될 수 있으니 같이 논의해봐도 좋겠다."
      }
    ]
  },
  {
    id: "lm_003",
    date: "2026-07-14",
    scheduledDay: "Mon",
    scheduledTime: "10:00",
    status: "completed",
    duration: 55,
    title: "Week 3 Lab Meeting",
    attendees: ["hodonghae", "seojunhyeong", "parkinja", "yujihyeon", "leejihyeon", "negassi"],
    entries: [
      {
        memberId: "seojunhyeong",
        progress: 55,
        summary: "0.3 wt% EGaIn/PDMS 샘플 5개 batch에 대해 hot disk 측정. 평균 5.1 W/mK (σ=0.18). PDMS 10:1 base의 baseline(0.18 W/mK) 대비 약 28배 향상.",
        highlights: [
          "0.3 wt% 샘플 5개 batch hot disk 측정 완료 — 평균 5.1 W/mK (σ=0.18)",
          "PDMS 10:1 base baseline(0.18 W/mK) 대비 약 28배 향상 확인",
          "Curing cycle 60°C × 4h로 표준화"
        ],
        challenges: "Batch 간 편차(σ=0.18)가 있어 추가 반복 측정이 필요한 상태.",
        nextSteps: [
          "0.5 wt% 샘플 이번주 안에 fabrication",
          "다음주 측정 진행"
        ],
        feedback: "28배 향상은 좋은 시작점. wt%를 더 올려서 trend를 확인하고, batch 편차는 mixing 균질성을 체크하면서 줄여나가자."
      },
      {
        memberId: "parkinja",
        progress: 48,
        summary: "Microchannel 1차 설계안 도출. 폭 200um, 깊이 300um, length 50mm. CAD + flow simulation (COMSOL) 완료. Reynolds number ~250, laminar regime 유지 예상.",
        highlights: [
          "Microchannel 1차 설계안 확정 (폭 200um, 깊이 300um, length 50mm)",
          "CAD + flow simulation(COMSOL) 완료, Reynolds number ~250 (laminar 유지 예상)"
        ],
        challenges: "Simulation 상 laminar가 유지되지만 실제 fabrication 시 pressure drop 오차 가능성이 있음.",
        nextSteps: [
          "150um 변형안 시뮬레이션 비교",
          "Master mold fabrication 시작"
        ],
        feedback: "150um 안도 같이 시뮬 돌려서 pressure drop을 비교해봐. Mold fabrication은 바로 시작해도 좋을 것 같다."
      },
      {
        memberId: "yujihyeon",
        progress: 42,
        summary: "4D printing용 DLP printer calibration 완료. XY resolution 50um, Z step 25um. LM-elastomer resin의 viscosity profile 측정 (shear rate 0.1-100 s⁻¹).",
        highlights: [
          "4D printing용 DLP printer calibration 완료 (XY resolution 50um, Z step 25um)",
          "LM-elastomer resin viscosity profile 측정 (shear rate 0.1-100 s⁻¹)"
        ],
        challenges: "Calibration이 예상보다 오래 걸려 cyclic test 시작이 늦어짐.",
        nextSteps: [
          "Cyclic test 시작, 10회 단위로 형상 recovery 정량화",
          "50회까지 데이터 누적"
        ],
        feedback: "Calibration을 잘 끝냈으니 이제 cyclic test 데이터를 빠르게 쌓아가자. 10회 단위로 끊어서 recovery 추이를 보여줘."
      },
      {
        memberId: "leejihyeon",
        progress: 22,
        summary: "Reading list 5개 논문 선정 완료 (각 프로젝트별 1-2편). 각 논문 1-page reading note 작성 시작. Lab orientation + safety training 통과.",
        highlights: [
          "Reading list 5개 논문 선정 완료 (프로젝트별 1-2편)",
          "각 논문 1-page reading note 작성 착수",
          "Lab orientation + safety training 통과"
        ],
        challenges: "실험실 실습 경험이 아직 없어 다음 단계(실험 보조) 전환이 걱정되는 상태.",
        nextSteps: [
          "이번주 내 reading note 3개 마무리",
          "다음주부터 박인자 microchannel 보조 시작 준비"
        ],
        feedback: "Reading note 잘 진행되고 있어. 다음주 실험 보조 시작 전에 안전 수칙 한 번 더 리마인드하고 시작하자."
      },
      {
        memberId: "negassi",
        progress: 45,
        summary: "Ga2O3 shell 두께의 wt% 의존성 데이터 확보. 0.5 wt% 근처에서 shell이 약 200nm로 안정화되는 경향을 처음 확인했고, 0.7 wt% 시편에서는 미세 crack 흔적을 관측함.",
        highlights: [
          "0.1 / 0.3 / 0.5 / 0.7 wt% 4개 조성에 대해 XPS depth profiling 완료",
          "0.5 wt% 부근에서 shell 두께가 약 200nm로 saturation 되는 경향 확인",
          "0.7 wt% 샘플 shell 표면에서 미세 crack 흔적 최초 관측 (SEM)",
          "Draft v1 초안 작성 착수 (introduction + methods)"
        ],
        challenges: "0.7 wt% crack의 원인이 curing 조건 때문인지 shell 자체 특성 때문인지 아직 구분되지 않음.",
        nextSteps: [
          "Draft v1 results/discussion 섹션 작성",
          "0.7 wt% crack 샘플 cross-section SEM으로 추가 확인"
        ],
        feedback: "Crack 원인 규명이 이 논문의 핵심 novelty가 될 수 있어. 서준형의 0.7 wt% curing 이슈랑 연결지어 같이 논의해봐. Draft v1은 이번 데이터로 빠르게 초안을 완성해서 다음 회의 전에 공유해줘."
      }
    ]
  },
  {
    id: "lm_002",
    date: "2026-07-07",
    scheduledDay: "Mon",
    scheduledTime: "10:00",
    status: "completed",
    duration: 50,
    title: "Week 2 Lab Meeting",
    attendees: ["hodonghae", "seojunhyeong", "parkinja", "yujihyeon", "leejihyeon", "negassi"],
    entries: [
      {
        memberId: "seojunhyeong",
        progress: 38,
        summary: "PDMS base formulation 비교 실험 완료 (5:1, 10:1, 15:1). Mechanical stretchability vs viscosity trade-off 확인. 10:1이 baseline으로 적합.",
        highlights: [
          "PDMS base formulation 비교 실험 완료 (5:1 / 10:1 / 15:1)",
          "10:1이 baseline으로 적합 확인 (cure 60°C × 4h, viscosity ~3500 cP)"
        ],
        challenges: "Mechanical stretchability와 viscosity 사이 trade-off로 최적 비율 선정에 고민이 필요했음.",
        nextSteps: [
          "EGaIn mixing 비율 실험 시작 (0.1 / 0.3 / 0.5 wt%)"
        ],
        feedback: "10:1 baseline 결정 잘했어. 이제 EGaIn 비율을 낮은 값부터 sweep해서 trend를 먼저 잡아봐."
      },
      {
        memberId: "parkinja",
        progress: 32,
        summary: "Microchannel CAD 초안 3개 (직선형 / serpentine / tree). 이전 프로젝트 자료 handover 받음. Soft lithography용 SU-8 master 작업 시작.",
        highlights: [
          "Microchannel CAD 초안 3개 완성 (직선형 / serpentine / tree)",
          "Soft lithography용 SU-8 master 작업 착수"
        ],
        challenges: "3가지 topology 각각 장단점이 뚜렷해 하나로 좁히기 어려움.",
        nextSteps: [
          "Wearable 적용 형상(10cm × 5cm 이내)으로 refine",
          "3개 중 하나 선정"
        ],
        feedback: "형상 크기 제약부터 먼저 적용해서 topology를 좁혀봐. 그러면 선택이 더 쉬워질 거야."
      },
      {
        memberId: "yujihyeon",
        progress: 25,
        summary: "4D printing literature review 18편 정리. Shape memory polymer + LM composite 관련 핵심 그룹 5곳 파악. Printer 환경 셋업 진행 중.",
        highlights: [
          "4D printing literature review 18편 정리, 핵심 그룹 5곳 파악",
          "Printer 환경 셋업 진행 (UV intensity, build platform level)"
        ],
        challenges: "환경 셋업이 예상보다 오래 걸려 calibration 일정이 지연되고 있음.",
        nextSteps: [
          "Printer 환경 구축 마무리",
          "다음주 calibration 진행"
        ],
        feedback: "환경 셋업 이번주에 마무리 짓고 calibration으로 넘어가자. 지연되면 미리 얘기해줘."
      },
      {
        memberId: "leejihyeon",
        progress: 10,
        summary: "Lab 합류 첫주. Safety training + chemical hygiene training 이수. Reading list 후보 10개 추리고 우선순위 매김.",
        highlights: [
          "Safety training + chemical hygiene training 이수",
          "Reading list 후보 10개 추리고 우선순위 매김",
          "멘토(서준형)와 첫 주간 미팅 진행"
        ],
        challenges: "논문 난이도 편차가 커서 우선순위 판단이 아직 서툰 단계.",
        nextSteps: [
          "Reading list 5개로 좁히기",
          "각 논문 1-2 page reading note 템플릿 작성"
        ],
        feedback: "10개 중 프로젝트별로 1-2편씩 골라서 5개로 좁혀봐. Reading note 템플릿은 서준형이랑 같이 만들어도 좋아."
      },
      {
        memberId: "negassi",
        progress: 20,
        summary: "Interfacial oxide 형성 메커니즘 문헌조사 및 예비 실험 착수. Ga2O3 shell 두께를 XPS로 측정하는 protocol을 셋업함.",
        highlights: [
          "EGaIn 표면 산화막 관련 논문 12편 review, 계면 제어 관련 그룹 3곳 focus 대상 선정",
          "XPS depth profiling protocol 초안 확립 (sputter rate calibration 포함)",
          "0.3 / 0.5 wt% 샘플에서 예비 XPS 측정 시작"
        ],
        challenges: "XPS 장비 예약이 몰려 있어 측정 slot 확보가 어려움.",
        nextSteps: [
          "0.3 / 0.7 wt% 샘플 추가 XPS 측정",
          "Draft v1 outline 작성 시작"
        ],
        feedback: "XPS 장비 slot은 미리 2주치를 한 번에 예약해둘 것. Draft outline은 이번 결과 위주로 가볍게 시작해도 좋음."
      }
    ]
  },
  {
    id: "lm_001",
    date: "2026-06-30",
    scheduledDay: "Mon",
    scheduledTime: "10:00",
    status: "completed",
    duration: 45,
    title: "Week 1 Lab Meeting (Kickoff)",
    attendees: ["hodonghae", "seojunhyeong", "parkinja", "yujihyeon", "leejihyeon"],
    entries: [
      {
        memberId: "seojunhyeong",
        progress: 18,
        summary: "학기 시작. 지난 학기 논문 5편 (EGaIn 열전도 baseline, PDMS mechanical, LM thermal interface) 리딩. 이번 학기 방향성: EGaIn/PDMS wt% sweep + long-run stability.",
        highlights: [
          "학기 시작, 지난 학기 논문 5편 리딩 완료 (EGaIn 열전도 baseline / PDMS mechanical / LM thermal interface)",
          "이번 학기 연구 방향 확정: EGaIn/PDMS wt% sweep + long-run stability"
        ],
        challenges: "PDMS base 비율에 따른 mechanical-viscosity trade-off를 아직 정량적으로 파악하지 못함.",
        nextSteps: [
          "PDMS formulation 결정 (5:1, 10:1, 15:1 비교)",
          "Hot disk 측정 protocol 정리"
        ],
        feedback: "Formulation 비교부터 빠르게 끝내고 EGaIn 비율 sweep으로 넘어갈 수 있게 준비해. Hot disk 측정은 이번 학기 내내 쓸 도구니까 protocol을 문서로 정리해둬."
      },
      {
        memberId: "parkinja",
        progress: 15,
        summary: "이전 microchannel 프로젝트 (5G module cooling) handover 완료. CAD file + fabrication recipe + test data 정리. Wearable 방향 신규 설계 시작.",
        highlights: [
          "이전 microchannel 프로젝트(5G module cooling) handover 완료 — CAD file, fabrication recipe, test data 정리",
          "Wearable 방향 신규 설계 착수"
        ],
        challenges: "5G 모듈용 채널 설계를 그대로 wearable에 쓰기엔 form factor 차이가 큼.",
        nextSteps: [
          "직선형 / serpentine / tree topology 3안 검토"
        ],
        feedback: "이전 프로젝트 자산은 fabrication recipe 위주로만 재사용하고, 형상은 wearable form factor(10cm × 5cm 이내)에 맞춰 처음부터 다시 설계할 것."
      },
      {
        memberId: "yujihyeon",
        progress: 12,
        summary: "복학 후 첫 lab meeting. 지난 학기 4D printing + LM 관련 12편 리뷰. 형상 memory + thermal switch 가능성 focus.",
        highlights: [
          "복학 후 첫 lab meeting 참석",
          "지난 학기 4D printing + LM 관련 12편 리뷰 완료"
        ],
        challenges: "복학 공백기 동안 최신 문헌 follow-up이 필요한 상태.",
        nextSteps: [
          "4D printing reference 추가 확보",
          "Printer 환경 셋업 우선 진행"
        ],
        feedback: "형상기억 + thermal switch 방향은 좋아. Printer 셋업부터 빨리 끝내서 실제 프린팅 데이터를 다음 미팅 전에 볼 수 있게 하자."
      },
      {
        memberId: "leejihyeon",
        progress: 5,
        summary: "신입 학부연구생 합류. OT (orientation training) + 멘티 배정 (서준형). 첫 safety training 일정 잡힘.",
        highlights: [
          "신입 학부연구생으로 lab 합류",
          "OT(orientation training) 진행, 멘토(서준형) 배정"
        ],
        challenges: "실험실 경험이 전무해 안전 교육부터 필요한 단계.",
        nextSteps: [
          "이번주 safety training 이수",
          "다음주부터 reading 시작"
        ],
        feedback: "처음이니까 서두르지 말고 safety training부터 확실히 끝내자. 멘토인 서준형한테 편하게 질문하고, reading은 다음주부터 천천히."
      }
    ]
  }
];

// --- Notification schedule state --------------------------------------
// Single scheduled lab meeting reminder. Persisted via appStorage (BaaS).
D.defaultSchedule = {
  day: "Mon",
  time: "10:00",
  enabled: true
};

if (typeof window !== "undefined") {
  window.D = D;
  window.teamById = teamById;
  window.projectById = projectById;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = { D, teamById, projectById };
}

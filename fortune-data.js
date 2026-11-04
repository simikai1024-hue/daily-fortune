/**
 * 월하다원 (月下茶園) — 간지·띠·별자리 계산 및 수묵 타로 22장 데이터
 */

const HEAVENLY_STEMS = [
  { ko: "갑", hanja: "甲", element: "목(木)", colorName: "푸른", polarity: "양" },
  { ko: "을", hanja: "乙", element: "목(木)", colorName: "푸른", polarity: "음" },
  { ko: "병", hanja: "丙", element: "화(火)", colorName: "붉은", polarity: "양" },
  { ko: "정", hanja: "丁", element: "화(火)", colorName: "붉은", polarity: "음" },
  { ko: "무", hanja: "戊", element: "토(土)", colorName: "황금", polarity: "양" },
  { ko: "기", hanja: "己", element: "토(土)", colorName: "황금", polarity: "음" },
  { ko: "경", hanja: "庚", element: "금(金)", colorName: "하얀", polarity: "양" },
  { ko: "신", hanja: "辛", element: "금(金)", colorName: "하얀", polarity: "음" },
  { ko: "임", hanja: "壬", element: "수(水)", colorName: "검은", polarity: "양" },
  { ko: "계", hanja: "癸", element: "수(水)", colorName: "검은", polarity: "음" },
];

const CHINESE_ZODIAC = [
  { id: "rat", branch: "자", hanja: "子", animal: "쥐", label: "쥐띠", emoji: "🐭", yearsHint: "48·60·72·84·96·08" },
  { id: "ox", branch: "축", hanja: "丑", animal: "소", label: "소띠", emoji: "🐮", yearsHint: "49·61·73·85·97·09" },
  { id: "tiger", branch: "인", hanja: "寅", animal: "호랑이", label: "호랑이띠", emoji: "🐯", yearsHint: "50·62·74·86·98·10" },
  { id: "rabbit", branch: "묘", hanja: "卯", animal: "토끼", label: "토끼띠", emoji: "🐰", yearsHint: "51·63·75·87·99·11" },
  { id: "dragon", branch: "진", hanja: "辰", animal: "용", label: "용띠", emoji: "🐉", yearsHint: "52·64·76·88·00·12" },
  { id: "snake", branch: "사", hanja: "巳", animal: "뱀", label: "뱀띠", emoji: "🐍", yearsHint: "53·65·77·89·01·13" },
  { id: "horse", branch: "오", hanja: "午", animal: "말", label: "말띠", emoji: "🐴", yearsHint: "54·66·78·90·02·14" },
  { id: "goat", branch: "미", hanja: "未", animal: "양", label: "양띠", emoji: "🐑", yearsHint: "55·67·79·91·03·15" },
  { id: "monkey", branch: "신", hanja: "申", animal: "원숭이", label: "원숭이띠", emoji: "🐵", yearsHint: "56·68·80·92·04·16" },
  { id: "rooster", branch: "유", hanja: "酉", animal: "닭", label: "닭띠", emoji: "🐔", yearsHint: "57·69·81·93·05·17" },
  { id: "dog", branch: "술", hanja: "戌", animal: "개", label: "개띠", emoji: "🐶", yearsHint: "58·70·82·94·06·18" },
  { id: "pig", branch: "해", hanja: "亥", animal: "돼지", label: "돼지띠", emoji: "🐷", yearsHint: "59·71·83·95·07·19" },
];

const STAR_SIGNS = [
  { id: "aquarius", name: "물병자리", emoji: "♒", range: "1.20 ~ 2.18", element: "바람(風)" },
  { id: "pisces", name: "물고기자리", emoji: "♓", range: "2.19 ~ 3.20", element: "물(水)" },
  { id: "aries", name: "양자리", emoji: "♈", range: "3.21 ~ 4.19", element: "불(火)" },
  { id: "taurus", name: "황소자리", emoji: "♉", range: "4.20 ~ 5.20", element: "대지(土)" },
  { id: "gemini", name: "쌍둥이자리", emoji: "♊", range: "5.21 ~ 6.21", element: "바람(風)" },
  { id: "cancer", name: "게자리", emoji: "♋", range: "6.22 ~ 7.22", element: "물(水)" },
  { id: "leo", name: "사자자리", emoji: "♌", range: "7.23 ~ 8.22", element: "불(火)" },
  { id: "virgo", name: "처녀자리", emoji: "♍", range: "8.23 ~ 9.22", element: "대지(土)" },
  { id: "libra", name: "천칭자리", emoji: "♎", range: "9.23 ~ 10.22", element: "바람(風)" },
  { id: "scorpio", name: "전갈자리", emoji: "♏", range: "10.23 ~ 11.22", element: "물(水)" },
  { id: "sagittarius", name: "사수자리", emoji: "♐", range: "11.23 ~ 12.21", element: "불(火)" },
  { id: "capricorn", name: "염소자리", emoji: "♑", range: "12.22 ~ 1.19", element: "대지(土)" },
];

const MAJOR_ARCANA = [
  { no: "0", name: "길 떠나는 나그네 (바보)", hanja: "愚者", symbol: "🍃", upright: "새로운 출발, 순수한 호기심, 얽매이지 않는 자유", reversed: "성급한 발걸음, 계획 점검 필요, 부주의함" },
  { no: "I", name: "조화를 빚는 장인 (마법사)", hanja: "魔術師", symbol: "🖌️", upright: "창조적 재능 발휘, 기회의 포착, 뛰어난 언변", reversed: "재능의 분산, 망설임, 말보다 실속 챙기기" },
  { no: "II", name: "달빛 아래 여사제", hanja: "女祭司", symbol: "🌙", upright: "깊은 직관, 고요한 지혜, 내면의 목소리 경청", reversed: "예민해진 감정, 지나친 생각, 숨겨진 이면 확인" },
  { no: "III", name: "풍요의 안주인 (여황제)", hanja: "女皇", symbol: "🌺", upright: "물질적·정서적 풍요, 따뜻한 포용, 결실", reversed: "과소비 주의, 나태함 경계, 감정적 의존 줄이기" },
  { no: "IV", name: "굳건한 성주 (황제)", hanja: "皇帝", symbol: "⛰️", upright: "책임감, 질서와 안정, 목표를 향한 추진력", reversed: "지나친 고집 완화, 유연한 태도 필요, 권위 내려놓기" },
  { no: "V", name: "도의 스승 (교황)", hanja: "敎皇", symbol: "📿", upright: "신뢰할 만한 조언자, 전통과 원칙, 배움의 길", reversed: "고정관념 탈피, 나만의 기준 세우기, 형식주의 주의" },
  { no: "VI", name: "마주 선 인연 (연인)", hanja: "戀人", symbol: "🦋", upright: "설레는 교감, 조화로운 파트너십, 중요한 선택", reversed: "선택의 기로에서 신중함, 소통의 오해 풀기" },
  { no: "VII", name: "질주하는 수레 (전차)", hanja: "戰車", symbol: "🐎", upright: "강한 돌파력, 승리와 전진, 주도권 확보", reversed: "속도 조절 필요, 방향 재점검, 성급한 경쟁 자제" },
  { no: "VIII", name: "부드러운 강인함 (힘)", hanja: "剛柔", symbol: "🦁", upright: "외유내강의 인내, 내면의 용기, 포용으로 얻는 승리", reversed: "체력 저하 주의, 자신감 회복, 억지 부리지 않기" },
  { no: "IX", name: "등불 든 은자 (은둔자)", hanja: "隱者", symbol: "🏮", upright: "깊은 성찰, 혼자만의 재충전, 해답을 찾는 시간", reversed: "고립감에서 벗어나기, 주변에 마음 열기" },
  { no: "X", name: "돌아가는 사계 (운명의 수레바퀴)", hanja: "輪廻", symbol: "☸️", upright: "반가운 전환점, 순리에 따르는 행운, 새로운 국면", reversed: "예상치 못한 변수 대비, 때를 기다리는 여유" },
  { no: "XI", name: "공정한 저울 (정의)", hanja: "正義", symbol: "⚖️", upright: "균형 잡힌 판단, 정당한 보상, 명확한 계약", reversed: "치우친 시선 점검, 감정 섞인 판단 보류" },
  { no: "XII", name: "물구나무선 구도자 (매달린 사람)", hanja: "觀照", symbol: "🎋", upright: "관점의 전환, 값진 인내, 더 큰 도약을 위한 멈춤", reversed: "무의미한 희생 줄이기, 미련 내려놓기" },
  { no: "XIII", name: "비움과 새벽 (죽음)", hanja: "蛻變", symbol: "🍂", upright: "묵은 것의 정리, 완전한 매듭과 새로운 새벽", reversed: "변화에 대한 저항 덜어내기, 과거 집착 비우기" },
  { no: "XIV", name: "두 물줄기의 조화 (절제)", hanja: "節制", symbol: "🍵", upright: "중용의 미학, 평온한 치유, 원만한 조율", reversed: "생활 리듬 회복, 과유불급 경계" },
  { no: "XV", name: "달콤한 굴레 (악마)", hanja: "執着", symbol: "⛓️", upright: "강한 몰입과 매혹, 현실적 욕망 직시", reversed: "나쁜 습관 끊어내기, 구속에서의 해방" },
  { no: "XVI", name: "번개 맞은 누각 (탑)", hanja: "霹靂", symbol: "⚡", upright: "틀을 깨는 각성, 급격한 변화 뒤의 재건", reversed: "작은 균열 미리 점검, 충격 완화" },
  { no: "XVII", name: "밤하늘의 북극성 (별)", hanja: "星辰", symbol: "⭐", upright: "맑은 희망, 영감의 샘솟음, 순조로운 회복", reversed: "기대치 현실화, 스스로를 믿는 마음 다지기" },
  { no: "XVIII", name: "안개 낀 강변의 달 (달)", hanja: "月影", symbol: "🌕", upright: "풍부한 감수성, 어스름 속 직관, 서서히 드러날 진실", reversed: "막연한 불안 걷어내기, 오해 해소" },
  { no: "XIX", name: "떠오르는 아침 해 (태양)", hanja: "太陽", symbol: "☀️", upright: "밝은 성취, 활력과 기쁨, 명쾌한 해결", reversed: "체력 안배, 작은 성과에도 감사하기" },
  { no: "XX", name: "울려 퍼지는 범종 (심판)", hanja: "梵鐘", symbol: "🔔", upright: "노력의 결산, 반가운 소식, 재도약의 기회", reversed: "지나간 후회 털어내기, 결단 미루지 않기" },
  { no: "XXI", name: "원만한 천하 (세계)", hanja: "世界", symbol: "🌏", upright: "아름다운 완성, 조화로운 성취, 더 넓은 무대", reversed: "마무리 디테일 점검, 마지막 한 걸음 채우기" },
];

const TRADITIONAL_COLOR_MAP = [
  { keywords: ["청자", "비취", "초록", "녹색", "청록", "옥색", "민트"], hex: "#4b8b78" },
  { keywords: ["주홍", "단청", "적색", "붉은", "빨강", "홍매", "자주", "코랄"], hex: "#c04335" },
  { keywords: ["송화", "황금", "노랑", "금색", "겨자", "황토", "호박"], hex: "#c7963b" },
  { keywords: ["쪽빛", "남색", "파랑", "푸른", "청색", "하늘"], hex: "#355c87" },
  { keywords: ["백옥", "흰색", "백색", "아이보리", "미색", "은색"], hex: "#ebe5d8" },
  { keywords: ["자수정", "보라", "연보라"], hex: "#73538a" },
  { keywords: ["먹색", "검정", "현무", "차콜", "회색"], hex: "#2f2c28" },
  { keywords: ["연분홍", "복숭아", "분홍"], hex: "#d98a8c" },
];

/**
 * 생년으로 60갑자 연주 및 12띠 계산
 */
function calculateYearGanji(year) {
  const stemIdx = ((year - 4) % 10 + 10) % 10;
  const branchIdx = ((year - 4) % 12 + 12) % 12;
  const stem = HEAVENLY_STEMS[stemIdx];
  const zodiac = CHINESE_ZODIAC[branchIdx];
  return {
    ganjiKo: `${stem.ko}${zodiac.branch}년`,
    ganjiHanja: `${stem.hanja}${zodiac.hanja}年`,
    colorAnimal: `${stem.colorName} ${zodiac.animal}`,
    element: stem.element,
    zodiac,
    stem,
  };
}

/**
 * 그레고리력 날짜(년, 월, 일)로 일진(60갑자 일주) 계산
 * 기준일: 2000-01-01 = 戊午日 (천간 4: 무, 지지 6: 오 -> 60갑자 index 54)
 */
function calculateDayGanji(year, month, day) {
  const utcTarget = Date.UTC(year, month - 1, day);
  const utcBase = Date.UTC(2000, 0, 1);
  const diffDays = Math.round((utcTarget - utcBase) / 86400000);
  const index60 = ((54 + diffDays) % 60 + 60) % 60;
  const stem = HEAVENLY_STEMS[index60 % 10];
  const zodiac = CHINESE_ZODIAC[index60 % 12];
  return {
    ko: `${stem.ko}${zodiac.branch}일`,
    hanja: `${stem.hanja}${zodiac.hanja}日`,
    element: stem.element,
  };
}

/**
 * 월/일로 황도 12궁 별자리 계산
 */
function calculateStarSign(month, day) {
  const md = month * 100 + day;
  if (md >= 120 && md <= 218) return STAR_SIGNS[0];
  if (md >= 219 && md <= 320) return STAR_SIGNS[1];
  if (md >= 321 && md <= 419) return STAR_SIGNS[2];
  if (md >= 420 && md <= 520) return STAR_SIGNS[3];
  if (md >= 521 && md <= 621) return STAR_SIGNS[4];
  if (md >= 622 && md <= 722) return STAR_SIGNS[5];
  if (md >= 723 && md <= 822) return STAR_SIGNS[6];
  if (md >= 823 && md <= 922) return STAR_SIGNS[7];
  if (md >= 923 && md <= 1022) return STAR_SIGNS[8];
  if (md >= 1023 && md <= 1122) return STAR_SIGNS[9];
  if (md >= 1123 && md <= 1221) return STAR_SIGNS[10];
  return STAR_SIGNS[11];
}

/**
 * 색상 텍스트에서 어울리는 전통 오방/간색 HEX 추출
 */
function resolveColorHex(colorText = "") {
  for (const entry of TRADITIONAL_COLOR_MAP) {
    if (entry.keywords.some((kw) => colorText.includes(kw))) {
      return entry.hex;
    }
  }
  return "#a97c2f";
}

/**
 * API 키 없이 즉시 화면을 둘러볼 수 있는 샘플 종합 운세 생성기
 */
function buildSampleFortune(profile, todayInfo) {
  const name = profile.userName || "귀인";
  const zodiacLabel = profile.yearGanji.zodiac.label;
  const starName = profile.starSign.name;
  const dayGanji = todayInfo.dayGanji;

  return {
    overall_score: 89,
    idiom_hanja: "水到渠成",
    idiom_meaning: "물이 흐르면 자연스레 도랑이 이루어진다",
    headline: `${name}님의 차분한 내공이 ${dayGanji.ko}(${dayGanji.hanja})의 기운과 만나 순조로운 물길을 여는 날입니다.`,
    overall_reading:
      `오늘 ${name}님(${profile.yearGanji.ganjiKo}생 · ${profile.yearGanji.colorAnimal})에게는 억지로 밀어붙이지 않아도 그동안 쌓아온 성실함이 자연스럽게 빛을 발하는 흐름이 들어와 있습니다.\n\n오전에는 주변의 의견을 차분히 경청하며 문서나 일정을 정돈하기에 좋고, 오후로 접어들수록 기다리던 연락이나 반가운 제안이 문을 두드릴 가능성이 높습니다. ${profile.userConcern ? `특히 마음에 품고 계신 "${profile.userConcern}"에 대해서는 조급함을 한 겹 내려놓을 때 오히려 가장 유리한 패가 손에 쥐어질 것입니다.` : "작은 배려 한마디가 귀인을 부르는 마중물이 되어줄 하루입니다."}`,
    categories: {
      wealth: {
        score: 86,
        title: "재물·금전운",
        advice: "새어 나가던 지출을 정돈하면 뜻밖의 실속이 남는 날입니다. 충동적인 구매보다는 장기적인 안목의 저축이나 실용적인 물품 구매에 길한 기운이 따릅니다.",
      },
      love: {
        score: 91,
        title: "연애·인연운",
        advice: "담백하고 진솔한 대화가 상대의 마음을 깊게 울립니다. 가까운 사람에게 따뜻한 차 한 잔을 건네듯 안부를 먼저 전해보세요.",
      },
      career: {
        score: 90,
        title: "직장·학업·성취운",
        advice: "꼼꼼한 마무리가 돋보여 신뢰를 얻습니다. 미뤄두었던 기획안이나 정리 작업을 오늘 매듭지으면 기대 이상의 호평이 따릅니다.",
      },
      health: {
        score: 84,
        title: "건강·컨디션운",
        advice: "전반적으로 안정적이나 늦은 오후 어깨와 눈의 피로가 쌓일 수 있습니다. 따뜻한 차로 수분을 보충하고 가벼운 산책으로 호흡을 고르세요.",
      },
    },
    time_flow: {
      morning: "머리가 맑아지는 시간대입니다. 오늘 가장 중요한 우선순위 한두 가지를 먼저 처리하면 하루가 가벼워집니다.",
      afternoon: "협업과 대화운이 활짝 열립니다. 미팅이나 상의할 일이 있다면 오후 2시~4시 사이가 가장 원만합니다.",
      evening: "복잡한 생각을 접어두고 온전한 쉼을 누리세요. 잔잔한 음악이나 독서가 내일의 좋은 영감을 길어 올립니다.",
    },
    lucky_prescription: {
      color: "청자 비취색",
      numbers: "3, 8",
      direction: "동남쪽 (東南)",
      item_or_tea: "따뜻한 작설차 또는 호두·견과류",
      caution_tip: "오후 늦게 성급한 단정 짓기만 피하면 만사가 평안합니다.",
    },
    zodiac_reading: {
      title: `${zodiacLabel} (${profile.yearGanji.ganjiHanja}) 오늘의 흐름`,
      content: `오늘 ${zodiacLabel}에게는 '신뢰'와 '안정'의 별이 비춥니다. 묵묵히 자리를 지킨 보람이 나타나며, 윗사람이나 동료로부터 실질적인 도움을 받기 좋은 일진입니다. 귀인이 가까이 있으니 밝은 표정을 유지해 보세요.`,
      harmony_zodiac: "용띠 · 원숭이띠",
    },
    star_reading: {
      title: `${starName} (${profile.starSign.range}) 오늘의 별빛`,
      content: `${starName} 특유의 섬세한 감각이 돋보이는 하루입니다. 스쳐 지나가는 아이디어 메모가 조만간 멋진 결과물로 이어질 수 있으니 작은 영감도 기록해 두시길 권합니다.`,
      lucky_keyword: "영감의 기록 · 부드러운 미소",
    },
    master_quote: "찻잎이 뜨거운 물을 만나 제 향기를 내어놓듯, 오늘의 작은 정성이 머지않아 깊은 향기로 돌아올 것입니다. (샘플 체험 결과입니다 — 우측 상단에서 Gemini 열쇠를 설정하시면 실시간 AI 맞춤 풀이가 제공됩니다.)",
  };
}

window.FortuneData = {
  HEAVENLY_STEMS,
  CHINESE_ZODIAC,
  STAR_SIGNS,
  MAJOR_ARCANA,
  calculateYearGanji,
  calculateDayGanji,
  calculateStarSign,
  resolveColorHex,
  buildSampleFortune,
};

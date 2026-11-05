/**
 * 월하다원 (月下茶園) — 정통 사주명리(60갑자·일간·십성·오행) 및 수묵 타로·차담 엔진
 * 외부 API 키 요구 없이 방문객의 생년월일시와 당일 일진(日辰)을 조합해 깊이 있는 점괘를 생성합니다.
 */

const HEAVENLY_STEMS = [
  { idx: 0, ko: "갑", hanja: "甲", elementKey: "wood", element: "목(木)", colorName: "푸른", polarity: "양", nature: "곧게 뻗어 오르는 거목(巨木)", trait: "추진력과 어진 리더십" },
  { idx: 1, ko: "을", hanja: "乙", elementKey: "wood", element: "목(木)", colorName: "푸른", polarity: "음", nature: "바람에도 꺾이지 않는 화초와 덩굴", trait: "유연한 적응력과 섬세한 끈기" },
  { idx: 2, ko: "병", hanja: "丙", elementKey: "fire", element: "화(火)", colorName: "붉은", polarity: "양", nature: "온 누리를 비추는 밝은 태양", trait: "열정과 솔직담백한 표현력" },
  { idx: 3, ko: "정", hanja: "丁", elementKey: "fire", element: "화(火)", colorName: "붉은", polarity: "음", nature: "밤길을 밝히는 은은한 등불과 달빛", trait: "따뜻한 배려와 깊은 집중력" },
  { idx: 4, ko: "무", hanja: "戊", elementKey: "earth", element: "토(土)", colorName: "황금", polarity: "양", nature: "만물을 품어 안는 듬직한 태산", trait: "포용력과 흔들리지 않는 신용" },
  { idx: 5, ko: "기", hanja: "己", elementKey: "earth", element: "토(土)", colorName: "황금", polarity: "음", nature: "곡식을 길러내는 비옥한 정원토", trait: "실속 있는 안목과 다정한 조율력" },
  { idx: 6, ko: "경", hanja: "庚", element: "금(金)", elementKey: "metal", colorName: "하얀", polarity: "양", nature: "단단한 원석과 정의로운 강철", trait: "결단력과 맺고 끊는 의리" },
  { idx: 7, ko: "신", hanja: "辛", element: "금(金)", elementKey: "metal", colorName: "하얀", polarity: "음", nature: "정교하게 세공된 맑은 보석", trait: "예리한 직관과 깔끔한 완벽함" },
  { idx: 8, ko: "임", hanja: "壬", element: "수(水)", elementKey: "water", colorName: "검은", polarity: "양", nature: "유유히 흐르는 깊은 강과 바다", trait: "넓은 지혜와 거침없는 포부" },
  { idx: 9, ko: "계", hanja: "癸", element: "수(水)", elementKey: "water", colorName: "검은", polarity: "음", nature: "대지를 적시는 단비와 옹달샘", trait: "맑은 감수성과 지혜로운 통찰" },
];

const CHINESE_ZODIAC = [
  { id: "rat", branch: "자", hanja: "子", animal: "쥐", label: "쥐띠", emoji: "🐭", elementKey: "water", yearsHint: "48·60·72·84·96·08", harmony: "용띠 · 원숭이띠 · 소띠" },
  { id: "ox", branch: "축", hanja: "丑", animal: "소", label: "소띠", emoji: "🐮", elementKey: "earth", yearsHint: "49·61·73·85·97·09", harmony: "뱀띠 · 닭띠 · 쥐띠" },
  { id: "tiger", branch: "인", hanja: "寅", animal: "호랑이", label: "호랑이띠", emoji: "🐯", elementKey: "wood", yearsHint: "50·62·74·86·98·10", harmony: "말띠 · 개띠 · 돼지띠" },
  { id: "rabbit", branch: "묘", hanja: "卯", animal: "토끼", label: "토끼띠", emoji: "🐰", elementKey: "wood", yearsHint: "51·63·75·87·99·11", harmony: "양띠 · 돼지띠 · 개띠" },
  { id: "dragon", branch: "진", hanja: "辰", animal: "용", label: "용띠", emoji: "🐉", elementKey: "earth", yearsHint: "52·64·76·88·00·12", harmony: "쥐띠 · 원숭이띠 · 닭띠" },
  { id: "snake", branch: "사", hanja: "巳", animal: "뱀", label: "뱀띠", emoji: "🐍", elementKey: "fire", yearsHint: "53·65·77·89·01·13", harmony: "소띠 · 닭띠 · 원숭이띠" },
  { id: "horse", branch: "오", hanja: "午", animal: "말", label: "말띠", emoji: "🐴", elementKey: "fire", yearsHint: "54·66·78·90·02·14", harmony: "호랑이띠 · 양띠 · 개띠" },
  { id: "goat", branch: "미", hanja: "未", animal: "양", label: "양띠", emoji: "🐑", elementKey: "earth", yearsHint: "55·67·79·91·03·15", harmony: "토끼띠 · 돼지띠 · 말띠" },
  { id: "monkey", branch: "신", hanja: "申", animal: "원숭이", label: "원숭이띠", emoji: "🐵", elementKey: "metal", yearsHint: "56·68·80·92·04·16", harmony: "쥐띠 · 용띠 · 뱀띠" },
  { id: "rooster", branch: "유", hanja: "酉", animal: "닭", label: "닭띠", emoji: "🐔", elementKey: "metal", yearsHint: "57·69·81·93·05·17", harmony: "소띠 · 뱀띠 · 용띠" },
  { id: "dog", branch: "술", hanja: "戌", animal: "개", label: "개띠", emoji: "🐶", elementKey: "earth", yearsHint: "58·70·82·94·06·18", harmony: "호랑이띠 · 말띠 · 토끼띠" },
  { id: "pig", branch: "해", hanja: "亥", animal: "돼지", label: "돼지띠", emoji: "🐷", elementKey: "water", yearsHint: "59·71·83·95·07·19", harmony: "토끼띠 · 양띠 · 호랑이띠" },
];

const STAR_SIGNS = [
  { id: "aquarius", name: "물병자리", emoji: "♒", range: "1.20 ~ 2.18", element: "바람(風)", trait: "독창적인 시선과 자유로운 지성" },
  { id: "pisces", name: "물고기자리", emoji: "♓", range: "2.19 ~ 3.20", element: "물(水)", trait: "깊은 공감력과 예술적 직관" },
  { id: "aries", name: "양자리", emoji: "♈", range: "3.21 ~ 4.19", element: "불(火)", trait: "거침없는 용기와 생동하는 개척력" },
  { id: "taurus", name: "황소자리", emoji: "♉", range: "4.20 ~ 5.20", element: "대지(土)", trait: "단단한 내실과 흔들림 없는 심미안" },
  { id: "gemini", name: "쌍둥이자리", emoji: "♊", range: "5.21 ~ 6.21", element: "바람(風)", trait: "재치 있는 소통과 빠른 회전력" },
  { id: "cancer", name: "게자리", emoji: "♋", range: "6.22 ~ 7.22", element: "물(水)", trait: "다정한 보호 본능과 섬세한 기억력" },
  { id: "leo", name: "사자자리", emoji: "♌", range: "7.23 ~ 8.22", element: "불(火)", trait: "당당한 존재감과 관대한 품격" },
  { id: "virgo", name: "처녀자리", emoji: "♍", range: "8.23 ~ 9.22", element: "대지(土)", trait: "치밀한 분석력과 정갈한 성실함" },
  { id: "libra", name: "천칭자리", emoji: "♎", range: "9.23 ~ 10.22", element: "바람(風)", trait: "우아한 균형 감각과 조화로운 중재력" },
  { id: "scorpio", name: "전갈자리", emoji: "♏", range: "10.23 ~ 11.22", element: "물(水)", trait: "본질을 꿰뚫는 통찰과 깊은 몰입" },
  { id: "sagittarius", name: "사수자리", emoji: "♐", range: "11.23 ~ 12.21", element: "불(火)", trait: "낙천적인 기상과 넓은 시야" },
  { id: "capricorn", name: "염소자리", emoji: "♑", range: "12.22 ~ 1.19", element: "대지(土)", trait: "묵묵한 인내와 끝내 이루는 성취력" },
];

const MAJOR_ARCANA = [
  {
    no: "0", name: "길 떠나는 나그네 (바보)", hanja: "愚者", symbol: "🍃",
    upright: "새로운 출발, 순수한 호기심, 얽매이지 않는 자유",
    reversed: "성급한 발걸음 경계, 영점 재점검, 작은 돌다리 두드리기",
    storyUp: "새벽안개를 헤치고 가벼운 괴나리봇짐 하나로 길 위에 선 나그네의 형상입니다. 계산이나 두려움에 묶이기보다, 지금 마음에 피어오른 순수한 설렘을 믿고 첫발을 떼어도 좋다는 청신호입니다.",
    storyRev: "마음은 이미 천 리 밖을 달리고 있으나 신발 끈이 느슨해진 형상입니다. 새로운 시도를 멈출 필요는 없으되, 오늘만큼은 작은 일정이나 조건을 한 번만 더 살피고 움직이면 실수를 말끔히 피할 수 있습니다.",
  },
  {
    no: "I", name: "조화를 빚는 장인 (마법사)", hanja: "魔術師", symbol: "🖌️",
    upright: "창조적 재능 발휘, 기회의 포착, 뛰어난 언변",
    reversed: "에너지 분산 주의, 망설임 덜어내기, 말보다 실속",
    storyUp: "먹과 붓, 종이와 벼루가 책상 위에 모두 갖추어진 장인의 패입니다. 이미 당신 손안에 문제를 풀 재료와 능력이 충분히 있으니, 망설이지 말고 직접 판을 주도해 보시기 바랍니다.",
    storyRev: "재주와 생각은 넘치나 어느 그릇부터 빚을지 손이 잠시 머뭇거리는 모습입니다. 여러 일을 한꺼번에 벌이기보다 가장 중요한 한 가지에 힘을 모으면 막혔던 기운이 단번에 뚫립니다.",
  },
  {
    no: "II", name: "달빛 아래 여사제", hanja: "女祭司", symbol: "🌙",
    upright: "깊은 직관, 고요한 지혜, 내면의 목소리 경청",
    reversed: "지나친 생각 비우기, 예민함 다독이기, 겉보다 속 살피기",
    storyUp: "고요한 연못 위로 둥근 달이 비치듯, 시끄러운 조언보다 당신의 직감이 가장 정확한 답을 알고 있는 날입니다. 서둘러 결론을 말하기보다 한 박자 지켜보며 문서와 이면을 읽으면 큰 지혜를 얻습니다.",
    storyRev: "생각의 가지가 너무 많이 뻗어 오히려 마음이 피로해지기 쉬운 흐름입니다. 아직 일어나지 않은 일을 미리 걱정하기보다 눈앞에 확인된 사실만 담백하게 붙잡으세요.",
  },
  {
    no: "III", name: "풍요의 안주인 (여황제)", hanja: "女皇", symbol: "🌺",
    upright: "물질적·정서적 풍요, 따뜻한 포용, 탐스러운 결실",
    reversed: "기분성 지출 절제, 나른함 환기, 스스로 먼저 돌보기",
    storyUp: "가을 들녘에 잘 익은 곡식이 가득한 풍요의 패입니다. 그동안 공들여 온 일에서 실질적인 보람이나 금전적 여유, 혹은 사람 사이의 다정한 환대가 자연스럽게 찾아옵니다.",
    storyRev: "마음이 느슨해지거나 기분 전환을 위한 불필요한 지출이 생기기 쉬운 때입니다. 남을 챙기느라 정작 내 기운을 소진하지 않았는지 돌아보고 생활의 균형을 다잡아 보세요.",
  },
  {
    no: "IV", name: "굳건한 성주 (황제)", hanja: "皇帝", symbol: "⛰️",
    upright: "책임감, 질서와 안정, 목표를 향한 흔들림 없는 추진력",
    reversed: "완고함 내려놓기, 부드러운 소통, 어깨의 짐 나누기",
    storyUp: "바위산 위에 세운 성곽처럼 기준과 원칙이 든든한 힘을 발휘하는 패입니다. 흔들림 없이 중심을 잡고 일정을 지휘하면 주변 사람들이 자연스럽게 당신의 뜻을 따르게 됩니다.",
    storyRev: "내 방식만이 옳다는 생각이 강해지면 가까운 사이에서 작은 마찰이 일 수 있습니다. 원칙은 지키되 말투에 온기를 한 스푼 더하면 훨씬 수월하게 원하는 결과를 얻습니다.",
  },
  {
    no: "V", name: "도의 스승 (교황)", hanja: "敎皇", symbol: "📿",
    upright: "신뢰할 만한 귀인·조언자, 검증된 정도(正道), 배움의 복",
    reversed: "틀에 박힌 관습 탈피, 나만의 해법 모색, 맹신 주의",
    storyUp: "오랜 세월 검증된 길과 지혜로운 스승의 도움을 뜻하는 패입니다. 혼자 끙끙 앓기보다 경험 많은 선배나 윗사람, 전문가의 조언을 구하면 의외로 손쉬운 정석이 보입니다.",
    storyRev: "남들이 다 그렇게 한다고 해서 내 옷에 맞지 않는 방식을 억지로 따를 필요는 없습니다. 기본 예의는 갖추되, 세부 방식에서는 당신만의 실용적인 변주를 시도해 보세요.",
  },
  {
    no: "VI", name: "마주 선 인연 (연인)", hanja: "戀人", symbol: "🦋",
    upright: "설레는 교감, 뜻이 통하는 협력자, 마음이 시키는 선택",
    reversed: "갈림길에서의 신중함, 사소한 오해 미리 풀기",
    storyUp: "봄날 꽃밭에서 나비 두 마리가 마주 날아오르는 화합의 패입니다. 연애와 대인관계에서 진심이 따뜻하게 닿으며, 일에서도 손발이 척척 맞는 좋은 파트너십이 성사됩니다.",
    storyRev: "두 가지 선택지 사이에서 마음이 흔들리거나, 말하지 않아도 알겠지 하는 생각에 작은 빈틈이 생길 수 있습니다. 중요한 약속이나 마음일수록 분명한 언어로 다정히 확인하세요.",
  },
  {
    no: "VII", name: "질주하는 수레 (전차)", hanja: "戰車", symbol: "🐎",
    upright: "강력한 돌파력, 경쟁에서의 승리, 목표를 향한 전진",
    reversed: "고삐 다시 쥐기, 속도 조절, 조급한 승부욕 진정",
    storyUp: "두 필의 준마가 거침없이 대지를 가르는 승리의 수레입니다. 망설이던 과제가 있다면 오늘 과감하게 밀어붙여 단숨에 고지를 선점하기에 더없이 좋은 기세입니다.",
    storyRev: "속도는 빠르나 바퀴가 덜컹거릴 수 있는 구간입니다. 빨리 끝내려는 마음보다 방향이 정확한지 먼저 살피며 호흡을 한 박자 늦추면 오히려 가장 먼저 목적지에 닿습니다.",
  },
  {
    no: "VIII", name: "부드러운 강인함 (힘)", hanja: "剛柔", symbol: "🦁",
    upright: "외유내강의 인내, 다정함으로 이기는 지혜, 깊은 내공",
    reversed: "체력 안배 필요, 억지 버티기 금물, 자신감 충전",
    storyUp: "사나운 맹수를 칼이 아닌 따뜻한 손길로 길들이는 외유내강의 패입니다. 큰 소리를 내기보다 차분한 미소와 끈기로 대할 때 까다로운 사람과 문제도 스스로 고개를 숙입니다.",
    storyRev: "몸과 마음의 기운이 다소 소모되어 작은 일에도 쉽게 지칠 수 있습니다. 모든 것을 혼자 감당하려 애쓰지 말고 따뜻한 음식과 휴식으로 내면의 심지를 먼저 돋우세요.",
  },
  {
    no: "IX", name: "등불 든 은자 (은둔자)", hanja: "隱者", symbol: "🏮",
    upright: "깊은 성찰, 고요한 집중, 내면에서 길어 올리는 해답",
    reversed: "혼자만의 동굴에서 나오기, 가벼운 안부 나누기",
    storyUp: "산중 다실에서 홀로 등불을 밝히고 깊은 생각에 잠긴 현자의 패입니다. 시끌벅적한 모임보다 조용히 혼자 정리하고 연구하는 시간 속에서 천금 같은 해답이 반짝입니다.",
    storyRev: "신중함이 지나치면 외로움이나 답답함으로 흐를 수 있습니다. 고민이 길어질수록 바람을 쐬거나 믿을 만한 지인과 차 한 잔 나누며 시야를 환기해 보세요.",
  },
  {
    no: "X", name: "돌아가는 사계 (운명의 수레바퀴)", hanja: "輪廻", symbol: "☸️",
    upright: "반가운 전환점, 순풍을 타는 흐름, 뜻밖의 호기",
    reversed: "흐름이 바뀔 때까지 차분히 대기, 무리한 역행 자제",
    storyUp: "겨울이 지나면 어김없이 봄바람이 불어오듯, 막혀 있던 국면이 자연스럽게 새 국면으로 넘어가는 길한 전환의 패입니다. 우연처럼 찾아오는 제안이나 연락을 반갑게 맞이하세요.",
    storyRev: "물살이 잠시 소용돌이치는 구간에서는 억지로 노를 젓기보다 배의 균형을 잡는 것이 상책입니다. 오늘 당장 결론 나지 않는 일은 하루이틀 여유를 두면 자연히 순리가 열립니다.",
  },
  {
    no: "XI", name: "공정한 저울 (정의)", hanja: "正義", symbol: "⚖️",
    upright: "명쾌한 판단, 뿌린 대로 거두는 정당한 보상, 깔끔한 합의",
    reversed: "감정 섞인 편견 주의, 손익 계산 꼼꼼히 재확인",
    storyUp: "한 치의 기울어짐 없는 저울처럼 공정한 평가와 합당한 대가가 따르는 패입니다. 계약, 면접, 정산, 중요한 결정에서 이성적이고 투명하게 임할수록 당신에게 유리합니다.",
    storyRev: "인정에 끌리거나 순간의 서운함 때문에 판단의 눈금이 흔들릴 수 있습니다. 숫자와 조건, 약속 사항은 구두보다 기록으로 남겨 두어야 뒤탈이 없습니다.",
  },
  {
    no: "XII", name: "물구나무선 구도자 (관조)", hanja: "觀照", symbol: "🎋",
    upright: "발상의 전환, 값진 기다림, 더 큰 도약을 위한 준비",
    reversed: "보람 없는 미련 덜어내기, 멈춰 있던 발걸음 옮기기",
    storyUp: "세상을 거꾸로 바라보며 남들이 보지 못하는 비책을 깨닫는 구도자의 패입니다. 잠시 속도가 더뎌 보여도 이는 허송세월이 아니라 뿌리를 깊게 내리는 귀한 시간입니다.",
    storyRev: "어쩔 수 없다며 스스로를 묶어 두었던 생각에서 벗어날 때입니다. 관성처럼 이어오던 비효율적인 습관 하나만 바꾸어도 하루가 놀랍도록 가벼워집니다.",
  },
  {
    no: "XIII", name: "비움과 새벽 (탈바꿈)", hanja: "蛻變", symbol: "🍂",
    upright: "묵은 고민의 종결, 과감한 정리 뒤 찾아오는 새출발",
    reversed: "지나간 일에 대한 미련 비우기, 변화를 두려워하지 않기",
    storyUp: "낙엽이 져야 새봄의 새순이 돋아나듯, 오래 끌던 문제나 불필요한 짐을 깔끔히 매듭짓고 새 국면을 여는 패입니다. 비워낸 자리마다 맑고 새로운 복이 들어찹니다.",
    storyRev: "이미 끝난 일이나 바꿀 수 없는 과거를 붙잡고 있느라 새 기회를 늦추고 있을지 모릅니다. 작은 정리 정돈부터 시작하면 마음의 물꼬도 함께 트입니다.",
  },
  {
    no: "XIV", name: "두 물줄기의 조화 (절제)", hanja: "節制", symbol: "🍵",
    upright: "완벽한 중용과 조율, 평온한 컨디션 회복, 순조로운 융합",
    reversed: "과유불급 경계, 무너진 생활 리듬 다잡기",
    storyUp: "뜨거운 물과 찬물을 알맞게 섞어 가장 향기로운 찻물을 우려내는 조화의 패입니다. 서로 다른 의견이나 일과 휴식 사이에서 절묘한 균형을 찾아내어 평안한 성취를 이룹니다.",
    storyRev: "의욕이 앞서 무리하거나 한쪽으로 치우치기 쉬운 날입니다. 카페인이나 야식을 줄이고 일과 쉼의 경계를 단정히 그어 주면 기운이 곧 회복됩니다.",
  },
  {
    no: "XV", name: "달콤한 굴레 (집착)", hanja: "執着", symbol: "⛓️",
    upright: "강렬한 몰입과 매력, 현실적 이익에 대한 강한 집중",
    reversed: "불필요한 집착 끊어내기, 가벼워지는 마음과 해방감",
    storyUp: "무언가에 깊이 매료되어 강한 집중력을 발휘하는 패입니다. 일이나 목표에 몰두하면 큰 성과를 내지만, 유혹이나 과욕에는 스스로 선을 그을 줄 아는 지혜가 함께 필요합니다.",
    storyRev: "나를 답답하게 조이던 부담이나 나쁜 습관에서 마침내 한 걸음 빠져나오는 반가운 신호입니다. '꼭 이래야만 한다'는 강박을 내려놓으면 숨통이 시원하게 트입니다.",
  },
  {
    no: "XVI", name: "번개 맞은 누각 (벽력)", hanja: "霹靂", symbol: "⚡",
    upright: "고정관념을 깨는 각성, 낡은 틀을 부수고 새로 짓는 기회",
    reversed: "작은 변수 미리 점검, 유연한 대처로 큰 흔들림 예방",
    storyUp: "갑작스러운 소나기와 천둥이 묵은 공기를 단숨에 씻어내는 각성의 패입니다. 예상과 다른 변수가 생기더라도 당황하지 마세요. 오히려 더 튼튼한 판을 짜는 전화위복이 됩니다.",
    storyRev: "미리 점검하면 충분히 비켜갈 수 있는 작은 변수를 알려주는 패입니다. 일정 변경이나 기기 백업 등 기본 사항만 챙겨 두면 평온하게 하루를 건널 수 있습니다.",
  },
  {
    no: "XVII", name: "밤하늘의 북극성 (별)", hanja: "星辰", symbol: "⭐",
    upright: "맑은 희망과 치유, 빛나는 영감, 순조로운 소원 성취",
    reversed: "스스로를 과소평가하지 않기, 현실적인 작은 목표부터 달성",
    storyUp: "어두운 밤하늘에 가장 맑게 빛나는 길잡이 별의 패입니다. 지쳐 있던 마음이 맑게 개며, 당신이 품고 있는 소망이 올바른 방향으로 반짝이며 나아가고 있음을 보증합니다.",
    storyRev: "이상은 높으나 발밑이 잠시 허전하게 느껴질 수 있습니다. 남과 비교하는 마음을 거두고 오늘 내가 해낸 작은 진전 하나를 기특하게 칭찬해 주세요.",
  },
  {
    no: "XVIII", name: "안개 낀 강변의 달 (월영)", hanja: "月影", symbol: "🌕",
    upright: "섬세한 감수성, 예술적 영감, 안개 너머 서서히 드러날 진실",
    reversed: "안개가 걷히고 오해가 풀림, 막연한 불안의 해소",
    storyUp: "강물 위로 어스름한 안개와 달빛이 내려앉은 신비로운 패입니다. 아직 모든 윤곽이 다 드러나지 않았으니 섣불리 단정 짓기보다 밤이 지나 새벽이 오듯 차분히 추이를 지켜보세요.",
    storyRev: "마음을 어지럽히던 막연한 걱정이나 사람 사이의 오해가 서서히 걷히는 다행스러운 흐름입니다. 추측 대신 사실만 확인하면 아무 일도 아니었음을 알게 됩니다.",
  },
  {
    no: "XIX", name: "떠오르는 아침 해 (태양)", hanja: "太陽", symbol: "☀️",
    upright: "가득 차오르는 활력, 명쾌한 성공, 주변의 축하와 기쁨",
    reversed: "작은 성취에도 미소 짓기, 체력 과신 주의",
    storyUp: "구름 한 점 없는 하늘에 떠오른 정오의 태양처럼 만사가 환하게 풀리는 대길(大吉)의 패입니다. 숨김없이 당당하고 밝은 태도로 임할수록 재물과 명예, 인연 모두 따스하게 화답합니다.",
    storyRev: "분명 좋은 흐름 속에 있으나 기대치를 너무 높게 잡아 스스로 만족을 미루고 있을 수 있습니다. 이미 손안에 들어온 기쁨을 충분히 누리며 한 템포 여유를 가져보세요.",
  },
  {
    no: "XX", name: "울려 퍼지는 범종 (심판)", hanja: "梵鐘", symbol: "🔔",
    upright: "기다리던 반가운 소식, 묵은 노력의 결산, 재도약의 부름",
    reversed: "결정을 미루지 않는 용기, 지나간 아쉬움 털어내기",
    storyUp: "새벽 산사에 맑은 범종 소리가 울려 퍼지듯, 오랫동안 기다리던 연락이나 결과 발표, 혹은 다시 찾아온 기회의 문이 열리는 패입니다. 부름이 올 때 기꺼이 응답하세요.",
    storyRev: "이미 마음속으로 답을 알고 있으면서도 결단을 미루고 있지 않은지 돌아볼 때입니다. 지난 실수에 대한 자책을 거두고 오늘의 선택에만 집중하면 새 길이 열립니다.",
  },
  {
    no: "XXI", name: "원만한 천하 (세계)", hanja: "世界", symbol: "🌏",
    upright: "아름다운 완성과 성취, 조화로운 결실, 더 넓은 무대로의 확장",
    reversed: "완성을 앞둔 마지막 1% 점검, 유종의 미 거두기",
    storyUp: "스물두 장의 여정이 마침내 둥근 원을 그리며 완성되는 최고의 성취 패입니다. 진행하던 일이 뜻깊은 매듭을 맺으며, 한 단계 더 넓은 세상으로 나아갈 발판이 마련됩니다.",
    storyRev: "아홉 걸음을 잘 걸어왔고 이제 마지막 문턱 한 걸음만 남았습니다. 끝났다고 방심하지 않고 마무리 확인만 꼼꼼히 챙기면 흠잡을 데 없는 완성을 이룹니다.",
  },
];

const TRADITIONAL_COLOR_MAP = [
  { keywords: ["청자", "비취", "초록", "녹색", "청록", "송엽", "대나무"], hex: "#4b8b78" },
  { keywords: ["주홍", "단청", "적색", "붉은", "홍매", "자주", "산호", "연지"], hex: "#c04335" },
  { keywords: ["송화", "황금", "노랑", "금색", "황토", "호박", "유자"], hex: "#c7963b" },
  { keywords: ["쪽빛", "남색", "파랑", "푸른", "청색", "하늘"], hex: "#355c87" },
  { keywords: ["백옥", "흰색", "백색", "미색", "은빛", "모시"], hex: "#e8e1d3" },
  { keywords: ["자수정", "보라", "도라지"], hex: "#73538a" },
  { keywords: ["먹색", "현무", "흑단", "짙은 먹"], hex: "#2f2c28" },
];

// 오행 상생·상극 보완 개운 처방 풀
const ELEMENT_PRESCRIPTIONS = {
  wood: {
    colors: ["청자 비취색", "송엽 푸른색", "연둣빛 비취색"],
    directions: ["동쪽 (東)", "동남쪽 (東南)"],
    numbers: ["3, 8", "1, 3", "4, 8"],
    teas: ["어린잎 작설차", "향긋한 매실차", "맑은 국화차", "상큼한 유자차"],
  },
  fire: {
    colors: ["홍매 붉은색", "연지 다홍색", "자수정 보라색"],
    directions: ["남쪽 (南)", "동남쪽 (東南)"],
    numbers: ["2, 7", "3, 7", "2, 9"],
    teas: ["붉은 오미자차", "대추 생강차", "장미 화차", "따뜻한 홍차"],
  },
  earth: {
    colors: ["송화 황금색", "고운 황토색", "호박 금빛"],
    directions: ["중앙 · 남서쪽 (西南)", "동북쪽 (東北)"],
    numbers: ["5, 10", "2, 5", "5, 8"],
    teas: ["구수한 볶은 보리차", "고소한 둥굴레차", "달콤한 호박차", "인삼 대추차"],
  },
  metal: {
    colors: ["백옥 미색", "은빛 모시색", "정갈한 백자색"],
    directions: ["서쪽 (西)", "서북쪽 (西北)"],
    numbers: ["4, 9", "1, 9", "4, 6"],
    teas: ["도라지 배차", "은은한 백차(白茶)", "생강 계피차", "모과차"],
  },
  water: {
    colors: ["깊은 쪽빛 남색", "현무 먹색", "맑은 하늘청색"],
    directions: ["북쪽 (北)", "서북쪽 (西北)"],
    numbers: ["1, 6", "1, 4", "6, 9"],
    teas: ["검은콩 서리태차", "깊은 숙우롱차", "구기자차", "연잎차"],
  },
};

// 오행 십성(일간 기준 오늘 일진의 역할)별 심층 운세 풀
const TEN_GOD_PROFILES = {
  // 비겁(比劫): 같은 오행
  companion: {
    name: "비겁(比劫) · 주체와 동행의 기운",
    baseBoost: 4,
    idioms: [
      { hanja: "同舟共濟", meaning: "동주공제 · 같은 배를 타고 함께 강을 건넌다" },
      { hanja: "中流砥柱", meaning: "중류지주 · 거센 물살 속에서도 흔들리지 않는 기둥" },
      { hanja: "切磋琢磨", meaning: "절차탁마 · 옥돌을 갈고 닦아 빛을 낸다" },
      { hanja: "蘭薰桂馥", meaning: "난훈계복 · 난초와 계수나무처럼 향기로운 인연이 모인다" },
    ],
    headlines: [
      "내면의 심지가 단단해지고 뜻이 통하는 동료와 힘을 합쳐 길을 여는 날입니다.",
      "흔들림 없는 주관이 빛을 발하니, 소신껏 내디딘 걸음에 든든한 응원이 따릅니다.",
      "나만의 중심을 지키면서도 주변과 보폭을 맞출 때 두 배의 성취가 피어납니다.",
    ],
    openings: [
      "오늘은 당신의 본원 기운에 든든한 뿌리가 더해지는 날입니다. 평소 망설이던 결정이 있었다면 남의 눈치를 보기보다 내 마음이 가리키는 정공법을 택할 때 일이 훨씬 매끄럽게 풀립니다.",
      "스스로에 대한 믿음이 또렷해지는 일진입니다. 오랜만에 연락이 닿는 지인이나 곁을 지키는 동료와의 대화 속에서 막혔던 실마리를 찾게 될 가능성이 높습니다.",
    ],
    wealthPool: [
      "공동의 이익을 나누거나 명확한 정산을 할 때 복이 따릅니다. 지인과의 모임 지출은 기분 좋게 쓰되, 충동적인 경쟁 소비나 보증성 거래만 선을 그어 두면 실속이 탄탄합니다.",
      "내 손으로 직접 땀 흘려 일군 몫이 정직하게 쌓이는 흐름입니다. 남의 말만 듣고 움직이는 단기 투자보다 내가 잘 아는 분야에 집중할 때 재물이 새지 않습니다.",
    ],
    lovePool: [
      "친구처럼 편안하고 꾸밈없는 대화가 매력으로 다가가는 날입니다. 연인이나 배우자에게는 자존심을 세우기보다 '네 편이다'라는 따뜻한 공감 한마디가 관계를 깊게 묶어 줍니다.",
      "동호회나 일상적인 모임처럼 자연스러운 자리에서 결이 비슷한 인연을 만나기 좋습니다. 솔직하고 담백한 미소가 가장 큰 호감을 부릅니다.",
    ],
    careerPool: [
      "주도권을 쥐고 추진력을 발휘하기에 아주 좋은 날입니다. 다만 독주하기보다 공로를 주변과 기꺼이 나누는 아량을 보이면 리더십과 평판이 함께 높아집니다.",
      "경쟁 구도가 있더라도 오히려 당신의 실력을 또렷이 증명할 무대가 됩니다. 준비한 자료와 논리를 차분히 펼쳐 보이세요.",
    ],
    healthPool: [
      "활력이 차오르는 날이나 의욕이 앞서 오버페이스를 하기 쉽습니다. 가벼운 하체 운동이나 산책으로 열기를 고르게 순환시켜 주면 숙면에 큰 도움이 됩니다.",
      "컨디션은 양호하나 어깨와 목의 긴장을 중간중간 풀어주는 것이 좋습니다. 틈틈이 기지개를 켜고 따뜻한 차로 호흡을 가다듬으세요.",
    ],
  },

  // 식상(食傷): 내가 생하는 오행
  output: {
    name: "식상(食傷) · 창의와 발산의 기운",
    baseBoost: 7,
    idioms: [
      { hanja: "春風和氣", meaning: "춘풍화기 · 봄바람처럼 온화하고 생동하는 기운이 감돈다" },
      { hanja: "錦上添花", meaning: "금상첨화 · 비단 위에 고운 꽃을 더하듯 기쁨이 겹친다" },
      { hanja: "流水不腐", meaning: "유수불부 · 흐르는 물은 썩지 않고 새 길을 낸다" },
      { hanja: "妙筆生花", meaning: "묘필생화 · 붓끝에서 꽃이 피듯 뛰어난 감각이 빛난다" },
    ],
    headlines: [
      "샘솟는 지혜와 부드러운 언변이 닫혀 있던 문도 활짝 열어젖히는 길일입니다.",
      "당신의 감각과 아이디어가 주변에 신선한 바람을 일으키며 복을 불러옵니다.",
      "작은 베풂과 다정한 표현이 돌고 돌아 예상치 못한 기쁜 소식으로 화답하는 날입니다.",
    ],
    openings: [
      "오늘은 막혔던 물꼬가 시원하게 트이듯 생각과 표현이 자유롭게 뻗어 나가는 날입니다. 머릿속에만 담아두었던 구상이나 제안을 밖으로 꺼내 놓으면 주변의 호응이 기대 이상으로 따스합니다.",
      "어색했던 분위기마저 당신의 재치와 부드러운 말 한마디로 훈훈하게 녹아내리는 일진입니다. 새로운 시도, 글쓰기, 발표, 요리, 취미 활동 모두에서 남다른 성취감을 맛보게 됩니다.",
    ],
    wealthPool: [
      "재물로 이어질 좋은 씨앗을 뿌리는 날입니다. 당신의 솜씨나 아이디어가 곧 수익과 기회의 마중물이 되며, 맛있는 식사 대접 같은 기분 좋은 지출은 더 큰 인복으로 돌아옵니다.",
      "작은 부수입이나 알뜰한 혜택이 따라붙는 흐름입니다. 다만 말끝에 분위기에 취해 불필요한 물건까지 장바구니에 담지 않도록 가볍게 점검해 보세요.",
    ],
    lovePool: [
      "매력과 표현력이 한껏 물오르는 날입니다. 마음에 둔 이가 있다면 먼저 다정한 안부나 가벼운 농담을 건네 보세요. 웃음꽃이 피는 대화가 두 사람의 거리를 성큼 좁혀 줍니다.",
      "오래된 사이일수록 작은 칭찬이나 깜짝 간식 하나가 큰 감동을 만듭니다. 솔직한 애정 표현이 최고의 개운법입니다.",
    ],
    careerPool: [
      "기획, 설득, 창작, 상담 업무에서 발군의 역량이 발휘됩니다. 기존 방식에 작은 아이디어 하나만 보태어도 효율이 크게 올라가 찬사를 받습니다.",
      "발표나 미팅이 있다면 긴장하지 마세요. 정직하고 생동감 있는 당신의 화법이 상대방의 마음을 자연스럽게 움직입니다.",
    ],
    healthPool: [
      "기분 전환과 미식(美食)의 즐거움이 컨디션을 끌어올립니다. 다만 과식이나 늦은 밤 야식만 조심하면 몸도 마음도 한결 가뿐한 하루가 됩니다.",
      "말을 많이 하거나 에너지를 활발히 쓰는 날이니 따뜻한 차로 목과 기관지를 촉촉하게 아껴 주시기 바랍니다.",
    ],
  },

  // 재성(財星): 내가 극하는 오행
  wealthStar: {
    name: "재성(財星) · 결실과 실속의 기운",
    baseBoost: 8,
    idioms: [
      { hanja: "水到渠成", meaning: "수도거성 · 물이 흐르면 자연스레 도랑이 이루어진다" },
      { hanja: "積土成山", meaning: "적토성산 · 작은 흙이 모여 마침내 큰 산을 이룬다" },
      { hanja: "滿載而歸", meaning: "만재이귀 · 풍성한 수확을 가득 싣고 돌아온다" },
      { hanja: "一擧兩得", meaning: "일거양득 · 한 번의 수고로 명분과 실리를 함께 얻는다" },
    ],
    headlines: [
      "공들여 온 수고가 알찬 현실의 열매와 금전적 실속으로 여무는 복된 날입니다.",
      "현실 감각이 맑게 깨어나니, 새는 곳은 막고 들어올 복은 단단히 거두어들입니다.",
      "구체적인 목표와 숫자를 챙길수록 손에 잡히는 보람이 또렷해지는 하루입니다.",
    ],
    openings: [
      "뜬구름 잡는 이야기보다 눈에 보이는 실질적인 성과와 마무리가 빛을 발하는 알찬 일진입니다. 미루어 두었던 정산, 가계 점검, 중요한 업무 매듭을 짓기에 오늘만큼 좋은 날이 드뭅니다.",
      "성실하게 쌓아온 시간들이 마침내 제값을 인정받는 흐름입니다. 작은 디테일까지 꼼꼼히 챙기는 당신의 태도가 금전적 이득은 물론 주변의 두터운 신임까지 안겨 줍니다.",
    ],
    wealthPool: [
      "오늘 사대 운세 가운데 재물과 실속의 별이 가장 밝게 비춥니다. 잊고 있던 포인트·환급금 확인이나 가격 비교, 실용적인 계약에서 기분 좋은 이득이 따릅니다.",
      "들어오는 흐름과 지키는 흐름이 조화롭습니다. 당장 필요한 것과 나중에 살 것을 구분해 메모해 두면 기대 이상의 여유 자금이 모입니다.",
    ],
    lovePool: [
      "화려한 미사여구보다 약속을 지키는 든든한 태도가 상대에게 깊은 설렘과 신뢰를 줍니다. 현실적인 미래 계획이나 일상을 함께 나누기에 참 좋은 날입니다.",
      "싱글이라면 일터나 배움터처럼 성실히 일상을 꾸리는 공간에서 단정하고 진중한 인연의 기운이 감돕니다.",
    ],
    careerPool: [
      "실무 처리 속도와 정확도가 모두 올라가는 날입니다. 결과물을 수치나 명확한 근거로 정리해 보고하거나 마무리하면 흠잡을 데 없는 평가를 받습니다.",
      "시간 대비 효율이 뛰어납니다. 우선순위가 높은 핵심 과제부터 차례로 지워 나가면 퇴근길 발걸음이 무척 가벼울 것입니다.",
    ],
    healthPool: [
      "규칙적인 식사와 일정한 생활 리듬이 곧 보약이 되는 날입니다. 점심 식사 후 10분 정도 햇볕을 쬐며 걷는 습관이 오후의 집중력을 지켜 줍니다.",
      "꼼꼼히 신경 쓰느라 눈이나 소화기가 다소 긴장할 수 있으니 식사는 천천히 꼭꼭 씹어 드시길 권합니다.",
    ],
  },

  // 관성(官星): 나를 극하는(다듬는) 오행
  honor: {
    name: "관성(官星) · 명예와 질서의 기운",
    baseBoost: 5,
    idioms: [
      { hanja: "光風霽月", meaning: "광풍제월 · 비 갠 뒤의 바람과 달처럼 맑고 품격 있는 기상" },
      { hanja: "實事求是", meaning: "실사구시 · 사실에 바탕하여 바른 해답을 구한다" },
      { hanja: "威風堂堂", meaning: "위풍당당 · 반듯한 자세로 주변의 존경을 얻는다" },
      { hanja: "有備無患", meaning: "유비무환 · 미리 갈무리해 두면 근심할 일이 없다" },
    ],
    headlines: [
      "단정한 예의와 책임감이 당신의 이름값을 높이고 귀한 신임을 얻게 하는 날입니다.",
      "어수선하던 주변이 정돈되고 맡은 자리에서 묵직한 존재감을 인정받습니다.",
      "원칙을 지키는 반듯한 걸음이 결국 가장 빠르고 안전한 지름길이 되는 하루입니다.",
    ],
    openings: [
      "옥석을 정교하게 다듬어 명품을 만들듯, 오늘의 일진은 당신에게 품격과 질서를 부여합니다. 공식적인 자리, 면접, 보고, 중요한 약속에서 단정하고 차분한 태도가 큰 점수를 얻습니다.",
      "주변에서 당신을 믿고 중요한 역할을 맡기거나 의견을 물어올 수 있는 날입니다. 부담으로 여기기보다 내 입지를 단단히 굳힐 기회로 삼으면 명예로운 보람이 따릅니다.",
    ],
    wealthPool: [
      "안정적이고 계획적인 재무 관리가 빛을 발합니다. 투기성 유혹에는 흔들리지 않고 정해진 예산 안에서 움직일 때 재물창고가 굳건히 지켜집니다.",
      "직장·업무상의 성과나 공식적인 절차를 통한 정당한 보상이 기대되는 흐름입니다. 공과 사의 금전 경계만 분명히 하면 만사가 깔끔합니다.",
    ],
    lovePool: [
      "예의 바르고 진중한 배려가 돋보이는 날입니다. 상대의 입장을 먼저 존중해 주는 성숙한 태도가 관계의 품격을 한 단계 높여 줍니다.",
      "새로운 만남에서는 첫인상의 단정함과 시간 약속 엄수가 결정적인 호감 포인트가 됩니다.",
    ],
    careerPool: [
      "승진, 평가, 시험, 공무, 조직 내 조율에서 특히 길한 기운이 작용합니다. 정해진 절차와 기한을 깔끔하게 완수해 윗사람과 동료 모두에게 깊은 인상을 남기세요.",
      "복잡하게 얽힌 일일수록 원칙대로 하나씩 풀어가면 가장 명쾌한 해답에 도달합니다.",
    ],
    healthPool: [
      "스스로에게 너무 엄격해져 긴장도가 올라갈 수 있으니 저녁 시간만큼은 완장을 내려놓고 온전히 쉬어가세요. 반신욕이나 족욕이 큰 도움이 됩니다.",
      "바른 자세를 의식적으로 유지하고 수분을 자주 섭취하면 피로 누적 없이 개운한 하루를 보낼 수 있습니다.",
    ],
  },

  // 인성(印星): 나를 생해주는 오행
  resource: {
    name: "인성(印星) · 귀인과 문서·지혜의 기운",
    baseBoost: 9,
    idioms: [
      { hanja: "雲外蒼天", meaning: "운외창천 · 구름 너머에 맑고 푸른 하늘이 펼쳐진다" },
      { hanja: "瑞氣集門", meaning: "서기집문 · 상서롭고 복된 기운이 문 앞에 가득 모인다" },
      { hanja: "溫故知新", meaning: "온고지신 · 깊은 배움과 성찰에서 새로운 지혜를 얻는다" },
      { hanja: "貴人相助", meaning: "귀인상조 · 생각지 못한 곳에서 따뜻한 도움의 손길이 닿는다" },
    ],
    headlines: [
      "어머니의 품처럼 든든한 후원과 문서·귀인의 복이 당신을 감싸 안는 길일입니다.",
      "마음이 고요히 맑아지고 현명한 통찰이 열리니, 순리대로 만사가 평안히 풀립니다.",
      "서두르지 않아도 좋은 소식과 도움의 손길이 먼저 찾아와 문을 두드리는 날입니다.",
    ],
    openings: [
      "마른 대지에 단비가 스며들듯, 오늘 일진은 당신의 기운을 따뜻하게 북돋아 주는 상생(相生)의 날입니다. 유난히 마음이 편안해지고, 어려워 보이던 일도 주변의 조언이나 알맞은 정보 덕분에 수월하게 해법을 찾게 됩니다.",
      "문서운과 학업·계약·자격의 기운이 맑게 빛납니다. 윗사람이나 경험 많은 귀인의 덕을 보기 좋으며, 차분히 앉아 미래를 설계하거나 책을 펼치면 오래 남을 지혜를 얻습니다.",
    ],
    wealthPool: [
      "장기적인 안목의 문서·계약·저축·자산 점검에 길한 기운이 서려 있습니다. 당장의 잔파도에 일희일비하기보다 긴 호흡으로 가치를 살펴보면 든든한 복록이 쌓입니다.",
      "주변으로부터 유익한 경제 정보나 뜻밖의 대접·선물을 받을 수 있는 복스러운 흐름입니다.",
    ],
    lovePool: [
      "말하지 않아도 서로의 마음을 다독여 주는 포근한 정이 깊어집니다. 조용한 찻집에서 도란도란 이야기를 나누기에 더없이 좋은 밤입니다.",
      "나를 있는 그대로 존중해 주고 배울 점이 많은 성숙한 인연과 가까워지기 좋은 기운입니다.",
    ],
    careerPool: [
      "공부, 자격 준비, 연구, 기획서 검토, 계약 체결에 최상의 집중력이 따릅니다. 한 번 더 읽고 숙고한 판단이 결정적인 신의 한 수가 됩니다.",
      "혼자 애쓰기보다 선배나 상사에게 정중히 자문을 구해 보세요. 흔쾌히 핵심 노하우를 내어줄 것입니다.",
    ],
    healthPool: [
      "몸과 마음의 회복력이 좋아지는 치유의 날입니다. 푹 자고 따뜻한 음식을 챙겨 먹는 것만으로도 묵은 피로가 눈 녹듯 풀립니다.",
      "생각이 깊어지는 밤에는 스마트폰을 잠시 멀리하고 잔잔한 차 향기와 함께 일찍 잠자리에 들면 내일 아침이 놀랍도록 상쾌합니다.",
    ],
  },
};

const MORNING_FLOWS = [
  "머리가 맑게 개는 시간대입니다. 오늘 꼭 해내야 할 핵심 일과 한두 가지를 오전에 먼저 착수하면 하루 전체가 순조롭게 굴러갑니다.",
  "차분히 일정을 점검하고 책상 주변을 정돈하기 좋습니다. 오전에 건네는 밝은 첫인사가 하루 종일 좋은 대인운을 불러옵니다.",
  "서두르기보다 따뜻한 물이나 차 한 잔으로 몸을 깨우며 천천히 시동을 걸어 보세요. 문서 확인과 연락 정리에 길합니다.",
  "직관과 집중력이 또렷이 살아나는 아침입니다. 미루어 두었던 결정이나 중요한 메시지 발송은 오전 시간을 활용해 보세요.",
];

const AFTERNOON_FLOWS = [
  "대화와 협력의 기운이 가장 활발해지는 시간입니다. 미팅이나 상의할 안건이 있다면 오후 2시~4시 무렵에 원만한 합의가 이루어집니다.",
  "오전에 뿌려 둔 수고가 서서히 윤곽을 드러냅니다. 잠시 걸음이 더뎌지는 듯해도 흐름을 믿고 꾸준히 페이스를 유지하세요.",
  "반가운 소식이나 유용한 정보가 들어오기 좋은 오후입니다. 스쳐 지나가는 아이디어도 짧게 메모해 두면 요긴하게 쓰입니다.",
  "실무 능률이 오르는 시간이지만 오후 늦게 가벼운 피로감이 스칠 수 있으니 5분 정도 창밖을 보며 숨을 고르면 좋습니다.",
];

const EVENING_FLOWS = [
  "하루의 긴장을 내려놓고 온전한 평안을 누릴 시간입니다. 가까운 사람과의 오붓한 저녁 식사나 다정한 통화가 마음을 채워 줍니다.",
  "낮 동안의 분주함을 갈무리하고 나만의 고요한 시간을 갖기에 좋습니다. 내일 일정을 가볍게 적어 두고 일찍 쉼에 드세요.",
  "감수성과 영감이 깊어지는 밤입니다. 좋아하는 음악이나 책 한 구절, 따뜻한 차 한 잔이 내일의 새로운 행운을 길어 올립니다.",
  "오늘 해낸 일들을 스스로 다독여 주세요. 밤늦은 고민은 접어둘수록 내일 아침 훨씬 명쾌한 답으로 돌아옵니다.",
];

const CAUTION_TIPS = [
  "급한 일일수록 말끝을 부드럽게 맺으면 모든 마찰이 복으로 바뀝니다.",
  "남의 속도와 나를 비교하지 말고 내 호흡대로 걸으면 가장 알찬 하루가 됩니다.",
  "오후 늦게 피로할 때 내리는 즉흥 결정만 내일 아침으로 미루면 만사가 태평합니다.",
  "작은 약속 시간 5분 일찍 도착하는 여유가 오늘 최고의 귀인을 부릅니다.",
  "완벽하려는 긴장을 반 스푼만 덜어내면 오히려 실력이 배로 빛납니다.",
];

const MASTER_QUOTES = [
  "찻잎이 뜨거운 물을 만나 제 향기를 내어놓듯, 오늘 당신이 들인 정성은 머지않아 깊은 향기로 돌아올 것입니다.",
  "달이 차고 기우는 것에도 저마다의 때가 있으니, 오늘의 걸음을 믿고 평안히 나아가시길 바랍니다.",
  "대나무가 바람에 흔들릴지언정 뿌리는 더욱 단단해지듯, 오늘 하루도 당신의 내공이 고요히 깊어지는 날입니다.",
  "맑은 찻잔에 비친 하늘처럼 마음의 물결을 고요히 두면, 가장 좋은 길이 스스로 모습을 드러낼 것입니다.",
  "좋은 시절의 씨앗은 언제나 평범한 하루의 미소 속에 숨어 있습니다. 오늘도 따스하고 복된 하루 보내십시오.",
];

/**
 * 결정론적 문자열 해시 (같은 날 + 같은 조건이면 일관된 점괘 보장)
 */
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickBySeed(arr, seed, salt = 0) {
  const idx = hashSeed(`${seed}:${salt}`) % arr.length;
  return arr[idx];
}

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
    elementKey: stem.elementKey,
    zodiac,
    stem,
  };
}

/**
 * 그레고리력 날짜(년, 월, 일)로 60갑자 일주(日柱) / 일진 계산
 * 기준일: 2000-01-01 = 戊午日 (index 54)
 */
function calculateDayGanji(year, month, day) {
  const utcTarget = Date.UTC(year, month - 1, day);
  const utcBase = Date.UTC(2000, 0, 1);
  const diffDays = Math.round((utcTarget - utcBase) / 86400000);
  const index60 = ((54 + diffDays) % 60 + 60) % 60;
  const stem = HEAVENLY_STEMS[index60 % 10];
  const zodiac = CHINESE_ZODIAC[index60 % 12];
  return {
    index60,
    ko: `${stem.ko}${zodiac.branch}일`,
    pillarKo: `${stem.ko}${zodiac.branch}일주`,
    hanja: `${stem.hanja}${zodiac.hanja}日`,
    element: stem.element,
    elementKey: stem.elementKey,
    colorAnimal: `${stem.colorName} ${zodiac.animal}`,
    stem,
    zodiac,
  };
}

/**
 * 오행 상생·상극 관계 판정 (일간 meElement vs 일진 todayElement)
 */
function resolveTenGodRelation(meElement, todayElement) {
  const order = ["wood", "fire", "earth", "metal", "water"];
  const m = order.indexOf(meElement);
  const t = order.indexOf(todayElement);
  if (m === -1 || t === -1) return "resource";
  const diff = (t - m + 5) % 5;
  if (diff === 0) return "companion";   // 비겁 (동일 오행)
  if (diff === 1) return "output";      // 식상 (내가 생함)
  if (diff === 2) return "wealthStar";  // 재성 (내가 극함)
  if (diff === 3) return "honor";       // 관성 (나를 극함)
  return "resource";                    // 인성 (나를 생함)
}

/**
 * 보완하면 좋은 개운 오행 선정 (일간을 생해주거나 조율하는 오행)
 */
function pickLuckyElementKey(meElement, relationKey, seed) {
  const order = ["wood", "fire", "earth", "metal", "water"];
  const m = order.indexOf(meElement);
  if (m === -1) return "wood";
  // 비겁/식상이면 설기·조율 기운, 관성/재성이면 인성(나를 돕는 오행), 인성이면 식상/재성 활력 기운
  if (relationKey === "honor" || relationKey === "wealthStar") {
    return order[(m + 4) % 5]; // 인성 오행
  }
  if (relationKey === "companion") {
    return order[(m + 1) % 5]; // 식상 오행
  }
  return hashSeed(`${seed}:el`) % 2 === 0 ? order[(m + 4) % 5] : order[(m + 2) % 5];
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
 * 고민 키워드 및 집중 분야 맞춤 문단 생성
 */
function buildConcernTailoredParagraph(profile, relationInfo) {
  const concern = (profile.userConcern || "").trim();
  const focus = profile.focusTopic || "종합 대운 전체";
  const name = profile.userName || "귀인";

  if (concern) {
    if (/(이직|취업|면접|승진|직장|회사|퇴사|사업)/.test(concern)) {
      return `특히 마음에 두고 계신 "${concern}" 문제에 있어서는 ${relationInfo.name.split("·")[0].trim()}의 기운이 든든히 받쳐 주고 있습니다. 조건과 명분을 차분히 대조해 보되, 당신이 그동안 쌓아온 실무 내공을 당당히 드러내면 원하는 방향으로 문이 열릴 것입니다.`;
    }
    if (/(연애|연락|재회|결혼|짝사랑|썸|남자|여자|사람|인연|고백)/.test(concern)) {
      return `마음에 품으신 "${concern}"에 관해서는 조급하게 답을 재촉하기보다 상대가 편안히 다가올 여백을 남겨두는 것이 묘수입니다. 오늘 오후 무렵 건네는 담백하고 따뜻한 한마디가 막혔던 감정의 물꼬를 부드럽게 터줄 것입니다.`;
    }
    if (/(돈|금전|재물|주식|투자|매매|계약|부동산|장사|매출)/.test(concern)) {
      return `살피고 계신 "${concern}" 흐름에서는 분위기에 휩쓸리는 성급한 베팅보다 문서와 숫자를 한 번 더 짚어보는 침착함이 천금을 지킵니다. 실속 있는 선택을 택하면 기대 이상의 알찬 결실이 손안에 남습니다.`;
    }
    if (/(시험|합격|공부|자격증|발표|학업)/.test(concern)) {
      return `준비하고 계신 "${concern}"에는 오늘 맑은 문서와 집중의 별이 비추고 있습니다. 새로운 것을 무리하게 넓히기보다 이미 익힌 핵심을 차분히 갈무리하면 실전에서 평소 이상의 기량이 발휘됩니다.`;
    }
    return `또한 마음에 담아두신 "${concern}"에 대해서는 오늘 ${name}님의 타고난 ${profile.dayMaster.stem.trait}을 믿고 순리대로 한 걸음씩 짚어 나가시길 권합니다. 서두름만 한 겹 덜어내면 오후로 갈수록 훨씬 명쾌한 해답이 보일 것입니다.`;
  }

  const focusMap = {
    "재물·금전·투자": "특히 오늘 살피시는 재물 흐름에서는 작은 새는 구멍을 먼저 점검할 때 뜻밖의 목돈과 실속이 함께 모이는 형국입니다.",
    "연애·인연·결혼": "특히 인연운에 있어서는 꾸밈없는 진심과 부드러운 경청이 상대의 마음을 깊이 움직이는 열쇠가 되어 줍니다.",
    "직장·이직·사업": "특히 일과 성취 면에서는 우선순위를 명확히 세우고 마무리를 단정히 챙길수록 주변의 두터운 신임이 모입니다.",
    "학업·시험·합격": "특히 학업과 문서 흐름에서는 오전에 맑은 집중력이 크게 오르니 핵심 과제를 먼저 공략해 보시기 바랍니다.",
    "건강·마음의 평온": "특히 컨디션 면에서는 몸의 속도를 반 박자 늦추고 따뜻한 차와 호흡으로 심신을 덥혀 줄 때 기운이 맑게 차오릅니다.",
  };
  return focusMap[focus] || "작은 배려 한마디와 정갈한 마무리가 오늘 하루 뜻밖의 귀인과 복록을 부르는 마중물이 되어줄 것입니다.";
}

/**
 * 12띠 개별 오늘의 운세 생성기
 */
function generateZodiacReading(zodiacObj, todayInfo) {
  const seed = `${todayInfo.isoDate}:zodiac:${zodiacObj.id}`;
  const todayBranchRelation = resolveTenGodRelation(zodiacObj.elementKey, todayInfo.dayGanji.elementKey);
  const relProfile = TEN_GOD_PROFILES[todayBranchRelation];

  const openings = [
    `오늘 ${todayInfo.dayGanji.ko}(${todayInfo.dayGanji.hanja})을 맞은 ${zodiacObj.label}에게는 '${relProfile.name.split("·")[1].trim()}'이 은은하게 감도는 하루입니다.`,
    `${zodiacObj.hanja}支(${zodiacObj.label})의 타고난 오행이 오늘 일진과 만나 차분한 도약의 발판을 마련하는 날입니다.`,
    `오늘 ${zodiacObj.label}의 문 앞에는 성실함이 곧 보람으로 바뀌는 맑은 일진이 자리하고 있습니다.`,
  ];
  const middles = [
    "오전에는 주변의 이야기를 넉넉한 마음으로 경청하며 내실을 다지고, 오후에 찾아오는 실무적 기회나 제안을 기민하게 붙잡으면 알찬 성과가 남습니다.",
    "미루어 두었던 연락이나 작은 정리를 매듭짓기에 더없이 좋으며, 가까운 사람과의 식사나 차담 자리에서 귀한 힌트를 얻게 됩니다.",
    "서둘러 결론을 내리기보다 돌다리를 한 번 두드리는 여유를 가질 때 재물과 대인관계 모두 평온하게 순항합니다.",
    "묵묵히 자리를 지켜온 수고가 빛을 발하니 윗사람이나 동료로부터 기분 좋은 인정과 협조를 얻기 수월한 흐름입니다.",
  ];
  const closings = [
    `대표 생년(${zodiacObj.yearsHint}년생) 모두 작은 약속을 소중히 챙길수록 저녁 무렵 훈훈한 미소가 번질 것입니다.`,
    "가벼운 산책으로 기운을 환기하면 오후의 행운 지수가 한층 더 높아집니다.",
    "내 목소리를 낮추고 온화한 미소를 띠면 생각지 못한 곳에서 도움의 손길이 닿습니다.",
  ];

  return {
    title: `${zodiacObj.label} (${zodiacObj.hanja}支) 오늘의 운세`,
    content: `${pickBySeed(openings, seed, 1)} ${pickBySeed(middles, seed, 2)} ${pickBySeed(closings, seed, 3)}`,
    harmony_zodiac: zodiacObj.harmony,
  };
}

/**
 * 12별자리 개별 오늘의 운세 생성기
 */
function generateStarReading(starObj, todayInfo) {
  const seed = `${todayInfo.isoDate}:star:${starObj.id}`;
  const lines1 = [
    `${starObj.element}의 기운을 품은 ${starObj.name}에게 오늘은 ${starObj.trait}이 유난히 돋보이는 하루입니다.`,
    `오늘 밤하늘의 흐름 속에서 ${starObj.name}(${starObj.range})에는 맑은 영감과 정서적 안정이 나란히 찾아옵니다.`,
    `${starObj.name} 특유의 섬세한 안목이 일상의 작은 행운을 정확히 포착해 내는 기분 좋은 날입니다.`,
  ];
  const lines2 = [
    "스쳐 지나가는 아이디어나 문득 떠오른 안부 인사를 미루지 말고 실천해 보세요. 작은 연결 고리가 반가운 기회로 이어집니다.",
    "복잡해 보이던 일도 우선순위대로 하나씩 매듭지으면 오후부터는 한결 여유로운 나만의 시간을 누릴 수 있습니다.",
    "내면의 감각이 정교해지는 날이니 중요한 선택 앞에서는 남들의 시선보다 내 마음이 편안한 쪽을 택하는 것이 정답입니다.",
  ];
  const keywords = [
    "영감의 메모 · 따뜻한 차 한 잔",
    "다정한 안부 인사 · 정갈한 정돈",
    "부드러운 미소 · 오후의 산책",
    "차분한 경청 · 기분 좋은 소식",
    "여유로운 호흡 · 알찬 마무리",
  ];

  return {
    title: `${starObj.name} (${starObj.range}) 오늘의 별빛`,
    content: `${pickBySeed(lines1, seed, 11)} ${pickBySeed(lines2, seed, 12)}`,
    lucky_keyword: pickBySeed(keywords, seed, 13),
  };
}

/**
 * 종합 사주·띠·별자리 정통 명리 점괘 생성기
 */
function generateMasterFortune(profile, todayInfo) {
  const seed = [
    todayInfo.isoDate,
    profile.birthDate,
    profile.calendarType,
    profile.birthTime,
    profile.gender,
    profile.focusTopic || "",
    profile.userConcern || "",
  ].join("|");

  const meStem = profile.dayMaster.stem;
  const relationKey = resolveTenGodRelation(meStem.elementKey, todayInfo.dayGanji.elementKey);
  const rel = TEN_GOD_PROFILES[relationKey];

  const baseScore = 76 + rel.baseBoost + (hashSeed(`${seed}:score`) % 11); // 80 ~ 95점 분포
  const overallScore = Math.min(98, Math.max(74, baseScore));

  const idiom = pickBySeed(rel.idioms, seed, 1);
  const headline = pickBySeed(rel.headlines, seed, 2);
  const opening = pickBySeed(rel.openings, seed, 3);

  const timeNote =
    profile.birthTime && profile.birthTime !== "모름"
      ? `${profile.birthTime.split(" ")[0]}의 기운까지 고루 갈무리된 `
      : "";

  const pillarIntro =
    `${profile.userName}님은 사주 본원상 '${meStem.nature}'을 뜻하는 ${profile.dayMaster.pillarKo}(${profile.dayMaster.hanja})와 ` +
    `${profile.yearGanji.ganjiKo}(${profile.yearGanji.colorAnimal}띠)의 기품을 함께 지니고 계십니다. ` +
    `${timeNote}당신의 ${meStem.element} 기운이 오늘 ${todayInfo.dayGanji.ko}(${todayInfo.dayGanji.hanja}) 일진과 만나 '${rel.name}'을 이루었습니다.`;

  const concernParagraph = buildConcernTailoredParagraph(profile, rel);

  const wealthScore = Math.min(99, Math.max(70, overallScore + ((hashSeed(`${seed}:w`) % 13) - 6)));
  const loveScore = Math.min(99, Math.max(70, overallScore + ((hashSeed(`${seed}:l`) % 13) - 5)));
  const careerScore = Math.min(99, Math.max(72, overallScore + ((hashSeed(`${seed}:c`) % 13) - 4)));
  const healthScore = Math.min(98, Math.max(70, overallScore + ((hashSeed(`${seed}:h`) % 11) - 5)));

  const luckyElKey = pickLuckyElementKey(meStem.elementKey, relationKey, seed);
  const prescriptionPool = ELEMENT_PRESCRIPTIONS[luckyElKey];

  return {
    relation_badge: rel.name,
    overall_score: overallScore,
    idiom_hanja: idiom.hanja,
    idiom_meaning: idiom.meaning,
    headline: `${profile.userName}님, ${headline}`,
    overall_reading: `${pillarIntro}\n\n${opening}\n\n${concernParagraph}`,
    categories: {
      wealth: {
        score: wealthScore,
        title: "재물·금전운",
        advice: pickBySeed(rel.wealthPool, seed, 21),
      },
      love: {
        score: loveScore,
        title: "연애·인연운",
        advice: pickBySeed(rel.lovePool, seed, 22),
      },
      career: {
        score: careerScore,
        title: "직장·학업·성취운",
        advice: pickBySeed(rel.careerPool, seed, 23),
      },
      health: {
        score: healthScore,
        title: "건강·컨디션운",
        advice: pickBySeed(rel.healthPool, seed, 24),
      },
    },
    time_flow: {
      morning: pickBySeed(MORNING_FLOWS, seed, 31),
      afternoon: pickBySeed(AFTERNOON_FLOWS, seed, 32),
      evening: pickBySeed(EVENING_FLOWS, seed, 33),
    },
    lucky_prescription: {
      color: pickBySeed(prescriptionPool.colors, seed, 41),
      numbers: pickBySeed(prescriptionPool.numbers, seed, 42),
      direction: pickBySeed(prescriptionPool.directions, seed, 43),
      item_or_tea: pickBySeed(prescriptionPool.teas, seed, 44),
      caution_tip: pickBySeed(CAUTION_TIPS, seed, 45),
    },
    zodiac_reading: generateZodiacReading(profile.yearGanji.zodiac, todayInfo),
    star_reading: generateStarReading(profile.starSign, todayInfo),
    master_quote: pickBySeed(MASTER_QUOTES, seed, 51),
  };
}

/**
 * 수묵 타로 패 심층 풀이 생성기 (1장 / 3장 배열 지원)
 */
function generateMasterTarotReading({ drawnCards, question, profile, todayInfo }) {
  const name = profile?.userName || "귀인";
  const qText = (question || "").trim();
  const paragraphs = [];

  if (qText) {
    paragraphs.push(
      `${name}님께서 마음속에 품고 물으신 "${qText}"에 대하여, 오늘(${todayInfo.dayGanji.ko}) 다실의 찻상 위에 놓인 수묵 패의 흐름을 읽어 드립니다.`
    );
  } else {
    paragraphs.push(
      `오늘 ${todayInfo.dayGanji.ko}(${todayInfo.dayGanji.hanja})의 기운 속에서 ${name}님의 손끝이 이끌린 패에는 지금 꼭 새겨두어야 할 분명한 상징이 담겨 있습니다.`
    );
  }

  for (const c of drawnCards) {
    const dirLabel = c.isReversed ? "역방향(逆)" : "정방향(正)";
    const story = c.isReversed ? c.storyRev : c.storyUp;
    paragraphs.push(`【${c.positionTitle} — ${c.no}. ${c.name} · ${dirLabel}】\n${story}`);
  }

  if (drawnCards.length === 1) {
    const c = drawnCards[0];
    const advice = c.isReversed
      ? `이 한 장의 패가 전하는 오늘의 요체는 '속도보다 방향의 조율'입니다. 억지로 힘을 주기보다 한 걸음 물러서서 호흡을 가다듬을 때 오히려 가장 순탄한 길이 열릴 것입니다.`
      : `이 한 장의 패가 전하는 오늘의 요체는 '순리를 믿고 나아가는 담대함'입니다. 이미 좋은 흐름이 발밑에 와 있으니 망설임 없이 오늘의 정성을 보태어 보시기 바랍니다.`;
    paragraphs.push(advice);
  } else {
    const reversedCount = drawnCards.filter((c) => c.isReversed).length;
    if (reversedCount === 0) {
      paragraphs.push(
        `세 장의 패가 모두 정방향으로 가지런히 놓인 것은 드문 길조(吉兆)입니다. 지나온 노력이 헛되지 않아 현재의 탄탄한 기운으로 이어지고 있으며, 마지막 조언 패가 가리키는 대로 자신 있게 마무리를 지으시면 넉넉한 보람을 거두실 것입니다.`
      );
    } else if (reversedCount === 3) {
      paragraphs.push(
        `세 장 모두 역방향으로 놓인 것은 결코 나쁜 징조가 아니라, '지금 잠시 숨을 고르며 매듭을 다시 묶으라'는 다정한 경책입니다. 무리한 추진보다 점검과 휴식을 택하면 잔파도를 무사히 넘기고 새 국면을 맞이하게 됩니다.`
      );
    } else {
      const last = drawnCards[drawnCards.length - 1];
      paragraphs.push(
        `흐름과 현재를 지나 마지막 조언 자리에 놓인 '${last.name}' 패를 특히 눈여겨보시기 바랍니다. "${last.isReversed ? last.reversed : last.upright}"의 태도를 오늘 하루의 등불로 삼으신다면, 고민하시던 사안이 한결 평안하고 지혜롭게 풀려 나갈 것입니다.`
      );
    }
  }

  return paragraphs.join("\n\n");
}

/**
 * 주인장과의 1:1 차담 응답 생성기 (질문 의도 + 사주 일간·십성 + 뽑은 타로 맥락 반영)
 */
function generateMasterChatReply({ question, profile, fortune, drawnCards, todayInfo }) {
  const name = profile?.userName || "귀인";
  const q = question.trim();
  const seed = `${todayInfo.isoDate}:${q}:${drawnCards.length}`;

  const pillarHint = profile
    ? `${name}님의 타고난 ${profile.dayMaster.pillarKo}(${profile.dayMaster.stem.element}) 기운과 오늘 ${todayInfo.dayGanji.ko} 일진을 함께 짚어보면, `
    : `오늘 ${todayInfo.dayGanji.ko}(${todayInfo.dayGanji.hanja})의 일진 흐름을 가만히 살펴보면, `;

  const tarotAddon =
    drawnCards && drawnCards.length > 0
      ? `\n\n아울러 아까 찻상에서 뽑으신 '${drawnCards[drawnCards.length - 1].name}' 패 역시 "${drawnCards[drawnCards.length - 1].isReversed ? drawnCards[drawnCards.length - 1].reversed : drawnCards[drawnCards.length - 1].upright}"의 지혜를 함께 일러주고 있으니 마음에 새겨 두시면 든든할 것입니다.`
      : "";

  let body = "";

  if (/(금전|돈|재물|투자|주식|매수|매도|소비|지출|계약|로또|복권|운수)/.test(q)) {
    const wScore = fortune?.categories?.wealth?.score || 86;
    const tips = [
      `오늘 금전 기운(${wScore}점 흐름)은 '지키는 지혜 끝에 실속이 붙는 형국'입니다. 확실히 검토된 실용적 지출이나 정산은 오늘 진행하셔도 좋으나, 남의 말에 휩쓸리는 급한 결정은 하루만 더 묵혀 보시는 편이 훨씬 이롭습니다.`,
      `재물의 물길은 잔잔하고 안정적입니다. 큰 욕심을 부리기보다 새어 나가는 고정 지출을 다듬고 문서를 꼼꼼히 챙기시면 뜻밖의 알찬 이익이 손안에 남습니다. 행운 숫자인 '${fortune?.lucky_prescription?.numbers || "3, 8"}'도 가볍게 참고해 보세요.`,
    ];
    body = `${pillarHint}${pickBySeed(tips, seed, 1)}`;
  } else if (/(연애|사랑|인연|연락|재회|썸|남편|아내|배우자|친구|인간관계|다툼|화해|말투)/.test(q)) {
    const tips = [
      `사람과 인연의 문제는 이기려 하기보다 먼저 따뜻한 차 한 잔을 내어주듯 여백을 둘 때 스르륵 풀립니다. 오늘은 잘잘못을 따지는 긴 설명보다 짧고 다정한 안부나 공감 한마디가 백 마디 설득보다 큰 힘을 발휘합니다.`,
      `오늘 대인·연애 흐름에서는 '부드러운 경청'이 최고의 비책입니다. 내 마음을 솔직하고 담백하게 전하되 상대의 대답을 재촉하지 않으시면, 오후에서 저녁 사이 훨씬 온화한 교감이 오갈 것입니다.`,
    ];
    body = `${pillarHint}${pickBySeed(tips, seed, 2)}`;
  } else if (/(이직|직장|회사|업무|상사|면접|시험|합격|공부|발표|사업|창업|진로)/.test(q)) {
    const tips = [
      `일과 성취 면에서는 그동안 묵묵히 다져온 기본기가 든든히 빛을 발하는 때입니다. 가지를 너무 넓게 벌리기보다 가장 중요한 핵심 과제 하나를 정갈하게 완수하시면 윗사람과 주변의 평가가 자연히 따라옵니다.`,
      `중요한 보고나 시험·논의는 머리가 맑은 오전이나 협조운이 열리는 오후 2시~4시 무렵을 활용해 보세요. 준비하신 바를 차분한 어조로 조목조목 펼치시면 충분히 좋은 결과를 거두실 수 있습니다.`,
    ];
    body = `${pillarHint}${pickBySeed(tips, seed, 3)}`;
  } else if (/(건강|잠|수면|피로|스트레스|불안|마음|컨디션|운동|음식)/.test(q)) {
    body = `${pillarHint}오늘은 몸을 몰아붙이기보다 긴장된 어깨와 눈의 피로를 덜어주는 것이 먼저입니다. ${fortune?.lucky_prescription?.item_or_tea || "따뜻한 작설차"} 한 잔으로 속을 데우시고, 저녁에는 생각을 잠시 내려놓은 채 가벼운 산책으로 호흡을 고르시면 기운이 맑게 돌아옵니다.`;
  } else if (/(시간|언제|루틴|방향|색|뭐|어떻게)/.test(q)) {
    body = `${pillarHint}오늘은 오전에 핵심 일과를 먼저 정돈하고, 오후 2시~4시 사이에 대화나 협의를 나누며, 저녁에는 온전한 휴식으로 마무리하는 흐름이 가장 길합니다. '${fortune?.lucky_prescription?.direction || "동남쪽"}' 방향과 '${fortune?.lucky_prescription?.color || "청자 비취색"}' 소품을 곁에 두시면 더욱 상서로운 기운이 따릅니다.`;
  } else {
    const general = [
      `물으신 말씀 속에는 이미 스스로 답을 알고 계신 신중함이 느껴집니다. 억지로 물살을 거스르기보다 오늘의 사자성어(${fortune?.idiom_hanja || "水到渠成"})처럼 지금 할 수 있는 작은 정성 하나를 차분히 놓으시면, 나머지 길은 순리가 알아서 열어줄 것입니다.`,
      `조급함만 한 스푼 덜어내시면 크게 염려하실 일이 없습니다. 당신이 지닌 본연의 성실함과 안목을 믿고 한 걸음씩 짚어 나가시되, 결정이 망설여질 때는 가장 마음이 평안해지는 쪽을 택하시기 바랍니다.`,
    ];
    body = `${pillarHint}${pickBySeed(general, seed, 9)}`;
  }

  return `${body}${tarotAddon}`;
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
  generateZodiacReading,
  generateStarReading,
  generateMasterFortune,
  generateMasterTarotReading,
  generateMasterChatReply,
};

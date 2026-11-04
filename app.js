/**
 * 월하다원 (月下茶園) — 메인 애플리케이션 로직
 * Gemini Interactions API (gemini-3.8-flash / gemini-4-argon) 연동
 */

(() => {
  const {
    CHINESE_ZODIAC,
    STAR_SIGNS,
    MAJOR_ARCANA,
    calculateYearGanji,
    calculateDayGanji,
    calculateStarSign,
    resolveColorHex,
    buildSampleFortune,
  } = window.FortuneData;

  const STORAGE_KEYS = {
    API_KEY: "wolha_gemini_api_key",
    THEME: "wolha_theme_mode",
    PROFILE: "wolha_last_profile",
    CACHED_FORTUNE: "wolha_today_fortune_cache",
  };

  // Gemini Structured Output JSON Schema (Interactions API 호환 서브셋 준수)
  const COMPREHENSIVE_FORTUNE_SCHEMA = {
    type: "object",
    properties: {
      overall_score: {
        type: "integer",
        minimum: 55,
        maximum: 99,
        description: "오늘의 종합 운세 점수 (55~99 사이 정수)",
      },
      idiom_hanja: {
        type: "string",
        description: "오늘의 기운을 상징하는 사자성어 한자 4글자 (예: 水到渠成, 雲外蒼天)",
      },
      idiom_meaning: {
        type: "string",
        description: "사자성어의 한글 독음과 뜻풀이 (예: 수도거성 · 물이 흐르면 자연스레 도랑이 이루어진다)",
      },
      headline: {
        type: "string",
        description: "오늘의 핵심 운세를 품격 있게 요약한 한 문장",
      },
      overall_reading: {
        type: "string",
        description: "생년월일 오행·일진·고민을 반영한 2~3문단의 깊이 있고 따뜻한 오늘의 종합 총운 풀이",
      },
      categories: {
        type: "object",
        properties: {
          wealth: {
            type: "object",
            properties: {
              score: { type: "integer", minimum: 50, maximum: 100 },
              title: { type: "string" },
              advice: { type: "string", description: "재물·금전 흐름과 구체적인 소비·관리 조언" },
            },
            required: ["score", "title", "advice"],
          },
          love: {
            type: "object",
            properties: {
              score: { type: "integer", minimum: 50, maximum: 100 },
              title: { type: "string" },
              advice: { type: "string", description: "연애·부부·대인관계 인연운 조언" },
            },
            required: ["score", "title", "advice"],
          },
          career: {
            type: "object",
            properties: {
              score: { type: "integer", minimum: 50, maximum: 100 },
              title: { type: "string" },
              advice: { type: "string", description: "직장·사업·학업·성취운 조언" },
            },
            required: ["score", "title", "advice"],
          },
          health: {
            type: "object",
            properties: {
              score: { type: "integer", minimum: 50, maximum: 100 },
              title: { type: "string" },
              advice: { type: "string", description: "건강·컨디션·마음 챙김 조언" },
            },
            required: ["score", "title", "advice"],
          },
        },
        required: ["wealth", "love", "career", "health"],
      },
      time_flow: {
        type: "object",
        properties: {
          morning: { type: "string", description: "오전(진시~오시) 기운과 조언" },
          afternoon: { type: "string", description: "오후(미시~신시) 기운과 조언" },
          evening: { type: "string", description: "저녁·밤(유시~해시) 기운과 조언" },
        },
        required: ["morning", "afternoon", "evening"],
      },
      lucky_prescription: {
        type: "object",
        properties: {
          color: { type: "string", description: "전통 감성의 행운 색상명 (예: 청자 비취색, 송화 황금색, 홍매색)" },
          numbers: { type: "string", description: "행운의 숫자 2개 (예: 3, 8)" },
          direction: { type: "string", description: "오늘의 길방 (예: 동남쪽)" },
          item_or_tea: { type: "string", description: "오늘 기운을 북돋는 차(茶)나 음식·소품" },
          caution_tip: { type: "string", description: "오늘 하루 가볍게 유의하면 좋을 한 줄 처방" },
        },
        required: ["color", "numbers", "direction", "item_or_tea", "caution_tip"],
      },
      zodiac_reading: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string", description: "해당 띠의 오늘의 운세 풀이 (3~4문장)" },
          harmony_zodiac: { type: "string", description: "오늘 합이 잘 맞는 귀인 띠" },
        },
        required: ["title", "content", "harmony_zodiac"],
      },
      star_reading: {
        type: "object",
        properties: {
          title: { type: "string" },
          content: { type: "string", description: "해당 별자리의 오늘의 운세 풀이 (3~4문장)" },
          lucky_keyword: { type: "string", description: "별자리 행운 키워드" },
        },
        required: ["title", "content", "lucky_keyword"],
      },
      master_quote: {
        type: "string",
        description: "월하다원 주인장이 건네는 다정하고 시적인 마무리 덕담 한마디",
      },
    },
    required: [
      "overall_score",
      "idiom_hanja",
      "idiom_meaning",
      "headline",
      "overall_reading",
      "categories",
      "time_flow",
      "lucky_prescription",
      "zodiac_reading",
      "star_reading",
      "master_quote",
    ],
  };

  const state = {
    serverAvailable: false,
    serverHasEnvKey: false,
    today: getTodayMetadata(),
    currentProfile: null,
    currentFortune: null,
    tarotSpreadCount: 1,
    tarotDeckSample: [],
    drawnTarotCards: [],
    chatHistory: [],
  };

  // DOM 참조
  const el = {
    todayDisplay: document.getElementById("todayDisplay"),
    themeToggleBtn: document.getElementById("themeToggleBtn"),
    themeIcon: document.getElementById("themeIcon"),
    themeLabel: document.getElementById("themeLabel"),
    openApiModalBtn: document.getElementById("openApiModalBtn"),
    apiStatusDot: document.getElementById("apiStatusDot"),
    apiStatusText: document.getElementById("apiStatusText"),

    fortuneForm: document.getElementById("fortuneForm"),
    userName: document.getElementById("userName"),
    birthDate: document.getElementById("birthDate"),
    calendarType: document.getElementById("calendarType"),
    birthTime: document.getElementById("birthTime"),
    gender: document.getElementById("gender"),
    modelSelect: document.getElementById("modelSelect"),
    userConcern: document.getElementById("userConcern"),
    derivedBadges: document.getElementById("derivedBadges"),
    generateFortuneBtn: document.getElementById("generateFortuneBtn"),
    sampleFortuneBtn: document.getElementById("sampleFortuneBtn"),

    tabs: Array.from(document.querySelectorAll(".tab-btn")),
    panels: {
      overview: document.getElementById("panel-overview"),
      zodiac: document.getElementById("panel-zodiac"),
      tarot: document.getElementById("panel-tarot"),
      chat: document.getElementById("panel-chat"),
    },

    loadingBox: document.getElementById("loadingBox"),
    loadingTitle: document.getElementById("loadingTitle"),
    loadingSub: document.getElementById("loadingSub"),
    errorBanner: document.getElementById("errorBanner"),
    errorMessage: document.getElementById("errorMessage"),
    errorOpenKeyBtn: document.getElementById("errorOpenKeyBtn"),
    dismissErrorBtn: document.getElementById("dismissErrorBtn"),

    emptyOverviewState: document.getElementById("emptyOverviewState"),
    overviewResultContainer: document.getElementById("overviewResultContainer"),
    resultUserMeta: document.getElementById("resultUserMeta"),
    copyFortuneBtn: document.getElementById("copyFortuneBtn"),
    scoreCircle: document.getElementById("scoreCircle"),
    overallScore: document.getElementById("overallScore"),
    fortuneIdiom: document.getElementById("fortuneIdiom"),
    fortuneHeadline: document.getElementById("fortuneHeadline"),
    fortuneSummary: document.getElementById("fortuneSummary"),
    categoryGrid: document.getElementById("categoryGrid"),
    timeFlowList: document.getElementById("timeFlowList"),
    luckyPrescriptionList: document.getElementById("luckyPrescriptionList"),
    masterAdvice: document.getElementById("masterAdvice"),

    myZodiacIcon: document.getElementById("myZodiacIcon"),
    myZodiacTitle: document.getElementById("myZodiacTitle"),
    myZodiacBody: document.getElementById("myZodiacBody"),
    chineseZodiacGrid: document.getElementById("chineseZodiacGrid"),
    myStarIcon: document.getElementById("myStarIcon"),
    myStarTitle: document.getElementById("myStarTitle"),
    myStarBody: document.getElementById("myStarBody"),
    starSignGrid: document.getElementById("starSignGrid"),

    spreadOneBtn: document.getElementById("spreadOneBtn"),
    spreadThreeBtn: document.getElementById("spreadThreeBtn"),
    shuffleTarotBtn: document.getElementById("shuffleTarotBtn"),
    tarotQuestionInput: document.getElementById("tarotQuestionInput"),
    tarotGuideStatus: document.getElementById("tarotGuideStatus"),
    tarotDeckRow: document.getElementById("tarotDeckRow"),
    tarotReadingPanel: document.getElementById("tarotReadingPanel"),
    tarotDrawnSummary: document.getElementById("tarotDrawnSummary"),
    tarotAiInterpretation: document.getElementById("tarotAiInterpretation"),

    chatLog: document.getElementById("chatLog"),
    chatForm: document.getElementById("chatForm"),
    chatInput: document.getElementById("chatInput"),
    sendChatBtn: document.getElementById("sendChatBtn"),
    clearChatBtn: document.getElementById("clearChatBtn"),
    quickPrompts: document.getElementById("quickPrompts"),

    apiModal: document.getElementById("apiModal"),
    closeApiModalBtn: document.getElementById("closeApiModalBtn"),
    cancelApiModalBtn: document.getElementById("cancelApiModalBtn"),
    apiKeyForm: document.getElementById("apiKeyForm"),
    apiKeyInput: document.getElementById("apiKeyInput"),
    toggleKeyVisBtn: document.getElementById("toggleKeyVisBtn"),
    clearApiKeyBtn: document.getElementById("clearApiKeyBtn"),
    serverKeyNotice: document.getElementById("serverKeyNotice"),
    toast: document.getElementById("toast"),
  };

  function getTodayMetadata() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    const weekdays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    const weekday = weekdays[now.getDay()];
    const yearGanji = calculateYearGanji(y);
    const dayGanji = calculateDayGanji(y, m, d);
    const isoDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return {
      year: y,
      month: m,
      day: d,
      weekday,
      isoDate,
      yearGanji,
      dayGanji,
      formatted: `${y}년 ${m}월 ${d}일 ${weekday} · 일진 ${dayGanji.ko}(${dayGanji.hanja})`,
    };
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.hidden = false;
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
      el.toast.hidden = true;
    }, 2700);
  }

  function getStoredApiKey() {
    return (localStorage.getItem(STORAGE_KEYS.API_KEY) || "").trim();
  }

  function hasUsableApiKey() {
    return Boolean(getStoredApiKey() || state.serverHasEnvKey);
  }

  function updateApiStatusBadge() {
    const hasKey = hasUsableApiKey();
    el.apiStatusDot.classList.toggle("ready", hasKey);
    if (getStoredApiKey()) {
      el.apiStatusText.textContent = "Gemini 연동됨";
    } else if (state.serverHasEnvKey) {
      el.apiStatusText.textContent = "서버 열쇠 연동됨";
    } else {
      el.apiStatusText.textContent = "Gemini 열쇠 설정";
    }
    el.serverKeyNotice.hidden = !state.serverHasEnvKey;
  }

  async function detectBackendServer() {
    const host = window.location.hostname;
    const isLocalHost = host === "127.0.0.1" || host === "localhost";
    if (window.location.protocol === "file:" || !isLocalHost) {
      state.serverAvailable = false;
      updateApiStatusBadge();
      return;
    }
    try {
      const res = await fetch("/api/status", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        state.serverAvailable = true;
        state.serverHasEnvKey = Boolean(data.hasEnvKey);
      }
    } catch {
      state.serverAvailable = false;
    }
    updateApiStatusBadge();
  }

  /**
   * Gemini Interactions API 호출 (로컬 Python SDK 서버 우선 -> 브라우저 직접 REST 호출 폴백)
   */
  async function callGeminiInteraction({ model = "gemini-3.8-flash", systemInstruction, input, schema = null }) {
    const apiKey = getStoredApiKey();
    if (!apiKey && !state.serverHasEnvKey) {
      throw new Error("MISSING_API_KEY");
    }

    // 1) 로컬 Python 서버(/api/interact)가 켜져 있는 경우 google-genai SDK 경유
    if (state.serverAvailable) {
      const response = await fetch("/api/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKey || undefined,
          model,
          systemInstruction,
          input,
          schema,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Gemini API 호출 중 오류가 발생했습니다.");
      }
      return payload.outputText;
    }

    // 2) 정적 파일(file://) 등으로 직접 연 경우 공식 Gemini Interactions REST API 직접 호출
    const body = {
      model,
      system_instruction: systemInstruction,
      input,
      store: false,
    };
    if (schema) {
      body.response_format = {
        type: "text",
        mime_type: "application/json",
        schema,
      };
    }

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errMsg = data?.error?.message || `API 응답 오류 (HTTP ${response.status})`;
      throw new Error(errMsg);
    }

    // steps 배열에서 마지막 model_output 텍스트 추출
    let textOut = "";
    if (typeof data.output_text === "string") {
      textOut = data.output_text;
    } else if (Array.isArray(data.steps)) {
      for (const step of data.steps) {
        if (step.type === "model_output" && Array.isArray(step.content)) {
          for (const part of step.content) {
            if (part.type === "text" && typeof part.text === "string") {
              textOut += part.text;
            }
          }
        }
      }
    }
    if (!textOut) {
      throw new Error("모델 응답에서 텍스트를 추출하지 못했습니다.");
    }
    return textOut;
  }

  /**
   * 생년월일 입력값 기반 프로필 파싱 및 상단 배지 갱신
   */
  function parseUserProfile() {
    const rawDate = el.birthDate.value;
    if (!rawDate) return null;
    const [yStr, mStr, dStr] = rawDate.split("-");
    const year = Number(yStr);
    const month = Number(mStr);
    const day = Number(dStr);
    if (!year || !month || !day) return null;

    const yearGanji = calculateYearGanji(year);
    const starSign = calculateStarSign(month, day);

    return {
      userName: el.userName.value.trim() || "귀인",
      birthDate: rawDate,
      year,
      month,
      day,
      calendarType: el.calendarType.value,
      birthTime: el.birthTime.value,
      gender: el.gender.value,
      model: el.modelSelect.value,
      userConcern: el.userConcern.value.trim(),
      yearGanji,
      starSign,
    };
  }

  function updateDerivedBadges() {
    const profile = parseUserProfile();
    el.derivedBadges.textContent = "";

    if (!profile) {
      const span = document.createElement("span");
      span.className = "badge-tag subtle";
      span.textContent = "생년월일을 입력하면 띠·간지·별자리가 자동 계산됩니다";
      el.derivedBadges.appendChild(span);
      return;
    }

    const items = [
      { text: `${profile.yearGanji.zodiac.emoji} ${profile.yearGanji.ganjiKo} (${profile.yearGanji.colorAnimal}띠)`, cls: "badge-tag" },
      { text: `오행 ${profile.yearGanji.element}`, cls: "badge-tag jade" },
      { text: `${profile.starSign.emoji} ${profile.starSign.name}`, cls: "badge-tag" },
    ];

    for (const item of items) {
      const badge = document.createElement("span");
      badge.className = item.cls;
      badge.textContent = item.text;
      el.derivedBadges.appendChild(badge);
    }

    // 12띠·별자리 패널 하이라이트 동기화
    highlightZodiacButtons(profile.yearGanji.zodiac.id, profile.starSign.id);
  }

  function switchTab(tabName) {
    for (const btn of el.tabs) {
      const isMatch = btn.dataset.tab === tabName;
      btn.classList.toggle("active", isMatch);
      btn.setAttribute("aria-selected", String(isMatch));
    }
    for (const [key, panel] of Object.entries(el.panels)) {
      const isMatch = key === tabName;
      panel.hidden = !isMatch;
      panel.classList.toggle("active", isMatch);
    }
  }

  function showLoading(title, sub) {
    el.errorBanner.hidden = true;
    el.loadingTitle.textContent = title;
    el.loadingSub.textContent = sub;
    el.loadingBox.hidden = false;
  }

  function hideLoading() {
    el.loadingBox.hidden = true;
  }

  function showError(message) {
    el.errorMessage.textContent = message;
    el.errorBanner.hidden = false;
  }

  /**
   * 종합 운세 결과 화면 렌더링 (안전한 DOM API 사용)
   */
  function renderComprehensiveFortune(profile, fortune) {
    state.currentProfile = profile;
    state.currentFortune = fortune;

    el.emptyOverviewState.hidden = true;
    el.overviewResultContainer.hidden = false;

    el.resultUserMeta.textContent =
      `${profile.userName}님 · ${profile.birthDate} (${profile.calendarType}, ${profile.birthTime}) · ` +
      `${profile.yearGanji.ganjiKo}(${profile.yearGanji.zodiac.label}) · ${profile.starSign.name} | 풀이 기준일: ${state.today.formatted}`;

    // 점수 원형 게이지 애니메이션
    const score = Math.max(0, Math.min(100, Number(fortune.overall_score) || 85));
    el.overallScore.textContent = String(score);
    const circumference = 2 * Math.PI * 50; // r=50 -> 314.16
    const offset = circumference * (1 - score / 100);
    requestAnimationFrame(() => {
      el.scoreCircle.style.strokeDashoffset = String(offset);
    });

    el.fortuneIdiom.textContent = `${fortune.idiom_hanja} · ${fortune.idiom_meaning}`;
    el.fortuneHeadline.textContent = fortune.headline;
    el.fortuneSummary.textContent = fortune.overall_reading;

    // 4대 세부 운세
    el.categoryGrid.textContent = "";
    const catEntries = [
      { icon: "💰", data: fortune.categories.wealth },
      { icon: "🌸", data: fortune.categories.love },
      { icon: "🖋️", data: fortune.categories.career },
      { icon: "🍵", data: fortune.categories.health },
    ];
    for (const item of catEntries) {
      const card = document.createElement("div");
      card.className = "pillar-item";

      const head = document.createElement("div");
      head.className = "pillar-head";

      const title = document.createElement("span");
      title.className = "pillar-title";
      title.textContent = `${item.icon} ${item.data.title}`;

      const sc = document.createElement("span");
      sc.className = "pillar-score";
      sc.textContent = `${item.data.score}점`;

      head.append(title, sc);

      const bar = document.createElement("div");
      bar.className = "pillar-bar";
      const fill = document.createElement("div");
      fill.className = "pillar-bar-fill";
      fill.style.width = `${Math.max(0, Math.min(100, item.data.score))}%`;
      bar.appendChild(fill);

      const desc = document.createElement("p");
      desc.className = "pillar-desc";
      desc.textContent = item.data.advice;

      card.append(head, bar, desc);
      el.categoryGrid.appendChild(card);
    }

    // 시간대별 흐름
    el.timeFlowList.textContent = "";
    const times = [
      { label: "오전 朝", text: fortune.time_flow.morning },
      { label: "오후 晝", text: fortune.time_flow.afternoon },
      { label: "저녁 夜", text: fortune.time_flow.evening },
    ];
    for (const t of times) {
      const li = document.createElement("li");
      const badge = document.createElement("span");
      badge.className = "time-badge";
      badge.textContent = t.label;
      const body = document.createElement("span");
      body.textContent = t.text;
      li.append(badge, body);
      el.timeFlowList.appendChild(li);
    }

    // 오늘의 개운 처방전
    el.luckyPrescriptionList.textContent = "";
    const lp = fortune.lucky_prescription;
    const luckyItems = [
      { label: "행운의 빛깔", value: lp.color, isColor: true },
      { label: "행운의 숫자", value: lp.numbers },
      { label: "길한 방향(吉方)", value: lp.direction },
      { label: "개운 차(茶)·음식", value: lp.item_or_tea },
    ];
    for (const l of luckyItems) {
      const box = document.createElement("div");
      box.className = "lucky-box";
      const dt = document.createElement("dt");
      dt.textContent = l.label;
      const dd = document.createElement("dd");
      if (l.isColor) {
        const swatch = document.createElement("span");
        swatch.className = "color-swatch";
        swatch.style.backgroundColor = resolveColorHex(l.value);
        dd.appendChild(swatch);
      }
      const txt = document.createElement("span");
      txt.textContent = l.value;
      dd.appendChild(txt);
      box.append(dt, dd);
      el.luckyPrescriptionList.appendChild(box);
    }

    // 주의 팁 (가로 전체 폭)
    const cautionBox = document.createElement("div");
    cautionBox.className = "lucky-box";
    cautionBox.style.gridColumn = "1 / -1";
    const cDt = document.createElement("dt");
    cDt.textContent = "오늘의 마음가짐 처방";
    const cDd = document.createElement("dd");
    cDd.textContent = lp.caution_tip;
    cautionBox.append(cDt, cDd);
    el.luckyPrescriptionList.appendChild(cautionBox);

    el.masterAdvice.textContent = `“${fortune.master_quote}”`;

    // 패널 2 (띠·별자리) 내용도 함께 반영
    renderZodiacCard(profile.yearGanji.zodiac, fortune.zodiac_reading);
    renderStarCard(profile.starSign, fortune.star_reading);
  }

  function renderZodiacCard(zodiacObj, reading) {
    el.myZodiacIcon.textContent = zodiacObj.emoji;
    el.myZodiacTitle.textContent = reading.title || `${zodiacObj.label} 오늘의 운세`;
    el.myZodiacBody.textContent = "";

    const p = document.createElement("p");
    p.style.margin = "0";
    p.textContent = reading.content;
    el.myZodiacBody.appendChild(p);

    if (reading.harmony_zodiac) {
      const meta = document.createElement("div");
      meta.className = "zodiac-meta-tags";
      const tag = document.createElement("span");
      tag.className = "badge-tag jade";
      tag.textContent = `🤝 오늘의 귀인 띠: ${reading.harmony_zodiac}`;
      meta.appendChild(tag);
      el.myZodiacBody.appendChild(meta);
    }
    highlightZodiacButtons(zodiacObj.id, null);
  }

  function renderStarCard(starObj, reading) {
    el.myStarIcon.textContent = starObj.emoji;
    el.myStarTitle.textContent = reading.title || `${starObj.name} 오늘의 운세`;
    el.myStarBody.textContent = "";

    const p = document.createElement("p");
    p.style.margin = "0";
    p.textContent = reading.content;
    el.myStarBody.appendChild(p);

    if (reading.lucky_keyword) {
      const meta = document.createElement("div");
      meta.className = "zodiac-meta-tags";
      const tag = document.createElement("span");
      tag.className = "badge-tag";
      tag.textContent = `✨ 행운 키워드: ${reading.lucky_keyword}`;
      meta.appendChild(tag);
      el.myStarBody.appendChild(meta);
    }
    highlightZodiacButtons(null, starObj.id);
  }

  function highlightZodiacButtons(zodiacId, starId) {
    if (zodiacId) {
      for (const btn of el.chineseZodiacGrid.querySelectorAll(".zodiac-pick-btn")) {
        btn.classList.toggle("selected", btn.dataset.id === zodiacId);
      }
    }
    if (starId) {
      for (const btn of el.starSignGrid.querySelectorAll(".zodiac-pick-btn")) {
        btn.classList.toggle("selected", btn.dataset.id === starId);
      }
    }
  }

  /**
   * 종합 운세 Gemini AI 생성 핸들러
   */
  async function handleGenerateComprehensiveFortune(event) {
    event.preventDefault();
    if (!el.fortuneForm.reportValidity()) {
      return;
    }

    const profile = parseUserProfile();
    if (!profile) {
      showError("생년월일을 정확히 입력해 주세요.");
      return;
    }

    if (!hasUsableApiKey()) {
      el.apiModal.showModal();
      showToast("실시간 AI 풀이를 위해 Gemini API 열쇠를 먼저 입력해 주세요.");
      return;
    }

    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify({
      userName: profile.userName === "귀인" ? "" : profile.userName,
      birthDate: profile.birthDate,
      calendarType: profile.calendarType,
      birthTime: profile.birthTime,
      gender: profile.gender,
      model: profile.model,
    }));

    switchTab("overview");
    showLoading(
      "따뜻한 차를 우리고 먹을 갈며 오늘의 기운을 살피는 중입니다...",
      `${profile.yearGanji.ganjiKo}(${profile.yearGanji.zodiac.label})의 오행과 ${state.today.dayGanji.ko} 일진을 맞추어 풀이하고 있습니다.`
    );
    el.generateFortuneBtn.disabled = true;

    const systemInstruction =
      "당신은 한국 전통 사주명리학(오행·일진·12운성), 동양 십이지신, 서양 별자리 점성술에 모두 정통한 '월하다원(月下茶園)'의 온화하고 지혜로운 다실 주인장입니다. " +
      "겁을 주거나 단정적인 흉운 표현은 지양하고, 차분하고 품격 있는 한국어 문체(해요체/하십시오체의 따뜻한 조화)로 현실적이고 구체적인 하루의 지혜와 개운법을 전해주세요.";

    const userPrompt = [
      `[오늘 날짜 및 일진] ${state.today.formatted} (연주: ${state.today.yearGanji.ganjiKo})`,
      `[방문객 명패]`,
      `- 호칭: ${profile.userName}`,
      `- 생년월일: ${profile.birthDate} (${profile.calendarType})`,
      `- 태어난 시진: ${profile.birthTime}`,
      `- 성별: ${profile.gender}`,
      `- 생년 간지·띠: ${profile.yearGanji.ganjiKo}(${profile.yearGanji.ganjiHanja}), ${profile.yearGanji.colorAnimal}띠, 오행 ${profile.yearGanji.element}`,
      `- 양력 기준 별자리: ${profile.starSign.name} (${profile.starSign.element})`,
      profile.userConcern ? `- 오늘의 특별한 고민/질문: "${profile.userConcern}" (종합 총운과 세부 조언에 꼭 반영해 주세요)` : "- 오늘의 특별한 고민: 일상 전반의 흐름과 행운",
      "",
      "위 정보를 바탕으로 오늘 하루의 종합 사주 총운, 4대 세부운(재물·연애·직장학업·건강), 시간대별 흐름, 개운 처방전, 띠별 운세, 별자리 운세를 JSON 스키마에 맞추어 정성껏 작성해 주세요.",
    ].join("\n");

    try {
      const jsonText = await callGeminiInteraction({
        model: profile.model,
        systemInstruction,
        input: userPrompt,
        schema: COMPREHENSIVE_FORTUNE_SCHEMA,
      });

      const parsed = JSON.parse(jsonText);
      renderComprehensiveFortune(profile, parsed);

      localStorage.setItem(
        STORAGE_KEYS.CACHED_FORTUNE,
        JSON.stringify({ date: state.today.isoDate, profile, fortune: parsed })
      );
      showToast("오늘의 종합 운세 두루마리가 완성되었습니다.");
    } catch (err) {
      if (err.message === "MISSING_API_KEY") {
        el.apiModal.showModal();
      } else {
        showError(`운세 풀이 중 차질이 생겼습니다: ${err.message}`);
      }
    } finally {
      hideLoading();
      el.generateFortuneBtn.disabled = false;
    }
  }

  /**
   * 12띠 / 12별자리 개별 버튼 클릭 시 즉시 조회
   */
  function initZodiacAndStarGrids() {
    el.chineseZodiacGrid.textContent = "";
    for (const z of CHINESE_ZODIAC) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "zodiac-pick-btn";
      btn.dataset.id = z.id;
      const emoji = document.createElement("span");
      emoji.className = "z-emoji";
      emoji.textContent = z.emoji;
      const name = document.createElement("span");
      name.textContent = z.label;
      btn.append(emoji, name);
      btn.addEventListener("click", () => fetchSingleZodiacOrStar("zodiac", z));
      el.chineseZodiacGrid.appendChild(btn);
    }

    el.starSignGrid.textContent = "";
    for (const s of STAR_SIGNS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "zodiac-pick-btn";
      btn.dataset.id = s.id;
      const emoji = document.createElement("span");
      emoji.className = "z-emoji";
      emoji.textContent = s.emoji;
      const name = document.createElement("span");
      name.textContent = s.name;
      btn.append(emoji, name);
      btn.addEventListener("click", () => fetchSingleZodiacOrStar("star", s));
      el.starSignGrid.appendChild(btn);
    }
  }

  async function fetchSingleZodiacOrStar(kind, item) {
    if (!hasUsableApiKey()) {
      // API 키가 없을 때는 다실 샘플 안내 제공
      if (kind === "zodiac") {
        renderZodiacCard(item, {
          title: `${item.label} (${item.hanja}支 · ${item.yearsHint}년생) 오늘의 미리보기`,
          content: `오늘 ${item.label}에게는 차분히 내실을 다질수록 오후에 반가운 성취가 따르는 날입니다. 주변과의 작은 약속을 소중히 챙기면 뜻밖의 호의가 돌아옵니다. (우측 상단에서 Gemini 열쇠를 연결하시면 오늘 일진에 맞춘 실시간 AI 풀이를 보실 수 있습니다.)`,
          harmony_zodiac: "쥐띠 · 용띠",
        });
      } else {
        renderStarCard(item, {
          title: `${item.name} (${item.range}) 오늘의 미리보기`,
          content: `오늘 ${item.name}에게는 ${item.element}의 맑은 영감이 감도는 하루입니다. 미루어 두었던 연락이나 가벼운 정리를 시작하기에 좋은 타이밍입니다. (Gemini 열쇠를 설정하시면 실시간 AI 별자리 운세가 제공됩니다.)`,
          lucky_keyword: "차분한 정돈 · 따뜻한 차 한 잔",
        });
      }
      return;
    }

    const targetBox = kind === "zodiac" ? el.myZodiacBody : el.myStarBody;
    targetBox.textContent = "오늘의 기운을 살피어 글을 적고 있습니다...";

    const schema =
      kind === "zodiac"
        ? {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              harmony_zodiac: { type: "string" },
            },
            required: ["title", "content", "harmony_zodiac"],
          }
        : {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              lucky_keyword: { type: "string" },
            },
            required: ["title", "content", "lucky_keyword"],
          };

    const prompt =
      kind === "zodiac"
        ? `오늘은 ${state.today.formatted}입니다. 십이지신 중 '${item.label}(${item.hanja}支, 대표 생년 ${item.yearsHint})'의 오늘 하루 총운, 재물·대인 흐름, 세대별 가벼운 조언을 4~5문장으로 따뜻하고 품격 있게 풀이해 주세요.`
        : `오늘은 ${state.today.formatted}입니다. 황도 12궁 '${item.name}(${item.range}, 원소: ${item.element})'의 오늘의 별자리 운세(감정·일·인연·행운 포인트)를 4~5문장으로 다정하고 품격 있게 풀이해 주세요.`;

    try {
      const out = await callGeminiInteraction({
        model: "gemini-3.8-flash",
        systemInstruction: "당신은 월하다원의 지혜로운 사주·별자리 주인장입니다. 차분하고 기분 좋은 한국어로 실질적인 하루 조언을 건네주세요.",
        input: prompt,
        schema,
      });
      const parsed = JSON.parse(out);
      if (kind === "zodiac") {
        renderZodiacCard(item, parsed);
      } else {
        renderStarCard(item, parsed);
      }
    } catch (err) {
      targetBox.textContent = `풀이를 불러오지 못했습니다: ${err.message}`;
    }
  }

  /**
   * 수묵 타로 다실: 셔플, 카드 뒤집기, AI 리딩
   */
  function shuffleTarotDeck() {
    state.drawnTarotCards = [];
    el.tarotReadingPanel.hidden = true;
    el.tarotDrawnSummary.textContent = "";
    el.tarotAiInterpretation.textContent = "";

    // Fisher-Yates 셔플 후 7장 추출
    const pool = [...MAJOR_ARCANA];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    state.tarotDeckSample = pool.slice(0, 7).map((card) => ({
      ...card,
      isReversed: Math.random() < 0.32,
    }));

    updateTarotGuideStatus();
    renderTarotDeckSlots();
  }

  function updateTarotGuideStatus() {
    const remain = state.tarotSpreadCount - state.drawnTarotCards.length;
    el.tarotGuideStatus.textContent = "";
    if (remain > 0) {
      el.tarotGuideStatus.textContent =
        state.tarotSpreadCount === 1
          ? "아래 일곱 장의 수묵 패 가운데 마음이 이끄는 1장을 뒤집어 보세요."
          : `흐름(과거) · 현재 · 조언 순으로 패를 고릅니다. 남은 선택: ${remain}장`;
    } else {
      el.tarotGuideStatus.textContent = "선택하신 패의 상징을 읽어 내려가고 있습니다.";
    }
  }

  function renderTarotDeckSlots() {
    el.tarotDeckRow.textContent = "";
    const positionNames =
      state.tarotSpreadCount === 1
        ? ["오늘의 핵심"]
        : ["1. 지나온 흐름", "2. 현재의 기운", "3. 나아갈 조언"];

    state.tarotDeckSample.forEach((card, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tarot-card-slot";
      btn.setAttribute("aria-label", `${idx + 1}번째 타로 패 선택`);

      const inner = document.createElement("div");
      inner.className = "tarot-card-inner";

      const back = document.createElement("div");
      back.className = "tarot-face tarot-back";
      const emblem = document.createElement("div");
      emblem.className = "tarot-back-emblem";
      emblem.textContent = "月";
      const cap = document.createElement("span");
      cap.className = "tarot-back-caption";
      cap.textContent = "月下塔羅";
      back.append(emblem, cap);

      const front = document.createElement("div");
      front.className = "tarot-face tarot-front";

      const posLabel = document.createElement("span");
      posLabel.className = "tarot-pos-label";
      posLabel.textContent = "선택됨";

      const art = document.createElement("div");
      art.className = `tarot-art-symbol${card.isReversed ? " reversed" : ""}`;
      art.textContent = card.symbol;

      const nameWrap = document.createElement("div");
      const cName = document.createElement("div");
      cName.className = "tarot-card-name";
      cName.textContent = `${card.no}. ${card.hanja}`;
      const cDir = document.createElement("div");
      cDir.className = "tarot-card-dir";
      cDir.textContent = card.isReversed ? "역방향 (逆)" : "정방향 (正)";
      nameWrap.append(cName, cDir);

      front.append(posLabel, art, nameWrap);
      inner.append(back, front);
      btn.appendChild(inner);

      btn.addEventListener("click", () => {
        if (btn.classList.contains("flipped") || state.drawnTarotCards.length >= state.tarotSpreadCount) {
          return;
        }
        const drawOrder = state.drawnTarotCards.length;
        const posTitle = positionNames[drawOrder];
        posLabel.textContent = posTitle;
        btn.classList.add("flipped");

        state.drawnTarotCards.push({ ...card, positionTitle: posTitle });
        updateTarotGuideStatus();

        if (state.drawnTarotCards.length === state.tarotSpreadCount) {
          // 나머지 미선택 카드 비활성화
          for (const other of el.tarotDeckRow.querySelectorAll(".tarot-card-slot:not(.flipped)")) {
            other.disabled = true;
            other.style.opacity = "0.45";
          }
          presentTarotReading();
        }
      });

      el.tarotDeckRow.appendChild(btn);
    });
  }

  async function presentTarotReading() {
    el.tarotReadingPanel.hidden = false;
    el.tarotDrawnSummary.textContent = "";

    for (const c of state.drawnTarotCards) {
      const box = document.createElement("div");
      box.className = "drawn-card-detail";
      const h4 = document.createElement("h4");
      h4.textContent = `[${c.positionTitle}] ${c.symbol} ${c.no}. ${c.name} — ${c.isReversed ? "역방향" : "정방향"}`;
      const p = document.createElement("p");
      p.textContent = c.isReversed ? `핵심 상징: ${c.reversed}` : `핵심 상징: ${c.upright}`;
      box.append(h4, p);
      el.tarotDrawnSummary.appendChild(box);
    }

    const question = el.tarotQuestionInput.value.trim() || el.userConcern.value.trim();
    const profile = parseUserProfile();

    if (!hasUsableApiKey()) {
      const lines = state.drawnTarotCards.map(
        (c) => `• ${c.positionTitle}에 놓인 '${c.name}(${c.isReversed ? "역방향" : "정방향"})' 패는 "${c.isReversed ? c.reversed : c.upright}"의 기운을 일러주고 있습니다.`
      );
      el.tarotAiInterpretation.textContent =
        `[다실 주인장의 기본 타로 해설]\n\n${lines.join("\n")}\n\n` +
        `오늘(${state.today.dayGanji.ko})의 흐름 속에서 이 패들은 서두르기보다 내면의 중심을 단단히 잡을 때 좋은 결실이 온다고 속삭입니다.\n` +
        `※ 우측 상단 'Gemini 열쇠 설정'에 API 키를 입력하시면 질문과 생년월일을 결합한 심층 AI 타로 리딩이 제공됩니다.`;
      return;
    }

    el.tarotAiInterpretation.textContent = "뽑으신 패의 그림자와 빛을 엮어 주인장이 풀이를 적고 있습니다...";

    const cardDesc = state.drawnTarotCards
      .map(
        (c) =>
          `- [${c.positionTitle}] ${c.no}. ${c.name} (${c.hanja}) / ${c.isReversed ? "역방향" : "정방향"} / 기본 상징: ${c.isReversed ? c.reversed : c.upright}`
      )
      .join("\n");

    const prompt = [
      `오늘 날짜: ${state.today.formatted}`,
      profile
        ? `질문자 정보: ${profile.userName} (${profile.birthDate}, ${profile.yearGanji.ganjiKo} ${profile.yearGanji.zodiac.label}, ${profile.starSign.name})`
        : "질문자 정보: 다실 방문객",
      question ? `마음속 질문: "${question}"` : "마음속 질문: 오늘 하루 나에게 필요한 메시지와 조언",
      `뽑은 타로 패 (${state.tarotSpreadCount}장 배열):`,
      cardDesc,
      "",
      "각 카드의 위치와 정·역방향 의미를 자연스럽게 연결하여, 질문자에게 실질적인 통찰과 다정한 행동 조언을 3~4문단으로 들려주세요. 마크다운 기호(*, #) 없이 읽기 편안한 순수 문단으로 작성해 주세요.",
    ].join("\n");

    try {
      const text = await callGeminiInteraction({
        model: profile?.model || "gemini-3.8-flash",
        systemInstruction:
          "당신은 동양 명리와 서양 타로 상징을 아우르는 '월하다원'의 타로·다실 주인장입니다. 시적이면서도 현실적인 조언을 순수 텍스트 문단으로 따뜻하게 들려주세요.",
        input: prompt,
      });
      el.tarotAiInterpretation.textContent = text.trim();
    } catch (err) {
      el.tarotAiInterpretation.textContent = `타로 AI 풀이 중 오류가 발생했습니다: ${err.message}`;
    }
  }

  /**
   * 1:1 주인장과 차담 (추가 질문 채팅)
   */
  function appendChatBubble(role, text) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${role}`;
    const author = document.createElement("span");
    author.className = "bubble-author";
    author.textContent = role === "master" ? "월하다원 주인장" : (state.currentProfile?.userName || "방문객");
    const p = document.createElement("p");
    p.textContent = text;
    bubble.append(author, p);
    el.chatLog.appendChild(bubble);
    el.chatLog.scrollTop = el.chatLog.scrollHeight;
    return p;
  }

  async function handleChatSubmit(event) {
    event.preventDefault();
    const question = el.chatInput.value.trim();
    if (!question) return;

    if (!hasUsableApiKey()) {
      el.apiModal.showModal();
      showToast("주인장과 실시간 차담을 나누시려면 Gemini API 열쇠를 설정해 주세요.");
      return;
    }

    el.chatInput.value = "";
    appendChatBubble("user", question);
    state.chatHistory.push({ role: "방문객", text: question });

    el.sendChatBtn.disabled = true;
    const pendingParagraph = appendChatBubble("master", "찻잔을 기울이며 말씀을 깊이 헤아리고 있습니다...");

    const profile = parseUserProfile() || state.currentProfile;
    const contextLines = [
      `오늘 일진: ${state.today.formatted}`,
      profile
        ? `방문객: ${profile.userName}, 생년월일 ${profile.birthDate}(${profile.calendarType}, ${profile.birthTime}), ${profile.yearGanji.ganjiKo} ${profile.yearGanji.zodiac.label}, ${profile.starSign.name}`
        : "방문객 생년월일 미입력",
      state.currentFortune
        ? `오늘의 종합 운세 요약: 총점 ${state.currentFortune.overall_score}점, 사자성어 ${state.currentFortune.idiom_hanja}, 핵심 "${state.currentFortune.headline}"`
        : "",
      state.drawnTarotCards.length > 0
        ? `방금 뽑은 타로 패: ${state.drawnTarotCards.map((c) => `${c.name}(${c.isReversed ? "역" : "정"})`).join(", ")}`
        : "",
      "최근 대화 내역:",
      ...state.chatHistory.slice(-6).map((m) => `${m.role}: ${m.text}`),
    ].filter(Boolean);

    try {
      const reply = await callGeminiInteraction({
        model: "gemini-3.8-flash",
        systemInstruction:
          "당신은 전통 사주·타로 카페 '월하다원'의 지혜롭고 다정한 주인장입니다. 방문객의 사주·타로 맥락을 바탕으로 2~3문단 이내로 명쾌하고 따뜻한 조언을 건네주세요. 마크다운 기호(*, #)는 쓰지 마세요.",
        input: contextLines.join("\n"),
      });
      const cleanReply = reply.trim();
      pendingParagraph.textContent = cleanReply;
      state.chatHistory.push({ role: "주인장", text: cleanReply });
    } catch (err) {
      pendingParagraph.textContent = `죄송합니다. 잠시 찻물이 식어 답변을 이어가지 못했습니다. (${err.message})`;
    } finally {
      el.sendChatBtn.disabled = false;
    }
  }

  /**
   * 테마(낮 한지 / 밤 등불), 모달 Light Dismiss, 클립보드 복사 등 초기화
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    if (theme === "night") {
      el.themeIcon.textContent = "☀️";
      el.themeLabel.textContent = "햇살 모드";
    } else {
      el.themeIcon.textContent = "🕯️";
      el.themeLabel.textContent = "등불 모드";
    }
  }

  function initEventListeners() {
    // 테마 토글
    el.themeToggleBtn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      applyTheme(cur === "night" ? "day" : "night");
    });

    // 생년월일 변경 시 자동 배지 계산
    el.birthDate.addEventListener("change", updateDerivedBadges);
    el.birthDate.addEventListener("input", updateDerivedBadges);

    // 종합 운세 제출
    el.fortuneForm.addEventListener("submit", handleGenerateComprehensiveFortune);

    // 샘플 체험 버튼
    el.sampleFortuneBtn.addEventListener("click", () => {
      if (!el.birthDate.value) {
        el.birthDate.value = "1995-05-15";
        updateDerivedBadges();
      }
      const profile = parseUserProfile();
      if (!profile) return;
      const sample = buildSampleFortune(profile, state.today);
      el.errorBanner.hidden = true;
      switchTab("overview");
      renderComprehensiveFortune(profile, sample);
      showToast("다실 미리보기 샘플 운세를 펼쳤습니다.");
    });

    // 탭 전환
    for (const btn of el.tabs) {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    }

    // 운세 결과 텍스트 복사
    el.copyFortuneBtn.addEventListener("click", async () => {
      if (!state.currentFortune || !state.currentProfile) return;
      const f = state.currentFortune;
      const p = state.currentProfile;
      const shareText = [
        `📜 [월하다원 오늘의 운세] ${state.today.formatted}`,
        `• 주인공: ${p.userName}님 (${p.yearGanji.ganjiKo} · ${p.starSign.name})`,
        `• 오늘의 점수: ${f.overall_score}점 (${f.idiom_hanja} · ${f.idiom_meaning})`,
        `• 핵심 화두: ${f.headline}`,
        `• 개운 처방: ${f.lucky_prescription.color} / 숫자 ${f.lucky_prescription.numbers} / ${f.lucky_prescription.item_or_tea}`,
        `“${f.master_quote}”`,
      ].join("\n");
      try {
        await navigator.clipboard.writeText(shareText);
        showToast("오늘의 운세 요약이 클립보드에 갈무리되었습니다.");
      } catch {
        showToast("복사를 지원하지 않는 브라우저 환경입니다.");
      }
    });

    // 타로 컨트롤
    el.spreadOneBtn.addEventListener("click", () => {
      state.tarotSpreadCount = 1;
      el.spreadOneBtn.classList.add("active");
      el.spreadThreeBtn.classList.remove("active");
      shuffleTarotDeck();
    });
    el.spreadThreeBtn.addEventListener("click", () => {
      state.tarotSpreadCount = 3;
      el.spreadThreeBtn.classList.add("active");
      el.spreadOneBtn.classList.remove("active");
      shuffleTarotDeck();
    });
    el.shuffleTarotBtn.addEventListener("click", () => {
      shuffleTarotDeck();
      showToast("수묵 타로 패를 새로 섞었습니다.");
    });

    // 차담 채팅
    el.chatForm.addEventListener("submit", handleChatSubmit);
    el.clearChatBtn.addEventListener("click", () => {
      state.chatHistory = [];
      el.chatLog.textContent = "";
      appendChatBubble("master", "찻상을 정갈히 비웠습니다. 새로 궁금하신 점을 편히 말씀해 주세요.");
    });
    el.quickPrompts.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip-btn");
      if (!chip) return;
      el.chatInput.value = chip.dataset.prompt || "";
      el.chatInput.focus();
    });

    // 에러 배너 버튼
    el.errorOpenKeyBtn.addEventListener("click", () => el.apiModal.showModal());
    el.dismissErrorBtn.addEventListener("click", () => {
      el.errorBanner.hidden = true;
    });

    // 네이티브 <dialog> API 키 모달 (배경 클릭 Light Dismiss 포함)
    el.openApiModalBtn.addEventListener("click", () => {
      el.apiKeyInput.value = getStoredApiKey();
      el.apiModal.showModal();
    });
    el.closeApiModalBtn.addEventListener("click", () => el.apiModal.close());
    el.cancelApiModalBtn.addEventListener("click", () => el.apiModal.close());
    el.apiModal.addEventListener("click", (e) => {
      if (e.target === el.apiModal) {
        el.apiModal.close();
      }
    });

    el.toggleKeyVisBtn.addEventListener("click", () => {
      const isPw = el.apiKeyInput.type === "password";
      el.apiKeyInput.type = isPw ? "text" : "password";
      el.toggleKeyVisBtn.textContent = isPw ? "숨김" : "보기";
    });

    el.apiKeyForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = el.apiKeyInput.value.trim();
      if (val) {
        localStorage.setItem(STORAGE_KEYS.API_KEY, val);
        showToast("Gemini API 열쇠가 안전하게 저장되었습니다.");
      } else {
        localStorage.removeItem(STORAGE_KEYS.API_KEY);
      }
      updateApiStatusBadge();
      el.apiModal.close();
    });

    el.clearApiKeyBtn.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
      el.apiKeyInput.value = "";
      updateApiStatusBadge();
      showToast("저장된 API 열쇠를 삭제했습니다.");
    });
  }

  function restoreSavedState() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme === "night" || savedTheme === "day") {
      applyTheme(savedTheme);
    }

    // 기본 생년월일 또는 마지막 입력 복원
    try {
      const savedProfile = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE) || "null");
      if (savedProfile) {
        if (savedProfile.userName) el.userName.value = savedProfile.userName;
        if (savedProfile.birthDate) el.birthDate.value = savedProfile.birthDate;
        if (savedProfile.calendarType) el.calendarType.value = savedProfile.calendarType;
        if (savedProfile.birthTime) el.birthTime.value = savedProfile.birthTime;
        if (savedProfile.gender) el.gender.value = savedProfile.gender;
        if (savedProfile.model) el.modelSelect.value = savedProfile.model;
      } else {
        el.birthDate.value = "1995-05-15";
      }
    } catch {
      el.birthDate.value = "1995-05-15";
    }
    updateDerivedBadges();

    // 오늘 날짜의 캐시된 운세가 있으면 자동 복원
    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEYS.CACHED_FORTUNE) || "null");
      if (cached && cached.date === state.today.isoDate && cached.profile && cached.fortune) {
        renderComprehensiveFortune(cached.profile, cached.fortune);
      }
    } catch {
      // 캐시 파싱 실패 시 무시
    }
  }

  async function init() {
    el.todayDisplay.textContent = state.today.formatted;
    initZodiacAndStarGrids();
    shuffleTarotDeck();
    initEventListeners();
    restoreSavedState();
    await detectBackendServer();
  }

  init();
})();

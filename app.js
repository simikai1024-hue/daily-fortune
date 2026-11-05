/**
 * 월하다원 (月下茶園) — 다실 인터랙션 및 사주·타로·차담 컨트롤러
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
    generateZodiacReading,
    generateStarReading,
    generateMasterFortune,
    generateMasterTarotReading,
    generateMasterChatReply,
  } = window.FortuneData;

  const STORAGE_KEYS = {
    THEME: "wolha_theme_mode",
    PROFILE: "wolha_last_profile_v2",
    CACHED_FORTUNE: "wolha_today_fortune_v2",
  };

  const state = {
    today: getTodayMetadata(),
    currentProfile: null,
    currentFortune: null,
    tarotSpreadCount: 1,
    tarotDeckSample: [],
    drawnTarotCards: [],
  };

  const el = {
    todayDisplay: document.getElementById("todayDisplay"),
    installAppBtn: document.getElementById("installAppBtn"),
    themeToggleBtn: document.getElementById("themeToggleBtn"),
    themeIcon: document.getElementById("themeIcon"),
    themeLabel: document.getElementById("themeLabel"),

    fortuneForm: document.getElementById("fortuneForm"),
    userName: document.getElementById("userName"),
    birthDate: document.getElementById("birthDate"),
    calendarType: document.getElementById("calendarType"),
    birthTime: document.getElementById("birthTime"),
    gender: document.getElementById("gender"),
    focusTopic: document.getElementById("focusTopic"),
    userConcern: document.getElementById("userConcern"),
    derivedBadges: document.getElementById("derivedBadges"),
    generateFortuneBtn: document.getElementById("generateFortuneBtn"),

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
    }, 2600);
  }

  function parseUserProfile() {
    const rawDate = el.birthDate.value;
    if (!rawDate) return null;
    const [yStr, mStr, dStr] = rawDate.split("-");
    const year = Number(yStr);
    const month = Number(mStr);
    const day = Number(dStr);
    if (!year || !month || !day) return null;

    const yearGanji = calculateYearGanji(year);
    const dayMaster = calculateDayGanji(year, month, day);
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
      focusTopic: el.focusTopic.value,
      userConcern: el.userConcern.value.trim(),
      yearGanji,
      dayMaster,
      starSign,
    };
  }

  function updateDerivedBadges() {
    const profile = parseUserProfile();
    el.derivedBadges.textContent = "";

    if (!profile) {
      const span = document.createElement("span");
      span.className = "badge-tag subtle";
      span.textContent = "생년월일을 적으시면 띠·일주(日柱)·별자리를 즉시 짚어 드립니다";
      el.derivedBadges.appendChild(span);
      return;
    }

    const items = [
      { text: `${profile.yearGanji.zodiac.emoji} ${profile.yearGanji.ganjiKo} (${profile.yearGanji.colorAnimal}띠)`, cls: "badge-tag" },
      { text: `📜 ${profile.dayMaster.pillarKo} · 본원 ${profile.dayMaster.stem.element}`, cls: "badge-tag jade" },
      { text: `${profile.starSign.emoji} ${profile.starSign.name}`, cls: "badge-tag" },
    ];

    for (const item of items) {
      const badge = document.createElement("span");
      badge.className = item.cls;
      badge.textContent = item.text;
      el.derivedBadges.appendChild(badge);
    }

    // 12띠·12별자리 탭도 사용자 생년월일 기준으로 즉시 갱신
    renderZodiacCard(profile.yearGanji.zodiac, generateZodiacReading(profile.yearGanji.zodiac, state.today));
    renderStarCard(profile.starSign, generateStarReading(profile.starSign, state.today));
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

  function renderComprehensiveFortune(profile, fortune) {
    state.currentProfile = profile;
    state.currentFortune = fortune;

    el.emptyOverviewState.hidden = true;
    el.overviewResultContainer.hidden = false;

    el.resultUserMeta.textContent =
      `${profile.userName}님 · ${profile.birthDate} (${profile.calendarType}, ${profile.birthTime}) · ` +
      `${profile.yearGanji.ganjiKo}(${profile.yearGanji.zodiac.label}) · ${profile.dayMaster.pillarKo} | ${state.today.formatted}`;

    const score = Math.max(0, Math.min(100, Number(fortune.overall_score) || 86));
    el.overallScore.textContent = String(score);
    const circumference = 2 * Math.PI * 50;
    const offset = circumference * (1 - score / 100);
    requestAnimationFrame(() => {
      el.scoreCircle.style.strokeDashoffset = String(offset);
    });

    el.fortuneIdiom.textContent = `${fortune.idiom_hanja} · ${fortune.idiom_meaning}`;
    el.fortuneHeadline.textContent = fortune.headline;
    el.fortuneSummary.textContent = fortune.overall_reading;

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

    el.luckyPrescriptionList.textContent = "";
    const lp = fortune.lucky_prescription;
    const luckyItems = [
      { label: "행운의 빛깔", value: lp.color, isColor: true },
      { label: "행운의 숫자", value: lp.numbers },
      { label: "길한 방위(吉方)", value: lp.direction },
      { label: "개운 차(茶)·다과", value: lp.item_or_tea },
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

    const cautionBox = document.createElement("div");
    cautionBox.className = "lucky-box";
    cautionBox.style.gridColumn = "1 / -1";
    const cDt = document.createElement("dt");
    cDt.textContent = "오늘의 처세 비결";
    const cDd = document.createElement("dd");
    cDd.textContent = lp.caution_tip;
    cautionBox.append(cDt, cDd);
    el.luckyPrescriptionList.appendChild(cautionBox);

    el.masterAdvice.textContent = `“${fortune.master_quote}”`;

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
      tag.textContent = `🤝 오늘 합이 드는 귀인 띠: ${reading.harmony_zodiac}`;
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
      tag.textContent = `✨ 행운의 열쇠: ${reading.lucky_keyword}`;
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

  function handleGenerateComprehensiveFortune(event) {
    event.preventDefault();
    if (!el.fortuneForm.reportValidity()) {
      return;
    }

    const profile = parseUserProfile();
    if (!profile) return;

    localStorage.setItem(
      STORAGE_KEYS.PROFILE,
      JSON.stringify({
        userName: profile.userName === "귀인" ? "" : profile.userName,
        birthDate: profile.birthDate,
        calendarType: profile.calendarType,
        birthTime: profile.birthTime,
        gender: profile.gender,
        focusTopic: profile.focusTopic,
      })
    );

    switchTab("overview");
    el.emptyOverviewState.hidden = true;
    el.overviewResultContainer.hidden = true;
    el.loadingTitle.textContent = "벼루에 먹을 갈며 사주 일주(日柱)와 오늘의 일진을 맞추고 있습니다...";
    el.loadingSub.textContent = `${profile.dayMaster.pillarKo}(${profile.dayMaster.stem.element}) 본원과 ${state.today.dayGanji.ko}의 상생 흐름을 살피는 중입니다.`;
    el.loadingBox.hidden = false;
    el.generateFortuneBtn.disabled = true;

    setTimeout(() => {
      const fortune = generateMasterFortune(profile, state.today);
      el.loadingBox.hidden = true;
      el.generateFortuneBtn.disabled = false;
      renderComprehensiveFortune(profile, fortune);

      localStorage.setItem(
        STORAGE_KEYS.CACHED_FORTUNE,
        JSON.stringify({ date: state.today.isoDate, profile, fortune })
      );
      el.overviewResultContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
      showToast("오늘의 사주 점괘 두루마리가 펼쳐졌습니다.");
    }, 620);
  }

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
      btn.addEventListener("click", () => {
        renderZodiacCard(z, generateZodiacReading(z, state.today));
      });
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
      btn.addEventListener("click", () => {
        renderStarCard(s, generateStarReading(s, state.today));
      });
      el.starSignGrid.appendChild(btn);
    }
  }

  function shuffleTarotDeck() {
    state.drawnTarotCards = [];
    el.tarotReadingPanel.hidden = true;
    el.tarotDrawnSummary.textContent = "";
    el.tarotAiInterpretation.textContent = "";

    const pool = [...MAJOR_ARCANA];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    state.tarotDeckSample = pool.slice(0, 7).map((card) => ({
      ...card,
      isReversed: Math.random() < 0.3,
    }));

    updateTarotGuideStatus();
    renderTarotDeckSlots();
  }

  function updateTarotGuideStatus() {
    const remain = state.tarotSpreadCount - state.drawnTarotCards.length;
    if (remain > 0) {
      el.tarotGuideStatus.textContent =
        state.tarotSpreadCount === 1
          ? "아래 일곱 장의 수묵 패 가운데 마음이 이끄는 1장을 뒤집어 보십시오."
          : `흐름(과거) · 현재 · 조언 순으로 패를 고릅니다. 남은 선택: ${remain}장`;
    } else {
      el.tarotGuideStatus.textContent = "선택하신 수묵 패의 점괘가 아래에 펼쳐졌습니다.";
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

  function presentTarotReading() {
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
    const profile = parseUserProfile() || state.currentProfile;

    el.tarotAiInterpretation.textContent = generateMasterTarotReading({
      drawnCards: state.drawnTarotCards,
      question,
      profile,
      todayInfo: state.today,
    });
  }

  function appendChatBubble(role, text) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${role}`;
    const author = document.createElement("span");
    author.className = "bubble-author";
    author.textContent = role === "master" ? "월하다원 주인장" : (state.currentProfile?.userName || "길손");
    const p = document.createElement("p");
    p.textContent = text;
    bubble.append(author, p);
    el.chatLog.appendChild(bubble);
    el.chatLog.scrollTop = el.chatLog.scrollHeight;
    return p;
  }

  function handleChatSubmit(event) {
    event.preventDefault();
    const question = el.chatInput.value.trim();
    if (!question) return;

    el.chatInput.value = "";
    appendChatBubble("user", question);

    el.sendChatBtn.disabled = true;
    const pendingParagraph = appendChatBubble("master", "찻잔을 기울이며 일진과 말씀을 가만히 짚어보고 있습니다...");

    const profile = parseUserProfile() || state.currentProfile;
    const fortune = state.currentFortune || (profile ? generateMasterFortune(profile, state.today) : null);

    setTimeout(() => {
      pendingParagraph.textContent = generateMasterChatReply({
        question,
        profile,
        fortune,
        drawnCards: state.drawnTarotCards,
        todayInfo: state.today,
      });
      el.sendChatBtn.disabled = false;
      el.chatLog.scrollTop = el.chatLog.scrollHeight;
    }, 480);
  }

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
    el.themeToggleBtn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      applyTheme(cur === "night" ? "day" : "night");
    });

    el.birthDate.addEventListener("change", updateDerivedBadges);
    el.birthDate.addEventListener("input", updateDerivedBadges);

    el.fortuneForm.addEventListener("submit", handleGenerateComprehensiveFortune);

    for (const btn of el.tabs) {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    }

    el.copyFortuneBtn.addEventListener("click", async () => {
      if (!state.currentFortune || !state.currentProfile) return;
      const f = state.currentFortune;
      const p = state.currentProfile;
      const shareText = [
        `📜 [월하다원 오늘의 점괘] ${state.today.formatted}`,
        `• 명패: ${p.userName}님 (${p.yearGanji.ganjiKo} · ${p.dayMaster.pillarKo} · ${p.starSign.name})`,
        `• 오늘의 기운: ${f.overall_score}점 (${f.idiom_hanja} · ${f.idiom_meaning})`,
        `• 화두: ${f.headline}`,
        `• 개운 비방: ${f.lucky_prescription.color} / 숫자 ${f.lucky_prescription.numbers} / ${f.lucky_prescription.direction} / ${f.lucky_prescription.item_or_tea}`,
        `“${f.master_quote}”`,
      ].join("\n");
      try {
        await navigator.clipboard.writeText(shareText);
        showToast("오늘의 점괘 요약이 갈무리(복사)되었습니다.");
      } catch {
        showToast("복사를 지원하지 않는 환경입니다.");
      }
    });

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
      showToast("수묵 타로 패를 정갈히 다시 섞었습니다.");
    });

    el.chatForm.addEventListener("submit", handleChatSubmit);
    el.clearChatBtn.addEventListener("click", () => {
      el.chatLog.textContent = "";
      appendChatBubble("master", "찻상을 정갈히 치우고 새 찻물을 올렸습니다. 궁금하신 말씀을 편히 건네주십시오.");
    });
    el.quickPrompts.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip-btn");
      if (!chip) return;
      el.chatInput.value = chip.dataset.prompt || "";
      el.chatInput.focus();
    });
  }

  function restoreSavedState() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme === "night" || savedTheme === "day") {
      applyTheme(savedTheme);
    }

    try {
      const savedProfile = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROFILE) || "null");
      if (savedProfile) {
        if (savedProfile.userName) el.userName.value = savedProfile.userName;
        if (savedProfile.birthDate) el.birthDate.value = savedProfile.birthDate;
        if (savedProfile.calendarType) el.calendarType.value = savedProfile.calendarType;
        if (savedProfile.birthTime) el.birthTime.value = savedProfile.birthTime;
        if (savedProfile.gender) el.gender.value = savedProfile.gender;
        if (savedProfile.focusTopic) el.focusTopic.value = savedProfile.focusTopic;
      } else {
        el.birthDate.value = "1985-05-15";
      }
    } catch {
      el.birthDate.value = "1985-05-15";
    }
    updateDerivedBadges();

    try {
      const cached = JSON.parse(localStorage.getItem(STORAGE_KEYS.CACHED_FORTUNE) || "null");
      if (cached && cached.date === state.today.isoDate && cached.profile && cached.fortune) {
        renderComprehensiveFortune(cached.profile, cached.fortune);
      }
    } catch {
      // 캐시 무시
    }
  }

  function initPwaInstall() {
    let deferredPrompt = null;

    if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
      navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
    }

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredPrompt = event;
      if (el.installAppBtn) {
        el.installAppBtn.hidden = false;
      }
    });

    if (el.installAppBtn) {
      el.installAppBtn.addEventListener("click", async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          el.installAppBtn.hidden = true;
          showToast("월하다원 단독 앱 설치를 시작합니다.");
        }
        deferredPrompt = null;
      });
    }

    window.addEventListener("appinstalled", () => {
      deferredPrompt = null;
      if (el.installAppBtn) {
        el.installAppBtn.hidden = true;
      }
      showToast("월하다원이 단독 앱으로 설치되었습니다!");
    });
  }

  function init() {
    el.todayDisplay.textContent = state.today.formatted;
    initPwaInstall();
    initZodiacAndStarGrids();
    shuffleTarotDeck();
    initEventListeners();
    restoreSavedState();
  }

  init();
})();

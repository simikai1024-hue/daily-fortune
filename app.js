/**
 * 🌈 무지개 피아노 교실 — 메인 애플리케이션 (Web Audio 다중 화음 엔진 & 동요 따라 치기)
 */

(() => {
  const { PIANO_NOTES, KIDS_SONGS } = window.PianoData;

  const STORAGE_KEYS = {
    STARS: "rainbow_piano_stars_v1",
  };

  const state = {
    instrument: "piano",
    rainbowMode: true,
    wideOctave: false, // false = 2옥타브(C4~E5, 17건반), true = 3옥타브(C3~C6, 37건반)
    currentSongIndex: 0,
    playMode: "practice", // "practice" | "demo"
    stepIndex: 0,
    tempoMultiplier: 1.0,
    demoTimer: null,
    isRecording: false,
    recordStartTime: 0,
    recordedEvents: [],
    playbackTimers: [],
    stars: Number(localStorage.getItem(STORAGE_KEYS.STARS) || "0"),
  };

  const noteMap = new Map(PIANO_NOTES.map((n) => [n.id, n]));
  const keyCodeMap = new Map(
    PIANO_NOTES.filter((n) => n.keyCode).map((n) => [n.keyCode, n.id])
  );
  const keyElements = new Map();
  const activePointers = new Map();
  const heldKeyCodes = new Set();

  let audioCtx = null;
  let masterCompressor = null;

  const el = {
    starCountValue: document.getElementById("starCountValue"),
    installAppBtn: document.getElementById("installAppBtn"),
    songPills: document.getElementById("songPills"),
    startPracticeBtn: document.getElementById("startPracticeBtn"),
    startDemoBtn: document.getElementById("startDemoBtn"),
    resetSongBtn: document.getElementById("resetSongBtn"),
    tempoBtns: Array.from(document.querySelectorAll(".tempo-btn")),
    promptBadge: document.getElementById("promptBadge"),
    promptText: document.getElementById("promptText"),
    noteRibbonScroll: document.getElementById("noteRibbonScroll"),
    noteRibbon: document.getElementById("noteRibbon"),
    instBtns: Array.from(document.querySelectorAll(".inst-btn")),
    rainbowToggleBtn: document.getElementById("rainbowToggleBtn"),
    octaveToggleBtn: document.getElementById("octaveToggleBtn"),
    recordBtn: document.getElementById("recordBtn"),
    playRecBtn: document.getElementById("playRecBtn"),
    lastNoteIndicator: document.getElementById("lastNoteIndicator"),
    keyboardScrollWrap: document.getElementById("keyboardScrollWrap"),
    pianoKeysContainer: document.getElementById("pianoKeysContainer"),
    bravoOverlay: document.getElementById("bravoOverlay"),
    bravoTitle: document.getElementById("bravoTitle"),
    bravoDesc: document.getElementById("bravoDesc"),
    replaySongBtn: document.getElementById("replaySongBtn"),
    nextSongBtn: document.getElementById("nextSongBtn"),
    confettiLayer: document.getElementById("confettiLayer"),
  };

  /**
   * Web Audio API 초기화 (다중 화음 클리핑 방지 컴프레서 포함)
   */
  function ensureAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioCtx();
      masterCompressor = audioCtx.createDynamicsCompressor();
      masterCompressor.threshold.setValueAtTime(-16, audioCtx.currentTime);
      masterCompressor.knee.setValueAtTime(24, audioCtx.currentTime);
      masterCompressor.ratio.setValueAtTime(8, audioCtx.currentTime);
      masterCompressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
      masterCompressor.release.setValueAtTime(0.2, audioCtx.currentTime);
      masterCompressor.connect(audioCtx.destination);
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  /**
   * 악기별 배음 합성 사운드 재생
   */
  function playNoteSound(noteObj, durationSec = 0.9) {
    const ctx = ensureAudioContext();
    const now = ctx.currentTime;
    const freq = noteObj.freq;

    const voiceGain = ctx.createGain();
    voiceGain.connect(masterCompressor);

    if (state.instrument === "piano") {
      // 어쿠스틱 그랜드 피아노: 기본파(triangle) + 2배음(sine) + 3배음(sine) + 로우패스 해머 엔벨로프
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(freq * 6.5, now);
      filter.frequency.exponentialRampToValueAtTime(freq * 1.8, now + durationSec);
      filter.connect(voiceGain);

      const osc1 = ctx.createOscillator();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 2, now);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0.28, now);

      const osc3 = ctx.createOscillator();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(freq * 3, now);
      const g3 = ctx.createGain();
      g3.gain.setValueAtTime(0.08, now);

      osc1.connect(filter);
      osc2.connect(g2);
      g2.connect(filter);
      osc3.connect(g3);
      g3.connect(filter);

      voiceGain.gain.setValueAtTime(0.001, now);
      voiceGain.gain.linearRampToValueAtTime(0.48, now + 0.012);
      voiceGain.gain.exponentialRampToValueAtTime(0.16, now + 0.22);
      voiceGain.gain.exponentialRampToValueAtTime(0.0008, now + durationSec + 0.35);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      osc1.stop(now + durationSec + 0.38);
      osc2.stop(now + durationSec + 0.38);
      osc3.stop(now + durationSec + 0.38);
    } else if (state.instrument === "xylophone") {
      // 실로폰·오르골: 맑은 사인파 + 영롱한 4배음 종소리
      const osc1 = ctx.createOscillator();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(freq, now);

      const oscBell = ctx.createOscillator();
      oscBell.type = "sine";
      oscBell.frequency.setValueAtTime(freq * 4, now);
      const bellGain = ctx.createGain();
      bellGain.gain.setValueAtTime(0.22, now);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc1.connect(voiceGain);
      oscBell.connect(bellGain);
      bellGain.connect(voiceGain);

      voiceGain.gain.setValueAtTime(0.001, now);
      voiceGain.gain.linearRampToValueAtTime(0.5, now + 0.006);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc1.start(now);
      oscBell.start(now);
      osc1.stop(now + 0.68);
      oscBell.stop(now + 0.2);
    } else if (state.instrument === "organ") {
      // 아코디언·오르간: 디튠 톱니파 + 삼각파
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1900, now);
      filter.connect(voiceGain);

      const osc1 = ctx.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(freq, now);
      osc1.detune.setValueAtTime(-6, now);

      const osc2 = ctx.createOscillator();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(freq, now);
      osc2.detune.setValueAtTime(6, now);

      osc1.connect(filter);
      osc2.connect(filter);

      voiceGain.gain.setValueAtTime(0.001, now);
      voiceGain.gain.linearRampToValueAtTime(0.26, now + 0.03);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec + 0.15);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + durationSec + 0.18);
      osc2.stop(now + durationSec + 0.18);
    } else {
      // 우주 신디사이저
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(420, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 0.12);
      filter.connect(voiceGain);

      const osc1 = ctx.createOscillator();
      osc1.type = "square";
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = ctx.createOscillator();
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(freq * 1.004, now);

      osc1.connect(filter);
      osc2.connect(filter);

      voiceGain.gain.setValueAtTime(0.001, now);
      voiceGain.gain.linearRampToValueAtTime(0.24, now + 0.015);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec + 0.25);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + durationSec + 0.28);
      osc2.stop(now + durationSec + 0.28);
    }
  }

  /**
   * 완주 축하 팡파르 화음
   */
  function playBravoFanfare() {
    const chord = ["C4", "E4", "G4", "C5"];
    chord.forEach((id, idx) => {
      const n = noteMap.get(id);
      if (n) {
        setTimeout(() => playNoteSound(n, 1.1), idx * 95);
      }
    });
  }

  /**
   * 현재 모드(2옥타브 아이용 / 3옥타브 넓은 건반)에 맞는 건반 배열 반환
   */
  function getVisibleNotes() {
    if (state.wideOctave) {
      return PIANO_NOTES; // C3 ~ C6
    }
    // 아이들이 가장 치기 편한 큼직한 C4 ~ F5 (흰건반 11개 + 검은건반 7개)
    return PIANO_NOTES.filter((n) => n.midi >= 60 && n.midi <= 77);
  }

  /**
   * 피아노 건반 DOM 렌더링 (흰 건반 비율 계산 후 검은 건반 정밀 배치)
   */
  function renderPianoKeyboard() {
    el.pianoKeysContainer.textContent = "";
    keyElements.clear();
    el.pianoKeysContainer.classList.toggle("wide-mode", state.wideOctave);

    const visibleNotes = getVisibleNotes();
    const whiteNotes = visibleNotes.filter((n) => !n.isSharp);
    const whiteCount = whiteNotes.length;

    // 1. 흰 건반 먼저 추가
    whiteNotes.forEach((note) => {
      const keyBtn = document.createElement("div");
      keyBtn.className = "white-key";
      keyBtn.dataset.noteId = note.id;
      keyBtn.setAttribute("role", "button");
      keyBtn.setAttribute("aria-label", `${note.ko} (${note.id})`);

      const pill = document.createElement("div");
      pill.className = "key-solfege-pill";
      pill.textContent = note.ko.replace("높은 ", "").replace("낮은 ", "").replace("더", "");
      if (state.rainbowMode) {
        pill.style.backgroundColor = note.palette.color;
        pill.style.borderColor = note.palette.border;
        pill.style.color = "#ffffff";
      }

      const sub = document.createElement("div");
      sub.className = "key-note-sub";
      sub.textContent = note.id;

      keyBtn.append(pill, sub);

      if (note.keyLabel) {
        const hint = document.createElement("div");
        hint.className = "key-shortcut-hint";
        hint.textContent = `[${note.keyLabel}]`;
        keyBtn.appendChild(hint);
      }

      el.pianoKeysContainer.appendChild(keyBtn);
      keyElements.set(note.id, keyBtn);
    });

    // 2. 검은 건반을 왼쪽 흰 건반 인덱스에 맞춰 % 위치로 배치
    const whiteIndexById = new Map(whiteNotes.map((n, idx) => [n.id, idx]));
    const blackWidthPct = (100 / whiteCount) * 0.62;

    visibleNotes
      .filter((n) => n.isSharp)
      .forEach((note) => {
        const naturalId = `${note.base}${note.octave}`;
        const leftWhiteIdx = whiteIndexById.get(naturalId);
        if (leftWhiteIdx === undefined) return;

        const centerPct = ((leftWhiteIdx + 1) / whiteCount) * 100;
        const leftPct = centerPct - blackWidthPct / 2;

        const bKey = document.createElement("div");
        bKey.className = "black-key";
        bKey.dataset.noteId = note.id;
        bKey.style.width = `${blackWidthPct}%`;
        bKey.style.left = `${leftPct}%`;
        bKey.setAttribute("role", "button");
        bKey.setAttribute("aria-label", `${note.ko} (${note.id})`);

        const pill = document.createElement("div");
        pill.className = "key-solfege-pill";
        pill.textContent = note.ko;
        bKey.appendChild(pill);

        if (note.keyLabel) {
          const hint = document.createElement("div");
          hint.className = "key-shortcut-hint";
          hint.textContent = note.keyLabel;
          bKey.appendChild(hint);
        }

        el.pianoKeysContainer.appendChild(bKey);
        keyElements.set(note.id, bKey);
      });

    updateTargetKeyGuide();
  }

  /**
   * 건반 위 떠오르는 음표·별 이펙트
   */
  function spawnFloatingNote(keyElem, noteObj) {
    if (!keyElem) return;
    const rect = keyElem.getBoundingClientRect();
    const span = document.createElement("span");
    span.className = "floating-note";
    const icons = ["♪", "♫", "♬", "⭐", "✨"];
    span.textContent = icons[Math.floor(Math.random() * icons.length)];
    span.style.left = `${rect.left + rect.width / 2}px`;
    span.style.top = `${rect.top + 36}px`;
    span.style.color = noteObj.palette.color;
    document.body.appendChild(span);
    setTimeout(() => span.remove(), 860);
  }

  /**
   * 건반 눌림 트리거 (터치·마우스·키보드·자동연주 공용)
   */
  function triggerNoteOn(noteId, isUserAction = true) {
    const noteObj = noteMap.get(noteId);
    if (!noteObj) return;

    playNoteSound(noteObj);

    const keyElem = keyElements.get(noteId);
    if (keyElem) {
      keyElem.classList.add("pressed");
      spawnFloatingNote(keyElem, noteObj);
    }

    el.lastNoteIndicator.textContent = `🎵 방금 누른 건반: ${noteObj.ko} (${noteObj.id})`;

    // 녹음 중이면 타임스탬프 저장
    if (isUserAction && state.isRecording) {
      state.recordedEvents.push({
        noteId,
        offsetMs: performance.now() - state.recordStartTime,
      });
    }

    // '불빛 따라 치기' 모드에서 사용자가 목표 건반을 눌렀는지 판정
    if (isUserAction && state.playMode === "practice") {
      const song = KIDS_SONGS[state.currentSongIndex];
      const expected = song.notes[state.stepIndex];
      if (expected && expected.note === noteId) {
        state.stepIndex += 1;
        if (state.stepIndex >= song.notes.length) {
          handleSongCompleted(song);
        } else {
          updateSheetRibbonHighlight();
          updateTargetKeyGuide();
        }
      }
    }
  }

  function triggerNoteOff(noteId) {
    const keyElem = keyElements.get(noteId);
    if (keyElem) {
      keyElem.classList.remove("pressed");
    }
  }

  /**
   * 동요 선택 알약 및 악보 리본 렌더링
   */
  function renderSongPills() {
    el.songPills.textContent = "";
    KIDS_SONGS.forEach((song, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `song-pill-btn${idx === state.currentSongIndex ? " active" : ""}`;
      btn.textContent = song.title;
      btn.addEventListener("click", () => {
        stopDemoPlayback();
        state.currentSongIndex = idx;
        state.stepIndex = 0;
        renderSongPills();
        renderSheetRibbon();
        updateTargetKeyGuide();
      });
      el.songPills.appendChild(btn);
    });
  }

  function renderSheetRibbon() {
    const song = KIDS_SONGS[state.currentSongIndex];
    el.noteRibbon.textContent = "";

    song.notes.forEach((item, idx) => {
      const nObj = noteMap.get(item.note);
      const card = document.createElement("div");
      card.className = "sheet-note-card";
      card.dataset.index = String(idx);

      if (state.rainbowMode && nObj) {
        card.style.backgroundColor = nObj.palette.soft;
        card.style.borderColor = nObj.palette.color;
      }

      const sol = document.createElement("span");
      sol.className = "sheet-solfege";
      sol.style.color = nObj ? nObj.palette.color : "#334155";
      sol.textContent = nObj ? nObj.ko.replace("높은 ", "↑") : item.note;

      const lyr = document.createElement("span");
      lyr.className = "sheet-lyric";
      lyr.textContent = item.lyric;

      card.append(sol, lyr);
      card.addEventListener("click", () => {
        state.stepIndex = idx;
        triggerNoteOn(item.note, false);
        setTimeout(() => triggerNoteOff(item.note), 260);
        updateSheetRibbonHighlight();
        updateTargetKeyGuide();
      });

      el.noteRibbon.appendChild(card);
    });

    updateSheetRibbonHighlight();
  }

  function updateSheetRibbonHighlight() {
    const song = KIDS_SONGS[state.currentSongIndex];
    const cards = el.noteRibbon.querySelectorAll(".sheet-note-card");

    cards.forEach((card, idx) => {
      card.classList.toggle("done", idx < state.stepIndex);
      card.classList.toggle("current", idx === state.stepIndex);
    });

    const activeCard = cards[state.stepIndex];
    if (activeCard) {
      const container = el.noteRibbonScroll;
      const targetLeft =
        activeCard.offsetLeft - container.clientWidth / 2 + activeCard.clientWidth / 2;
      container.scrollTo({ left: Math.max(0, targetLeft), behavior: "smooth" });
    }

    const curItem = song.notes[state.stepIndex];
    if (curItem) {
      const nObj = noteMap.get(curItem.note);
      el.promptBadge.textContent =
        state.playMode === "demo"
          ? `🎧 자동 연주 중 (${state.stepIndex + 1}/${song.notes.length})`
          : `✨ 따라 치기 (${state.stepIndex + 1}/${song.notes.length})`;
      el.promptText.textContent = `지금 누를 건반: 【 ${nObj ? nObj.ko : curItem.note} 】 — 가사 "${curItem.lyric}"`;
    }
  }

  /**
   * 건반 위 '👇 여기!' 별빛 가이드 표시 업데이트
   */
  function updateTargetKeyGuide() {
    for (const keyElem of keyElements.values()) {
      keyElem.classList.remove("guide-target");
      const oldBadge = keyElem.querySelector(".guide-pointer-badge");
      if (oldBadge) oldBadge.remove();
    }

    if (state.playMode !== "practice") return;

    const song = KIDS_SONGS[state.currentSongIndex];
    const curItem = song.notes[state.stepIndex];
    if (!curItem) return;

    const targetElem = keyElements.get(curItem.note);
    const nObj = noteMap.get(curItem.note);
    if (targetElem && nObj) {
      targetElem.classList.add("guide-target");
      const badge = document.createElement("div");
      badge.className = "guide-pointer-badge";
      badge.textContent = `👇 ${nObj.ko}!`;
      targetElem.appendChild(badge);
    }
  }

  /**
   * 동요 1곡 완주 시 폭죽 & 칭찬 별 스티커 수여
   */
  function handleSongCompleted(song) {
    state.stars += 1;
    localStorage.setItem(STORAGE_KEYS.STARS, String(state.stars));
    el.starCountValue.textContent = String(state.stars);

    playBravoFanfare();
    launchConfetti();

    el.bravoTitle.textContent = `${song.title} 완주 성공! 🎉`;
    el.bravoDesc.textContent = `끝까지 정말 멋지게 연주했어요! 칭찬 별이 ${state.stars}개가 되었어요! ⭐`;
    el.bravoOverlay.hidden = false;
  }

  function launchConfetti() {
    el.confettiLayer.textContent = "";
    const emojis = ["🎉", "⭐", "🌟", "🎵", "🎈", "🌈", "💖"];
    for (let i = 0; i < 34; i++) {
      const p = document.createElement("span");
      p.className = "confetti-piece";
      p.textContent = emojis[i % emojis.length];
      p.style.left = `${Math.random() * 98}vw`;
      p.style.animationDelay = `${Math.random() * 0.45}s`;
      p.style.animationDuration = `${1.4 + Math.random() * 0.8}s`;
      el.confettiLayer.appendChild(p);
    }
    setTimeout(() => {
      el.confettiLayer.textContent = "";
    }, 2500);
  }

  /**
   * 자동 연주 듣기 (선생님 시범 연주 모드)
   */
  function stopDemoPlayback() {
    if (state.demoTimer) {
      clearTimeout(state.demoTimer);
      state.demoTimer = null;
    }
    for (const nId of keyElements.keys()) {
      triggerNoteOff(nId);
    }
  }

  function startDemoPlayback() {
    stopDemoPlayback();
    state.playMode = "demo";
    el.startDemoBtn.classList.add("active");
    el.startPracticeBtn.classList.remove("active");

    const song = KIDS_SONGS[state.currentSongIndex];
    if (state.stepIndex >= song.notes.length) {
      state.stepIndex = 0;
    }
    updateTargetKeyGuide();

    const beatMs = (60000 / song.bpm) / state.tempoMultiplier;

    function playNextStep() {
      if (state.playMode !== "demo") return;
      const item = song.notes[state.stepIndex];
      if (!item) {
        state.playMode = "practice";
        state.stepIndex = 0;
        el.startPracticeBtn.classList.add("active");
        el.startDemoBtn.classList.remove("active");
        updateSheetRibbonHighlight();
        updateTargetKeyGuide();
        return;
      }

      updateSheetRibbonHighlight();
      triggerNoteOn(item.note, false);

      const noteDurationMs = Math.max(180, item.beats * beatMs);
      setTimeout(() => triggerNoteOff(item.note), noteDurationMs * 0.82);

      state.demoTimer = setTimeout(() => {
        state.stepIndex += 1;
        playNextStep();
      }, noteDurationMs);
    }

    playNextStep();
  }

  /**
   * 멀티터치 & 드래그 글리산도 포인터 이벤트 바인딩
   */
  function findNoteIdFromPoint(clientX, clientY) {
    const elem = document.elementFromPoint(clientX, clientY);
    if (!elem) return null;
    const keyNode = elem.closest("[data-note-id]");
    return keyNode ? keyNode.dataset.noteId : null;
  }

  function initKeyboardPointerEvents() {
    const container = el.pianoKeysContainer;

    container.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      container.setPointerCapture(e.pointerId);
      const noteId = findNoteIdFromPoint(e.clientX, e.clientY);
      if (noteId) {
        activePointers.set(e.pointerId, noteId);
        triggerNoteOn(noteId, true);
      }
    });

    container.addEventListener("pointermove", (e) => {
      if (!activePointers.has(e.pointerId)) return;
      const prevNoteId = activePointers.get(e.pointerId);
      const curNoteId = findNoteIdFromPoint(e.clientX, e.clientY);
      if (curNoteId && curNoteId !== prevNoteId) {
        triggerNoteOff(prevNoteId);
        activePointers.set(e.pointerId, curNoteId);
        triggerNoteOn(curNoteId, true);
      }
    });

    const releasePointer = (e) => {
      const prevNoteId = activePointers.get(e.pointerId);
      if (prevNoteId) {
        triggerNoteOff(prevNoteId);
        activePointers.delete(e.pointerId);
      }
    };

    container.addEventListener("pointerup", releasePointer);
    container.addEventListener("pointercancel", releasePointer);

    // PC 키보드 지원
    window.addEventListener("keydown", (e) => {
      if (e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
      const noteId = keyCodeMap.get(e.code);
      if (noteId && keyElements.has(noteId)) {
        heldKeyCodes.add(e.code);
        triggerNoteOn(noteId, true);
      }
    });

    window.addEventListener("keyup", (e) => {
      const noteId = keyCodeMap.get(e.code);
      if (noteId && heldKeyCodes.has(e.code)) {
        heldKeyCodes.delete(e.code);
        triggerNoteOff(noteId);
      }
    });
  }

  /**
   * 컨트롤 버튼 및 녹음 기능 바인딩
   */
  function initControls() {
    el.starCountValue.textContent = String(state.stars);

    el.startPracticeBtn.addEventListener("click", () => {
      stopDemoPlayback();
      state.playMode = "practice";
      el.startPracticeBtn.classList.add("active");
      el.startDemoBtn.classList.remove("active");
      updateSheetRibbonHighlight();
      updateTargetKeyGuide();
    });

    el.startDemoBtn.addEventListener("click", () => {
      if (state.playMode === "demo" && state.demoTimer) {
        stopDemoPlayback();
        state.playMode = "practice";
        el.startPracticeBtn.classList.add("active");
        el.startDemoBtn.classList.remove("active");
        updateSheetRibbonHighlight();
        updateTargetKeyGuide();
      } else {
        startDemoPlayback();
      }
    });

    el.resetSongBtn.addEventListener("click", () => {
      stopDemoPlayback();
      state.stepIndex = 0;
      state.playMode = "practice";
      el.startPracticeBtn.classList.add("active");
      el.startDemoBtn.classList.remove("active");
      updateSheetRibbonHighlight();
      updateTargetKeyGuide();
    });

    el.tempoBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.tempoMultiplier = Number(btn.dataset.speed || "1");
        el.tempoBtns.forEach((b) => b.classList.toggle("active", b === btn));
        if (state.playMode === "demo" && state.demoTimer) {
          startDemoPlayback();
        }
      });
    });

    el.instBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.instrument = btn.dataset.inst || "piano";
        el.instBtns.forEach((b) => b.classList.toggle("active", b === btn));
        const sampleNote = noteMap.get("C4");
        if (sampleNote) playNoteSound(sampleNote, 0.5);
      });
    });

    el.rainbowToggleBtn.addEventListener("click", () => {
      state.rainbowMode = !state.rainbowMode;
      el.rainbowToggleBtn.classList.toggle("active", state.rainbowMode);
      el.rainbowToggleBtn.setAttribute("aria-pressed", String(state.rainbowMode));
      el.rainbowToggleBtn.textContent = state.rainbowMode
        ? "🌈 무지개 계이름 켜짐"
        : "🌈 무지개 계이름 꺼짐";
      renderPianoKeyboard();
      renderSheetRibbon();
    });

    el.octaveToggleBtn.addEventListener("click", () => {
      state.wideOctave = !state.wideOctave;
      el.octaveToggleBtn.classList.toggle("active", state.wideOctave);
      el.octaveToggleBtn.setAttribute("aria-pressed", String(state.wideOctave));
      el.octaveToggleBtn.textContent = state.wideOctave
        ? "👶 아이용 큰 건반으로"
        : "👐 넓은 건반 (3옥타브)";
      renderPianoKeyboard();
    });

    // 내 연주 녹음 & 재생
    el.recordBtn.addEventListener("click", () => {
      if (!state.isRecording) {
        state.isRecording = true;
        state.recordedEvents = [];
        state.recordStartTime = performance.now();
        el.recordBtn.classList.add("recording");
        el.recordBtn.textContent = "⏹️ 녹음 멈추기";
        el.playRecBtn.disabled = true;
      } else {
        state.isRecording = false;
        el.recordBtn.classList.remove("recording");
        el.recordBtn.textContent = "🔴 내 연주 녹음";
        el.playRecBtn.disabled = state.recordedEvents.length === 0;
      }
    });

    el.playRecBtn.addEventListener("click", () => {
      if (state.recordedEvents.length === 0) return;
      state.playbackTimers.forEach((t) => clearTimeout(t));
      state.playbackTimers = [];

      state.recordedEvents.forEach((ev) => {
        const t = setTimeout(() => {
          triggerNoteOn(ev.noteId, false);
          setTimeout(() => triggerNoteOff(ev.noteId), 260);
        }, ev.offsetMs);
        state.playbackTimers.push(t);
      });
    });

    // 완주 축하 모달 버튼
    el.replaySongBtn.addEventListener("click", () => {
      el.bravoOverlay.hidden = true;
      state.stepIndex = 0;
      updateSheetRibbonHighlight();
      updateTargetKeyGuide();
    });

    el.nextSongBtn.addEventListener("click", () => {
      el.bravoOverlay.hidden = true;
      state.currentSongIndex = (state.currentSongIndex + 1) % KIDS_SONGS.length;
      state.stepIndex = 0;
      renderSongPills();
      renderSheetRibbon();
      updateTargetKeyGuide();
    });
  }

  /**
   * PWA 단독 앱 설치 지원
   */
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
        }
        deferredPrompt = null;
      });
    }
  }

  function init() {
    initPwaInstall();
    renderSongPills();
    renderSheetRibbon();
    renderPianoKeyboard();
    initKeyboardPointerEvents();
    initControls();
  }

  init();
})();

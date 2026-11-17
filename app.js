/**
 * 🌈 무지개 리듬 피아노 — 60fps 리듬게임 낙하 노트(Synthesia) & 다중 화음 엔진
 */

(() => {
  const { PIANO_NOTES, KIDS_SONGS } = window.PianoData;

  const STORAGE_KEYS = {
    STARS: "rainbow_piano_stars_v1",
  };

  const PIXELS_PER_BEAT = 74;

  const state = {
    instrument: "piano",
    rainbowMode: true,
    wideOctave: false,
    currentSongIndex: 0,
    playMode: "practice", // "practice" (기다려주는 리듬연습) | "arcade" (실전 리듬게임) | "demo" (자동 연주)
    stepIndex: 0,
    currentBeat: 0,
    tempoMultiplier: 1.0,
    timeline: [],
    totalBeats: 1,
    lastFrameTime: 0,
    combo: 0,
    score: 0,
    completedLock: false,
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
  const keyGeometryMap = new Map();
  const laneElements = new Map();
  const activePointers = new Map();
  const heldKeyCodes = new Set();

  let audioCtx = null;
  let masterCompressor = null;

  const el = {
    starCountValue: document.getElementById("starCountValue"),
    installAppBtn: document.getElementById("installAppBtn"),
    songPills: document.getElementById("songPills"),
    startPracticeBtn: document.getElementById("startPracticeBtn"),
    startArcadeBtn: document.getElementById("startArcadeBtn"),
    startDemoBtn: document.getElementById("startDemoBtn"),
    resetSongBtn: document.getElementById("resetSongBtn"),
    tempoBtns: Array.from(document.querySelectorAll(".tempo-btn")),
    promptBadge: document.getElementById("promptBadge"),
    promptText: document.getElementById("promptText"),
    hudSongTitle: document.getElementById("hudSongTitle"),
    songProgressFill: document.getElementById("songProgressFill"),
    comboBadge: document.getElementById("comboBadge"),
    scoreBadge: document.getElementById("scoreBadge"),
    fallingHighway: document.getElementById("fallingHighway"),
    highwayLanes: document.getElementById("highwayLanes"),
    fallingNotesLayer: document.getElementById("fallingNotesLayer"),
    judgePopup: document.getElementById("judgePopup"),
    noteRibbonScroll: document.getElementById("noteRibbonScroll"),
    noteRibbon: document.getElementById("noteRibbon"),
    instBtns: Array.from(document.querySelectorAll(".inst-btn")),
    rainbowToggleBtn: document.getElementById("rainbowToggleBtn"),
    octaveToggleBtn: document.getElementById("octaveToggleBtn"),
    recordBtn: document.getElementById("recordBtn"),
    playRecBtn: document.getElementById("playRecBtn"),
    keyboardScrollWrap: document.getElementById("keyboardScrollWrap"),
    pianoKeysContainer: document.getElementById("pianoKeysContainer"),
    bravoOverlay: document.getElementById("bravoOverlay"),
    bravoTitle: document.getElementById("bravoTitle"),
    bravoDesc: document.getElementById("bravoDesc"),
    replaySongBtn: document.getElementById("replaySongBtn"),
    nextSongBtn: document.getElementById("nextSongBtn"),
    confettiLayer: document.getElementById("confettiLayer"),
  };

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

  function playNoteSound(noteObj, durationSec = 0.85) {
    const ctx = ensureAudioContext();
    const now = ctx.currentTime;
    const freq = noteObj.freq;

    const voiceGain = ctx.createGain();
    voiceGain.connect(masterCompressor);

    if (state.instrument === "piano") {
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

  function playBravoFanfare() {
    ["C4", "E4", "G4", "C5"].forEach((id, idx) => {
      const n = noteMap.get(id);
      if (n) setTimeout(() => playNoteSound(n, 1.1), idx * 95);
    });
  }

  function getVisibleNotes() {
    if (state.wideOctave) {
      return PIANO_NOTES; // C3 ~ C6
    }
    return PIANO_NOTES.filter((n) => n.midi >= 60 && n.midi <= 79); // C4 ~ G5
  }

  /**
   * 피아노 건반 및 상단 낙하 레인 1:1 좌표 동기화 렌더링
   */
  function renderPianoKeyboard() {
    el.pianoKeysContainer.textContent = "";
    el.highwayLanes.textContent = "";
    keyElements.clear();
    keyGeometryMap.clear();
    laneElements.clear();

    el.pianoKeysContainer.classList.toggle("wide-mode", state.wideOctave);
    el.fallingHighway.classList.toggle("wide-mode", state.wideOctave);

    const visibleNotes = getVisibleNotes();
    const whiteNotes = visibleNotes.filter((n) => !n.isSharp);
    const whiteCount = whiteNotes.length;
    const whiteSlotPct = 100 / whiteCount;

    // 1. 흰 건반 & 상단 세로 레인 생성
    whiteNotes.forEach((note, idx) => {
      const leftPct = idx * whiteSlotPct + 0.25;
      const widthPct = whiteSlotPct - 0.5;
      keyGeometryMap.set(note.id, { leftPct, widthPct, isSharp: false });

      const laneCol = document.createElement("div");
      laneCol.className = "highway-lane-col";
      el.highwayLanes.appendChild(laneCol);
      laneElements.set(note.id, laneCol);

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

    // 2. 검은 건반 배치 & 좌표 등록
    const whiteIndexById = new Map(whiteNotes.map((n, idx) => [n.id, idx]));
    const blackWidthPct = whiteSlotPct * 0.62;

    visibleNotes
      .filter((n) => n.isSharp)
      .forEach((note) => {
        const naturalId = `${note.base}${note.octave}`;
        const leftWhiteIdx = whiteIndexById.get(naturalId);
        if (leftWhiteIdx === undefined) return;

        const centerPct = ((leftWhiteIdx + 1) / whiteCount) * 100;
        const leftPct = centerPct - blackWidthPct / 2;
        keyGeometryMap.set(note.id, { leftPct, widthPct: blackWidthPct, isSharp: true });

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

    renderFallingNoteElements();
    updateTargetKeyGuide();
  }

  /**
   * 현재 선택된 곡의 타임라인(박자 누적 위치) 및 낙하 노트 바 생성
   */
  function buildSongTimeline() {
    const song = KIDS_SONGS[state.currentSongIndex];
    el.hudSongTitle.textContent = song.title;

    let accBeats = 0;
    state.timeline = song.notes.map((item, idx) => {
      const startBeat = accBeats;
      accBeats += item.beats;
      return {
        index: idx,
        noteId: item.note,
        lyric: item.lyric,
        beats: item.beats,
        startBeat,
        endBeat: accBeats,
        hit: false,
        missed: false,
        domBar: null,
      };
    });
    state.totalBeats = Math.max(1, accBeats);
    renderFallingNoteElements();
  }

  function renderFallingNoteElements() {
    el.fallingNotesLayer.textContent = "";

    state.timeline.forEach((item) => {
      const geom = keyGeometryMap.get(item.noteId);
      const nObj = noteMap.get(item.noteId);
      if (!geom || !nObj) return;

      const bar = document.createElement("div");
      bar.className = "falling-note-bar";
      bar.style.left = `${geom.leftPct + 0.15}%`;
      bar.style.width = `${Math.max(2.5, geom.widthPct - 0.3)}%`;

      const barHeight = Math.max(30, item.beats * PIXELS_PER_BEAT - 5);
      bar.style.height = `${barHeight}px`;

      if (state.rainbowMode) {
        bar.style.background = `linear-gradient(180deg, ${nObj.palette.color} 0%, ${nObj.palette.border} 140%)`;
      } else {
        bar.style.background = "linear-gradient(180deg, #6366f1 0%, #4338ca 100%)";
      }

      const lyr = document.createElement("span");
      lyr.className = "bar-lyric";
      lyr.textContent = item.lyric;

      const sol = document.createElement("span");
      sol.className = "bar-solfege";
      sol.textContent = nObj.ko.replace("높은 ", "↑");

      bar.append(lyr, sol);
      el.fallingNotesLayer.appendChild(bar);
      item.domBar = bar;
    });
  }

  /**
   * 판정 이펙트 & 콤보·점수 갱신
   */
  function showJudgeFeedback(text, addScore = 100, keepCombo = true) {
    if (keepCombo) {
      state.combo += 1;
      state.score += addScore + Math.min(50, state.combo * 5);
      el.comboBadge.classList.remove("pop");
      void el.comboBadge.offsetWidth;
      el.comboBadge.classList.add("pop");
    } else {
      state.combo = 0;
    }

    el.comboBadge.textContent = `🔥 ${state.combo} COMBO`;
    el.scoreBadge.textContent = `🏆 ${state.score}점`;

    el.judgePopup.textContent = text;
    el.judgePopup.hidden = false;
    el.judgePopup.style.animation = "none";
    void el.judgePopup.offsetWidth;
    el.judgePopup.style.animation = "";

    clearTimeout(showJudgeFeedback._timer);
    showJudgeFeedback._timer = setTimeout(() => {
      el.judgePopup.hidden = true;
    }, 620);
  }

  function updateProgressUI() {
    const totalCount = state.timeline.length || 1;
    const pct = Math.min(100, Math.round((state.stepIndex / totalCount) * 100));
    el.songProgressFill.style.width = `${pct}%`;
  }

  /**
   * 60fps requestAnimationFrame 메인 낙하 루프
   */
  function tickFallingLoop(timestamp) {
    if (!state.lastFrameTime) state.lastFrameTime = timestamp;
    const dtSec = Math.min(0.08, (timestamp - state.lastFrameTime) / 1000);
    state.lastFrameTime = timestamp;

    const song = KIDS_SONGS[state.currentSongIndex];
    const beatsPerSec = (song.bpm / 60) * state.tempoMultiplier;

    if (!state.completedLock && state.timeline.length > 0) {
      if (state.playMode === "practice") {
        // 🐣 기다려주는 리듬연습: 다음 목표 노트의 startBeat까지 스르륵 내려온 뒤 대기!
        const targetItem = state.timeline[state.stepIndex];
        if (targetItem) {
          if (state.currentBeat < targetItem.startBeat) {
            state.currentBeat = Math.min(
              targetItem.startBeat,
              state.currentBeat + dtSec * beatsPerSec * 1.45
            );
          } else if (state.currentBeat > targetItem.startBeat) {
            state.currentBeat = targetItem.startBeat;
          }
        }
      } else if (state.playMode === "arcade") {
        // 🎮 실전 리듬게임: 논스톱으로 내려오며 지나간 노트는 자동 넘김
        state.currentBeat += dtSec * beatsPerSec;

        while (
          state.stepIndex < state.timeline.length &&
          state.timeline[state.stepIndex].hit
        ) {
          state.stepIndex += 1;
        }

        const curTarget = state.timeline[state.stepIndex];
        if (curTarget && state.currentBeat - curTarget.startBeat > 0.85 && !curTarget.hit) {
          curTarget.missed = true;
          if (curTarget.domBar) curTarget.domBar.classList.add("done-bar");
          state.stepIndex += 1;
          showJudgeFeedback("아차! 😅", 0, false);
          updateSheetRibbonHighlight();
          updateTargetKeyGuide();
          updateProgressUI();
        }

        if (state.stepIndex >= state.timeline.length && state.currentBeat >= state.totalBeats + 0.3) {
          handleSongCompleted(song);
        }
      } else if (state.playMode === "demo") {
        // 🎧 자동 연주 모드: 박자에 맞춰 자동으로 건반을 치며 진행
        state.currentBeat += dtSec * beatsPerSec;
        const curTarget = state.timeline[state.stepIndex];
        if (curTarget && state.currentBeat >= curTarget.startBeat && !curTarget.hit) {
          curTarget.hit = true;
          if (curTarget.domBar) curTarget.domBar.classList.add("done-bar");
          triggerNoteOn(curTarget.noteId, false);
          const holdMs = Math.max(170, (curTarget.beats / beatsPerSec) * 820);
          setTimeout(() => triggerNoteOff(curTarget.noteId), holdMs);
          showJudgeFeedback("🎵 딩동!", 100, true);
          state.stepIndex += 1;
          updateSheetRibbonHighlight();
          updateTargetKeyGuide();
          updateProgressUI();

          if (state.stepIndex >= state.timeline.length) {
            setTimeout(() => {
              if (state.playMode === "demo") {
                resetCurrentSong("practice");
              }
            }, holdMs + 350);
          }
        }
      }
    }

    // 모든 낙하 노트 바의 Y 좌표 업데이트
    const highwayHeight = el.fallingHighway.clientHeight || 220;
    for (const item of state.timeline) {
      const bar = item.domBar;
      if (!bar) continue;

      if (item.hit || item.missed) {
        bar.style.display = "none";
        continue;
      }

      const distFromBottomPx = (item.startBeat - state.currentBeat) * PIXELS_PER_BEAT;
      const barHeightPx = item.beats * PIXELS_PER_BEAT;

      // 화면 범위 바깥이면 숨겨 렌더링 최적화
      if (distFromBottomPx > highwayHeight + 40 || distFromBottomPx + barHeightPx < -40) {
        bar.style.display = "none";
        continue;
      }

      bar.style.display = "flex";
      bar.classList.toggle("next-target", item.index === state.stepIndex);
      bar.style.transform = `translate3d(0, ${-distFromBottomPx}px, 0)`;
    }

    requestAnimationFrame(tickFallingLoop);
  }

  function spawnFloatingNote(keyElem, noteObj) {
    if (!keyElem) return;
    const rect = keyElem.getBoundingClientRect();
    const span = document.createElement("span");
    span.className = "floating-note";
    const icons = ["♪", "♫", "♬", "⭐", "✨"];
    span.textContent = icons[Math.floor(Math.random() * icons.length)];
    span.style.left = `${rect.left + rect.width / 2}px`;
    span.style.top = `${rect.top + 30}px`;
    span.style.color = noteObj.palette.color;
    document.body.appendChild(span);
    setTimeout(() => span.remove(), 820);
  }

  function triggerNoteOn(noteId, isUserAction = true) {
    const noteObj = noteMap.get(noteId);
    if (!noteObj) return;

    playNoteSound(noteObj);

    const keyElem = keyElements.get(noteId);
    if (keyElem) {
      keyElem.classList.add("pressed");
      spawnFloatingNote(keyElem, noteObj);
    }

    const laneElem = laneElements.get(noteId);
    if (laneElem) laneElem.classList.add("active-lane");

    if (isUserAction && state.isRecording) {
      state.recordedEvents.push({
        noteId,
        offsetMs: performance.now() - state.recordStartTime,
      });
    }

    if (!isUserAction || state.completedLock) return;

    const song = KIDS_SONGS[state.currentSongIndex];

    if (state.playMode === "practice") {
      const expected = state.timeline[state.stepIndex];
      if (expected && expected.noteId === noteId) {
        expected.hit = true;
        if (expected.domBar) expected.domBar.classList.add("done-bar");
        showJudgeFeedback("PERFECT! ⭐", 100, true);
        state.stepIndex += 1;
        updateProgressUI();

        if (state.stepIndex >= state.timeline.length) {
          handleSongCompleted(song);
        } else {
          updateSheetRibbonHighlight();
          updateTargetKeyGuide();
        }
      }
    } else if (state.playMode === "arcade") {
      // 현재 박자 근처의 미처리 노트 중 같은 음 찾기
      let matched = null;
      for (let i = state.stepIndex; i < Math.min(state.timeline.length, state.stepIndex + 3); i++) {
        const cand = state.timeline[i];
        if (!cand.hit && !cand.missed && cand.noteId === noteId) {
          const diff = Math.abs(cand.startBeat - state.currentBeat);
          if (diff <= 0.9) {
            matched = { item: cand, diff };
            break;
          }
        }
      }

      if (matched) {
        matched.item.hit = true;
        if (matched.item.domBar) matched.item.domBar.classList.add("done-bar");
        if (matched.diff <= 0.38) {
          showJudgeFeedback("PERFECT! 🌟", 100, true);
        } else {
          showJudgeFeedback("GOOD! 👍", 70, true);
        }
        while (
          state.stepIndex < state.timeline.length &&
          (state.timeline[state.stepIndex].hit || state.timeline[state.stepIndex].missed)
        ) {
          state.stepIndex += 1;
        }
        updateSheetRibbonHighlight();
        updateTargetKeyGuide();
        updateProgressUI();

        if (state.stepIndex >= state.timeline.length) {
          handleSongCompleted(song);
        }
      }
    }
  }

  function triggerNoteOff(noteId) {
    const keyElem = keyElements.get(noteId);
    if (keyElem) keyElem.classList.remove("pressed");
    const laneElem = laneElements.get(noteId);
    if (laneElem) laneElem.classList.remove("active-lane");
  }

  function renderSongPills() {
    el.songPills.textContent = "";
    KIDS_SONGS.forEach((song, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `song-pill-btn${idx === state.currentSongIndex ? " active" : ""}`;
      btn.textContent = song.title;
      btn.addEventListener("click", () => {
        state.currentSongIndex = idx;
        renderSongPills();
        resetCurrentSong(state.playMode === "demo" ? "practice" : state.playMode);
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
        for (let i = 0; i < state.timeline.length; i++) {
          state.timeline[i].hit = i < idx;
          state.timeline[i].missed = false;
        }
        state.currentBeat = state.timeline[idx] ? state.timeline[idx].startBeat : 0;
        triggerNoteOn(item.note, false);
        setTimeout(() => triggerNoteOff(item.note), 240);
        updateSheetRibbonHighlight();
        updateTargetKeyGuide();
        updateProgressUI();
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
      const modeName =
        state.playMode === "demo"
          ? "🎧 자동 연주"
          : state.playMode === "arcade"
          ? "🎮 실전 리듬게임"
          : "🐣 기다려주는 연습";
      el.promptBadge.textContent = `${modeName} (${state.stepIndex + 1}/${song.notes.length})`;
      el.promptText.textContent = `지금 누를 건반: 【 ${nObj ? nObj.ko : curItem.note} 】 — 가사 "${curItem.lyric}"`;
    }
  }

  function updateTargetKeyGuide() {
    for (const keyElem of keyElements.values()) {
      keyElem.classList.remove("guide-target");
      const oldBadge = keyElem.querySelector(".guide-pointer-badge");
      if (oldBadge) oldBadge.remove();
    }

    if (state.playMode === "demo") return;

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

  function resetCurrentSong(mode = "practice") {
    state.playMode = mode;
    state.stepIndex = 0;
    state.combo = 0;
    state.score = 0;
    state.completedLock = false;
    el.comboBadge.textContent = "🔥 0 COMBO";
    el.scoreBadge.textContent = "🏆 0점";

    el.startPracticeBtn.classList.toggle("active", mode === "practice");
    el.startArcadeBtn.classList.toggle("active", mode === "arcade");
    el.startDemoBtn.classList.toggle("active", mode === "demo");

    buildSongTimeline();
    // 위에서 스르륵 내려오는 시작 연출을 위해 시작 비트를 살짝 앞에서 출발
    state.currentBeat = mode === "practice" ? -1.4 : -1.8;

    renderSheetRibbon();
    updateTargetKeyGuide();
    updateProgressUI();
  }

  function handleSongCompleted(song) {
    if (state.completedLock) return;
    state.completedLock = true;

    state.stars += 1;
    localStorage.setItem(STORAGE_KEYS.STARS, String(state.stars));
    el.starCountValue.textContent = String(state.stars);

    playBravoFanfare();
    launchConfetti();

    el.bravoTitle.textContent = `${song.title} 완주 성공! 🎉`;
    el.bravoDesc.textContent = `총점 ${state.score}점! 칭찬 별이 ${state.stars}개가 되었어요! ⭐`;
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

  function initControls() {
    el.starCountValue.textContent = String(state.stars);

    el.startPracticeBtn.addEventListener("click", () => resetCurrentSong("practice"));
    el.startArcadeBtn.addEventListener("click", () => resetCurrentSong("arcade"));
    el.startDemoBtn.addEventListener("click", () => {
      if (state.playMode === "demo") {
        resetCurrentSong("practice");
      } else {
        resetCurrentSong("demo");
      }
    });
    el.resetSongBtn.addEventListener("click", () => resetCurrentSong(state.playMode));

    el.tempoBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        state.tempoMultiplier = Number(btn.dataset.speed || "1");
        el.tempoBtns.forEach((b) => b.classList.toggle("active", b === btn));
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
      renderPianoKeyboard();
      renderSheetRibbon();
    });

    el.octaveToggleBtn.addEventListener("click", () => {
      state.wideOctave = !state.wideOctave;
      el.octaveToggleBtn.classList.toggle("active", state.wideOctave);
      el.octaveToggleBtn.setAttribute("aria-pressed", String(state.wideOctave));
      el.octaveToggleBtn.textContent = state.wideOctave ? "👶 기본 건반" : "👐 넓은 건반";
      renderPianoKeyboard();
    });

    el.recordBtn.addEventListener("click", () => {
      if (!state.isRecording) {
        state.isRecording = true;
        state.recordedEvents = [];
        state.recordStartTime = performance.now();
        el.recordBtn.classList.add("recording");
        el.recordBtn.textContent = "⏹️ 정지";
        el.playRecBtn.disabled = true;
      } else {
        state.isRecording = false;
        el.recordBtn.classList.remove("recording");
        el.recordBtn.textContent = "🔴 녹음";
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
          setTimeout(() => triggerNoteOff(ev.noteId), 240);
        }, ev.offsetMs);
        state.playbackTimers.push(t);
      });
    });

    el.replaySongBtn.addEventListener("click", () => {
      el.bravoOverlay.hidden = true;
      resetCurrentSong(state.playMode);
    });

    el.nextSongBtn.addEventListener("click", () => {
      el.bravoOverlay.hidden = true;
      state.currentSongIndex = (state.currentSongIndex + 1) % KIDS_SONGS.length;
      renderSongPills();
      resetCurrentSong("practice");
    });
  }

  function initPwaInstall() {
    let deferredPrompt = null;

    if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
      navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
    }

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      deferredPrompt = event;
      if (el.installAppBtn) el.installAppBtn.hidden = false;
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
    renderPianoKeyboard();
    resetCurrentSong("practice");
    initKeyboardPointerEvents();
    initControls();
    requestAnimationFrame(tickFallingLoop);
  }

  init();
})();

"use strict";

/* ====== Stufen-Tabelle (dB -> Bezeichnung) ====== */
const STUFEN = [
  { db: 20, label: "Blätterrascheln" },
  { db: 30, label: "leises Flüstern" },
  { db: 40, label: "leiser Regen" },
  { db: 50, label: "leises Gespräch" },
  { db: 60, label: "normales Gespräch" },
  { db: 70, label: "lautes Gespräch" },
  { db: 80, label: "Föhn" },
  { db: 90, label: "Rasenmäher" },
  { db: 100, label: "Kreissäge" },
  { db: 110, label: "Sirene nah" },
  { db: 120, label: "Schmerzgrenze" },
  { db: 130, label: "Düsenjet" },
];

/* ====== Einstellungen speichern/laden ====== */
const STORE_KEY = "krachalarm.settings.v1";
const settings = Object.assign(
  {
    threshold: 80,
    sound: "beep",
    calibration: 100,
    keepAwake: true,
    customSound: null, // data-URL des eigenen Sounds
    customName: "",
  },
  loadSettings()
);

function loadSettings() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
  } catch (e) {
    return {};
  }
}
function saveSettings() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(settings));
  } catch (e) {
    /* z.B. Speicher voll bei großem Sound – ignorieren */
  }
}

/* ====== Farbe je nach dB: grün -> rot -> lila ====== */
function dbColor(db) {
  db = Math.max(0, Math.min(130, db));
  let hue;
  if (db <= 50) {
    hue = 120; // grün
  } else if (db <= 120) {
    hue = 120 * (1 - (db - 50) / 70); // 120 (grün) -> 0 (rot)
  } else {
    hue = 360 - 80 * (db - 120) / 10; // 360 (rot) -> 280 (lila)
  }
  return `hsl(${hue.toFixed(0)}, 85%, 55%)`;
}

/* ====== Smiley je nach Lautstärke ====== */
function faceFor(db) {
  if (db < 30) return "😴";
  if (db < 45) return "🙂";
  if (db < 60) return "😄";
  if (db < 75) return "😯";
  if (db < 90) return "😧";
  if (db < 105) return "😣";
  if (db < 120) return "🤯";
  return "😱";
}

/* ====== Stufen-Text je nach dB ====== */
function stufeLabel(db) {
  let label = "Stille";
  for (const s of STUFEN) {
    if (db >= s.db) label = s.label;
  }
  return label;
}

/* ====== Laufzeit-Status ====== */
let running = false;

/* ====== Grenzwert-Grenzen ====== */
const THRESHOLD_MIN = 20;
const THRESHOLD_MAX = 130;
const THRESHOLD_STEP = 10;

/* ====== DOM-Referenzen ====== */
const el = {
  face: document.getElementById("face"),
  dbValue: document.getElementById("dbValue"),
  stufe: document.getElementById("stufe"),
  bar: document.getElementById("bar"),
  thresholdMark: document.getElementById("thresholdMark"),
  display: document.querySelector(".display"),
  toggleBtn: document.getElementById("toggleBtn"),
  status: document.getElementById("status"),
  thrDown: document.getElementById("thrDown"),
  thrUp: document.getElementById("thrUp"),
  thresholdDb: document.getElementById("thresholdDb"),
  thresholdName: document.getElementById("thresholdName"),
  sound: document.getElementById("sound"),
  testBtn: document.getElementById("testBtn"),
  soundFile: document.getElementById("soundFile"),
  soundFileName: document.getElementById("soundFileName"),
  customWrap: document.querySelector(".custom-sound"),
  calibration: document.getElementById("calibration"),
  calibrationLabel: document.getElementById("calibrationLabel"),
  keepAwake: document.getElementById("keepAwake"),
};

/* ====== UI initialisieren ====== */
el.sound.value = settings.sound;
el.calibration.value = settings.calibration;
el.keepAwake.checked = settings.keepAwake;
el.soundFileName.textContent = settings.customName || "";
updateThresholdUI();
updateCalibrationUI();
updateCustomVisibility();

function setThreshold(v) {
  v = Math.max(THRESHOLD_MIN, Math.min(THRESHOLD_MAX, v));
  settings.threshold = v;
  updateThresholdUI();
  saveSettings();
}

function updateThresholdUI() {
  const v = settings.threshold;
  const color = dbColor(v);
  el.thresholdDb.textContent = v;
  el.thresholdName.textContent = stufeLabel(v);
  el.thresholdDb.parentElement.style.color = color;
  el.thresholdMark.style.left = `${(v / 130) * 100}%`;
  el.thrDown.disabled = v <= THRESHOLD_MIN;
  el.thrUp.disabled = v >= THRESHOLD_MAX;
  updateToggleButton();
}

// Button-Text + Farbe je nach Zustand und Grenzwert
function updateToggleButton() {
  if (running) {
    el.toggleBtn.textContent = "Stopp";
    el.toggleBtn.style.background = ""; // rote Farbe via .running-Klasse
    el.toggleBtn.style.color = "";
  } else {
    el.toggleBtn.textContent = "Los";
    el.toggleBtn.style.background = dbColor(settings.threshold);
    el.toggleBtn.style.color = "#0c0f13";
  }
}
function updateCalibrationUI() {
  el.calibrationLabel.textContent = el.calibration.value;
}
function updateCustomVisibility() {
  el.customWrap.classList.toggle("show", el.sound.value === "custom");
}

/* ====== Einstellungs-Events ====== */
el.thrDown.addEventListener("click", () =>
  setThreshold(settings.threshold - THRESHOLD_STEP)
);
el.thrUp.addEventListener("click", () =>
  setThreshold(settings.threshold + THRESHOLD_STEP)
);
el.sound.addEventListener("change", () => {
  settings.sound = el.sound.value;
  updateCustomVisibility();
  saveSettings();
});
el.calibration.addEventListener("input", () => {
  settings.calibration = Number(el.calibration.value);
  updateCalibrationUI();
  saveSettings();
});
el.keepAwake.addEventListener("change", () => {
  settings.keepAwake = el.keepAwake.checked;
  saveSettings();
  if (!settings.keepAwake) releaseWakeLock();
  else if (running) requestWakeLock();
});

el.soundFile.addEventListener("change", () => {
  const file = el.soundFile.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    settings.customSound = reader.result;
    settings.customName = file.name;
    el.soundFileName.textContent = file.name;
    saveSettings();
  };
  reader.readAsDataURL(file);
});

el.testBtn.addEventListener("click", async () => {
  await ensureAudioContext();
  alarmPlayer.start(el.sound.value);
  setTimeout(() => alarmPlayer.stop(), 1500);
});

/* ====== Audio: Messung ====== */
let audioCtx = null;
let analyser = null;
let micStream = null;
let dataArray = null;
let rafId = null;
let smoothedDb = 0;
let lastUiUpdate = 0;

async function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    await audioCtx.resume();
  }
}

async function startMeasuring() {
  setStatus("");
  try {
    await ensureAudioContext();
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
  } catch (e) {
    setStatus(
      "Mikrofon-Zugriff nicht möglich (" + (e && e.name ? e.name : e) + ")",
      true
    );
    return;
  }

  const source = audioCtx.createMediaStreamSource(micStream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  dataArray = new Float32Array(analyser.fftSize);
  source.connect(analyser);

  running = true;
  el.toggleBtn.classList.add("running");
  updateToggleButton();
  if (settings.keepAwake) requestWakeLock();
  loop();
}

function stopMeasuring() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  if (micStream) micStream.getTracks().forEach((t) => t.stop());
  micStream = null;
  analyser = null;
  alarmPlayer.stop();
  el.display.classList.remove("alarm");
  el.toggleBtn.classList.remove("running");
  updateToggleButton();
  el.dbValue.textContent = "--";
  el.dbValue.style.color = "";
  el.face.textContent = "👂";
  el.stufe.textContent = "Bereit?";
  el.stufe.style.color = "";
  el.bar.style.width = "0%";
  releaseWakeLock();
}

function loop() {
  if (!running) return;
  rafId = requestAnimationFrame(loop);

  analyser.getFloatTimeDomainData(dataArray);
  // RMS berechnen
  let sum = 0;
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i] * dataArray[i];
  }
  const rms = Math.sqrt(sum / dataArray.length);
  // dBFS (negativ) + Kalibrier-Offset -> geschätzte dB(SPL)
  const dbfs = 20 * Math.log10(rms || 1e-7);
  let db = dbfs + settings.calibration;
  db = Math.max(0, Math.min(130, db));

  // Glätten (exponentieller gleitender Mittelwert)
  smoothedDb = smoothedDb * 0.8 + db * 0.2;

  const now = performance.now();
  if (now - lastUiUpdate > 80) {
    lastUiUpdate = now;
    updateDisplay(smoothedDb);
  }

  checkAlarm(smoothedDb);
}

function updateDisplay(db) {
  const rounded = Math.round(db);
  const color = dbColor(db);
  el.dbValue.textContent = rounded;
  el.dbValue.style.color = color;
  el.face.textContent = faceFor(db);
  el.stufe.textContent = stufeLabel(db);
  el.stufe.style.color = color;
  el.bar.style.width = `${(db / 130) * 100}%`;
  el.bar.style.background = color;
}

/* ====== Alarm-Logik mit Hysterese ====== */
let alarmActive = false;
function checkAlarm(db) {
  const on = settings.threshold;
  const off = settings.threshold - 3; // Hysterese, damit es nicht flattert
  if (!alarmActive && db >= on) {
    alarmActive = true;
    alarmPlayer.start(settings.sound);
    el.display.classList.add("alarm");
  } else if (alarmActive && db < off) {
    alarmActive = false;
    alarmPlayer.stop();
    el.display.classList.remove("alarm");
  }
}

/* ====== Alarm-Player (synthetisiert + eigener Sound) ====== */
const alarmPlayer = {
  nodes: [],
  interval: null,
  audioEl: null,
  playing: false,

  start(type) {
    if (this.playing) return;
    this.playing = true;
    ensureAudioContext();

    if (type === "custom") {
      this._playCustom();
    } else if (type === "beep") {
      this._beepLoop(880, 0.18, 0.32);
    } else if (type === "alarm") {
      this._twoTone();
    } else if (type === "sirene") {
      this._siren();
    }
  },

  stop() {
    this.playing = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.nodes.forEach((n) => {
      try {
        n.stop ? n.stop() : n.disconnect();
      } catch (e) {}
    });
    this.nodes = [];
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.currentTime = 0;
      this.audioEl = null;
    }
  },

  _tone(freq, duration) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    gain.gain.value = 0.0001;
    osc.connect(gain).connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    gain.gain.exponentialRampToValueAtTime(0.4, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  },

  _beepLoop(freq, dur, gap) {
    this._tone(freq, dur);
    this.interval = setInterval(() => {
      if (this.playing) this._tone(freq, dur);
    }, (dur + gap) * 1000);
  },

  _twoTone() {
    let high = true;
    const fire = () => {
      if (!this.playing) return;
      this._tone(high ? 750 : 600, 0.3);
      high = !high;
    };
    fire();
    this.interval = setInterval(fire, 350);
  },

  _siren() {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sawtooth";
    gain.gain.value = 0.3;
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    this.nodes.push(osc, gain);

    let dir = 1;
    let freq = 500;
    osc.frequency.value = freq;
    this.interval = setInterval(() => {
      if (!this.playing) return;
      freq += dir * 40;
      if (freq >= 1100) dir = -1;
      if (freq <= 500) dir = 1;
      osc.frequency.linearRampToValueAtTime(
        freq,
        audioCtx.currentTime + 0.05
      );
    }, 50);
  },

  _playCustom() {
    const src = settings.customSound;
    if (!src) {
      // Fallback: Datei aus dem Ordner sounds/ versuchen, sonst Piep
      this.audioEl = new Audio("sounds/alarm.mp3");
      this.audioEl.loop = true;
      this.audioEl.play().catch(() => {
        this.audioEl = null;
        this._beepLoop(880, 0.18, 0.32);
      });
      return;
    }
    this.audioEl = new Audio(src);
    this.audioEl.loop = true;
    this.audioEl.play().catch(() => {
      this.audioEl = null;
      this._beepLoop(880, 0.18, 0.32);
    });
  },
};

/* ====== Start/Stop-Button ====== */
el.toggleBtn.addEventListener("click", () => {
  if (running) stopMeasuring();
  else startMeasuring();
});

/* ====== Screen Wake Lock (Bildschirm an lassen) ====== */
let wakeLock = null;
async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch (e) {}
}
function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release().catch(() => {});
    wakeLock = null;
  }
}
document.addEventListener("visibilitychange", () => {
  if (running && settings.keepAwake && document.visibilityState === "visible") {
    requestWakeLock();
  }
});

function setStatus(msg, isError) {
  el.status.textContent = msg;
  el.status.classList.toggle("error", !!isError);
}

/* ====== Service Worker (für PWA-Installation/Offline) ====== */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

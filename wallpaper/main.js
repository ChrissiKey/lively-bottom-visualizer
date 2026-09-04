/*
 * Bottom Rainbow Audio Visualizer für Lively Wallpaper
 * ----------------------------------------------------
 * Basiert auf lively-audio-visualizer von elias123tre:
 * https://github.com/eliasfloreteng/lively-audio-visualizer
 * Lizenz: MIT
 * Version: 1.0.0
 *
 * Balken-Spektrum am unteren Bildschirmrand (LED-Blöcke oder durchgehend),
 * ohne Spiegelung, mit Farbmodi nach Frequenzband, Pegel oder Regenbogen.
 *
 * Lively liefert über livelyAudioListener(audioArray) 128 Werte:
 * rohe FFT-Magnituden (nicht normiert), Index 0 = tiefste Frequenz (Bass).
 * Die Daten kommen nur ca. 10-25x pro Sekunde, deshalb wird hier auf
 * 60 FPS interpoliert.
 */

// ---------------------------------------------------------------------------
// Einstellungen (Standardwerte = LivelyProperties.json)
// ---------------------------------------------------------------------------
const VERSION = "1.0.0"

const S = {
  // Balken
  barCount: 64,
  barStyle: 1, // 0 = durchgehend, 1 = segmentiert (LED-Blöcke)
  segmentHeight: 0, // px, 0 = quadratisch (automatisch)
  segmentGap: 25, // % der Segmenthöhe
  barGap: 20, // % des Balkenplatzes
  barHeight: 55, // % der Bildschirmhöhe
  zeroLine: true, // Nulllinie am Boden immer anzeigen
  roundedBars: true,
  bottomOffset: 0, // % der Bildschirmhöhe
  sideMargin: 2, // % der Bildschirmbreite
  mirrorBars: false, // Bass in der Mitte, links/rechts gespiegelt
  glow: 6,
  barOpacity: 100,
  // Farben
  colorMode: 0, // siehe LivelyProperties.json
  hueStart: 55,
  hueRange: 290,
  rainbowSpeed: 0, // 0 = statisch
  saturation: 90,
  lightness: 55,
  colorA: "#ff3c78",
  colorB: "#38b6ff",
  bandColorBass: "#ffd400",
  bandColorMid: "#22e06a",
  bandColorHigh: "#ff2fd6",
  bandBassEnd: 25, // % der Balken, die als Bass zählen
  bandMidEnd: 65, // % der Balken, bis wohin Mitten reichen
  bandBlend: 10, // % weicher Übergang zwischen den Bändern
  levelColorLow: "#19e65a",
  levelColorMid: "#ffe020",
  levelColorHigh: "#ff2a2a",
  verticalFade: 25,
  showPeaks: false,
  peakFall: 40,
  // Spiegelung nach unten (standardmäßig aus)
  reflection: false,
  reflectionOpacity: 30,
  reflectionHeight: 50,
  // Audio
  freqRange: 50, // % des Spektrums, das benutzt wird
  freqCurve: 20, // 0 = linear, 100 = sehr viele Balken für den Bass
  includeLowestBin: false,
  bassCompensation: 40,
  sensitivity: 100,
  autoGain: true,
  perBarGain: 40, // 0 = nur Gesamtpegel, 100 = jeder Balken normiert sich selbst
  sharpen: 50, // Spektrum schärfen (Spitzen hervorheben)
  contrast: 55,
  smoothRise: 15,
  smoothFall: 40,
  // Hintergrund
  bgColor: "#000000",
  useBgImage: false,
  bgImagePath: "",
  bgBlur: 0,
  bgDim: 0,
  // Leistung / Debug
  renderScale: 0, // 0 = automatisch (max. 1440p), sonst Prozent der Bildschirmauflösung
  maxFps: 60,
  debug: false,
}

// ---------------------------------------------------------------------------
// Zustand
// ---------------------------------------------------------------------------
let canvas, ctx, bgEl, dimEl
let W = 0
let H = 0
let dpr = 1

let prevTarget = [] // letztes Audio-Frame
let curTarget = [] // aktuelles Audio-Frame
let display = [] // geglättete Werte, die gezeichnet werden
let peaks = []
let peakHold = []
let barPeak = [] // Balken-eigener Referenzpegel
let rawBuf = [] // Arbeitspuffer (werden wiederverwendet, kein GC-Druck)
let normBuf = []

let lastAudioTime = 0
let audioInterval = 100 // ms zwischen zwei Audio-Updates (gemessen)
let runningPeak = 0 // Auto-Gain: aktueller Referenzpegel
let maxEverPeak = 0
let hueShift = 0
let lastFrame = 0
let paused = false
let rafId = 0
let debugInfo = { len: 0, rawMax: 0, raw: [] }
let hasAudio = false
let idleFrames = 0
let colorCacheKey = ""
let colorCache = [] // [Balken][Segment] -> Farbstring
let segCountBuf = []

// Presets / Sicherung der Einstellungen
// Lively schickt beim Start alle gespeicherten Werte als "Schub" (viele Aufrufe
// kurz hintereinander). Danach wird - falls vorhanden - ein Preset/Override
// aus dem Browser-Speicher darübergelegt, damit importierte Einstellungen
// einen Neustart überleben.
const SETTING_KEYS = new Set(Object.keys(S))
const STORAGE_KEY = "bottom-visualizer-settings"
let livelyValues = {} // zuletzt von Lively gesendete Werte
let burstCount = 0
let burstTimer = 0
let pendingChange = null
let presetFile = "" // gewählte Datei im Ordner presets
let store = { override: null, snapshot: null, slots: {} }
let slotNumber = 1
const notice = { text: "", until: 0 }
const isGerman = /^de/i.test(navigator.language || "")
function showNotice(de, en) {
  notice.text = isGerman ? de : en
  notice.until = performance.now() + 3500
  idleFrames = 0
  if (!rafId && !paused) startLoop()
}
try {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) store = Object.assign(store, JSON.parse(raw))
  if (!store.slots || typeof store.slots !== "object") store.slots = {}
} catch (e) {}

// ---------------------------------------------------------------------------
// Hilfsfunktionen
// ---------------------------------------------------------------------------
function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v
}

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex).trim())
  if (!m) return { r: 255, g: 255, b: 255 }
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) }
}

function rgbToHsl({ r, g, b }) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      default:
        h = (r - g) / d + 4
    }
    h *= 60
  }
  return { h, s: s * 100, l: l * 100 }
}

function hsl(h, s, l, a = 1) {
  return `hsla(${((h % 360) + 360) % 360}, ${clamp(s, 0, 100)}%, ${clamp(l, 0, 100)}%, ${a})`
}

// HSL-Mischung auf kürzestem Weg über den Farbkreis
function mixHsl(a, b, t) {
  let dh = b.h - a.h
  if (dh > 180) dh -= 360
  if (dh < -180) dh += 360
  return { h: a.h + dh * t, s: a.s + (b.s - a.s) * t, l: a.l + (b.l - a.l) * t }
}

// Farb-Cache, damit nicht jeden Frame Hex -> HSL gerechnet wird
const hslCache = new Map()
function colorHsl(hex) {
  let c = hslCache.get(hex)
  if (!c) {
    if (hslCache.size > 256) hslCache.clear() // Speicher begrenzen
    c = rgbToHsl(hexToRgb(hex))
    hslCache.set(hex, c)
  }
  return c
}

// Anzahl der Spektrum-Balken (bei Spiegelung nur die Hälfte berechnen)
function spectrumBarCount() {
  return S.mirrorBars ? Math.floor((S.barCount - 1) / 2) + 1 : S.barCount
}

// Balken-Index auf dem Bildschirm -> Index im Spektrum
function spectrumIndex(i) {
  return S.mirrorBars ? Math.floor(Math.abs(i - (S.barCount - 1) / 2)) : i
}

function ensureArrays() {
  const n = spectrumBarCount()
  if (curTarget.length !== n) {
    prevTarget = new Array(n).fill(0)
    curTarget = new Array(n).fill(0)
    display = new Array(n).fill(0)
    peaks = new Array(n).fill(0)
    peakHold = new Array(n).fill(0)
    barPeak = new Array(n).fill(0)
    rawBuf = new Array(n).fill(0)
    normBuf = new Array(n).fill(0)
    colorCacheKey = ""
  }
}

// ---------------------------------------------------------------------------
// Audio-Verarbeitung
// ---------------------------------------------------------------------------
function livelyAudioListener(audioArray) {
  if (!audioArray || audioArray.length < 4) return
  ensureArrays()

  const now = performance.now()
  if (lastAudioTime > 0) {
    const dt = now - lastAudioTime
    if (dt > 5 && dt < 1000) audioInterval = audioInterval * 0.8 + dt * 0.2
  }
  lastAudioTime = now

  const n = spectrumBarCount()
  const src = audioArray
  const first = S.includeLowestBin ? 0 : 1 // Index 0 = Gleichanteil/Sub-Bass
  const usable = Math.max(4, Math.floor((src.length - first) * (S.freqRange / 100)))
  const k = 1 + (S.freqCurve / 100) * 2 // 1 = linear, 3 = stark bassgewichtet
  const comp = (S.bassCompensation / 100) * 4
  const gamma = 0.4 + (S.contrast / 100) * 1.2

  const raw = rawBuf
  let frameMax = 0
  for (let i = 0; i < n; i++) {
    const a = usable * Math.pow(i / n, k)
    const b = usable * Math.pow((i + 1) / n, k)
    let v
    if (b - a < 1) {
      // Weniger als ein Bin pro Balken: zwischen zwei Bins interpolieren
      const pos = first + (a + b) / 2
      const lo = Math.floor(pos)
      const hi = Math.min(lo + 1, src.length - 1)
      const f = pos - lo
      v = Math.abs(src[lo]) * (1 - f) + Math.abs(src[hi]) * f
    } else {
      // Mehrere Bins: Maximum nehmen (reagiert knackiger als der Durchschnitt)
      v = 0
      const lo = first + Math.floor(a)
      const hi = Math.min(first + Math.ceil(b), src.length)
      for (let j = lo; j < hi; j++) {
        const m = Math.abs(src[j])
        if (m > v) v = m
      }
    }
    // Höhere Frequenzen anheben, damit der Bass nicht alles überstrahlt
    const t = n > 1 ? i / (n - 1) : 0
    v *= 1 + comp * t
    if (!isFinite(v)) v = 0
    raw[i] = v
    if (v > frameMax) frameMax = v
  }

  // Gesamtpegel: entweder Auto-Gain (rohe FFT-Werte) oder feste Skala (0..1)
  let scale
  if (S.autoGain) {
    // Langzeit-Maximum (sinkt sehr langsam), damit Rauschen bei Stille nicht
    // hochverstärkt wird
    maxEverPeak = Math.max(frameMax, maxEverPeak * Math.pow(0.5, audioInterval / 90000))
    // Referenzpegel: springt sofort hoch, sinkt langsam (ca. 4 s Halbwertszeit)
    const decay = Math.pow(0.5, audioInterval / 4000)
    runningPeak = Math.max(frameMax, runningPeak * decay, maxEverPeak * 0.08)
    scale = runningPeak > 0 ? 1 / runningPeak : 0
  } else {
    scale = 1
  }
  scale *= S.sensitivity / 100

  // Balken-eigene Pegelanpassung: jeder Balken misst sich an seinem eigenen
  // jüngsten Maximum -> Höhen/Mitten werden sichtbar, obwohl der Bass lauter ist
  const perMix = S.perBarGain / 100
  const barDecay = Math.pow(0.5, audioInterval / 3000)
  const noiseFloor = S.autoGain ? runningPeak * 0.03 : 0.02
  const norm = normBuf
  for (let i = 0; i < n; i++) {
    const g = clamp(raw[i] * scale, 0, 1)
    let v = g
    if (perMix > 0) {
      barPeak[i] = Math.max(raw[i], barPeak[i] * barDecay, noiseFloor)
      const p = barPeak[i] > 0 ? clamp((raw[i] / barPeak[i]) * (S.sensitivity / 100), 0, 1) : 0
      v = g * (1 - perMix) + p * perMix
    }
    norm[i] = v
  }

  // Spektrum schärfen: lokale Spitzen gegenüber der Nachbarschaft anheben
  const sharp = (S.sharpen / 100) * 1.5
  for (let i = 0; i < n; i++) {
    let v = norm[i]
    if (sharp > 0 && n > 2) {
      const l = norm[i > 0 ? i - 1 : i + 1]
      const r = norm[i < n - 1 ? i + 1 : i - 1]
      const blur = (l + 2 * v + r) / 4
      v = clamp(v + sharp * (v - blur), 0, 1)
    }
    prevTarget[i] = curTarget[i]
    curTarget[i] = Math.pow(v, gamma)
  }

  if (S.debug) {
    debugInfo.len = src.length
    debugInfo.rawMax = frameMax
    if (debugInfo.raw.length !== src.length) debugInfo.raw = new Array(src.length).fill(0)
    for (let i = 0; i < src.length; i++) debugInfo.raw[i] = Math.abs(src[i]) || 0
  } else if (debugInfo.raw.length) {
    debugInfo.raw = []
  }
  hasAudio = frameMax > 0
  idleFrames = 0

  if (!rafId && !paused) startLoop()
}

// ---------------------------------------------------------------------------
// Farben
// ---------------------------------------------------------------------------
// Farbe eines Balkens. i = Bildschirm-Index, si = Spektrum-Index,
// tHeight = 0 (unten) .. 1 (oben) für höhenabhängige Modi.
function barColor(i, si, tHeight, lightOffset = 0) {
  const tw = S.barCount > 1 ? i / (S.barCount - 1) : 0 // Position über die Breite
  const ns = spectrumBarCount()
  const ts = ns > 1 ? si / (ns - 1) : 0 // Position im Spektrum (0 = Bass)
  let c
  switch (S.colorMode) {
    case 1: // Zwei Farben
      c = mixHsl(colorHsl(S.colorA), colorHsl(S.colorB), tw)
      break
    case 2: // Einfarbig
      c = colorHsl(S.colorA)
      break
    case 3: {
      // Frequenzbänder: Bass / Mitten / Höhen
      const bassEnd = S.bandBassEnd / 100
      const midEnd = Math.max(S.bandMidEnd / 100, bassEnd)
      const blend = Math.max(0.001, (S.bandBlend / 100) * 0.5)
      const bass = colorHsl(S.bandColorBass)
      const mid = colorHsl(S.bandColorMid)
      const high = colorHsl(S.bandColorHigh)
      if (ts < bassEnd - blend) c = bass
      else if (ts < bassEnd + blend) c = mixHsl(bass, mid, (ts - (bassEnd - blend)) / (2 * blend))
      else if (ts < midEnd - blend) c = mid
      else if (ts < midEnd + blend) c = mixHsl(mid, high, (ts - (midEnd - blend)) / (2 * blend))
      else c = high
      break
    }
    case 4: {
      // Pegel: Farbe nach Höhe (unten -> Mitte -> oben)
      const lo = colorHsl(S.levelColorLow)
      const mi = colorHsl(S.levelColorMid)
      const hi = colorHsl(S.levelColorHigh)
      c = tHeight < 0.5 ? mixHsl(lo, mi, tHeight * 2) : mixHsl(mi, hi, (tHeight - 0.5) * 2)
      break
    }
    case 5: // Regenbogen vertikal (Farbe nach Höhe)
      c = { h: S.hueStart + S.hueRange * tHeight + hueShift, s: S.saturation, l: S.lightness }
      break
    default: // Regenbogen über die Breite
      c = { h: S.hueStart + S.hueRange * tw + hueShift, s: S.saturation, l: S.lightness }
  }
  return lightOffset ? { h: c.h, s: c.s, l: c.l + lightOffset } : c
}

function heightDependentColor() {
  return S.colorMode === 4 || S.colorMode === 5
}

// ---------------------------------------------------------------------------
// Zeichnen
// ---------------------------------------------------------------------------
// Interne Render-Auflösung: Bei 4K sind die Bildpuffer der größte Speicherposten
// (jeder Puffer 3840x2160x4 Byte = 33 MB, der Browser hält mehrere davon).
// LED-Blöcke sehen auch hochskaliert sauber aus.
let renderFactor = 1
function computeRenderFactor() {
  const fullH = H * dpr
  if (S.renderScale > 0) return clamp(S.renderScale, 25, 100) / 100
  return fullH > 1440 ? 1440 / fullH : 1 // automatisch: höchstens 1440p intern
}

function resize() {
  if (!canvas) return
  dpr = window.devicePixelRatio || 1
  W = window.innerWidth
  H = window.innerHeight
  renderFactor = computeRenderFactor()
  const k = dpr * renderFactor
  canvas.width = Math.max(1, Math.round(W * k))
  canvas.height = Math.max(1, Math.round(H * k))
  ctx.setTransform(k, 0, 0, k, 0, 0)
  colorCacheKey = ""
}

function roundedRectPath(x, y, w, h, r) {
  ctx.beginPath()
  if (r <= 0) {
    ctx.rect(x, y, w, h)
    return
  }
  r = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Nur oben abgerundet (durchgehende Balken)
function roundedBarPath(x, y, w, h, r) {
  ctx.beginPath()
  if (r <= 0 || h <= 0) {
    ctx.rect(x, y, w, h)
    return
  }
  r = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x, y + h)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h)
  ctx.closePath()
}

// Farbstrings für alle Balken/Segmente einmal berechnen und wiederverwenden.
// Ohne Cache entstehen pro Frame tausende neue Strings (GC-Last bei 4K).
function ensureColorCache(maxSegs, fade, byHeight) {
  const key = [
    S.colorMode, S.hueStart, S.hueRange, Math.round(hueShift), S.saturation, S.lightness,
    S.colorA, S.colorB, S.bandColorBass, S.bandColorMid, S.bandColorHigh, S.bandBassEnd,
    S.bandMidEnd, S.bandBlend, S.levelColorLow, S.levelColorMid, S.levelColorHigh,
    S.barCount, S.mirrorBars, maxSegs, fade,
  ].join("|")
  if (key === colorCacheKey && colorCache.length === S.barCount) return
  colorCacheKey = key
  colorCache = new Array(S.barCount)
  for (let i = 0; i < S.barCount; i++) {
    const si = spectrumIndex(i)
    const segs = new Array(maxSegs)
    const base = byHeight ? null : barColor(i, si, 0.5)
    for (let k = 0; k < maxSegs; k++) {
      const t = maxSegs > 1 ? k / (maxSegs - 1) : 1
      const c = byHeight ? barColor(i, si, t) : base
      const l = c.l * (1 - fade * 0.7) + (c.l + fade * 12 - c.l * (1 - fade * 0.7)) * t
      segs[k] = hsl(c.h, c.s, l)
    }
    const g = barColor(i, si, 0.5)
    const pk = barColor(i, si, 1, 22)
    colorCache[i] = { segs, glow: hsl(g.h, g.s, g.l), peak: hsl(pk.h, pk.s, pk.l) }
  }
}

// Segmentierte Balken (LED-Blöcke)
function drawSegmentedBars(baseY, maxH, alpha, withGlow, withPeaks) {
  const marginX = (W * S.sideMargin) / 100
  const areaW = W - 2 * marginX
  const slot = areaW / S.barCount
  const barW = Math.max(1, slot * (1 - S.barGap / 100))
  const segH = S.segmentHeight > 0 ? Math.max(2, S.segmentHeight) : Math.max(2, barW)
  const gap = segH * (S.segmentGap / 100)
  const pitch = segH + gap
  const maxSegs = clamp(Math.floor((maxH + gap) / pitch), 1, 1000)
  const minSegs = S.zeroLine ? 1 : 0 // Nulllinie = unterste Blockreihe
  const radius = S.roundedBars ? Math.min(barW, segH) * 0.18 : 0
  const fade = S.verticalFade / 100
  const byHeight = heightDependentColor()
  ensureColorCache(maxSegs, fade, byHeight)

  ctx.globalAlpha = alpha

  const segCounts = segCountBuf.length === S.barCount ? segCountBuf : (segCountBuf = new Array(S.barCount))
  for (let i = 0; i < S.barCount; i++) {
    const v = display[spectrumIndex(i)] || 0
    segCounts[i] = Math.max(minSegs, Math.round(v * maxSegs))
  }

  // Glow-Durchgang: ein Pfad pro Balken statt einem Schatten pro Segment
  if (withGlow) {
    ctx.shadowBlur = S.glow
    for (let i = 0; i < S.barCount; i++) {
      const segs = segCounts[i]
      if (segs <= 0) continue
      const x = marginX + i * slot + (slot - barW) / 2
      const col = colorCache[i].glow
      ctx.fillStyle = col
      ctx.shadowColor = col
      ctx.beginPath()
      for (let k = 0; k < segs; k++) {
        ctx.rect(x, baseY - (k + 1) * segH - k * gap, barW, segH)
      }
      ctx.fill()
    }
    ctx.shadowBlur = 0
  }

  for (let i = 0; i < S.barCount; i++) {
    const segs = segCounts[i]
    if (segs <= 0) continue
    const x = marginX + i * slot + (slot - barW) / 2
    const segColors = colorCache[i].segs
    for (let k = 0; k < segs && k < maxSegs; k++) {
      ctx.fillStyle = segColors[k]
      roundedRectPath(x, baseY - (k + 1) * segH - k * gap, barW, segH, radius)
      ctx.fill()
    }
  }

  if (withPeaks && S.showPeaks) {
    for (let i = 0; i < S.barCount; i++) {
      const si = spectrumIndex(i)
      const p = peaks[si] || 0
      const k = Math.round(p * maxSegs)
      if (k <= minSegs) continue
      const x = marginX + i * slot + (slot - barW) / 2
      ctx.fillStyle = colorCache[i].peak
      roundedRectPath(x, baseY - (k + 1) * segH - k * gap, barW, segH, radius)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
}

// Durchgehende Balken
function drawSolidBars(baseY, maxH, alpha, withGlow, withPeaks) {
  const marginX = (W * S.sideMargin) / 100
  const areaW = W - 2 * marginX
  const slot = areaW / S.barCount
  const barW = Math.max(1, slot * (1 - S.barGap / 100))
  const minH = S.zeroLine ? Math.max(3, barW * 0.3) : 0 // Nulllinie
  const radius = S.roundedBars ? barW / 2 : 0
  const fade = S.verticalFade / 100
  const byHeight = heightDependentColor()

  ctx.globalAlpha = alpha
  ctx.shadowBlur = withGlow ? S.glow : 0

  for (let i = 0; i < S.barCount; i++) {
    const si = spectrumIndex(i)
    const v = display[si] || 0
    const h = Math.max(minH, v * maxH)
    const x = marginX + i * slot + (slot - barW) / 2
    const y = baseY - h

    let fill
    if (byHeight) {
      // Farbverlauf über die volle Höhe, Balken zeigt nur den unteren Teil
      const g = ctx.createLinearGradient(0, baseY, 0, baseY - maxH)
      for (let s = 0; s <= 8; s++) {
        const c = barColor(i, si, s / 8)
        g.addColorStop(s / 8, hsl(c.h, c.s, c.l))
      }
      fill = g
      if (withGlow) {
        const cm = barColor(i, si, clamp(v, 0, 1))
        ctx.shadowColor = hsl(cm.h, cm.s, cm.l)
      }
    } else {
      const c = barColor(i, si, 0.5)
      if (fade > 0) {
        const g = ctx.createLinearGradient(0, baseY, 0, y)
        g.addColorStop(0, hsl(c.h, c.s, c.l * (1 - fade * 0.7)))
        g.addColorStop(1, hsl(c.h, c.s, c.l + fade * 12))
        fill = g
      } else {
        fill = hsl(c.h, c.s, c.l)
      }
      if (withGlow) ctx.shadowColor = hsl(c.h, c.s, c.l)
    }
    ctx.fillStyle = fill
    roundedBarPath(x, y, barW, h, radius)
    ctx.fill()
  }

  if (withPeaks && S.showPeaks) {
    ctx.shadowBlur = 0
    const capH = Math.max(2, Math.min(5, barW * 0.35))
    for (let i = 0; i < S.barCount; i++) {
      const si = spectrumIndex(i)
      const p = peaks[si] || 0
      if (p * maxH <= minH + capH) continue
      const x = marginX + i * slot + (slot - barW) / 2
      const y = baseY - p * maxH - capH * 2
      const c = barColor(i, si, 1, 22)
      ctx.fillStyle = hsl(c.h, c.s, c.l)
      roundedBarPath(x, y, barW, capH, S.roundedBars ? capH / 2 : 0)
      ctx.fill()
    }
  }
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
}

function drawBars(baseY, maxH, alpha, withGlow, withPeaks) {
  if (S.barStyle === 1) drawSegmentedBars(baseY, maxH, alpha, withGlow, withPeaks)
  else drawSolidBars(baseY, maxH, alpha, withGlow, withPeaks)
}

function drawNotice(now) {
  if (!notice.text || now > notice.until) return
  const remaining = notice.until - now
  const alpha = Math.min(1, remaining / 500)
  const u = Math.max(1, H / 1080)
  const fontPx = Math.round(18 * u)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.font = `600 ${fontPx}px "Segoe UI", Roboto, Arial, sans-serif`
  const tw = ctx.measureText(notice.text).width
  const pad = fontPx * 0.8
  const bw = tw + pad * 2
  const bh = fontPx + pad * 1.2
  const x = (W - bw) / 2
  const y = H * 0.08
  ctx.fillStyle = "rgba(0,0,0,0.7)"
  roundedRectPath(x, y, bw, bh, pad * 0.5)
  ctx.fill()
  ctx.strokeStyle = "rgba(255,255,255,0.25)"
  ctx.lineWidth = Math.max(1, u)
  ctx.stroke()
  ctx.fillStyle = "#fff"
  ctx.textBaseline = "middle"
  ctx.fillText(notice.text, x + pad, y + bh / 2)
  ctx.restore()
  idleFrames = 0
}

function drawDebug() {
  const mem = performance.memory ? `${(performance.memory.usedJSHeapSize / 1048576).toFixed(1)} MB` : "n/a"
  const lines = [
    `Audio-Update: ${audioInterval.toFixed(0)} ms  |  Werte: ${debugInfo.len}  |  Roh-Max: ${debugInfo.rawMax.toFixed(2)}`,
    `Referenzpegel: ${runningPeak.toFixed(2)}  |  Balken: ${S.barCount}  |  Bins genutzt: ${S.freqRange}%`,
    `Canvas: ${canvas.width}x${canvas.height} (${Math.round(renderFactor * 100)}%)  |  JS-Heap: ${mem}  |  FPS-Limit: ${S.maxFps}  |  v${VERSION}`,
  ]
  const u = Math.max(1, H / 1080) // Skalierung für 4K
  ctx.font = `${Math.round(14 * u)}px monospace`
  ctx.fillStyle = "rgba(0,0,0,0.6)"
  ctx.fillRect(8 * u, 8 * u, 600 * u, 152 * u)
  ctx.fillStyle = "#fff"
  lines.forEach((l, i) => ctx.fillText(l, 16 * u, (28 + i * 18) * u))
  // Rohe Bins als kleine Kurve (auf Maximum normiert), jeder 8. Bin gelb
  const raw = debugInfo.raw
  if (raw.length) {
    const m = Math.max(1e-9, ...raw)
    const bw = (580 * u) / raw.length
    for (let i = 0; i < raw.length; i++) {
      const h = (raw[i] / m) * 80 * u
      ctx.fillStyle = i % 8 === 0 ? "#ff8" : "#8cf"
      ctx.fillRect(16 * u + i * bw, 156 * u - h, Math.max(1, bw - 1), h)
    }
  }
}

function frame(now) {
  rafId = 0
  if (paused) return
  try {
    renderFrame(now)
  } catch (e) {
    // Ein Fehler darf die Schleife nicht dauerhaft stoppen
    lastFrame = 0
  }
  if (idleFrames > 30) {
    // Leerlauf (Stille, nichts bewegt sich): nur noch 5x pro Sekunde prüfen
    setTimeout(() => {
      if (!rafId && !paused) rafId = requestAnimationFrame(frame)
    }, 200)
  } else {
    rafId = requestAnimationFrame(frame)
  }
}

function renderFrame(now) {
  // Bildrate begrenzen (spart CPU/GPU, z. B. bei 4K)
  if (S.maxFps < 60 && lastFrame && now - lastFrame < 1000 / S.maxFps - 1) return
  ensureArrays()

  const dt = lastFrame ? Math.min(100, now - lastFrame) : 16
  lastFrame = now
  const dts = dt / 1000

  // Sehr lange keine Audiodaten -> auf Null fahren (z. B. Stille/Pause)
  const audioStale = lastAudioTime === 0 || now - lastAudioTime > 1500

  // Interpolation zwischen den (langsamen) Audio-Updates
  const lerpT = clamp((now - lastAudioTime) / Math.max(1, audioInterval), 0, 1)
  const tauRise = 5 + Math.pow(S.smoothRise / 100, 2) * 400
  const tauFall = 5 + Math.pow(S.smoothFall / 100, 2) * 400
  const kRise = 1 - Math.exp(-dt / tauRise)
  const kFall = 1 - Math.exp(-dt / tauFall)
  const peakSpeed = 0.15 + Math.pow(S.peakFall / 100, 2) * 3

  const n = display.length
  let motion = 0
  for (let i = 0; i < n; i++) {
    const target = audioStale ? 0 : prevTarget[i] + (curTarget[i] - prevTarget[i]) * lerpT
    const d = display[i]
    let v = d + (target - d) * (target > d ? kRise : kFall)
    if (v < 1e-4) v = 0 // sehr kleine Werte auf 0 setzen (kein endloses Abklingen)
    display[i] = v

    if (v >= peaks[i]) {
      peaks[i] = v
      peakHold[i] = now + 250
    } else if (now > peakHold[i]) {
      peaks[i] = Math.max(v, peaks[i] - peakSpeed * dts)
    }
    // Bewegung: Balkenänderung plus fallende Spitzen (nur wenn sichtbar)
    motion += Math.abs(v - d) + (S.showPeaks ? peaks[i] - v : 0)
  }

  hueShift = (hueShift + S.rainbowSpeed * 1.5 * dts) % 360

  // Leerlauf erkennen: keine Bewegung, keine Farbwanderung, keine Diagnose
  const rainbowMoving = S.rainbowSpeed > 0 && (S.colorMode === 0 || S.colorMode === 5)
  if (motion < 0.0005 && !rainbowMoving && !S.debug) idleFrames++
  else idleFrames = 0

  ctx.clearRect(0, 0, W, H)
  const baseY = H - (H * S.bottomOffset) / 100
  const maxH = (H * S.barHeight) / 100

  if (S.reflection && S.bottomOffset > 0) {
    ctx.save()
    ctx.translate(0, baseY)
    ctx.scale(1, -1)
    ctx.translate(0, -baseY)
    drawBars(baseY, maxH * (S.reflectionHeight / 100), S.reflectionOpacity / 100, false, false)
    ctx.restore()
    const reflH = Math.min(H - baseY, maxH * (S.reflectionHeight / 100))
    const g = ctx.createLinearGradient(0, baseY, 0, baseY + reflH)
    g.addColorStop(0, "rgba(0,0,0,0.15)")
    g.addColorStop(1, "rgba(0,0,0,1)")
    ctx.globalCompositeOperation = "destination-out"
    ctx.fillStyle = g
    ctx.fillRect(0, baseY, W, reflH + 1)
    ctx.globalCompositeOperation = "source-over"
  }

  drawBars(baseY, maxH, S.barOpacity / 100, S.glow > 0, true)

  drawNotice(now)
  if (S.debug) drawDebug()
}

function startLoop() {
  if (!rafId && ctx) {
    lastFrame = 0
    rafId = requestAnimationFrame(frame)
  }
}

// ---------------------------------------------------------------------------
// Lively-Schnittstellen
// ---------------------------------------------------------------------------
function livelyWallpaperPlaybackChanged(data) {
  try {
    const obj = typeof data === "string" ? JSON.parse(data) : data
    paused = !!(obj && obj.IsPaused)
  } catch (e) {
    paused = false
  }
  if (!paused) startLoop()
}

function toBool(val) {
  return val === true || val === "true" || val === 1
}

function toNum(val, fallback) {
  const n = Number(val)
  return isFinite(n) ? n : fallback
}

function applyBackground() {
  if (!bgEl) return
  document.body.style.backgroundColor = S.bgColor
  bgEl.style.backgroundImage =
    S.useBgImage && S.bgImagePath ? `url("${encodeURI(S.bgImagePath)}")` : "none"
  bgEl.style.filter = S.bgBlur > 0 ? `blur(${S.bgBlur}px)` : "none"
  bgEl.style.transform = S.bgBlur > 0 ? "scale(1.05)" : "none"
  dimEl.style.opacity = String(S.bgDim / 100)
}

// Einfache Zuordnung Property-Name -> Einstellung (Zahlen, Schalter, Farben)
const NUMBER_PROPS = [
  "segmentHeight", "segmentGap", "barGap", "barHeight", "bottomOffset",
  "sideMargin", "glow", "barOpacity", "hueStart", "hueRange", "rainbowSpeed", "saturation",
  "lightness", "bandBassEnd", "bandMidEnd", "bandBlend", "verticalFade", "peakFall",
  "reflectionOpacity", "reflectionHeight", "freqRange", "freqCurve", "bassCompensation",
  "sensitivity", "perBarGain", "sharpen", "contrast", "smoothRise", "smoothFall",
]
const BOOL_PROPS = [
  "roundedBars", "zeroLine", "showPeaks", "reflection", "includeLowestBin", "debug",
]
const COLOR_PROPS = [
  "colorA", "colorB", "bandColorBass", "bandColorMid", "bandColorHigh",
  "levelColorLow", "levelColorMid", "levelColorHigh",
]

function saveStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch (e) {}
}

function currentSettings() {
  const out = {}
  for (const k of SETTING_KEYS) out[k] = S[k]
  return out
}

// Werte eines Presets anwenden. Akzeptiert {key: wert} oder das Format von
// LivelyProperties.json ({key: {value: wert}}).
function applySettingsObject(obj) {
  if (!obj || typeof obj !== "object") return 0
  let n = 0
  for (const [k, v] of Object.entries(obj)) {
    const val = v && typeof v === "object" && "value" in v ? v.value : v
    if (!SETTING_KEYS.has(k) || k === "debug") continue
    if (k === "bgImagePath") continue
    setProperty(k, val)
    n++
  }
  return n
}

function applyOverride() {
  if (store.override) applySettingsObject(store.override)
}

function loadPreset(file) {
  if (!file) return
  // Nur Dateien aus dem Ordner presets, keine Pfadwechsel, keine URLs
  const path = String(file).replace(/\\/g, "/")
  if (!/^presets\/[\w .()\-]+\.json$/i.test(path)) return
  fetch(path, { cache: "no-store" })
    .then((r) => r.text())
    .then((t) => (t.length > 65536 ? null : JSON.parse(t)))
    .then((obj) => {
      const n = applySettingsObject(obj)
      if (n > 0) {
        store.override = currentSettings()
        store.snapshot = currentSettings()
        saveStore()
        showNotice(`Preset geladen: ${path.slice(8)}`, `Preset loaded: ${path.slice(8)}`)
      } else {
        showNotice("Preset enthält keine gültigen Werte", "Preset contains no valid values")
      }
    })
    .catch(() => showNotice("Preset konnte nicht gelesen werden", "Could not read preset"))
}

function livelyPropertyListener(name, val) {
  // Schub-Erkennung (Lively sendet beim Start alle Werte hintereinander)
  burstCount++
  clearTimeout(burstTimer)
  burstTimer = setTimeout(() => {
    const wasBurst = burstCount >= 5
    burstCount = 0
    if (wasBurst) {
      applyOverride()
    } else if (pendingChange) {
      // Einzelne Änderung durch den Nutzer: merken (Override + Sicherung)
      if (store.override) store.override[pendingChange.name] = pendingChange.val
      store.snapshot = currentSettings()
      saveStore()
    }
    pendingChange = null
  }, 400)

  switch (name) {
    case "presetFile":
      presetFile = val ? String(val) : ""
      return
    case "applyPreset":
      loadPreset(presetFile)
      return
    case "slotNumber":
      slotNumber = clamp(Math.round(toNum(val, 0)), 0, 2) + 1
      return
    case "saveSlot": {
      const data = currentSettings()
      data._savedAt = new Date().toISOString()
      store.slots[slotNumber] = data
      saveStore()
      showNotice(`Einstellungen in Speicherplatz ${slotNumber} gesichert`, `Settings saved to slot ${slotNumber}`)
      return
    }
    case "loadSlot": {
      const data = store.slots[slotNumber]
      if (!data) {
        showNotice(`Speicherplatz ${slotNumber} ist leer`, `Slot ${slotNumber} is empty`)
        return
      }
      applySettingsObject(data)
      store.override = currentSettings()
      saveStore()
      const when = data._savedAt ? new Date(data._savedAt).toLocaleString() : ""
      showNotice(`Speicherplatz ${slotNumber} geladen (${when})`, `Slot ${slotNumber} loaded (${when})`)
      return
    }
    case "useLivelyValues":
      store.override = null
      saveStore()
      applySettingsObject(livelyValues)
      showNotice("Reglerwerte von Lively aktiv", "Using Lively's slider values")
      return
    default:
      break
  }

  if (SETTING_KEYS.has(name) || name === "bgImage") {
    livelyValues[name] = val
    pendingChange = { name, val }
  }
  setProperty(name, val)
  colorCacheKey = ""
  idleFrames = 0
}

// Erlaubte Wertebereiche (aus LivelyProperties.json), schützt vor kaputten
// Presets: z. B. würde eine Blockhöhe von 0,01 px Millionen Blöcke erzeugen.
const LIMITS = {"barCount":[8,128],"barGap":[0,80],"segmentHeight":[0,120],"segmentGap":[0,80],"barHeight":[5,100],"verticalFade":[0,100],"glow":[0,40],"barOpacity":[10,100],"bottomOffset":[0,50],"sideMargin":[0,25],"hueStart":[0,360],"hueRange":[0,720],"rainbowSpeed":[0,100],"saturation":[0,100],"lightness":[10,90],"bandBassEnd":[0,100],"bandMidEnd":[0,100],"bandBlend":[0,100],"sensitivity":[10,300],"freqRange":[10,100],"freqCurve":[0,100],"bassCompensation":[0,100],"perBarGain":[0,100],"sharpen":[0,100],"contrast":[0,100],"smoothRise":[0,100],"smoothFall":[0,100],"peakFall":[1,100],"reflectionOpacity":[0,100],"reflectionHeight":[10,100],"bgBlur":[0,20],"bgDim":[0,100],"maxFps":[15,60]}

function setProperty(name, val) {
  if (NUMBER_PROPS.includes(name)) {
    let n = toNum(val, S[name])
    const lim = LIMITS[name]
    if (lim) n = clamp(n, lim[0], lim[1])
    S[name] = n
    return
  }
  if (BOOL_PROPS.includes(name)) {
    S[name] = toBool(val)
    return
  }
  if (COLOR_PROPS.includes(name)) {
    // Nur gültige Hex-Farben übernehmen
    const str = String(val).trim()
    if (/^#[0-9a-f]{6}$/i.test(str)) S[name] = str.toLowerCase()
    return
  }
  switch (name) {
    case "barCount":
      S.barCount = clamp(Math.round(toNum(val, 64)), 8, 128)
      ensureArrays()
      break
    case "barStyle":
      S.barStyle = clamp(Math.round(toNum(val, 1)), 0, 1)
      break
    case "mirrorBars":
      S.mirrorBars = toBool(val)
      ensureArrays()
      break
    case "colorMode":
      S.colorMode = clamp(Math.round(toNum(val, 0)), 0, 5)
      break
    case "autoGain":
      S.autoGain = toBool(val)
      runningPeak = 0
      maxEverPeak = 0
      barPeak.fill(0)
      break
    case "bgColor":
      S.bgColor = String(val)
      applyBackground()
      break
    case "useBgImage":
      S.useBgImage = toBool(val)
      applyBackground()
      break
    case "bgImage":
      S.bgImagePath = val ? String(val).replace(/\\/g, "/") : ""
      applyBackground()
      break
    case "bgBlur":
      S.bgBlur = toNum(val, 0)
      applyBackground()
      break
    case "bgDim":
      S.bgDim = toNum(val, 0)
      applyBackground()
      break
    case "maxFps":
      S.maxFps = clamp(toNum(val, 60), 15, 60)
      break
    case "renderScale": {
      const options = [0, 100, 75, 50, 33]
      S.renderScale = options[clamp(Math.round(toNum(val, 0)), 0, options.length - 1)]
      resize()
      break
    }
    default:
      break
  }
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
function init() {
  canvas = document.getElementById("canvas")
  bgEl = document.getElementById("background")
  dimEl = document.getElementById("dim")
  ctx = canvas.getContext("2d")
  resize()
  applyBackground()
  ensureArrays()
  window.addEventListener("resize", resize)
  startLoop()
}

window.addEventListener("error", (e) => {
  // Fehler abfangen, damit Lively/WebView2 nicht in einen Fehlerzustand läuft
  if (e && e.preventDefault) e.preventDefault()
})

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init)
} else {
  init()
}

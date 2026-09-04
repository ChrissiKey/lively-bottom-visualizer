<h1 align="center">Lively Bottom Visualizer</h1>

<p align="center">
  LED-style audio spectrum at the bottom of your desktop – for <a href="https://github.com/rocksdanister/lively">Lively Wallpaper</a><br>
  <sub>🇬🇧 English first · 🇩🇪 <a href="#-deutsch">Deutsche Beschreibung weiter unten</a></sub>
</p>

<p align="center">
  <a href="https://github.com/ChrissiKey/lively-bottom-visualizer/raw/main/release/Bottom-Rainbow-Visualizer.zip"><img src="https://img.shields.io/badge/Download-Bottom--Rainbow--Visualizer.zip-2ea44f?style=for-the-badge&logo=github" alt="Download"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT"></a>
  <img src="https://img.shields.io/badge/Lively-2.x-8a2be2?style=for-the-badge" alt="Lively 2.x">
  <img src="https://img.shields.io/badge/1080p_%C2%B7_4K-ready-orange?style=for-the-badge" alt="4K ready">
</p>

<p align="center"><img src="screenshots/rainbow.png" alt="Rainbow LED spectrum" width="900"></p>

Bars at the **bottom of the screen** on a black background, **no reflection**, tuned for bass-heavy music
(hardstyle, hardcore, EDM). Runs at 60 FPS with interpolation, at 1080p and 4K.
Drag the zip into Lively – that is the whole installation.

Based on [lively-audio-visualizer](https://github.com/eliasfloreteng/lively-audio-visualizer) by
[elias123tre](https://github.com/eliasfloreteng) – the circular visualizer that started this project.

## ✨ Features

| | |
|---|---|
| 🟩 **LED blocks or solid bars** | Segmented blocks like a classic spectrum analyzer (default) or smooth bars. Bar count, gaps and block size adjustable – fewer bars, bigger blocks. |
| 🌈 **Six color modes** | Rainbow (static or slowly drifting), two-color gradient, single color, **frequency bands** (own color for bass / mids / highs with adjustable boundaries), **level** (color by bar height, e.g. green → yellow → red), vertical rainbow. Every color is a color picker. |
| ➖ **Zero line** | One row of blocks always stays lit – even in silence the visualizer never disappears. |
| 🎚️ **Made for bass-heavy music** | Automatic gain for Lively's raw FFT data, per-bar normalization, spectrum sharpening, adjustable frequency range and bass resolution, rise/fall smoothing. Kicks stay kicks, leads stay visible. |
| 💾 **Presets & backup** | Seven presets in the `presets` folder, one-click loading, restore of your last settings after an update. Copy Lively's saved settings file into the folder and it becomes a preset. |
| 🌍 **English & German** | The settings panel follows Lively's language. Seven clearly separated groups: Style · Colors · Music & sensitivity · Extras · Background · Presets & backup · Performance & diagnostics. |
| 🪶 **Light on resources** | Color cache, reusable buffers, idle mode in silence (5 checks per second instead of 60 frames), FPS limiter, glow can be switched off. Stops completely while Lively pauses the wallpaper. |
| 🔒 **Offline & hardened** | No external scripts, fonts or requests. Content-Security-Policy, range-checked settings, validated preset files. |
| 🧪 **Diagnostics overlay** | Shows Lively's raw audio data on screen to fine-tune the frequency range for your music. |
| ➕ **Extras** | Symmetric layout with the bass in the center, falling peak markers, optional reflection, optional background image with blur and dim. |

## 🖼️ Screenshots

| Frequency bands | Level colors |
|:---:|:---:|
| ![](screenshots/frequency-bands.png) | ![](screenshots/level-colors.png) |
| **Preset `classic-led.json`** | **Zero line in silence** |
| ![](screenshots/preset-classic-led.png) | ![](screenshots/zero-line.png) |

## 📥 Install

1. Download [`Bottom-Rainbow-Visualizer.zip`](https://github.com/ChrissiKey/lively-bottom-visualizer/raw/main/release/Bottom-Rainbow-Visualizer.zip).
2. Drag and drop the zip into the Lively window (or "+" → browse).
3. Play music. If nothing moves, choose the correct output device in Lively → *Settings → Wallpaper → Audio*.
4. Right-click the wallpaper → *Customize* for all settings.

## 🎛️ Settings overview

| Group | What you find there |
|---|---|
| **1 · Style** | Bar style, number of bars, gaps, block height, maximum height, zero line, rounded corners, shading, glow, opacity, margins, symmetric layout |
| **2 · Colors** | Color mode plus one sub-group per mode: rainbow (start hue, range, drift, saturation, lightness), frequency bands (three colors, two boundaries, blend), level (three colors), two colors / single color |
| **3 · Music & sensitivity** | Automatic level, sensitivity, frequency range, bass resolution, boost highs, normalize bars individually, sharpen spectrum, dynamics, rise/fall smoothing, lowest FFT bin |
| **4 · Extras** | Peak markers and their fall speed, reflection with opacity and height |
| **5 · Background** | Background color, optional image from the `images` folder, blur, dim |
| **6 · Presets & backup** | Preset file, *Load preset*, *Restore last settings*, *Use slider values* |
| **7 · Performance & diagnostics** | Maximum frame rate, diagnostics overlay |

## 💾 Presets, backup and updates

**Load a preset:** group 6 → choose a file → *Load preset*. Shipped presets:

| File | Look |
|---|---|
| `hardstyle.json` | Default look: rainbow LED blocks, sharp response |
| `classic-led.json` | Green / yellow / red level colors with peak markers, like a hi-fi spectrum display |
| `frequency-bands.json` | Yellow bass, green mids, pink highs |
| `pastel.json` | Soft pastel rainbow |
| `neon.json` | Cyan / magenta solid bars with strong glow |
| `white-minimal.json` | Plain white blocks, no glow |
| `calm-gradient.json` | Smooth, symmetric two-color bars |

A loaded preset survives restarts of Lively. The sliders keep showing Lively's own values until you move one;
a moved slider always wins.

**Back up your own settings:** Lively stores the slider values in
`<Lively library folder>\SaveData\wpdata\<wallpaper folder>\<display>\LivelyProperties.json`
(the library folder is shown in Lively → *Settings → General*; the wallpaper folder is the one that
*Open file location* opens). Copy that file into the wallpaper's `presets` folder under any name and it
appears as a preset – the wallpaper reads both preset formats.

**Update without losing settings:**
- *In place (recommended):* right-click the wallpaper → *Open file location* → replace the files with the new
  version. Your settings stay. New sliders appear only after *Restore default* in Lively's customize panel;
  afterwards press *Restore last settings* in group 6 to get your values back.
- *Fresh import of the new zip:* copy your backed-up `LivelyProperties.json` into the new `presets` folder and
  load it as a preset.

## 🎧 Tips for hardstyle / bass-heavy music

- Peaks look too wide: lower *Bass resolution* (0–20), raise *Sharpen spectrum* (50–80), set
  *Normalize bars individually* to 50–80.
- Kicks should pump: *Fall smoothing* 30–50, *Rise smoothing* 5–20.
- Use the *diagnostics overlay* (group 7) to see which FFT bins your music actually hits, then set
  *Frequency range used* accordingly.

## 🎮 Running while gaming

Lively decides whether a wallpaper keeps running behind full-screen apps (*Settings → Performance*).
The wallpaper honors Lively's pause signal and stops rendering completely while paused. If you let it run on a
second monitor, lower *Maximum frame rate* to 30 and set *Glow* to 0 for the lowest load.

## 🔧 Build the zip yourself

Zip the **contents** of the `wallpaper/` folder (not the folder itself):

```
cd wallpaper && zip -r ../Bottom-Rainbow-Visualizer.zip .
```

## ⚙️ How it works

Lively calls `livelyAudioListener(audioArray)` about 10–25 times per second with 128 raw, un-normalized FFT
magnitudes (index 0 = lowest frequency). The script maps bins to bars with an adjustable curve, normalizes the
level (global and per bar), sharpens local peaks, interpolates between audio frames and draws everything on a
full-screen canvas. Labels come from `LivelyProperties.json` (English) and `LivelyProperties.loc.json` (German);
Lively picks the language automatically.

## 🔒 Security notes

- Runs entirely offline: no external scripts, fonts, images or requests. A Content-Security-Policy in
  `index.html` blocks everything that is not part of the wallpaper folder.
- Presets are plain JSON. Every value is range-checked against the slider limits, colors must be valid hex
  codes, only files inside `presets/` are loaded and files above 64 KB are ignored.
- Nothing is written to disk by the wallpaper itself; the only persistent state is a small settings snapshot
  in the browser storage of the wallpaper's WebView.

## 🙏 Credits

Based on [lively-audio-visualizer](https://github.com/eliasfloreteng/lively-audio-visualizer) by
[elias123tre](https://github.com/eliasfloreteng): the Lively integration, the customization approach and the
idea of a bass-compensated spectrum come from that project. The rendering and audio processing in this
repository were rewritten for the bottom-of-screen LED look. Visual style inspired by classic LED spectrum
analyzers.

## 📄 License

[MIT](LICENSE)

<br>

---

<br>

<h1 align="center" id="-deutsch">🇩🇪 Deutsch</h1>

<p align="center">
  LED-Audio-Spektrum am unteren Rand des Desktops – für <a href="https://github.com/rocksdanister/lively">Lively Wallpaper</a>
</p>

<p align="center">
  <a href="https://github.com/ChrissiKey/lively-bottom-visualizer/raw/main/release/Bottom-Rainbow-Visualizer.zip"><img src="https://img.shields.io/badge/Download-Bottom--Rainbow--Visualizer.zip-2ea44f?style=for-the-badge&logo=github" alt="Download"></a>
</p>

Balken am **unteren Bildschirmrand** auf schwarzem Hintergrund, **ohne Spiegelung**, abgestimmt auf basslastige
Musik (Hardstyle, Hardcore, EDM). 60 FPS mit Interpolation, für 1080p und 4K.
ZIP in Lively ziehen – das ist die ganze Installation.

Basiert auf [lively-audio-visualizer](https://github.com/eliasfloreteng/lively-audio-visualizer) von
[elias123tre](https://github.com/eliasfloreteng) – dem kreisförmigen Visualizer, mit dem dieses Projekt begann.

## ✨ Funktionen

| | |
|---|---|
| 🟩 **LED-Blöcke oder durchgehende Balken** | Segmentierte Blöcke wie bei einem klassischen Spektrum-Analyzer (Standard) oder glatte Balken. Anzahl, Abstände und Blockgröße einstellbar – weniger Balken, größere Blöcke. |
| 🌈 **Sechs Farbmodi** | Regenbogen (statisch oder langsam wandernd), Zwei-Farben-Verlauf, Einfarbig, **Frequenzbänder** (eigene Farbe für Bass / Mitten / Höhen mit einstellbaren Grenzen), **Pegel** (Farbe nach Balkenhöhe, z. B. Grün → Gelb → Rot), Regenbogen vertikal. Jede Farbe per Farbwähler. |
| ➖ **Nulllinie** | Eine Blockreihe bleibt immer an – auch bei Stille verschwindet der Visualizer nie. |
| 🎚️ **Gemacht für basslastige Musik** | Automatische Pegelanpassung für Livelys rohe FFT-Daten, Balken einzeln normieren, Spektrum schärfen, einstellbarer Frequenzbereich und Bass-Auflösung, Glättung für Anstieg und Abfall. Kicks bleiben Kicks, Leads bleiben sichtbar. |
| 💾 **Presets & Sicherung** | Sieben Presets im Ordner `presets`, Laden per Knopfdruck, Wiederherstellen der letzten Einstellungen nach einem Update. Livelys gespeicherte Einstellungsdatei in den Ordner kopieren, und sie wird zum Preset. |
| 🌍 **Deutsch & Englisch** | Das Einstellungsmenü folgt der Sprache von Lively. Sieben klar getrennte Gruppen: Stil · Farben · Musik & Empfindlichkeit · Extras · Hintergrund · Presets & Sicherung · Leistung & Diagnose. |
| 🪶 **Ressourcenschonend** | Farb-Cache, wiederverwendete Puffer, Leerlaufmodus bei Stille (5 Prüfungen pro Sekunde statt 60 Bilder), FPS-Begrenzer, Leuchten abschaltbar. Stoppt komplett, wenn Lively das Wallpaper pausiert. |
| 🔒 **Offline & abgesichert** | Keine externen Skripte, Schriften oder Verbindungen. Content-Security-Policy, Wertebereichsprüfung, geprüfte Preset-Dateien. |
| 🧪 **Diagnose-Anzeige** | Zeigt Livelys rohe Audiodaten auf dem Bildschirm, um den Frequenzbereich auf deine Musik abzustimmen. |
| ➕ **Extras** | Symmetrische Anordnung mit dem Bass in der Mitte, fallende Spitzen-Markierungen, optionale Spiegelung, optionales Hintergrundbild mit Unschärfe und Abdunklung. |

## 🖼️ Bilder

| Frequenzbänder | Pegel-Farben |
|:---:|:---:|
| ![](screenshots/frequency-bands.png) | ![](screenshots/level-colors.png) |
| **Preset `classic-led.json`** | **Nulllinie bei Stille** |
| ![](screenshots/preset-classic-led.png) | ![](screenshots/zero-line.png) |

## 📥 Installation

1. [`Bottom-Rainbow-Visualizer.zip`](https://github.com/ChrissiKey/lively-bottom-visualizer/raw/main/release/Bottom-Rainbow-Visualizer.zip) herunterladen.
2. ZIP per Drag & Drop in das Lively-Fenster ziehen (oder „+“ → Datei auswählen).
3. Musik abspielen. Reagiert nichts: in Lively unter *Einstellungen → Wallpaper → Audio* das richtige Ausgabegerät wählen.
4. Rechtsklick auf das Wallpaper → *Anpassen* öffnet alle Regler.

## 🎛️ Menü-Übersicht

| Gruppe | Inhalt |
|---|---|
| **1 · Stil** | Balkenstil, Anzahl Balken, Abstände, Blockhöhe, maximale Höhe, Nulllinie, abgerundete Ecken, Schattierung, Leuchten, Deckkraft, Ränder, symmetrische Anordnung |
| **2 · Farben** | Farbmodus plus eine Untergruppe je Modus: Regenbogen (Startfarbe, Umfang, Wanderung, Sättigung, Helligkeit), Frequenzbänder (drei Farben, zwei Grenzen, Übergang), Pegel (drei Farben), Zwei Farben / Einfarbig |
| **3 · Musik & Empfindlichkeit** | Automatische Pegelanpassung, Empfindlichkeit, Frequenzbereich, Bass-Auflösung, Höhen anheben, Balken einzeln normieren, Spektrum schärfen, Dynamik, Glättung Anstieg/Abfall, tiefster FFT-Bin |
| **4 · Extras** | Spitzen-Markierungen und Fallgeschwindigkeit, Spiegelung mit Deckkraft und Höhe |
| **5 · Hintergrund** | Hintergrundfarbe, optionales Bild aus dem Ordner `images`, Unschärfe, Abdunkeln |
| **6 · Presets & Sicherung** | Preset-Datei, *Preset laden*, *Letzte Einstellungen wiederherstellen*, *Reglerwerte verwenden* |
| **7 · Leistung & Diagnose** | Maximale Bildrate, Diagnose-Anzeige |

## 💾 Presets, Sicherung und Updates

**Preset laden:** Gruppe 6 → Datei wählen → *Preset laden*. Mitgeliefert:

| Datei | Aussehen |
|---|---|
| `hardstyle.json` | Standard: Regenbogen-LED-Blöcke, knackige Reaktion |
| `classic-led.json` | Grün / Gelb / Rot nach Pegel mit Spitzen-Markierungen, wie eine HiFi-Anzeige |
| `frequency-bands.json` | Gelber Bass, grüne Mitten, pinke Höhen |
| `pastel.json` | Weicher Pastell-Regenbogen |
| `neon.json` | Cyan / Magenta, durchgehende Balken mit starkem Leuchten |
| `white-minimal.json` | Schlichte weiße Blöcke ohne Leuchten |
| `calm-gradient.json` | Ruhige, symmetrische Zwei-Farben-Balken |

Ein geladenes Preset überlebt Neustarts von Lively. Die Regler zeigen weiter Livelys eigene Werte, bis du einen
bewegst; ein bewegter Regler gewinnt immer.

**Eigene Einstellungen sichern:** Lively speichert die Reglerwerte in
`<Lively-Bibliothek>\SaveData\wpdata\<Wallpaper-Ordner>\<Monitor>\LivelyProperties.json`
(die Bibliothek steht in Lively unter *Einstellungen → Allgemein*, den Wallpaper-Ordner öffnet
*Dateispeicherort öffnen*). Diese Datei unter beliebigem Namen in den Ordner `presets` des Wallpapers kopieren,
dann erscheint sie als Preset – das Wallpaper liest beide Preset-Formate.

**Update ohne Verlust der Einstellungen:**
- *Direkt im Ordner (empfohlen):* Rechtsklick → *Dateispeicherort öffnen* → Dateien durch die neue Version
  ersetzen. Die Einstellungen bleiben. Neue Regler erscheinen erst nach *Standard wiederherstellen* in Livelys
  Anpassen-Fenster; danach in Gruppe 6 *Letzte Einstellungen wiederherstellen* drücken.
- *Neue ZIP importieren:* gesicherte `LivelyProperties.json` in den neuen `presets`-Ordner kopieren und als
  Preset laden.

## 🎧 Tipps für Hardstyle / basslastige Musik

- Ausschläge zu breit: *Bass-Auflösung* runter (0–20), *Spektrum schärfen* rauf (50–80),
  *Balken einzeln normieren* auf 50–80.
- Kicks sollen pumpen: *Glättung Abfall* 30–50, *Glättung Anstieg* 5–20.
- Die *Diagnose-Anzeige* (Gruppe 7) zeigt, welche FFT-Bins deine Musik tatsächlich trifft; danach den
  *Genutzten Frequenzbereich* einstellen.

## 🎮 Spiele

Ob das Wallpaper hinter Vollbild-Spielen weiterläuft, regelt Lively selbst (*Einstellungen → Leistung*).
Im Pause-Zustand rendert das Wallpaper nichts. Auf einem zweiten Monitor: *Maximale Bildrate* auf 30 und
*Leuchten* auf 0 für die geringste Last.

## 🔒 Sicherheit

- Läuft komplett offline: keine externen Skripte, Schriften, Bilder oder Verbindungen. Eine
  Content-Security-Policy in `index.html` blockiert alles außerhalb des Wallpaper-Ordners.
- Presets sind reines JSON. Alle Werte werden auf die Regler-Grenzen begrenzt, Farben müssen gültige Hex-Codes
  sein, es werden nur Dateien aus `presets/` geladen, Dateien über 64 KB werden ignoriert.
- Das Wallpaper schreibt nichts auf die Festplatte; der einzige dauerhafte Zustand ist ein kleiner
  Einstellungs-Schnappschuss im Browser-Speicher der Wallpaper-Ansicht.

## 🙏 Danksagung

Basiert auf [lively-audio-visualizer](https://github.com/eliasfloreteng/lively-audio-visualizer) von
[elias123tre](https://github.com/eliasfloreteng): Lively-Anbindung, Bedienkonzept und die Idee eines
bass-kompensierten Spektrums stammen aus diesem Projekt. Darstellung und Audioverarbeitung wurden für die
LED-Optik am unteren Rand neu geschrieben.

## 📄 Lizenz

[MIT](LICENSE)

# Changelog

All notable changes to this project are documented here. Versions follow `MAJOR.MINOR.PATCH`.

## 1.0.0 – 2026-09-04

First public release.

- LED-block or solid bar spectrum at the bottom of the screen, no reflection
- Six color modes (rainbow, two colors, single color, frequency bands, level, vertical rainbow)
- Zero line, symmetric layout, peak markers, optional reflection and background image
- Audio processing for Lively's raw FFT data: automatic gain, per-bar normalization, spectrum sharpening,
  frequency range, bass resolution, rise/fall smoothing
- Backup slots (save/load all settings), seven presets, preset loading from the `presets` folder
- Settings panel in English and German, seven groups
- Internal render resolution (auto 1440p at 4K), FPS limiter, idle mode, diagnostics overlay
- Content-Security-Policy, range-checked settings, validated preset files

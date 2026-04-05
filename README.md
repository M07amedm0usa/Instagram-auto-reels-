# Flutter Text Widget — Remotion Project

Educational Reels video: **Text Widget** (Arabic, Egyptian dialect)  
Ported from the HTML IDE simulator prototype.

## Structure

```
src/
├── index.ts                    # Remotion entry point
├── Root.tsx                    # Registers compositions
├── script.ts                   # Script steps + timeline builder + state resolver
├── highlight.ts                # Dart/Flutter syntax tokenizer
└── compositions/
│   └── FlutterLesson.tsx       # Main composition (timing orchestrator)
└── components/
    ├── IntroScene.tsx           # "Text Widget" intro with staggered animations
    ├── CodeScene.tsx            # IDE typing view + callouts + preview box
    ├── OutroScene.tsx           # "جرب الكود بنفسك!" outro
    └── Particles.tsx            # Floating ambient particles
```

## Video Specs

| Property | Value |
|----------|-------|
| Resolution | 1080 × 1920 (portrait) |
| FPS | 30 |
| Duration | ~18–20 seconds (depends on script) |
| Format | MP4 (H.264) |

## Timeline

| Phase | Start | End |
|-------|-------|-----|
| Intro | 0ms | 2800ms |
| Intro → Code transition | 2800ms | 3000ms |
| Code typing | 3000ms | ~14000ms |
| Code → Outro transition | ~14000ms | ~15200ms |
| Outro | ~15200ms | ~17700ms |

## Setup

```bash
npm install
```

## Preview in Remotion Studio

```bash
npm start
```

Opens at `http://localhost:3000` — use the timeline scrubber to preview any frame.

## Render to MP4

```bash
npm run render
# Output: out/flutter-text-widget.mp4
```

## Fonts

The project uses Google Fonts:
- **Cairo** — Arabic text (UI + subtitles)
- **JetBrains Mono** — Code editor + labels

Add these to your `public/index.html` or configure via `@remotion/google-fonts`:

```html
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet"/>
```

Or install the Remotion font package:
```bash
npm install @remotion/google-fonts
```

Then in `FlutterLesson.tsx`:
```ts
import { loadFont as loadCairo } from "@remotion/google-fonts/Cairo";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";
loadCairo();
loadJetBrains();
```

## Adding a New Widget Lesson

1. Edit `src/script.ts` → update the `SCRIPT` array with new steps
2. Edit `src/compositions/FlutterLesson.tsx` → update intro props/title
3. That's it — timing auto-calculates from the script

## Color Palette

| Token | Color |
|-------|-------|
| `--accent` | `#00d4ff` |
| `--accent-alt` | `#7c3aed` |
| `--accent-warm` | `#f59e0b` |
| `--keyword` | `#ff7b72` |
| `--type` | `#79c0ff` |
| `--string` | `#a5d6ff` |
| `--method` | `#d2a8ff` |
| `--number` | `#ffa657` |

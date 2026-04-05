# flutter-lesson-remotion

**Remotion project for [FlutterByMousa](https://www.instagram.com/flutterbymousa/) Instagram Reels.**

Converts a Flutter IDE animation (typing code, showing errors, live preview) into a
deterministic, frame-perfect MP4 rendered by [Remotion](https://www.remotion.dev/).

---

## Project Structure

```
src/
├── assets/
│   └── voiceover.mp3          ← drop your audio here before rendering
├── data/
│   └── lesson_01.json         ← lesson data (overridable via --props)
├── engine/
│   └── Engine.ts              ← highlightDart() + buildTimeline() (pure TS)
├── components/
│   ├── FlutterLesson.tsx      ← main declarative Remotion component
│   └── style.css              ← all visual styles (verbatim from HTML template)
├── index.ts                   ← registerRoot()
└── Root.tsx                   ← <Composition /> registration (1080×1920)
```

---

## Quick Start

```bash
npm install
npm start          # opens Remotion Studio at localhost:3000
```

---

## Render a Single Lesson

```bash
# Default (uses lesson_01.json)
npm run build

# Override with a different lesson JSON
npx remotion render FlutterLesson out/lesson_02.mp4 \
  --props='{"lesson": {...}, "voiceover": "voiceover.mp3"}'
```

---

## n8n Automation Pipeline

The n8n workflow should:

1. **Prepare the lesson JSON** (matching the `LessonData` schema in `Engine.ts`).
2. **Copy the voiceover MP3** to `src/assets/voiceover.mp3`.
3. **Run the render** via the Remotion Lambda API or CLI:

```bash
npx remotion render FlutterLesson out/lesson_XX.mp4 \
  --props="$(cat path/to/lesson_XX.json | jq '{lesson: ., voiceover: "voiceover.mp3"}')"
```

4. **Upload the MP4** to Instagram via the Graph API.

---

## Lesson JSON Schema

```jsonc
{
  "intro": {
    "tag":      "FLUTTER BASICS",   // monospace badge top of intro
    "number":   "01",               // episode number
    "title":    "<span>Text</span> Widget",  // HTML allowed
    "subtitle": "ازاي تعرض نص في التطبيق",
    "props": [
      { "text": "Text",      "type": "ip-kw" },  // ip-kw | ip-ty | ip-nm | ip-mt
      { "text": "TextStyle", "type": "ip-ty" }
    ]
  },
  "outro": {
    "title": "جرب الكود<br/>بنفسك!",  // HTML allowed
    "doc":   "flutter.dev/docs",
    "next":  "<span>↩</span><span>الجزء الجاي: Container</span>"
  },
  "script": [
    { "sync":  500 },                  // jump clock to 500 ms (audio sync point)
    { "type":  "Text()" },             // type characters one by one
    { "move":  -1 },                   // move cursor N chars
    { "enter": 2 },                    // newline + N spaces indent
    { "error": "'wrong'",              // type wrong text (red squiggly)
      "fix":   "'correct',",           //   then erase and type fix
      "out":   { "text": "correct" }}, //   update output preview
    { "callout": "النص المعروض" },     // floating annotation badge
    { "wait":  400 }                   // pause N ms
  ]
}
```

### `out` object fields (all optional)

| Field   | Type   | Default    | Description          |
|---------|--------|------------|----------------------|
| `text`  | string | `""`       | Preview display text |
| `fs`    | number | `16`       | font-size in px      |
| `fw`    | number | `400`      | font-weight          |
| `color` | string | `#e6edf3`  | CSS color string     |
| `ls`    | number | `0`        | letter-spacing in em |

---

## Video Format

| Property       | Value               |
|----------------|---------------------|
| Resolution     | 1080 × 1920 (9:16)  |
| FPS            | 30                  |
| Audio          | src/assets/voiceover.mp3 |
| Scale factor   | ≈ 2.84× (phone mock → full canvas) |

---

## Architecture Notes

- **Engine.ts is a pure function** — no React, no side effects.
  `buildTimeline()` can be called from the n8n workflow itself to pre-validate
  a lesson JSON before rendering.

- **`calculateMetadata`** in Root.tsx recomputes `durationInFrames` whenever
  `--props` changes the script, so you never need to hard-code durations.

- **CSS transitions** in `style.css` are used for the intro stagger. Remotion
  plays back at exact frame positions so these still look correct; the CSS
  `transition` properties are purely cosmetic fallbacks for Studio scrubbing.

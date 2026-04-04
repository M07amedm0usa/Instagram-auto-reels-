# flutter-reel-factory v3 🎬

> Automated Flutter widget Reels for Instagram — @flutterbymousa
> Powered by n8n → Gemini AI → GitHub Actions → Remotion

---

## Architecture

```
n8n workflow
  └─ Gemini AI generates LessonData JSON
       └─ GitHub Actions triggered via repository_dispatch
            └─ Remotion renders 1080×1920 MP4
                 └─ Artifact uploaded (or pushed to storage)
```

---

## Project structure

```
src/
  index.ts            — Remotion entry point
  Root.tsx            — Composition registration + dynamic duration
  FlutterLesson.tsx   — Intro / Code / Outro scenes
  CodeEditor.tsx      — Frame-driven typing engine
  PreviewRenderer.tsx — Generic widget preview (widget-agnostic)
  lessonData.ts       — Schema, TIMING constants, sample lessons
```

---

## Key design decisions

### 1. Single source of truth for timing
`TIMING`, `stepDurationMs()`, and `scriptDurationMs()` all live in
`lessonData.ts`. Both `Root.tsx` and `CodeEditor.tsx` import from there.
No duplicated logic.

### 2. Widget-agnostic preview
`PreviewState` is a flat property bag. The `PreviewRenderer` reads
whatever fields are set and renders accordingly. To support a new widget:
- Add relevant fields to `PreviewState` (already covers most cases)
- Set those fields via `out: { ... }` in your script steps
- No code changes required in the renderer for most widgets

### 3. Dynamic duration
`calculateMetadata` in `Root.tsx` recalculates total frames from the
incoming `lesson.script`, so any-length lesson renders correctly
without hardcoding frame counts.

---

## Adding a new widget lesson

Create a `LessonData` object in `lessonData.ts` (or send it as JSON from n8n):

```ts
export const myWidgetLesson: LessonData = {
  intro: {
    tag:         'FLUTTER BASICS',
    number:      '05',
    title:       'TextField',
    titleSuffix: ' Widget',
    subtitle:    'ازاي تاخد input من المستخدم',
    props: [
      { label: 'TextField',       type: 'kw' },
      { label: 'InputDecoration', type: 'ty' },
      { label: 'hintText',        type: 'nm' },
      { label: 'border',          type: 'mt' },
    ],
  },
  outro: {
    badge:      '✦',
    title:      'جرب الكود\nبنفسك!',
    subtitle:   'flutter.dev/docs',
    nextLesson: 'الجزء الجاي: Button',
  },
  initialPreview: {
    bg: '#161b22', w: 280, h: 56, radius: 8,
    borderColor: '#30363d', borderWidth: 1,
    text: '', textColor: '#8b949e', fontSize: 16,
  },
  script: [
    { a: 'type', t: 'TextField()', speed: 90 },
    { a: 'move', o: -1 },
    { a: 'ide_enter', ind: 2 },
    { a: 'type', t: "hintText: 'اكتب هنا...',", speed: 75,
      out: { text: 'اكتب هنا...', textColor: '#8b949e' } },
    { a: 'callout', text: 'النص التلميحي' },
    { a: 'wait', ms: 600 },
    // ... add more steps
  ],
};
```

### PreviewState fields reference

| Field           | Type    | Use for                          |
|----------------|---------|----------------------------------|
| `text`         | string  | Text content                     |
| `textColor`    | string  | Text color (hex)                 |
| `fontSize`     | number  | Font size px                     |
| `fontWeight`   | number  | 100–900                          |
| `bg`           | string  | Background color                 |
| `w` / `h`      | number  | Width / height px                |
| `radius`       | number  | Border radius px                 |
| `shadow`       | number  | Box shadow elevation             |
| `padding`      | number  | Inner padding px                 |
| `borderColor`  | string  | Border color                     |
| `borderWidth`  | number  | Border width px                  |
| `opacity`      | number  | 0–1                              |
| `layout`       | string  | `'row'` \| `'column'`           |
| `mainAxis`     | string  | CSS justify-content value        |
| `crossAxis`    | string  | CSS align-items value            |
| `gap`          | number  | Gap between children px          |
| `icon`         | string  | Emoji / unicode glyph            |
| `iconColor`    | string  | Icon color                       |
| `iconSize`     | number  | Icon font-size px                |
| `progress`     | number  | 0–1 (LinearProgressIndicator)   |
| `progressColor`| string  | Progress bar fill color          |
| `children`     | array   | Nested PreviewNode[]             |

---

## n8n integration

### Trigger via repository_dispatch

In your n8n HTTP Request node:

```
Method:  POST
URL:     https://api.github.com/repos/{OWNER}/{REPO}/dispatches
Headers:
  Authorization: Bearer {GITHUB_TOKEN}
  Accept: application/vnd.github+json
  X-GitHub-Api-Version: 2022-11-28
Body (JSON):
{
  "event_type": "render",
  "client_payload": {
    "lesson": { ...full LessonData object... }
  }
}
```

### Gemini prompt hint

Ask Gemini to return a valid `LessonData` JSON with this system instruction:

```
You are a Flutter educator. Return ONLY valid JSON matching this TypeScript type:
{ intro, outro, initialPreview, script }
where script is an array of steps with actions: type, wait, move, enter, ide_enter, callout, delete.
The 'out' field on 'type' steps updates the preview state (PreviewState fields).
```

---

## Local development

```bash
npm install
npm start          # opens Remotion Studio at localhost:3000

# Render locally with custom lesson:
npx remotion render FlutterLesson out/test.mp4 \
  --props='{"lesson": { ...LessonData... }}' \
  --gl=swiftshader
```

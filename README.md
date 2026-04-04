# flutter-reel-factory 🎬
> Remotion-based Flutter widget video generator — @flutterbymousa

## File Structure

```
src/
├── index.ts           ← Remotion entry point (registerRoot)
├── Root.tsx           ← Composition definition + dynamic duration via calculateMetadata
├── FlutterLesson.tsx  ← Phone frame + Intro/Code/Outro scenes
├── CodeEditor.tsx     ← Pure frame-driven typing engine (no timers!)
└── lessonData.ts      ← JSON lesson schema + example lessons
```

## Quick Start

```bash
npm install
npm start          # Open Remotion Studio for preview
```

## Render a Video

```bash
# Default lesson (textWidgetLesson)
npm run build

# Custom lesson via JSON props (for n8n automation)
npx remotion render FlutterLesson out/container-widget.mp4 \
  --props='{"lesson": { ... full LessonData JSON ... }}'
```

## n8n Automation Integration

### GitHub Actions render trigger

In your n8n workflow, after Gemini generates the lesson JSON:

1. **HTTP Request node** → POST to your GitHub Actions dispatch endpoint:
   ```json
   {
     "ref": "main",
     "inputs": {
       "lesson_json": "{{ $json.lesson }}"
     }
   }
   ```

2. **GitHub Actions workflow** (`.github/workflows/render.yml`):
   ```yaml
   name: Render Flutter Reel
   on:
     workflow_dispatch:
       inputs:
         lesson_json:
           required: true
   jobs:
     render:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: '20' }
         - run: npm ci
         - run: |
             echo '${{ inputs.lesson_json }}' > /tmp/props.json
             npx remotion render FlutterLesson out/reel.mp4 \
               --props=/tmp/props.json \
               --concurrency=1
         - uses: actions/upload-artifact@v4
           with:
             name: reel
             path: out/reel.mp4
   ```

3. Back in n8n: **HTTP Request** to download the artifact, then post to Instagram
   via Meta Graph API.

## Lesson JSON Schema

```typescript
interface LessonData {
  intro: {
    tag:         string;   // "FLUTTER BASICS"
    number:      string;   // "01"
    title:       string;   // "Text"
    titleSuffix: string;   // " Widget"
    subtitle:    string;   // Arabic subtitle
    props:       Array<{ label: string; type: 'kw'|'ty'|'nm'|'mt' }>;
  };
  outro: {
    badge:      string;
    title:      string;   // Use \n for line breaks
    subtitle:   string;
    nextLesson: string;
  };
  initialOutput: { text: string; fs: number; fw: number; color: string; ls: number };
  script: StepType[];
}

type StepType =
  | { a: 'type';      t: string; speed?: number; out?: Partial<OutputState> }
  | { a: 'callout';   text: string }
  | { a: 'wait';      ms: number }
  | { a: 'move';      o: number }
  | { a: 'enter';     ind: number }
  | { a: 'ide_enter'; ind: number };
```

## Adding New Widget Lessons

1. Add a new `LessonData` object to `src/lessonData.ts`
2. Change `defaultLesson` export to preview it in Remotion Studio
3. Or pass it via `--props` at render time — duration is auto-calculated

## Architecture Notes

- **No timers**: `CodeEditor.tsx` uses only `useCurrentFrame()` + `useVideoConfig()`
- **Frame-deterministic**: every frame produces the same output — safe for Remotion's renderer
- **Dynamic duration**: `calculateMetadata` in `Root.tsx` derives `durationInFrames` from
  the script array, so you never need to hard-code timings
- **1080×1920**: optimised for Instagram Reels 9:16

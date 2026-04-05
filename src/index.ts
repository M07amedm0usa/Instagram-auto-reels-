// src/index.ts — Remotion entry point
// This file registers all compositions via Root.tsx.

import { registerRoot } from 'remotion';
import { RemotionRoot }  from './Root';

registerRoot(RemotionRoot);

import React from "react";
import { Composition } from "remotion";
import {
  FlutterLesson,
  VIDEO_WIDTH,
  VIDEO_HEIGHT,
  VIDEO_FPS,
  VIDEO_DURATION_FRAMES,
} from "./compositions/FlutterLesson";

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="FlutterLesson"
        component={FlutterLesson}
        durationInFrames={VIDEO_DURATION_FRAMES}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
    </>
  );
};

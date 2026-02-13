import React from "react";
import { Composition } from "remotion";
import { Explainer } from "./Explainer";
import { FPS, WIDTH, HEIGHT, DURATION_FRAMES } from "./lib/theme";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Explainer"
      component={Explainer}
      durationInFrames={DURATION_FRAMES}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};

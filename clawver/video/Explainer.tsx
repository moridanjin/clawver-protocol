import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { HookScene } from "./scenes/HookScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { SolutionScene } from "./scenes/SolutionScene";
import { PipelineScene } from "./scenes/PipelineScene";
import { DemoScene } from "./scenes/DemoScene";
import { DiffScene } from "./scenes/DiffScene";
import { CloseScene } from "./scenes/CloseScene";
import { TRANSITION_FRAMES } from "./lib/theme";

// 6 transitions x 15 frames = 90 frames of overlap
// Total scene frames must = 1800 + 90 = 1890
const SCENES = [
  { component: HookScene, frames: 165 }, // 0-5s (150 + 15 for transition)
  { component: ProblemScene, frames: 225 }, // 5-12s (210 + 15)
  { component: SolutionScene, frames: 255 }, // 12-20s (240 + 15)
  { component: PipelineScene, frames: 615 }, // 20-40s (600 + 15)
  { component: DemoScene, frames: 315 }, // 40-50s (300 + 15)
  { component: DiffScene, frames: 255 }, // 50-58s (240 + 15)
  { component: CloseScene, frames: 60 }, // 58-60s (no trailing transition)
];

const timing = linearTiming({ durationInFrames: TRANSITION_FRAMES });

export const Explainer: React.FC = () => {
  return (
    <TransitionSeries>
      {SCENES.map(({ component: Scene, frames }, i) => (
        <React.Fragment key={i}>
          <TransitionSeries.Sequence durationInFrames={frames}>
            <Scene />
          </TransitionSeries.Sequence>
          {i < SCENES.length - 1 && (
            <TransitionSeries.Transition
              presentation={fade()}
              timing={timing}
            />
          )}
        </React.Fragment>
      ))}
    </TransitionSeries>
  );
};

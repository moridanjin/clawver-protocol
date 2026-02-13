import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  interpolateColors,
  spring,
  Sequence,
} from "remotion";
import { colors, phaseColors, FONT_FAMILY } from "../lib/theme";

const PHASES = [
  {
    icon: "{ }",
    title: "Input Validation",
    subtitle: "JSON Schema validates every input before code runs",
    color: phaseColors.input,
    detail: "AJV schema enforcement",
  },
  {
    icon: "[ ]",
    title: "WASM Sandbox",
    subtitle: "QuickJS WASM isolation — no filesystem, no network, no Node.js",
    color: phaseColors.sandbox,
    detail: "Memory + time limits enforced",
  },
  {
    icon: "{ }",
    title: "Output Validation",
    subtitle: "Schema-validated output — mismatch blocks payment",
    color: phaseColors.output,
    detail: "Contract conformance",
  },
  {
    icon: "$ $",
    title: "x402 Payment",
    subtitle: "USDC settles directly to skill owner on Solana",
    color: phaseColors.payment,
    detail: "No platform intermediary",
  },
];

// Each phase gets about 5 seconds = 150 frames within the pipeline
const PHASE_DURATION = 140;
const PHASE_GAP = 10;

const PhaseCard: React.FC<{
  phase: (typeof PHASES)[number];
  index: number;
}> = ({ phase, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card entrance
  const entrance = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  // Phase indicator lights up
  const activeAt = 30;
  const glow = interpolate(frame, [activeAt, activeAt + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Text reveal
  const subtitleOpacity = interpolate(frame, [activeAt + 10, activeAt + 25], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const detailOpacity = interpolate(frame, [activeAt + 30, activeAt + 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Check mark
  const checkScale = spring({
    frame,
    fps,
    delay: activeAt + 60,
    config: { damping: 12, stiffness: 150 },
  });

  // Border color transition
  const borderColor = interpolateColors(
    frame,
    [activeAt, activeAt + 20],
    [colors.border, phase.color]
  );

  return (
    <div
      style={{
        width: 380,
        padding: "40px 32px",
        borderRadius: 20,
        backgroundColor: colors.surface,
        border: `2px solid ${borderColor}`,
        opacity: entrance,
        transform: `scale(${interpolate(entrance, [0, 1], [0.9, 1])})`,
        boxShadow: `0 0 ${40 * glow}px ${phase.color}${Math.round(glow * 40).toString(16).padStart(2, "0")}`,
        position: "relative",
      }}
    >
      {/* Phase number */}
      <div
        style={{
          position: "absolute",
          top: -16,
          left: 24,
          backgroundColor: interpolateColors(
            frame,
            [activeAt, activeAt + 20],
            [colors.border, phase.color]
          ),
          color: colors.bg,
          fontSize: 16,
          fontWeight: 700,
          padding: "4px 14px",
          borderRadius: 20,
        }}
      >
        Phase {index + 1}
      </div>

      {/* Icon */}
      <div
        style={{
          fontSize: 40,
          color: interpolateColors(
            frame,
            [activeAt, activeAt + 20],
            [colors.muted, phase.color]
          ),
          marginBottom: 16,
          fontWeight: 700,
          fontFamily: "monospace",
        }}
      >
        {phase.icon}
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: colors.white,
          marginBottom: 12,
        }}
      >
        {phase.title}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: 20,
          color: colors.muted,
          lineHeight: 1.5,
          opacity: subtitleOpacity,
          marginBottom: 12,
        }}
      >
        {phase.subtitle}
      </div>

      {/* Detail badge */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: phase.color,
          opacity: detailOpacity,
          padding: "6px 12px",
          borderRadius: 8,
          backgroundColor: `${phase.color}15`,
          display: "inline-block",
        }}
      >
        {phase.detail}
      </div>

      {/* Check mark */}
      {checkScale > 0 && (
        <div
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            transform: `scale(${checkScale})`,
          }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32">
            <circle cx="16" cy="16" r="14" fill={phase.color} />
            <path
              d="M10 16 L14 20 L22 12"
              stroke={colors.bg}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

export const PipelineScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleEntrance = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  // Pipeline connector line
  const lineProgress = interpolate(frame, [10, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        fontFamily: FONT_FAMILY,
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 60,
          width: "100%",
          textAlign: "center",
          opacity: titleEntrance,
        }}
      >
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: colors.blue,
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          The Pipeline
        </div>
        <div
          style={{
            fontSize: 44,
            fontWeight: 800,
            color: colors.white,
          }}
        >
          Four-Phase Verified Execution
        </div>
      </div>

      {/* Pipeline connector */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 120,
          right: 120,
          height: 3,
          backgroundColor: colors.border,
          transform: "translateY(-50%)",
        }}
      >
        <div
          style={{
            width: `${lineProgress * 100}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${colors.blue}, ${colors.green}, ${colors.amber}, ${colors.purple})`,
            borderRadius: 2,
          }}
        />
      </div>

      {/* Phase cards — each in its own Sequence for local frame */}
      <div
        style={{
          position: "absolute",
          top: 200,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 32,
          padding: "0 60px",
        }}
      >
        {PHASES.map((phase, i) => (
          <Sequence
            key={i}
            from={i * (PHASE_DURATION + PHASE_GAP)}
            durationInFrames={PHASE_DURATION + (3 - i) * (PHASE_DURATION + PHASE_GAP)}
            layout="none"
          >
            <PhaseCard phase={phase} index={i} />
          </Sequence>
        ))}
      </div>

      {/* Bottom note */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          width: "100%",
          textAlign: "center",
          fontSize: 22,
          color: colors.muted,
          opacity: interpolate(frame, [fps * 17, fps * 18], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Caller pays only for verified results
      </div>
    </AbsoluteFill>
  );
};

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { colors, FONT_FAMILY } from "../lib/theme";

const STATS = [
  { value: "17%", label: "of skills contain malicious code", color: colors.red },
  {
    value: "50-60%",
    label: "execution success rate",
    color: colors.amber,
  },
  { value: "Zero", label: "output verification", color: colors.red },
];

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title entrance
  const titleEntrance = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  // Subtitle
  const subtitleOpacity = interpolate(frame, [fps * 4, fps * 5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT_FAMILY,
      }}
    >
      {/* Section label */}
      <div
        style={{
          position: "absolute",
          top: 120,
          fontSize: 20,
          fontWeight: 600,
          color: colors.red,
          letterSpacing: 4,
          textTransform: "uppercase",
          opacity: titleEntrance,
        }}
      >
        The Problem
      </div>

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 48, marginTop: 20 }}>
        {STATS.map((stat, i) => {
          const entrance = spring({
            frame,
            fps,
            delay: i * 10 + 15,
            config: { damping: 14, stiffness: 170 },
          });

          const translateY = interpolate(entrance, [0, 1], [80, 0]);
          const scale = interpolate(entrance, [0, 1], [0.8, 1]);

          return (
            <div
              key={i}
              style={{
                width: 340,
                padding: "48px 36px",
                borderRadius: 20,
                backgroundColor: colors.surface,
                border: `2px solid ${stat.color}40`,
                textAlign: "center",
                opacity: entrance,
                transform: `translateY(${translateY}px) scale(${scale})`,
                boxShadow: `0 0 40px ${stat.color}15`,
              }}
            >
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 800,
                  color: stat.color,
                  marginBottom: 16,
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 24,
                  color: colors.muted,
                  lineHeight: 1.4,
                }}
              >
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 140,
          fontSize: 32,
          fontWeight: 600,
          color: colors.text,
          opacity: subtitleOpacity,
        }}
      >
        The agent economy has a{" "}
        <span style={{ color: colors.red }}>trust gap</span>.
      </div>
    </AbsoluteFill>
  );
};

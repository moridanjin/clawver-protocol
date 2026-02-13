import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  interpolateColors,
  spring,
} from "remotion";
import { colors, FONT_FAMILY } from "../lib/theme";

const AGENT_COUNT = 7;

export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const BAD_AGENT_INDEX = 4;

  // Subtitle text
  const subtitle =
    "When an agent pays for a skill — how do you know the code is safe?";
  const subtitleOpacity = interpolate(frame, [fps * 1.5, fps * 2.5], [0, 1], {
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
      {/* Agent chain */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          marginBottom: 80,
        }}
      >
        {Array.from({ length: AGENT_COUNT }).map((_, i) => {
          const entrance = spring({
            frame,
            fps,
            delay: i * 4,
            config: { damping: 200 },
          });

          const isBad = i === BAD_AGENT_INDEX;
          const turnRedAt = fps * 2;

          const agentColor = isBad
            ? interpolateColors(
                frame,
                [turnRedAt, turnRedAt + 10],
                [colors.blue, colors.red]
              )
            : colors.blue;

          const agentScale = isBad
            ? interpolate(
                frame,
                [turnRedAt, turnRedAt + 5, turnRedAt + 10],
                [1, 1.3, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
              )
            : 1;

          // Connection line between agents
          const lineOpacity = interpolate(
            frame,
            [i * 4 + 8, i * 4 + 14],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          // Data flow dot
          const dotProgress = interpolate(
            frame,
            [i * 6 + 20, i * 6 + 32],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <React.Fragment key={i}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  backgroundColor: agentColor,
                  opacity: entrance,
                  transform: `scale(${entrance * agentScale})`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isBad && frame > turnRedAt
                    ? `0 0 30px ${colors.red}60`
                    : `0 0 20px ${colors.blue}30`,
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" fill={colors.bg} />
                  <path
                    d="M4 20c0-4.4 3.6-8 8-8s8 3.6 8 8"
                    stroke={colors.bg}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              {i < AGENT_COUNT - 1 && (
                <div style={{ position: "relative", width: 40, height: 4 }}>
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: i === BAD_AGENT_INDEX
                        ? interpolateColors(
                            frame,
                            [turnRedAt, turnRedAt + 10],
                            [colors.border, colors.red]
                          )
                        : colors.border,
                      opacity: lineOpacity,
                      borderRadius: 2,
                    }}
                  />
                  {dotProgress > 0 && dotProgress < 1 && (
                    <div
                      style={{
                        position: "absolute",
                        top: -4,
                        left: `${dotProgress * 100}%`,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor:
                          i >= BAD_AGENT_INDEX - 1
                            ? colors.red
                            : colors.green,
                      }}
                    />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Money vanishing effect */}
      {frame > fps * 2.5 && (
        <div
          style={{
            position: "absolute",
            top: "38%",
            display: "flex",
            gap: 16,
          }}
        >
          {[0, 1, 2].map((i) => {
            const vanishProgress = interpolate(
              frame,
              [fps * 2.5 + i * 5, fps * 3.5 + i * 5],
              [1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            const drift = interpolate(
              frame,
              [fps * 2.5 + i * 5, fps * 3.5 + i * 5],
              [0, -40],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            return (
              <div
                key={i}
                style={{
                  fontSize: 32,
                  opacity: vanishProgress,
                  transform: `translateY(${drift}px)`,
                  color: colors.amber,
                }}
              >
                $
              </div>
            );
          })}
        </div>
      )}

      {/* Subtitle */}
      <div
        style={{
          position: "absolute",
          bottom: 180,
          opacity: subtitleOpacity,
          fontSize: 36,
          color: colors.muted,
          textAlign: "center",
          maxWidth: 900,
          lineHeight: 1.5,
        }}
      >
        {subtitle}
      </div>
    </AbsoluteFill>
  );
};

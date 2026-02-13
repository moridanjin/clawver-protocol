import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { colors, FONT_FAMILY } from "../lib/theme";

const JSON_RESPONSE = `HTTP/1.1 402 Payment Required

{
  "accepts": [{
    "scheme":   "exact",
    "network":  "solana-devnet",
    "asset":    "USDC",
    "amount":   "0.001",
    "payTo":    "7xKX...m4Pq"
  }]
}`;

const TX_HASH = "4sGj...kL9vR2wFx8nQb3mJp7tYdEcA5hNzWu";

export const DemoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Code block entrance
  const codeEntrance = spring({
    frame,
    fps,
    delay: 10,
    config: { damping: 200 },
  });

  // Lines reveal one by one
  const lines = JSON_RESPONSE.split("\n");

  // TX hash flash
  const txDelay = fps * 4;
  const txEntrance = spring({
    frame,
    fps,
    delay: txDelay,
    config: { damping: 14, stiffness: 150 },
  });

  // "This is live" badge
  const badgeDelay = fps * 5;
  const badgeScale = spring({
    frame,
    fps,
    delay: badgeDelay,
    config: { damping: 12, stiffness: 120 },
  });

  // Badge pulse
  const badgePulse =
    frame > badgeDelay + 20
      ? interpolate(
          frame % 30,
          [0, 15, 30],
          [1, 1.05, 1],
        )
      : 1;

  // Escrow mention
  const escrowOpacity = interpolate(
    frame,
    [fps * 7, fps * 8],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        fontFamily: FONT_FAMILY,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Section label */}
      <div
        style={{
          position: "absolute",
          top: 80,
          fontSize: 20,
          fontWeight: 600,
          color: colors.green,
          letterSpacing: 4,
          textTransform: "uppercase",
          opacity: codeEntrance,
        }}
      >
        Live Demo
      </div>

      <div style={{ display: "flex", gap: 60, alignItems: "flex-start", marginTop: 20 }}>
        {/* 402 Response code block */}
        <div
          style={{
            backgroundColor: "#0d1117",
            border: `1px solid ${colors.border}`,
            borderRadius: 16,
            padding: "32px 36px",
            opacity: codeEntrance,
            transform: `translateY(${interpolate(codeEntrance, [0, 1], [30, 0])}px)`,
            minWidth: 520,
          }}
        >
          {/* Window dots */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.red,
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.amber,
              }}
            />
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: colors.green,
              }}
            />
          </div>

          {/* Code lines */}
          {lines.map((line, i) => {
            const lineOpacity = interpolate(
              frame,
              [20 + i * 4, 28 + i * 4],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );

            // Syntax coloring
            let lineColor: string = colors.text;
            if (line.startsWith("HTTP")) lineColor = colors.green;
            else if (line.includes('"')) lineColor = colors.amber;
            else if (line.includes("{") || line.includes("}") || line.includes("[") || line.includes("]"))
              lineColor = colors.muted;

            return (
              <div
                key={i}
                style={{
                  fontFamily: "monospace",
                  fontSize: 20,
                  color: lineColor,
                  opacity: lineOpacity,
                  lineHeight: 1.6,
                  whiteSpace: "pre",
                }}
              >
                {line}
              </div>
            );
          })}
        </div>

        {/* Right side: TX + Badge + Escrow */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 32,
            alignItems: "center",
          }}
        >
          {/* TX Hash */}
          <div
            style={{
              opacity: txEntrance,
              transform: `scale(${txEntrance})`,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 16,
                color: colors.muted,
                marginBottom: 8,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              Settlement TX
            </div>
            <div
              style={{
                fontFamily: "monospace",
                fontSize: 22,
                color: colors.green,
                backgroundColor: `${colors.green}15`,
                padding: "12px 20px",
                borderRadius: 12,
                border: `1px solid ${colors.green}30`,
              }}
            >
              {TX_HASH}
            </div>
          </div>

          {/* "This is live" badge */}
          <div
            style={{
              transform: `scale(${badgeScale * badgePulse})`,
              backgroundColor: colors.green,
              color: colors.bg,
              fontSize: 28,
              fontWeight: 800,
              padding: "16px 40px",
              borderRadius: 16,
              boxShadow: `0 0 40px ${colors.green}40`,
            }}
          >
            THIS IS LIVE
          </div>

          {/* Escrow mention */}
          <div
            style={{
              opacity: escrowOpacity,
              textAlign: "center",
              maxWidth: 400,
            }}
          >
            <div
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: colors.purple,
                marginBottom: 8,
              }}
            >
              Contract Escrow
            </div>
            <div
              style={{
                fontSize: 18,
                color: colors.muted,
                lineHeight: 1.5,
              }}
            >
              Automated dispute resolution — re-execute to resolve conflicts
              trustlessly
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

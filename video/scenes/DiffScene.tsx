import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { colors, FONT_FAMILY } from "../lib/theme";

const HEADERS = ["", "Marketplaces", "Reputation", "ClawVer"];

const ROWS = [
  {
    label: "Sandboxed Execution",
    values: ["No", "No", "WASM Isolation"],
  },
  {
    label: "Output Validation",
    values: ["No", "No", "JSON Schema"],
  },
  {
    label: "Payment tied to proof",
    values: ["No", "No", "x402 Escrow"],
  },
];

export const DiffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title
  const titleEntrance = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  // Bottom tagline
  const taglineOpacity = interpolate(
    frame,
    [fps * 5, fps * 6],
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
          top: 100,
          fontSize: 20,
          fontWeight: 600,
          color: colors.amber,
          letterSpacing: 4,
          textTransform: "uppercase",
          opacity: titleEntrance,
        }}
      >
        Why It Matters
      </div>

      {/* Table */}
      <div
        style={{
          borderRadius: 20,
          overflow: "hidden",
          border: `1px solid ${colors.border}`,
          marginTop: 40,
        }}
      >
        {/* Header row */}
        <div style={{ display: "flex" }}>
          {HEADERS.map((header, i) => {
            const headerEntrance = spring({
              frame,
              fps,
              delay: i * 5 + 10,
              config: { damping: 200 },
            });

            const isClawVer = i === 3;

            return (
              <div
                key={i}
                style={{
                  width: i === 0 ? 300 : 260,
                  padding: "24px 32px",
                  backgroundColor: isClawVer ? `${colors.green}15` : colors.surface,
                  borderBottom: `2px solid ${isClawVer ? colors.green : colors.border}`,
                  fontSize: 22,
                  fontWeight: 700,
                  color: isClawVer ? colors.green : colors.muted,
                  opacity: headerEntrance,
                  textAlign: i === 0 ? "left" : "center",
                }}
              >
                {header}
              </div>
            );
          })}
        </div>

        {/* Data rows */}
        {ROWS.map((row, rowIdx) => {
          const rowEntrance = spring({
            frame,
            fps,
            delay: rowIdx * 15 + 40,
            config: { damping: 200 },
          });

          const translateY = interpolate(rowEntrance, [0, 1], [20, 0]);

          return (
            <div
              key={rowIdx}
              style={{
                display: "flex",
                opacity: rowEntrance,
                transform: `translateY(${translateY}px)`,
              }}
            >
              {/* Row label */}
              <div
                style={{
                  width: 300,
                  padding: "20px 32px",
                  backgroundColor: colors.surface,
                  borderBottom: `1px solid ${colors.border}`,
                  fontSize: 20,
                  fontWeight: 600,
                  color: colors.text,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {row.label}
              </div>

              {/* Value cells */}
              {row.values.map((val, colIdx) => {
                const isClawVer = colIdx === 2;
                const isNo = val === "No";

                return (
                  <div
                    key={colIdx}
                    style={{
                      width: 260,
                      padding: "20px 32px",
                      backgroundColor: isClawVer
                        ? `${colors.green}08`
                        : colors.bg,
                      borderBottom: `1px solid ${colors.border}`,
                      fontSize: 20,
                      fontWeight: isClawVer ? 700 : 400,
                      color: isNo
                        ? colors.red
                        : isClawVer
                          ? colors.green
                          : colors.muted,
                      textAlign: "center",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isNo ? (
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          fill="none"
                          stroke={colors.red}
                          strokeWidth="2"
                        />
                        <path
                          d="M8 8 L16 16 M16 8 L8 16"
                          stroke={colors.red}
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <span>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          style={{ marginRight: 8, verticalAlign: "middle" }}
                        >
                          <circle cx="10" cy="10" r="9" fill={colors.green} />
                          <path
                            d="M6 10 L9 13 L14 7"
                            stroke={colors.bg}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                          />
                        </svg>
                        {val}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          fontSize: 30,
          fontWeight: 600,
          color: colors.text,
          opacity: taglineOpacity,
          textAlign: "center",
        }}
      >
        ClawVer is the missing{" "}
        <span style={{ color: colors.green }}>trust layer</span>.
      </div>
    </AbsoluteFill>
  );
};

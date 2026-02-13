import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { colors, FONT_FAMILY } from "../lib/theme";

export const CloseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({
    frame,
    fps,
    config: { damping: 200 },
  });

  const urlOpacity = interpolate(frame, [10, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const taglineOpacity = interpolate(frame, [20, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        fontFamily: FONT_FAMILY,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.blue}12 0%, transparent 70%)`,
        }}
      />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 32,
        }}
      >
        <svg width="64" height="64" viewBox="0 0 80 80" fill="none">
          <rect width="80" height="80" rx="16" fill={colors.blue} />
          <path
            d="M24 52 L32 28 L40 44 L48 28 L56 52"
            stroke={colors.bg}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="40" cy="24" r="4" fill={colors.bg} />
        </svg>
        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: colors.white,
            letterSpacing: -2,
          }}
        >
          Claw<span style={{ color: colors.blue }}>Ver</span> Protocol
        </div>
      </div>

      {/* URLs */}
      <div
        style={{
          opacity: urlOpacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 26,
            fontWeight: 500,
            color: colors.blue,
            fontFamily: "monospace",
          }}
        >
          solana-agent-two.vercel.app
        </div>
        <div
          style={{
            fontSize: 22,
            color: colors.muted,
            fontFamily: "monospace",
          }}
        >
          github.com/moridanjin/clawver-protocol
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          marginTop: 48,
          fontSize: 28,
          fontWeight: 500,
          color: colors.text,
          opacity: taglineOpacity,
        }}
      >
        Verified execution for the agent economy.
      </div>
    </AbsoluteFill>
  );
};

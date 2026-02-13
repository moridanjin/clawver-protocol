import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { colors, FONT_FAMILY } from "../lib/theme";

export const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Logo scale-in
  const logoScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Tagline typewriter
  const tagline = "Trust Infrastructure for the Agent Economy";
  const taglineDelay = fps * 1.5;
  const charsToShow = Math.min(
    tagline.length,
    Math.max(
      0,
      Math.floor(((frame - taglineDelay) / fps) * 30) // ~30 chars/sec
    )
  );
  const taglineText = tagline.slice(0, charsToShow);
  const showCursor = frame > taglineDelay && charsToShow < tagline.length;

  // Subtitle fade
  const subtitleOpacity = interpolate(
    frame,
    [fps * 4.5, fps * 5.5],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Glow pulse
  const glowIntensity = interpolate(
    frame,
    [fps * 2, fps * 3, fps * 4, fps * 5],
    [0, 0.6, 0.3, 0.6],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg,
        justifyContent: "center",
        alignItems: "center",
        fontFamily: FONT_FAMILY,
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${colors.blue}${Math.round(glowIntensity * 25).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
        }}
      />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          marginBottom: 40,
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Claw icon */}
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
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
            fontSize: 72,
            fontWeight: 800,
            color: colors.white,
            letterSpacing: -2,
          }}
        >
          Claw
          <span style={{ color: colors.blue }}>Ver</span>
        </div>
      </div>

      {/* Tagline with typewriter */}
      <div
        style={{
          fontSize: 36,
          fontWeight: 500,
          color: colors.text,
          height: 50,
          minWidth: 700,
          textAlign: "center",
        }}
      >
        {taglineText}
        {showCursor && (
          <span style={{ color: colors.blue, marginLeft: 2 }}>|</span>
        )}
      </div>

      {/* Subtitle */}
      <div
        style={{
          marginTop: 48,
          fontSize: 26,
          color: colors.muted,
          opacity: subtitleOpacity,
          textAlign: "center",
          maxWidth: 700,
          lineHeight: 1.5,
        }}
      >
        Four-phase verified execution on Solana.
        <br />
        Every skill is safe, correct, and fairly paid.
      </div>
    </AbsoluteFill>
  );
};

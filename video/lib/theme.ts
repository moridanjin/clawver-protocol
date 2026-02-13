import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const FONT_FAMILY = fontFamily;

// Colors from landing page CSS variables
export const colors = {
  bg: "#0a0a0a",
  surface: "#111827",
  border: "#1f2937",
  text: "#e5e7eb",
  muted: "#9ca3af",
  blue: "#3b82f6",
  green: "#10b981",
  amber: "#f59e0b",
  red: "#ef4444",
  purple: "#a855f7",
  white: "#ffffff",
} as const;

// Pipeline phase colors
export const phaseColors = {
  input: colors.blue,
  sandbox: colors.green,
  output: colors.amber,
  payment: colors.purple,
} as const;

// Composition settings
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION_FRAMES = 1800; // 60s at 30fps

// Transition duration between scenes
export const TRANSITION_FRAMES = 15;

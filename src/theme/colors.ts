/**
 * Color tokens — roles per the design language ("playful, calm, confident").
 * Contrast policy: text is always `ink` on light fills (background, surface, primary,
 * sky, sun all pass 4.5:1 with ink). `coral` fails 4.5:1 with any text color, so it is
 * used only as a feedback fill/border, never as a text-bearing surface.
 */
export const colors = {
  background: '#FFF8EC', // cream app background
  surface: '#FFFFFF', // cards, bubbles
  ink: '#3A3A3A', // primary text — soft, not pure black
  muted: '#8C8C8C', // secondary text
  primary: '#3DC35B', // green — CTA / success
  primaryDark: '#2E9E47', // chunky button bottom edge
  sky: '#2FB5F0', // secondary accent
  skyDark: '#1E8FC4', // sky button bottom edge (derived, same role as primaryDark)
  sun: '#FFC83D', // stars / badges
  sunDark: '#D9A420', // sun button bottom edge (derived)
  coral: '#FF6B5B', // wrong / danger — soft, never harsh red
  coralDark: '#D9503F', // coral edge (derived)
  grape: '#8E5CF6', // perfect badge
  border: '#E8E2D4', // hairlines, card borders
} as const;

export type ColorToken = keyof typeof colors;

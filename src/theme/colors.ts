/**
 * Color tokens — roles per the design language ("playful, calm, confident").
 * Contrast policy: text is always `ink` on light fills (background, surface, primary,
 * sky, sun all pass 4.5:1 with ink). `coral` fails 4.5:1 with any text color, so it is
 * used only as a feedback fill/border, never as a text-bearing surface. On the feedback
 * tints only `ink` text is allowed (ink 9.8:1/9.4:1; `muted` fails at 4.4:1).
 */
export const colors = {
  background: '#FFF8EC', // cream app background
  surface: '#FFFFFF', // cards, bubbles
  ink: '#3A3A3A', // primary text — soft, not pure black
  muted: '#6E6E6E', // secondary text — dark enough for 4.5:1 on cream AND white
  primary: '#3DC35B', // CTA / success
  primaryDark: '#2E9E47', // chunky button bottom edge
  sky: '#2FB5F0', // secondary accent
  skyDark: '#1E8FC4', // sky button bottom edge (derived, same role as primaryDark)
  sun: '#FFC83D', // stars / badges
  coral: '#FF6B5B', // wrong / danger — soft, never harsh red
  grape: '#8E5CF6', // perfect badge
  border: '#E8E2D4', // hairlines, card borders
  successTint: '#DCF4E1', // correct-answer tile wash — primary at 18% over white
  dangerTint: '#FFE4E1', // wrong-answer tile wash — coral at 18% over white
} as const;

export type ColorToken = keyof typeof colors;

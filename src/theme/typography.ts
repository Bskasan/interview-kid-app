import type { TextStyle } from 'react-native';

/**
 * Type scale (system font). Early readers: body never below 18, titles 28–34,
 * bold weights for anything tappable or shouting-with-joy.
 */
export const typography = {
  title: { fontSize: 32, fontWeight: '800', lineHeight: 38 },
  subtitle: { fontSize: 24, fontWeight: '700', lineHeight: 30 },
  body: { fontSize: 18, fontWeight: '400', lineHeight: 26 },
  bodyBold: { fontSize: 18, fontWeight: '700', lineHeight: 26 },
  button: { fontSize: 20, fontWeight: '800', lineHeight: 24 },
  caption: { fontSize: 16, fontWeight: '600', lineHeight: 20 },
} as const satisfies Record<string, TextStyle>;

/** Touch target size (dp) for primary controls, from the design language. */
export const touchTarget = {
  primary: 56,
} as const;

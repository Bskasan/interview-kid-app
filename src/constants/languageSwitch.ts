import { type AppLanguage } from '@/i18n';

// Flag emoji denote countries, not languages — accepted for a two-language
// kids' app because recognizability wins over precision at this age.
export const FLAGS: Record<AppLanguage, string> = { tr: '🇹🇷', en: '🇬🇧' };

// The knob overhangs the track like a physical switch cap; the track area is
// knob-sized so the overhang needs no overflow tricks.
export const TRACK_WIDTH = 110;
export const TRACK_HEIGHT = 52;
export const KNOB_SIZE = 60;
export const KNOB_TRAVEL = TRACK_WIDTH - KNOB_SIZE;
// The knob's flag crossfades to the target language around mid-slide.
export const FLAG_SWAP_START = 0.42;
export const FLAG_SWAP_END = 0.58;

// -------------------------------
// Transition Overlay Constants
// -------------------------------

// Gentle mascot bob while the child waits (~2.5 half-cycles over the overlay).
export const BOUNCE_RISE = -8;
export const BOUNCE_HALF_MS = 350;

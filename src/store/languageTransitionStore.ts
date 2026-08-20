/**
 * Transient state for the animated language change: the target language while
 * a transition runs (null = idle). The LanguageSwitch writes it, the full-screen
 * overlay consumes it. Never persisted.
 */
import type { AppLanguage } from '@/i18n';
import { create } from 'zustand';

type LanguageTransitionState = {
  /** Language being switched to while the overlay runs; null when idle. */
  pending: AppLanguage | null;
  begin: (language: AppLanguage) => void;
  finish: () => void;
};

export const useLanguageTransitionStore = create<LanguageTransitionState>()((set) => ({
  pending: null,
  // Idempotent while a transition runs — the backstop against double-taps
  // landing in the same frame, before the overlay can swallow touches.
  begin: (language) => set((state) => (state.pending ? state : { pending: language })),
  finish: () => set({ pending: null }),
}));

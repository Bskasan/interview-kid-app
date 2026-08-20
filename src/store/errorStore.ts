/**
 * Transient store for the one currently-surfaced error; the global banner
 * renders it, handleError writes it. Never persisted.
 */
import { create } from 'zustand';
import type { AppError } from '@/lib/errors/types';

type ErrorState = {
  /**
   * Single slot, replace-on-new: for a child, the newest message simply wins —
   * a queue of stacked-up error banners would be scarier and less useful than
   * one current, dismissible line. Never persisted (errors are momentary, and
   * `retry` holds a function).
   */
  current: { readonly error: AppError; readonly id: number } | null;
  show: (error: AppError) => void;
  dismiss: () => void;
};

let nextId = 1;

export const useErrorStore = create<ErrorState>()((set) => ({
  current: null,
  show: (error) => set({ current: { error, id: nextId++ } }),
  dismiss: () => set({ current: null }),
}));

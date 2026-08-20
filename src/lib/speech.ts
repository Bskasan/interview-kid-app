/**
 * Read-aloud interface for child-facing text. Deliberately a no-op today: the
 * UI ships the affordance (SpeakButton) while audio itself stays out of scope.
 */
import type { AppLanguage } from '@/i18n';

// expo-speech's Speech.speak(text, { language }) drops in here later — the
// signature is byte-compatible on purpose (ADR 0050); not installed by design.
export function speak(_text: string, _language: AppLanguage): void {}

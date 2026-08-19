import * as Haptics from 'expo-haptics';
import { logger } from '@/lib/logger';

/**
 * Best-effort haptics: a missing vibrator or a platform hiccup must never
 * crash or block the UI, but the failure is at least visible in dev instead of
 * being swallowed by an empty catch.
 */
export function hapticSuccess(): void {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch((cause: unknown) =>
    logger.warn('haptics.success', cause),
  );
}

export function hapticImpactLight(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch((cause: unknown) =>
    logger.warn('haptics.impact', cause),
  );
}

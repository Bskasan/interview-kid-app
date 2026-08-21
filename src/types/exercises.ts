import { usePreventRemove } from 'expo-router/react-navigation';

/**
 * The video step as an explicit machine. `error` is entered from the player's
 * error event, the ready watchdog, or being offline on entry — and leads to
 * the child's choice (retry / continue without video), never a silent skip.
 */
export type VideoState = 'loading' | 'ready' | 'ended' | 'error';

// The intercepted navigation action, typed via the hook itself so no
// standalone @react-navigation package needs importing (see comment above).
export type PreventRemoveEvent = Parameters<Parameters<typeof usePreventRemove>[1]>[0];

export type PendingAction = PreventRemoveEvent['data']['action'];

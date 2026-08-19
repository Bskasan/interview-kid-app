import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { useAppActive } from '@/hooks/useAppActive';
import { colors, radius } from '@/theme';

type Props = {
  uri: string;
  /**
   * Pauses playback while true (e.g. the exit sheet is open) and resumes on
   * false — but only if the video was actually playing when suspended, so an
   * ended or user-paused video stays put.
   */
  suspended?: boolean;
  /** Fired when the source becomes playable (clears the loading watchdog). */
  onReady: () => void;
  /** Fired when playback reaches the end (unlocks the quiz CTA). */
  onEnded: () => void;
  /** Fired when the source fails to load/play, with the player's error payload. */
  onError: (cause: unknown) => void;
};

/**
 * Lesson video stage. Autoplays once with native controls; the player is created
 * and released by useVideoPlayer, so leaving the screen (or swapping to the quiz
 * stage) stops playback via unmount. Backgrounding pauses explicitly on top of
 * expo-video's default staysActiveInBackground=false.
 */
export function ExerciseVideo({ uri, suspended = false, onReady, onEnded, onError }: Props) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = false;
    instance.play();
  });
  const appActive = useAppActive();
  const wasPlayingRef = useRef(false);

  useEventListener(player, 'playToEnd', onEnded);
  useEventListener(player, 'statusChange', ({ status, error }) => {
    if (status === 'error') {
      onError(error);
    } else if (status === 'readyToPlay') {
      onReady();
    }
  });

  useEffect(() => {
    if (!appActive) {
      player.pause();
    }
  }, [appActive, player]);

  useEffect(() => {
    if (suspended) {
      wasPlayingRef.current = player.playing;
      player.pause();
    } else if (wasPlayingRef.current) {
      wasPlayingRef.current = false;
      player.play();
    }
  }, [suspended, player]);

  return (
    <VideoView
      player={player}
      style={styles.video}
      contentFit="contain"
      nativeControls
      fullscreenOptions={{ enable: false }}
      allowsPictureInPicture={false}
    />
  );
}

const styles = StyleSheet.create({
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.card,
    backgroundColor: colors.ink,
  },
});

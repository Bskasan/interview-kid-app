/**
 * Round read-aloud button that sits inline beside text a child must
 * understand on their own. Press feedback is honest — bounce, a sound-wave
 * wiggle on the icon and a haptic — while the audio itself is the speech
 * stub until TTS lands (src/lib/speech.ts).
 */
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { TOUCH_TARGET } from '@/constants/layout';
import { usePressFeedback } from '@/hooks/usePressFeedback';
import { isAppLanguage } from '@/i18n';
import { speak } from '@/lib/speech';
import { colors } from '@/theme';

const SIZE = TOUCH_TARGET.compact;
const SPEAKER_GLYPH = '🔊';

type Props = {
  /** The already-translated sentence this button reads aloud. */
  text: string;
};

export function SpeakButton({ text }: Props) {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const { animatedStyle, onPressIn, onPressOut } = usePressFeedback();

  const tilt = useSharedValue(0);
  const wiggleStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${tilt.value}deg` }] }));

  const handlePress = () => {
    if (!reduceMotion) {
      // A short "sound wave" wiggle — the tap visibly registered.
      tilt.value = withSequence(
        withTiming(-12, { duration: 70 }),
        withTiming(12, { duration: 70 }),
        withTiming(-8, { duration: 60 }),
        withTiming(0, { duration: 50 }),
      );
    }
    speak(text, isAppLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'tr');
  };

  return (
    // Never squeeze the target: neighbouring text yields width instead.
    <Animated.View style={[animatedStyle, styles.wrapper]}>
      <Pressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        // Just "read aloud": screen readers already read the adjacent text, so
        // duplicating the sentence here would double-announce it.
        accessibilityLabel={t('speakA11y')}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Animated.Text style={[styles.glyph, wiggleStyle]} maxFontSizeMultiplier={1}>
          {SPEAKER_GLYPH}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexShrink: 0,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  glyph: {
    fontSize: 20,
  },
});

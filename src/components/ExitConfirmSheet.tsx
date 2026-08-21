/**
 * Bottom sheet confirming exit-to-home for the exercise flow — one surface for
 * the 🏠 button, the hardware back button and the back gesture. Staying is the
 * safe default: the primary tile, the backdrop tap and the system back all
 * continue the lesson; only the explicit second tile discards the attempt.
 */
import { ChunkyButton } from '@/components/ChunkyButton';
import { Mascot } from '@/components/Mascot';
import { reportImageError } from '@/lib/errors/handleError';
import { colors, motion, radius, spacing } from '@/theme';
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ENTER_OFFSET = 80;
const THUMB_SIZE = 88;

type ExitConfirmSheetProps = {
  visible: boolean;
  /** Lesson thumbnail so the child sees what they would be leaving. */
  thumbnailUrl?: string;
  onStay: () => void;
  onLeave: () => void;
};

export function ExitConfirmSheet({
  visible,
  thumbnailUrl,
  onStay,
  onLeave,
}: ExitConfirmSheetProps) {
  const { t } = useTranslation('exercise');

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={onStay}
    >
      <SheetShell onBackdropPress={onStay}>
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={150}
            accessible={false}
            // Decorative: the bordered placeholder is the fallback UI.
            onError={(event) => reportImageError(event, 'exit-sheet.thumbnail')}
          />
        ) : null}
        <Mascot size={56} speech={t('exitPrompt')} readAloud />
        <View style={styles.actions}>
          <ChunkyButton label={t('exitStay')} icon="▶️" onPress={onStay} />
          <ChunkyButton label={t('exitLeave')} icon="🏠" variant="sky" onPress={onLeave} />
        </View>
      </SheetShell>
    </Modal>
  );
}

/** Backdrop fade + card slide-up; instant under reduced motion. */
function SheetShell({
  onBackdropPress,
  children,
}: {
  onBackdropPress: () => void;
  children: React.ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const offset = useSharedValue(reduceMotion ? 0 : ENTER_OFFSET);
  const backdrop = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    offset.value = withSpring(0, motion.springSoft);
    backdrop.value = withTiming(1, { duration: 200 });
  }, [reduceMotion, offset, backdrop]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdrop.value }));
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        {/* Tapping outside continues the lesson — the safe choice. Hidden from
            screen readers: the explicit stay button says the same thing. */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onBackdropPress}
          accessible={false}
          importantForAccessibility="no"
        />
      </Animated.View>
      <Animated.View
        style={[styles.card, { paddingBottom: spacing.xl + insets.bottom }, cardStyle]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(58, 58, 58, 0.45)',
  },
  card: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.lg,
    alignItems: 'center',
  },
  thumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.button,
    backgroundColor: colors.border,
  },
  actions: {
    alignSelf: 'stretch',
    gap: spacing.md,
  },
});

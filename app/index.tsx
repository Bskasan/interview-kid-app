/**
 * Welcome screen ('/'): a short intro shown on every cold start — mascot with
 * the intro line, app name, and a single Start button that replaces into the
 * tab shell so back can never return here. Never blocks: the button is live
 * from the first frame; only the hero animates in.
 */
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, ReduceMotion } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChunkyButton } from '@/components/ChunkyButton';
import { Mascot } from '@/components/Mascot';
import { useNavigationLock } from '@/hooks/useNavigationLock';
import { colors, spacing, typography } from '@/theme';

export default function WelcomeScreen() {
  const { t } = useTranslation('welcome');
  const router = useRouter();
  const navigateOnce = useNavigationLock();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.hero}>
        <Animated.Text
          entering={FadeInDown.duration(350).reduceMotion(ReduceMotion.System)}
          style={styles.appName}
          maxFontSizeMultiplier={1.4}
        >
          {t('appName')}
        </Animated.Text>
        <Animated.View
          entering={FadeInUp.delay(150).duration(350).reduceMotion(ReduceMotion.System)}
        >
          <Mascot size={96} speech={t('intro')} readAloud />
        </Animated.View>
      </View>
      <ChunkyButton
        label={t('start')}
        icon="▶️"
        onPress={() => navigateOnce(() => router.replace('/(tabs)/home'))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  appName: {
    ...typography.title,
    color: colors.ink,
    textAlign: 'center',
  },
});

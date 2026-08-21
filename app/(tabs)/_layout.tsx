/**
 * Tab shell: dashboard (Ana Sayfa), exercises and settings. The lesson player
 * and Result stay outside this group, so no tab bar can interrupt a running
 * quiz. Labels re-render on language change; focus is icon opacity + label
 * weight + tint, never color alone.
 */
import { TabIcon } from '@/components/TabIcon';
import { colors, spacing } from '@/theme';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TAB_BAR_CONTENT_HEIGHT = 64;

export default function TabsLayout() {
  const { t } = useTranslation('common');
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: TAB_BAR_CONTENT_HEIGHT + insets.bottom,
          paddingTop: spacing.xs,
          paddingBottom: insets.bottom + spacing.xs,
        },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '800' },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarAccessibilityLabel: t('tabs.home'),
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: t('tabs.exercises'),
          tabBarAccessibilityLabel: t('tabs.exercises'),
          tabBarIcon: ({ focused }) => <TabIcon icon="🧩" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarAccessibilityLabel: t('tabs.settings'),
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

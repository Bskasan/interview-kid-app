import { StyleSheet, Text } from 'react-native';

interface TabIconProps {
  icon: string;
  focused: boolean;
}

export function TabIcon({ icon, focused }: TabIconProps) {
  return (
    <Text style={[styles.icon, { opacity: focused ? 1 : 0.45 }]} maxFontSizeMultiplier={1}>
      {icon}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 24,
  },
});

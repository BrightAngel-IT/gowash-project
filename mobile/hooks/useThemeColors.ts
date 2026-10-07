import { useColorScheme } from 'react-native';
import { Colors as LightColors, DarkColors } from '@/constants/theme';

export function useThemeColors() {
  const theme = useColorScheme() ?? 'light';
  return theme === 'dark' ? DarkColors : LightColors;
}

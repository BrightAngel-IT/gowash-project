import { TextStyle, ViewStyle } from 'react-native';

export const Colors = {
  primary: '#4c669f',
  secondary: '#3b5998',
  accent: '#FF6B6B',
  background: '#F7F9FC',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#8E8E93',
  border: '#E5E5EA',
  success: '#4CD964',
  warning: '#FFCC00',
  error: '#FF3B30',
  gradients: {
    primary: ['#4c669f', '#3b5998', '#192f6a'] as const,
    card: ['#ffffff', '#f8f9fa'] as const,
    accent: ['#FF6B6B', '#FF8E53'] as const,
  }
};

export const DarkColors = {
  primary: '#5C7CFA',
  secondary: '#4b72c9',
  accent: '#FF6B6B',
  background: '#121212',
  card: '#1E1E1E',
  text: '#FFFFFF',
  textSecondary: '#A0A0A5',
  border: '#2C2C2C',
  success: '#32D74B',
  warning: '#FFD60A',
  error: '#FF453A',
  gradients: {
    primary: ['#4b72c9', '#5C7CFA', '#748ffc'] as const,
    card: ['#2A2A2A', '#1E1E1E'] as const,
    accent: ['#FF8E53', '#FF6B6B'] as const,
  }
};

export const Spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 40,
};

export const BorderRadius = {
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  round: 9999,
};

type TypographyType = {
  h1: TextStyle;
  h2: TextStyle;
  h3: TextStyle;
  body: TextStyle;
  caption: TextStyle;
};

export const Typography: TypographyType = {
  h1: { fontSize: 32, fontWeight: '700', letterSpacing: 0.5 },
  h2: { fontSize: 24, fontWeight: '700', letterSpacing: 0.3 },
  h3: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400', color: '#8E8E93' },
};

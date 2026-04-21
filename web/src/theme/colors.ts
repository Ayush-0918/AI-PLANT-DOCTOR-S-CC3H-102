/**
 * Plant Doctor - Design System Colors
 * Clean, modern color palette optimized for farming app
 * Accessibility: WCAG AA compliant
 */

export const colors = {
  // Primary Colors - Airy teal / sky for a softer premium agri look
  primary: {
    50: '#effcfb',
    100: '#d7faf4',
    200: '#b2f2e8',
    300: '#7fe7d8',
    400: '#52d8cb',
    500: '#34c4c0',
    600: '#249bab',
    700: '#237a88',
    800: '#24616c',
    900: '#224f59',
  },

  // Secondary Colors - Sky blue (trust / diagnostics)
  secondary: {
    50: '#f3f8ff',
    100: '#e0efff',
    200: '#bddcff',
    300: '#94c6ff',
    400: '#68adff',
    500: '#4b92ff',
    600: '#326ff4',
    700: '#2857df',
    800: '#2848b5',
    900: '#263f8f',
  },

  // Accent Colors
  accent: {
    amber: '#f6b26b',
    orange: '#fb923c',
    red: '#f87171',
    purple: '#a78bfa',
  },

  // Neutral Colors - Clean grayscale
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    150: '#eeeeee',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },

  // Semantic Colors
  success: '#34c4c0',
  warning: '#f6b26b',
  error: '#f87171',
  info: '#4b92ff',

  // Background Colors
  background: {
    light: '#ffffff',
    lighter: '#f9fafb',
    secondary: '#f3f4f6',
    tertiary: '#e5e7eb',
  },

  // Overlay
  overlay: {
    light: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.8)',
  },
};

export const darkMode = {
  background: {
    light: '#1a1a1a',
    lighter: '#0f0f0f',
    secondary: '#2a2a2a',
    tertiary: '#404040',
  },
  text: {
    primary: '#f5f5f5',
    secondary: '#d4d4d4',
    tertiary: '#a3a3a3',
  },
};

export type Color = keyof typeof colors;
export type ColorShade = keyof (typeof colors)[Color];

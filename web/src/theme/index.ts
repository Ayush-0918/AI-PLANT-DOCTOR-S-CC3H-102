/**
 * Plant Doctor - Theme System
 * Centralized design tokens and theme configuration
 */

import { colors, darkMode } from './colors';
import { typography, headings, bodyText, label } from './typography';
import { spacing, containerWidth, breakpoints, padding, gaps } from './spacing';
import { shadows, elevation, darkShadows } from './shadows';
import { transitions, animations, interactionEffects, pageTransitions } from './animations';

export const theme = {
  colors,
  darkMode,
  typography,
  headings,
  bodyText,
  label,
  spacing,
  containerWidth,
  breakpoints,
  padding,
  gaps,
  shadows,
  elevation,
  darkShadows,
  transitions,
  animations,
  interactionEffects,
  pageTransitions,
};

// Export individual systems
export { colors, darkMode };
export { typography, headings, bodyText, label };
export { spacing, containerWidth, breakpoints, padding, gaps };
export { shadows, elevation, darkShadows };
export { transitions, animations, interactionEffects, pageTransitions };

export type Theme = typeof theme;

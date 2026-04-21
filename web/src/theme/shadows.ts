/**
 * Plant Doctor - Shadows & Elevation System
 * Material Design 3 inspired elevation levels
 */

export const shadows = {
  // No shadow - flat design
  none: 'none',

  // Elevation 0 - Subtle shadow
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',

  // Elevation 1 - Subtle depth
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',

  // Elevation 2 - Light cards
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',

  // Elevation 3 - Medium cards
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',

  // Elevation 4 - Modal content
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

  // Elevation 5 - Floating buttons
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // Elevation 6 - Modal backdrops
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
};

export const elevation = {
  // Level 0 - Flat (no shadow)
  level0: {
    boxShadow: shadows.none,
  },

  // Level 1 - Subtle (hover/focus)
  level1: {
    boxShadow: shadows.sm,
    transition: 'box-shadow 0.2s ease',
  },

  // Level 2 - Cards
  level2: {
    boxShadow: shadows.md,
    transition: 'box-shadow 0.2s ease',
  },

  // Level 3 - Elevated cards
  level3: {
    boxShadow: shadows.lg,
    transition: 'box-shadow 0.2s ease',
  },

  // Level 4 - Modals
  level4: {
    boxShadow: shadows.xl,
    transition: 'box-shadow 0.2s ease',
  },

  // Level 5 - FAB/Floating
  level5: {
    boxShadow: shadows['2xl'],
    transition: 'box-shadow 0.2s ease',
  },
};

// Dark mode shadows (softer)
export const darkShadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
};

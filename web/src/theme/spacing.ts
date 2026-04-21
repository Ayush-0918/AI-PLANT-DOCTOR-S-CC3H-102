/**
 * Plant Doctor - Spacing & Layout System
 * 8px base grid for consistent spacing
 */

export const spacing = {
  // 8px grid system
  0: '0',
  1: '0.25rem', // 4px - micro
  2: '0.5rem', // 8px - tight
  3: '0.75rem', // 12px - snug
  4: '1rem', // 16px - base
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
};

export const containerWidth = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const gridColumns = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  6: 6,
  12: 12,
};

// Gap between grid items
export const gaps = {
  xs: '0.5rem', // 8px
  sm: '1rem', // 16px
  md: '1.5rem', // 24px
  lg: '2rem', // 32px
  xl: '2.5rem', // 40px
};

// Common layout padding
export const padding = {
  mobile: {
    page: '1rem', // 16px
    section: '1.5rem', // 24px
    card: '1.5rem', // 24px
  },
  tablet: {
    page: '1.5rem', // 24px
    section: '2rem', // 32px
    card: '2rem', // 32px
  },
  desktop: {
    page: '2rem', // 32px
    section: '3rem', // 48px
    card: '2.5rem', // 40px
  },
};

// Safe area insets for notch devices
export const safeArea = {
  top: 'env(safe-area-inset-top)',
  right: 'env(safe-area-inset-right)',
  bottom: 'env(safe-area-inset-bottom)',
  left: 'env(safe-area-inset-left)',
};

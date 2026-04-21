/**
 * Plant Doctor - Typography System
 * Clean, readable, farmer-friendly typography
 */

export const typography = {
  // Font families
  fonts: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
    mono: [
      'JetBrains Mono',
      'Fira Code',
      'Courier New',
      'monospace',
    ].join(','),
  },

  // Font sizes - Mobile-first responsive
  sizes: {
    xs: { base: '0.75rem', md: '0.75rem' }, // 12px
    sm: { base: '0.875rem', md: '0.875rem' }, // 14px
    base: { base: '1rem', md: '1rem' }, // 16px
    lg: { base: '1.125rem', md: '1.125rem' }, // 18px
    xl: { base: '1.25rem', md: '1.25rem' }, // 20px
    '2xl': { base: '1.5rem', md: '1.5rem' }, // 24px
    '3xl': { base: '1.875rem', md: '2rem' }, // 30-32px
    '4xl': { base: '2.25rem', md: '2.5rem' }, // 36-40px
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.02em',
    tight: '-0.01em',
    normal: '0em',
    wide: '0.02em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Font weights
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
};

// Semantic typography tokens
export const headings = {
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: '0em',
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  h5: {
    fontSize: '1.125rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
};

export const bodyText = {
  lg: {
    fontSize: '1.125rem',
    fontWeight: 400,
    lineHeight: 1.75,
  },
  base: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  sm: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  xs: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
};

export const label = {
  base: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.25,
    letterSpacing: '0.02em',
  },
  sm: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: 1.2,
    letterSpacing: '0.05em',
  },
};

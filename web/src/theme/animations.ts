/**
 * Plant Doctor - Animation & Transition System
 * Smooth, performance-optimized animations
 */

export const transitions = {
  // Timing functions
  easing: {
    linear: 'linear',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // Duration
  duration: {
    instant: '0ms',
    fastest: '75ms',
    faster: '100ms',
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
    slowest: '700ms',
  },

  // Combined transitions
  fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  base: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

  // Specific properties
  color: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  shadow: 'box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  transform: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
};

// Animation keyframes
export const animations = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },

  slideInUp: {
    from: { transform: 'translateY(10px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },

  slideInDown: {
    from: { transform: 'translateY(-10px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },

  slideInLeft: {
    from: { transform: 'translateX(-10px)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
  },

  slideInRight: {
    from: { transform: 'translateX(10px)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
  },

  scaleIn: {
    from: { transform: 'scale(0.95)', opacity: 0 },
    to: { transform: 'scale(1)', opacity: 1 },
  },

  bounce: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' },
  },

  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },

  shimmer: {
    '0%': { backgroundPosition: '-200% 0' },
    '100%': { backgroundPosition: 'calc(200% + 0px) 0' },
  },

  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },

  wiggle: {
    '0%, 100%': { transform: 'rotate(0deg)' },
    '25%': { transform: 'rotate(-2deg)' },
    '75%': { transform: 'rotate(2deg)' },
  },
};

// Hover/focus effects
export const interactionEffects = {
  // Subtle scale on hover
  scaleHover: {
    transition: transitions.transform,
    '&:hover': {
      transform: 'scale(1.02)',
    },
  },

  // Lift effect
  liftHover: {
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    },
  },

  // Press effect
  pressActive: {
    transition: transitions.transform,
    '&:active': {
      transform: 'scale(0.98)',
    },
  },

  // Focus ring
  focusRing: {
    '&:focus-visible': {
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(34, 197, 94, 0.1), 0 0 0 5px rgba(34, 197, 94, 0.5)',
      transition: transitions.fast,
    },
  },
};

// Page transitions
export const pageTransitions = {
  enter: {
    opacity: 0,
    y: 20,
  },
  exit: {
    opacity: 0,
    y: -20,
  },
  transition: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  },
};

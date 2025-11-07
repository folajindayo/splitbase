/**
 * Animation Utilities
 * Reusable animation configurations and helpers
 */

/**
 * Common easing functions
 */
export const easing = {
  linear: "linear",
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  easeOut: "cubic-bezier(0, 0, 0.2, 1)",
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
};

/**
 * Common durations (in milliseconds)
 */
export const duration = {
  fastest: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  slowest: 700,
};

/**
 * Fade animations
 */
export const fadeAnimations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
};

/**
 * Scale animations
 */
export const scaleAnimations = {
  scaleIn: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
  },
  scaleUp: {
    initial: { scale: 0 },
    animate: { scale: 1 },
    exit: { scale: 0 },
  },
  pulse: {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop" as const,
      },
    },
  },
};

/**
 * Slide animations
 */
export const slideAnimations = {
  slideInLeft: {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  slideInRight: {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  slideInUp: {
    initial: { y: "100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "100%", opacity: 0 },
  },
  slideInDown: {
    initial: { y: "-100%", opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
};

/**
 * Rotation animations
 */
export const rotationAnimations = {
  spin: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear",
      },
    },
  },
  spinSlow: {
    animate: {
      rotate: 360,
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "linear",
      },
    },
  },
  rotateIn: {
    initial: { rotate: -180, opacity: 0 },
    animate: { rotate: 0, opacity: 1 },
    exit: { rotate: 180, opacity: 0 },
  },
};

/**
 * Bounce animations
 */
export const bounceAnimations = {
  bounce: {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 1,
        repeat: Infinity,
        repeatType: "loop" as const,
      },
    },
  },
  bounceIn: {
    initial: { scale: 0.3, opacity: 0 },
    animate: {
      scale: [0.3, 1.1, 0.9, 1.03, 0.97, 1],
      opacity: 1,
      transition: {
        duration: 0.6,
      },
    },
  },
};

/**
 * Shake animation
 */
export const shakeAnimation = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
    },
  },
};

/**
 * Stagger children animation
 */
export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/**
 * List item animation (for use with stagger)
 */
export const listItemAnimation = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

/**
 * CSS animation classes (for use with Tailwind)
 */
export const cssAnimationClasses = {
  // Fade
  fadeIn: "animate-fade-in",
  fadeOut: "animate-fade-out",
  
  // Slide
  slideInRight: "animate-slide-in-right",
  slideInLeft: "animate-slide-in-left",
  slideInUp: "animate-slide-in-up",
  slideInDown: "animate-slide-in-down",
  
  // Scale
  scaleIn: "animate-scale-in",
  scaleUp: "animate-scale-up",
  
  // Bounce
  bounce: "animate-bounce",
  bounceSlow: "animate-bounce-slow",
  
  // Spin
  spin: "animate-spin",
  spinSlow: "animate-spin-slow",
  
  // Pulse
  pulse: "animate-pulse",
  
  // Shake
  shake: "animate-shake",
  
  // Wiggle
  wiggle: "animate-wiggle",
};

/**
 * Tailwind animation CSS to add to your config
 */
export const tailwindAnimations = `
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slide-in-left {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slide-in-up {
  from { transform: translateY(100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slide-in-down {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes scale-in {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes scale-up {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

@keyframes bounce-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
  20%, 40%, 60%, 80% { transform: translateX(10px); }
}

@keyframes wiggle {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}

@keyframes progress {
  from { width: 0; }
  to { width: 100%; }
}

.animate-fade-in { animation: fade-in 0.3s ease-out; }
.animate-fade-out { animation: fade-out 0.3s ease-out; }
.animate-slide-in-right { animation: slide-in-right 0.3s ease-out; }
.animate-slide-in-left { animation: slide-in-left 0.3s ease-out; }
.animate-slide-in-up { animation: slide-in-up 0.3s ease-out; }
.animate-slide-in-down { animation: slide-in-down 0.3s ease-out; }
.animate-scale-in { animation: scale-in 0.3s ease-out; }
.animate-scale-up { animation: scale-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.animate-bounce-slow { animation: bounce-slow 2s ease-in-out infinite; }
.animate-shake { animation: shake 0.5s ease-in-out; }
.animate-wiggle { animation: wiggle 1s ease-in-out infinite; }
.animate-progress { animation: progress linear forwards; }
`;

/**
 * Page transition variants
 */
export const pageTransitions = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },
  slideRight: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
    transition: { duration: 0.3 },
  },
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: { duration: 0.3 },
  },
};

/**
 * Modal/Dialog animations
 */
export const modalAnimations = {
  overlay: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  content: {
    initial: { scale: 0.9, opacity: 0, y: 20 },
    animate: { scale: 1, opacity: 1, y: 0 },
    exit: { scale: 0.9, opacity: 0, y: 20 },
    transition: { duration: 0.2 },
  },
};

/**
 * Helper to create sequential animations
 */
export function sequentialAnimation(
  animations: Array<{ delay: number; animation: any }>
) {
  return animations.map(({ delay, animation }) => ({
    ...animation,
    transition: {
      ...animation.transition,
      delay,
    },
  }));
}

/**
 * Helper to create spring animation
 */
export function springAnimation(stiffness: number = 300, damping: number = 20) {
  return {
    type: "spring",
    stiffness,
    damping,
  };
}


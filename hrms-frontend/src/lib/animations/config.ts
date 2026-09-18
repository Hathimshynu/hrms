// src/lib/animations/config.ts
export const animationConfig = {
  default: {
    duration: 0.25,
    ease: [0.22, 1, 0.36, 1] as const,
  },

  component: {
    duration: 0.2,
    ease: "easeOut" as const,
  },

  page: {
    duration: 0.4,
    ease: [0.4, 0, 0.2, 1] as const,
  },
};

export const animations = {
  fade: {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
      transition: animationConfig.default,
    },
    exit: {
      opacity: 0,
      transition: animationConfig.default,
    },
  },

  page: {
    initial: {
      x: "100%",
    },
    animate: {
      x: "0%",
      transition: animationConfig.page,
    },
    exit: {
      x: "-100%",
      transition: animationConfig.page,
    },
  },

  slideUp: {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: animationConfig.default,
    },
    exit: {
      opacity: 0,
      y: 20,
      transition: animationConfig.default,
    },
  },

  formSlide: {
    initial: {
      opacity: 0,
      x: 20,
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: animationConfig.default,
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: animationConfig.default,
    },
  },

  alert: {
    initial: {
      opacity: 0,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: animationConfig.component,
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: animationConfig.component,
    },
  },
};

export const slideDirections = {
  left: { x: -40, y: 0 },
  right: { x: 40, y: 0 },
  up: { x: 0, y: -40 },
  down: { x: 0, y: 40 },
  none: { x: 0, y: 0 },
};

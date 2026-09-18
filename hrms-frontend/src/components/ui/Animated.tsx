// src/components/ui/Animated.tsx
"use client";

import {
  animationConfig,
  animations,
  slideDirections,
} from "@/src/lib/animations/config";
import { AnimatePresence, motion, MotionProps } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedProps extends MotionProps {
  children: ReactNode;
  type?:
    | "page"
    | "form"
    | "fade"
    | "slideUp"
    | "alert"
    | "stagger"
    | "staggerItem";
  direction?: "left" | "right" | "up" | "down" | "none";
  className?: string;
  animationKey?: string | number;
  delay?: number;
  duration?: number;
  animateOnMount?: boolean;
}

export function Animated({
  children,
  type = "fade",
  direction = "none",
  className = "",
  animationKey,
  delay = 0,
  duration,
  animateOnMount = true,
  ...props
}: AnimatedProps) {
  const getVariant = () => {
    switch (type) {
      case "page":
        return animations.page;
      case "form":
        return animations.formSlide;
      case "slideUp":
        return animations.slideUp;
      case "alert":
        return animations.alert;
      case "stagger":
      case "staggerItem":
        return null;
      case "fade":
      default:
        return animations.fade;
    }
  };

  const variant = getVariant();

  if (type === "stagger" || type === "staggerItem") {
    return <>{children}</>;
  }

  if (direction === "none") {
    // Get transition from animate or use default
    const transition = variant?.animate?.transition || animationConfig.default;

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={animationKey}
          initial={variant?.initial}
          animate={variant?.animate}
          exit={variant?.exit}
          transition={{
            ...transition,
            delay,
            duration: duration || transition?.duration,
          }}
          className={className}
          {...props}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    );
  }

  const directionOffset = slideDirections[direction];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={animationKey}
        initial={{
          opacity: 0,
          x: directionOffset.x,
          y: directionOffset.y,
        }}
        animate={{
          opacity: 1,
          x: 0,
          y: 0,
        }}
        exit={{
          opacity: 0,
          x: -directionOffset.x,
          y: -directionOffset.y,
        }}
        transition={{
          ...animationConfig.default,
          delay,
          duration: duration || animationConfig.default.duration,
        }}
        className={className}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.08,
  delayChildren = 0.1,
  ...props
}: {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
}) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      className={className}
      variants={{
        animate: {
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: delayChildren,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 15 },
        animate: { opacity: 1, y: 0 },
      }}
      transition={animationConfig.component}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

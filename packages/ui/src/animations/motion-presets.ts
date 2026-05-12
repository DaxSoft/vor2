export const motionPresets = {
  panelIn: {
    initial: { opacity: 0, y: 8, filter: "blur(8px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    exit: { opacity: 0, y: 8, filter: "blur(8px)" },
    transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] }
  },
  rowIn: {
    initial: { opacity: 0, x: -4 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.12 }
  },
  fadeScale: {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 },
    transition: { duration: 0.14 }
  }
} as const;

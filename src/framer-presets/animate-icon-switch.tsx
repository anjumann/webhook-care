import { AnimatePresence, motion } from "framer-motion";
import React from "react";

export type AnimatedIconSwitchProps = {
  show: boolean;
  iconA: React.ReactNode;
  iconB: React.ReactNode;
  duration?: number;
  className?: string;
};

export const AnimatedIconSwitch: React.FC<AnimatedIconSwitchProps> = ({
  show,
  iconA,
  iconB,
  duration = 0.25,
  className = "inline-flex",
}) => (
  <AnimatePresence mode="wait" initial={false}>
    {!show ? (
      <motion.span
        key="iconA"
        initial={{ opacity: 0, scale: 0.8, rotate: -90 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.8, rotate: 90 }}
        transition={{ duration }}
        className={className}
      >
        {iconA}
      </motion.span>
    ) : (
      <motion.span
        key="iconB"
        initial={{ opacity: 0, scale: 0.8, rotate: 90 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.8, rotate: -90 }}
        transition={{ duration }}
        className={className}
      >
        {iconB}
      </motion.span>
    )}
  </AnimatePresence>
);

export default AnimatedIconSwitch; 
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

interface AnimatedShowProps {
  show: boolean;
  children: React.ReactNode;
  duration?: number; // Optional: customize animation duration
  className?: string;
}

export const AnimatedShow: React.FC<AnimatedShowProps> = ({
  show,
  children,
  duration = 0.25,
  className = "",
}) => (
  <AnimatePresence>
    {show && (
      <motion.div
        className={className}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0, transition: { duration } }}
        exit={{ opacity: 0, y: 10, transition: { duration } }}
        style={{ overflow: "hidden" }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
); 
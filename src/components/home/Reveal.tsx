"use client";

import * as React from "react";
import { motion } from "framer-motion";

/**
 * Light, tasteful scroll reveal — a single fade + rise used across the
 * landing sections so motion stays consistent (and cheap). `delay` lets
 * callers stagger siblings without each owning a variants object.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}

export default Reveal;

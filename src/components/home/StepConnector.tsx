"use client";

import { motion } from "framer-motion";

/**
 * Horizontal connector that "draws" across the step nodes on scroll.
 * Sits behind the numbered nodes (which carry a bg-background ring), spanning
 * from the first node center (1/6) to the last (5/6) of a 3-column row.
 */
export function StepConnector() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-[16.667%] right-[16.667%] top-7 hidden h-px md:block"
    >
      <motion.div
        className="h-full w-full origin-left bg-gradient-to-r from-primary via-c2 to-primary opacity-40"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

export default StepConnector;

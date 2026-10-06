"use client";
import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={`reveal ${className}`}
      initial={false}
      whileInView={reduced ? undefined : { opacity: [0.72, 1] }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 1.15, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

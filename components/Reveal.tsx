'use client';
import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={false} whileInView={reduced ? undefined : { opacity: [0.55, 1], y: [12, 0] }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 1.2, delay, ease: 'easeOut' }}>{children}</motion.div>;
}

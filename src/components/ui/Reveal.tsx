"use client";

import { motion, type Variants } from "framer-motion";
import { useMemo } from "react";
import { EASE_RACE } from "@/lib/motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
  amount?: number;
  once?: boolean;
};

export default function Reveal({
  children,
  className,
  delay = 0,
  y = 36,
  duration = 0.9,
  amount = 0.3,
  once = true,
}: Props) {
  // Construimos las variantes con el delay incorporado para que el retardo
  // se aplique siempre (la transición de la variante tiene prioridad en Framer Motion).
  const variants = useMemo<Variants>(
    () => ({
      hidden: { opacity: 0, y },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration, ease: EASE_RACE, delay },
      },
    }),
    [delay, y, duration]
  );

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount }}
    >
      {children}
    </motion.div>
  );
}

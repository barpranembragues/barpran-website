"use client";

import { motion } from "framer-motion";

type Props = {
  items: readonly string[];
  speed?: number;
  className?: string;
};

export default function Marquee({ items, speed = 28, className = "" }: Props) {
  const loop = [...items, ...items];
  return (
    <div className={`relative flex overflow-hidden ${className}`}>
      <motion.div
        className="flex shrink-0 items-center gap-12 pr-12"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: speed, ease: "linear", repeat: Infinity }}
      >
        {loop.map((item, i) => (
          <span key={i} className="flex shrink-0 items-center gap-12">
            <span className="display text-xl text-bone/70 md:text-2xl">{item}</span>
            <span className="h-1.5 w-1.5 rotate-45 bg-barpran" />
          </span>
        ))}
      </motion.div>
    </div>
  );
}

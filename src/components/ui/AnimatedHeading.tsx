"use client";

import { motion } from "framer-motion";
import { lineWord, stagger } from "@/lib/motion";

type Props = {
  text: string; // saltos de línea con \n
  className?: string;
  as?: "h1" | "h2" | "h3";
};

const COMPONENTS = {
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
} as const;

export default function AnimatedHeading({ text, className = "", as = "h2" }: Props) {
  const lines = text.split("\n");
  const Tag = COMPONENTS[as];

  return (
    <Tag
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
      className={`display ${className}`}
    >
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span variants={lineWord} className="block">
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

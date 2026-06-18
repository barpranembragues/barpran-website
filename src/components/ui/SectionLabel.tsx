"use client";

import { motion } from "framer-motion";

type Props = {
  numero: string;
  eyebrow: string;
};

export default function SectionLabel({ numero, eyebrow }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-4"
    >
      <span className="font-mono text-sm text-barpran">{numero}</span>
      <span className="red-rule skewed w-10" />
      <span className="font-mono text-[0.72rem] uppercase tracking-mega text-ash">
        {eyebrow}
      </span>
    </motion.div>
  );
}

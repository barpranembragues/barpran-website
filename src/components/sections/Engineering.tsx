"use client";

import { motion } from "framer-motion";
import { INGENIERIA } from "@/lib/content";
import { EASE_RACE } from "@/lib/motion";
import SectionLabel from "@/components/ui/SectionLabel";
import AnimatedHeading from "@/components/ui/AnimatedHeading";
import Reveal from "@/components/ui/Reveal";

export default function Engineering() {
  return (
    <section
      id={INGENIERIA.id}
      className="relative overflow-hidden border-b border-white/5 bg-carbon py-28 md:py-40"
    >
      <div className="grid-tech pointer-events-none absolute inset-0 opacity-30" />

      <div className="frame relative">
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div>
            <SectionLabel numero={INGENIERIA.numero} eyebrow={INGENIERIA.eyebrow} />
            <AnimatedHeading
              text={INGENIERIA.titulo}
              className="mt-7 text-[clamp(2.2rem,5.5vw,4.5rem)] text-bone"
            />
            <Reveal delay={0.2}>
              <p className="mt-8 max-w-md text-base leading-relaxed text-ash">
                {INGENIERIA.bajada}
              </p>
            </Reveal>
          </div>

          <div className="grid gap-px overflow-hidden border border-white/5 bg-white/5 sm:grid-cols-2">
            {INGENIERIA.pilares.map((pilar, i) => (
              <motion.div
                key={pilar.titulo}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, ease: EASE_RACE, delay: i * 0.08 }}
                className="group relative bg-graphite p-8 transition-colors duration-500 hover:bg-steel md:p-10"
              >
                <span className="font-mono text-sm text-barpran">
                  0{i + 1}
                </span>
                <h3 className="display mt-6 text-2xl text-bone md:text-3xl">
                  {pilar.titulo}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-ash">
                  {pilar.texto}
                </p>
                <span className="absolute bottom-0 left-0 h-[3px] w-0 bg-barpran transition-all duration-500 ease-race group-hover:w-full" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

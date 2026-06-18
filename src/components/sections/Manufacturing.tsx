"use client";

import { motion } from "framer-motion";
import { FABRICACION } from "@/lib/content";
import { EASE_RACE } from "@/lib/motion";
import SectionLabel from "@/components/ui/SectionLabel";
import AnimatedHeading from "@/components/ui/AnimatedHeading";
import Reveal from "@/components/ui/Reveal";

export default function Manufacturing() {
  return (
    <section
      id={FABRICACION.id}
      className="relative overflow-hidden border-b border-white/5 bg-graphite py-28 md:py-40"
    >
      <div className="frame relative">
        <div className="max-w-4xl">
          <SectionLabel numero={FABRICACION.numero} eyebrow={FABRICACION.eyebrow} />
          <AnimatedHeading
            text={FABRICACION.titulo}
            className="mt-7 text-[clamp(2rem,5.2vw,4.4rem)] text-bone"
          />
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-xl text-base leading-relaxed text-ash">
              {FABRICACION.bajada}
            </p>
          </Reveal>
        </div>

        {/* Línea de proceso */}
        <div className="relative mt-20">
          <div className="absolute left-0 right-0 top-[26px] hidden h-px bg-white/10 lg:block" />
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 1.4, ease: EASE_RACE }}
            style={{ transformOrigin: "left" }}
            className="absolute left-0 right-0 top-[26px] hidden h-px bg-barpran lg:block"
          />

          <div className="grid gap-10 lg:grid-cols-5">
            {FABRICACION.proceso.map((step, i) => (
              <motion.div
                key={step.paso}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.7, ease: EASE_RACE, delay: 0.2 + i * 0.12 }}
                className="relative"
              >
                <div className="mb-6 flex h-[52px] items-center">
                  <span className="skewed flex h-12 w-12 items-center justify-center border border-barpran bg-carbon">
                    <span className="font-mono text-sm text-barpran">{`0${i + 1}`}</span>
                  </span>
                </div>
                <h3 className="display text-2xl text-bone">{step.paso}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ash">{step.texto}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

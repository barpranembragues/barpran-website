"use client";

import { motion } from "framer-motion";
import { HISTORIA } from "@/lib/content";
import { EASE_RACE } from "@/lib/motion";
import SectionLabel from "@/components/ui/SectionLabel";
import AnimatedHeading from "@/components/ui/AnimatedHeading";

export default function History() {
  return (
    <section
      id={HISTORIA.id}
      className="relative overflow-hidden border-b border-white/5 bg-carbon py-28 md:py-40"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-10 right-0 select-none"
      >
        <span className="display text-stroke-red text-[20vw] leading-none opacity-40">50</span>
      </div>

      <div className="frame relative">
        <SectionLabel numero={HISTORIA.numero} eyebrow={HISTORIA.eyebrow} />
        <AnimatedHeading
          text={HISTORIA.titulo}
          className="mt-7 text-[clamp(2.2rem,6vw,5.2rem)] text-bone"
        />

        <div className="relative mt-20">
          {/* Eje vertical */}
          <div className="absolute bottom-0 left-[7px] top-0 w-px bg-white/10 md:left-1/2" />

          <div className="space-y-14 md:space-y-0">
            {HISTORIA.hitos.map((hito, i) => {
              const left = i % 2 === 0;
              return (
                <motion.div
                  key={hito.anio}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.8, ease: EASE_RACE }}
                  className={`relative pl-10 md:flex md:pl-0 ${
                    left ? "md:justify-start" : "md:justify-end"
                  } md:py-10`}
                >
                  {/* Nodo */}
                  <span className="absolute left-0 top-1.5 h-3.5 w-3.5 -translate-x-[5px] rotate-45 border-2 border-barpran bg-carbon md:left-1/2 md:top-12 md:-translate-x-1/2" />

                  <div
                    className={`md:w-[44%] ${
                      left ? "md:pr-12 md:text-right" : "md:pl-12"
                    }`}
                  >
                    <span className="display text-[clamp(2.4rem,5vw,4rem)] text-barpran">
                      {hito.anio}
                    </span>
                    <h3 className="display mt-1 text-2xl text-bone md:text-3xl">
                      {hito.titulo}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-ash">{hito.texto}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { COMPETICION } from "@/lib/content";
import { EASE_RACE } from "@/lib/motion";
import SectionLabel from "@/components/ui/SectionLabel";
import AnimatedHeading from "@/components/ui/AnimatedHeading";
import Reveal from "@/components/ui/Reveal";

export default function Motorsport() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const bigX = useTransform(scrollYProgress, [0, 1], ["8%", "-18%"]);

  return (
    <section
      ref={ref}
      id={COMPETICION.id}
      className="relative overflow-hidden border-b border-white/5 bg-graphite py-28 md:py-40"
    >
      {/* Texto gigante de fondo en parallax */}
      <motion.div
        style={{ x: bigX }}
        aria-hidden
        className="pointer-events-none absolute top-1/2 -z-0 -translate-y-1/2 select-none whitespace-nowrap"
      >
        <span className="display text-stroke text-[26vw] leading-none opacity-60">
          COMPETICIÓN
        </span>
      </motion.div>

      <div className="frame relative">
        <SectionLabel numero={COMPETICION.numero} eyebrow={COMPETICION.eyebrow} />
        <AnimatedHeading
          text={COMPETICION.titulo}
          className="mt-7 max-w-4xl text-[clamp(2.2rem,5.8vw,5rem)] text-bone"
        />
        <Reveal delay={0.2}>
          <p className="mt-8 max-w-lg text-base leading-relaxed text-ash">
            {COMPETICION.bajada}
          </p>
        </Reveal>

        <div className="mt-16 grid gap-px overflow-hidden border border-white/5 bg-white/5 md:grid-cols-2 xl:grid-cols-4">
          {COMPETICION.disciplinas.map((disc, i) => (
            <motion.div
              key={disc.nombre}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: EASE_RACE, delay: i * 0.08 }}
              className="group relative flex min-h-[220px] flex-col justify-between bg-carbon p-8 transition-colors duration-500 hover:bg-steel"
            >
              <span className="skewed inline-block self-start border border-barpran/40 px-3 py-1">
                <span className="font-mono text-[0.66rem] uppercase tracking-mega text-barpran">
                  {`0${i + 1}`}
                </span>
              </span>
              <div>
                <h3 className="display text-2xl text-bone md:text-[1.7rem]">
                  {disc.nombre}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ash">{disc.detalle}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <Reveal delay={0.1} className="mt-16">
          <p className="display max-w-3xl text-[clamp(1.4rem,3.4vw,2.6rem)] leading-tight text-bone">
            <span className="text-barpran">«</span>
            {COMPETICION.cierre}
            <span className="text-barpran">»</span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

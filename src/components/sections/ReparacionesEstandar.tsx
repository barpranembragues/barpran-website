"use client";

import { motion } from "framer-motion";
import { REPARACIONES_ESTANDAR } from "@/lib/content";
import AnimatedHeading from "@/components/ui/AnimatedHeading";
import Reveal from "@/components/ui/Reveal";

export default function ReparacionesEstandar() {
  return (
    <section
      id={REPARACIONES_ESTANDAR.id}
      className="relative overflow-hidden border-b border-white/5 bg-graphite py-24 md:py-36"
    >
      <div className="grid-tech pointer-events-none absolute inset-0 opacity-20" />
      <div className="pointer-events-none absolute -right-10 top-14 select-none display text-[18vw] leading-none text-white/[0.018]">
        STD
      </div>

      <div className="frame relative">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-mega text-barpran">
              {REPARACIONES_ESTANDAR.numero} · {REPARACIONES_ESTANDAR.eyebrow}
            </p>
            <AnimatedHeading
              text={REPARACIONES_ESTANDAR.titulo}
              className="mt-5 max-w-4xl text-[clamp(2.4rem,5.7vw,5.2rem)] text-bone"
            />
          </div>
          <Reveal delay={0.1}>
            <div>
              <p className="text-base leading-relaxed text-ash">{REPARACIONES_ESTANDAR.bajada}</p>
              <p className="mt-5 text-sm leading-relaxed text-bone/65">{REPARACIONES_ESTANDAR.introduccion}</p>
            </div>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          {REPARACIONES_ESTANDAR.comparativas.map((item, index) => (
            <motion.article
              key={item.nombre}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
              className="overflow-hidden border border-white/[0.07] bg-carbon"
            >
              <div className="grid grid-cols-2">
                <div className="relative aspect-[4/5] overflow-hidden border-r border-white/[0.07] bg-steel">
                  <img
                    src={item.antes}
                    alt={`${item.nombre} antes de la reparación BARPRAN`}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 hover:scale-[1.035]"
                  />
                  <span className="absolute left-3 top-3 border border-white/15 bg-black/65 px-2 py-1 font-mono text-[0.55rem] uppercase tracking-mega text-bone backdrop-blur">
                    Antes
                  </span>
                </div>
                <div className="relative aspect-[4/5] overflow-hidden bg-steel">
                  <img
                    src={item.despues}
                    alt={`${item.nombre} después de la reparación BARPRAN`}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 hover:scale-[1.035]"
                  />
                  <span className="absolute right-3 top-3 bg-barpran px-2 py-1 font-mono text-[0.55rem] font-bold uppercase tracking-mega text-white">
                    Después
                  </span>
                </div>
              </div>
              <div className="p-5">
                <p className="display text-xl text-bone">{item.nombre}</p>
                <p className="mt-2 font-mono text-[0.58rem] uppercase tracking-mega text-ash">Recuperación BARPRAN</p>
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-16 grid gap-px overflow-hidden border border-white/5 bg-white/5 sm:grid-cols-2 lg:grid-cols-5">
          {REPARACIONES_ESTANDAR.proceso.map((item, index) => (
            <div key={item.paso} className="bg-carbon p-6 md:p-7">
              <span className="font-mono text-[0.62rem] uppercase tracking-mega text-barpran">0{index + 1}</span>
              <h3 className="display mt-4 text-xl text-bone">{item.paso}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ash">{item.texto}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 grid gap-8 border border-white/[0.07] bg-carbon p-7 md:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="font-mono text-[0.65rem] uppercase tracking-mega text-barpran">QUÉ REPARAMOS</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {REPARACIONES_ESTANDAR.servicios.map((servicio) => (
                <span
                  key={servicio}
                  className="border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-bone/75"
                >
                  {servicio}
                </span>
              ))}
            </div>
          </div>

          <a
            href={REPARACIONES_ESTANDAR.cta}
            target="_blank"
            rel="noopener noreferrer"
            className="skewed inline-flex min-w-[250px] items-center justify-center border border-barpran bg-barpran px-6 py-4 transition hover:bg-transparent"
          >
            <span className="font-mono text-[0.7rem] font-bold uppercase tracking-mega text-white">
              Cotizar por WhatsApp →
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}

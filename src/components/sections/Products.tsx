"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { PRODUCTOS } from "@/lib/content";
import { EASE_RACE } from "@/lib/motion";
import SectionLabel from "@/components/ui/SectionLabel";
import AnimatedHeading from "@/components/ui/AnimatedHeading";
import ClutchDisc from "@/components/ui/ClutchDisc";

export default function Products() {
  const [active, setActive] = useState(0);
  const item = PRODUCTOS.items[active];

  return (
    <section
      id={PRODUCTOS.id}
      className="relative overflow-hidden border-b border-white/5 bg-carbon py-28 md:py-40"
    >
      <div className="frame relative">
        <SectionLabel numero={PRODUCTOS.numero} eyebrow={PRODUCTOS.eyebrow} />
        <AnimatedHeading
          text={PRODUCTOS.titulo}
          className="mt-7 max-w-4xl text-[clamp(2.2rem,5.8vw,5rem)] text-bone"
        />

        <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          {/* Selector */}
          <div className="flex flex-col">
            {PRODUCTOS.items.map((p, i) => {
              const isActive = i === active;
              return (
                <button
                  key={p.codigo}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  className="group relative border-b border-white/5 py-6 text-left transition-colors"
                >
                  <div className="flex items-baseline gap-5">
                    <span
                      className={`font-mono text-sm transition-colors ${
                        isActive ? "text-barpran" : "text-ash"
                      }`}
                    >
                      {p.codigo}
                    </span>
                    <span
                      className={`display text-[clamp(1.6rem,3.2vw,2.6rem)] transition-all duration-500 ease-race ${
                        isActive
                          ? "translate-x-2 text-bone"
                          : "text-bone/40 group-hover:text-bone/70"
                      }`}
                    >
                      {p.nombre}
                    </span>
                  </div>
                  <span
                    className={`absolute bottom-0 left-0 h-[3px] bg-barpran transition-all duration-500 ease-race ${
                      isActive ? "w-full" : "w-0"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Panel de detalle */}
          <div className="relative min-h-[420px] overflow-hidden border border-white/5 bg-graphite">
            <div className="grid-tech absolute inset-0 opacity-30" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 opacity-30">
              <ClutchDisc className="h-full w-full" />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={item.codigo}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.5, ease: EASE_RACE }}
                style={{
  backgroundImage: `linear-gradient(90deg, rgba(10,10,10,0.96) 0%, rgba(10,10,10,0.85) 45%, rgba(10,10,10,0.35) 100%), url(${item.imagen})`,
  backgroundSize: "cover",
  backgroundPosition: "center center",
  backgroundRepeat: "no-repeat",
}}
                className="relative flex h-full flex-col justify-between p-8 md:p-12"
              >
                <div>
                  <span className="font-mono text-sm text-barpran">{item.codigo}</span>
                  <h3 className="display mt-4 text-[clamp(2rem,4vw,3.4rem)] text-bone">
                    {item.nombre}
                  </h3>
                  <p className="mt-5 max-w-md text-base leading-relaxed text-ash">
                    {item.resumen}
                  </p>
                </div>

                <ul className="mt-10 space-y-3 border-t border-white/5 pt-8">
                  {item.specs.map((spec) => (
                    <li key={spec} className="flex items-center gap-3">
                      <span className="h-1.5 w-1.5 rotate-45 bg-barpran" />
                      <span className="font-mono text-[0.78rem] uppercase tracking-mega text-bone/80">
                        {spec}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PILOTOS } from "@/lib/content";
import { MARCOS_DI_PALMA, PILOTOS_TC, PILOTOS_TC_PISTA } from "@/lib/pilotosBarpran";
import AnimatedHeading from "@/components/ui/AnimatedHeading";
import Reveal from "@/components/ui/Reveal";

const tabs = ["TC", "TC PISTA", "LEYENDAS"] as const;
type Tab = (typeof tabs)[number];

function DriverImage({ name, category }: { name: string; category: string }) {
  const src = `/api/actc/foto?cat=${encodeURIComponent(category)}&name=${encodeURIComponent(name)}`;
  return (
    <img
      src={src}
      alt={`${name} — piloto que utiliza embrague BARPRAN`}
      loading="lazy"
      referrerPolicy="no-referrer"
      className="h-full w-full object-cover object-top grayscale-[15%] transition duration-700 group-hover:scale-[1.035] group-hover:grayscale-0"
    />
  );
}

export default function PilotosBarpran() {
  const [activeTab, setActiveTab] = useState<Tab>("TC");

  const drivers = useMemo(() => {
    if (activeTab === "TC") return PILOTOS_TC;
    if (activeTab === "TC PISTA") return PILOTOS_TC_PISTA;
    return [];
  }, [activeTab]);

  return (
    <section id={PILOTOS.id} className="relative overflow-hidden border-b border-white/5 bg-carbon py-24 md:py-32">
      <div className="grid-tech pointer-events-none absolute inset-0 opacity-20" />
      <div className="pointer-events-none absolute right-[-8vw] top-8 select-none display text-[18vw] leading-none text-white/[0.018]">
        ACTC
      </div>

      <div className="frame relative">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-mega text-barpran">{PILOTOS.eyebrow}</p>
            <AnimatedHeading
              text={PILOTOS.titulo}
              className="mt-5 max-w-4xl text-[clamp(2.4rem,5.7vw,5.2rem)] text-bone"
            />
          </div>
          <Reveal delay={0.15}>
            <p className="max-w-xl text-base leading-relaxed text-ash">{PILOTOS.bajada}</p>
          </Reveal>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-px border border-white/5 bg-white/5 md:grid-cols-4">
          {PILOTOS.categorias.map((categoria) => (
            <div key={categoria} className="bg-graphite px-5 py-5 text-center md:px-7">
              <span className="display text-lg text-bone md:text-xl">{categoria}</span>
              <span className="mt-1 block font-mono text-[0.58rem] uppercase tracking-mega text-barpran">BARPRAN PRESENTE</span>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap gap-2 border-b border-white/5 pb-5">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border px-4 py-2 font-mono text-[0.67rem] uppercase tracking-mega transition-all duration-300 ${
                activeTab === tab
                  ? "border-barpran bg-barpran text-white"
                  : "border-white/10 bg-white/[0.02] text-ash hover:border-white/25 hover:text-bone"
              }`}
            >
              {tab}
            </button>
          ))}
          <span className="ml-auto hidden self-center font-mono text-[0.62rem] uppercase tracking-mega text-ash md:block">
            Fotografías oficiales · ACTC
          </span>
        </div>

        {activeTab !== "LEYENDAS" ? (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          >
            {drivers.map((driver) => (
              <article
                key={driver.nombre}
                className="group relative overflow-hidden border border-white/[0.07] bg-graphite"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-steel">
                  <DriverImage name={driver.nombre} category={driver.actcCategory} />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/5 to-transparent" />
                  <span className="absolute left-3 top-3 border border-white/15 bg-black/55 px-2 py-1 font-mono text-[0.55rem] uppercase tracking-mega text-bone backdrop-blur">
                    {driver.categoria}
                  </span>
                  {driver.destacado && (
                    <span className="absolute bottom-3 left-3 bg-barpran px-2 py-1 font-mono text-[0.52rem] font-bold uppercase tracking-mega text-white">
                      {driver.destacado}
                    </span>
                  )}
                </div>
                <div className="border-t border-white/[0.06] p-4">
                  <p className="display text-[1.15rem] leading-[1.05] text-bone">{driver.nombre}</p>
                  <p className="mt-2 font-mono text-[0.55rem] uppercase tracking-mega text-ash">Embrague BARPRAN</p>
                </div>
                <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-barpran transition-all duration-500 group-hover:w-full" />
              </article>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="leyendas"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mt-8 overflow-hidden border border-white/[0.07] bg-graphite"
          >
            <div className="grid md:grid-cols-[.75fr_1.25fr]">
              <div className="group relative min-h-[430px] overflow-hidden bg-steel">
                <DriverImage name={MARCOS_DI_PALMA.nombre} category="tc" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              </div>
              <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">
                <p className="font-mono text-[0.66rem] uppercase tracking-mega text-barpran">LEYENDAS BARPRAN</p>
                <h3 className="display mt-5 text-[clamp(2.4rem,5vw,4.8rem)] leading-none text-bone">Marcos Di Palma</h3>
                <p className="mt-6 max-w-xl text-base leading-relaxed text-ash">
                  Una familia inseparable de la historia del automovilismo argentino. Marcos Di Palma y la familia Di Palma forman parte de la trayectoria de BARPRAN dentro de la competición nacional.
                </p>
                <div className="mt-8 border-l-2 border-barpran pl-5">
                  <p className="display text-2xl text-bone">Generaciones unidas por la competición.</p>
                  <p className="mt-2 font-mono text-[0.62rem] uppercase tracking-mega text-ash">BARPRAN · EL EMBRAGUE DEL AUTOMOVILISMO</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <p className="mt-6 font-mono text-[0.58rem] leading-relaxed uppercase tracking-widest text-ash/70">
          La selección publicada corresponde exclusivamente a pilotos y categorías informados por BARPRAN. ACTC se utiliza como fuente de fotografías y referencia de pilotos.
        </p>
      </div>
    </section>
  );
}

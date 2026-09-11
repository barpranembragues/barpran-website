"use client";

import { motion, useInView, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MANIFIESTO, STATS } from "@/lib/content";
import { EASE_RACE } from "@/lib/motion";
import Reveal from "@/components/ui/Reveal";

const CLUTCH_COUNTER_BASE = 813680;
const CLUTCH_COUNTER_BASE_DATE = Date.UTC(2026, 8, 11);
const DAY_MS = 24 * 60 * 60 * 1000;

function getArgentinaDateUtc(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  return Date.UTC(year, month - 1, day);
}

function dailyClutchIncrement(dayIndex: number) {
  const x = Math.sin((dayIndex + 20260911) * 12.9898 + 78.233) * 43758.5453;
  const fraction = x - Math.floor(x);
  return 30 + Math.floor(fraction * 16);
}

function getEstimatedClutches(date = new Date()) {
  const currentDate = getArgentinaDateUtc(date);
  const elapsedDays = Math.max(
    0,
    Math.floor((currentDate - CLUTCH_COUNTER_BASE_DATE) / DAY_MS),
  );

  let total = CLUTCH_COUNTER_BASE;
  for (let dayIndex = 1; dayIndex <= elapsedDays; dayIndex += 1) {
    total += dailyClutchIncrement(dayIndex);
  }

  return total;
}

function Counter({ valor, sufijo }: { valor: string; sufijo: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [display, setDisplay] = useState(valor);
  const numeric = Number(valor.replace(",", "."));
  const isNumeric = !Number.isNaN(numeric);

  useEffect(() => {
    if (!inView || !isNumeric) return;
    const decimals = valor.includes(",") ? valor.split(",")[1].length : 0;
    const controls = animate(0, numeric, {
      duration: 1.6,
      ease: EASE_RACE,
      onUpdate(v) {
        setDisplay(v.toFixed(decimals).replace(".", ","));
      },
    });
    return () => controls.stop();
  }, [inView, isNumeric, numeric, valor]);

  return (
    <span ref={ref} className="display text-[clamp(3rem,7vw,6rem)] text-bone">
      {display}
      <span className="text-barpran">{sufijo}</span>
    </span>
  );
}

function ClutchCounter() {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [target, setTarget] = useState(CLUTCH_COUNTER_BASE);
  const [display, setDisplay] = useState(CLUTCH_COUNTER_BASE);

  useEffect(() => {
    setTarget(getEstimatedClutches());
  }, []);

  useEffect(() => {
    if (!inView) return;

    const start = Math.max(CLUTCH_COUNTER_BASE, target - 900);
    const controls = animate(start, target, {
      duration: 1.8,
      ease: EASE_RACE,
      onUpdate(value) {
        setDisplay(Math.round(value));
      },
    });

    return () => controls.stop();
  }, [inView, target]);

  return (
    <span
      ref={ref}
      className="display tabular-nums text-[clamp(3.2rem,10vw,8.5rem)] leading-none text-bone"
    >
      {display.toLocaleString("es-AR")}
      <span className="text-barpran">+</span>
    </span>
  );
}

export default function Manifesto() {
  return (
    <section className="relative overflow-hidden border-b border-white/5 bg-graphite py-28 md:py-40">
      <div className="frame relative">
        <Reveal>
          <span className="font-mono text-[0.72rem] uppercase tracking-mega text-barpran">
            {MANIFIESTO.eyebrow}
          </span>
        </Reveal>

        <motion.p
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.012 } },
          }}
          className="display mt-8 max-w-5xl text-[clamp(1.6rem,4.4vw,3.6rem)] leading-[1.05] text-bone"
        >
          {MANIFIESTO.texto.split(" ").map((word, i) => (
            <span key={i} className="inline-block overflow-hidden align-bottom">
              <motion.span
                variants={{
                  hidden: { y: "100%", opacity: 0 },
                  visible: { y: "0%", opacity: 1, transition: { ease: EASE_RACE } },
                }}
                className="inline-block pr-[0.25em]"
              >
                {word}
              </motion.span>
            </span>
          ))}
        </motion.p>

        <div className="mt-20 border-t border-white/5 pt-14">
          <Reveal>
            <div className="grid items-end gap-5 md:grid-cols-[minmax(0,1fr)_minmax(240px,0.42fr)] md:gap-10">
              <ClutchCounter />
              <div className="pb-2 md:pb-4">
                <p className="display text-[clamp(1.15rem,2.4vw,2rem)] uppercase leading-tight text-bone">
                  Embragues fabricados y reparados desde 1971
                </p>
                <p className="mt-3 font-mono text-[0.66rem] uppercase tracking-mega text-ash">
                  Estimación histórica · actualización diaria
                </p>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 border-t border-white/5 pt-14 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.08}>
              <div>
                <Counter valor={stat.valor} sufijo={stat.sufijo} />
                <p className="mt-3 font-mono text-[0.72rem] uppercase tracking-mega text-ash">
                  {stat.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

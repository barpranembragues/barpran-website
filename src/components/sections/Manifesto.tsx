"use client";

import { motion, useInView, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { MANIFIESTO, STATS } from "@/lib/content";
import { EASE_RACE } from "@/lib/motion";
import Reveal from "@/components/ui/Reveal";

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

        <div className="mt-20 grid grid-cols-2 gap-x-6 gap-y-12 border-t border-white/5 pt-14 lg:grid-cols-4">
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

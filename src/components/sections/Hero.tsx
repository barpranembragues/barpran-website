"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import { HERO } from "@/lib/content";
import { EASE_RACE } from "@/lib/motion";
import ClutchDisc from "@/components/ui/ClutchDisc";
import SkewButton from "@/components/ui/SkewButton";
import Marquee from "@/components/ui/Marquee";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const discY = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);

  return (
    <section ref={ref} id="hero" className="relative flex min-h-[100svh] flex-col overflow-hidden">
      {/* ── Fondo cinematográfico ──
          Para usar tu propio video, descomentá el <video> y dejá tu archivo
          en /public/hero.mp4 (+ /public/hero-poster.jpg). */}
      {/*
      <video
        autoPlay
        muted
        loop
        playsInline
        poster="/hero-poster.jpg"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>
      */}

      {/* Fondo animado por defecto (sin video) */}
      <div className="absolute inset-0 bg-carbon">
        <div className="grid-tech absolute inset-0 opacity-50" />
        <motion.div
          style={{ y: discY }}
          className="absolute -right-[20%] top-1/2 h-[120vmin] w-[120vmin] -translate-y-1/2 opacity-[0.55] md:-right-[8%]"
        >
          <ClutchDisc className="h-full w-full" />
        </motion.div>
        {/* Viñeta y degradados */}
        <div className="absolute inset-0 bg-gradient-to-r from-carbon via-carbon/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon via-transparent to-carbon/60" />
        {/* Línea de escaneo */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 h-px animate-scan bg-gradient-to-r from-transparent via-barpran/40 to-transparent" />
        </div>
      </div>

      {/* Contenido */}
      <motion.div style={{ y, opacity }} className="frame relative flex flex-1 flex-col justify-center pt-28 pb-32">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: EASE_RACE, delay: 0.5 }}
          className="mb-6 flex items-center gap-4"
        >
          <span className="red-rule skewed w-12" />
          <span className="font-mono text-[0.74rem] uppercase tracking-mega text-ash">
            {HERO.eyebrow}
          </span>
        </motion.div>
<div className="mb-12 flex justify-center">
  <Image
    src="/barpran-logo-negro.png"
    alt="BARPRAN"
    width={900}
    height={300}
    priority
    className="h-auto w-[500px] md:w-[800px]"
  />
</div>
        <h1 className="display text-bone">
          {HERO.titulo.map((line, i) => (
            <span key={i} className="block overflow-hidden">
              <motion.span
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1, ease: EASE_RACE, delay: 0.6 + i * 0.12 }}
                className="block text-[clamp(2.6rem,9vw,9.5rem)]"
              >
                {i === 1 ? (
                  <span className="text-barpran">{line}</span>
                ) : (
                  line
                )}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_RACE, delay: 1 }}
          className="mt-8 max-w-xl text-base leading-relaxed text-ash md:text-lg"
        >
          {HERO.bajada}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE_RACE, delay: 1.15 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <SkewButton href={HERO.ctaPrimario.href} variant="solid">
            {HERO.ctaPrimario.label}
          </SkewButton>
          <SkewButton href={HERO.ctaSecundario.href} variant="ghost">
            {HERO.ctaSecundario.label}
          </SkewButton>
        </motion.div>
      </motion.div>

      {/* Ticker inferior */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.4 }}
        className="relative border-y border-white/5 bg-carbon/40 py-4 backdrop-blur-sm"
      >
        <Marquee items={HERO.ticker} />
      </motion.div>

      {/* Indicador de scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="pointer-events-none absolute bottom-24 right-[var(--frame-x)] hidden items-center gap-3 md:flex"
      >
        <span className="font-mono text-[0.66rem] uppercase tracking-mega text-ash">
          Scroll
        </span>
        <motion.span
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="h-8 w-px bg-gradient-to-b from-barpran to-transparent"
        />
      </motion.div>
    </section>
  );
}

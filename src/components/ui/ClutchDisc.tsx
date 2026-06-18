"use client";

import { motion } from "framer-motion";

/**
 * Disco de embrague vectorial animado.
 * Funciona como fondo cinematográfico del hero sin depender de un archivo de video.
 * Si querés usar video, ver Hero.tsx (etiqueta <video> opcional).
 */
export default function ClutchDisc({ className = "" }: { className?: string }) {
  const teeth = Array.from({ length: 48 });
  const springs = Array.from({ length: 6 });

  return (
    <motion.svg
      viewBox="0 0 400 400"
      className={className}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden
    >
      <defs>
        <radialGradient id="discMetal" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#34373d" />
          <stop offset="55%" stopColor="#1c1e22" />
          <stop offset="100%" stopColor="#0a0a0b" />
        </radialGradient>
        <linearGradient id="rimRed" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E1140F" />
          <stop offset="100%" stopColor="#8E0B08" />
        </linearGradient>
      </defs>

      {/* Disco rotante */}
      <motion.g
        style={{ transformOrigin: "200px 200px" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, ease: "linear", repeat: Infinity }}
      >
        {/* Dentado exterior */}
        {teeth.map((_, i) => {
          const angle = (i / teeth.length) * Math.PI * 2;
          const r1 = 188;
          const r2 = 198;
          const x1 = 200 + Math.cos(angle) * r1;
          const y1 = 200 + Math.sin(angle) * r1;
          const x2 = 200 + Math.cos(angle) * r2;
          const y2 = 200 + Math.sin(angle) * r2;
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#2A2C31"
              strokeWidth={4}
            />
          );
        })}

        <circle cx="200" cy="200" r="186" fill="url(#discMetal)" stroke="#2A2C31" strokeWidth="2" />
        <circle cx="200" cy="200" r="150" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <circle cx="200" cy="200" r="150" fill="none" stroke="url(#rimRed)" strokeWidth="2" strokeDasharray="6 14" />

        {/* Resortes amortiguadores (cubo) */}
        {springs.map((_, i) => {
          const angle = (i / springs.length) * Math.PI * 2;
          const rx = 200 + Math.cos(angle) * 92;
          const ry = 200 + Math.sin(angle) * 92;
          return (
            <g key={i} transform={`translate(${rx} ${ry}) rotate(${(angle * 180) / Math.PI})`}>
              <rect x="-22" y="-9" width="44" height="18" rx="9" fill="#16171a" stroke="#2A2C31" strokeWidth="1.5" />
              <line x1="-18" y1="0" x2="18" y2="0" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" strokeDasharray="3 3" />
            </g>
          );
        })}

        {/* Cubo central estriado */}
        <circle cx="200" cy="200" r="54" fill="#121316" stroke="#2A2C31" strokeWidth="2" />
        <circle cx="200" cy="200" r="30" fill="none" stroke="#E1140F" strokeWidth="2" />
        {Array.from({ length: 20 }).map((_, i) => {
          const angle = (i / 20) * Math.PI * 2;
          const x1 = 200 + Math.cos(angle) * 22;
          const y1 = 200 + Math.sin(angle) * 22;
          const x2 = 200 + Math.cos(angle) * 30;
          const y2 = 200 + Math.sin(angle) * 30;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2A2C31" strokeWidth="3" />;
        })}
        <circle cx="200" cy="200" r="8" fill="#0a0a0b" stroke="#E1140F" strokeWidth="1.5" />
      </motion.g>
    </motion.svg>
  );
}

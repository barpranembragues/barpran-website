"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { NAV, SITE } from "@/lib/content";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          scrolled
            ? "border-b border-white/5 bg-carbon/85 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="frame flex h-16 items-center justify-between md:h-20">
          <Link href="#hero" className="relative z-10 flex items-center" aria-label="BARPRAN — inicio">
            <Image
              src="/logo-barpran-light.png"
              alt="BARPRAN"
              width={1784}
              height={882}
              priority
              className="h-7 w-auto md:h-9"
            />
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="group relative font-mono text-[0.72rem] uppercase tracking-mega text-ash transition-colors hover:text-bone"
              >
                {item.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-barpran transition-all duration-500 ease-race group-hover:w-full" />
              </a>
            ))}
            <a
              href="#contacto"
              className="skewed border border-barpran/60 bg-barpran/10 px-5 py-2 text-bone transition-colors hover:bg-barpran"
            >
              <span className="block font-mono text-[0.72rem] uppercase tracking-mega">
                Contacto
              </span>
            </a>
          </nav>

          <button
            onClick={() => setOpen((v) => !v)}
            className="relative z-10 flex h-10 w-10 flex-col items-center justify-center gap-[5px] lg:hidden"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
          >
            <span
              className={`h-[2px] w-6 bg-bone transition-all duration-300 ${
                open ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-[2px] w-6 bg-bone transition-all duration-300 ${
                open ? "opacity-0" : ""
              }`}
            />
            <span
              className={`h-[2px] w-6 bg-bone transition-all duration-300 ${
                open ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-40 flex flex-col bg-carbon lg:hidden"
          >
            <div className="grid-tech absolute inset-0 opacity-40" />
            <nav className="frame relative flex flex-1 flex-col justify-center gap-2">
              {NAV.map((item, i) => (
                <motion.a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="display border-b border-white/5 py-4 text-4xl text-bone"
                >
                  <span className="mr-3 font-mono text-sm not-italic text-barpran">
                    0{i + 1}
                  </span>
                  {item.label}
                </motion.a>
              ))}
              <p className="mt-8 font-mono text-xs uppercase tracking-mega text-ash">
                {SITE.email}
              </p>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

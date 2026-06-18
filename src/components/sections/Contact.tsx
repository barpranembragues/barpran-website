"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CONTACTO, SITE } from "@/lib/content";
import SectionLabel from "@/components/ui/SectionLabel";
import AnimatedHeading from "@/components/ui/AnimatedHeading";
import Reveal from "@/components/ui/Reveal";

const inputBase =
  "w-full border-b border-white/15 bg-transparent py-3 text-bone placeholder:text-ash/60 outline-none transition-colors focus:border-barpran";

export default function Contact() {
  const [form, setForm] = useState({ nombre: "", email: "", asunto: "", mensaje: "" });

  const update =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Sin backend: compone un correo. Para producción, conectá una API route
    // o un servicio (Resend, Formspree, etc.) — ver README.
    const subject = encodeURIComponent(form.asunto || `Consulta de ${form.nombre}`);
    const body = encodeURIComponent(
      `Nombre: ${form.nombre}\nEmail: ${form.email}\n\n${form.mensaje}`
    );
    window.location.href = `mailto:${SITE.email}?subject=${subject}&body=${body}`;
  };

  return (
    <section
      id={CONTACTO.id}
      className="relative overflow-hidden bg-graphite py-28 md:py-40"
    >
      <div className="grid-tech pointer-events-none absolute inset-0 opacity-30" />

      <div className="frame relative">
        <div className="grid gap-16 lg:grid-cols-[1fr_1fr] lg:gap-24">
          <div>
            <SectionLabel numero={CONTACTO.numero} eyebrow={CONTACTO.eyebrow} />
            <AnimatedHeading
              text={CONTACTO.titulo}
              className="mt-7 text-[clamp(2.2rem,5.5vw,4.6rem)] text-bone"
            />
            <Reveal delay={0.2}>
              <p className="mt-8 max-w-md text-base leading-relaxed text-ash">
                {CONTACTO.bajada}
              </p>
            </Reveal>

            <Reveal delay={0.3}>
              <div className="mt-12 space-y-6">
                {[
                  { label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
                  { label: "Teléfono", value: SITE.telefono, href: `tel:${SITE.telefono.replace(/\s/g, "")}` },
                  { label: "Ubicación", value: SITE.direccion },
                ].map((row) => (
                  <div key={row.label} className="border-t border-white/5 pt-4">
                    <p className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">
                      {row.label}
                    </p>
                    {row.href ? (
                      <a
                        href={row.href}
                        className="display mt-1 block text-xl text-bone transition-colors hover:text-barpran md:text-2xl"
                      >
                        {row.value}
                      </a>
                    ) : (
                      <p className="display mt-1 text-xl text-bone md:text-2xl">{row.value}</p>
                    )}
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-8"
          >
            <div>
              <label className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">
                Nombre
              </label>
              <input
                required
                value={form.nombre}
                onChange={update("nombre")}
                placeholder="Tu nombre"
                className={inputBase}
              />
            </div>
            <div>
              <label className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">
                Email
              </label>
              <input
                required
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="tucorreo@ejemplo.com"
                className={inputBase}
              />
            </div>
            <div>
              <label className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">
                Asunto
              </label>
              <input
                value={form.asunto}
                onChange={update("asunto")}
                placeholder="Consulta técnica / Proyecto de competición"
                className={inputBase}
              />
            </div>
            <div>
              <label className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">
                Mensaje
              </label>
              <textarea
                required
                value={form.mensaje}
                onChange={update("mensaje")}
                placeholder="Contanos qué necesitás..."
                rows={4}
                className={`${inputBase} resize-none`}
              />
            </div>

            <button
              type="submit"
              className="skewed group mt-2 inline-flex items-center self-start bg-barpran px-8 py-4 transition-colors duration-500 hover:bg-barpran-bright"
            >
              <span className="flex items-center gap-3 font-mono text-[0.74rem] uppercase tracking-mega text-bone">
                Enviar consulta
                <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">
                  →
                </span>
              </span>
            </button>
          </motion.form>
        </div>
      </div>
    </section>
  );
}

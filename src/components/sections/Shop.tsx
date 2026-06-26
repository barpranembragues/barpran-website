"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SHOP_PRODUCTS, TIENDA } from "@/lib/content";
import { EASE_RACE, fadeUp, stagger } from "@/lib/motion";
import SectionLabel from "@/components/ui/SectionLabel";

const WA_NUMBER = "5491170586143";

function buildWhatsAppUrl(nombre: string, equivalencias: string[]): string {
  const equiv = equivalencias.join(", ");
  const msg = `Hola BARPRAN, quiero consultar por ${nombre}, compatible con ${equiv}.`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

export default function Shop() {
  return (
    <section
      id={TIENDA.id}
      className="relative overflow-hidden border-b border-white/5 bg-carbon py-28 md:py-40"
    >
      {/* Fondo tecnico */}
      <div className="grid-tech pointer-events-none absolute inset-0 opacity-20" />

      {/* Acento rojo superior */}
      <div className="absolute left-0 top-0 h-[3px] w-full bg-gradient-to-r from-barpran via-barpran-bright to-transparent" />

      <div className="frame relative">
        {/* Header de seccion */}
        <SectionLabel numero={TIENDA.numero} eyebrow={TIENDA.eyebrow} />

        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: EASE_RACE }}
          className="display mt-7 max-w-3xl whitespace-pre-line text-[clamp(2.2rem,5.8vw,5rem)] text-bone"
        >
          {TIENDA.titulo}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: EASE_RACE, delay: 0.1 }}
          className="mt-5 max-w-xl text-base leading-relaxed text-ash"
        >
          {TIENDA.bajada}
        </motion.p>

        {/* Grid de productos */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-16 grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        >
          {SHOP_PRODUCTS.map((producto) => (
            <motion.article
              key={producto.id}
              variants={fadeUp}
              className="group relative flex flex-col overflow-hidden border border-white/8 bg-graphite transition-all duration-500 hover:border-barpran/40"
            >
              {/* Imagen con overlay */}
              <div className="relative h-56 w-full overflow-hidden bg-steel">
                <Image
                  src={producto.imagen}
                  alt={producto.nombre}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* Overlay degradado */}
                <div className="absolute inset-0 bg-gradient-to-t from-graphite via-graphite/60 to-transparent" />
                {/* Badge precio */}
                <div className="absolute right-4 top-4 skewed bg-barpran px-3 py-1">
                  <span className="font-mono text-[0.72rem] font-bold uppercase tracking-mega text-bone">
                    {producto.precio}
                  </span>
                </div>
              </div>

              {/* Contenido */}
              <div className="flex flex-1 flex-col gap-5 p-6">
                {/* Nombre */}
                <h3 className="display text-[clamp(1.1rem,2vw,1.4rem)] leading-tight text-bone">
                  {producto.nombre}
                </h3>

                {/* Descripcion */}
                <p className="text-sm leading-relaxed text-ash">
                  {producto.descripcion}
                </p>

                {/* Incluye */}
                <div>
                  <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-mega text-barpran">
                    Incluye
                  </p>
                  <ul className="space-y-1.5">
                    {producto.incluye.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 flex-shrink-0 rotate-45 bg-barpran" />
                        <span className="font-mono text-[0.72rem] uppercase tracking-mega text-bone/80">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Equivalencias */}
                <div>
                  <p className="mb-2 font-mono text-[0.65rem] uppercase tracking-mega text-ash">
                    Compatible con
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {producto.equivalencias.map((eq) => (
                      <span
                        key={eq}
                        className="skewed border border-white/10 bg-iron px-2.5 py-0.5 font-mono text-[0.62rem] uppercase tracking-mega text-bone/70"
                      >
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Botones al fondo del card */}
                <div className="mt-auto flex flex-col gap-3 border-t border-white/5 pt-5">
                  {/* Comprar ahora */}
                  <a
                    href={producto.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="skewed group/btn inline-flex items-center justify-center bg-barpran px-6 py-3.5 transition-colors duration-300 hover:bg-barpran-bright"
                  >
                    <span className="flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-mega text-bone">
                      Comprar ahora
                      <span className="transition-transform duration-300 group-hover/btn:translate-x-1">
                        →
                      </span>
                    </span>
                  </a>

                  {/* Consultar por WhatsApp */}
                  <a
                    href={buildWhatsAppUrl(producto.nombre, producto.equivalencias)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="skewed group/wa inline-flex items-center justify-center border border-white/15 px-6 py-3.5 transition-colors duration-300 hover:border-[#25D366]/60 hover:bg-[#25D366]/10"
                  >
                    <span className="flex items-center gap-2 font-mono text-[0.72rem] uppercase tracking-mega text-bone/80 group-hover/wa:text-bone">
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 fill-current text-[#25D366]"
                        aria-hidden="true"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Consultar por WhatsApp
                    </span>
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

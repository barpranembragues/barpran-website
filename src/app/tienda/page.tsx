import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SHOP_PRODUCTS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Tienda",
  description:
    "Comprá kits de embrague BARPRAN de forma segura. Elegí tu producto, verificá compatibilidad y continuá al checkout.",
};

const money = (value: string) => value;

export default function TiendaPage() {
  return (
    <div className="min-h-screen bg-carbon pt-24 text-bone md:pt-28">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="grid-tech absolute inset-0 opacity-30" />
        <div className="frame relative py-14 md:py-20">
          <p className="tech-label mb-4">Tienda oficial BARPRAN</p>
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="display max-w-5xl text-5xl text-bone sm:text-6xl md:text-8xl">
                Comprá seguro.<br />Comprá BARPRAN.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-ash md:text-lg">
                Kits de embrague seleccionados por aplicación. Antes de despachar validamos la compatibilidad de tu vehículo para reducir errores de compra.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-ash sm:grid-cols-3 lg:grid-cols-1">
              <div className="border border-white/10 bg-white/[0.025] p-4">
                <span className="font-mono text-xs uppercase tracking-mega text-barpran">01</span>
                <p className="mt-2 font-semibold text-bone">Pago seguro</p>
                <p className="mt-1">Checkout preparado para integrarse con Payway.</p>
              </div>
              <div className="border border-white/10 bg-white/[0.025] p-4">
                <span className="font-mono text-xs uppercase tracking-mega text-barpran">02</span>
                <p className="mt-2 font-semibold text-bone">Compatibilidad</p>
                <p className="mt-1">Confirmamos vehículo, año, motor y combustible.</p>
              </div>
              <div className="border border-white/10 bg-white/[0.025] p-4">
                <span className="font-mono text-xs uppercase tracking-mega text-barpran">03</span>
                <p className="mt-2 font-semibold text-bone">Soporte real</p>
                <p className="mt-1">Consultá por WhatsApp antes o después de comprar.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="frame py-12 md:py-16">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="tech-label">Productos disponibles</p>
            <h2 className="display mt-2 text-4xl md:text-5xl">Kits competición</h2>
          </div>
          <a
            href="https://wa.me/5491170586143?text=Hola%20BARPRAN%2C%20quiero%20verificar%20la%20compatibilidad%20de%20un%20kit"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs uppercase tracking-mega text-ash transition-colors hover:text-bone"
          >
            ¿No sabés cuál corresponde? Consultanos →
          </a>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {SHOP_PRODUCTS.map((product) => (
            <article
              key={product.id}
              className="group overflow-hidden border border-white/10 bg-white/[0.025] transition-colors hover:border-barpran/60"
            >
              <div className="relative aspect-square overflow-hidden bg-white">
                <Image
                  src={product.imagen}
                  alt={product.nombre}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-contain p-6 transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-6">
                <p className="font-mono text-[0.68rem] uppercase tracking-mega text-barpran">BARPRAN PERFORMANCE</p>
                <h3 className="mt-3 text-2xl font-bold text-bone">{product.nombre}</h3>
                <p className="mt-3 min-h-[4.5rem] text-sm leading-6 text-ash">{product.descripcion}</p>
                <div className="mt-5 border-t border-white/10 pt-5">
                  <p className="font-mono text-xs uppercase tracking-mega text-ash">Precio</p>
                  <p className="mt-1 text-3xl font-bold text-bone">{money(product.precio)}</p>
                </div>
                <ul className="mt-5 space-y-2 text-sm text-ash">
                  {product.incluye.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-barpran">+</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/tienda/${product.id}`}
                  className="mt-6 flex w-full items-center justify-center border border-barpran bg-barpran px-5 py-3 font-mono text-xs font-bold uppercase tracking-mega text-white transition-colors hover:bg-transparent"
                >
                  Ver producto
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SHOP_PRODUCTS } from "@/lib/content";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return SHOP_PRODUCTS.map((product) => ({ id: product.id }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = SHOP_PRODUCTS.find((item) => item.id === id);
  if (!product) return { title: "Producto no encontrado" };
  return {
    title: product.nombre,
    description: product.descripcion,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = SHOP_PRODUCTS.find((item) => item.id === id);
  if (!product) notFound();

  return (
    <div className="min-h-screen bg-carbon pt-24 text-bone md:pt-28">
      <section className="frame py-10 md:py-16">
        <Link
          href="/tienda"
          className="font-mono text-xs uppercase tracking-mega text-ash transition-colors hover:text-bone"
        >
          ← Volver a tienda
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-square overflow-hidden border border-white/10 bg-white">
            <Image
              src={product.imagen}
              alt={product.nombre}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-contain p-8"
            />
          </div>

          <div>
            <p className="tech-label text-barpran">Tienda oficial BARPRAN</p>
            <h1 className="display mt-3 text-5xl md:text-6xl">{product.nombre}</h1>
            <p className="mt-6 text-base leading-7 text-ash">{product.descripcion}</p>

            <div className="mt-8 border-y border-white/10 py-6">
              <p className="font-mono text-xs uppercase tracking-mega text-ash">Precio final</p>
              <p className="mt-2 text-4xl font-bold">{product.precio}</p>
              <p className="mt-2 text-sm text-ash">Tarjeta de crédito, débito o medios habilitados en Payway.</p>
            </div>

            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="font-mono text-xs uppercase tracking-mega text-bone">Incluye</p>
                <ul className="mt-3 space-y-2 text-sm text-ash">
                  {product.incluye.map((item) => (
                    <li key={item}>+ {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-mono text-xs uppercase tracking-mega text-bone">Aplicaciones de referencia</p>
                <ul className="mt-3 space-y-2 text-sm text-ash">
                  {product.equivalencias.map((item) => (
                    <li key={item}>+ {item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 border border-white/10 bg-white/[0.025] p-5">
              <p className="font-semibold">Verificación de compatibilidad</p>
              <p className="mt-2 text-sm leading-6 text-ash">
                Antes del despacho BARPRAN puede confirmar marca, modelo, año, motor y combustible. Esto ayuda a evitar compras incorrectas.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href={`/tienda/checkout?producto=${encodeURIComponent(product.id)}`}
                className="flex items-center justify-center bg-barpran px-5 py-4 font-mono text-xs font-bold uppercase tracking-mega text-white transition-opacity hover:opacity-90"
              >
                Continuar compra
              </Link>
              <a
                href={`https://wa.me/5491170586143?text=${encodeURIComponent(`Hola BARPRAN, quiero verificar la compatibilidad de ${product.nombre}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center border border-white/20 px-5 py-4 font-mono text-xs font-bold uppercase tracking-mega text-bone transition-colors hover:border-bone"
              >
                Consultar WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

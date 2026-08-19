import Link from "next/link";
import { SHOP_PRODUCTS } from "@/lib/content";

type SuccessPageProps = {
  searchParams: Promise<{ producto?: string }>;
};

export default async function CompraExitosaPage({ searchParams }: SuccessPageProps) {
  const { producto } = await searchParams;
  const selected = SHOP_PRODUCTS.find((item) => item.id === producto);

  return (
    <div className="min-h-screen bg-carbon pt-24 text-bone md:pt-28">
      <section className="frame py-16 md:py-24">
        <div className="mx-auto max-w-3xl border border-white/10 bg-white/[0.025] p-8 md:p-12">
          <p className="tech-label text-barpran">Payway · operación finalizada</p>
          <h1 className="display mt-4 text-5xl md:text-7xl">Compra recibida</h1>
          <p className="mt-6 text-base leading-7 text-ash">
            Payway finalizó el flujo de pago. BARPRAN verificará el estado definitivo de la operación antes de preparar o despachar el pedido.
          </p>

          {selected && (
            <div className="mt-8 border-y border-white/10 py-6">
              <p className="font-mono text-xs uppercase tracking-mega text-ash">Producto</p>
              <p className="mt-2 text-xl font-bold">{selected.nombre}</p>
              <p className="mt-1 text-ash">{selected.precio}</p>
            </div>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/tienda"
              className="flex items-center justify-center bg-barpran px-5 py-4 font-mono text-xs font-bold uppercase tracking-mega text-white"
            >
              Volver a tienda
            </Link>
            <a
              href="https://wa.me/5491170586143?text=Hola%20BARPRAN%2C%20acabo%20de%20realizar%20una%20compra%20en%20la%20tienda"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center border border-white/20 px-5 py-4 font-mono text-xs font-bold uppercase tracking-mega text-bone"
            >
              Contactar BARPRAN
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

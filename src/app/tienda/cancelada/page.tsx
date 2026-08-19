import Link from "next/link";

export default function CompraCanceladaPage() {
  return (
    <div className="min-h-screen bg-carbon pt-24 text-bone md:pt-28">
      <section className="frame py-16 md:py-24">
        <p className="tech-label text-barpran">Pago cancelado</p>
        <h1 className="display mt-4 text-5xl md:text-7xl">No se realizó ningún cobro.</h1>
        <p className="mt-6 max-w-2xl text-base leading-7 text-ash">
          Cancelaste el checkout de Payway. Podés volver a la tienda y comenzar nuevamente cuando quieras.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/tienda"
            className="bg-barpran px-5 py-4 font-mono text-xs font-bold uppercase tracking-mega text-white transition-opacity hover:opacity-90"
          >
            Volver a la tienda
          </Link>
          <Link
            href="/"
            className="border border-white/20 px-5 py-4 font-mono text-xs font-bold uppercase tracking-mega text-bone transition-colors hover:border-bone"
          >
            Ir al inicio
          </Link>
        </div>
      </section>
    </div>
  );
}

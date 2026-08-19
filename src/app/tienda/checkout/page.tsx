import Link from "next/link";
import { SHOP_PRODUCTS } from "@/lib/content";

type CheckoutPageProps = {
  searchParams: Promise<{
    producto?: string;
    error?: string;
    cancelado?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  datos: "Completá los datos obligatorios del vehículo y tu WhatsApp para continuar.",
  config: "La integración de Payway todavía no está disponible en este entorno.",
  payway: "Payway no pudo iniciar el checkout. Probá nuevamente en unos minutos.",
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { producto, error, cancelado } = await searchParams;
  const selected = SHOP_PRODUCTS.find((item) => item.id === producto) ?? SHOP_PRODUCTS[0];

  return (
    <div className="min-h-screen bg-carbon pt-24 text-bone md:pt-28">
      <section className="frame py-10 md:py-16">
        <Link
          href={`/tienda/${selected.id}`}
          className="font-mono text-xs uppercase tracking-mega text-ash hover:text-bone"
        >
          ← Volver al producto
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="tech-label">Checkout BARPRAN</p>
            <h1 className="display mt-3 text-5xl md:text-6xl">Verificá tu vehículo</h1>
            <p className="mt-5 max-w-2xl text-ash">
              Completá estos datos para asociar la compra a la aplicación correcta. Después vas a continuar al checkout seguro de Payway.
            </p>

            {(error || cancelado) && (
              <div className="mt-6 border border-barpran/40 bg-barpran/10 p-4 text-sm leading-6 text-bone">
                {cancelado
                  ? "El pago fue cancelado. No se realizó ningún cobro y podés intentarlo nuevamente."
                  : errorMessages[error ?? ""] ?? "No pudimos iniciar el pago. Intentá nuevamente."}
              </div>
            )}

            <form action="/api/payway/checkout" method="POST" className="mt-8 grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="producto" value={selected.id} />

              <label className="grid gap-2">
                <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">Marca</span>
                <input
                  required
                  type="text"
                  name="marca"
                  autoComplete="off"
                  className="h-12 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran"
                />
              </label>

              <label className="grid gap-2">
                <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">Modelo</span>
                <input
                  required
                  type="text"
                  name="modelo"
                  autoComplete="off"
                  className="h-12 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran"
                />
              </label>

              <label className="grid gap-2">
                <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">Año</span>
                <input
                  required
                  type="text"
                  inputMode="numeric"
                  name="anio"
                  placeholder="2015"
                  className="h-12 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran"
                />
              </label>

              <label className="grid gap-2">
                <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">Motor</span>
                <input
                  required
                  type="text"
                  name="motor"
                  placeholder="1.8T"
                  className="h-12 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran"
                />
              </label>

              <label className="grid gap-2">
                <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">Combustible</span>
                <input
                  required
                  type="text"
                  name="combustible"
                  placeholder="Nafta"
                  className="h-12 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran"
                />
              </label>

              <label className="grid gap-2">
                <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">Patente (opcional)</span>
                <input
                  type="text"
                  name="patente"
                  autoComplete="off"
                  className="h-12 border border-white/10 bg-white/[0.035] px-4 uppercase text-bone outline-none transition-colors focus:border-barpran"
                />
              </label>

              <label className="grid gap-2 sm:col-span-2">
                <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">WhatsApp</span>
                <input
                  required
                  type="tel"
                  name="whatsapp"
                  placeholder="11 7058 6143"
                  autoComplete="tel"
                  className="h-12 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran"
                />
              </label>

              <div className="sm:col-span-2 border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-ash">
                <strong className="text-bone">Pago seguro con Payway.</strong> Los datos de la tarjeta se ingresan en el checkout de Payway y no se almacenan en BARPRAN. Esta etapa está configurada en ambiente de prueba.
              </div>

              <button
                type="submit"
                className="sm:col-span-2 bg-barpran px-5 py-4 font-mono text-xs font-bold uppercase tracking-mega text-white transition-opacity hover:opacity-90"
              >
                Continuar a Payway · prueba
              </button>
            </form>
          </div>

          <aside className="h-fit border border-white/10 bg-white/[0.025] p-6 lg:sticky lg:top-28">
            <p className="tech-label">Resumen</p>
            <h2 className="mt-3 text-2xl font-bold">{selected.nombre}</h2>
            <p className="mt-3 text-sm leading-6 text-ash">{selected.descripcion}</p>
            <div className="mt-6 border-t border-white/10 pt-5">
              <div className="flex items-end justify-between gap-4">
                <span className="font-mono text-xs uppercase tracking-mega text-ash">Total</span>
                <strong className="text-3xl">{selected.precio}</strong>
              </div>
              <p className="mt-3 text-xs leading-5 text-ash">Primera prueba: 1 pago. Las cuotas se habilitan después de validar el flujo completo.</p>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

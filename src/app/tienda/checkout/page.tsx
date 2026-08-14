import Link from "next/link";
import { SHOP_PRODUCTS } from "@/lib/content";

type CheckoutPageProps = {
  searchParams: Promise<{ producto?: string }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const { producto } = await searchParams;
  const selected = SHOP_PRODUCTS.find((item) => item.id === producto) ?? SHOP_PRODUCTS[0];

  return (
    <div className="min-h-screen bg-carbon pt-24 text-bone md:pt-28">
      <section className="frame py-10 md:py-16">
        <Link href={`/tienda/${selected.id}`} className="font-mono text-xs uppercase tracking-mega text-ash hover:text-bone">
          ← Volver al producto
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="tech-label">Checkout BARPRAN</p>
            <h1 className="display mt-3 text-5xl md:text-6xl">Verificá tu vehículo</h1>
            <p className="mt-5 max-w-2xl text-ash">
              Esta etapa queda lista para conectar el pago real con Payway. Primero pedimos los datos mínimos para validar compatibilidad y asociarlos al pedido.
            </p>

            <form className="mt-8 grid gap-4 sm:grid-cols-2">
              {["Marca", "Modelo", "Año", "Motor", "Combustible", "Patente (opcional)"].map((label) => (
                <label key={label} className="grid gap-2">
                  <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">{label}</span>
                  <input
                    type="text"
                    name={label.toLowerCase().replaceAll(" ", "-")}
                    className="h-12 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran"
                  />
                </label>
              ))}

              <label className="grid gap-2 sm:col-span-2">
                <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">WhatsApp</span>
                <input
                  type="tel"
                  name="whatsapp"
                  placeholder="11 7058 6143"
                  className="h-12 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran"
                />
              </label>

              <div className="sm:col-span-2 border border-barpran/30 bg-barpran/5 p-4 text-sm leading-6 text-ash">
                <strong className="text-bone">Pago Payway pendiente de credenciales.</strong> Para habilitar cobros reales hacen falta las credenciales de producción de la cuenta Payway de BARPRAN y configurar las variables seguras del despliegue. No se almacenarán datos sensibles de tarjeta en BARPRAN.
              </div>

              <button
                type="button"
                disabled
                className="sm:col-span-2 cursor-not-allowed bg-white/10 px-5 py-4 font-mono text-xs font-bold uppercase tracking-mega text-ash"
              >
                Pagar con Payway · próximamente
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
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import PaymentForm from "./PaymentForm";
import MercadoLibreCatalog from "./MercadoLibreCatalog";
import { integrationConfigured } from "@/lib/mercadolibre";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tienda BARPRAN",
  description: "Encontrá embragues y repuestos BARPRAN. Consultá nuestros productos y precios y comprá en Mercado Libre, o aboná tu presupuesto con Payway.",
};

type TiendaPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  datos: "Completá el monto y la descripción del producto para continuar.",
  monto: "Revisá el monto ingresado.",
  cuotas: "La opción de cuotas seleccionada no está disponible en este momento.",
  config: "El pago online todavía no está disponible en este entorno.",
  payway: "Payway no pudo iniciar el pago. Probá nuevamente en unos minutos.",
};

export default async function TiendaPage({ searchParams }: TiendaPageProps) {
  const { error } = await searchParams;
  const catalogEnabled = integrationConfigured();

  return (
    <div className="min-h-screen bg-carbon pt-24 text-bone md:pt-28">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="grid-tech absolute inset-0 opacity-30" />
        <div className="frame relative py-14 md:py-20">
          <p className="tech-label mb-4">{catalogEnabled ? "Tienda BARPRAN" : "Portal de pagos BARPRAN"}</p>
          <h1 className="display max-w-5xl text-5xl text-bone sm:text-6xl md:text-7xl">
            {catalogEnabled ? <>Tu próximo embrague.<br />Encontralo acá.</> : <>Pagá tu compra.<br />Simple y seguro.</>}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-ash md:text-lg">
            {catalogEnabled ? "Explorá nuestros productos y comprá en Mercado Libre. Si ya tenés un presupuesto, también podés abonarlo con Payway." : "Ingresá el monto a abonar, describí el producto y elegí si querés pagar en 1 pago, 3 o 6 cuotas. La tarjeta y la confirmación se completan directamente en Payway."}
          </p>
          {catalogEnabled && <a href="#pago-online" className="mt-5 inline-block text-sm underline underline-offset-4">Ya tengo un presupuesto: pagar con Payway</a>}
        </div>
      </section>

      {catalogEnabled && <MercadoLibreCatalog />}

      <section id="pago-online" className="frame scroll-mt-28 py-12 md:py-20">
        <div className="mx-auto max-w-2xl border border-white/10 bg-white/[0.025] p-6 md:p-10">
          <p className="tech-label text-barpran">Pago online</p>
          <h2 className="display mt-3 text-4xl md:text-5xl">Completá los datos</h2>
          <p className="mt-4 text-sm leading-6 text-ash">
            Solo necesitás indicar monto, descripción y forma de pago para iniciar el checkout seguro.
          </p>

          {error && (
            <div className="mt-6 border border-barpran/40 bg-barpran/10 p-4 text-sm leading-6 text-bone">
              {errorMessages[error] ?? "No pudimos iniciar el pago. Revisá los datos e intentá nuevamente."}
            </div>
          )}

          <PaymentForm />

          <div className="mt-8 border-t border-white/10 pt-6 text-xs leading-5 text-ash">
            <strong className="text-bone">Pago seguro.</strong> BARPRAN no almacena datos de tarjetas. La información de pago se carga directamente en Payway.
          </div>
        </div>
      </section>
    </div>
  );
}

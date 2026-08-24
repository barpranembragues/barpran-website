import type { Metadata } from "next";
import PaymentForm from "./PaymentForm";

export const metadata: Metadata = {
  title: "Pagá tu compra",
  description: "Ingresá el monto y la descripción de tu compra para continuar de forma segura a Payway.",
};

type TiendaPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  datos: "Completá el monto y la descripción del producto para continuar.",
  monto: "Revisá el monto ingresado.",
  config: "El pago online todavía no está disponible en este entorno.",
  payway: "Payway no pudo iniciar el pago. Probá nuevamente en unos minutos.",
};

export default async function TiendaPage({ searchParams }: TiendaPageProps) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-carbon pt-24 text-bone md:pt-28">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="grid-tech absolute inset-0 opacity-30" />
        <div className="frame relative py-14 md:py-20">
          <p className="tech-label mb-4">Portal de pagos BARPRAN</p>
          <h1 className="display max-w-5xl text-5xl text-bone sm:text-6xl md:text-8xl">
            Pagá tu compra.<br />Simple y seguro.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-ash md:text-lg">
            Ingresá únicamente el monto a abonar y una breve descripción del producto. Las tarjetas, cuotas y demás opciones de pago se eligen directamente en Payway.
          </p>
        </div>
      </section>

      <section className="frame py-12 md:py-20">
        <div className="mx-auto max-w-2xl border border-white/10 bg-white/[0.025] p-6 md:p-10">
          <p className="tech-label text-barpran">Pago online</p>
          <h2 className="display mt-3 text-4xl md:text-5xl">Completá los datos</h2>
          <p className="mt-4 text-sm leading-6 text-ash">
            Solo necesitamos estos dos datos para iniciar el checkout seguro de Payway.
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

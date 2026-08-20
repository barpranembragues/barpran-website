import type { Metadata } from "next";
import PaymentForm from "./PaymentForm";

export const metadata: Metadata = {
  title: "Pagá tu compra",
  description:
    "Ingresá el importe previamente informado por BARPRAN y aboná de forma segura a través de Payway.",
};

type TiendaPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  datos: "Completá nombre, WhatsApp y concepto para continuar.",
  monto: "Revisá el monto ingresado. Debe coincidir con el importe informado por BARPRAN.",
  cuotas: "La opción de cuotas seleccionada no está habilitada en este momento.",
  confirmar: "Confirmá que el importe coincide con el informado por BARPRAN.",
  config: "El pago online todavía no está disponible en este entorno.",
  payway: "Payway no pudo iniciar el pago. Probá nuevamente en unos minutos.",
};

function positiveNumber(value?: string) {
  if (!value) return null;
  const number = Number(value.replace(",", "."));
  return Number.isFinite(number) && number > 1 ? number : null;
}

function getPlans() {
  const productionBuild = process.env.CONTEXT === "production";

  // En Deploy Preview usamos coeficientes de prueba para validar el flujo visual y técnico.
  // En producción, 3 y 6 cuotas sólo aparecen si BARPRAN cargó los coeficientes reales de su plan Payway.
  const coefficient3 = productionBuild
    ? positiveNumber(process.env.NEXT_PUBLIC_PAYWAY_COEF_3_PROD)
    : 1.0912;
  const coefficient6 = productionBuild
    ? positiveNumber(process.env.NEXT_PUBLIC_PAYWAY_COEF_6_PROD)
    : 1.1870;

  const plans: Array<{ installments: 1 | 3 | 6; coefficient: number; cft?: string }> = [
    { installments: 1, coefficient: 1 },
  ];

  if (coefficient3) {
    plans.push({
      installments: 3,
      coefficient: coefficient3,
      cft: productionBuild ? process.env.NEXT_PUBLIC_PAYWAY_CFT_3_PROD : "valor de prueba",
    });
  }

  if (coefficient6) {
    plans.push({
      installments: 6,
      coefficient: coefficient6,
      cft: productionBuild ? process.env.NEXT_PUBLIC_PAYWAY_CFT_6_PROD : "valor de prueba",
    });
  }

  return plans;
}

export default async function TiendaPage({ searchParams }: TiendaPageProps) {
  const { error } = await searchParams;
  const plans = getPlans();
  const financingAvailable = plans.length > 1;

  return (
    <div className="min-h-screen bg-carbon pt-24 text-bone md:pt-28">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="grid-tech absolute inset-0 opacity-30" />
        <div className="frame relative py-14 md:py-20">
          <p className="tech-label mb-4">Portal de pagos BARPRAN</p>
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="display max-w-5xl text-5xl text-bone sm:text-6xl md:text-8xl">
                Aboná tu compra.<br />De forma segura.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-ash md:text-lg">
                Ingresá el importe de contado que te informó BARPRAN. Si elegís pagar con tarjeta de crédito en cuotas, vas a ver el total financiado antes de continuar al checkout seguro de Payway.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-ash sm:grid-cols-3 lg:grid-cols-1">
              <div className="border border-white/10 bg-white/[0.025] p-4">
                <span className="font-mono text-xs uppercase tracking-mega text-barpran">01</span>
                <p className="mt-2 font-semibold text-bone">Ingresá el monto</p>
                <p className="mt-1">Usá exactamente el precio de contado indicado por BARPRAN.</p>
              </div>
              <div className="border border-white/10 bg-white/[0.025] p-4">
                <span className="font-mono text-xs uppercase tracking-mega text-barpran">02</span>
                <p className="mt-2 font-semibold text-bone">Elegí cómo pagar</p>
                <p className="mt-1">1 pago o, cuando estén habilitadas, opciones financiadas en cuotas.</p>
              </div>
              <div className="border border-white/10 bg-white/[0.025] p-4">
                <span className="font-mono text-xs uppercase tracking-mega text-barpran">03</span>
                <p className="mt-2 font-semibold text-bone">Pagá con Payway</p>
                <p className="mt-1">Los datos de tu tarjeta se ingresan directamente en Payway.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="frame py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          <div className="border border-white/10 bg-white/[0.025] p-6 md:p-8">
            <p className="tech-label text-barpran">Datos del pago</p>
            <h2 className="display mt-3 text-4xl md:text-5xl">Completá tu pago</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-ash">
              Antes de continuar, verificá que el precio de contado coincida exactamente con el presupuesto o monto que te informó BARPRAN.
            </p>

            {error && (
              <div className="mt-6 border border-barpran/40 bg-barpran/10 p-4 text-sm leading-6 text-bone">
                {errorMessages[error] ?? "No pudimos iniciar el pago. Revisá los datos e intentá nuevamente."}
              </div>
            )}

            <PaymentForm plans={plans} />
          </div>

          <aside className="h-fit border border-white/10 bg-white/[0.025] p-6 lg:sticky lg:top-28 md:p-8">
            <p className="tech-label">Antes de pagar</p>
            <h3 className="mt-3 text-2xl font-bold">Verificá el importe</h3>
            <p className="mt-4 text-sm leading-6 text-ash">
              El monto que ingresás es el precio de contado informado por BARPRAN. Si elegís cuotas, la página calcula y muestra el importe financiado antes de enviarte a Payway.
            </p>

            <div className="mt-6 space-y-4 border-y border-white/10 py-6 text-sm text-ash">
              <div className="flex gap-3">
                <span className="font-mono text-barpran">01</span>
                <span>1 pago mantiene el importe de contado.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-mono text-barpran">02</span>
                <span>{financingAvailable ? "Las cuotas incluyen el costo financiero en el total mostrado." : "Las cuotas se habilitarán cuando estén configuradas para el comercio."}</span>
              </div>
              <div className="flex gap-3">
                <span className="font-mono text-barpran">03</span>
                <span>Conservá el comprobante emitido por Payway.</span>
              </div>
            </div>

            <div className="mt-6 border border-white/10 p-4 text-sm leading-6 text-ash">
              <strong className="text-bone">Pago seguro.</strong> BARPRAN no almacena el número de tu tarjeta ni el código de seguridad. Esos datos se cargan en el entorno de Payway.
            </div>

            <a
              href="https://wa.me/5491170586143?text=Hola%20BARPRAN%2C%20necesito%20confirmar%20el%20monto%20antes%20de%20pagar"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex w-full items-center justify-center border border-white/20 px-5 py-4 font-mono text-xs font-bold uppercase tracking-mega text-bone transition-colors hover:border-bone"
            >
              Confirmar monto por WhatsApp
            </a>
          </aside>
        </div>
      </section>
    </div>
  );
}

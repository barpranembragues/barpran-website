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
  cuotas: "La opción de cuotas seleccionada no está disponible para este medio de pago.",
  confirmar: "Confirmá que el importe coincide con el informado por BARPRAN.",
  config: "El pago online todavía no está disponible en este entorno.",
  payway: "Payway no pudo iniciar el pago. Probá nuevamente en unos minutos.",
};

function positiveNumber(value?: string) {
  if (!value) return null;
  const number = Number(value.replace(",", "."));
  return Number.isFinite(number) && number > 1 ? number : null;
}

const MIPYME_3_COEF = 1.0912;
const MIPYME_6_COEF = 1.1870;

function getPlans() {
  // Los valores oficiales vigentes funcionan como base. Si Payway actualiza las tasas,
  // pueden reemplazarse desde Netlify sin modificar el código.
  const coefficient3 = positiveNumber(process.env.NEXT_PUBLIC_PAYWAY_COEF_3_PROD) ?? MIPYME_3_COEF;
  const coefficient6 = positiveNumber(process.env.NEXT_PUBLIC_PAYWAY_COEF_6_PROD) ?? MIPYME_6_COEF;

  return [
    {
      installments: 1 as const,
      coefficient: 1,
      label: "1 pago",
      detail: "Débito o crédito en 1 pago",
    },
    {
      installments: 3 as const,
      coefficient: coefficient3,
      label: "3 cuotas",
      detail: "Cuotas MiPyME · Visa y Mastercard",
      financing: "Tasa Payway 6,91% + IVA · coeficiente 1,0912",
    },
    {
      installments: 6 as const,
      coefficient: coefficient6,
      label: "6 cuotas",
      detail: "Cuotas MiPyME · Visa y Mastercard",
      financing: "Tasa Payway 13,52% + IVA · coeficiente 1,1870",
    },
  ];
}

export default async function TiendaPage({ searchParams }: TiendaPageProps) {
  const { error } = await searchParams;
  const plans = getPlans();

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
                Ingresá el precio de contado que te informó BARPRAN. Podés pagar en 1 pago o financiar con Cuotas MiPyME. Antes de continuar vas a ver exactamente el total y el valor de cada cuota.
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
                <p className="mt-1">1 pago, 3 cuotas o 6 cuotas. El costo financiero se suma sólo si elegís financiar.</p>
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
              Verificá primero el precio de contado. Después elegí la forma de pago que prefieras; la financiación queda a cargo del comprador y se informa antes de pasar a Payway.
            </p>

            {error && (
              <div className="mt-6 border border-barpran/40 bg-barpran/10 p-4 text-sm leading-6 text-bone">
                {errorMessages[error] ?? "No pudimos iniciar el pago. Revisá los datos e intentá nuevamente."}
              </div>
            )}

            <PaymentForm plans={plans} />
          </div>

          <aside className="h-fit border border-white/10 bg-white/[0.025] p-6 lg:sticky lg:top-28 md:p-8">
            <p className="tech-label">Formas de pago</p>
            <h3 className="mt-3 text-2xl font-bold">Elegí la que más te convenga</h3>
            <p className="mt-4 text-sm leading-6 text-ash">
              El precio informado por BARPRAN es el precio de contado. Si elegís cuotas, el costo financiero se agrega al total y lo ves antes de confirmar.
            </p>

            <div className="mt-6 space-y-4 border-y border-white/10 py-6 text-sm text-ash">
              <div className="flex gap-3">
                <span className="font-mono text-barpran">01</span>
                <span><strong className="text-bone">1 pago:</strong> mantiene el precio de contado. Payway mostrará los medios habilitados para tu tarjeta.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-mono text-barpran">03</span>
                <span><strong className="text-bone">3 cuotas MiPyME:</strong> disponibles con Visa y Mastercard. El total financiado usa el coeficiente vigente informado por Payway.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-mono text-barpran">06</span>
                <span><strong className="text-bone">6 cuotas MiPyME:</strong> disponibles con Visa y Mastercard. El costo financiero queda incluido en el importe final.</span>
              </div>
            </div>

            <div className="mt-6 border border-white/10 p-4 text-sm leading-6 text-ash">
              <strong className="text-bone">Pago seguro.</strong> BARPRAN no almacena el número de tu tarjeta ni el código de seguridad. Esos datos se cargan directamente en Payway.
            </div>

            <div className="mt-4 border border-white/10 p-4 text-xs leading-5 text-ash">
              Las tasas y coeficientes de financiación son determinados por Payway y pueden actualizarse. La opción de Cuotas MiPyME está sujeta a tarjetas y condiciones habilitadas por Payway.
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

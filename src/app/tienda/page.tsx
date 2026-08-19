import type { Metadata } from "next";

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
  confirmar: "Confirmá que el importe coincide con el informado por BARPRAN.",
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
          <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <h1 className="display max-w-5xl text-5xl text-bone sm:text-6xl md:text-8xl">
                Aboná tu compra.<br />De forma segura.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-ash md:text-lg">
                Ingresá el importe que te informó previamente BARPRAN y el concepto correspondiente. El pago se procesa en el checkout seguro de Payway.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-ash sm:grid-cols-3 lg:grid-cols-1">
              <div className="border border-white/10 bg-white/[0.025] p-4">
                <span className="font-mono text-xs uppercase tracking-mega text-barpran">01</span>
                <p className="mt-2 font-semibold text-bone">Ingresá el monto</p>
                <p className="mt-1">Usá exactamente el importe que te indicó BARPRAN.</p>
              </div>
              <div className="border border-white/10 bg-white/[0.025] p-4">
                <span className="font-mono text-xs uppercase tracking-mega text-barpran">02</span>
                <p className="mt-2 font-semibold text-bone">Indicá el concepto</p>
                <p className="mt-1">Ejemplo: Kit de embrague Vento 1.8T o reparación de embrague.</p>
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
              Antes de continuar, verificá que el importe coincida exactamente con el presupuesto o monto que te informó BARPRAN.
            </p>

            {error && (
              <div className="mt-6 border border-barpran/40 bg-barpran/10 p-4 text-sm leading-6 text-bone">
                {errorMessages[error] ?? "No pudimos iniciar el pago. Revisá los datos e intentá nuevamente."}
              </div>
            )}

            <form action="/api/payway/checkout" method="POST" className="mt-8 grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 sm:col-span-2">
                <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">Monto a abonar</span>
                <div className="flex h-16 items-center border border-white/10 bg-white/[0.035] focus-within:border-barpran">
                  <span className="pl-4 text-2xl font-bold text-ash">$</span>
                  <input
                    required
                    type="text"
                    inputMode="decimal"
                    name="monto"
                    maxLength={18}
                    placeholder="802.800"
                    autoComplete="off"
                    className="h-full min-w-0 flex-1 bg-transparent px-3 text-2xl font-bold text-bone outline-none"
                  />
                </div>
                <span className="text-xs leading-5 text-ash">Podés escribir, por ejemplo, 802800 o 802.800.</span>
              </label>

              <label className="grid gap-2 sm:col-span-2">
                <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">Concepto / producto</span>
                <input
                  required
                  type="text"
                  name="concepto"
                  maxLength={120}
                  placeholder="Ej.: Kit de embrague Volkswagen Vento 1.8T"
                  autoComplete="off"
                  className="h-12 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran"
                />
              </label>

              <label className="grid gap-2">
                <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">Nombre y apellido</span>
                <input
                  required
                  type="text"
                  name="nombre"
                  maxLength={100}
                  autoComplete="name"
                  className="h-12 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran"
                />
              </label>

              <label className="grid gap-2">
                <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">WhatsApp</span>
                <input
                  required
                  type="tel"
                  name="whatsapp"
                  maxLength={30}
                  placeholder="11 7058 6143"
                  autoComplete="tel"
                  className="h-12 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran"
                />
              </label>

              <label className="grid gap-2">
                <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">Vehículo (opcional)</span>
                <input
                  type="text"
                  name="vehiculo"
                  maxLength={100}
                  placeholder="Ej.: Vento 2015 1.8T"
                  autoComplete="off"
                  className="h-12 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran"
                />
              </label>

              <label className="grid gap-2">
                <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">N° presupuesto / referencia (opcional)</span>
                <input
                  type="text"
                  name="referencia"
                  maxLength={60}
                  autoComplete="off"
                  className="h-12 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran"
                />
              </label>

              <label className="sm:col-span-2 flex cursor-pointer gap-3 border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-ash">
                <input required type="checkbox" name="confirmado" value="si" className="mt-1 h-4 w-4 accent-red-600" />
                <span>
                  Confirmo que el monto ingresado coincide con el importe que me informó previamente <strong className="text-bone">BARPRAN</strong>.
                </span>
              </label>

              <button
                type="submit"
                className="sm:col-span-2 bg-barpran px-5 py-4 font-mono text-xs font-bold uppercase tracking-mega text-white transition-opacity hover:opacity-90"
              >
                Continuar a pago seguro →
              </button>
            </form>
          </div>

          <aside className="h-fit border border-white/10 bg-white/[0.025] p-6 lg:sticky lg:top-28 md:p-8">
            <p className="tech-label">Antes de pagar</p>
            <h3 className="mt-3 text-2xl font-bold">Verificá el importe</h3>
            <p className="mt-4 text-sm leading-6 text-ash">
              Esta página no calcula precios ni presupuestos. El monto debe haber sido informado previamente por un asesor de BARPRAN.
            </p>

            <div className="mt-6 space-y-4 border-y border-white/10 py-6 text-sm text-ash">
              <div className="flex gap-3">
                <span className="font-mono text-barpran">01</span>
                <span>No ingreses un monto distinto al acordado.</span>
              </div>
              <div className="flex gap-3">
                <span className="font-mono text-barpran">02</span>
                <span>Describí claramente qué estás abonando.</span>
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

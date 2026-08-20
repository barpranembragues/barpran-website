import Link from "next/link";

type SuccessPageProps = {
  searchParams: Promise<{
    monto?: string;
    montoContado?: string;
    cuotas?: string;
    concepto?: string;
    referencia?: string;
  }>;
};

function formatAmount(value?: string) {
  if (!value) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default async function CompraExitosaPage({ searchParams }: SuccessPageProps) {
  const { monto, montoContado, cuotas, concepto, referencia } = await searchParams;
  const formattedAmount = formatAmount(monto);
  const formattedCashAmount = formatAmount(montoContado);
  const installments = Number(cuotas || "1");
  const installmentAmount = formattedAmount && Number.isFinite(installments) && installments > 1
    ? formatAmount(String(Number(monto) / installments))
    : null;

  return (
    <div className="min-h-screen bg-carbon pt-24 text-bone md:pt-28">
      <section className="frame py-16 md:py-24">
        <div className="mx-auto max-w-3xl border border-white/10 bg-white/[0.025] p-8 md:p-12">
          <p className="tech-label text-barpran">Payway · operación finalizada</p>
          <h1 className="display mt-4 text-5xl md:text-7xl">Pago recibido</h1>
          <p className="mt-6 text-base leading-7 text-ash">
            Payway finalizó el flujo de pago. BARPRAN verificará el estado definitivo de la operación antes de entregar, preparar o despachar el pedido.
          </p>

          {(concepto || formattedAmount || referencia) && (
            <div className="mt-8 space-y-5 border-y border-white/10 py-6">
              {concepto && (
                <div>
                  <p className="font-mono text-xs uppercase tracking-mega text-ash">Concepto</p>
                  <p className="mt-2 text-xl font-bold">{concepto}</p>
                </div>
              )}

              {formattedCashAmount && installments > 1 && (
                <div>
                  <p className="font-mono text-xs uppercase tracking-mega text-ash">Precio de contado</p>
                  <p className="mt-2 text-lg font-bold">{formattedCashAmount}</p>
                </div>
              )}

              {formattedAmount && (
                <div>
                  <p className="font-mono text-xs uppercase tracking-mega text-ash">
                    {installments > 1 ? "Total financiado" : "Importe abonado"}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{formattedAmount}</p>
                  {installments > 1 && installmentAmount && (
                    <p className="mt-2 text-sm text-ash">{installments} cuotas de {installmentAmount}</p>
                  )}
                </div>
              )}

              {referencia && (
                <div>
                  <p className="font-mono text-xs uppercase tracking-mega text-ash">Referencia</p>
                  <p className="mt-2 text-bone">{referencia}</p>
                </div>
              )}
            </div>
          )}

          <p className="mt-6 text-xs leading-5 text-ash">
            Esta pantalla confirma que Payway finalizó el flujo. La acreditación y el estado definitivo de la operación se validan por separado antes de entregar mercadería o prestar el servicio.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              href="/tienda"
              className="flex items-center justify-center bg-barpran px-5 py-4 font-mono text-xs font-bold uppercase tracking-mega text-white"
            >
              Realizar otro pago
            </Link>
            <a
              href="https://wa.me/5491170586143?text=Hola%20BARPRAN%2C%20acabo%20de%20realizar%20un%20pago%20por%20Payway"
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

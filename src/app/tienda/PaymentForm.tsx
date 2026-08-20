"use client";

import { useMemo, useState } from "react";

type Plan = {
  installments: 1 | 3 | 6;
  coefficient: number;
  label: string;
  detail: string;
  financing?: string;
};

type PaymentFormProps = {
  plans: Plan[];
};

function parseArgentineAmount(value: string) {
  const compact = value.replace(/\s/g, "").replace(/\$/g, "").replace(/[^0-9.,]/g, "");
  if (!compact) return Number.NaN;

  if (compact.includes(",")) {
    const parts = compact.split(",");
    if (parts.length !== 2 || parts[1].length > 2) return Number.NaN;
    return Number(`${parts[0].replace(/\./g, "")}.${parts[1] || "0"}`);
  }

  const dotParts = compact.split(".");
  if (dotParts.length === 2 && dotParts[1].length > 0 && dotParts[1].length <= 2) {
    return Number(`${dotParts[0]}.${dotParts[1]}`);
  }

  return Number(compact.replace(/\./g, ""));
}

function money(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export default function PaymentForm({ plans }: PaymentFormProps) {
  const [amount, setAmount] = useState("");
  const [installments, setInstallments] = useState<1 | 3 | 6>(1);

  const cashAmount = useMemo(() => parseArgentineAmount(amount), [amount]);
  const selectedPlan = plans.find((plan) => plan.installments === installments) ?? plans[0];
  const validAmount = Number.isFinite(cashAmount) && cashAmount > 0;
  const financedTotal = validAmount ? cashAmount * selectedPlan.coefficient : 0;
  const installmentValue = financedTotal / selectedPlan.installments;

  return (
    <form action="/api/payway/checkout" method="POST" className="mt-8 grid gap-5 sm:grid-cols-2">
      <label className="grid gap-2 sm:col-span-2">
        <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">Importe de contado informado por BARPRAN</span>
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
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-2xl font-bold text-bone outline-none"
          />
        </div>
        <span className="text-xs leading-5 text-ash">Ingresá el precio de contado que te informó BARPRAN. Si elegís cuotas, el total financiado se calcula automáticamente.</span>
      </label>

      <fieldset className="sm:col-span-2">
        <legend className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">Cómo querés pagar</legend>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {plans.map((plan) => {
            const active = installments === plan.installments;
            const total = validAmount ? cashAmount * plan.coefficient : 0;
            const perInstallment = total / plan.installments;

            return (
              <label
                key={plan.installments}
                className={`cursor-pointer border p-4 transition-colors ${
                  active ? "border-barpran bg-barpran/10" : "border-white/10 bg-white/[0.025] hover:border-white/25"
                }`}
              >
                <input
                  type="radio"
                  name="cuotas"
                  value={plan.installments}
                  checked={active}
                  onChange={() => setInstallments(plan.installments)}
                  className="sr-only"
                />
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-bone">{plan.label}</p>
                    <p className="mt-1 text-xs leading-5 text-ash">{plan.detail}</p>
                    {validAmount ? (
                      <>
                        <p className="mt-3 text-xl font-bold text-bone">
                          {plan.installments === 1 ? money(total) : `${plan.installments} × ${money(perInstallment)}`}
                        </p>
                        {plan.installments > 1 && (
                          <p className="mt-1 text-xs leading-5 text-ash">Total financiado: {money(total)}</p>
                        )}
                      </>
                    ) : (
                      <p className="mt-3 text-sm text-ash">Ingresá el monto para calcular.</p>
                    )}
                  </div>
                  <span className={`mt-1 h-3 w-3 rounded-full border ${active ? "border-barpran bg-barpran" : "border-white/30"}`} />
                </div>
                {plan.installments > 1 && plan.financing && (
                  <p className="mt-3 border-t border-white/10 pt-3 font-mono text-[0.62rem] uppercase leading-5 tracking-wider text-ash">
                    {plan.financing}
                  </p>
                )}
              </label>
            );
          })}
        </div>

        {selectedPlan.installments > 1 && validAmount && (
          <div className="mt-4 border border-barpran/30 bg-barpran/5 p-4 text-sm leading-6 text-ash">
            <strong className="text-bone">Financiación seleccionada:</strong> precio de contado {money(cashAmount)} → total financiado {money(financedTotal)} → {selectedPlan.installments} cuotas de {money(installmentValue)}. El costo financiero está incluido en el total y es abonado por el comprador.
          </div>
        )}
      </fieldset>

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
        <input required type="text" name="nombre" maxLength={100} autoComplete="name" className="h-12 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran" />
      </label>

      <label className="grid gap-2">
        <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">WhatsApp</span>
        <input required type="tel" name="whatsapp" maxLength={30} placeholder="11 7058 6143" autoComplete="tel" className="h-12 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran" />
      </label>

      <label className="grid gap-2">
        <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">Vehículo (opcional)</span>
        <input type="text" name="vehiculo" maxLength={100} placeholder="Ej.: Vento 2015 1.8T" autoComplete="off" className="h-12 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran" />
      </label>

      <label className="grid gap-2">
        <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">N° presupuesto / referencia (opcional)</span>
        <input type="text" name="referencia" maxLength={60} autoComplete="off" className="h-12 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran" />
      </label>

      <label className="sm:col-span-2 flex cursor-pointer gap-3 border border-white/10 bg-white/[0.025] p-4 text-sm leading-6 text-ash">
        <input required type="checkbox" name="confirmado" value="si" className="mt-1 h-4 w-4 accent-red-600" />
        <span>
          Confirmo que el <strong className="text-bone">precio de contado</strong> ingresado coincide con el importe informado por <strong className="text-bone">BARPRAN</strong> y que, si elijo cuotas, acepto el total financiado y el costo financiero informados arriba.
        </span>
      </label>

      <button type="submit" className="sm:col-span-2 bg-barpran px-5 py-4 font-mono text-xs font-bold uppercase tracking-mega text-white transition-opacity hover:opacity-90">
        Continuar a pago seguro →
      </button>
    </form>
  );
}

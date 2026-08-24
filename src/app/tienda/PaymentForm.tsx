"use client";

export default function PaymentForm() {
  return (
    <form action="/api/payway/checkout" method="POST" className="mt-8 grid gap-6">
      <label className="grid gap-2">
        <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">Monto a abonar</span>
        <div className="flex h-16 items-center border border-white/10 bg-white/[0.035] transition-colors focus-within:border-barpran">
          <span className="pl-4 text-2xl font-bold text-ash">$</span>
          <input
            required
            type="text"
            inputMode="decimal"
            name="monto"
            maxLength={18}
            placeholder="Ej.: 802.800"
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent px-3 text-2xl font-bold text-bone outline-none"
          />
        </div>
      </label>

      <label className="grid gap-2">
        <span className="font-mono text-[0.68rem] uppercase tracking-mega text-ash">Descripción del producto</span>
        <input
          required
          type="text"
          name="concepto"
          maxLength={120}
          placeholder="Ej.: Kit de embrague Volkswagen Vento 1.8T"
          autoComplete="off"
          className="h-14 border border-white/10 bg-white/[0.035] px-4 text-bone outline-none transition-colors focus:border-barpran"
        />
      </label>

      <p className="text-xs leading-5 text-ash">
        En el siguiente paso Payway te mostrará los medios de pago, tarjetas y opciones de cuotas disponibles.
      </p>

      <button
        type="submit"
        className="bg-barpran px-5 py-5 font-mono text-xs font-bold uppercase tracking-mega text-white transition-opacity hover:opacity-90"
      >
        Continuar a Pago Seguro →
      </button>
    </form>
  );
}

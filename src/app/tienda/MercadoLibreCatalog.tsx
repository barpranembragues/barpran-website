"use client";

import { useEffect, useMemo, useState } from "react";
import { MERCADO_LIBRE_STORE, type CatalogResponse } from "@/lib/mercadolibre-types";

const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2, minimumFractionDigits: 0 });
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function MercadoLibreCatalog() {
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState("title");
  const [loading, setLoading] = useState(true);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let disposed = false;
    let pending = false;
    let controller: AbortController | null = null;
    const refresh = async () => {
      if (pending || document.visibilityState === "hidden") return;
      pending = true;
      controller = new AbortController();
      try {
        const res = await fetch("/api/mercadolibre/catalogo", { cache: "no-store", signal: controller.signal });
        if (!res.ok) throw new Error("unavailable");
        const next = await res.json() as CatalogResponse;
        if (!Array.isArray(next.items) || next.status !== "ready") throw new Error("unavailable");
        if (!disposed) setCatalog(next);
      } catch {
        // Hide outdated prices and paused listings whenever live verification fails.
        if (!disposed) setCatalog({ items: [], updatedAt: null, status: "unavailable" });
      } finally {
        pending = false;
        if (!disposed) setLoading(false);
      }
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => { disposed = true; controller?.abort(); window.clearInterval(interval); document.removeEventListener("visibilitychange", refresh); };
  }, [retry]);

  const items = useMemo(() => {
    const words = normalize(query.trim()).split(/\s+/).filter(Boolean);
    return (catalog?.items || []).filter((item) => words.every((word) => normalize(`${item.title} ${item.sku || ""}`).includes(word)))
      .sort((a, b) => order === "low" ? a.price - b.price : order === "high" ? b.price - a.price : a.title.localeCompare(b.title, "es"));
  }, [catalog, query, order]);

  return (
    <section id="catalogo" aria-label="Catálogo de productos" className="frame py-10 md:py-14">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="display text-3xl sm:text-4xl">Nuestros productos</h2>
          <p className="mt-2 text-sm leading-6 text-ash">La compra, el pago y el envío se completan en Mercado Libre.</p>
        </div>
        <a href={MERCADO_LIBRE_STORE} target="_blank" rel="noopener noreferrer" className="text-sm text-bone underline underline-offset-4">Ver tienda en Mercado Libre</a>
      </div>

      {loading ? (
        <div role="status" className="py-12">
          <p className="mb-6 text-base text-ash">Cargando productos…</p>
          <div aria-hidden="true" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-96 animate-pulse border border-white/10 bg-graphite" />)}
          </div>
        </div>
      ) : catalog?.status !== "ready" ? (
        <div role="status" className="my-8 border border-white/10 bg-graphite p-6 sm:p-10">
          <h3 className="text-xl font-bold">Consultá los productos en Mercado Libre</h3>
          <p className="mt-3 max-w-xl text-base leading-7 text-ash">No pudimos cargar el catálogo en este momento. Podés ver las publicaciones y sus precios directamente en nuestra tienda de Mercado Libre.</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <a href={MERCADO_LIBRE_STORE} target="_blank" rel="noopener noreferrer" className="bg-barpran px-5 py-3 font-bold text-white">Ir a Mercado Libre</a>
            <button onClick={() => { setLoading(true); setRetry((n) => n + 1); }} className="border border-white/20 px-5 py-3 font-bold">Reintentar</button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-7 grid gap-4 sm:grid-cols-[1fr_230px]">
            <label className="grid gap-2 text-sm text-ash">Buscar producto, vehículo o código
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej.: Peugeot 206, Vento, KE701290" className="h-12 min-w-0 border border-white/20 bg-graphite px-4 text-base text-bone outline-none focus:border-barpran" />
            </label>
            <label className="grid gap-2 text-sm text-ash">Ordenar por
              <select value={order} onChange={(event) => setOrder(event.target.value)} className="h-12 border border-white/20 bg-graphite px-4 text-base text-bone outline-none focus:border-barpran">
                <option value="title">Nombre</option><option value="low">Menor precio</option><option value="high">Mayor precio</option>
              </select>
            </label>
          </div>
          <p role="status" className="my-5 text-sm text-ash">{items.length} {items.length === 1 ? "publicación" : "publicaciones"}</p>
          {items.length === 0 ? <p className="border border-white/10 p-8 text-base text-ash">{query ? "No encontramos productos para esa búsqueda." : "No hay publicaciones activas en este momento."}</p> : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <article key={item.id} className="flex flex-col overflow-hidden border border-white/10 bg-graphite transition-colors hover:border-white/30">
                  <a href={item.permalink} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${item.title} en Mercado Libre`} className="flex aspect-square items-center justify-center bg-white p-5">
                    {item.image ? <img src={item.image} alt={item.title} loading="lazy" width={400} height={400} className="h-full w-full object-contain" referrerPolicy="no-referrer" /> : <span className="text-sm text-neutral-600">Imagen no disponible</span>}
                  </a>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-sm text-ash">{item.condition === "new" ? "Nuevo" : item.condition === "used" ? "Usado" : "Consultar condición"}{item.sku ? ` · ${item.sku}` : ""}</p>
                    <h3 className="mt-3 text-base font-semibold leading-6">{item.title}</h3>
                    <div className="mt-auto pt-5">
                      {item.originalPrice && <p className="text-sm text-ash line-through">{money.format(item.originalPrice)}</p>}
                      <p className="text-2xl font-bold tracking-tight">{money.format(item.price)}</p>
                      <p className="mt-2 min-h-6 text-sm text-ash">{!item.available ? "Consultar disponibilidad" : item.freeShipping ? "Envío gratis en Mercado Libre" : "Envío a calcular en Mercado Libre"}</p>
                      <a href={item.permalink} target="_blank" rel="noopener noreferrer" className="mt-5 flex min-h-12 items-center justify-center bg-barpran px-4 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-barpran-deep">{item.available ? "Comprar en Mercado Libre" : "Ver publicación"}</a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          <p className="mt-6 text-sm leading-6 text-ash">{catalog.updatedAt && `Actualizado: ${new Date(catalog.updatedAt).toLocaleString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" })}. `}El precio y las condiciones finales se confirman en Mercado Libre.</p>
        </>
      )}
    </section>
  );
}

"use client";
import { useState, type FormEvent } from "react";
export default function Consultas() {
  const [result,setResult] = useState("");
  const [busy,setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setResult("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/mercadolibre/administracion/consulta", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({resource:form.get("resource"),id:form.get("id") || undefined,params:JSON.parse(String(form.get("params") || "{}"))})});
      setResult(JSON.stringify(await response.json(),null,2));
    } catch { setResult("No se pudo consultar. Revisá los parámetros y la sesión."); }
    finally { setBusy(false); }
  }
  return <section className="mt-10 border border-white/20 p-6"><h2 className="text-xl font-bold">Consultas privadas de Mercado Libre</h2>
    <p className="mt-3 text-sm text-ash">Lectura de publicaciones, costos, promociones y publicidad. Estas consultas no modifican la cuenta.</p>
    <form onSubmit={submit} className="mt-5 grid gap-4">
      <label className="grid gap-2">Consulta<select name="resource" className="bg-carbon border border-white/20 p-3">{[["listings","Todas las publicaciones"],["item","Detalle de publicación"],["description","Descripción"],["prices","Precios y descuentos"],["compatibilities","Compatibilidades"],["item_promotions","Promociones de publicación"],["shipping","Costo de envío"],["fees","Comisiones de venta"],["promotions","Promociones disponibles"],["promotion_items","Productos de promoción"],["advertisers","Anunciantes"],["campaigns","Campañas del anunciante"],["ads","Anuncios"],["ad_groups","Grupos de anuncios"],["campaign","Detalle de campaña"],["campaign_metrics","Métricas de campaña"]].map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
      <label className="grid gap-2">Identificador<input name="id" maxLength={80} className="bg-carbon border border-white/20 p-3" /></label>
      <label className="grid gap-2">Parámetros de consulta<textarea name="params" defaultValue="{}" maxLength={4000} rows={3} className="bg-carbon border border-white/20 p-3 font-mono" /></label>
      <button disabled={busy} className="bg-barpran p-4 font-bold disabled:opacity-50">{busy ? "Consultando…" : "Consultar Mercado Libre"}</button>
    </form><pre aria-label="Resultado de consulta" className="mt-6 max-h-[600px] overflow-auto whitespace-pre-wrap break-words text-xs">{result}</pre>
  </section>;
}

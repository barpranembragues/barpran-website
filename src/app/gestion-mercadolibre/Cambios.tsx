"use client";
import {useState,type FormEvent} from "react";
export default function Cambios() {
 const [result,setResult]=useState("");const [busy,setBusy]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();setBusy(true);setResult("");const form=new FormData(event.currentTarget);
  try {const response=await fetch("/api/mercadolibre/administracion/cambios",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(JSON.parse(String(form.get("changes"))))});setResult(JSON.stringify(await response.json(),null,2));}
  catch {setResult("No se pudo aplicar. Revisá el lote y la sesión.");}finally{setBusy(false);}
 }
 return <section className="mt-10 border border-white/20 p-6"><h2 className="text-xl font-bold">Cambios de Mercado Libre</h2><p className="mt-3 text-sm text-ash">Aplicar precios, cantidades, descripciones, promociones elegibles y ajustes publicitarios. Cada resultado debe verificarse con una nueva consulta.</p><form onSubmit={submit} className="mt-5 grid gap-4"><label className="grid gap-2">Lote de cambios<textarea name="changes" rows={8} maxLength={50000} defaultValue="[]" className="bg-carbon border border-white/20 p-3 font-mono" /></label><button disabled={busy} className="bg-barpran p-4 font-bold disabled:opacity-50">{busy ? "Aplicando…" : "Aplicar cambios en Mercado Libre"}</button></form><pre aria-label="Resultado de cambios" className="mt-6 max-h-[600px] overflow-auto whitespace-pre-wrap break-words text-xs">{result}</pre></section>;
}

"use client";
import {useState,type FormEvent} from "react";
export default function Fotos(){
 const [busy,setBusy]=useState(false);const [result,setResult]=useState("");
 async function upload(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setResult("");const form=new FormData(event.currentTarget);const results=[];
  try{for(let n=1;n<=4;n++){
   const file=form.get("foto"+n);if(!(file instanceof File) || !file.size) throw new Error("Seleccioná las cuatro imágenes");
   const body=new FormData();body.set("file",file);
   const r=await fetch("/api/mercadolibre/administracion/fotos",{method:"POST",body});const response=await r.json();results.push({position:n,...response});setResult(JSON.stringify(results,null,2));if(!r.ok)break;
  }}catch{setResult(JSON.stringify({results,error:"No se completó la carga. Revisá los resultados antes de reintentar."},null,2));}finally{setBusy(false);}
 }
 return <section className="mt-10 border border-white/20 p-6"><h2 className="text-xl font-bold">Cuatro imágenes para Mercado Libre</h2><p className="mt-3 text-ash">Seleccioná las fotos en el orden indicado. La carga obtiene sus identificadores; las publicaciones se actualizan por separado.</p><form onSubmit={upload} className="mt-4 grid gap-4">{[1,2,3,4].map(n=><label key={n}>Foto {n}<input type="file" name={"foto"+n} accept="image/png,image/jpeg" required className="block mt-2"/></label>)}<button disabled={busy} className="bg-barpran p-4 font-bold">{busy?"Cargando imágenes…":"Cargar las cuatro imágenes"}</button></form><pre aria-label="Resultado de imágenes" className="mt-6 whitespace-pre-wrap text-xs">{result}</pre></section>;
}

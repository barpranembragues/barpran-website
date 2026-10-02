import { NextRequest, NextResponse } from "next/server";
import { origin, validAdminSession } from "@/lib/mercadolibre";
import { managementChange } from "@/lib/ml-management";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  const headers={"Cache-Control":"no-store","Referrer-Policy":"no-referrer"};
  if (request.headers.get("origin")!==origin() || !await validAdminSession(request.cookies.get("__Host-barpran-ml-admin")?.value)) return NextResponse.json({error:"Acceso no autorizado"},{status:403,headers});
  if (!request.headers.get("content-type")?.startsWith("application/json") || Number(request.headers.get("content-length") || 0)>50000) return NextResponse.json({error:"Solicitud inválida"},{status:400,headers});
  try {
    const raw=await request.text(); if(raw.length>50000) throw new Error("Lote demasiado grande");
    const changes=JSON.parse(raw);
    if(!Array.isArray(changes) || !changes.length || changes.length>10 || changes.some(c=>!c || typeof c.action!=="string" || typeof c.id!=="string")) throw new Error("Lote inválido");
    const results=[];
    for (const change of changes) {
      try { results.push({id:change.id,action:change.action,...await managementChange(change)}); }
      catch { results.push({id:change.id,action:change.action,status:400,error:"Cambio rechazado por validación. Revisar datos y estado actual."}); break; }
      if (results.at(-1)!.status>=400) break;
    }
    return NextResponse.json({results},{headers});
  } catch {return NextResponse.json({error:"No se pudo procesar el lote"},{status:400,headers});}
}

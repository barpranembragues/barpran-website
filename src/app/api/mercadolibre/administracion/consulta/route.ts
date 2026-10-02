import { NextRequest, NextResponse } from "next/server";
import { origin, validAdminSession } from "@/lib/mercadolibre";
import { managementQuery } from "@/lib/ml-management";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" };
  if (request.headers.get("origin") !== origin() || !await validAdminSession(request.cookies.get("__Host-barpran-ml-admin")?.value)) return NextResponse.json({error:"Acceso no autorizado"},{status:403,headers});
  if (!request.headers.get("content-type")?.startsWith("application/json") || Number(request.headers.get("content-length") || 0)>8192) return NextResponse.json({error:"Solicitud inválida"},{status:400,headers});
  try {
    const raw = await request.text();
    if (raw.length>8192) return NextResponse.json({error:"Solicitud demasiado grande"},{status:413,headers});
    const body = JSON.parse(raw);
    if (!body || typeof body.resource !== "string" || (body.id !== undefined && typeof body.id !== "string") || (body.params !== undefined && (typeof body.params !== "object" || Array.isArray(body.params) || body.params===null))) return NextResponse.json({error:"Solicitud inválida"},{status:400,headers});
    return NextResponse.json(await managementQuery(body),{headers});
  } catch { return NextResponse.json({error:"No se pudo completar la consulta privada"},{status:502,headers}); }
}

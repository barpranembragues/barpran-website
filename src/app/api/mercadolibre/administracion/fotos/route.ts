import {NextRequest,NextResponse} from "next/server";
import {origin,validAdminSession,managementUploadPicture} from "@/lib/mercadolibre";
export const runtime="nodejs";
export const maxDuration=60;
export async function POST(request:NextRequest) {
 const headers={"Cache-Control":"no-store","Referrer-Policy":"no-referrer"};
 if(request.headers.get("origin")!==origin() || !await validAdminSession(request.cookies.get("__Host-barpran-ml-admin")?.value)) return NextResponse.json({error:"Acceso no autorizado"},{status:403,headers});
 if(!request.headers.get("content-type")?.startsWith("multipart/form-data") || Number(request.headers.get("content-length")||0)>4*1024*1024+4096) return NextResponse.json({error:"Archivo inválido"},{status:400,headers});
 try {
  const form=await request.formData();const file=form.get("file");
  if(!(file instanceof File) || [...form.keys()].some(k=>k!=="file")) throw new Error("Archivo inválido");
  const result=await managementUploadPicture(file);
  return NextResponse.json(result,{status:result.status,headers});
 }catch{return NextResponse.json({error:"No se pudo cargar la imagen"},{status:400,headers});}
}

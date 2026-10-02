import type { Metadata } from "next";
import { cookies } from "next/headers";
import { managementDiagnostics, validAdminSession } from "@/lib/mercadolibre";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Administración privada de Mercado Libre", robots: { index: false, follow: false } };
const targets = ["KE701039", "KE701414", "KE726212", "KE726211", "KE728212", "KE728224", "KE728102"];
const money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

export default async function ManagementPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  const authorized = await validAdminSession((await cookies()).get("__Host-barpran-ml-admin")?.value);
  let report: Awaited<ReturnType<typeof managementDiagnostics>> | null = null;
  if (authorized) { try { report = await managementDiagnostics(); } catch { /* Keep private errors out of the response. */ } }
  return <main className="min-h-screen bg-carbon pt-32 text-bone"><div className="frame py-12">
    <p className="tech-label">Administración privada BARPRAN</p>
    <h1 className="display mt-4 text-4xl">Gestión de Mercado Libre</h1>
    {!authorized ? <div className="mt-8 max-w-xl border border-white/20 p-6">
      <p className="text-ash">Ingresá la clave de administración de la integración para comprobar el acceso a publicaciones, promociones y publicidad.</p>
      {estado && <p role="alert" className="mt-4">{estado === "clave" ? "La clave no es correcta." : "No se pudo iniciar la sesión. Probá nuevamente."}</p>}
      <form action="/api/mercadolibre/administracion/login" method="post" className="mt-6 grid gap-4">
        <label className="grid gap-2">Clave de administración<input name="clave" type="password" required maxLength={256} autoComplete="off" className="border border-white/20 bg-carbon p-4" /></label>
        <button className="bg-barpran p-4 font-bold">Comprobar acceso</button>
      </form>
      <p className="mt-4 text-sm text-ash">Sesión privada de una hora. Esta comprobación no modifica productos ni campañas.</p>
    </div> : !report ? <p role="alert" className="mt-8">No se pudo consultar Mercado Libre. Verificá la autorización de la cuenta y recargá esta página.</p> : <>
      <p className="mt-6">Vendedor conectado: {report.seller}</p>
      <h2 className="mt-8 text-xl font-bold">Comprobación de acceso</h2>
      <ul className="mt-4 space-y-3">{report.checks.map(check => <li key={check.label}>{check.label}: {check.readable ? "Consulta habilitada" : "Consulta no habilitada"} (HTTP {check.status || "sin respuesta"})</li>)}</ul>
      <p className="mt-4 text-sm text-ash">Las consultas habilitadas confirman lectura. La capacidad de modificar requiere verificar los permisos y las respuestas de cada operación.</p>
      <h2 className="mt-6 text-xl font-bold">Permisos de la aplicación</h2>
      <p className="mt-2 break-all text-sm">{report.applicationScopes.join(" · ") || "Metadatos no disponibles"}</p>
      <h2 className="mt-6 text-xl font-bold">Permisos autorizados por el vendedor</h2>
      <p className="mt-2 break-all text-sm">{report.grantedScopes.join(" · ") || "Metadatos no disponibles"}</p>
      <h2 className="mt-8 text-xl font-bold">Publicaciones por SKU</h2>
      <div className="mt-4 overflow-x-auto"><table className="w-full text-left"><thead><tr>{["SKU", "Publicaciones activas", "Precios de venta actuales"].map(s=><th key={s} className="border-b border-white/20 p-3">{s}</th>)}</tr></thead><tbody>{targets.map(target=>{
        const matches = report.catalog.items.filter(item=>item.sku?.toUpperCase()===target);
        return <tr key={target}><td className="p-3">{target}</td><td className="p-3">{matches.length}</td><td className="p-3">{[...new Set(matches.map(item=>item.price))].map(price=>money.format(price)).join(" · ") || "Sin publicaciones activas"}</td></tr>;
      })}</tbody></table></div>
      <p className="mt-6 text-ash">Precios, stock y campañas pendientes de modificación.</p>
      <a href="/gestion-mercadolibre" className="mt-6 inline-block underline">Actualizar comprobación</a>
    </>}
  </div></main>;
}

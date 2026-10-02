import type { Metadata } from "next";
import { integrationConfigured } from "@/lib/mercadolibre";

export const metadata: Metadata = { title: "Conectar Mercado Libre", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function ConnectPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { estado } = await searchParams;
  const configured = integrationConfigured();
  const messages: Record<string, string> = {
    conectado: "Cuenta conectada. Abrí la tienda para importar las publicaciones activas.",
    clave: "La clave de administración no es correcta.",
    error: "No se pudo conectar la cuenta. Revisá la configuración y que hayas autorizado al vendedor BARPRAN.",
  };
  return (
    <main className="min-h-screen bg-carbon pt-32 text-bone">
      <div className="frame py-12">
        <div className="mx-auto max-w-xl border border-white/10 bg-graphite p-6 sm:p-10">
          <p className="tech-label">Administración BARPRAN</p>
          <h1 className="display mt-4 text-4xl">Conectar Mercado Libre</h1>
          <p className="mt-4 text-base leading-7 text-ash">Autorizá la cuenta de vendedor de BARPRAN para mostrar sus productos y precios en la tienda.</p>
          {estado && <p role="status" className="mt-6 border border-white/20 p-4 text-sm leading-6">{messages[estado] || messages.error}</p>}
          {!configured ? <p className="mt-6 text-sm leading-6 text-ash">La integración necesita configurarse en el alojamiento de la web antes de conectar la cuenta.</p> : (
            <form action="/api/mercadolibre/conectar" method="post" className="mt-8 grid gap-4">
              <label className="grid gap-2 text-sm">Clave de administración de la web
                <input required name="clave" type="password" maxLength={256} autoComplete="off" className="border border-white/20 bg-carbon p-4 text-base outline-none focus:border-barpran" />
              </label>
              <p className="text-sm leading-6 text-ash">Esta es la clave privada de la integración. La contraseña de Mercado Libre se ingresa únicamente en Mercado Libre.</p>
              <button className="bg-barpran p-4 font-bold text-white">Conectar cuenta</button>
            </form>
          )}
          <a href="/tienda" className="mt-6 inline-block text-sm underline underline-offset-4">Ir a la tienda</a>
        </div>
      </div>
    </main>
  );
}

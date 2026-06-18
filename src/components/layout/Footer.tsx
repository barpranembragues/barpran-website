import Image from "next/image";
import { NAV, SITE, FOOTER } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/5 bg-carbon">
      <div className="grid-tech pointer-events-none absolute inset-0 opacity-30" />

      {/* Marca gigante de fondo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-6 left-0 right-0 select-none text-center"
      >
        <span className="display block text-[22vw] leading-none text-white/[0.025]">
          BARPRAN
        </span>
      </div>

      <div className="frame relative py-20">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Image
              src="/logo-barpran-light.png"
              alt="BARPRAN"
              width={1784}
              height={882}
              className="h-9 w-auto"
            />
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-ash">
              {SITE.descripcion}
            </p>
          </div>

          <div>
            <p className="tech-label mb-5">Navegación</p>
            <ul className="space-y-3">
              {NAV.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-bone/70 transition-colors hover:text-barpran"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="tech-label mb-5">Contacto</p>
            <ul className="space-y-3 text-sm text-bone/70">
              <li>
                <a className="transition-colors hover:text-barpran" href={`mailto:${SITE.email}`}>
                  {SITE.email}
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-barpran" href={`tel:${SITE.telefono.replace(/\s/g, "")}`}>
                  {SITE.telefono}
                </a>
              </li>
              <li>{SITE.direccion}</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-8 md:flex-row md:items-center">
          <p className="font-mono text-[0.7rem] uppercase tracking-mega text-ash">
            {FOOTER.legal}
          </p>
          <p className="font-mono text-[0.7rem] uppercase tracking-mega text-ash">
            {FOOTER.nota}
          </p>
        </div>
      </div>
    </footer>
  );
}

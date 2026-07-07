import Image from "next/image";
import { APLICACIONES_ESPECIALES } from "@/lib/content";

export default function AplicacionesEspeciales() {
  return (
    <section
      id={APLICACIONES_ESPECIALES.id}
      className="relative overflow-hidden border-t border-white/10 bg-[#070707] py-24 text-white md:py-32"
    >
      {/* Luz ambiental */}
      <div className="pointer-events-none absolute -right-40 top-0 h-[500px] w-[500px] rounded-full bg-red-700/10 blur-[150px]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Encabezado */}
        <div className="grid gap-10 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="mb-6 font-mono text-xs uppercase tracking-[0.35em] text-red-500">
              {APLICACIONES_ESPECIALES.eyebrow}
            </p>

            <h2 className="max-w-4xl text-4xl font-semibold uppercase leading-none tracking-tight md:text-6xl lg:text-7xl">
              {APLICACIONES_ESPECIALES.titulo}
            </h2>
          </div>

          <p className="max-w-xl text-base leading-8 text-white/65 md:text-lg lg:justify-self-end">
            {APLICACIONES_ESPECIALES.introduccion}
          </p>
        </div>

        {/* Galería */}
        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {APLICACIONES_ESPECIALES.imagenes.map((imagen, index) => (
            <article
              key={imagen.src}
              className="group relative h-[380px] overflow-hidden border border-white/10 bg-black md:h-[460px]"
            >
              <Image
                src={imagen.src}
                alt={imagen.alt}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition duration-700 ease-out group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

              <span className="absolute bottom-6 left-6 font-mono text-xs tracking-[0.3em] text-white/70">
                {String(index + 1).padStart(2, "0")}
              </span>
            </article>
          ))}
        </div>

        {/* Información y servicios */}
        <div className="mt-20 grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-7">
            <p className="text-lg leading-8 text-white/70">
              {APLICACIONES_ESPECIALES.descripcion}
            </p>

            <p className="text-lg leading-8 text-white/70">
              {APLICACIONES_ESPECIALES.empresas}
            </p>

            <div className="border-l-2 border-red-600 bg-white/[0.03] px-6 py-7">
              <p className="text-lg font-medium uppercase leading-relaxed tracking-wide text-white md:text-xl">
                Mantenimiento de frenos y embragues para empresas, flotas,
                vehículos pesados y maquinaria de trabajo.
              </p>
            </div>
          </div>

          <div className="border-t border-white/15">
            {APLICACIONES_ESPECIALES.servicios.map((servicio, index) => (
              <div
                key={servicio}
                className="flex items-start gap-5 border-b border-white/15 py-5 transition-colors hover:bg-white/[0.025]"
              >
                <span className="mt-1 min-w-6 font-mono text-xs text-red-500">
                  {String(index + 1).padStart(2, "0")}
                </span>

                <p className="text-sm uppercase leading-6 tracking-[0.12em] text-white/85 md:text-base">
                  {servicio}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Cierre */}
        <div className="mt-20 flex flex-col gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/40">
            BARPRAN — Ingeniería aplicada
          </p>

          <a
            href="#contacto"
            className="w-fit border border-red-600 px-7 py-4 font-mono text-xs uppercase tracking-[0.25em] text-white transition hover:bg-red-700"
          >
            Consultar una aplicación
          </a>
        </div>
      </div>
    </section>
  );
}
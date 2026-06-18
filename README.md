# BARPRAN — El embrague del automovilismo

Sitio corporativo de **BARPRAN**: ingeniería de embragues, fabricación, reconstrucción y sistemas de competición. Más de 50 años de tecnología argentina.

Diseño premium, cinematográfico y técnico inspirado en Brembo, Porsche Motorsport, Ferrari, Pagani, Sachs Performance y AP Racing — con identidad propia construida sobre el gesto del logotipo BARPRAN (la inclinación / *skew*).

---

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (animaciones y transiciones)
- **Lenis** (scroll suave)
- **SEO**: metadata, Open Graph, JSON-LD, `sitemap.xml`, `robots.txt`
- 100% responsive · accesible · listo para **Vercel**

---

## Puesta en marcha

Requiere **Node.js 18.18+** (recomendado Node 20 o 22).

```bash
# 1. Instalar dependencias
npm install

# 2. Entorno de desarrollo
npm run dev
# abre http://localhost:3000

# 3. Build de producción
npm run build
npm run start
```

> ⚠️ Las dependencias **no** vienen incluidas en el `.zip` (no se versiona `node_modules`).
> El primer paso siempre es `npm install`.

---

## Subir a GitHub

```bash
git init
git add .
git commit -m "BARPRAN — sitio inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/barpran-website.git
git push -u origin main
```

## Desplegar en Vercel

1. Entrá a [vercel.com](https://vercel.com) e importá el repositorio.
2. Vercel detecta **Next.js** automáticamente — no hace falta configurar nada.
3. Deploy. Listo.

---

## Estructura del proyecto

```
barpran-website/
├── public/
│   ├── logo-barpran.png         # logo original (negro sobre blanco)
│   ├── logo-barpran-light.png   # versión blanca para fondo oscuro (la que usa el sitio)
│   └── logo-barpran-dark.png    # versión con fondo transparente (para fondos claros)
├── src/
│   ├── app/
│   │   ├── layout.tsx           # fuentes, SEO, JSON-LD, header/footer
│   │   ├── page.tsx             # ensamblado de todas las secciones
│   │   ├── globals.css          # tokens, firma visual (skew), grilla técnica
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx        # nav fija + menú mobile
│   │   │   ├── Footer.tsx
│   │   │   └── SmoothScroll.tsx  # Lenis
│   │   ├── ui/
│   │   │   ├── Reveal.tsx        # revelado al hacer scroll
│   │   │   ├── AnimatedHeading.tsx
│   │   │   ├── SectionLabel.tsx
│   │   │   ├── SkewButton.tsx
│   │   │   ├── Marquee.tsx
│   │   │   ├── ScrollProgress.tsx
│   │   │   └── ClutchDisc.tsx    # disco de embrague SVG animado
│   │   └── sections/
│   │       ├── Hero.tsx          # 1. Hero fullscreen
│   │       ├── Manifesto.tsx     #    Manifiesto + estadísticas animadas
│   │       ├── Engineering.tsx   # 2. Ingeniería
│   │       ├── Motorsport.tsx    # 3. Competición
│   │       ├── Products.tsx      # 4. Ecosistema de productos
│   │       ├── Manufacturing.tsx # 5. Fabricación y reconstrucción
│   │       ├── History.tsx       # 6. 50 años de historia
│   │       └── Contact.tsx       # 7. Contacto
│   └── lib/
│       ├── content.ts           # ⭐ TODO el texto y los datos (editá acá)
│       └── motion.ts            # variantes de animación
├── tailwind.config.ts           # paleta y tokens de diseño
├── next.config.mjs
├── tsconfig.json
└── vercel.json
```

---

## Personalización

### Textos, cifras y datos de contacto
Todo está centralizado en **`src/lib/content.ts`**. Editá ahí:
- Email, teléfono, WhatsApp, dirección (`SITE`)
- Estadísticas (`STATS`) — las cifras actuales son de referencia, ajustalas a las reales
- Productos, disciplinas, hitos de la historia, etc.

### Colores
En **`tailwind.config.ts`** → `theme.extend.colors`:
- `carbon`, `graphite`, `steel`, `iron` — negros y grafitos
- `barpran` (`DEFAULT`, `bright`, `deep`) — el rojo de marca

### Video del Hero (opcional)
Por defecto el hero usa un **disco de embrague animado** en SVG, así funciona sin ningún archivo extra. Si querés un video cinematográfico:

1. Dejá tu video en `public/hero.mp4` y un póster en `public/hero-poster.jpg`.
2. En `src/components/sections/Hero.tsx`, descomentá el bloque `<video>` que está marcado en el código.

### Formulario de contacto
El formulario actual abre el cliente de correo (`mailto:`) sin necesidad de backend.
Para recibir mensajes automáticamente, conectá un servicio en `Contact.tsx`:
- **Resend** / **SendGrid** vía un *Route Handler* en `src/app/api/contact/route.ts`
- o un servicio como **Formspree** / **Web3Forms** (solo cambiás el `handleSubmit`).

---

## La firma visual

Todo el sitio gira alrededor de un único gesto: la **inclinación** del logotipo BARPRAN.
Botones, divisores, chips y etiquetas comparten el mismo ángulo (`--skew` en `globals.css`),
igual que las letras en cursiva del wordmark. Es lo que vuelve a la marca reconocible
sin caer en la estética de "tienda de repuestos".

---

© BARPRAN. Embragues · Transmisión · Competición · Argentina.

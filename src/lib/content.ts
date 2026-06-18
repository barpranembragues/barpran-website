/**
 * Contenido central del sitio BARPRAN.
 * Todo el texto editable vive acá para mantener un único punto de verdad.
 * Reemplazá cifras, descripciones e imágenes por las definitivas de la empresa.
 */

export const SITE = {
  name: "BARPRAN",
  slogan: "BARPRAN el embrague del automovilismo",
  sloganUpper: "BARPRAN el embrague del automovilismo",
  descripcion:
    "Ingeniería de embragues y soluciones de transmisión de alto rendimiento. Más de 50 años desarrollando, fabricando y reconstruyendo sistemas de embrague para calle y competición.",
  url: "https://www.barpran.com.ar",
  email: "admin@barpran.com",
  telefono: "4488-5226",
  whatsapp: "+54 9 11 7058 6143",
  direccion: "Buenos Aires, Argentina",
  anioFundacion: 1971,
} as const;

export const NAV = [
  { label: "Ingeniería", href: "#ingenieria" },
  { label: "Competición", href: "#competicion" },
  { label: "Productos", href: "#productos" },
  { label: "Fabricación", href: "#fabricacion" },
  { label: "Historia", href: "#historia" },
  { label: "Contacto", href: "#contacto" },
] as const;

export const HERO = {
  eyebrow: "Desde 1971 · Argentina",
  titulo: ["EL EMBRAGUE", "DEL AUTOMOVILISMO"],
  bajada:
    "Diseñamos el punto exacto donde la potencia se convierte en tracción. Embragues de competición, transmisión de alto rendimiento e ingeniería de precisión nacida en la pista.",
  ctaPrimario: { label: "Conocé la ingeniería", href: "#ingenieria" },
  ctaSecundario: { label: "Ver competición", href: "#competicion" },
  ticker: [
    "INGENIERÍA",
    "COMPETICIÓN",
    "PRECISIÓN",
    "RENDIMIENTO",
    "FABRICACIÓN",
    "TECNOLOGÍA",
  ],
} as const;

export const STATS = [
  { valor: "50", sufijo: "+", label: "50 años" },
  { valor: "0,01", sufijo: "mm", label: "De Buenos Aires al Mundo Entero" },
  { valor: "100", sufijo: "%", label: "Desarrollo nacional" },
  { valor: "360", sufijo: "°", label: "Balcarce 84, Ramos Mejia" },
] as const;

export const MANIFIESTO = {
  eyebrow: "Manifiesto",
  texto:
    "No fabricamos solo embragues. Fabricamos el instante en que el motor y el asfalto se entienden. Cada pieza que diseña de BARPRAN está calculada para transmitir todo, sin perder nada.",
} as const;

export const INGENIERIA = {
  id: "ingenieria",
  numero: "01",
  eyebrow: "Ingeniería",
  titulo: "Donde la potencia\nse vuelve control",
  bajada:
    "Cada embrague BARPRAN nace en el banco de diseño: simulación de cargas, selección de materiales de fricción y validación dinámica antes de tocar la pista.",
  pilares: [
    {
      titulo: "Diseño y cálculo",
      texto:
        "Modelado del conjunto, presión y temperatura para definir el comportamiento del embrague en cada régimen de uso.",
    },
    {
      titulo: "Mecanizado de precisión",
      texto:
        "Centros CNC y rectificado de superficies de contacto con tolerancias controladas micra a micra.",
    },
    {
      titulo: "Balanceo dinámico",
      texto:
        "Equilibrado del conjunto para eliminar vibraciones a alto régimen y prolongar la vida útil.",
    },
    {
      titulo: "Desarrollo de fricción",
      texto:
        "Formulación y ensayo de materiales orgánicos, cerámicos y aceros según la aplicación.",
    },
  ],
} as const;

export const COMPETICION = {
  id: "competicion",
  numero: "02",
  eyebrow: "Competición",
  titulo: "Probado en pista,\nvalidado en la calle",
  bajada:
    "Lo que aprendemos compitiendo lo trasladamos a cada producto de serie. La pista es nuestro laboratorio más exigente.",
  disciplinas: [
    { nombre: "Turismo Carretera", detalle: "Embragues multidisco de alta resistencia térmica." },
    { nombre: "Rally", detalle: "Tolerancia a impactos, polvo y cambios bruscos de tracción." },
    { nombre: "Pista / Circuito", detalle: "Respuesta inmediata y modulación precisa del pedal." },
    { nombre: "Drag / Aceleración", detalle: "Transmisión máxima  en largadas extremas." },
  ],
  cierre:
    "Cada largada es un dato. Cada vuelta, una validación. BARPRAN compite para que tu auto rinda más.",
} as const;

export const PRODUCTOS = {
  id: "productos",
  numero: "03",
  eyebrow: "Ecosistema de productos",
  titulo: "Un embrague para\ncada exigencia",
  items: [
    {
  codigo: "MD-01",
  nombre: "Monodisco",
  resumen: "El equilibrio perfecto entre confort y rendimiento para calle y uso intensivo.",
  imagen: "/monodisco.png",
  specs: ["Conducción progresiva", "Larga vida útil", "Uso diario y deportivo"],
},
{
  codigo: "BD-02",
  nombre: "Bidisco",
  resumen: "Doble disco para duplicar la capacidad de par sin sacrificar manejabilidad.",
  imagen: "/bidisco.png",
  specs: ["Alta capacidad de par", "Menor peso por superficie", "Aplicaciones turbo"],
},
{
  codigo: "MD-03",
  nombre: "Multidisco",
  resumen: "Máxima transmisión en mínimo diámetro. La referencia de la competición.",
  imagen: "/multidisco.png",
  specs: ["Reducción de inercia", "Respuesta inmediata", "Alta resistencia térmica"],
},
    {
      codigo: "EC-04",
      nombre: "Embragues de competición",
      resumen: "Conjuntos racing desarrollados para las disciplinas más demandantes.",
      specs: ["Materiales cerámicos / metálicos", "Modulación de pedal", "Setup por disciplina"],
    },
    {
      codigo: "AP-05",
      nombre: "Aplicaciones especiales",
      resumen: "Desarrollo a medida para proyectos únicos, clásicos y maquinaria especial.",
      specs: ["Ingeniería inversa", "Fabricación a pedido", "Asesoramiento técnico"],
    },
  ],
} as const;

export const FABRICACION = {
  id: "fabricacion",
  numero: "04",
  eyebrow: "Fabricación y reconstrucción",
  titulo: "Fabricamos nuevo.\nReconstruimos como nuevo.",
  bajada:
    "Una planta integral: del bloque de material al embrague terminado. Y un proceso de reconstrucción que devuelve al conjunto sus especificaciones originales —o las mejora.",
  proceso: [
    { paso: "Diagnóstico", texto: "Análisis del conjunto y medición de desgaste." },
    { paso: "Mecanizado", texto: "Rectificado y recuperación de superficies de contacto." },
    { paso: "Reemplazo", texto: "Forros, resortes y componentes de fricción." },
    { paso: "Balanceo", texto: "Equilibrado dinámico del conjunto completo." },
    { paso: "Ensayo", texto: "Validación, presión y funcionamiento." },
  ],
} as const;

export const HISTORIA = {
  id: "historia",
  numero: "05",
  eyebrow: "50 años de historia",
  titulo: "Medio siglo\nsobre el asfalto",
  hitos: [
    { anio: "1971", titulo: "El origen", texto: "Nace BARPRAN como taller especializado en embragues." },
    { anio: "1985", titulo: "Industria propia", texto: "Primera planta de fabricación y desarrollo nacional." },
    { anio: "1998", titulo: "Entrada al automovilismo", texto: "Embragues BARPRAN debutan en la competición argentina." },
    { anio: "2010", titulo: "Tecnología multidisco", texto: "Desarrollo de conjuntos racing de mínima inercia." },
    { anio: "2024", titulo: "Ingeniería sin límites", texto: "Más de 50 años transmitiendo potencia, en todo el país." },
  ],
} as const;

export const CONTACTO = {
  id: "contacto",
  numero: "06",
  eyebrow: "Contacto",
  titulo: "Hablemos de\ntu próximo desarrollo",
  bajada:
    "Para consultas técnicas, proyectos de competición o desarrollos a medida, nuestro equipo responde directamente.",
} as const;

export const FOOTER = {
  legal: `© ${new Date().getFullYear()} BARPRAN EMBRAGUE. Todos los derechos reservados.`,
  nota: "Embragues · Transmisión · Competición · Argentina",
} as const;

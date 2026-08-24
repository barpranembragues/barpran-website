export type PilotoBarpran = {
  nombre: string;
  categoria: "TC" | "TC Pista";
  actcCategory: "tc" | "tcp";
  destacado?: string;
};

export const CATEGORIAS_BARPRAN = [
  "TC",
  "TC MOURAS",
  "TC PISTA",
  "TC PICK UP",
] as const;

export const PILOTOS_TC: PilotoBarpran[] = [
  { nombre: "Agustín Canapino", categoria: "TC", actcCategory: "tc", destacado: "MÚLTIPLE CAMPEÓN" },
  { nombre: "Mariano Werner", categoria: "TC", actcCategory: "tc", destacado: "MÚLTIPLE CAMPEÓN" },
  { nombre: "Germán Todino", categoria: "TC", actcCategory: "tc" },
  { nombre: "Andrés Jakos", categoria: "TC", actcCategory: "tc" },
  { nombre: "Mauricio Lambiris", categoria: "TC", actcCategory: "tc" },
  { nombre: "Juan Martín Trucco", categoria: "TC", actcCategory: "tc" },
  { nombre: "Santiago Mangoni", categoria: "TC", actcCategory: "tc" },
  { nombre: "Jeremías Olmedo", categoria: "TC", actcCategory: "tc" },
  { nombre: "Norberto Fontana", categoria: "TC", actcCategory: "tc" },
  { nombre: "Gastón Mazzacane", categoria: "TC", actcCategory: "tc" },
  { nombre: "Sebastián Abella", categoria: "TC", actcCategory: "tc" },
  { nombre: "Tomás Abdala", categoria: "TC", actcCategory: "tc" },
  { nombre: "Nicolás Trosset", categoria: "TC", actcCategory: "tc" },
  { nombre: "Lautaro De La Iglesia", categoria: "TC", actcCategory: "tc" },
  { nombre: "Lucas Valle", categoria: "TC", actcCategory: "tc" },
  { nombre: "Rodrigo Lugón", categoria: "TC", actcCategory: "tc" },
  { nombre: "Gastón Ferrante", categoria: "TC", actcCategory: "tc" },
  { nombre: "Kevin Candela", categoria: "TC", actcCategory: "tc" },
  { nombre: "Hernán Palazzo", categoria: "TC", actcCategory: "tc" },
  { nombre: "Martín Vázquez", categoria: "TC", actcCategory: "tc" },
  { nombre: "Valentín Aguirre", categoria: "TC", actcCategory: "tc" },
  { nombre: "Jeremías Scialchi", categoria: "TC", actcCategory: "tc" },
  { nombre: "Marco Dianda", categoria: "TC", actcCategory: "tc" },
  { nombre: "Santiago Álvarez", categoria: "TC", actcCategory: "tc" },
  { nombre: "Marcos Castro", categoria: "TC", actcCategory: "tc" },
  { nombre: "Marcos Quijada", categoria: "TC", actcCategory: "tc" },
  { nombre: "Marcelo Agrelo", categoria: "TC", actcCategory: "tc" },
];

export const PILOTOS_TC_PISTA: PilotoBarpran[] = [
  { nombre: "Gabriel Gandulia", categoria: "TC Pista", actcCategory: "tcp" },
  { nombre: "Benjamín Antón", categoria: "TC Pista", actcCategory: "tcp" },
  { nombre: "Eugenio Provens", categoria: "TC Pista", actcCategory: "tcp" },
  { nombre: "Manuel Borgert", categoria: "TC Pista", actcCategory: "tcp" },
  { nombre: "Benjamín Ochoa", categoria: "TC Pista", actcCategory: "tcp" },
  { nombre: "Nicanor Santilli Pazos", categoria: "TC Pista", actcCategory: "tcp" },
  { nombre: "Braian Quevedo", categoria: "TC Pista", actcCategory: "tcp" },
];

export const MARCOS_DI_PALMA = {
  nombre: "Marcos Di Palma",
  categoria: "LEYENDA DEL AUTOMOVILISMO",
  profilePath: "/tc/pilotos/2010/marcos-di-palma_525.html",
} as const;

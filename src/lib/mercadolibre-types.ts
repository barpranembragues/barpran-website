export const MERCADO_LIBRE_STORE = "https://www.mercadolibre.com.ar/pagina/embraguebarpran";

export type CatalogItem = {
  id: string;
  title: string;
  price: number;
  originalPrice: number | null;
  currency: string;
  image: string | null;
  permalink: string;
  available: boolean;
  freeShipping: boolean;
  condition: string;
  sku: string | null;
};

export type CatalogResponse = {
  items: CatalogItem[];
  updatedAt: string | null;
  status: "ready" | "unavailable";
};

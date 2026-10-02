import { connectedSellerId, managementApi } from "./mercadolibre";

type Params = Record<string, string | number | boolean>;
export type ManagementQuery = { resource: string; id?: string; params?: Params };
function query(params: Params = {}) {
  const entries = Object.entries(params);
  if (entries.length > 20 || entries.some(([k,v]) => !/^[a-zA-Z0-9_.-]{1,40}$/.test(k) || !["string", "number", "boolean"].includes(typeof v) || String(v).length > 500)) throw new Error("Parámetros inválidos");
  return new URLSearchParams(entries.map(([k,v]) => [k, String(v)])).toString();
}
async function ownedItem(id?: string) {
  if (!id || !/^MLA\d+$/.test(id)) throw new Error("ID de publicación inválido");
  const response = await managementApi(`/items/${id}`);
  const item = response.data as Record<string, unknown>;
  if (response.status !== 200 || String(item.seller_id) !== await connectedSellerId()) throw new Error("La publicación no pertenece al vendedor conectado");
  return item;
}

export async function managementQuery(input: ManagementQuery) {
  const seller = await connectedSellerId();
  if (!seller) throw new Error("Cuenta no conectada");
  const params = query(input.params);
  const id = input.id || "";
  if (input.resource === "listings") {
    const ids = new Set<string>();
    let cursor: string | undefined;
    do {
      const search = new URLSearchParams({ search_type: "scan", limit: "100" });
      if (cursor) search.set("scroll_id", cursor);
      const response = await managementApi(`/users/${seller}/items/search?${search}`);
      const page = response.data as { results: string[]; scroll_id?: string; paging: { total: number } };
      if (response.status !== 200 || !Array.isArray(page.results) || page.results.some(value => !/^MLA\d+$/.test(value))) return response;
      const before = ids.size;
      page.results.forEach(value => ids.add(value));
      if (!page.results.length || ids.size >= page.paging.total) break;
      if (before === ids.size || !page.scroll_id || ids.size > 2000) throw new Error("Paginación no completada");
      cursor = page.scroll_id;
    } while (true);
    const items: Record<string, unknown>[] = [];
    const all = [...ids];
    for (let i=0; i<all.length; i+=8) {
      const batch = await Promise.all(all.slice(i,i+8).map(value=>ownedItem(value)));
      items.push(...batch.map(item=>Object.fromEntries(["id", "title", "status", "sub_status", "price", "original_price", "available_quantity", "sold_quantity", "category_id", "listing_type_id", "seller_custom_field", "attributes", "sale_terms", "shipping", "tags", "catalog_listing", "user_product_id", "variations", "channels", "buying_mode", "condition", "permalink"].map(key=>[key,item[key]]))));
    }
    return { status: 200, data: { total: items.length, items } };
  }
  if (["item","description","prices","compatibilities","item_promotions","shipping","fees"].includes(input.resource)) {
    const item = await ownedItem(id);
    if (input.resource === "item") return {status:200,data:item};
    if (input.resource === "description") return managementApi(`/items/${id}/description`);
    if (input.resource === "prices") return managementApi(`/items/${id}/prices`);
    if (input.resource === "compatibilities") return managementApi(`/items/${id}/compatibilities?${params}`);
    if (input.resource === "item_promotions") return managementApi(`/seller-promotions/items/${id}?app_version=v2&${params}`);
    if (input.resource === "shipping") return managementApi(`/users/${seller}/shipping_options/free?${query({item_id:id, verbose:true, ...input.params})}`);
    const shipping = item.shipping as {mode?: string; logistic_type?:string};
    return managementApi(`/sites/MLA/listing_prices?${query({price: Number(item.price), currency_id:"ARS", category_id:String(item.category_id), listing_type_id:String(item.listing_type_id), shipping_mode:shipping?.mode || "", logistic_type:shipping?.logistic_type || "", ...input.params})}`);
  }
  if (input.resource === "promotions") return managementApi(`/seller-promotions/users/${seller}?app_version=v2&${params}`);
  if (input.resource === "promotion_items") {
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(id)) throw new Error("ID inválido");
    return managementApi(`/seller-promotions/promotions/${id}/items?app_version=v2&${params}`);
  }
  if (input.resource === "advertisers") return managementApi("/advertising/advertisers?product_id=PADS", "1");
  if (["campaigns","ads","ad_groups"].includes(input.resource)) {
    if (!/^\d+$/.test(id)) throw new Error("ID de anunciante inválido");
    const endpoint = input.resource === "campaigns" ? "campaigns" : input.resource;
    return managementApi(`/advertising/MLA/advertisers/${id}/product_ads/${endpoint}/search?${params}`, "2");
  }
  if (["campaign","campaign_metrics"].includes(input.resource)) {
    if (!/^\d+$/.test(id)) throw new Error("ID de campaña inválido");
    return managementApi(`/advertising/MLA/product_ads/campaigns/${id}${input.resource === "campaign_metrics" ? "/ads/metrics" : ""}?${params}`, "2");
  }
  throw new Error("Consulta no admitida");
}

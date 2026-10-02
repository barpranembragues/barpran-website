import { connectedSellerId, managementApi, managementWrite } from "./mercadolibre";

type Params = Record<string, string | number | boolean>;
export type ManagementQuery = { resource: string; id?: string; params?: Params };
function query(params: Params = {}) {
  const entries = Object.entries(params);
  if (entries.length > 20 || entries.some(([k,v]) => !/^[a-zA-Z0-9_\[\].-]{1,40}$/.test(k) || !["string", "number", "boolean"].includes(typeof v) || String(v).length > 500)) throw new Error("Parámetros inválidos");
  return new URLSearchParams(entries.map(([k,v]) => [k, String(v)])).toString();
}
async function ownedItem(id?: string) {
  if (!id || !/^MLA\d+$/.test(id)) throw new Error("ID de publicación inválido");
  const response = await managementApi(`/items/${id}`);
  const item = response.data as Record<string, unknown>;
  if (response.status !== 200 || String(item.seller_id) !== await connectedSellerId()) throw new Error("La publicación no pertenece al vendedor conectado");
  return item;
}

export async function managementQuery(input: ManagementQuery): Promise<{status:number;data:unknown;version?:string}> {
  const seller = await connectedSellerId();
  if (!seller) throw new Error("Cuenta no conectada");
  const params = query(input.params);
  const id = input.id || "";
  if (input.resource === "audit") {
    const ids = id.split(",");
    if (!ids.length || ids.length>5) throw new Error("Lote inválido");
    const records = await Promise.all(ids.map(async value=> {
      const item = await ownedItem(value);
      const [description,promotions,prices,shipping,stock] = await Promise.all([
        managementApi(`/items/${value}/description`), managementApi(`/seller-promotions/items/${value}?app_version=v2`), managementApi(`/items/${value}/prices`),
        managementApi(`/users/${seller}/shipping_options/free?item_id=${value}&verbose=true`),
        typeof item.user_product_id === "string" && /^MLAU\d+$/.test(item.user_product_id) ? managementApi(`/user-products/${item.user_product_id}/stock`) : null
      ]);
      const weight = (shipping.data as {coverage?:{all_country?:{billable_weight?:number}}})?.coverage?.all_country?.billable_weight;
      const terms = item.sale_terms as {id:string;value_name:string}[];
      const tag = terms?.find(t=>t.id==="INSTALLMENTS_CAMPAIGN")?.value_name;
      const fees = weight ? await managementQuery({resource:"fees",id:value,params:{billable_weight:weight,...(tag ? {tags:tag} : {})}}) : null;
      return {id:value,description,promotions,prices,shipping,fees,stock};
    }));
    return {status:200,data:records};
  }
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
    return managementApi(`/advertising/MLA/product_ads/campaigns/${id}${input.resource === "campaign_metrics" ? "/ad_groups/metrics" : ""}?${params}`, "2");
  }
  if (["ad_group","ad_group_ads"].includes(input.resource)) {
    if (!/^\d+$/.test(id)) throw new Error("ID inválido");
    return managementApi(`/advertising/MLA/product_ads/ad_groups/${id}${input.resource === "ad_group_ads" ? "/ads" : ""}?${params}`,"2");
  }
  throw new Error("Consulta no admitida");
}


type Change = { action:string; id:string; sku?:string; price?:number; quantity?:number; description?:string; expectedPrice?:number; budget?:number; status?:string; campaignId?:number; promotionId?:string; dealPrice?:number; itemId?:string; offerId?:string; title?:string; promotionType?:string };
const targetSkus = ["KE701039","KE701414","KE726212","KE726211","KE728212","KE728224","KE728102"];
async function advertiserIds() {
  const r = await managementApi("/advertising/advertisers?product_id=PADS","1");
  if (r.status!==200) throw new Error("Anunciante no disponible");
  return ((r.data as {advertisers:{advertiser_id:number;site_id:string}[]}).advertisers || []).filter(x=>x.site_id==="MLA").map(x=>Number(x.advertiser_id));
}
async function campaignAdvertiser(id: string) {
  for (const advertiser of await advertiserIds()) {
    const response = await managementApi(`/advertising/MLA/advertisers/${advertiser}/product_ads/campaigns/search?limit=100`,"2");
    if (response.status===200 && (response.data as {results:{id:number}[]}).results?.some(c=>String(c.id)===id)) return advertiser;
  }
  throw new Error("Campaña ajena");
}
export async function managementChange(c: Change) {
  if (["item","description","promotion","smart","exclude_promotion","title"].includes(c.action)) {
    const item = await ownedItem(c.id);
    const sku = (item.attributes as {id:string;value_name:string}[]).find(x=>x.id==="SELLER_SKU")?.value_name;
    if (sku!==c.sku || (!["promotion","smart","exclude_promotion"].includes(c.action) && !targetSkus.includes(sku || ""))) throw new Error("SKU no autorizado");
    if (c.action==="item") {
      if (c.expectedPrice!==Number(item.price)) throw new Error("El precio cambió; consultar de nuevo");
      const body:Record<string,unknown>={};
      if (c.price!==undefined) { if (!Number.isFinite(c.price) || c.price<10000 || c.price>1000000) throw new Error("Precio inválido"); body.price=c.price; }
      if (c.quantity!==undefined) { if (!Number.isInteger(c.quantity) || c.quantity<0 || c.quantity>20) throw new Error("Stock inválido"); body.available_quantity=c.quantity; }
      if (!Object.keys(body).length) throw new Error("Sin cambios");
      return managementWrite(`/items/${c.id}`,"PUT",body);
    }
    if (c.action==="title") {
      if (!c.title || c.title.length>60 || c.title.length<10) throw new Error("Título inválido");
      return managementWrite(`/items/${c.id}`,"PUT",{title:c.title});
    }
    if (["smart","exclude_promotion"].includes(c.action)) {
      if (!c.promotionId || !/^P-MLA\d+$/.test(c.promotionId) || !c.offerId || !/^(?:OFFER|CANDIDATE)-MLA\d+-\d+$/.test(c.offerId)) throw new Error("Oferta inválida");
      const r=await managementApi(`/seller-promotions/items/${c.id}?app_version=v2`);
      const offer=(r.data as {id:string;ref_id:string;type:string;status:string;seller_percentage:number}[]).find(x=>x.id===c.promotionId && x.ref_id===c.offerId && x.type==="SMART");
      if(r.status!==200 || !offer || !Number.isFinite(offer.seller_percentage)) throw new Error("Oferta no disponible");
      if(c.action==="smart") {
        const p=await managementApi(`/seller-promotions/promotions/${c.promotionId}?promotion_type=SMART&app_version=v2`);
        if(p.status!==200 || (p.data as {status:string}).status!=="started" || offer.status!=="candidate" || offer.seller_percentage<0 || offer.seller_percentage>6) throw new Error("Oferta excedida o campaña no iniciada");
        return managementWrite(`/seller-promotions/items/${c.id}?app_version=v2`,"POST",{promotion_id:c.promotionId,promotion_type:"SMART",offer_id:c.offerId});
      }
      if(offer.status!=="started" || offer.seller_percentage<=6) throw new Error("No es una oferta activa excedida");
      return managementWrite(`/seller-promotions/items/${c.id}?app_version=v2&promotion_type=SMART&promotion_id=${c.promotionId}&offer_id=${c.offerId}`,"DELETE",{});
    }
    if (c.action==="description") {
      if (!c.description || c.description.length>20000) throw new Error("Descripción inválida");
      return managementWrite(`/items/${c.id}/description`,"PUT",{plain_text:c.description});
    }
    if (!c.promotionId || !/^P-MLA\d+$/.test(c.promotionId) || !Number.isFinite(c.dealPrice)) throw new Error("Promoción inválida");
    const candidates = await managementApi(`/seller-promotions/items/${c.id}?app_version=v2`);
    const promo = (candidates.data as {id:string;type:string;status:string;original_price:number;max_discounted_price:number;min_discounted_price:number}[]).find(x=>x.id===c.promotionId && x.type==="DEAL");
    if (candidates.status!==200 || !promo || !["candidate","started"].includes(promo.status) || Number(c.dealPrice)<promo.original_price*0.94-0.005 || Number(c.dealPrice)>promo.original_price || (promo.status==="candidate" && (Number(c.dealPrice)>promo.max_discounted_price || Number(c.dealPrice)<promo.min_discounted_price))) throw new Error("La promoción supera el 6% o no es elegible");
    return managementWrite(`/seller-promotions/items/${c.id}?app_version=v2`,promo.status==="started" ? "PUT" : "POST",{promotion_id:c.promotionId,promotion_type:"DEAL",deal_price:c.dealPrice});
  }
  if (c.action==="campaign") {
    if (!/^\d+$/.test(c.id)) throw new Error("Campaña inválida");
    const r = await managementApi(`/advertising/MLA/product_ads/campaigns/${c.id}`,"2");
    const campaign = r.data as {currency_id:string};
    if (r.status!==200 || campaign.currency_id!=="ARS") throw new Error("Campaña ajena");
    await campaignAdvertiser(c.id);
    const body:Record<string,unknown>={};
    if (c.budget!==undefined) { if (!Number.isFinite(c.budget) || c.budget<0 || c.budget>5331) throw new Error("Presupuesto excedido"); body.budget=c.budget; }
    if (c.status!==undefined) { if (!["active","paused"].includes(c.status)) throw new Error("Estado inválido");body.status=c.status; }
    if (!Object.keys(body).length) throw new Error("Sin cambios");
    return managementWrite(`/advertising/MLA/product_ads/campaigns/${c.id}`,"PUT",body);
  }
  if (c.action==="ad_group") {
    if (!/^\d+$/.test(c.id) || !["active","paused"].includes(c.status || "")) throw new Error("Anuncio inválido");
    const r=await managementApi(`/advertising/MLA/product_ads/ad_groups/${c.id}`,"2");
    if (r.status!==200 || !(await advertiserIds()).includes(Number((r.data as {advertiser_id:number}).advertiser_id))) throw new Error("Anuncio ajeno");
    if (c.status==="active") {
      const item = await ownedItem(c.itemId);
      const sku=(item.attributes as {id:string;value_name:string}[]).find(x=>x.id==="SELLER_SKU")?.value_name;
      if (!targetSkus.includes(sku || "") || item.status!=="active" || Number(item.available_quantity)<=0 || !Number.isInteger(c.campaignId)) throw new Error("Producto no autorizado para publicidad");
      const group = r.data as {advertiser_id:number};
      const mapping = await managementApi(`/advertising/MLA/advertisers/${group.advertiser_id}/product_ads/ad_groups/search?${query({"filters[item_ids]":String(c.itemId)})}`,"2");
      if (mapping.status!==200 || !(mapping.data as {results:{id:number}[]}).results?.some(x=>String(x.id)===c.id)) throw new Error("El grupo no corresponde al producto");
      if(await campaignAdvertiser(String(c.campaignId))!==group.advertiser_id) throw new Error("Campaña ajena");
    }
    return managementWrite(`/advertising/MLA/product_ads/ad_groups/${c.id}`,"PUT",{status:c.status,...(Number.isInteger(c.campaignId) && Number(c.campaignId)>0 ? {campaign_id:c.campaignId} : {})});
  }
  throw new Error("Acción no admitida");
}

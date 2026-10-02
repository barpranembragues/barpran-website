import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import type { CatalogItem, CatalogResponse } from "./mercadolibre-types";

const PREFIX = "barpran:ml:v1:";
const MAX_AGE = 5 * 60_000;
const MAX_STALE_AGE = 10 * 60_000;
type Tokens = { access_token: string; refresh_token: string; expiresAt: number; user_id: number };
type Snapshot = { items: CatalogItem[]; updatedAt: string; revision: number };
type MeliItem = {
  id: string; seller_id: number; status: string; title: string; price: number;
  currency_id: string; available_quantity: number; permalink: string;
  condition: string; seller_custom_field?: string;
  pictures?: { secure_url?: string; url?: string }[];
  shipping?: { free_shipping?: boolean };
  attributes?: { id: string; value_name?: string }[];
};
type SalePrice = { amount: number; regular_amount?: number; currency_id: string };

export class IntegrationError extends Error {
  constructor(public readonly kind: "config" | "authorization" | "upstream" | "busy") {
    super(kind);
  }
}

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new IntegrationError("config");
  return value;
}

export function integrationConfigured(): boolean {
  return ["ML_APP_ID", "ML_APP_SECRET", "ML_ADMIN_SECRET", "UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]
    .every((name) => Boolean(process.env[name])) && (process.env.ML_ADMIN_SECRET?.length ?? 0) >= 32
    && (!process.env.ML_SELLER_ID || /^\d+$/.test(process.env.ML_SELLER_ID)) && /^\d+$/.test(process.env.ML_APP_ID || "");
}

export function origin(): string {
  const url = new URL(process.env.ML_SITE_ORIGIN || "https://barpran.com.ar");
  if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash) throw new IntegrationError("config");
  return url.origin;
}

export function adminAuthorized(candidate: string): boolean {
  const secret = process.env.ML_ADMIN_SECRET;
  if (!secret || secret.length < 32) return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}

export async function createAdminSession(): Promise<string> {
  const session = randomBytes(32).toString("base64url");
  const key = createHash("sha256").update(session).digest("hex");
  await redis("SET", PREFIX + "admin-session:" + key, seal({ purpose: "management", expiresAt: Date.now() + 60 * 60_000 }), "EX", 3600);
  return session;
}

export async function validAdminSession(session?: string): Promise<boolean> {
  if (!session || !/^[A-Za-z0-9_-]{43}$/.test(session)) return false;
  try {
    const key = createHash("sha256").update(session).digest("hex");
    const raw = await redis<string | null>("GET", PREFIX + "admin-session:" + key);
    if (!raw) return false;
    const value = unseal<{ purpose: string; expiresAt: number }>(raw);
    return value.purpose === "management" && value.expiresAt > Date.now();
  } catch { return false; }
}

// This diagnostic performs only fixed GET requests. Never return credentials or
// upstream response bodies: application metadata can contain client secrets.
export async function managementDiagnostics() {
  const seller = await connectedSellerId();
  if (!seller) throw new IntegrationError("authorization");
  const token = await accessToken();
  const endpoints = [
    ["Cuenta y publicaciones", `/users/${seller}/items/search?status=active&limit=1`],
    ["Promociones", `/seller-promotions/users/${seller}?app_version=v2`],
    ["Publicidad", "/advertising/advertisers?product_id=PADS"],
  ];
  const checks = await Promise.all(endpoints.map(async ([label, path]) => {
    try {
      const res = await fetch("https://api.mercadolibre.com" + path, {
        method: "GET", cache: "no-store", headers: { Authorization: `Bearer ${token}`, ...(path.startsWith("/advertising/") ? { "Api-Version": "1" } : {}) }, signal: AbortSignal.timeout(12_000),
      });
      await res.body?.cancel();
      return { label, status: res.status, readable: res.ok };
    } catch { return { label, status: 0, readable: false }; }
  }));
  let applicationScopes: string[] = [];
  let grantedScopes: string[] = [];
  const scopes = (value: unknown): string[] => {
    const values = typeof value === "string" ? value.split(" ") : Array.isArray(value) ? value : [];
    return values.filter((v): v is string => typeof v === "string" && /^(?:urn:[a-zA-Z0-9:_/.-]{1,180}|read|write|offline_access)$/.test(v));
  };
  try {
    const app = await api<{ scopes?: unknown; scope?: unknown }>(`/applications/${env("ML_APP_ID")}`, token, AbortSignal.timeout(12_000));
    applicationScopes = scopes(app.scopes ?? app.scope);
  } catch { /* This metadata may require application-owner permissions. */ }
  try {
    const grants = await api<{ app_id?: number; id?: number; scopes?: unknown; scope?: unknown }[]>(`/users/${seller}/applications`, token, AbortSignal.timeout(12_000));
    const grant = Array.isArray(grants) ? grants.find(g => String(g.app_id ?? g.id) === env("ML_APP_ID")) : null;
    grantedScopes = scopes(grant?.scopes ?? grant?.scope);
  } catch { /* Never expose complete grant or application responses. */ }
  const catalog = await readCatalog();
  return { seller, checks, applicationScopes, grantedScopes, catalog };
}

// Only the server knows this key. Redis never stores readable OAuth tokens.
export function seal(value: unknown): string {
  const iv = randomBytes(12);
  const key = createHash("sha256").update(env("ML_ADMIN_SECRET")).digest();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(value)), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function unseal<T>(value: string): T {
  const bytes = Buffer.from(value, "base64url");
  const key = createHash("sha256").update(env("ML_ADMIN_SECRET")).digest();
  const decipher = createDecipheriv("aes-256-gcm", key, bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString());
}

export async function redis<T>(...command: (string | number)[]): Promise<T> {
  const url = new URL(env("UPSTASH_REDIS_REST_URL"));
  if (url.protocol !== "https:") throw new IntegrationError("config");
  const res = await fetch(url, {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(8_000),
    headers: { Authorization: `Bearer ${env("UPSTASH_REDIS_REST_TOKEN")}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new IntegrationError("upstream");
  const body = await res.json();
  if (body.error) throw new IntegrationError("upstream");
  return body.result as T;
}

export async function getStored<T>(key: string): Promise<T | null> {
  const raw = await redis<string | null>("GET", PREFIX + key);
  return raw ? JSON.parse(raw) as T : null;
}

export async function lock(name: string, ttl: number): Promise<string | null> {
  const owner = randomUUID();
  return await redis("SET", PREFIX + name, owner, "NX", "PX", ttl) === "OK" ? owner : null;
}

export async function unlock(name: string, owner: string): Promise<void> {
  await redis("EVAL", "if redis.call('GET',KEYS[1]) == ARGV[1] then return redis.call('DEL',KEYS[1]) end return 0", 1, PREFIX + name, owner);
}

async function commitUnderLock(lockName: string, owner: string, key: string, value: string): Promise<void> {
  const done = await redis<number>("EVAL", "if redis.call('GET',KEYS[1]) ~= ARGV[1] then return 0 end redis.call('SET',KEYS[2],ARGV[2]); return 1", 2, PREFIX + lockName, PREFIX + key, owner, value);
  if (!done) throw new IntegrationError("busy");
}

async function tokenRequest(fields: Record<string, string>): Promise<Tokens> {
  const res = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(12_000),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env("ML_APP_ID"), client_secret: env("ML_APP_SECRET"), ...fields }),
  });
  if (!res.ok) throw new IntegrationError(res.status === 400 || res.status === 401 ? "authorization" : "upstream");
  const body = await res.json();
  const expected = await connectedSellerId();
  if (!body.access_token || !body.refresh_token || !Number.isFinite(body.expires_in) || !Number.isSafeInteger(body.user_id) || body.user_id <= 0 || (expected && String(body.user_id) !== expected)) throw new IntegrationError("authorization");
  return { access_token: body.access_token, refresh_token: body.refresh_token, user_id: body.user_id, expiresAt: Date.now() + body.expires_in * 1000 };
}

// An optional configured ID takes precedence; otherwise the first administrator-
// initiated OAuth connection pins the seller permanently in durable storage.
export async function connectedSellerId(): Promise<string | null> {
  const configured = process.env.ML_SELLER_ID;
  const pinned = await getStored<string>("seller");
  if (configured && pinned && configured !== pinned) throw new IntegrationError("authorization");
  const seller = configured || pinned;
  if (seller && !/^\d+$/.test(seller)) throw new IntegrationError("authorization");
  return seller || null;
}

async function getTokens(): Promise<Tokens> {
  const raw = await redis<string | null>("GET", PREFIX + "tokens");
  if (!raw) throw new IntegrationError("authorization");
  const tokens = unseal<Tokens>(raw);
  if (String(tokens.user_id) !== await connectedSellerId()) throw new IntegrationError("authorization");
  return tokens;
}

async function accessToken(): Promise<string> {
  let tokens = await getTokens();
  if (tokens.expiresAt > Date.now() + 60_000) return tokens.access_token;
  // Refresh tokens are single-use: only one server instance may rotate them.
  const owner = await lock("token-lock", 30_000);
  if (!owner) throw new IntegrationError("busy");
  try {
    tokens = await getTokens();
    if (tokens.expiresAt > Date.now() + 60_000) return tokens.access_token;
    const next = await tokenRequest({ grant_type: "refresh_token", refresh_token: tokens.refresh_token });
    await commitUnderLock("token-lock", owner, "tokens", seal(next));
    return next.access_token;
  } finally { await unlock("token-lock", owner); }
}

async function api<T>(path: string, token: string, signal: AbortSignal): Promise<T> {
  const res = await fetch("https://api.mercadolibre.com" + path, {
    cache: "no-store", headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.any([signal, AbortSignal.timeout(12_000)]),
  });
  if (!res.ok) throw new IntegrationError(res.status === 401 || res.status === 403 ? "authorization" : "upstream");
  return res.json() as Promise<T>;
}

// Server-only adapter used by the authenticated management interface. It never
// exposes bearer credentials and cannot address OAuth, apps, or external URLs.
export async function managementApi(path: string, version?: string): Promise<{ status: number; data: unknown; version?: string }> {
  const seller = await connectedSellerId();
  const parsed = new URL(path, "https://api.mercadolibre.com");
  if (!seller || parsed.origin !== "https://api.mercadolibre.com" || !path.startsWith("/") || path.startsWith("//") || ![
    /^\/items\/MLA\d+(?:\/(?:description|prices|sale_price|compatibilities))?$/,
    new RegExp(`^/users/${seller}/(?:items/search|shipping_options/free)$`),
    /^\/user-products\/MLAU\d+(?:\/stock)?$/,
    /^\/sites\/MLA\/listing_prices$/,
    new RegExp(`^/seller-promotions/users/${seller}$`),
    /^\/seller-promotions\/(?:items\/MLA\d+|promotions\/[A-Za-z0-9_-]+(?:\/items)?)$/,
    /^\/advertising\/advertisers$/,
    /^\/advertising\/MLA\/advertisers\/\d+\/product_ads\/(?:campaigns\/search|ads\/search|ad_groups\/search)$/,
    /^\/advertising\/MLA\/product_ads\/campaigns\/\d+(?:\/ad_groups\/metrics)?$/,
    /^\/advertising\/MLA\/product_ads\/ad_groups\/\d+(?:\/ads)?$/,
  ].some(pattern => pattern.test(parsed.pathname))) throw new IntegrationError("authorization");
  const token = await accessToken();
  const response = await fetch(parsed, { method: "GET", cache: "no-store", headers: { Authorization: `Bearer ${token}`, ...(version ? { "Api-Version": version } : {}) }, signal: AbortSignal.timeout(12_000) });
  const data: unknown = await response.json().catch(() => ({ error: "Respuesta no disponible" }));
  return { status: response.status, data, version: response.headers.get("x-version") || undefined };
}

export function normalizeItem(item: MeliItem, sale: SalePrice, sellerId: string): CatalogItem | null {
  if (String(item.seller_id) !== sellerId || item.status !== "active") return null;
  const link = new URL(item.permalink);
  if (!["mercadolibre.com.ar", "www.mercadolibre.com.ar", "articulo.mercadolibre.com.ar"].includes(link.hostname) || !["http:", "https:"].includes(link.protocol)) throw new IntegrationError("upstream");
  link.protocol = "https:";
  if (!Number.isFinite(sale.amount) || sale.amount <= 0 || sale.currency_id !== "ARS") throw new IntegrationError("upstream");
  const picture = item.pictures?.[0]?.secure_url || item.pictures?.[0]?.url;
  let image: string | null = null;
  if (picture) {
    const url = new URL(picture);
    if (url.hostname.endsWith(".mlstatic.com") && ["http:", "https:"].includes(url.protocol)) { url.protocol = "https:"; image = url.href; }
  }
  return {
    id: item.id, title: item.title, price: sale.amount,
    originalPrice: typeof sale.regular_amount === "number" && sale.regular_amount > sale.amount ? sale.regular_amount : null,
    currency: sale.currency_id, image, permalink: link.href, available: item.available_quantity > 0,
    freeShipping: Boolean(item.shipping?.free_shipping), condition: item.condition,
    sku: item.attributes?.find((a) => a.id === "SELLER_SKU")?.value_name || item.seller_custom_field || null,
  };
}

async function collectItems(token: string, signal: AbortSignal): Promise<CatalogItem[]> {
  const seller = await connectedSellerId();
  if (!seller) throw new IntegrationError("authorization");
  const ids = new Set<string>();
  let scroll: string | undefined;
  do {
    const query = new URLSearchParams({ status: "active", search_type: "scan", limit: "100" });
    if (scroll) query.set("scroll_id", scroll);
    const page = await api<{ results: string[]; scroll_id?: string; paging: { total: number } }>(`/users/${seller}/items/search?${query}`, token, signal);
    if (!Array.isArray(page.results) || page.results.some((id) => !/^MLA\d+$/.test(id))) throw new IntegrationError("upstream");
    if (!page.results.length) break;
    const before = ids.size;
    page.results.forEach((id) => ids.add(id));
    if (ids.size >= page.paging.total) break;
    if (!page.scroll_id || ids.size === before) throw new IntegrationError("upstream");
    scroll = page.scroll_id;
  } while (!signal.aborted);
  signal.throwIfAborted();
  const result: CatalogItem[] = [];
  const all = [...ids];
  // Small parallel batches respect rate limits and keep the full snapshot atomic.
  for (let i = 0; i < all.length; i += 6) {
    const batch = await Promise.all(all.slice(i, i + 6).map(async (id) => {
      const item = await api<MeliItem>(`/items/${id}`, token, signal);
      if (String(item.seller_id) !== seller || item.status !== "active") return null;
      const price = await api<SalePrice>(`/items/${id}/sale_price?context=channel_marketplace`, token, signal);
      return normalizeItem(item, price, seller);
    }));
    result.push(...batch.filter((item): item is CatalogItem => item !== null));
  }
  return result.sort((a, b) => a.title.localeCompare(b.title, "es"));
}

export async function readCatalog(): Promise<CatalogResponse> {
  if (!integrationConfigured()) return { items: [], updatedAt: null, status: "unavailable" };
  const cached = await getStored<Snapshot>("catalog");
  const revision = Number(await redis("GET", PREFIX + "revision") || 0);
  const age = cached ? Date.now() - Date.parse(cached.updatedAt) : Infinity;
  if (cached && age < MAX_AGE && cached.revision === revision) return { ...cached, status: "ready" };
  // Event bursts may mark a catalog dirty repeatedly; bound resyncs to one / 10 sec.
  if (cached && age < 10_000) return { ...cached, status: "ready" };
  const owner = await lock("catalog-lock", 70_000);
  if (!owner) {
    if (cached && age < MAX_STALE_AGE) return { ...cached, status: "ready" };
    throw new IntegrationError("busy");
  }
  try {
    const snapshot: Snapshot = {
      items: await collectItems(await accessToken(), AbortSignal.timeout(45_000)),
      updatedAt: new Date().toISOString(), revision,
    };
    await commitUnderLock("catalog-lock", owner, "catalog", JSON.stringify(snapshot));
    return { items: snapshot.items, updatedAt: snapshot.updatedAt, status: "ready" };
  } finally { await unlock("catalog-lock", owner); }
}

export async function createAuthorization(): Promise<{ url: string; state: string }> {
  if (!integrationConfigured()) throw new IntegrationError("config");
  const state = randomBytes(32).toString("base64url");
  await redis("SET", PREFIX + "oauth:" + state, "1", "EX", 600);
  const url = new URL("https://auth.mercadolibre.com.ar/authorization");
  url.search = new URLSearchParams({ response_type: "code", client_id: env("ML_APP_ID"), redirect_uri: origin() + "/api/mercadolibre/callback", state }).toString();
  return { url: url.href, state };
}

export async function finishAuthorization(code: string, state: string): Promise<void> {
  if (!/^[A-Za-z0-9_-]{43}$/.test(state) || await redis("GETDEL", PREFIX + "oauth:" + state) !== "1") throw new IntegrationError("authorization");
  const owner = await lock("token-lock", 30_000);
  if (!owner) throw new IntegrationError("busy");
  try {
    const tokens = await tokenRequest({ grant_type: "authorization_code", code, redirect_uri: origin() + "/api/mercadolibre/callback" });
    await redis("SET", PREFIX + "seller", JSON.stringify(String(tokens.user_id)), "NX");
    if (String(tokens.user_id) !== await connectedSellerId()) throw new IntegrationError("authorization");
    await commitUnderLock("token-lock", owner, "tokens", seal(tokens));
    await redis("INCR", PREFIX + "revision");
  } finally { await unlock("token-lock", owner); }
}

export function validNotification(body: Record<string, unknown>, sellerId: string | null = process.env.ML_SELLER_ID || null): boolean {
  return Boolean(sellerId) && String(body.user_id) === sellerId && String(body.application_id) === process.env.ML_APP_ID
    && ["items", "items_prices"].includes(String(body.topic))
    && typeof body.resource === "string" && /^\/items\/MLA\d+(?:\/prices)?$/.test(body.resource);
}

export async function recordNotification(): Promise<void> {
  // Notifications are hints, never trusted product data or arbitrary URLs to fetch.
  // Persist before acknowledging. New hints during a sync remain pending via revision.
  await redis("INCR", PREFIX + "revision");
}


export async function managementUploadPicture(file: File) {
  const seller = await connectedSellerId();
  if (!seller || file.size>4*1024*1024 || file.size<8 || !["image/png","image/jpeg"].includes(file.type)) throw new IntegrationError("authorization");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const png = bytes[0]===137 && bytes[1]===80 && bytes[2]===78 && bytes[3]===71;
  const jpeg = bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
  if ((file.type==="image/png" && !png) || (file.type==="image/jpeg" && !jpeg)) throw new IntegrationError("upstream");
  const form = new FormData();form.append("file",file);
  const response=await fetch("https://api.mercadolibre.com/pictures/items/upload",{method:"POST",headers:{Authorization:`Bearer ${await accessToken()}`},body:form,cache:"no-store",signal:AbortSignal.timeout(30000)});
  const raw=await response.json().catch(()=>({})) as {id?:string;variations?:{size:string;secure_url:string}[];message?:string};
  if(response.ok && raw.id && /^[A-Za-z0-9_-]{1,120}$/.test(raw.id)) {
    await redis("SET",PREFIX+"uploaded-picture:"+raw.id,seal({seller}),"EX",30*24*3600);
    return {status:response.status,data:{id:raw.id,variations:raw.variations}};
  }
  return {status:response.ok ? 502 : response.status,data:{message:raw.message || "No se pudo cargar la imagen"}};
}
export async function managementPicturesOwned(ids: string[]) {
  const seller=await connectedSellerId();
  if(!seller || ids.length!==4 || new Set(ids).size!==4) return false;
  for(const id of ids) {
    if(!/^[A-Za-z0-9_-]{1,120}$/.test(id)) return false;
    const saved=await redis<string|null>("GET",PREFIX+"uploaded-picture:"+id);
    if(!saved || unseal<{seller:string}>(saved).seller!==seller) return false;
  }
  return true;
}
export async function managementWrite(path: string, method: "PUT" | "POST" | "DELETE", body: Record<string, unknown>) {
  if (![/^\/items\/MLA\d+(?:\/description)?$/, /^\/seller-promotions\/items\/MLA\d+\?app_version=v2(?:&[A-Za-z0-9_=-]+)*$/, /^\/advertising\/MLA\/product_ads\/(?:campaigns|ad_groups)\/\d+$/].some(pattern=>pattern.test(path))) throw new IntegrationError("authorization");
  const token = await accessToken();
  const before = await managementApi(path.startsWith("/seller-promotions/") ? path.split("?")[0]+"?app_version=v2" : path, path.startsWith("/advertising/") ? "2" : undefined);
  if (before.status!==200) throw new IntegrationError("upstream");
  await redis("SET", `${PREFIX}change-backup:${Date.now()}:${randomBytes(8).toString("hex")}`, seal({path,method,body,before:before.data,date:new Date().toISOString()}), "EX", 30*24*3600);
  const response = await fetch(`https://api.mercadolibre.com${path}`, {method,cache:"no-store",headers:{Authorization:`Bearer ${token}`,"Content-Type":"application/json", ...(path.startsWith("/advertising/") ? {"Api-Version":"2"} : {})},...(method!=="DELETE" ? {body:JSON.stringify(body)} : {}),signal:AbortSignal.timeout(12000)});
  const data: unknown = await response.json().catch(()=>({}));
  if (response.ok) await recordNotification();
  return {status:response.status,data};
}

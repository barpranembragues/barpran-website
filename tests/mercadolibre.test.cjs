const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const ml = require('../.testbuild/mercadolibre.js');

const PREFIX = 'barpran:ml:v1:';
const originalFetch = global.fetch;
let data, reads, tokenCalls, pageSize, total, failAt, inactive, notifyDuringRead;
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
function item(id = 'MLA1') {
  return { id, seller_id: 123, status: 'active', title: `Kit ${id}`, price: 200,
    currency_id: 'ARS', available_quantity: 2, permalink: `https://articulo.mercadolibre.com.ar/${id}`,
    pictures: [{ secure_url: 'https://http2.mlstatic.com/foto.webp' }], condition: 'new',
    shipping: { free_shipping: true }, attributes: [{ id: 'SELLER_SKU', value_name: 'KE701290' }] };
}
const price = { amount: 150, regular_amount: 200, currency_id: 'ARS' };

function redisCommand(command) {
  const [op, ...args] = command;
  if (op === 'GET') return data.get(args[0]) ?? null;
  if (op === 'GETDEL') { const v = data.get(args[0]) ?? null; data.delete(args[0]); return v; }
  if (op === 'SET') {
    if (args.includes('NX') && data.has(args[0])) return null;
    data.set(args[0], String(args[1])); return 'OK';
  }
  if (op === 'INCR') { const next = Number(data.get(args[0]) || 0) + 1; data.set(args[0], String(next)); return next; }
  if (op === 'EVAL') {
    const [script, count, ...values] = args;
    const keys = values.slice(0, Number(count)), argv = values.slice(Number(count));
    if (script.includes("~= ARGV[1]")) {
      if (data.get(keys[0]) !== argv[0]) return 0;
      data.set(keys[1], argv[1]); return 1;
    }
    if (data.get(keys[0]) === argv[0]) { data.delete(keys[0]); return 1; }
    return 0;
  }
  throw new Error(`Unexpected Redis command: ${op}`);
}

beforeEach(() => {
  Object.assign(process.env, { ML_APP_ID: '456', ML_APP_SECRET: 'test-only-app-secret', ML_SELLER_ID: '123',
    ML_ADMIN_SECRET: 'test-only-admin-key-with-at-least-32-characters', ML_SITE_ORIGIN: 'https://barpran.com.ar',
    UPSTASH_REDIS_REST_URL: 'https://test-only.upstash.io', UPSTASH_REDIS_REST_TOKEN: 'test-only-redis-secret' });
  data = new Map(); reads = 0; tokenCalls = 0; pageSize = 100; total = 1; failAt = null; inactive = null; notifyDuringRead = false;
  data.set(PREFIX + 'tokens', ml.seal({ access_token: 'test-only-access', refresh_token: 'test-only-refresh', user_id: 123, expiresAt: Date.now() + 60 * 60_000 }));
  global.fetch = async (url, options) => {
    const parsed = new URL(url);
    if (parsed.hostname === 'test-only.upstash.io') return response({ result: redisCommand(JSON.parse(options.body)) });
    assert.equal(parsed.hostname, 'api.mercadolibre.com');
    assert.equal(options.cache, 'no-store');
    if (parsed.pathname === '/oauth/token') {
      tokenCalls++;
      const fields = new URLSearchParams(options.body);
      assert.equal(fields.get('client_secret'), 'test-only-app-secret');
      return response({ access_token: 'test-only-new-access', refresh_token: 'test-only-new-refresh', expires_in: 21600, user_id: 123 });
    }
    assert.match(options.headers.Authorization, /^Bearer test-only/);
    if (parsed.pathname === '/users/123/items/search') {
      assert.equal(parsed.searchParams.get('status'), 'active');
      assert.equal(parsed.searchParams.get('search_type'), 'scan');
      const offset = Number(parsed.searchParams.get('scroll_id') || 0);
      const results = Array.from({ length: Math.max(0, Math.min(pageSize, total - offset)) }, (_, i) => `MLA${offset + i + 1}`);
      return response({ results, scroll_id: String(offset + pageSize), paging: { total } });
    }
    const match = parsed.pathname.match(/^\/items\/(MLA\d+)(\/sale_price)?$/);
    assert.ok(match, 'only validated item and sale_price endpoints are requested');
    if (match[1] === failAt) return response({ message: 'private upstream error' }, 500);
    if (match[2]) { assert.equal(parsed.searchParams.get('context'), 'channel_marketplace'); return response(price); }
    reads++;
    if (notifyDuringRead) { notifyDuringRead = false; await ml.recordNotification(); }
    return response({ ...item(match[1]), status: match[1] === inactive ? 'paused' : 'active' });
  };
});
afterEach(() => { global.fetch = originalFetch; });

test('management sessions reject unknown or malformed credentials', async () => {
  assert.equal(await ml.validAdminSession(), false);
  assert.equal(await ml.validAdminSession('forged'), false);
  assert.equal(await ml.validAdminSession('a'.repeat(43)), false);
  const session = await ml.createAdminSession();
  assert.equal(await ml.validAdminSession(session), true);
  assert.equal(await ml.validAdminSession(session.slice(0, -1) + (session.endsWith('a') ? 'b' : 'a')), false);
});

test('rotating the admin secret revokes management sessions', async () => {
  const session = await ml.createAdminSession();
  process.env.ML_ADMIN_SECRET = 'a-different-test-only-secret-with-32-characters';
  assert.equal(await ml.validAdminSession(session), false);
});

test('management diagnostics use only GET and redact app secrets and other grants', async () => {
  const delegate = global.fetch;
  global.fetch = async (url, options) => {
    const path = new URL(url).pathname;
    if (['/applications/456', '/users/123/applications', '/advertising/advertisers', '/seller-promotions/users/123'].includes(path)) {
      assert.ok(!options.method || options.method === 'GET');
      if (path === '/advertising/advertisers') { assert.equal(options.headers['Api-Version'], '1'); return response({ advertisers: [] }); }
      if (path === '/applications/456') return response({ scopes: ['urn:ml:mktp:publish-sync:/read-write', 'not-a-scope-secret'], client_secret: 'private-app-secret-do-not-return' });
      if (path === '/users/123/applications') return response([{ app_id: 456, scopes: ['read', 'offline_access'] }, { app_id: 999, scopes: ['write'], secret: 'private-other-grant' }]);
      return response({ error: 'unauthorized_scopes', sensitive: 'private-promotion-response' }, 403);
    }
    return delegate(url, options);
  };
  const report = await ml.managementDiagnostics();
  assert.deepEqual(report.applicationScopes, ['urn:ml:mktp:publish-sync:/read-write']);
  assert.deepEqual(report.grantedScopes, ['read', 'offline_access']);
  assert.equal(report.checks.find(check => check.label === 'Promociones').status, 403);
  assert.doesNotMatch(JSON.stringify(report), /private-|test-only-access|not-a-scope-secret/);
});

test('promotional price, SKU, original geometry image and trusted purchase link', () => {
  const product = ml.normalizeItem(item(), price, '123');
  assert.equal(product.price, 150); assert.equal(product.originalPrice, 200);
  assert.equal(product.sku, 'KE701290'); assert.equal(product.freeShipping, true);
  assert.equal(product.image, 'https://http2.mlstatic.com/foto.webp');
  assert.equal(product.permalink, 'https://articulo.mercadolibre.com.ar/MLA1');
  assert.equal(ml.normalizeItem({ ...item(), status: 'paused' }, price, '123'), null);
  assert.equal(ml.normalizeItem({ ...item(), seller_id: 999 }, price, '123'), null);
  assert.throws(() => ml.normalizeItem({ ...item(), permalink: 'https://evil.example/MLA1' }, price, '123'));
  assert.throws(() => ml.normalizeItem(item(), { ...price, amount: NaN }, '123'));
  assert.equal(ml.normalizeItem({ ...item(), pictures: [{ secure_url: 'https://evil.example/photo' }] }, price, '123').image, null);
});

test('OAuth storage is encrypted, authenticated and administration key is checked', () => {
  const value = { access_token: 'private-test-value', refresh_token: 'another-private-test-value' };
  const encoded = ml.seal(value);
  assert.ok(!encoded.includes(value.access_token));
  assert.deepEqual(ml.unseal(encoded), value);
  const changed = Buffer.from(encoded, 'base64url'); changed[30] ^= 1;
  assert.throws(() => ml.unseal(changed.toString('base64url')));
  assert.equal(ml.adminAuthorized(process.env.ML_ADMIN_SECRET), true);
  assert.equal(ml.adminAuthorized('wrong'), false);
});

test('missing configuration makes no external requests and publishes no fake catalog', async () => {
  delete process.env.ML_APP_ID;
  assert.deepEqual(await ml.readCatalog(), { items: [], updatedAt: null, status: 'unavailable' });
  assert.equal(reads, 0);
});

test('scan imports more than 1000 listings, excludes paused items and reuses fresh snapshot', async () => {
  total = 1105; inactive = 'MLA14';
  const catalog = await ml.readCatalog();
  assert.equal(catalog.items.length, 1104);
  assert.equal(catalog.items.find((x) => x.id === 'MLA14'), undefined);
  assert.ok(catalog.items.find((x) => x.id === 'MLA1105'));
  assert.equal(catalog.items[0].price, 150);
  const firstReads = reads;
  await ml.readCatalog(); assert.equal(reads, firstReads);
});

test('partial API failure never overwrites a complete snapshot', async () => {
  total = 12;
  await ml.readCatalog();
  const old = JSON.parse(data.get(PREFIX + 'catalog'));
  old.updatedAt = new Date(Date.now() - 6 * 60_000).toISOString();
  data.set(PREFIX + 'catalog', JSON.stringify(old));
  failAt = 'MLA9';
  await assert.rejects(ml.readCatalog());
  assert.deepEqual(JSON.parse(data.get(PREFIX + 'catalog')), old);
});

test('expired single-use refresh token rotates once and persists encrypted replacement', async () => {
  data.set(PREFIX + 'tokens', ml.seal({ access_token: 'test-only-old-access', refresh_token: 'test-only-refresh', user_id: 123, expiresAt: Date.now() - 1 }));
  await ml.readCatalog();
  assert.equal(tokenCalls, 1);
  const tokens = ml.unseal(data.get(PREFIX + 'tokens'));
  assert.equal(tokens.refresh_token, 'test-only-new-refresh');
  await ml.readCatalog(); assert.equal(tokenCalls, 1);
});

test('change during import remains pending and triggers another import', async () => {
  notifyDuringRead = true;
  await ml.readCatalog();
  const old = JSON.parse(data.get(PREFIX + 'catalog'));
  assert.equal(old.revision, 0); assert.equal(data.get(PREFIX + 'revision'), '1');
  old.updatedAt = new Date(Date.now() - 11_000).toISOString();
  data.set(PREFIX + 'catalog', JSON.stringify(old));
  await ml.readCatalog();
  assert.equal(reads, 2);
  assert.equal(JSON.parse(data.get(PREFIX + 'catalog')).revision, 1);
});

test('a concurrent visitor cannot start a second rebuild or rotate tokens twice', async () => {
  data.set(PREFIX + 'catalog-lock', 'another-worker');
  await assert.rejects(ml.readCatalog(), (err) => err.kind === 'busy');
  assert.equal(reads, 0); assert.equal(tokenCalls, 0);
});

test('webhook accepts only expected application, seller, topic and item resource', () => {
  const message = { application_id: 456, user_id: 123, topic: 'items', resource: '/items/MLA1' };
  assert.equal(ml.validNotification(message), true);
  assert.equal(ml.validNotification({ ...message, topic: 'items_prices', resource: '/items/MLA1/prices' }), true);
  assert.equal(ml.validNotification({ ...message, resource: 'https://evil.example/private' }), false);
  assert.equal(ml.validNotification({ ...message, application_id: 999 }), false);
  assert.equal(ml.validNotification({ ...message, user_id: 999 }), false);
  assert.equal(ml.validNotification({ ...message, topic: 'orders_v2' }), false);
});

test('OAuth authorization is bound to one-use state and configured seller', async () => {
  const auth = await ml.createAuthorization();
  const url = new URL(auth.url);
  assert.equal(url.hostname, 'auth.mercadolibre.com.ar');
  assert.equal(url.searchParams.get('redirect_uri'), 'https://barpran.com.ar/api/mercadolibre/callback');
  await ml.finishAuthorization('test-only-code', auth.state);
  await assert.rejects(ml.finishAuthorization('test-only-code', auth.state));
  assert.equal(tokenCalls, 1);
  const other = await ml.createAuthorization();
  process.env.ML_SELLER_ID = '999';
  await assert.rejects(ml.finishAuthorization('test-only-code', other.state));
  assert.equal(ml.unseal(data.get(PREFIX + 'tokens')).user_id, 123);
});

test('first administrator OAuth connection pins the seller without a manual ID', async () => {
  delete process.env.ML_SELLER_ID;
  data.delete(PREFIX + 'tokens');
  assert.equal(ml.integrationConfigured(), true);
  assert.equal(await ml.connectedSellerId(), null);
  const auth = await ml.createAuthorization();
  await ml.finishAuthorization('test-only-code', auth.state);
  assert.equal(await ml.connectedSellerId(), '123');
  assert.equal((await ml.readCatalog()).items.length, 1);
  const seller = await ml.connectedSellerId();
  assert.equal(ml.validNotification({ application_id: 456, user_id: 123, topic: 'items', resource: '/items/MLA1' }, seller), true);
  assert.equal(ml.validNotification({ application_id: 456, user_id: 999, topic: 'items', resource: '/items/MLA1' }, seller), false);
});

test('a subsequent OAuth connection cannot replace the pinned account', async () => {
  delete process.env.ML_SELLER_ID;
  data.set(PREFIX + 'seller', JSON.stringify('123'));
  const old = data.get(PREFIX + 'tokens');
  const fetchBefore = global.fetch;
  global.fetch = async (url, options) => new URL(url).pathname === '/oauth/token'
    ? response({ access_token: 'test-only-other-access', refresh_token: 'test-only-other-refresh', expires_in: 21600, user_id: 999 })
    : fetchBefore(url, options);
  const auth = await ml.createAuthorization();
  await assert.rejects(ml.finishAuthorization('test-only-code', auth.state), err => err.kind === 'authorization');
  assert.equal(await ml.connectedSellerId(), '123');
  assert.equal(data.get(PREFIX + 'tokens'), old);
});

test('stored tokens and manual seller settings must match the pinned seller', async () => {
  delete process.env.ML_SELLER_ID;
  data.set(PREFIX + 'seller', JSON.stringify('999'));
  await assert.rejects(ml.readCatalog(), err => err.kind === 'authorization');
  assert.equal(reads, 0);
  process.env.ML_SELLER_ID = '123';
  await assert.rejects(ml.connectedSellerId(), err => err.kind === 'authorization');
});


test('private management rejects credential endpoints and foreign seller resources', async () => {
  for (const path of ['/oauth/token', '/applications/456', '/users/999/items/search', '//evil.example/items/MLA1']) await assert.rejects(ml.managementApi(path));
  assert.equal((await ml.managementApi('/items/MLA1')).status, 200);
});

test('private item reads check seller ownership before reading descriptions', async () => {
  const management = require('../.testbuild/ml-management.js');
  const delegate = global.fetch;
  global.fetch = async (url, options) => new URL(url).pathname === '/items/MLA999' ? response({...item('MLA999'),seller_id:999}) : delegate(url,options);
  await assert.rejects(management.managementQuery({resource:'description',id:'MLA999'}));
  await assert.rejects(management.managementQuery({resource:'oauth'}));
  await assert.rejects(management.managementQuery({resource:'item',id:'MLA1',params:{bad: {}}}));
});

test('item changes validate SKU and preserve pictures and sale terms in request', async () => {
 const management=require('../.testbuild/ml-management.js');const delegate=global.fetch;let writes=[];
 global.fetch=async(url,options)=>{
  if(new URL(url).pathname==='/items/MLA1') {
   if(options.method==='PUT') {writes.push(JSON.parse(options.body));return response({...item(),price:150000});}
   return response({...item(),price:200000,attributes:[{id:'SELLER_SKU',value_name:'KE701039'}]});
  }
  return delegate(url,options);
 };
 await assert.rejects(management.managementChange({action:'item',id:'MLA1',sku:'KE728102',expectedPrice:200000,price:150000}));
 await assert.rejects(management.managementChange({action:'item',id:'MLA1',sku:'KE701039',expectedPrice:100000,price:150000}));
 assert.equal(writes.length,0);
 assert.equal((await management.managementChange({action:'item',id:'MLA1',sku:'KE701039',expectedPrice:200000,price:150000,quantity:7})).status,200);
 assert.deepEqual(writes,[{price:150000,available_quantity:7}]);
});

test('promotion changes reject seller discounts greater than six percent', async()=>{
 const management=require('../.testbuild/ml-management.js');const delegate=global.fetch;
 global.fetch=async(url,options)=>new URL(url).pathname==='/seller-promotions/items/MLA1' ? response([{id:'P-MLA1',type:'DEAL',status:'candidate',original_price:200000,min_discounted_price:100000,max_discounted_price:190000}]) : delegate(url,options);
 await assert.rejects(management.managementChange({action:'promotion',id:'MLA1',sku:'KE701290',promotionId:'P-MLA1',dealPrice:180000}));
});

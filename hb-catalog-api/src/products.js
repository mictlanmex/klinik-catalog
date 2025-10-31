// hb-catalog-api/src/products.js
const { app } = require('@azure/functions');

// === ENV ===
const SHOP = process.env.SHOPIFY_SHOP;                      // p.ej. haut-boutique-6907.myshopify.com
const TOKEN = process.env.SHOPIFY_TOKEN;                    // shpat_...
const CLINIC_LOCATION_ID = process.env.CLINIC_LOCATION_ID;  // gid://shopify/Location/...
// Acepta ambos nombres (para cubrir el caso con/ sin "ES"):
const TOP_TAG = (
  process.env.FEATURE_TOPDOCTORES_TAG ||
  process.env.FEATURE_TOPDOCTORS_TAG ||
  'topdoctores'
).toLowerCase();

if (!SHOP || !TOKEN || !CLINIC_LOCATION_ID) {
  // Nota: esto solo se evalúa en runtime; ayuda a detectar un mal app settings
  console.warn('[products] Faltan variables de entorno:',
    JSON.stringify({
      SHOPIFY_SHOP: !!SHOP,
      SHOPIFY_TOKEN: !!TOKEN,
      CLINIC_LOCATION_ID: !!CLINIC_LOCATION_ID,
      TOP_TAG
    })
  );
}

const GQL_ENDPOINT = `https://${SHOP}/admin/api/2024-07/graphql.json`;

// Normaliza acentos y mayúsculas
const norm = (s) => (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// Construye la query de Shopify (texto/vendor/tags)
function buildProductQuery({ query }) {
  const terms = (query || '')
    .split(' ')
    .map(t => t.trim())
    .filter(Boolean);

  if (!terms.length) return 'status:active';

  // Busca cada término en title/vendor/tag con prefijo
  const parts = terms.map(term => {
    // IMPORTANTE: Shopify search no admite comillas ni caracteres raros tal cual;
    // si quieres endurecer, aquí podrías sanear más el término.
    return `(title:${term}* OR vendor:${term}* OR tag:${term}*)`;
  });

  parts.push(`status:active`);
  return parts.join(' AND ');
}

// Ejecuta una consulta GraphQL al Admin API de Shopify (con fallback a node-fetch si hace falta)
async function shopifyGql(query, variables) {
  let _fetch = globalThis.fetch;
  if (typeof _fetch !== 'function') {
    // Fallback (por si el runtime no trae fetch global)
    _fetch = (await import('node-fetch')).default;
  }

  const res = await _fetch(GQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Shopify HTTP ${res.status}: ${text}`);
  }
  const json = await res.json().catch(() => ({}));
  if (json.errors) {
    throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

// GraphQL: consulta inventario filtrando por locationId con inventoryLevel(locationId:)
const PRODUCTS_GQL = /* GraphQL */ `
query ProductsWithInventory($query:String!, $first:Int!, $after:String, $loc:ID!) {
  products(first: $first, after: $after, query: $query) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id
      title
      handle
      vendor
      tags
      featuredImage { url }
      variants(first: 50) {
        nodes {
          id
          title
          sku
          availableForSale
          inventoryItem {
            inventoryLevel(locationId: $loc) {
              quantities(names: "available") {
                name
                quantity
              }
              location { id name }
            }
          }
        }
      }
    }
  }
}
`;

// Registro de la función HTTP
app.http('products', {
  methods: ['GET'],
  authLevel: 'anonymous', // temporal; luego protegemos con AAD
  route: 'products',
  handler: async (req, ctx) => {
    try {
      // Validación de configuración
      if (!SHOP || !TOKEN || !CLINIC_LOCATION_ID) {
        return json(500, {
          error: 'Faltan variables de entorno requeridas (SHOPIFY_SHOP, SHOPIFY_TOKEN, CLINIC_LOCATION_ID).'
        });
      }

      // Parámetros de consulta
      const url = new URL(req.url);
      const firstRaw = url.searchParams.get('first') || '20';
      const first = Number.isFinite(parseInt(firstRaw, 10))
        ? Math.min(parseInt(firstRaw, 10), 50)
        : 20;
      const after = url.searchParams.get('after') || null;
      const query = url.searchParams.get('query') || '';

      // Construir query de Shopify
      const shopifyQuery = buildProductQuery({ query });

      // Ejecutar GraphQL
      const data = await shopifyGql(PRODUCTS_GQL, {
        query: shopifyQuery,
        first,
        after,
        loc: CLINIC_LOCATION_ID
      });

      const nodes = data?.products?.nodes || [];
      const pageInfo = data?.products?.pageInfo || { hasNextPage: false, endCursor: null };

      // Filtrar: solo variantes con stock disponible en la clínica
      const items = [];
      for (const p of nodes) {
        const isTopDoctor = (p.tags || []).map(norm).includes(norm(TOP_TAG));
        const variants = [];

        for (const v of (p.variants?.nodes ?? [])) {
          const lvl = v.inventoryItem?.inventoryLevel || null;
          const available = Array.isArray(lvl?.quantities)
            ? (lvl.quantities.find(q => q?.name === 'available')?.quantity ?? 0)
            : 0;

          if (available > 0) {
            variants.push({
              id: v.id,
              title: v.title,
              sku: v.sku,
              available
            });
          }
        }

        if (variants.length > 0) {
          items.push({
            id: p.id,
            title: p.title,
            handle: p.handle,
            vendor: p.vendor,
            isTopDoctor,
            image: p.featuredImage?.url || null,
            variants
          });
        }
      }

      return json(200, { pageInfo, count: items.length, items });

    } catch (err) {
      ctx.error?.(err);
      return json(500, { error: err.message || String(err) });
    }
  }
});

// Helper de respuesta JSON
function json(status, body) {
  return {
    status,
    headers: { 'Content-Type': 'application/json' },
    jsonBody: body
  };
}

const { app } = require('@azure/functions');

const SHOP = process.env.SHOPIFY_SHOP;                      // Ejemplo: haut-boutique-6907.myshopify.com
const TOKEN = process.env.SHOPIFY_TOKEN;                    // shpat_...
const CLINIC_LOCATION_ID = process.env.CLINIC_LOCATION_ID;  // gid://shopify/Location/...
const TOP_TAG = (process.env.FEATURE_TOPDOCTORS_TAG || 'topdoctores').toLowerCase();

const GQL_ENDPOINT = `https://${SHOP}/admin/api/2024-07/graphql.json`;

// Normaliza acentos y mayúsculas
const norm = (s) => (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// Construye la query de Shopify (texto/vendor/tags)
function buildProductQuery({ query }) {
  const terms = (query || '').split(' ').map(t => t.trim()).filter(Boolean);
  if (!terms.length) return 'status:active';

  const parts = terms.map(term => {
    return `(title:${term}* OR vendor:${term}* OR tag:${term}*)`;
  });
  
  parts.push(`status:active`);
  return parts.join(' AND ');
}

// Ejecuta una consulta GraphQL al Admin API de Shopify
async function shopifyGql(query, variables) {
  const res = await fetch(GQL_ENDPOINT, {
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
  const json = await res.json();
  if (json.errors) throw new Error(`Shopify GraphQL errors: ${JSON.stringify(json.errors)}`);
  return json.data;
}

// GraphQL actualizado: consulta el inventario con inventoryLevel(locationId:)
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

app.http('products', {
  methods: ['GET'],
  authLevel: 'anonymous', // temporal, luego lo protegemos con login Microsoft
  route: 'products',
  handler: async (req, ctx) => {
    try {
      if (!SHOP || !TOKEN || !CLINIC_LOCATION_ID) {
        return json(500, { error: 'Faltan variables de entorno: SHOPIFY_SHOP, SHOPIFY_TOKEN o CLINIC_LOCATION_ID' });
      }

      // Leer parámetros de la URL
      const url = new URL(req.url);
      const first = Math.min(parseInt(url.searchParams.get('first') || '20', 10), 50);
      const after = url.searchParams.get('after') || null;
      const query = url.searchParams.get('query') || '';

      const shopifyQuery = buildProductQuery({ query });

      // Ejecutar query
      const data = await shopifyGql(PRODUCTS_GQL, {
        query: shopifyQuery,
        first,
        after,
        loc: CLINIC_LOCATION_ID
      });


      const { nodes, pageInfo } = data.products;

      // Filtrar y mapear productos con stock > 0 en la clínica
      const items = [];
      for (const p of nodes) {
        const isTopDoctor = (p.tags || []).map(norm).includes(norm(TOP_TAG));
        const variants = [];

        for (const v of p.variants.nodes) {
          const lvl = v.inventoryItem?.inventoryLevel || null;
          const available = lvl?.quantities?.find(q => q.name === 'available')?.quantity ?? 0;

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
      ctx.error(err);
      return json(500, { error: err.message || String(err) });
    }
  }
});

function json(status, body) {
  return {
    status,
    headers: { 'Content-Type': 'application/json' },
    jsonBody: body
  };
}

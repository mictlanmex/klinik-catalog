// hb-catalog-api/src/health.js
const { app } = require('@azure/functions');

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous', // Luego lo protegemos con AAD
  route: 'health',
  handler: async (_, ctx) => {
    try {
      // Simple health check
      return json(200, {
        status: 'ok',
        service: 'hb-catalog-api',
        ts: new Date().toISOString()
      });
    } catch (err) {
      ctx.error?.(err);
      return json(500, {
        status: 'error',
        error: err.message || String(err)
      });
    }
  }
});

// uniform JSON response helper
function json(status, body) {
  return {
    status,
    headers: { 'Content-Type': 'application/json' },
    jsonBody: body
  };
}

import { useEffect, useMemo, useState } from 'react'
import { msal, loginRequest } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE

async function apiFetch(url, options={}) {
  const account = msal.getActiveAccount() || msal.getAllAccounts()[0];
  const resp = await msal.acquireTokenSilent({ ...loginRequest, account })
    .catch(() => msal.acquireTokenPopup(loginRequest));
  const token = resp.accessToken;

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  return fetch(url, { ...options, headers });
}

export default function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isReady, setIsReady] = useState(false);
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(null)
  const [hasNext, setHasNext] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0) // 👈 nuevo

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    p.set('first', '20')
    if (query) p.set('query', query)
    if (cursor) p.set('after', cursor)
    return p.toString()
  }, [query, cursor])

  async function fetchData(reset = false) {
    try {
      setLoading(true); setError('')
      const url = `${API_BASE}/api/products?${qs}`
      const res = await apiFetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setHasNext(!!data?.pageInfo?.hasNextPage)
      if (reset) setItems(data.items || [])
      else setItems(prev => [...prev, ...(data.items || [])])
      setCursor(data?.pageInfo?.endCursor || null)
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  // Ensure user is logged in
  useEffect(() => {
    async function ensureLogin() {
      const accounts = msal.getAllAccounts();
      if (accounts.length === 0) {
        try {
          await msal.loginPopup(loginRequest);
        } catch (e) {
          setError("Login failed. Please try again.");
          return;
        }
      }
      msal.setActiveAccount(msal.getAllAccounts()[0]);
      setIsReady(true);
    }
    ensureLogin();
  }, []);

  // Fetch data only when ready and refreshKey changes
  useEffect(() => {
    if (isReady) {
      fetchData(true)
    }
  }, [isReady, refreshKey]) 

  const handleSearch = () => {
    setCursor(null)
    setItems([])
    setHasNext(false)
    setRefreshKey(x => x + 1) // 👈 fuerza recarga limpia sin loop
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  return (
    <div className="app">
      <header className="toolbar">
 <img src="/haut-logo.png" alt="Haut Boutique" className="logo" />

  <h1>Catálogo Haut Klinik</h1>
        <div className="filters">
          <input placeholder="Buscar por producto, marca o problema" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown} style={{minWidth: '300px'}} />
          <button onClick={handleSearch}>Buscar</button>
        </div>
      </header>

      {error && <div className="error">Error: {error}</div>}
      {!isReady && !error && <div className="loading">Iniciando sesión…</div>}
      {isReady && loading && <div className="loading">Cargando…</div>}

      {isReady && <div className="grid">
        {items.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>}

      {isReady && hasNext && (
        <div className="pagination">
          <button onClick={() => fetchData(false)} disabled={loading}>
            {loading ? 'Cargando…' : 'Cargar más'}
          </button>
        </div>
      )}
    </div>
  )
}

function ProductCard({ product }) {
  return (
    <div className="card">
      <div className="img-wrap">
        {product.image ? (
          <img src={product.image} alt={product.title} />
        ) : (
          <div className="placeholder">Sin imagen</div>
        )}
        {product.isTopDoctor && (
          <div className="badge" title="Top doctores">★</div>
        )}
      </div>
      <div className="info">
        <div className="title" title={product.title}>{product.title}</div>
        <div className="vendor">{product.vendor}</div>
        <div className="variants">
          {product.variants.map(v => (
            <span key={v.id} className="chip" title={`SKU ${v.sku}`}>
              {v.title} · {v.available}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

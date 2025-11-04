import { useEffect, useMemo, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE

export default function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
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

      // Get the auth token
      const authRes = await fetch('/.auth/me');
      const authData = await authRes.json();
      const token = authData.clientPrincipal.idToken;

      const url = `${API_BASE}/api/products?${qs}`
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
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

  // 👇 ahora solo se llama cuando refreshKey cambia, no cuando cursor cambia
  useEffect(() => {
    fetchData(true)
  }, [refreshKey]) 

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
      {loading && <div className="loading">Cargando…</div>}

      <div className="grid">
        {items.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {hasNext && (
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

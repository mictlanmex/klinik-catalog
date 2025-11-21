import { useEffect, useMemo, useState } from 'react'
import { msal, loginRequest, initializeMsal, getAccessToken } from "./auth";

const API_BASE = import.meta.env.VITE_API_BASE

async function apiFetch(url, options = {}) {
  try {
    const token = await getAccessToken();
    const headers = new Headers(options.headers || {});
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(url, { ...options, headers });
  } catch (error) {
    console.error("Error getting access token:", error);
    throw error;
  }
}

export default function App() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isReady, setIsReady] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(null)
  const [hasNext, setHasNext] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  const qs = useMemo(() => {
    const p = new URLSearchParams()
    p.set('first', '50') // Increased from 20 to 50 for better UX
    
    // On first load with no search query, default to "topdoctores"
    if (isFirstLoad && !query) {
      p.set('query', 'topdoctores')
    } else if (query) {
      p.set('query', query)
    }
    
    if (cursor) p.set('after', cursor)
    return p.toString()
  }, [query, cursor, isFirstLoad])

  async function fetchData(reset = false) {
    try {
      setLoading(true)
      setError('')
      const url = `${API_BASE}/api/products?${qs}`
      const res = await apiFetch(url)
      if (!res.ok) {
        const errorText = await res.text()
        throw new Error(`HTTP ${res.status}: ${errorText}`)
      }
      const data = await res.json()
      setHasNext(!!data?.pageInfo?.hasNextPage)
      if (reset) setItems(data.items || [])
      else setItems(prev => [...prev, ...(data.items || [])])
      setCursor(data?.pageInfo?.endCursor || null)
    } catch (e) {
      console.error("Fetch error:", e)
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  // Initialize MSAL and handle authentication
  useEffect(() => {
    async function initialize() {
      try {
        // Initialize MSAL (handles redirect if present)
        await initializeMsal();
        
        // Check if user is authenticated
        const accounts = msal.getAllAccounts();
        
        if (accounts.length === 0) {
          // No user logged in, trigger login
          try {
            await msal.loginRedirect(loginRequest);
            // Execution stops here, user will be redirected
          } catch (loginError) {
            console.error("Login redirect failed:", loginError);
            setError("No se pudo iniciar sesión. Por favor intente nuevamente.");
            setIsReady(true);
          }
        } else {
          // User is authenticated
          setIsAuthenticated(true);
          setIsReady(true);
        }
      } catch (initError) {
        console.error("MSAL initialization error:", initError);
        setError("Error al inicializar la autenticación. Por favor recargue la página.");
        setIsReady(true);
      }
    }
    
    initialize();
  }, []);

  // Fetch data when authenticated and ready
  useEffect(() => {
    if (isReady && isAuthenticated) {
      fetchData(true)
    }
  }, [isReady, isAuthenticated, refreshKey])

  const handleSearch = () => {
    setIsFirstLoad(false) // Mark that user has performed a search
    setCursor(null)
    setItems([])
    setHasNext(false)
    setRefreshKey(x => x + 1)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Show loading while initializing or redirecting to login
  if (!isReady) {
    return (
      <div className="app">
        <div className="loading">Iniciando sesión…</div>
      </div>
    )
  }

  // Show error if authentication failed
  if (error && !isAuthenticated) {
    return (
      <div className="app">
        <div className="error">Error: {error}</div>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="toolbar">
        <img src="/haut-logo.png" alt="Haut Boutique" className="logo" />
        <h1>Catálogo Haut Klinik</h1>
        <div className="filters">
          <input
            placeholder="Buscar por producto, marca o problema"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ minWidth: '300px' }}
          />
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

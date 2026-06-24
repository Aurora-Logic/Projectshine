import { Component } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import '@radix-ui/themes/styles.css'
import './index.css'
import { router } from './router.jsx'

// One render error anywhere must never mean a blank white page.
class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // surface the real error so a crash is diagnosable (was silently swallowed)
    console.error('[QuickCart] render crash:', error, info?.componentStack)
  }

  reset = (clear) => {
    if (clear) {
      try {
        Object.keys(localStorage)
          .filter(k => k.startsWith('qc-'))
          .forEach(k => localStorage.removeItem(k))
      } catch { /* storage unavailable — reload anyway */ }
    }
    window.location.reload()
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{
        minHeight: '100dvh', maxWidth: 480, margin: '0 auto', background: '#fff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 10, padding: 28, textAlign: 'center',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: '#30A46C', letterSpacing: -2 }}>QC</div>
        <div style={{ fontSize: 19, fontWeight: 800 }}>Something went wrong</div>
        <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>
          A glitch on our side — your cart and settings are safe.
        </div>
        {import.meta.env.DEV && (
          <pre style={{ fontSize: 11, color: '#b91c1c', background: '#fef2f2', padding: 10, borderRadius: 8, maxWidth: '100%', whiteSpace: 'pre-wrap', overflow: 'auto', textAlign: 'left' }}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
        )}
        <button
          onClick={() => this.reset(false)}
          style={{
            marginTop: 8, border: 'none', background: '#30A46C', color: '#fff',
            fontWeight: 800, fontSize: 15, borderRadius: 14, padding: '13px 34px',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Reload
        </button>
        <button
          onClick={() => this.reset(true)}
          style={{
            border: 'none', background: 'none', color: '#9ca3af', fontWeight: 700,
            fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Reset app data & reload
        </button>
      </div>
    )
  }
}

// StrictMode intentionally off: its dev-only double-rendering halves perceived
// performance in demos. Re-enable when hardening for production.
createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <RouterProvider router={router} />
  </ErrorBoundary>,
)

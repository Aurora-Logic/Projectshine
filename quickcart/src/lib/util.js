/* pure helpers (no React) — extracted from App.jsx (A5.1) */

const img = (id, w = 480) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=60`

const DAY = new Date().toDateString()

function daypart() {
  const h = new Date().getHours()
  if (h >= 5 && h < 7) return 'dawn'
  if (h >= 7 && h < 11) return 'morning'
  if (h >= 11 && h < 14) return 'noon'
  if (h >= 14 && h < 17) return 'afternoon'
  if (h >= 17 && h < 20) return 'sunset'
  return 'night'
}

function condition(code, windKmh) {
  if (code == null) return 'clear'
  if (code >= 95) return 'storm'
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow'
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'rain'
  if (code >= 45 && code <= 48) return 'fog'
  if (windKmh != null && windKmh >= 24) return 'wind'
  if (code === 3) return 'cloudy'
  if (code >= 1 && code <= 2) return 'partly'
  return 'clear'
}

function sparkle(e) {
  for (let i = 0; i < 6; i++) {
    const s = document.createElement('span')
    s.className = 'spark'
    s.style.background = ['#30A46C', 'var(--gold-9)', '#A2DEB7'][i % 3]
    s.style.left = `${e.clientX}px`
    s.style.top = `${e.clientY}px`
    s.style.setProperty('--dx', `${Math.random() * 90 - 45}px`)
    s.style.setProperty('--dy', `${-25 - Math.random() * 60}px`)
    document.body.appendChild(s)
    setTimeout(() => s.remove(), 550)
  }
}

function bulkNudge(p, qty) {
  if (!p.bulk || qty <= 0) return null
  const m = p.bulk.match(/(\d+)\+\s*@\s*₹([\d,]+)/)
  if (!m) return null
  const thr = +m[1]
  const bp = +m[2].replace(/,/g, '')
  const pct = Math.max(1, Math.round((1 - bp / p.price) * 100))
  return qty >= thr
    ? { done: true, text: `${pct}% bulk price unlocked` }
    : { done: false, text: `Add ${thr - qty} more → ${pct}% off` }
}

const scrollToId = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

function dealSecsLeft() {
  const left = Math.floor((Number(localStorage.getItem('qc-deal-end')) - Date.now()) / 1000)
  if (left > 0) return left
  localStorage.setItem('qc-deal-end', String(Date.now() + 30 * 60 * 1000))
  return 30 * 60
}

export { img, DAY, daypart, condition, sparkle, bulkNudge, scrollToId, dealSecsLeft }

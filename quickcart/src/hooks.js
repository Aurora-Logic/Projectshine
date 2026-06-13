import { useState, useEffect, useRef } from 'react'
import { daypart, condition } from './lib/util.js'
import { safeGet } from './lib/storage.js'
import { SKY } from './data.js'

/* shared hooks — extracted from App.jsx (A5.1) */

/* ---------- Adaptive sky: daypart (4) × condition (7) = 28 themes ---------- */


function useSkyTheme() {
  const [sky, setSky] = useState(() => {
    const m = window.location.hash.match(/#theme-(dawn|morning|noon|afternoon|sunset|night)-(\w+)/)
    if (m && SKY[m[1]]?.[m[2]]) return { dp: m[1], cond: m[2] }
    return { dp: daypart(), cond: 'clear' }
  })

  useEffect(() => {
    if (window.location.hash.startsWith('#theme-')) return
    // explicit opt-in only (qc-geo) — never a permission prompt on first paint
    if (safeGet('qc-geo') !== '1') return
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const r = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=weather_code,wind_speed_10m`,
          )
          const j = await r.json()
          setSky({
            dp: daypart(),
            cond: condition(j.current?.weather_code, j.current?.wind_speed_10m),
          })
        } catch { /* stay on time-based theme */ }
      },
      () => { /* permission denied → time-based theme */ },
      { timeout: 5000 },
    )
  }, [])

  return sky
}

/* Defer heavy content by one frame so page/sheet entrances animate jank-free */
function useNextFrame() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return ready
}

/* Escape + focus trap + focus restore for hand-rolled sheets.
   A module stack keeps Escape on the TOPMOST layer only. */
const sheetStack = []
function useSheetA11y(onClose, active = true) {
  const ref = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    if (!active) return undefined
    const token = {}
    sheetStack.push(token)
    const el = ref.current
    const prev = document.activeElement
    el?.focus({ preventScroll: true })
    const onKey = (e) => {
      if (sheetStack[sheetStack.length - 1] !== token) return
      if (e.key === 'Escape') closeRef.current?.()
      if (e.key === 'Tab' && el) {
        const f = el.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (!f.length) return
        const first = f[0]
        const last = f[f.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      const i = sheetStack.indexOf(token)
      if (i >= 0) sheetStack.splice(i, 1)
      document.removeEventListener('keydown', onKey)
      if (prev?.focus) prev.focus({ preventScroll: true })
    }
  }, [active])
  return ref
}

function useCountUp(target, go, dur = 900, delay = 0) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!go) { setV(0); return }
    let raf
    let start // anchor on the rAF clock itself — never mix with performance.now()
    const step = (t) => {
      if (start === undefined) start = t + delay
      const p = Math.min(1, Math.max(0, (t - start) / dur))
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    // hard guarantee: land on the exact target even if rAF is throttled (bg tabs, capture)
    const settle = setTimeout(() => setV(target), dur + delay + 150)
    return () => { cancelAnimationFrame(raf); clearTimeout(settle) }
  }, [go, target, dur, delay])
  return v
}

export { useSkyTheme, useNextFrame, useSheetA11y, useCountUp }

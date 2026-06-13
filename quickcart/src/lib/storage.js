/* Safe localStorage (A5.5) — never throws. Private-mode / storage-blocked
   browsers throw on any localStorage access; unguarded reads in render-path
   useState initializers would white-screen the whole app on first paint. */
import { useState } from 'react'

export const safeGet = (k) => { try { return localStorage.getItem(k) } catch { return null } }
export const safeSet = (k, v) => { try { localStorage.setItem(k, v) } catch { /* quota / blocked */ } }
export const safeRemove = (k) => { try { localStorage.removeItem(k) } catch { /* blocked */ } }
export const getJSON = (k, fallback = null) => {
  try { const s = JSON.parse(safeGet(k) || 'null'); return s ?? fallback } catch { return fallback }
}
export const setJSON = (k, v) => safeSet(k, JSON.stringify(v))

export function usePersisted(key, initial) {
  const [v, setV] = useState(() => getJSON(key, initial))
  const set = (next) => { setV(next); setJSON(key, next) }
  return [v, set]
}

/* the app's persisted keys, for reference (literals still used at call sites;
   migrate to KEYS.* opportunistically) */
export const KEYS = {
  auth: 'qc-auth', order: 'qc-order', lists: 'qc-lists', addr: 'qc-addr', addrSel: 'qc-addr-sel',
  note: 'qc-note', gst: 'qc-gst', paid: 'qc-paid', bills: 'qc-bills', coupon: 'qc-coupon',
  claims: 'qc-claims', mkt: 'qc-mkt', refs: 'qc-refs', visitsSite: 'qc-visits-site',
  visitsDisplay: 'qc-visits-display', estBrand: 'qc-est-brand', estCust: 'qc-est-cust',
  heroIdx: 'qc-hero-idx', festIdx: 'qc-fest-idx', dealEnd: 'qc-deal-end', geo: 'qc-geo',
  quizDay: 'qc-quiz-day', spinDay: 'qc-spin-day', streakDays: 'qc-streak-days',
  notif: 'qc-notif', priv: 'qc-priv',
}

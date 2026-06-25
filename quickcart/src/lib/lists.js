import { safeGet, safeSet } from './storage.js'

/* Project lists (per-site job baskets) — persisted to localStorage, shared by the
   product page's "save to list" sheet and the account Lists screen. */

export const LIST_SEED = [
  { id: 'l1', name: 'Sharma kitchen site', items: [{ id: 'ba1', n: 20 }, { id: 'ba2', n: 30 }, { id: 'dl1', n: 12 }] },
]

export function loadLists() {
  try {
    const s = JSON.parse(safeGet('qc-lists') || 'null')
    if (Array.isArray(s)) return s
  } catch { /* seed below */ }
  return LIST_SEED
}

export const saveLists = (l) => safeSet('qc-lists', JSON.stringify(l))

import { getJSON, setJSON } from './storage.js'

const KEY = 'qc-ui-variant'
const VARIANTS = ['control', 'experiment']

// Dev override: visit the app with #variant-control or #variant-experiment to switch
if (typeof window !== 'undefined') {
  const h = window.location.hash
  if (h === '#variant-control' || h === '#variant-experiment') {
    const v = h.slice(1).split('-').slice(1).join('-')
    setJSON(KEY, v)
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }
}

export function getVariant() {
  let v = getJSON(KEY)
  if (v !== 'control' && v !== 'experiment') {
    v = Math.random() < 0.5 ? 'control' : 'experiment'
    setJSON(KEY, v)
  }
  return v
}

// Stable per session — variant is assigned once and doesn't change during a render
export function useVariant() {
  return getVariant()
}

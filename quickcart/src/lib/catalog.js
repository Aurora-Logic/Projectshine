import { FEED_POOL, CATEGORIES } from '../data.js'

export const CAT_RULES = {
  All: () => true,
  'Drawer Slides': p => /slide|drawer/i.test(p.name),
  Hinges: p => /hinge/i.test(p.name),
  Locks: p => /lock|aldrop|bolt|closer/i.test(p.name),
  Wardrobe: p => /wardrobe/i.test(p.name),
  Kitchen: p => /kitchen|carousel|tandem|quadro/i.test(p.name),
  Office: p => p.brand === 'worksmart',
  Lighting: p => /light|profile|strip/i.test(p.name),
  Handles: p => /handle|knob/i.test(p.name),
  Storage: p => /shelf|castor|connector|catch|pin/i.test(p.name),
}

export const PLP_RAIL = [['1503387762-592deb58ef4e', 'All'], ...CATEGORIES]

export const RECO_RULES = [
  [/slide|drawer/i, 'x2'],
  [/hinge/i, 'ba1'],
  [/lock|bolt/i, 'ba4'],
  [/light|strip|profile|sensor|night/i, 'ls5'],
  [/keyboard|monitor|cpu|cable|grommet/i, 'ws5'],
]

export const catOf = (x) => Object.keys(CAT_RULES).find(k => k !== 'All' && CAT_RULES[k](x))

export function recosFor(p) {
  const rule = RECO_RULES.find(([re]) => re.test(p.name))
  const pairId = rule ? rule[1] : 'ba5'
  const list = []
  const pair = FEED_POOL.find(x => x.id === pairId && x.id !== p.id)
  if (pair) list.push(pair)
  FEED_POOL.filter(x => x.id !== p.id && catOf(x) === catOf(p))
    .forEach(x => { if (!list.some(y => y.id === x.id)) list.push(x) })
  return list.slice(0, 6)
}

export const SORT_OPTIONS = ['Popular', 'Price: low → high', 'Price: high → low', 'Biggest discount']

export const SUBCATS = {
  All: [],
  'Drawer Slides': [['Telescopic', 'telescopic'], ['Ball-bearing', 'ball-bearing'], ['Heavy duty', 'heavy'], ['Tandem', 'tandem']],
  Hinges: [['Soft-close', 'soft-close'], ['Glass', 'glass'], ['Concealed', 'concealed'], ['Clip-on', 'clip-on']],
  Locks: [['Cam locks', 'cam lock'], ['Digital', 'digital'], ['Wardrobe', 'wardrobe'], ['Bolts', 'bolt']],
  Wardrobe: [['Sliding systems', 'sliding'], ['Locks', 'lock']],
  Kitchen: [['Carousels', 'carousel'], ['Deep drawers', 'deep'], ['Quadro', 'quadro']],
  Office: [['Keyboard trays', 'keyboard'], ['Monitor arms', 'monitor'], ['CPU', 'cpu'], ['Cable', 'cable']],
  Lighting: [['LED strips', 'strip'], ['Sensor lights', 'sensor'], ['Profiles', 'profile'], ['Night lights', 'night']],
  Handles: [['D-Handles', 'd-handle']],
  Storage: [['Castors', 'castor'], ['Shelf & pins', 'pin'], ['Catches', 'catch'], ['Connectors', 'connector']],
}

export const CAT_SHELVES = [
  { t: 'Drawer slides & systems', cat: 'Drawer Slides', band: 'band-green' },
  { t: 'Hinges & flap fittings', cat: 'Hinges' },
  { t: 'Kitchen systems', cat: 'Kitchen' },
  { t: 'Locks & security', cat: 'Locks', band: 'band-pink' },
  { t: 'Lighting & smart living', cat: 'Lighting' },
  { t: 'Office fittings', cat: 'Office' },
]

export const catShelfSub = (cat) => (SUBCATS[cat] || []).map(s => s[0]).slice(0, 3).join(' · ')

export const MERCH_ROWS = [
  { icon: 'gst', t: 'GST input credit on every invoice', s: 'Business billing built in' },
  { icon: 'truck', t: 'Free delivery above ₹999', s: 'Straight to your site, no surge' },
]

export const DEFAULT_F = { deals: false, spec: null, sort: 0, mat: null, load: 0, size: null, doorThk: null, carcassThk: null }
export const MATERIALS = [...new Set(FEED_POOL.map(p => p.mat).filter(Boolean))]
export const SIZES = [450, 500, 600]

export const matThumb = (m) => FEED_POOL.find(p => p.mat === m)?.ph
export const subcatThumb = (kw) => FEED_POOL.find(p => `${p.name} ${p.qty}`.toLowerCase().includes(kw))?.ph

export function applyF(list, f, b) {
  let out = list
  if (b !== 'ALL') out = out.filter(p => p.brand === b)
  if (f.spec) out = out.filter(p => `${p.name} ${p.qty}`.toLowerCase().includes(f.spec[1]))
  if (f.mat) out = out.filter(p => p.mat === f.mat)
  if (f.load > 0) out = out.filter(p => (p.load || 0) >= f.load)
  if (f.size) out = out.filter(p => p.size === f.size)
  if (f.doorThk) out = out.filter(p => p.doorThk === f.doorThk)
  if (f.carcassThk) out = out.filter(p => p.carcassThk === f.carcassThk)
  if (f.deals) out = out.filter(p => p.tag || (p.mrp && p.mrp > p.price))
  out = [...out]
  if (f.sort === 1) out.sort((x, y) => x.price - y.price)
  if (f.sort === 2) out.sort((x, y) => y.price - x.price)
  if (f.sort === 3) out.sort((x, y) => ((y.mrp || y.price) - y.price) / (y.mrp || y.price) - ((x.mrp || x.price) - x.price) / (x.mrp || x.price))
  return out
}

export const fBadges = (f, b) => ({
  sub: f.spec ? 1 : 0,
  brand: b !== 'ALL' ? 1 : 0,
  material: f.mat ? 1 : 0,
  load: f.load > 0 ? 1 : 0,
  size: f.size ? 1 : 0,
  doorThk: f.doorThk ? 1 : 0,
  carcassThk: f.carcassThk ? 1 : 0,
  deal: f.deals ? 1 : 0,
  sort: f.sort > 0 ? 1 : 0,
})

export const fSummary = (f, b) => [
  b !== 'ALL' && b.charAt(0).toUpperCase() + b.slice(1),
  f.spec && f.spec[0],
  f.mat,
  f.load > 0 && `≥ ${f.load} kg`,
  f.size && `${f.size}mm`,
  f.doorThk && `${f.doorThk}mm door`,
  f.carcassThk && `${f.carcassThk}mm carcass`,
  f.deals && 'Deals only',
  f.sort > 0 && SORT_OPTIONS[f.sort],
].filter(Boolean)

export const BRAND_KEYS = ['ALL', 'ebco', 'zipco', 'peka', 'worksmart', 'livsmart']
export const BRAND_NAMES = { ebco: 'Ebco', zipco: 'Zipco', peka: 'Peka', worksmart: 'Worksmart by Ebco', livsmart: 'Livsmart by Ebco' }

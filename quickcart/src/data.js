import ebcoLogo from './assets/brands/ebco.png'
import zipcoLogo from './assets/brands/zipco.png'
import pekaLogo from './assets/brands/peka.png'
import worksmartLogo from './assets/brands/worksmart.png'
import livsmartLogo from './assets/brands/livsmart.png'

/* QuickCart — FURNITURE HARDWARE store.
   Brands: Ebco, Zipco, Peka, Worksmart by Ebco, Livsmart by Ebco.
   All Unsplash photo IDs below are verified (HTTP 200 + visual subject check).
   Context/interior shots stand in for fitting packshots until real product photography lands. */

export const FREE_DELIVERY_AT = 999
export const FEED_CAP = 40

/* Verified image shorthand:
   kitchens: 1484154218962-a197022b5858 (dark), 1556911220-bff31c812dba (white)
   wardrobe: 1558997519-83ea9252edf8 · wall TV unit: 1594026112284-02bb6f3352fe · wall cabinet: 1595428774223-ef52624120d2
   offices: 1497366216548-37526070297c, 1524758631624-e2822e304c36, 1497366811353-6870744d04b2 · desk: 1416339306562-f3d12fefd36f
   living: 1586023492125-27b2c045efd7, 1556228453-efd6c1ff04f6, 1489171078254-c3365d6e359f · bed: 1582582621959-48d27397dc69
   pendant lamp: 1565814329452-e1efa11c5b89 · smart lock: 1558002038-1055907df827 · vault lock: 1582139329536-e7284fece509
   chairs: 1551298370-9d3d53740c72 · plans: 1503387762-592deb58ef4e, 1581092160562-40aa08e78837 · carpenter: 1589939705384-5185137a7f0f */

export const BUY_AGAIN = [
  { id: 'ba1', mat: 'Zinc', load: 35, size: 450, stock: 240, brand: 'ebco', ph: '1595428774223-ef52624120d2', name: 'Ebco Telescopic Drawer Slide 450mm (pair)', qty: 'Zinc · 35 kg load', price: 385, usual: true, bulk: '10+ @ ₹350/pc' },
  { id: 'ba2', mat: 'Steel', stock: 64, brand: 'ebco', ph: '1594026112284-02bb6f3352fe', name: 'Ebco Soft-Close Hinge (2 pc)', qty: '0°–110° · clip-on', doorThk: 18, carcassThk: 18, price: 290, mrp: 310, usual: true, bulk: '20+ @ ₹265/set' },
  { id: 'ba3', mat: 'Steel', stock: 520, brand: 'ebco', ph: '1582139329536-e7284fece509', name: 'Ebco Cam Lock 19mm', qty: 'Nickel · 2 keys', price: 95, bulk: '50+ @ ₹78/pc' },
  { id: 'ba4', mat: 'SS', size: 160, stock: 64, brand: 'ebco', ph: '1558997519-83ea9252edf8', name: 'SS D-Handle 160mm (2 pc)', qty: 'Brushed steel', price: 240 },
  { id: 'ba5', mat: 'Steel', stock: 800, brand: 'ebco', ph: '1556911220-bff31c812dba', name: 'Shelf Support Pins (20 pc)', qty: '5mm · nickel', price: 60 },
]

export const NEW_EBCO = [
  { id: 'ne1', mat: 'Zinc', load: 30, size: 450, stock: 36, brand: 'ebco', ph: '1556911220-bff31c812dba', name: 'Ebco Quadro Drawer System', qty: '450mm · soft-close', price: 1450, buys: '900+ fitted this month' },
  { id: 'ne2', mat: 'Glass', stock: 90, brand: 'ebco', ph: '1489171078254-c3365d6e359f', name: 'Glass Door Hinge (pair)', qty: '5mm glass · clamp', price: 310, rating: 4.4 },
  { id: 'ne3', mat: 'Aluminium', load: 60, stock: 14, brand: 'ebco', ph: '1558997519-83ea9252edf8', name: 'Wardrobe Sliding System 2.4m', qty: '2-door · top hung', price: 3250, mrp: 3990, tag: '19% OFF' },
  { id: 'ne4', mat: 'Steel', load: 30, size: 500, stock: 48, brand: 'ebco', ph: '1556228453-efd6c1ff04f6', name: 'Tandem Box Deep Drawer', qty: '500mm · grey', price: 2120, rating: 4.6 },
  { id: 'ne5', mat: 'Steel', load: 20, stock: 0, lead: 7, brand: 'ebco', ph: '1484154218962-a197022b5858', name: 'Corner Carousel Unit', qty: '270° · 2 shelves', price: 4850, mrp: 5840, tag: '17% OFF' },
  { id: 'ne6', mat: 'Steel', size: 200, stock: 120, brand: 'ebco', ph: '1595428774223-ef52624120d2', name: 'Aldrop & Tower Bolt Set', qty: 'Matt black · 200mm', price: 420, buys: '500+ fitted this month' },
]

export const DEALS = [
  { id: 'dl1', mat: 'Zinc', load: 45, size: 500, stock: 48, brand: 'ebco', ph: '1484154218962-a197022b5858', name: 'Ball-Bearing Slide 500mm (pair)', qty: '45 kg load · zinc', price: 520, mrp: 745, buys: '2k+ fitted this month', bulk: '10+ @ ₹479/pc' },
  { id: 'dl2', mat: 'Steel', stock: 75, brand: 'ebco', ph: '1594026112284-02bb6f3352fe', name: 'Soft-Close Hinge Pack (10 pc)', qty: 'Clip-on · 110°', doorThk: 19, carcassThk: 18, price: 1260, mrp: 1750, bulk: '5+ @ ₹1,150/pack' },
  { id: 'dl3', mat: 'ABS', stock: 22, brand: 'livsmart', ph: '1558002038-1055907df827', name: 'Livsmart Digital Furniture Lock', qty: 'RFID + PIN', price: 2399, mrp: 2999, rating: 4.2 },
  { id: 'dl4', mat: 'ABS', load: 12, stock: 40, brand: 'worksmart', ph: '1416339306562-f3d12fefd36f', name: 'Worksmart Keyboard Tray', qty: 'Soft-pad · sliding', price: 1899, mrp: 2374, tag: '20% OFF' },
  { id: 'dl5', mat: 'Aluminium', size: 2000, stock: 55, brand: 'livsmart', ph: '1565814329452-e1efa11c5b89', name: 'Aluminium Profile Light 2m', qty: 'Warm white · 12V', price: 949, mrp: 1116, tag: '15% OFF' },
]

export const WORKSMART = [
  { id: 'ws1', mat: 'ABS', load: 12, stock: 30, brand: 'worksmart', ph: '1416339306562-f3d12fefd36f', name: 'Keyboard Platform Soft-Pad', qty: 'Slide + tilt', price: 1899, rating: 4.5, bulk: '5+ @ ₹1,750/pc' },
  { id: 'ws2', mat: 'Steel', load: 25, stock: 85, brand: 'worksmart', ph: '1497366216548-37526070297c', name: 'CPU Trolley with Castors', qty: 'Adjustable width', price: 980, mrp: 1140, tag: '14% OFF' },
  { id: 'ws3', mat: 'Aluminium', load: 8, stock: 0, lead: 4, brand: 'worksmart', ph: '1497366811353-6870744d04b2', name: 'Monitor Arm — Single', qty: 'Gas spring · 27"', price: 2450, buys: '300+ fitted this month' },
  { id: 'ws4', mat: 'ABS', size: 60, stock: 300, brand: 'worksmart', ph: '1581092160562-40aa08e78837', name: 'Desk Grommet 60mm (2 pc)', qty: 'ABS · black', price: 140, rating: 4.7 },
  { id: 'ws5', mat: 'ABS', stock: 150, brand: 'worksmart', ph: '1524758631624-e2822e304c36', name: 'Cable Manager Spine', qty: 'Floor to desk', price: 560 },
]

export const LIVESMART = [
  { id: 'ls1', mat: 'Aluminium', size: 5000, stock: 95, brand: 'livsmart', ph: '1565814329452-e1efa11c5b89', name: 'LED Strip Light 5m', qty: '2700K · dimmable', price: 850, mrp: 1000, bulk: '5+ @ ₹790/pc' },
  { id: 'ls2', mat: 'ABS', stock: 9, brand: 'livsmart', ph: '1595428774223-ef52624120d2', name: 'Sensor Cabinet Light', qty: 'Rechargeable · IR', price: 1150, mrp: 1438, buys: '1k+ fitted this month' },
  { id: 'ls3', mat: 'Zinc', stock: 18, brand: 'livsmart', ph: '1558002038-1055907df827', name: 'Smart Digital Door Lock', qty: 'Fingerprint + app', price: 6499, rating: 4.3 },
  { id: 'ls4', mat: 'ABS', stock: 200, brand: 'livsmart', ph: '1582582621959-48d27397dc69', name: 'Motion Night Light', qty: 'USB-C · warm', price: 499, rating: 4.1 },
  { id: 'ls5', mat: 'Aluminium', size: 1000, stock: 70, brand: 'livsmart', ph: '1586023492125-27b2c045efd7', name: 'Aluminium Profile Kit 1m', qty: 'Recessed · diffused', price: 620, mrp: 745, tag: '17% OFF' },
]

export const ZIPCO_PEKO = [
  { id: 'zp1', mat: 'Steel', load: 60, size: 600, stock: 44, brand: 'zipco', ph: '1594026112284-02bb6f3352fe', name: 'Zipco Heavy-Duty Slide 600mm', qty: '60 kg load', price: 680, mrp: 820, bulk: '10+ @ ₹610/pc' },
  { id: 'zp2', mat: 'Steel', stock: 380, brand: 'peka', ph: '1586023492125-27b2c045efd7', name: 'Peka Concealed Hinge (pair)', qty: '90° · screw-on', doorThk: 16, carcassThk: 16, price: 180, buys: '700+ fitted this month' },
  { id: 'zp3', mat: 'Steel', stock: 0, lead: 5, brand: 'zipco', ph: '1558997519-83ea9252edf8', name: 'Zipco Wardrobe Lock', qty: 'Left/right · 2 keys', price: 260, mrp: 295, tag: '12% OFF' },
  { id: 'zp4', mat: 'Plastic', stock: 160, brand: 'peka', ph: '1551298370-9d3d53740c72', name: 'Peka Magnetic Catch (10 pc)', qty: 'White · 4 kg pull', price: 240, rating: 4.4 },
]

/* door closers — selected via the calculator (load = max door kg, size = max width mm) */
export const DOOR_CLOSERS = [
  { id: 'dc1', mat: 'Steel', load: 60, size: 950, stock: 120, brand: 'ebco', ph: '1558997519-83ea9252edf8', name: 'Ebco Door Closer DC-60', qty: 'Doors ≤60 kg · ≤950 mm', price: 1250, mrp: 1450, bulk: '5+ @ ₹1,150/pc' },
  { id: 'dc2', mat: 'Steel', load: 85, size: 1100, stock: 80, brand: 'ebco', ph: '1582139329536-e7284fece509', name: 'Ebco Door Closer DC-85', qty: 'Doors ≤85 kg · ≤1100 mm', price: 1650, mrp: 1890, bulk: '5+ @ ₹1,520/pc' },
  { id: 'dc3', mat: 'Steel', load: 120, size: 1250, stock: 35, brand: 'ebco', ph: '1558002038-1055907df827', name: 'Ebco Heavy Door Closer DC-120', qty: 'Doors ≤120 kg · ≤1250 mm', price: 2450, mrp: 2790 },
]

export const FEED_POOL = [
  ...NEW_EBCO, ...DEALS, ...WORKSMART, ...LIVESMART, ...ZIPCO_PEKO, ...BUY_AGAIN, ...DOOR_CLOSERS,
  { id: 'x1', mat: 'Plastic', load: 50, stock: 210, brand: 'ebco', ph: '1551298370-9d3d53740c72', name: 'Castor Wheels 50mm (4 pc)', qty: 'Twin · brake', price: 320, mrp: 372, tag: '14% OFF' },
  { id: 'x2', mat: 'Zinc', stock: 500, brand: 'ebco', ph: '1503387762-592deb58ef4e', name: 'Furniture Connector Kit', qty: 'Minifix · 50 sets', price: 145, buys: '400+ fitted this month' },
]

export const CATEGORIES = [
  ['1595428774223-ef52624120d2', 'Drawer Slides', 124],
  ['1594026112284-02bb6f3352fe', 'Hinges', 86],
  ['1582139329536-e7284fece509', 'Locks', 64],
  ['1558997519-83ea9252edf8', 'Wardrobe', 92],
  ['1484154218962-a197022b5858', 'Kitchen', 140],
  ['1524758631624-e2822e304c36', 'Office', 75],
  ['1565814329452-e1efa11c5b89', 'Lighting', 58],
  ['1582582621959-48d27397dc69', 'Handles', 110],
  ['1489171078254-c3365d6e359f', 'Storage', 96],
]

export const BANNERS = [
  {
    key: 'hero', glow: '#8F6F06', bg: 'linear-gradient(135deg, #FFE873, #FFD43B)', dark: true,
    title: 'Fittings at your site in 90 min', sub: 'Genuine Ebco · Zipco · Peka', cta: 'Shop now',
    ph: '1503387762-592deb58ef4e',
  },
  {
    key: 'season', glow: '#3A3F4A', bg: 'linear-gradient(135deg, #2E323B, #17181C)',
    title: 'Flash sale is on', sub: 'Up to 60% off · last units only', cta: 'Grab now',
    ph: '1484154218962-a197022b5858', anchor: 'deals',
  },
  {
    key: 'quiz', bg: 'linear-gradient(135deg, #6E56CF, #49369B)',
    title: 'Play today’s quiz', sub: 'Win coins · climb the leaderboard', cta: 'Play now',
    ph: '1581092160562-40aa08e78837', anchor: 'quiz',
  },
  {
    key: 'free', glow: '#0E5A36', bg: 'linear-gradient(135deg, var(--teal-9), var(--teal-11))',
    title: 'Free delivery above ₹999', sub: 'GST invoice on every order', cta: 'Order now',
    ph: '1595428774223-ef52624120d2',
  },
  {
    key: 'refer', glow: '#7E1D3B', bg: 'linear-gradient(135deg, #E54666, #B5294E)',
    title: 'Refer a carpenter, earn ₹200', sub: 'They get ₹200 on first order too', cta: 'Invite',
    ph: '1589939705384-5185137a7f0f',
  },
]

/* Seasonal combo kits — rotate per campaign (Renovation Fest live now) */
export const COMBOS = [
  {
    id: 'cb1', tint: '#E3EEF8', ph: '1556911220-bff31c812dba',
    title: 'Kitchen Starter Kit', items: 'Slides + hinges + handles for 6 cabinets', price: 2499, was: 2890,
  },
  {
    id: 'cb2', tint: '#F4ECDF', ph: '1558997519-83ea9252edf8',
    title: 'Wardrobe Upgrade Kit', items: 'Sliding system + locks + LED sensor light', price: 4250, was: 4820,
  },
  {
    id: 'cb3', tint: '#E3F2EA', ph: '1416339306562-f3d12fefd36f',
    title: 'Worksmart Desk Kit', items: 'Keyboard tray + grommets + cable spine', price: 2399, was: 2599,
  },
  {
    id: 'cb4', tint: '#FBE9EC', ph: '1565814329452-e1efa11c5b89',
    title: 'Livsmart Light Kit', items: 'LED strip 5m + sensor cabinet light', price: 1799, was: 2000,
  },
]

export const CLEARANCE_TILES = [
  { ph: '1484154218962-a197022b5858', label: 'Kitchen systems', off: 45, left: 12 },
  { ph: '1558997519-83ea9252edf8', label: 'Wardrobe fittings', off: 40, left: 8 },
  { ph: '1497366811353-6870744d04b2', label: 'Office fittings', off: 35, left: 15 },
  { ph: '1565814329452-e1efa11c5b89', label: 'Lighting', off: 60, left: 6 },
]

/* Adaptive sky: 6 dayparts × 8 conditions = 48 variations, GENERATED from natural
   base skies + per-condition color physics (rain pulls hue blue-gray, fog washes
   saturation, snow lightens, storm darkens...). a/b/c = header gradient stops;
   c is ALSO the active tab + extension start (seamless junction); d = extension end.
   Quiz card/dialog reuse b→d so the whole app breathes with the sky. */

function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16)
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2
  if (max === min) return [0, 0, l * 100]
  const dd = max - min
  const s = l > 0.5 ? dd / (2 - max - min) : dd / (max + min)
  let h
  if (max === r) h = ((g - b) / dd + (g < b ? 6 : 0))
  else if (max === g) h = (b - r) / dd + 2
  else h = (r - g) / dd + 4
  return [h * 60, s * 100, l * 100]
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100
  const f = (k) => {
    const x = (k + h / 30) % 12
    const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(x - 3, 9 - x, 1))
    return Math.round(c * 255).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x))

function mixHex(h1, h2, t) {
  const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16)
  const ch = (sh) => Math.round(((a >> sh) & 255) * (1 - t) + ((b >> sh) & 255) * t)
  return `#${[16, 8, 0].map(sh => ch(sh).toString(16).padStart(2, '0')).join('')}`
}

/* Natural base skies: [top color, bottom color] of the clear-sky gradient */
const SKY_BASES = {
  dawn: ['#5B6BC2', '#D8703E'],      // indigo night melting into orange horizon
  morning: ['#4D9DE0', '#DE8B3F'],   // fresh blue with warm orange sunrise floor
  noon: ['#2F86DD', '#1A5CB0'],      // high bright azure
  afternoon: ['#D67711', '#9A4A0E'], // golden yellow-orange, low warm sun
  sunset: ['#D85A3A', '#6E2456'],    // burning orange into plum
  night: ['#312E81', '#0E0D30'],     // deep indigo
}

/* Condition physics applied to each gradient stop (h, s, l deltas) */
const SKY_FX = {
  clear: (h, s, l) => [h, s, l],
  partly: (h, s, l) => [h, s * 0.9, l - 2],
  cloudy: (h, s, l) => [h + (215 - h) * 0.25, s * 0.45, l - 6],
  rain: (h, s, l) => [h + (205 - h) * 0.55, s * 0.6, l - 9],
  storm: (h, s, l) => [h + (215 - h) * 0.6, s * 0.55, l - 16],
  snow: (h, s, l) => [h + (220 - h) * 0.35, s * 0.5, l + 8],
  fog: (h, s, l) => [h, s * 0.3, l + 3],
  wind: (h, s, l) => [h + (190 - h) * 0.3, s * 0.85, l - 2],
}

const SKY_ICONS = {
  clear: { dawn: '🌄', morning: '🌅', noon: '☀️', afternoon: '🌞', sunset: '🌇', night: '🌙' },
  partly: '⛅️', cloudy: '☁️', rain: '🌧', storm: '⛈', snow: '❄️', fog: '🌫', wind: '💨',
}

const applyFx = (hex, fx) => {
  const [h, s, l] = hexToHsl(hex)
  const [h2, s2, l2] = fx(h, s, l)
  return hslToHex(h2, clamp(s2, 0, 100), clamp(l2, 4, 92))
}

export const SKY = {}
for (const [dp, [top, bottom]] of Object.entries(SKY_BASES)) {
  SKY[dp] = {}
  for (const [cond, fx] of Object.entries(SKY_FX)) {
    const a = applyFx(top, fx)
    const d = applyFx(bottom, fx)
    SKY[dp][cond] = {
      a,
      b: mixHex(a, d, 0.38),
      c: mixHex(a, d, 0.7),
      d,
      icon: cond === 'clear' ? SKY_ICONS.clear[dp] : SKY_ICONS[cond],
    }
  }
}

export const WHEEL = [
  { label: '₹100 OFF', color: '#B3262E' },
  { label: '₹75 OFF', color: '#23304A' },
  { label: 'FREE DELIVERY', color: '#14633F' },
  { label: '₹250 OFF', color: '#7A2FBF' },
  { label: '5% OFF', color: '#B97E1C' },
  { label: 'TRY AGAIN', color: '#454B5C' },
]

export const QUIZ_SECONDS = 10

/* Quiz "editions": a NEW look every day (rotates by date), independent of the sky.
   The header mirrors the world; the quiz is a daily surprise. */
export const QUIZ_SKINS = [
  { name: 'Royal', bg: 'linear-gradient(135deg, #6E56CF, #3E2E8E)', accent: '#FFD43B', btn: '#3E2E8E', deco: 'dots' },
  { name: 'Magma', bg: 'linear-gradient(135deg, #E5484D, #8E1B1F)', accent: '#FFE873', btn: '#8E1B1F', deco: 'rings' },
  { name: 'Ocean', bg: 'linear-gradient(135deg, #0090FF, #0A4DA0)', accent: '#B5E8FF', btn: '#0A4DA0', deco: 'waves' },
  { name: 'Forest', bg: 'linear-gradient(135deg, #2FA855, #14572F)', accent: '#FFE873', btn: '#14572F', deco: 'diag' },
  { name: 'Midnight', bg: 'linear-gradient(135deg, #383B52, #15161C)', accent: '#FFD43B', btn: '#15161C', deco: 'dots' },
  { name: 'Coral', bg: 'linear-gradient(135deg, #F76B15, #A33508)', accent: '#FFF3C2', btn: '#A33508', deco: 'rings' },
  { name: 'Berry', bg: 'linear-gradient(135deg, #C2298A, #641C50)', accent: '#FFD1EC', btn: '#641C50', deco: 'diag' },
]

export const QUIZ = [
  { q: 'What does a soft-close hinge prevent?', opts: ['Door slamming', 'Rusting', 'Warping'], a: 0 },
  { q: 'Which fitting lets a drawer glide in and out?', opts: ['Cam lock', 'Telescopic slide', 'Shelf pin'], a: 1 },
  { q: 'Worksmart by Ebco is built for…?', opts: ['Kitchens', 'Bathrooms', 'Office workspaces'], a: 2 },
]

/* Dealer rankings by monthly purchase volume (₹) */
export const LEADERS = [
  { name: 'Sharma Hardware', vol: 241000, c: '#6E56CF' },
  { name: 'Patil Traders', vol: 218000, c: '#E54666' },
  { name: 'BuildMart Co', vol: 192500, c: '#0090FF' },
  { name: 'Kable Agencies', vol: 161000, c: '#F76B15' },
  { name: 'Meera Distributors', vol: 154000, c: '#12A594' },
]

export const MY_RANK = { rank: 12, of: 48, moved: 2 }

/* Dealer purchase targets vs achieved (₹) */
export const TARGETS = {
  monthly: { label: 'Monthly', target: 200000, done: 124500, ends: '30 Jun', note: 'Hit it → +2% rebate' },
  quarterly: { label: 'Quarterly', target: 600000, done: 451200, ends: '30 Jun', note: 'Qualifies Gold tier' },
  yearly: { label: 'Yearly', target: 2400000, done: 1421800, ends: '31 Mar', note: 'Annual bonus slab +3%' },
}

export const SEARCH_HINTS = ['Search “drawer slides”', 'Search “soft-close hinge”', 'Search “cam lock”', 'Search “keyboard tray”', 'Search “LED profile”']

export const HEADER_TABS = [
  { l: 'ALL' },
  { logo: ebcoLogo, l: 'EBCO' },
  { logo: zipcoLogo, l: 'ZIPCO' },
  { logo: pekaLogo, l: 'PEKA' },
  { logo: worksmartLogo, l: 'WORKSMART' },
  { logo: livsmartLogo, l: 'LIVSMART' },
]

export const BRAND_LOGOS = {
  ebco: ebcoLogo,
  zipco: zipcoLogo,
  peka: pekaLogo,
  worksmart: worksmartLogo,
  livsmart: livsmartLogo,
}

/* "Product of the Day" promo slot — swap content to push launches or clear stock */
export const BRAND_DAY = {
  badge: 'PRODUCT OF THE DAY',
  name: 'Ebco Quadro Drawer System',
  sub: 'Launch offer · ₹1,450 · soft-close',
  cta: 'Shop now',
  ph: '1556911220-bff31c812dba',
  logo: ebcoLogo,
  query: 'quadro',
}

/* Campaign header takeovers — some app-opens get a campaign skin instead of the weather sky */
export const CAMPAIGN_HEADERS = [
  { name: 'Clearance Week', a: '#3A3F4A', b: '#2A2E36', c: '#1F2126', d: '#15171B', icon: '🏷' },
  { name: 'Ebco Days', a: '#2F5FD0', b: '#2349A8', c: '#1A3A8C', d: '#122B6B', icon: '⚙️' },
  { name: 'Festive Sale', a: '#B83280', b: '#8E2C72', c: '#6B2160', d: '#4E1746', icon: '🎉' },
]

/* Hero v2 ("fest" takeover, client direction): yellow promo + 2x2 category tiles */
export const FEST = {
  title: 'Hinge Fest',
  off: 'UP TO 28% OFF',
  cta: 'SHOP NOW',
  ph: '1594026112284-02bb6f3352fe',
  cat: 'Hinges',
  tiles: [
    { l: 'Soft-Close Hinges', cat: 'Hinges', ph: '1556911220-bff31c812dba' },
    { l: 'Drawer Channels', cat: 'Drawer Slides', ph: '1595428774223-ef52624120d2' },
    { l: 'Handles & Knobs', cat: 'Handles', ph: '1489171078254-c3365d6e359f' },
    { l: 'Locks & Latches', cat: 'Locks', ph: '1558002038-1055907df827' },
  ],
}

/* Hero v2 palette options — flip in #sim, preview via #hero-<name>; finalize or rotate */
export const HERO_PALETTES = [
  { name: 'Emerald', a: '#0FA36B', b: '#0B8A59', c: '#087246', d: '#065A37', edge: 'scallop', dot: 'dot' },
  { name: 'Lagoon', a: '#0E9CB8', b: '#0B84A4', c: '#086E8C', d: '#065870', edge: 'bubbles', dot: 'dash' },
  { name: 'Violet', a: '#7C5CE0', b: '#6847C9', c: '#5536AE', d: '#42288F', edge: 'zigzag', dot: 'diamond' },
  { name: 'Sunset', a: '#E8553C', b: '#CF4430', c: '#B23423', d: '#8F2618', edge: 'teeth', dot: 'square' },
  { name: 'Royal', a: '#2D6FE8', b: '#2459C9', c: '#1C46A8', d: '#143385', edge: 'castle', dot: 'square' },
  { name: 'Forest', a: '#2C5F50', b: '#234D41', c: '#1D4237', d: '#142F27', edge: 'scallop', dot: 'dot' },
]

/* Dealer tier ladder (monthly volume) — replaces named leaderboard (peer-volume visibility caused dealer conflict) */
export const TIERS = [
  { name: 'Bronze', min: 0, c: '#C9803B', perk: 'Standard pricing' },
  { name: 'Silver', min: 100000, c: '#98A2B3', perk: '+1% margin' },
  { name: 'Gold', min: 200000, c: '#E3B33C', perk: '+2% margin · priority dispatch' },
  { name: 'Platinum', min: 400000, c: '#5BA9D6', perk: '+3% margin · dedicated support' },
]

/* B2B order-value scheme slabs: % off the entire invoice */
export const SCHEMES = [
  { min: 10000, off: 1 },
  { min: 25000, off: 2 },
  { min: 50000, off: 3 },
]

export const ADDRESSES = [
  { id: 'a1', label: 'Shop', addr: '304, Maple Heights, 27th Main, HSR Layout, Bengaluru 560102' },
  { id: 'a2', label: 'Godown', addr: 'Plot 18, Bommanahalli Industrial Area, Hosur Road, Bengaluru 560068' },
]

/* Reorder intelligence: usual qty + buying cadence per regular SKU */
export const REORDER = [
  { id: 'ba1', usual: 20, every: 'every 2 wks', last: 16, due: true },
  { id: 'ba2', usual: 30, every: 'every 3 wks', last: 24, due: true },
  { id: 'ba3', usual: 50, every: 'every month', last: 34, due: true },
  { id: 'dl1', usual: 24, every: 'every month', last: 37, due: true },
  { id: 'ba4', usual: 10, every: 'every 2 wks', last: 9, due: false },
  { id: 'ba5', usual: 12, every: 'every month', last: 12, due: false },
  { id: 'ne1', usual: 5, every: 'every 6 wks', last: 22, due: false },
  { id: 'ws1', usual: 8, every: 'every 2 mo', last: 25, due: false },
]

export const PAST_ORDERS = [
  { id: 'QC-471203', date: 'Tue, 2 Jun', ts: new Date('2026-06-02').getTime(), items: [['ba1', 20, 350], ['ba3', 50, 78], ['dl1', 24, 479]] },
  { id: 'QC-458819', date: 'Sun, 17 May', ts: new Date('2026-05-17').getTime(), items: [['ba2', 30, 265], ['ba1', 20, 350], ['ws1', 8, 1899], ['ba5', 12, 240]] },
  { id: 'QC-446102', date: 'Sat, 25 Apr', ts: new Date('2026-04-25').getTime(), items: [['ne1', 5, 1450], ['ba3', 40, 95]] },
  { id: 'QC-431877', date: 'Fri, 13 Mar', ts: new Date('2026-03-13').getTime(), items: [['dl1', 24, 479], ['ba4', 10, 240], ['ls1', 6, 850]] },
]

/* Performance dashboard data (₹ thousands for the trend) */
export const DASH = {
  months: [['Jul', 92], ['Aug', 110], ['Sep', 98], ['Oct', 135], ['Nov', 128], ['Dec', 96], ['Jan', 118], ['Feb', 142], ['Mar', 165], ['Apr', 121], ['May', 138], ['Jun', 124]],
  cats: [['Drawer slides', 34, '#30A46C'], ['Hinges', 22, '#2D6FE8'], ['Locks', 14, '#E3B33C'], ['Kitchen', 12, '#7C5CE0'], ['Lighting', 9, '#E8553C'], ['Other', 9, '#98A2B3']],
  brands: [['Ebco', 58], ['Worksmart', 16], ['Livsmart', 11], ['Zipco', 9], ['Peka', 6]],
  kpis: { month: 124500, growth: 18, aov: 8300, saved: 14320, orders: 15 },
}

/* 30-day dealer credit line */
export const CREDIT = {
  limit: 500000,
  bills: [
    { id: 'QC-446102', amt: 11050, days: -3 },
    { id: 'QC-458819', amt: 32312, days: 6 },
    { id: 'QC-471203', amt: 24930, days: 16 },
  ],
}

/* Live category-level schemes shown on the Schemes page */
export const CAT_SCHEMES = [
  { cat: 'Drawer Slides', deal: 'Extra 5% off on 50+ pcs', till: 'Till 30 Jun', tag: 'VOLUME' },
  { cat: 'Hinges', deal: 'Buy 20 sets, get 2 free', till: 'Till 25 Jun', tag: 'FREEBIE' },
  { cat: 'Kitchen', deal: 'Flat ₹500 off Quadro systems', till: 'Launch offer', tag: 'FLAT OFF' },
  { cat: 'Lighting', deal: '12% off LED strips & profiles', till: 'Last units', tag: 'CLEARANCE' },
]

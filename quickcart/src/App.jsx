import { createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  Theme, Box, Flex, Grid, Text, Heading, Button, IconButton, TextField, Dialog,
} from '@radix-ui/themes'
import {
  MagnifyingGlassIcon, ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, PersonIcon,
  LightningBoltIcon, StarFilledIcon, MinusIcon, PlusIcon, Cross2Icon,
  HomeIcon, DashboardIcon, CounterClockwiseClockIcon, RocketIcon, ArrowLeftIcon,
  MixerHorizontalIcon, GearIcon, FileTextIcon, DiscIcon, CheckIcon,
  BarChartIcon, BellIcon, LockClosedIcon, ExitIcon, RulerSquareIcon, SewingPinIcon,
  EyeOpenIcon, ChatBubbleIcon, MobileIcon, EnvelopeClosedIcon, CalendarIcon,
  IdCardIcon, BookmarkIcon, ChevronLeftIcon, SpeakerLoudIcon, ExclamationTriangleIcon,
  UploadIcon,
} from '@radix-ui/react-icons'
import {
  FREE_DELIVERY_AT, FEED_CAP, BUY_AGAIN, NEW_EBCO, DEALS, WORKSMART, LIVESMART, ZIPCO_PEKO,
  FEED_POOL, CATEGORIES, BANNERS, COMBOS, QUIZ,
  SEARCH_HINTS, HEADER_TABS, WHEEL, QUIZ_SECONDS, SKY, QUIZ_SKINS, BRAND_LOGOS,
  BRAND_DAY, CAMPAIGN_HEADERS, MY_RANK, TARGETS, FEST, HERO_PALETTES, TIERS, SCHEMES, ADDRESSES, REORDER, PAST_ORDERS, DASH, CREDIT, CAT_SCHEMES,
} from './data.js'
import './App.css'

const img = (id, w = 480) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=60`

const DAY = new Date().toDateString()

/* ---------- Adaptive sky: daypart (4) × condition (7) = 28 themes ---------- */

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

function useSkyTheme() {
  const [sky, setSky] = useState(() => {
    const m = window.location.hash.match(/#theme-(dawn|morning|noon|afternoon|sunset|night)-(\w+)/)
    if (m && SKY[m[1]]?.[m[2]]) return { dp: m[1], cond: m[2] }
    return { dp: daypart(), cond: 'clear' }
  })

  useEffect(() => {
    if (window.location.hash.startsWith('#theme-')) return
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

/* Dev tool: open the app with #sim — flips skies (48 combos) AND quiz editions live */
function DevSimulator({ dp, cond, onChange, skinName, onSkin, heroPalName, onHeroPal }) {
  return (
    <div className="sim-panel">
      <Text size="1" weight="bold" color="gray">SKY — daypart</Text>
      <div className="sim-chips">
        {Object.keys(SKY).map(d => (
          <button key={d} className={`sim-chip ${d === dp ? 'on' : ''}`} onClick={() => onChange({ dp: d, cond })}>
            {d}
          </button>
        ))}
      </div>
      <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginTop: 10 }}>SKY — condition</Text>
      <div className="sim-chips">
        {Object.keys(SKY.morning).map(c => (
          <button key={c} className={`sim-chip ${c === cond ? 'on' : ''}`} onClick={() => onChange({ dp, cond: c })}>
            {c}
          </button>
        ))}
      </div>
      <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginTop: 10 }}>HERO — palette</Text>
      <div className="sim-chips">
        {HERO_PALETTES.map(p => (
          <button key={p.name} className={`sim-chip ${p.name === heroPalName ? 'on' : ''}`} onClick={() => onHeroPal(p)}>
            <span style={{ width: 10, height: 10, borderRadius: 99, background: p.a, display: 'inline-block' }} />
            {p.name}
          </button>
        ))}
      </div>
      <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginTop: 10 }}>QUIZ — edition</Text>
      <div className="sim-chips">
        {QUIZ_SKINS.map(s => (
          <button key={s.name} className={`sim-chip ${s.name === skinName ? 'on' : ''}`} onClick={() => onSkin(s)}>
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )
}

function sparkle(e) {
  for (let i = 0; i < 6; i++) {
    const s = document.createElement('span')
    s.className = 'spark'
    s.style.background = ['#30A46C', '#FFD43B', '#A2DEB7'][i % 3]
    s.style.left = `${e.clientX}px`
    s.style.top = `${e.clientY}px`
    s.style.setProperty('--dx', `${Math.random() * 90 - 45}px`)
    s.style.setProperty('--dy', `${-25 - Math.random() * 60}px`)
    document.body.appendChild(s)
    setTimeout(() => s.remove(), 550)
  }
}

/* Bulk-tier nudge: "Add N more → X% off" — the dealer upsell loop */
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

/* App-wide intents: any ADD opens the bulk qty sheet; any card tap opens the product page */
const QtyCtx = createContext(null)
const PdpCtx = createContext(null)
const CartCtx = createContext(null)
/* live cart lines — single source of truth for every stepper in the app */
const CartItemsCtx = createContext({})

const BRAND_NAMES = { ebco: 'Ebco', zipco: 'Zipco', peka: 'Peka', worksmart: 'Worksmart by Ebco', livsmart: 'Livsmart by Ebco' }

/* Parse "10+ @ ₹350/pc" into a usable tier: threshold, bulk price, % off */
const bulkTier = (p) => {
  const m = p.bulk?.match(/(\d+)\+\s*@\s*₹([\d,]+)/)
  if (!m) return null
  const bp = +m[2].replace(/,/g, '')
  return { thr: +m[1], bp, pct: Math.max(1, Math.round((1 - bp / p.price) * 100)) }
}

/* ONE price story: once a line crosses its bulk threshold, the tier price IS
   the price — on the qty sheet, the cart row, the bill and the invoice. */
const unitPriceFor = (p, n) => {
  const t = bulkTier(p)
  return t && n >= t.thr ? t.bp : p.price
}
const lineTotal = (p, n) => unitPriceFor(p, n) * n

/* one coupon slot — written by wheel/quiz/streak, consumed at checkout */
const saveCoupon = (c) => {
  try { localStorage.setItem('qc-coupon', JSON.stringify(c)) } catch { /* storage off */ }
}
const couponFromWheel = (label) => {
  if (label === 'TRY AGAIN') return null
  if (label === 'FREE DELIVERY') return { label, kind: 'freedel', value: 0 }
  if (label.endsWith('% OFF')) return { label, kind: 'pct', value: parseInt(label, 10) }
  return { label, kind: 'amt', value: +label.replace(/[^\d]/g, '') }
}

/* live credit position: seed bills + bills raised by placed orders − paid */
function creditState() {
  let paid = []
  let extra = []
  try { paid = JSON.parse(localStorage.getItem('qc-paid') || '[]') } catch { /* none */ }
  try { extra = JSON.parse(localStorage.getItem('qc-bills') || '[]') } catch { /* none */ }
  const all = [
    ...CREDIT.bills,
    ...extra.map(b => ({ ...b, days: Math.ceil((b.due - Date.now()) / 864e5) })),
  ]
  const open = all.filter(b => !paid.includes(b.id))
  const outstanding = open.reduce((s, b) => s + b.amt, 0)
  return { limit: CREDIT.limit, open, paidIds: paid, all, outstanding }
}

/* Keeps an overlay mounted briefly after close so it can slide out */
function PageExit({ open, children, variant = 'page', dur = 300 }) {
  const [state, setState] = useState(open ? 'open' : 'closed')
  const last = useRef(children)
  if (open) last.current = children
  useEffect(() => {
    if (open) {
      setState('open')
      return
    }
    setState(s => (s === 'closed' ? s : 'closing'))
    const t = setTimeout(() => setState('closed'), dur)
    return () => clearTimeout(t)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  if (state === 'closed') return null
  return (
    <div className={`pgx ${variant} ${state === 'closing' ? 'out' : ''}`}>
      {open ? children : last.current}
    </div>
  )
}

const scrollToId = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

/* Defer heavy content by one frame so page/sheet entrances animate jank-free */
function useNextFrame() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return ready
}

/* Image with blur-up fade-in (gray well → photo) */
const Img = memo(function Img(props) {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef(null)
  useEffect(() => { if (ref.current?.complete) setLoaded(true) }, [])
  return (
    <img
      decoding="async"
      {...props} ref={ref} onLoad={() => setLoaded(true)}
      className={`${props.className || ''} fadeimg ${loaded ? 'in' : ''}`}
    />
  )
})

const BRAND_KEYS = ['ALL', 'ebco', 'zipco', 'peka', 'worksmart', 'livsmart']

/* ---------------- Header (seasonal monsoon skin) ---------------- */

const NIGHT_STARS = [
  [8, 18], [20, 52], [34, 26], [48, 65], [60, 14], [72, 48],
  [85, 28], [15, 80], [55, 86], [90, 70], [40, 92], [78, 88],
]

const SkyLayer = memo(function SkyLayer({ dp, cond, inDialog }) {
  const clouds = (n, op) => Array.from({ length: n }, (_, i) => (
    <div
      key={i} className="cloud"
      style={{
        width: 90 + i * 45, height: 24 + i * 8, top: 8 + i * 30, left: `${-15 + i * 22}%`,
        animationDuration: `${70 + i * 35}s`, animationDelay: `${-i * 25}s`, opacity: op,
      }}
    />
  ))
  const falling = (n, cls, base, step) => Array.from({ length: n }, (_, i) => (
    <span
      key={i} className={cls}
      style={{
        left: `${(i * 7.3 + 3) % 100}%`,
        animationDuration: `${base + (i % 5) * step}s`,
        animationDelay: `${(i % 7) * 0.4}s`,
      }}
    />
  ))
  const stars = (
    <>
      {/* in dialogs the title owns the top edge — park the moon bottom-right instead */}
      <div className="moon" style={inDialog ? { top: 'auto', bottom: 16, right: 16 } : undefined} />
      {NIGHT_STARS.map(([x, y], i) => (
        <span key={i} className="star" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${(i % 6) * 0.45}s` }} />
      ))}
    </>
  )
  const broken = (n) => Array.from({ length: n }, (_, i) => (
    <div
      key={`b${i}`} className="cloud broken"
      style={{
        width: 70 + i * 34, height: 18 + i * 7, top: 12 + i * 28, left: `${5 + i * 28}%`,
        animationDuration: `${52 + i * 24}s`, animationDelay: `${-i * 19}s`,
      }}
    />
  ))
  const isDay = dp !== 'night'
  const warmGlow = dp === 'dawn' || dp === 'morning'
  const sunny = cond === 'clear' || cond === 'partly'
  return (
    <div className="sky-layer" aria-hidden="true">
      {sunny && dp === 'night' && stars}
      {sunny && isDay && dp !== 'sunset' && (
        <div
          className="sun-glow"
          style={warmGlow ? { background: 'radial-gradient(circle, rgba(255,196,120,.6), rgba(255,196,120,0) 70%)' } : undefined}
        />
      )}
      {sunny && dp === 'sunset' && (
        <div className="sun-glow" style={{ background: 'radial-gradient(circle, rgba(255,170,90,.55), rgba(255,170,90,0) 70%)', top: 'auto', bottom: -70, right: 50 }} />
      )}
      {cond === 'clear' && isDay && clouds(2, .5)}
      {cond === 'partly' && broken(dp === 'night' ? 2 : 3)}
      {cond === 'cloudy' && clouds(4, .8)}
      {(cond === 'rain' || cond === 'storm') && <>
        {clouds(cond === 'storm' ? 4 : 3, .55)}
        {falling(cond === 'storm' ? 20 : 14, 'drop', 0.9, 0.18)}
      </>}
      {cond === 'snow' && falling(12, 'flake', 3, 0.8)}
      {cond === 'fog' && [0, 1, 2].map(i => (
        <div key={i} className="fogband" style={{ top: 18 + i * 44, animationDuration: `${7 + i * 3}s`, opacity: .8 - i * .15 }} />
      ))}
      {cond === 'wind' && <>
        {[0, 1, 2, 3, 4].map(i => (
          <span key={i} className="gust" style={{ top: 16 + i * 32, animationDuration: `${2.2 + (i % 3) * 0.7}s`, animationDelay: `${i * 0.5}s` }} />
        ))}
        <span className="leafy" style={{ top: 30, animationDuration: '7s' }} />
        <span className="leafy" style={{ top: 80, animationDuration: '9s', animationDelay: '2.5s' }} />
      </>}
    </div>
  )
})

function CartGlyph(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="20" r="1.6" />
      <circle cx="17.5" cy="20" r="1.6" />
      <path d="M2.5 3.5h2.6l2.5 12h10.3l2.6-8.8H6.1" />
    </svg>
  )
}

function TopBar({ compact, dp, cond, brand, onBrand, onSearch, cartCount, plain, onTargets, onAccount }) {
  const openCart = useContext(CartCtx)
  const [hint, setHint] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setHint(h => (h + 1) % SEARCH_HINTS.length), 2500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className={`topbar ${compact ? 'compact' : ''}`}>
      {!plain && <SkyLayer dp={dp} cond={cond} />}
      <Flex align="center" gap="3" className="loc-row" mb="3">
        <Box flexGrow="1" style={{ cursor: 'pointer', minWidth: 0 }}>
          <Flex align="center" gap="2">
            <Text size="2" weight="bold" truncate style={{ color: '#fff' }}>Home · HSR Layout</Text>
            <ChevronDownIcon width={14} height={14} color="#fff" style={{ flex: 'none' }} />
          </Flex>
          <Text size="1" truncate as="div" style={{ color: 'rgba(255,255,255,.72)' }}>
            304, Maple Heights
          </Text>
        </Box>
        <div className="avatar" aria-label="Cart" onClick={openCart || undefined}>
          <CartGlyph />
          {cartCount > 0 && <span className="cart-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
        </div>
        <div className="avatar" onClick={onAccount || undefined}><PersonIcon width={19} height={19} /></div>
      </Flex>

      <TextField.Root
        size="3" radius="full" placeholder={SEARCH_HINTS[hint]} readOnly
        onClick={onSearch} onFocus={(e) => { e.target.blur(); onSearch() }}
        style={{ background: '#fff', boxShadow: '0 3px 10px rgba(0,0,0,.2)', cursor: 'pointer' }}
      >
        <TextField.Slot>
          <MagnifyingGlassIcon width={17} height={17} />
        </TextField.Slot>
      </TextField.Root>

      <div className="rewards-strip" onClick={() => scrollToId('leaderboard')}>
        <StarFilledIcon width={14} height={14} color="var(--amber-9)" style={{ flex: 'none' }} />
        <span className="tier-mini" style={{ background: '#98A2B3' }} />
        <Text size="1" weight="bold" truncate style={{ flex: 1, minWidth: 0 }}>
          Silver dealer · ahead of {Math.round(((MY_RANK.of - MY_RANK.rank) / MY_RANK.of) * 100)}% in your region
        </Text>
        <Text size="1" weight="bold" color="amber" style={{ flex: 'none' }}>View journey</Text>
        <ChevronRightIcon width={13} height={13} color="var(--amber-11)" style={{ flex: 'none' }} />
      </div>

      {plain && (
        <div className="tgt-mini" onClick={onTargets}>
          <Text size="1" weight="bold" style={{ color: '#fff', flex: 'none' }}>Monthly target</Text>
          <div className="tgt-mini-bar">
            <div className="tgt-mini-fill" style={{ width: `${Math.min(100, Math.round((TARGETS.monthly.done / TARGETS.monthly.target) * 100))}%` }} />
          </div>
          <Text size="1" weight="bold" style={{ color: '#fff', flex: 'none' }}>
            {Math.round((TARGETS.monthly.done / TARGETS.monthly.target) * 100)}% · ₹{Math.round((TARGETS.monthly.target - TARGETS.monthly.done) / 1000)}k to go
          </Text>
          <ChevronRightIcon width={12} height={12} color="rgba(255,255,255,.7)" style={{ flex: 'none' }} />
        </div>
      )}

      <div className="tabs-t">
        {HEADER_TABS.map((t, i) => {
          const key = BRAND_KEYS[i]
          return (
            <button key={t.l} className={`tab-t ${key === brand ? 'active' : ''}`} onClick={() => onBrand(key)}>
              <span className="tab-chip">
                {t.logo
                  ? <img src={t.logo} alt={t.l} />
                  : <DashboardIcon width={16} height={16} color="var(--gray-11)" />}
              </span>
              <span className="lb">{t.l}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ---------------- Banners ---------------- */

function BannerCarousel({ quizSkin, onGlow }) {
  const ref = useRef(null)
  const [idx, setIdx] = useState(0)

  // the header sheet's bottom tint follows the active banner
  useEffect(() => {
    const b = BANNERS[idx]
    if (b && onGlow) onGlow(b.key === 'quiz' ? quizSkin.btn : (b.glow || null))
  }, [idx, quizSkin, onGlow])

  useEffect(() => {
    const t = setInterval(() => {
      const el = ref.current
      if (!el) return
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % BANNERS.length
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
    }, 3800)
    return () => clearInterval(t)
  }, [])

  const onScroll = () => {
    const el = ref.current
    if (el) setIdx(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <Box>
      <div className="banner-car" ref={ref} onScroll={onScroll}>
        {BANNERS.map(b => (
          <div className="banner-slide" key={b.key}>
            <div className="banner-inner" style={{ background: b.key === 'quiz' ? quizSkin.bg : b.bg }}>
              <Box flexGrow="1">
                <Heading size="6" style={{ color: b.dark ? '#2b2200' : '#fff', letterSpacing: '-0.4px', lineHeight: 1.15 }}>
                  {b.title}
                </Heading>
                <Text size="2" weight="medium" as="div" mt="1" style={{ color: b.dark ? '#5c4a00' : 'rgba(255,255,255,.9)' }}>
                  {b.sub}
                </Text>
                <Button
                  size="2" mt="3" radius="full"
                  color={b.dark ? 'green' : undefined}
                  style={{ fontWeight: 700, ...(b.dark ? {} : { background: '#fff', color: 'var(--gray-12)' }) }}
                  onClick={() => b.anchor && scrollToId(b.anchor)}
                >
                  {b.cta}
                </Button>
              </Box>
              <Img className="banner-img" src={img(b.ph, 280)} alt="" />
            </div>
          </div>
        ))}
      </div>
    </Box>
  )
}

/* ---------------- Shared bits ---------------- */

/* Deal window persists across refreshes; rolls to a new 30-min window when it expires */
function dealSecsLeft() {
  const left = Math.floor((Number(localStorage.getItem('qc-deal-end')) - Date.now()) / 1000)
  if (left > 0) return left
  localStorage.setItem('qc-deal-end', String(Date.now() + 30 * 60 * 1000))
  return 30 * 60
}

function DealTimer() {
  const [secs, setSecs] = useState(dealSecsLeft)
  useEffect(() => {
    const t = setInterval(() => setSecs(dealSecsLeft()), 1000)
    return () => clearInterval(t)
  }, [])
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  return (
    <span className="timer-chip">
      <span className="timer-dot" /> Ends in {mm}:{ss}
    </span>
  )
}

function SectionHead({ title, extra, light, sub, onSeeAll }) {
  return (
    <Box px="4" mb="3">
      <Flex align="center" justify="between">
        <Flex align="center" gap="3" style={{ minWidth: 0 }}>
          <Heading size="4" style={{ letterSpacing: '-0.2px', ...(light ? { color: '#fff' } : {}) }}>
            {title}
          </Heading>
          {extra}
        </Flex>
        {onSeeAll && (
          <Text
            size="2" weight="bold" color={light ? undefined : 'green'} onClick={onSeeAll}
            style={{ cursor: 'pointer', flex: 'none', ...(light ? { color: 'rgba(255,255,255,.9)' } : {}) }}
          >
            See all
          </Text>
        )}
      </Flex>
      {sub && (
        <Text size="1" as="div" mt="1" style={light ? { color: 'rgba(255,255,255,.85)' } : { color: 'var(--gray-10)' }}>
          {sub}
        </Text>
      )}
    </Box>
  )
}

function AddControl({ qty, onAdd, onRemove, onBulk }) {
  // bulk sheet opens on long-press of the count — a plain tap between − and +
  // must never pop a sheet (fat-finger hazard on the highest-frequency control)
  const lpTimer = useRef(null)
  useEffect(() => () => clearTimeout(lpTimer.current), [])
  const lpStart = onBulk ? () => { lpTimer.current = setTimeout(onBulk, 450) } : undefined
  const lpEnd = onBulk ? () => clearTimeout(lpTimer.current) : undefined
  if (qty === 0) {
    return (
      <Button
        className="padd stepin" variant="outline" color="green" size="2"
        onClick={onAdd} style={{ fontWeight: 800, margin: 0 }}
      >
        ADD
      </Button>
    )
  }
  return (
    <Flex className="padd stepin on" align="center" justify="between" style={{ background: 'var(--green-11)' }}>
      <IconButton size="1" aria-label="Decrease quantity" onClick={onRemove} style={{ background: 'transparent', color: '#fff' }}>
        <MinusIcon />
      </IconButton>
      <Text
        key={qty} className="numpop"
        size="2" weight="bold" style={{ color: '#fff', userSelect: 'none' }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={lpStart} onPointerUp={lpEnd} onPointerLeave={lpEnd} onPointerCancel={lpEnd}
      >
        {qty}
      </Text>
      <IconButton size="1" aria-label="Increase quantity" onClick={onAdd} style={{ background: 'transparent', color: '#fff' }}>
        <PlusIcon />
      </IconButton>
    </Flex>
  )
}

const ProductCard = memo(function ProductCard({ p, grid, onChange }) {
  const qty = useContext(CartItemsCtx)[p.id]?.n || 0
  const openQty = useContext(QtyCtx)
  const openPdp = useContext(PdpCtx)
  const add = (e) => {
    e.stopPropagation()
    if (qty === 0 && openQty) { openQty(p); return }
    onChange(1, p); sparkle(e)
  }
  const remove = (e) => { e?.stopPropagation(); onChange(-1, p) }

  const oos = p.stock === 0
  return (
    <div className={`pcard ${grid ? 'grid' : ''}`} onClick={openPdp ? () => openPdp(p) : undefined}>
      <div className="pimg-wrap">
        <Img className={`pimg ${oos ? 'oos' : ''}`} src={img(p.ph, 360)} alt={p.name} loading="lazy" />
        {(p.tag || (p.mrp && p.mrp > p.price)) && (
          <span className="pbadge">{p.tag || `${Math.round(((p.mrp - p.price) / p.mrp) * 100)}% OFF`}</span>
        )}
        <AddControl qty={qty} onAdd={add} onRemove={remove} onBulk={openQty ? () => openQty(p) : undefined} />
      </div>
      {p.usual && <span className="usual-pill">YOUR USUAL</span>}
      <Text size="2" weight="bold" as="div" mt={p.usual ? '1' : '3'} className="clamp2" style={{ fontSize: 13, lineHeight: 1.3, minHeight: 34 }}>
        {p.name}
      </Text>
      <Text size="1" color="gray" as="div" truncate>{p.qty}</Text>
      {p.buys && (
        <div className="sp-row">
          <LightningBoltIcon width={10} height={10} />
          <Text size="1" weight="bold" style={{ fontSize: 10.5 }}>{p.buys}</Text>
        </div>
      )}
      {p.rating && !p.buys && (
        <div className="rating-row">
          <StarFilledIcon width={10} height={10} color="var(--amber-9)" />
          <Text size="1" weight="medium" color="gray" style={{ fontSize: 10.5 }}>{p.rating}</Text>
        </div>
      )}
      {/* pinned to card bottom so price lines align across every card in a shelf */}
      <div className="price-block">
        {p.stock != null && (
          <Text size="1" as="div" weight="bold" style={{
            fontSize: 10.5,
            color: oos ? 'var(--red-10)' : p.stock <= 10 ? 'var(--amber-11)' : 'var(--green-10)',
          }}>
            {oos
              ? `Out of stock · ships in ${p.lead} days`
              : p.stock <= 10 ? `Only ${p.stock} left` : `In stock · ${p.stock}+ pcs`}
          </Text>
        )}
        <Flex align="center" gap="2">
          <Text size="2" weight="bold">₹{p.price.toLocaleString('en-IN')}</Text>
          {p.mrp && (
            <Text size="1" color="gray" style={{ textDecoration: 'line-through' }}>₹{p.mrp.toLocaleString('en-IN')}</Text>
          )}
        </Flex>
        {p.bulk && (
          <Text size="1" as="div" weight="bold" style={{ fontSize: 10.5, color: 'var(--blue-11)' }}>
            Bulk: {p.bulk}
          </Text>
        )}
        {(() => {
          const n = bulkNudge(p, qty)
          return n ? (
            <div key={n.text} className={`qnudge ${n.done ? 'done' : ''}`}>
              {n.done && <CheckIcon width={11} height={11} style={{ flex: 'none' }} />}{n.text}
            </div>
          ) : null
        })()}
      </div>
    </div>
  )
})

function Shelf({ title, items, onChange, extra, band, light, id, sub, onSeeAll }) {
  const inner = (
    <>
      <SectionHead title={title} extra={extra} light={light} sub={sub} onSeeAll={onSeeAll} />
      <div className="hscroll">
        {items.map(p => <ProductCard key={p.id} p={p} onChange={onChange} />)}
      </div>
    </>
  )
  if (band) return <div className={`${band} cv`} id={id}>{inner}</div>
  return <Box pt="5" id={id} className="cv">{inner}</Box>
}

/* ---------------- Category listing page (PLP) ---------------- */

const CAT_RULES = {
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

const PLP_RAIL = [['1503387762-592deb58ef4e', 'All'], ...CATEGORIES]

/* "People also add" pairing rules: added item → complementary product id */
const RECO_RULES = [
  [/slide|drawer/i, 'x2'],
  [/hinge/i, 'ba1'],
  [/lock|bolt/i, 'ba4'],
  [/light|strip|profile|sensor|night/i, 'ls5'],
  [/keyboard|monitor|cpu|cable|grommet/i, 'ws5'],
]
const catOf = (x) => Object.keys(CAT_RULES).find(k => k !== 'All' && CAT_RULES[k](x))
function recosFor(p) {
  const rule = RECO_RULES.find(([re]) => re.test(p.name))
  const pairId = rule ? rule[1] : 'ba5'
  const list = []
  const pair = FEED_POOL.find(x => x.id === pairId && x.id !== p.id)
  if (pair) list.push(pair)
  FEED_POOL.filter(x => x.id !== p.id && catOf(x) === catOf(p))
    .forEach(x => { if (!list.some(y => y.id === x.id)) list.push(x) })
  return list.slice(0, 6)
}

const SORT_OPTIONS = ['Popular', 'Price: low → high', 'Price: high → low', 'Biggest discount']

/* Subcategory level of the IA: Brand → Category (rail) → Subcategory (image chips) → Product.
   [label, keyword matcher] — chip thumbnails resolve from the first matching product. */
const SUBCATS = {
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

const subcatThumb = (kw) =>
  FEED_POOL.find(p => `${p.name} ${p.qty}`.toLowerCase().includes(kw))?.ph

/* Category-led home shelves (default) — users shop by product, not brand.
   Brand-led layout is preserved at #brandhome (and git tag v1-brand-home). */
const CAT_SHELVES = [
  { t: 'Drawer slides & systems', cat: 'Drawer Slides', band: 'band-green' },
  { t: 'Hinges & flap fittings', cat: 'Hinges' },
  { t: 'Kitchen systems', cat: 'Kitchen' },
  { t: 'Locks & security', cat: 'Locks', band: 'band-pink' },
  { t: 'Lighting & smart living', cat: 'Lighting' },
  { t: 'Office fittings', cat: 'Office' },
]
const catShelfSub = (cat) => (SUBCATS[cat] || []).map(s => s[0]).slice(0, 3).join(' · ')

const MERCH_ROWS = [
  { icon: 'gst', t: 'GST input credit on every invoice', s: 'Business billing built in' },
  { icon: 'truck', t: 'Free delivery above ₹999', s: 'Straight to your site, no surge' },
]

/* "People also add" strip — shared by PLP and Search */
function RecoStrip({ items, onClose, onChange }) {
  const openQty = useContext(QtyCtx)
  const openPdp = useContext(PdpCtx)
  if (!items || items.length === 0) return null
  return (
    <div className="rstrip">
      <Flex align="center" justify="between" px="3" pb="2">
        <Text size="1" weight="bold" style={{ color: 'var(--green-11)', fontSize: 10.5 }}>
          PEOPLE ALSO ADD
        </Text>
        <button className="reco-x" onClick={onClose} aria-label="Dismiss">
          <Cross2Icon width={12} height={12} />
        </button>
      </Flex>
      <div className="rstrip-scroll">
        {items.map(x => (
          <div key={`rs-${x.id}`} className="rmini" onClick={openPdp ? () => openPdp(x) : undefined}>
            <div style={{ position: 'relative' }}>
              <Img src={img(x.ph, 220)} alt={x.name} loading="lazy" />
              {(x.tag || (x.mrp && x.mrp > x.price)) && (
                <span className="pbadge" style={{ fontSize: 9, padding: '3px 6px', top: 6, left: 6 }}>
                  {x.tag || `${Math.round(((x.mrp - x.price) / x.mrp) * 100)}% OFF`}
                </span>
              )}
            </div>
            <Text as="div" weight="bold" className="clamp2" style={{ fontSize: 12, lineHeight: 1.3, height: 31 }}>
              {x.name}
            </Text>
            <Text as="div" color="gray" truncate style={{ fontSize: 10.5 }}>{x.qty}</Text>
            {x.stock != null && (
              <Text as="div" weight="bold" style={{
                fontSize: 10,
                color: x.stock === 0 ? 'var(--red-10)' : x.stock <= 10 ? 'var(--amber-11)' : 'var(--green-10)',
              }}>
                {x.stock === 0 ? `Ships in ${x.lead} days` : x.stock <= 10 ? `Only ${x.stock} left` : `In stock · ${x.stock}+`}
              </Text>
            )}
            <Flex align="center" justify="between" mt="1">
              <Box>
                <Flex align="center" gap="1">
                  <Text size="2" weight="bold">₹{x.price.toLocaleString('en-IN')}</Text>
                  {x.mrp && <Text style={{ fontSize: 10, textDecoration: 'line-through', color: 'var(--gray-9)' }}>₹{x.mrp.toLocaleString('en-IN')}</Text>}
                </Flex>
                {x.bulk && (
                  <Text as="div" weight="bold" style={{ fontSize: 9.5, color: 'var(--blue-11)' }}>
                    Bulk: {x.bulk}
                  </Text>
                )}
              </Box>
              <Button
                size="1" color="green" radius="full" style={{ fontWeight: 800, height: 26, padding: '0 12px', flex: 'none' }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (openQty) openQty(x, null, { noReco: true })
                  else { onChange(1, x, { noReco: true }); sparkle(e) }
                }}
              >
                ADD
              </Button>
            </Flex>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Shared filter system: subcat · brand · material · load · size · deals · sort ---------- */

const DEFAULT_F = { deals: false, spec: null, sort: 0, mat: null, load: 0, size: null, doorThk: null, carcassThk: null }
const MATERIALS = [...new Set(FEED_POOL.map(p => p.mat).filter(Boolean))]
const SIZES = [450, 500, 600]
const matThumb = (m) => FEED_POOL.find(p => p.mat === m)?.ph

function applyF(list, f, b) {
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

const fBadges = (f, b) => ({
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

const fSummary = (f, b) => [
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

function FilterSheet({ group, onGroup, cat = 'All', b, setB, f, setF, count }) {
  if (!group) return null
  const set = (patch) => setF(cur => ({ ...cur, ...patch }))
  const badges = fBadges(f, b)
  const groups = [
    ['sub', 'Subcategory'], ['brand', 'Brand'], ['material', 'Material'],
    // spec filters appear only where the category carries the spec
    ...(cat === 'Hinges' ? [['doorThk', 'Door thk'], ['carcassThk', 'Carcass']] : []),
    ['load', 'Load'], ['size', 'Size'], ['deal', 'Deals'], ['sort', 'Sort'],
  ]
  return (
    <div className="bsheet-overlay" onClick={() => onGroup(null)}>
      <div className="bsheet fsheet" onClick={(e) => e.stopPropagation()}>
        <Flex align="center" justify="between" px="4" pt="4" pb="3">
          <Heading size="4">Filters & sorting</Heading>
          <Text size="2" weight="bold" color="red" style={{ cursor: 'pointer' }}
            onClick={() => { setB('ALL'); setF(DEFAULT_F) }}>
            Clear all
          </Text>
        </Flex>
        <div className="fs-body">
          <div className="fs-rail">
            {groups.map(([k, l]) => (
              <div key={k} className={`fs-group ${group === k ? 'on' : ''}`} onClick={() => onGroup(k)}>
                {badges[k] > 0 && <span className="fs-badge">{badges[k]}</span>}
                <Text size="1" weight="bold">{l}</Text>
              </div>
            ))}
          </div>
          <div className="fs-pane">
            {group === 'sub' && (
              cat === 'All' ? (
                <Text size="2" color="gray">
                  Pick a category first — subcategories live inside each category.
                </Text>
              ) : (
                <div className="fs-tiles">
                  {(SUBCATS[cat] || []).map(([label, kw]) => {
                    const th = subcatThumb(kw)
                    const on = f.spec?.[1] === kw
                    return (
                      <button key={kw} className={`fs-tile ${on ? 'on' : ''}`} onClick={() => set({ spec: on ? null : [label, kw] })}>
                        {th && <Img className="ph" src={img(th, 220)} alt="" />}
                        <div className="fs-cap"><Text size="2" weight="bold">{label}</Text></div>
                      </button>
                    )
                  })}
                </div>
              )
            )}
            {group === 'brand' && (
              <div className="fs-tiles">
                <button className={`fs-tile ${b === 'ALL' ? 'on' : ''}`} onClick={() => setB('ALL')}>
                  <div className="media">
                    <DashboardIcon width={26} height={26} color="var(--gray-11)" />
                  </div>
                  <div className="fs-cap"><Text size="2" weight="bold">All brands</Text></div>
                </button>
                {BRAND_KEYS.slice(1).map(k => (
                  <button key={k} className={`fs-tile ${b === k ? 'on' : ''}`} onClick={() => setB(cur => (cur === k ? 'ALL' : k))}>
                    <div className="media">
                      <img className="lg" src={BRAND_LOGOS[k]} alt={k} />
                    </div>
                    <div className="fs-cap"><Text size="2" weight="bold">{k.charAt(0).toUpperCase() + k.slice(1)}</Text></div>
                  </button>
                ))}
              </div>
            )}
            {group === 'material' && (
              <div className="fs-tiles">
                {MATERIALS.map(m => {
                  const th = matThumb(m)
                  const on = f.mat === m
                  return (
                    <button key={m} className={`fs-tile ${on ? 'on' : ''}`} onClick={() => set({ mat: on ? null : m })}>
                      {th && <Img className="ph" src={img(th, 220)} alt="" />}
                      <div className="fs-cap"><Text size="2" weight="bold">{m}</Text></div>
                    </button>
                  )
                })}
              </div>
            )}
            {group === 'load' && (
              <Box>
                <Flex align="center" justify="between">
                  <Text size="2" weight="bold">Min load capacity</Text>
                  <Text size="2" weight="bold" style={{ color: 'var(--green-11)' }}>
                    {f.load > 0 ? `≥ ${f.load} kg` : 'Any'}
                  </Text>
                </Flex>
                <input
                  type="range" className="ldr" min="0" max="60" step="5" value={f.load}
                  onChange={(e) => set({ load: +e.target.value })}
                />
                <Flex align="center" justify="between">
                  <Text size="1" color="gray">Any</Text>
                  <Text size="1" color="gray">60 kg</Text>
                </Flex>
                <Text size="1" color="gray" as="div" mt="3">
                  Filters slides, systems & arms by rated load. Unrated items hide when set.
                </Text>
              </Box>
            )}
            {group === 'size' && (
              <div className="fs-tiles">
                {SIZES.map(sz => {
                  const on = f.size === sz
                  return (
                    <button key={sz} className={`fs-tile ${on ? 'on' : ''}`} onClick={() => set({ size: on ? null : sz })}>
                      <div className="media"><Text weight="bold" style={{ fontSize: 24 }}>{sz}<span style={{ fontSize: 13 }}>mm</span></Text></div>
                      <div className="fs-cap"><Text size="2" weight="bold">{sz} mm</Text></div>
                    </button>
                  )
                })}
              </div>
            )}
            {group === 'doorThk' && (
              <div className="fs-tiles">
                {[16, 18, 19, 25].map(v => {
                  const on = f.doorThk === v
                  return (
                    <button key={v} className={`fs-tile ${on ? 'on' : ''}`} onClick={() => set({ doorThk: on ? null : v })}>
                      <div className="media"><Text weight="bold" style={{ fontSize: 24 }}>{v}<span style={{ fontSize: 13 }}>mm</span></Text></div>
                      <div className="fs-cap"><Text size="2" weight="bold">{v} mm door</Text></div>
                    </button>
                  )
                })}
              </div>
            )}
            {group === 'carcassThk' && (
              <div className="fs-tiles">
                {[16, 18].map(v => {
                  const on = f.carcassThk === v
                  return (
                    <button key={v} className={`fs-tile ${on ? 'on' : ''}`} onClick={() => set({ carcassThk: on ? null : v })}>
                      <div className="media"><Text weight="bold" style={{ fontSize: 24 }}>{v}<span style={{ fontSize: 13 }}>mm</span></Text></div>
                      <div className="fs-cap"><Text size="2" weight="bold">{v} mm board</Text></div>
                    </button>
                  )
                })}
              </div>
            )}
            {group === 'deal' && (
              <div className="fs-tiles">
                <button className={`fs-tile ${!f.deals ? 'on' : ''}`} onClick={() => set({ deals: false })}>
                  <div className="media media-ic"><DashboardIcon width={26} height={26} /></div>
                  <div className="fs-cap"><Text size="2" weight="bold">All items</Text></div>
                </button>
                <button className={`fs-tile ${f.deals ? 'on' : ''}`} onClick={() => set({ deals: true })}>
                  <div className="media media-ic"><LightningBoltIcon width={26} height={26} /></div>
                  <div className="fs-cap"><Text size="2" weight="bold">Deals only</Text></div>
                </button>
              </div>
            )}
            {group === 'sort' && SORT_OPTIONS.map((o, i) => (
              <button key={o} className="bsheet-row" onClick={() => set({ sort: i })}>
                <span className={`radio ${i === f.sort ? 'on' : ''}`} />
                <Text size="2" weight={i === f.sort ? 'bold' : 'medium'}>{o}</Text>
              </button>
            ))}
          </div>
        </div>
        <div className="fs-foot">
          <Button size="3" variant="soft" color="gray" radius="full" onClick={() => onGroup(null)}>
            Close
          </Button>
          <Button size="3" color="green" radius="full" style={{ flex: 1, fontWeight: 800 }} onClick={() => onGroup(null)}>
            Show {count} result{count === 1 ? '' : 's'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function CategoryPage({ cat, onPick, onClose, onChange, onSearch, cart, homeBrand = 'ALL', recoStrip, onRecoClose }) {
  const [b, setB] = useState(homeBrand)
  const [f, setF] = useState(DEFAULT_F)
  // #fsheet hash opens the filter sheet for design review
  const [fOpen, setFOpen] = useState(() => {
    const m = window.location.hash.match(/^#fsheet(?:-(\w+))?$/)
    return m ? (m[1] || 'sub') : null
  })
  const mainRef = useRef(null)
  const badgeTotal = Object.values(fBadges(f, b)).reduce((a, x) => a + x, 0)

  // rail hop → back to top, and subcategories are category-specific so they reset
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
    setF(cur => ({ ...cur, spec: null }))
  }, [cat])

  const inCat = useMemo(() => FEED_POOL.filter(CAT_RULES[cat] || (() => true)), [cat])
  const dealsAvail = inCat.filter(p => p.tag).length

  const products = useMemo(() => applyF(inCat, f, b), [inCat, f, b])

  const railImg = (PLP_RAIL.find(r => r[1] === cat) || PLP_RAIL[0])[0]
  const pageReady = useNextFrame()
  const gridKey = `${cat}|${b}|${JSON.stringify(f)}`
  const summary = [
    `${products.length} item${products.length === 1 ? '' : 's'}`,
    ...fSummary(f, b),
  ].join(' · ')

  // merch strip after every 6th product breaks grid monotony
  const cells = []
  products.forEach((p, i) => {
    if (i > 0 && i % 6 === 0) cells.push({ merchIdx: (i / 6 - 1) % MERCH_ROWS.length })
    cells.push(p)
  })

  return (
    <div className="plp">
      <div className="plp-head">
        <button className="sheet-back" onClick={onClose} aria-label="Back">
          <ArrowLeftIcon width={18} height={18} />
        </button>
        <Box style={{ flex: 1, textAlign: 'center' }}>
          <Heading size="4" style={{ letterSpacing: '-0.2px' }}>
            {cat === 'All' ? 'All fittings' : cat}
          </Heading>
          {b !== 'ALL' && (
            <Text size="1" color="gray" as="div" style={{ marginTop: 1 }}>
              {b.charAt(0).toUpperCase() + b.slice(1)} store
            </Text>
          )}
        </Box>
        <button className="sheet-back" onClick={onSearch} aria-label="Search">
          <MagnifyingGlassIcon width={18} height={18} />
        </button>
      </div>
      <div className="plp-body">
        <div className="plp-rail">
          {PLP_RAIL.map(([ph, label]) => (
            <div key={label} className={`rail-item ${label === cat ? 'on' : ''}`} onClick={() => onPick(label)}>
              <Img src={img(ph, 140)} alt={label} loading="lazy" />
              <span className="rl">{label}</span>
            </div>
          ))}
        </div>
        <div className="plp-main" ref={mainRef}>
          <div className="plp-sticky">
            <div className="plp-chips">
              <button className={`pchip ${badgeTotal > 0 ? 'on' : ''}`} onClick={() => setFOpen(cat === 'All' ? 'material' : 'sub')}>
                <MixerHorizontalIcon width={13} height={13} />
                Filters{badgeTotal > 0 ? ` · ${badgeTotal}` : ''}
              </button>
              <button className={`pchip ${f.sort > 0 ? 'on' : ''}`} onClick={() => setFOpen('sort')}>
                {f.sort > 0 ? SORT_OPTIONS[f.sort] : 'Sort'} <ChevronDownIcon width={13} height={13} />
              </button>
              <button className={`pchip ${f.deals ? 'on' : ''}`} onClick={() => setF(cur => ({ ...cur, deals: !cur.deals }))}>
                Deals only
              </button>
              {(SUBCATS[cat] || []).map(([label, kw]) => {
                const th = subcatThumb(kw)
                return (
                  <button
                    key={kw} className={`pchip ${f.spec?.[1] === kw ? 'on' : ''}`}
                    onClick={() => setF(cur => ({ ...cur, spec: cur.spec?.[1] === kw ? null : [label, kw] }))}
                  >
                    {th && <Img className="pi" src={img(th, 80)} alt="" />}
                    {label}
                  </button>
                )
              })}
              {BRAND_KEYS.slice(1).map(k => (
                <button key={k} className={`pchip ${b === k ? 'on' : ''}`} onClick={() => setB(cur => (cur === k ? 'ALL' : k))}>
                  <img className="pi-logo" src={BRAND_LOGOS[k]} alt="" />
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            className="plp-banner"
            onClick={() => dealsAvail > 0 && setF(cur => ({ ...cur, deals: !cur.deals }))}
            style={{ cursor: dealsAvail > 0 ? 'pointer' : 'default' }}
          >
            <Box flexGrow="1">
              <Text size="3" weight="bold" as="div" style={{ color: '#5c3a10', letterSpacing: '-0.2px' }}>
                {dealsAvail > 0
                  ? (f.deals ? 'Showing deals only' : `${dealsAvail} deal${dealsAvail === 1 ? '' : 's'} live in ${cat === 'All' ? 'fittings' : cat.toLowerCase()}`)
                  : `Pro picks: ${cat === 'All' ? 'every fitting' : cat.toLowerCase()}`}
              </Text>
              <Text size="1" weight="medium" as="div" mt="1" style={{ color: '#7a5420' }}>
                {dealsAvail > 0
                  ? (f.deals ? 'Tap to see everything again' : 'Trade prices · tap to show only deals')
                  : 'Trade prices · GST billing · 90-min delivery'}
              </Text>
            </Box>
            <Img src={img(railImg, 200)} alt="" />
          </button>

          <Box pt="2" pb="1">
            <Text size="1" color="gray">{summary}</Text>
          </Box>

          {!pageReady ? (
            <Grid columns="2" gapX="3" gapY="4" pt="1">
              {[0, 1, 2, 3].map(i => <div className="skel" key={`pk${i}`} />)}
            </Grid>
          ) : products.length > 0 ? (
            <Grid columns="2" gapX="3" gapY="4" pt="1" key={gridKey}>
              {cells.map((c, i) =>
                c.merchIdx != null ? (
                  <div className="merch-row cardin" key={`m${i}`} style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                    <span className="merch-ic">
                      {MERCH_ROWS[c.merchIdx].icon === 'gst'
                        ? <FileTextIcon width={18} height={18} />
                        : <RocketIcon width={18} height={18} />}
                    </span>
                    <Box>
                      <Text size="1" weight="bold" as="div" style={{ color: 'var(--blue-11)' }}>{MERCH_ROWS[c.merchIdx].t}</Text>
                      <Text as="div" style={{ fontSize: 11, color: 'var(--blue-11)', opacity: .8 }}>{MERCH_ROWS[c.merchIdx].s}</Text>
                    </Box>
                  </div>
                ) : (
                  <div className="cardin" key={`plp-${c.id}`} style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                    <ProductCard p={c} grid onChange={onChange} />
                  </div>
                ),
              )}
            </Grid>
          ) : (
            <Flex direction="column" align="center" py="8" gap="2">
              <Text size="2" weight="bold" color="gray">Nothing matches these filters</Text>
              <Button size="1" radius="full" variant="soft" onClick={() => { setB('ALL'); setF(DEFAULT_F) }}>
                Clear filters
              </Button>
            </Flex>
          )}
        </div>
      </div>
      <div className="plp-cartwrap">
        <RecoStrip items={recoStrip} onClose={onRecoClose} onChange={onChange} />
        <CartBar cart={cart} />
      </div>

      <FilterSheet
        group={fOpen} onGroup={setFOpen} cat={cat}
        b={b} setB={setB} f={f} setF={setF} count={products.length}
      />
    </div>
  )
}

/* Full-screen search / listing sheet — live filtering with category rail + brand chips */
function SearchSheet({ sheet, onClose, onChange, recoStrip, onRecoClose }) {
  const [q, setQ] = useState(sheet?.query || '')
  const [b, setB] = useState('ALL')
  const [cat, setCat] = useState('All')
  const [f, setF] = useState(DEFAULT_F)
  const [fOpen, setFOpen] = useState(null)
  const [pageReady, setPageReady] = useState(false)
  useEffect(() => { setQ(sheet?.query || ''); setB('ALL'); setCat('All'); setF(DEFAULT_F); setFOpen(null) }, [sheet])
  useEffect(() => {
    setPageReady(false)
    if (!sheet) return
    const id = requestAnimationFrame(() => setPageReady(true))
    return () => cancelAnimationFrame(id)
  }, [sheet])
  if (!sheet) return null

  const ql = q.trim().toLowerCase()
  const base = applyF(sheet.items.filter(CAT_RULES[cat] || (() => true)), f, b)
  // tokenized AND-match over name/pack/brand/material, hyphen + plural tolerant
  const snorm = (s) => s.toLowerCase().replace(/-/g, ' ')
  const tokens = snorm(ql).split(/\s+/).filter(Boolean).map(t => t.replace(/s$/, ''))
  const hits = base.filter(p => {
    if (tokens.length === 0) return true
    const hay = snorm(`${p.name} ${p.qty || ''} ${p.brand} ${p.mat || ''}`)
    return tokens.every(t => hay.includes(t))
  })
  const fallback = ql && hits.length === 0
  const shown = fallback ? base : hits

  return (
    <div className="sheet">
      <div className="sheet-head">
        <button className="sheet-back" onClick={onClose} aria-label="Back">
          <ArrowLeftIcon width={18} height={18} />
        </button>
        <TextField.Root
          size="3" radius="full" autoFocus value={q} placeholder="Search fittings, brands, sizes…"
          onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }}
        >
          <TextField.Slot>
            <MagnifyingGlassIcon width={16} height={16} />
          </TextField.Slot>
        </TextField.Root>
        <button
          className="sheet-back" aria-label="Filters" style={{ position: 'relative' }}
          onClick={() => setFOpen(cat === 'All' ? 'material' : 'sub')}
        >
          <MixerHorizontalIcon width={17} height={17} />
          {Object.values(fBadges(f, b)).reduce((a, x) => a + x, 0) > 0 && (
            <span className="fs-dot" />
          )}
        </button>
      </div>
      <div className="plp-body">
        <div className="plp-rail">
          {PLP_RAIL.map(([ph, label]) => (
            <div key={label} className={`rail-item ${label === cat ? 'on' : ''}`} onClick={() => setCat(label)}>
              <Img src={img(ph, 140)} alt={label} loading="lazy" />
              <span className="rl">{label}</span>
            </div>
          ))}
        </div>
        <div className="plp-main">
          <div className="sheet-brands" style={{ padding: '12px 0 2px' }}>
            {BRAND_KEYS.map(k => (
              <button key={k} className={`sim-chip ${b === k ? 'on' : ''}`} onClick={() => setB(k)}>
                {k !== 'ALL' && (
                  <span className="lgchip"><img src={BRAND_LOGOS[k]} alt="" /></span>
                )}
                {k === 'ALL' ? 'All brands' : k.charAt(0).toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
          <Box pt="2">
            <Text size="1" color="gray">
              {fallback
                ? `No exact matches for “${q}” — showing everything${cat !== 'All' ? ` in ${cat}` : ''}`
                : [
                    `${shown.length} item${shown.length === 1 ? '' : 's'}`,
                    cat !== 'All' && cat,
                    ...fSummary(f, b),
                    sheet.title,
                  ].filter(Boolean).join(' · ')}
            </Text>
          </Box>
          {pageReady && shown.length === 0 ? (
            <Flex direction="column" align="center" py="8" gap="2">
              <Text size="2" weight="bold" color="gray">Nothing matches these filters</Text>
              <Button size="1" radius="full" variant="soft" onClick={() => { setB('ALL'); setF(DEFAULT_F); setCat('All') }}>
                Clear filters
              </Button>
            </Flex>
          ) : (
            <Grid columns="2" gapX="3" gapY="4" pt="3" pb="9">
              {pageReady
                ? shown.map(p => <ProductCard key={`s-${p.id}`} p={p} grid onChange={onChange} />)
                : [0, 1, 2, 3].map(i => <div className="skel" key={`sk${i}`} />)}
            </Grid>
          )}
        </div>
      </div>
      <div className="sheet-reco">
        <RecoStrip items={recoStrip} onClose={onRecoClose} onChange={onChange} />
      </div>
      <FilterSheet
        group={fOpen} onGroup={setFOpen} cat={cat}
        b={b} setB={setB} f={f} setF={setF} count={shown.length}
      />
    </div>
  )
}

/* ---------------- Seasonal: combos + monsoon store ---------------- */

function ComboDeals({ onChange }) {
  return (
    <Box pt="5">
      <SectionHead title="Combo kits" extra={<span className="save-pill">BUNDLE & SAVE</span>} />
      <div className="hscroll">
        {COMBOS.map(c => <ComboCard key={c.id} c={c} onChange={onChange} />)}
      </div>
    </Box>
  )
}

function ComboCard({ c, onChange }) {
  const p = { id: c.id, ph: c.ph, price: c.price, name: c.title, qty: c.items }
  const qty = useContext(CartItemsCtx)[p.id]?.n || 0
  const openQty = useContext(QtyCtx)
  const add = (e) => {
    e.stopPropagation()
    if (qty === 0 && openQty) { openQty(p, null, { noReco: true }); return }
    onChange(1, p); sparkle(e)
  }
  const remove = (e) => { e?.stopPropagation(); onChange(-1, p) }

  return (
    <div className="combo-card" style={{ background: c.tint }}>
      <div className="combo-head">
        <Text size="2" weight="bold" as="div" className="clamp1" style={{ letterSpacing: '-0.1px' }}>{c.title}</Text>
        <Text as="div" mt="1" className="clamp2" style={{ fontSize: 11, lineHeight: 1.35, color: 'var(--gray-10)', height: 30 }}>
          {c.items}
        </Text>
      </div>
      <div className="combo-img-wrap">
        <Img className="combo-img" src={img(c.ph, 360)} alt={c.title} loading="lazy" />
        <span className="combo-badge">-{Math.round(((c.was - c.price) / c.was) * 100)}%</span>
        <AddControl qty={qty} onAdd={add} onRemove={remove} />
      </div>
      <div className="combo-foot">
        <Flex align="baseline" gap="2">
          <Text weight="bold" style={{ fontSize: 16, letterSpacing: '-0.2px' }}>₹{c.price.toLocaleString('en-IN')}</Text>
          <Text size="1" color="gray" style={{ textDecoration: 'line-through' }}>₹{c.was.toLocaleString('en-IN')}</Text>
        </Flex>
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--green-11)', marginTop: 2 }}>
          You save ₹{(c.was - c.price).toLocaleString('en-IN')}
        </Text>
      </div>
    </div>
  )
}

/* ---------------- Quiz + leaderboard ---------------- */

function Bulbs({ n = 9 }) {
  return (
    <div className="blb-row" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => <i key={i} style={{ animationDelay: `${(i % 2) * 0.55}s` }} />)}
    </div>
  )
}

function QuizFlow({ onFinish, onLeaderboard, autoStart, skin }) {
  const [stage, setStage] = useState(autoStart ? 'playing' : 'idle') // idle | playing | done
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState(null)
  const [correct, setCorrect] = useState(0)
  const correctRef = useRef(0)
  const [tleft, setTleft] = useState(QUIZ_SECONDS)

  const start = () => { setStage('playing'); setQi(0); setCorrect(0); setPicked(null) }

  const advance = () => {
    if (qi + 1 < QUIZ.length) { setQi(q => q + 1); setPicked(null) }
    else {
      if (onFinish) onFinish()
      if (correctRef.current > 0) {
        saveCoupon({ label: `QUIZ ₹${correctRef.current * 25} OFF`, kind: 'amt', value: correctRef.current * 25 })
      }
      setStage('done')
    }
  }

  const pick = (i, e) => {
    if (picked !== null) return
    setPicked(i)
    const isRight = i === QUIZ[qi].a
    if (isRight) { correctRef.current += 1; setCorrect(c => c + 1); sparkle(e) }
    setTimeout(() => advance(), 900)
  }

  // 10s countdown per question — time out counts as a miss
  useEffect(() => {
    if (stage !== 'playing' || picked !== null) return
    setTleft(QUIZ_SECONDS)
    const iv = setInterval(() => setTleft(t => Math.max(0, t - 0.1)), 100)
    return () => clearInterval(iv)
  }, [stage, qi, picked])

  useEffect(() => {
    if (stage === 'playing' && picked === null && tleft === 0) {
      setPicked(-1)
      setTimeout(() => advance(), 900)
    }
  }, [tleft]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {stage === 'idle' && (
        <>
          <Bulbs n={9} />
          <Flex align="center" gap="3">
            <Box flexGrow="1">
              <span className="cz-pill">TONIGHT'S TABLE · {skin.name.toUpperCase()}</span>
              <div className="cz-title">QUIZ NIGHT</div>
              <Text size="2" as="div" mt="1" style={{ color: 'rgba(255,243,209,.85)' }}>
                3 questions · 10s each · win up to ₹{QUIZ.length * 25} off
              </Text>
              <button className="cz-btn gold" style={{ marginTop: 14 }} onClick={start}>
                <RocketIcon width={14} height={14} /> PLAY NOW
              </button>
            </Box>
            <div className="chipstack" aria-hidden="true">
              <span className="cas-chip c1" />
              <span className="cas-chip c2" />
              <span className="cas-chip c3" />
            </div>
          </Flex>
        </>
      )}

      {stage === 'playing' && (
        <Box>
          <Flex align="center" justify="between">
            <div className="cz-qdots">
              {QUIZ.map((_, i) => (
                <i key={i} className={i < qi ? 'done' : i === qi ? 'cur' : ''} />
              ))}
              <Text size="1" weight="bold" style={{ color: '#F5C242', marginLeft: 8, whiteSpace: 'nowrap' }}>
                ₹{correct * 25} in the bank
              </Text>
            </div>
            <div className="cz-chip"><span>{Math.ceil(tleft)}</span></div>
          </Flex>
          <div className="qbar" style={{ background: 'rgba(255,255,255,.18)', marginTop: 12 }}>
            <div
              className="qbar-fill"
              style={{ width: `${(tleft / QUIZ_SECONDS) * 100}%`, background: 'linear-gradient(90deg, #F5C242, #FFE9A8)' }}
            />
          </div>
          <div className="cz-q">
            <Text size="3" weight="bold" style={{ lineHeight: 1.35 }}>{QUIZ[qi].q}</Text>
          </div>
          <Box mt="3">
            {QUIZ[qi].opts.map((o, i) => {
              let cls = 'cz-opt'
              if (picked !== null && i === QUIZ[qi].a) cls += ' correct'
              else if (picked === i) cls += ' wrong'
              return (
                <button key={o} className={cls} disabled={picked !== null} onClick={(e) => pick(i, e)}>
                  {o}
                </button>
              )
            })}
          </Box>
        </Box>
      )}

      {stage === 'done' && (
        <div className="cz-done">
          <Bulbs n={9} />
          <div className={`cz-title big ${correct > 0 ? '' : 'dim'}`}>
            {correct > 0 ? 'JACKPOT!' : 'HOUSE WINS'}
          </div>
          <Text size="2" as="div" style={{ color: 'rgba(255,243,209,.85)' }}>
            {correct}/{QUIZ.length} correct{correct > 0 ? '' : ' — the table reopens tomorrow, 8 AM'}
          </Text>
          {correct > 0 && (
            <div className="cz-ticket">
              <span className="tk-amt">₹{correct * 25} OFF</span>
              <span className="tk-sub">auto-applies on your next order</span>
            </div>
          )}
          <button className="cz-btn" style={{ marginTop: 12 }} onClick={onLeaderboard}>
            VIEW LEADERBOARD
          </button>
        </div>
      )}
    </>
  )
}

function QuizCard({ onFinish, skin }) {
  return (
    <div className={`quiz-card czn cz-${skin.name.toLowerCase()}`} id="quiz">
      <QuizFlow skin={skin} onFinish={onFinish} onLeaderboard={() => scrollToId('leaderboard')} />
    </div>
  )
}

function QuizDialog({ open, onOpenChange, onFinish, skin }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className={`quiz-dialog czn cz-${skin.name.toLowerCase()}`} maxWidth="380px" aria-describedby={undefined}>
        <Dialog.Title size="3" mb="3" align="center" style={{ color: '#F5C242', letterSpacing: '2px', textShadow: '0 2px 0 rgba(0,0,0,.4)' }}>
          THE NIGHTLY TABLE
        </Dialog.Title>
        <button className="quiz-close" onClick={() => onOpenChange(false)} aria-label="Close">
          <Cross2Icon width={15} height={15} />
        </button>
        <QuizFlow
          autoStart skin={skin} onFinish={onFinish}
          onLeaderboard={() => {
            onOpenChange(false)
            setTimeout(() => scrollToId('leaderboard'), 250)
          }}
        />
      </Dialog.Content>
    </Dialog.Root>
  )
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

function GameRow({ onSpin }) {
  return (
    <div className="game-row">
      <button className="game-card game-spin" onClick={onSpin}>
        <DiscIcon width={28} height={28} color="#fff" />
        <Text size="3" weight="bold" as="div" mt="1" style={{ color: '#fff' }}>Spin & Win</Text>
        <Text size="1" as="div" mt="1" style={{ color: 'rgba(255,255,255,.88)' }}>
          1 free spin today · up to ₹250 off
        </Text>
      </button>
      <StreakCard />
    </div>
  )
}

/* streak derives from stored check-in days; day 7 issues a real coupon */
function streakDays() {
  try {
    const a = JSON.parse(localStorage.getItem('qc-streak-days') || '[]')
    return Array.isArray(a) ? a : []
  } catch { return [] }
}
function streakCount(days) {
  // consecutive run ending today or yesterday
  let count = 0
  const d = new Date()
  if (!days.includes(d.toDateString())) d.setDate(d.getDate() - 1)
  while (days.includes(d.toDateString())) {
    count += 1
    d.setDate(d.getDate() - 1)
  }
  return count
}

function StreakCard() {
  const [days, setDays] = useState(streakDays)
  const claimed = days.includes(DAY)
  const count = streakCount(days)
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const checkIn = (e) => {
    if (claimed) return
    const next = [...days.slice(-13), DAY]
    const c = streakCount(next)
    if (c >= 7) {
      saveCoupon({ label: 'STREAK ₹100 OFF', kind: 'amt', value: 100 })
      setDays([DAY]) // run banked as a coupon; streak restarts
      try { localStorage.setItem('qc-streak-days', JSON.stringify([DAY])) } catch { /* storage off */ }
    } else {
      setDays(next)
      try { localStorage.setItem('qc-streak-days', JSON.stringify(next)) } catch { /* storage off */ }
    }
    sparkle(e)
  }
  const justBanked = claimed && count === 1 && days.length === 1
  return (
    <button className="game-card game-streak" onClick={checkIn}>
      <Text size="3" weight="bold" as="div" style={{ color: '#fff' }}>
        {count}-day streak
      </Text>
      <Text size="1" as="div" mt="1" style={{ color: 'rgba(255,255,255,.88)' }}>
        {justBanked
          ? '₹100 coupon banked — applies on your next bill'
          : claimed
            ? `Checked in · ${Math.max(0, 7 - count)} more to ₹100 off`
            : 'Tap to check in · 7 days → ₹100 off your bill'}
      </Text>
      <div className="day-dots">
        {labels.map((d, i) => (
          <span key={i} className={`day-dot ${i < count ? 'hit' : ''} ${i === count && !claimed ? 'today' : ''}`}>
            {i < count ? '✓' : d}
          </span>
        ))}
      </div>
    </button>
  )
}

function SpinDialog({ open, onOpenChange }) {
  const [rot, setRot] = useState(0)
  const [state, setState] = useState(() =>
    localStorage.getItem('qc-spin-day') === DAY ? 'used' : 'ready') // ready | spinning | done | used
  const [prize, setPrize] = useState(null)
  const segs = 360 / WHEEL.length

  const spin = () => {
    if (state !== 'ready') return
    const k = Math.floor(Math.random() * WHEEL.length)
    setRot(360 * 5 + (360 - (k * segs + segs / 2)))
    setState('spinning')
    localStorage.setItem('qc-spin-day', DAY)
    setTimeout(() => {
      setPrize(WHEEL[k])
      const c = couponFromWheel(WHEEL[k].label)
      if (c) saveCoupon(c)
      setState('done')
    }, 4200)
  }

  // thin gold separators between prize segments
  const gradient = WHEEL.map((s, i) =>
    `#F5C242 ${i * segs}deg ${i * segs + 1.4}deg, ${s.color} ${i * segs + 1.4}deg ${(i + 1) * segs}deg`
  ).join(', ')

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="wheel-dialog czn" maxWidth="360px" aria-describedby={undefined}>
        <Bulbs n={11} />
        <Dialog.Title size="3" align="center" mb="0" style={{ color: '#F5C242', letterSpacing: '2px', textShadow: '0 2px 0 rgba(0,0,0,.4)' }}>
          SPIN & WIN
        </Dialog.Title>
        <button className="quiz-close" onClick={() => onOpenChange(false)} aria-label="Close">
          <Cross2Icon width={15} height={15} />
        </button>
        <div className="wheel-wrap">
          <div className="wheel-rim" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => (
              <span
                key={i} className="rim-blb"
                style={{ transform: `rotate(${i * 30}deg) translateY(-131px)`, animationDelay: `${(i % 2) * 0.55}s` }}
              />
            ))}
          </div>
          <div className="wheel-pointer" />
          <div
            className="wheel"
            style={{ background: `conic-gradient(${gradient})`, transform: `rotate(${rot}deg)` }}
          >
            {WHEEL.map((s, i) => (
              <div key={s.label} className="wheel-lab" style={{ transform: `rotate(${i * segs + segs / 2}deg)` }}>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <button className="wheel-hub" onClick={spin} style={{ border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            SPIN
          </button>
        </div>
        {state === 'done' && prize ? (
          <Flex direction="column" align="center" gap="1" mt="3" pb="2">
            <div className={`cz-title big ${prize.label === 'TRY AGAIN' ? 'dim' : ''}`}>
              {prize.label === 'TRY AGAIN' ? 'SO CLOSE!' : 'WINNER!'}
            </div>
            {prize.label === 'TRY AGAIN' ? (
              <Text size="2" align="center" style={{ color: 'rgba(255,243,209,.85)' }}>
                The house edges it tonight — your free spin is back tomorrow.
              </Text>
            ) : (
              <div className="cz-ticket">
                <span className="tk-amt">{prize.label}</span>
                <span className="tk-sub">auto-applies on your next order</span>
              </div>
            )}
            <button className="cz-btn gold" style={{ marginTop: 10 }} onClick={() => onOpenChange(false)}>
              KEEP SHOPPING
            </button>
          </Flex>
        ) : state === 'used' ? (
          <Flex direction="column" align="center" gap="1" mt="3" pb="2">
            <div className="cz-title big dim">TABLE CLOSED</div>
            <Text size="2" align="center" style={{ color: 'rgba(255,243,209,.85)' }}>
              Spin used for today — your next free spin lands tomorrow morning.
            </Text>
            <button className="cz-btn" style={{ marginTop: 10 }} onClick={() => onOpenChange(false)}>
              KEEP SHOPPING
            </button>
          </Flex>
        ) : (
          <Flex direction="column" align="center" gap="1" mt="3" pb="2">
            <button className="cz-btn gold lg" disabled={state === 'spinning'} onClick={spin}>
              {state === 'spinning' ? 'SPINNING…' : 'SPIN NOW'}
            </button>
            <Text size="1" style={{ color: 'rgba(255,243,209,.7)' }}>1 free spin every day · house always pays</Text>
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  )
}

function Leaderboard() {
  const [animate, setAnimate] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const ob = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) setAnimate(true) },
      { threshold: 0.35 },
    )
    if (ref.current) ob.observe(ref.current)
    return () => ob.disconnect()
  }, [])

  const myVol = TARGETS.monthly.done
  let curIdx = 0
  TIERS.forEach((t, i) => { if (myVol >= t.min) curIdx = i })
  const next = TIERS[curIdx + 1]
  const segProg = next ? (myVol - TIERS[curIdx].min) / (next.min - TIERS[curIdx].min) : 1
  const fillPct = Math.min(100, ((curIdx + segProg) / (TIERS.length - 1)) * 100)
  const pctile = Math.round(((MY_RANK.of - MY_RANK.rank) / MY_RANK.of) * 100)

  return (
    <Box pt="5" id="leaderboard" className="cv">
      <SectionHead
        title="Your dealer journey" extra={<span className="save-pill">THIS MONTH</span>}
        sub="Grow monthly volume to unlock better margins — your progress is yours alone."
      />
      <div className="tj-card" ref={ref}>
        <div className="tj-track">
          <div className="tj-line">
            <div className="tj-fill" style={{ width: animate ? `${fillPct}%` : '0%' }} />
          </div>
          {TIERS.map((t, i) => (
            <div key={t.name} className={`tj-node ${i < curIdx ? 'hit' : ''} ${i === curIdx ? 'cur' : ''}`}>
              <div className="tj-dot" style={{ background: t.c }} />
              <Text size="1" weight={i === curIdx ? 'bold' : 'medium'} style={{ fontSize: 10.5 }}>{t.name}</Text>
              <Text style={{ fontSize: 9.5, color: 'var(--gray-9)' }}>{t.min === 0 ? '—' : fmtL(t.min)}</Text>
            </div>
          ))}
        </div>
        <Flex align="center" justify="between" mt="4">
          <Box>
            <Flex align="center" gap="2">
              <span className="tier-mini" style={{ background: TIERS[curIdx].c }} />
              <Text size="3" weight="bold" as="div">{TIERS[curIdx].name} dealer</Text>
            </Flex>
            <Text size="1" color="gray" as="div" mt="1">Ahead of {pctile}% of dealers in your region</Text>
          </Box>
          {next && (
            <Box style={{ textAlign: 'right' }}>
              <Text size="2" weight="bold" as="div" style={{ color: 'var(--green-11)' }}>
                {fmtL(next.min - myVol)} to {next.name}
              </Text>
              <Text size="1" color="gray" as="div" mt="1">{next.perk}</Text>
            </Box>
          )}
        </Flex>
      </div>
      <div className="lb-tip">
        <RocketIcon width={15} height={15} color="var(--amber-11)" style={{ flex: 'none' }} />
        <Text size="1" weight="bold" style={{ flex: 1, color: 'var(--amber-11)' }}>
          {next ? `${fmtL(next.min - myVol)} more this month unlocks ${next.name} — ${next.perk}` : 'Top tier reached — enjoy Platinum benefits'}
        </Text>
        <Button size="1" radius="full" color="amber" variant="solid" highContrast
          style={{ fontWeight: 800, flex: 'none' }} onClick={() => scrollToId('deals')}>
          Order now
        </Button>
      </div>
    </Box>
  )
}

/* ---------------- Categories / feed / chrome ---------------- */

/* Bestsellers: 2×2 collage cards per category, scroll progress, → PLP */
const BESTS = [
  ['Hinges', 'Hinges & Channels'],
  ['Drawer Slides', 'Slides & Channels'],
  ['Locks', 'Locks & Latches'],
  ['Kitchen', 'Kitchen Systems'],
  ['Lighting', 'Lighting & Smart'],
]

function BestSellers({ onCat }) {
  const ref = useRef(null)
  const [idx, setIdx] = useState(0)
  const onScroll = () => {
    const el = ref.current
    if (el) setIdx(Math.min(BESTS.length - 1, Math.round(el.scrollLeft / 180)))
  }
  return (
    <Box pt="5" className="cv">
      <SectionHead title="Bestsellers" onSeeAll={() => onCat('All')} />
      <div className="hscroll" ref={ref} onScroll={onScroll}>
        {BESTS.map(([cat, label]) => {
          // four DISTINCT photos per collage (several products share context shots)
          const imgs = []
          const seen = new Set()
          for (const p of [...FEED_POOL.filter(CAT_RULES[cat]), ...FEED_POOL]) {
            if (imgs.length >= 4) break
            if (!seen.has(p.ph)) { seen.add(p.ph); imgs.push(p) }
          }
          const count = (CATEGORIES.find(c => c[1] === cat) || [])[2] || 99
          return (
            <button key={cat} className="bs-card" onClick={() => onCat(cat)}>
              <div className="bs-gridwrap">
                <div className="bs-grid">
                  {imgs.map(p => <Img key={p.id} src={img(p.ph, 180)} alt="" loading="lazy" />)}
                </div>
                <span className="bs-more">+{count} more</span>
              </div>
              <Text as="div" weight="bold" style={{ fontSize: 15, letterSpacing: '-0.2px', padding: '14px 4px 2px' }}>
                {label}
              </Text>
            </button>
          )
        })}
      </div>
      <div className="bs-prog">
        {BESTS.map((_, i) => <span key={i} className={i === idx ? 'on' : ''} />)}
      </div>
    </Box>
  )
}

/* Hero v2: client "fest" takeover — promo card + 2x2 category tiles, scalloped edge */
function FestHero({ onCat, palette, layout = 'a' }) {
  return (
    <div className="fest-wrap">
      <div className={`fest-grid f-${layout}`}>
        <button className="fest-promo" onClick={() => onCat(FEST.cat)}>
          <Text as="div" weight="bold" style={{ fontSize: 21, lineHeight: 1.15, color: '#2b2200' }}>{FEST.title}</Text>
          <Text as="div" weight="bold" style={{ fontSize: 19, color: '#2b2200' }}>{FEST.off}</Text>
          <span className="fest-cta">{FEST.cta}</span>
          <Img className="fest-promo-img" src={img(FEST.ph, 300)} alt="" />
        </button>
        <div className="fest-tiles">
          {FEST.tiles.map(t => (
            <button key={t.l} className="fest-tile" onClick={() => onCat(t.cat)}>
              <Img src={img(t.ph, 300)} alt={t.l} loading="lazy" />
              <span className="fest-tl">{t.l}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={`fest-edge ${palette?.edge || 'scallop'}`} />
      <div className={`fest-dots d-${palette?.dot || 'dot'}`}>
        {Array.from({ length: 12 }, (_, i) => <span key={i} />)}
      </div>
    </div>
  )
}

/* Flash Sale — Deal of the day + Clearance merged: timer, discounts, selling-fast bars */
function FlashCard({ p, onChange }) {
  const qty = useContext(CartItemsCtx)[p.id]?.n || 0
  const openQty = useContext(QtyCtx)
  const openPdp = useContext(PdpCtx)
  const add = (e) => {
    e.stopPropagation()
    if (qty === 0 && openQty) { openQty(p); return }
    onChange(1, p); sparkle(e)
  }
  const remove = (e) => { e?.stopPropagation(); onChange(-1, p) }
  const pct = p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0
  const sold = Math.max(15, Math.min(95, 100 - (p.stock ?? 50)))
  return (
    <div className="flash-card" onClick={openPdp ? () => openPdp(p) : undefined}>
      <div className="pimg-wrap" style={{ aspectRatio: 'auto', height: 104 }}>
        <Img className="pimg" src={img(p.ph, 320)} alt={p.name} />
        {pct > 0 && <span className="flash-off">-{pct}%</span>}
        <AddControl qty={qty} onAdd={add} onRemove={remove} onBulk={openQty ? () => openQty(p) : undefined} />
      </div>
      <div className="flash-body">
        <Text as="div" weight="bold" className="clamp1" style={{ fontSize: 12.5 }}>{p.name}</Text>
        <Flex align="center" gap="2" mt="1">
          <Text size="2" weight="bold">₹{p.price.toLocaleString('en-IN')}</Text>
          {p.mrp && <Text size="1" color="gray" style={{ textDecoration: 'line-through' }}>₹{p.mrp.toLocaleString('en-IN')}</Text>}
        </Flex>
        <div className="flash-bar"><div style={{ width: `${sold}%` }} /></div>
        <Text as="div" weight="bold" style={{ fontSize: 10, color: p.stock === 0 ? 'var(--red-10)' : 'var(--amber-11)' }}>
          {p.stock === 0 ? `Out · ships in ${p.lead} days` : p.stock <= 10 ? `Selling fast · only ${p.stock} left` : `${sold}% claimed`}
        </Text>
        {(() => {
          const n = bulkNudge(p, qty)
          return n ? (
            <div key={n.text} className={`qnudge ${n.done ? 'done' : ''}`}>
              {n.done && <CheckIcon width={11} height={11} style={{ flex: 'none' }} />}{n.text}
            </div>
          ) : null
        })()}
      </div>
    </div>
  )
}

function FlashSale({ items, onChange, onSeeAll }) {
  if (items.length === 0) return null
  return (
    <div className="band-flash cv" id="deals">
      <Flex align="center" justify="between" px="4">
        <Flex align="center" gap="3" style={{ minWidth: 0 }}>
          <Heading size="4" style={{ color: '#fff', letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <LightningBoltIcon width={17} height={17} color="#FFD43B" /> Flash sale
        </Heading>
          <DealTimer />
        </Flex>
        <Text size="2" weight="bold" style={{ color: 'rgba(255,255,255,.9)', cursor: 'pointer', flex: 'none' }} onClick={onSeeAll}>
          See all
        </Text>
      </Flex>
      <Box px="4" mt="1" mb="3">
        <Text size="1" style={{ color: 'rgba(255,255,255,.8)' }}>Deals + clearance · up to 60% off · last units</Text>
      </Box>
      <div className="hscroll">
        {items.map(p => <FlashCard key={`fl-${p.id}`} p={p} onChange={onChange} />)}
      </div>
    </div>
  )
}

/* Dealer targets dashboard: monthly / quarterly / yearly purchase progress */
const fmtL = (n) => (n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${n.toLocaleString('en-IN')}`)

function TargetsCard() {
  const [per, setPer] = useState('monthly')
  const t = TARGETS[per]
  const pct = Math.min(100, Math.round((t.done / t.target) * 100))
  return (
    <Box px="4" pt="5">
      <div className="tgt">
        <Flex align="center" justify="between">
          <Heading size="4" style={{ letterSpacing: '-0.2px' }}>Your targets</Heading>
          <span className="save-pill">FY 2026–27</span>
        </Flex>
        <div className="seg">
          {Object.keys(TARGETS).map(k => (
            <button key={k} className={`seg-b ${per === k ? 'on' : ''}`} onClick={() => setPer(k)}>
              {TARGETS[k].label}
            </button>
          ))}
        </div>
        <Flex align="baseline" gap="2" mt="3">
          <Text weight="bold" style={{ fontSize: 28, letterSpacing: '-0.5px' }}>{pct}%</Text>
          <Text size="1" color="gray">achieved</Text>
          <Text size="2" weight="bold" style={{ marginLeft: 'auto' }}>
            {fmtL(t.done)} <Text size="1" color="gray" weight="medium">of {fmtL(t.target)}</Text>
          </Text>
        </Flex>
        <div className="tbar">
          <div className="tbar-fill" style={{ width: `${pct}%` }} />
        </div>
        <Flex align="center" justify="between" mt="2">
          <Text size="1" color="gray">{fmtL(t.target - t.done)} to go · ends {t.ends}</Text>
          <Text size="1" weight="bold" style={{ color: 'var(--amber-11)' }}>{t.note}</Text>
        </Flex>
      </div>
    </Box>
  )
}

/* Maggi-style brand promo card — for launches or stock clearing */
function BrandDay({ onShop }) {
  return (
    <Box px="4" pt="5">
      <div className="bday">
        <div className="bday-top">
          <Img className="bday-img" src={img(BRAND_DAY.ph, 720)} alt={BRAND_DAY.name} loading="lazy" />
          <span className="bday-badge">{BRAND_DAY.badge}</span>
        </div>
        <Flex className="bday-foot" align="center" gap="3">
          <span className="lgchip" style={{ padding: '5px 7px' }}>
            <img src={BRAND_DAY.logo} alt="" style={{ height: 22, maxWidth: 54, objectFit: 'contain' }} />
          </span>
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Text size="2" weight="bold" as="div" truncate>{BRAND_DAY.name}</Text>
            <Text size="1" color="gray" as="div" truncate>{BRAND_DAY.sub}</Text>
          </Box>
          <Button size="2" color="green" radius="full" style={{ fontWeight: 800, flex: 'none' }} onClick={onShop}>
            {BRAND_DAY.cta}
          </Button>
        </Flex>
      </div>
    </Box>
  )
}

function CategoryGrid({ onPick, onSeeAll }) {
  return (
    <Box pt="5">
      <SectionHead title="Shop by category" onSeeAll={onSeeAll} />
      <Grid columns="3" gapX="3" gapY="4" px="4">
        {CATEGORIES.map(([ph, label, count]) => (
          <div className="cat-tile" key={label} onClick={() => onPick(label)}>
            <Img className="cat-img" src={img(ph, 280)} alt={label} loading="lazy" />
            <Text size="1" weight="bold" as="div" align="center" mt="2" truncate>
              {label}
            </Text>
            <Text as="div" align="center" style={{ fontSize: 10.5, color: 'var(--gray-9)', fontWeight: 600 }}>
              {count} items
            </Text>
          </div>
        ))}
      </Grid>
    </Box>
  )
}

function EndlessFeed({ onChange, pool }) {
  // the batch lives in the render key only — the same SKU stays one cart line
  const [items, setItems] = useState(() => pool.slice(0, 6).map(p => ({ p, k: `f0-${p.id}` })))
  const [loading, setLoading] = useState(false)
  const sentinel = useRef(null)
  const batch = useRef(1)

  // brand filter changed → restart the feed from the new pool
  useEffect(() => {
    setItems(pool.slice(0, 6).map(p => ({ p, k: `f0-${p.id}` })))
    batch.current = 1
  }, [pool])

  const loadMore = useCallback(() => {
    if (loading || items.length >= FEED_CAP || pool.length === 0) return
    setLoading(true)
    setTimeout(() => {
      const b = batch.current++
      const start = (b * 6) % pool.length
      const next = [...pool, ...pool].slice(start, start + 6)
        .map(p => ({ p, k: `f${b}-${p.id}` }))
      setItems(cur => [...cur, ...next])
      setLoading(false)
    }, 700)
  }, [loading, items.length, pool])

  useEffect(() => {
    const ob = new IntersectionObserver(
      entries => { if (entries[0].isIntersecting) loadMore() },
      { rootMargin: '600px' },
    )
    if (sentinel.current) ob.observe(sentinel.current)
    return () => ob.disconnect()
  }, [loadMore])

  const done = items.length >= FEED_CAP

  return (
    <Box pt="5">
      <SectionHead title="You might also like" />
      <Grid columns="3" gapX="3" gapY="4" px="4">
        {items.map(it => <ProductCard key={it.k} p={it.p} grid onChange={onChange} />)}
        {loading && [0, 1, 2].map(i => <div className="skel" key={`sk${i}`} />)}
      </Grid>
      <div ref={sentinel} />
      {done && (
        <Flex direction="column" align="center" py="6" gap="1">
          <Text size="2" weight="bold" color="gray">You’re all caught up</Text>
          <Text size="1" color="gray">Fresh picks land every morning</Text>
        </Flex>
      )}
    </Box>
  )
}

function CartBar({ cart }) {
  const openCart = useContext(CartCtx)
  const note = cart.total >= FREE_DELIVERY_AT
    ? 'FREE delivery unlocked'
    : `Add ₹${FREE_DELIVERY_AT - cart.total} more for FREE delivery`
  return (
    <div className={`cartbar ${cart.count > 0 ? 'show' : ''}`} onClick={openCart || undefined}>
      <Flex>
        {cart.photos.slice(-3).map(ph => (
          <Img key={ph} className="thumb" src={img(ph, 120)} alt="" />
        ))}
      </Flex>
      <Box flexGrow="1">
        <Text key={cart.count} className="linepop" size="2" weight="bold" as="div">
          {cart.count} item{cart.count === 1 ? '' : 's'} · ₹{cart.total.toLocaleString('en-IN')}
        </Text>
        <Text size="1" weight="medium" as="div" style={{ color: 'var(--green-4)' }}>{note}</Text>
      </Box>
      <Flex align="center" gap="1">
        <Text size="2" weight="bold">View cart</Text>
        <ChevronRightIcon width={16} height={16} />
      </Flex>
    </div>
  )
}

function NavBar({ onCategories, onUtilities, onReorder, onAccount, active = 'home', mini = false }) {
  const items = [
    { icon: HomeIcon, label: 'Home', key: 'home', go: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { icon: DashboardIcon, label: 'Categories', key: 'categories', go: onCategories },
    { icon: GearIcon, label: 'Utilities', key: 'utilities', go: onUtilities },
    { icon: CounterClockwiseClockIcon, label: 'Reorder', key: 'reorder', go: onReorder },
    { icon: PersonIcon, label: 'Account', key: 'account', go: onAccount },
  ]
  return (
    <div className={`navbar ${mini ? 'mini' : ''}`}>
      {items.map((it) => {
        const Icon = it.icon
        const on = active === it.key
        return (
          <div key={it.label} className={`nav-item ${on ? 'active' : ''}`} onClick={it.go}>
            <span className="nav-icw"><Icon width={20} height={20} /></span>
            <Text size="1" weight={on ? 'bold' : 'medium'} className="nav-lb">{it.label}</Text>
          </div>
        )
      })}
    </div>
  )
}

/* ---------------- App ---------------- */

/* ---------------- Project lists (per-site job baskets) ---------------- */

const LIST_SEED = [
  { id: 'l1', name: 'Sharma kitchen site', items: [{ id: 'ba1', n: 20 }, { id: 'ba2', n: 30 }, { id: 'dl1', n: 12 }] },
]

function loadLists() {
  try {
    const s = JSON.parse(localStorage.getItem('qc-lists') || 'null')
    if (Array.isArray(s)) return s
  } catch { /* seed below */ }
  return LIST_SEED
}
const saveLists = (l) => localStorage.setItem('qc-lists', JSON.stringify(l))

/* Structured Indian address form: line 1/2, landmark, city, pincode */
function AddrFields({ onSave, cta = 'Save address' }) {
  const [label, setLabel] = useState('')
  const [l1, setL1] = useState('')
  const [l2, setL2] = useState('')
  const [lm, setLm] = useState('')
  const [ct, setCt] = useState('')
  const [pin, setPin] = useState('')
  const valid = label.trim() && l1.trim() && ct.trim() && pin.length === 6
  const save = () => {
    const addr = [
      l1.trim(), l2.trim(), lm.trim() && `Near ${lm.trim()}`, `${ct.trim()} ${pin}`,
    ].filter(Boolean).join(', ')
    onSave({ id: `a${Date.now()}`, label: label.trim(), addr })
  }
  return (
    <div className="addr-form">
      <input className="cp-input" placeholder="Label — e.g. Site 2, New godown" value={label} onChange={(e) => setLabel(e.target.value)} />
      <input className="cp-input" placeholder="Line 1 — shop / building no." value={l1} onChange={(e) => setL1(e.target.value)} />
      <input className="cp-input" placeholder="Line 2 — street / area (optional)" value={l2} onChange={(e) => setL2(e.target.value)} />
      <input className="cp-input" placeholder="Landmark (optional)" value={lm} onChange={(e) => setLm(e.target.value)} />
      <Flex gap="2">
        <input className="cp-input" style={{ flex: 1.4 }} placeholder="City" value={ct} onChange={(e) => setCt(e.target.value)} />
        <input
          className="cp-input" style={{ flex: 1 }} placeholder="Pincode" inputMode="numeric" maxLength={6}
          value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        />
      </Flex>
      <Button size="2" color="green" style={{ fontWeight: 800, width: '100%' }} disabled={!valid} onClick={save}>
        {cta}
      </Button>
    </div>
  )
}

/* Save-to-list sheet, opened from the product page bookmark */
function ListSheet({ p, onClose }) {
  const [lists, setLists] = useState(loadLists)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [savedTo, setSavedTo] = useState(null)
  const commit = (next, label) => {
    setLists(next)
    saveLists(next)
    setSavedTo(label)
    setTimeout(onClose, 850)
  }
  const pick = (l) => {
    commit(lists.map(x => x.id !== l.id ? x : {
      ...x,
      items: x.items.some(i => i.id === p.id)
        ? x.items.map(i => (i.id === p.id ? { ...i, n: i.n + 1 } : i))
        : [...x.items, { id: p.id, n: 1 }],
    }), l.name)
  }
  const create = () => {
    commit([...lists, { id: `l${Date.now()}`, name: name.trim(), items: [{ id: p.id, n: 1 }] }], name.trim())
  }
  return (
    <div className="qsheet-overlay" onClick={onClose}>
      <div className="qsheet" onClick={(e) => e.stopPropagation()}>
        <div className="qsheet-grab" />
        <Heading size="4" style={{ letterSpacing: '-0.3px' }}>Save to project list</Heading>
        <Text size="1" color="gray" as="div" mt="1" className="clamp1">{p.name}</Text>
        {savedTo ? (
          <div className="calc-out" style={{ marginTop: 14 }}>
            <Flex align="center" gap="2">
              <CheckIcon width={14} height={14} color="var(--green-11)" />
              <Text size="2" weight="bold" style={{ color: 'var(--green-11)' }}>Saved to {savedTo}</Text>
            </Flex>
          </div>
        ) : (
          <>
            <div className="addr-list">
              {lists.map(l => (
                <button key={l.id} className="addr-row" onClick={() => pick(l)}>
                  <span className="mrow-ic" style={{ background: 'var(--plum-3)', color: 'var(--plum-11)', width: 30, height: 30 }}>
                    <BookmarkIcon width={14} height={14} />
                  </span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <Text size="2" weight="bold" as="div">{l.name}</Text>
                    <Text size="1" color="gray" as="div">{l.items.length} items</Text>
                  </span>
                  <PlusIcon width={14} height={14} color="var(--gray-9)" />
                </button>
              ))}
            </div>
            {adding ? (
              <div className="addr-form">
                <input
                  className="cp-input" placeholder="List name — e.g. Mehta wardrobe job" autoFocus
                  value={name} onChange={(e) => setName(e.target.value)}
                />
                <Button size="2" color="green" style={{ fontWeight: 800, width: '100%' }} disabled={!name.trim()} onClick={create}>
                  Create & save here
                </Button>
              </div>
            ) : (
              <button className="addr-add" onClick={() => setAdding(true)}>
                <PlusIcon width={14} height={14} /> New project list
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function AcctLists({ onChange }) {
  const [lists, setLists] = useState(loadLists)
  const [openId, setOpenId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const save = (next) => { setLists(next); saveLists(next) }
  const resolve = (it) => FEED_POOL.find(p => p.id === it.id)
  const cur = lists.find(l => l.id === openId)
  if (cur) {
    const rows = cur.items.map(it => ({ ...it, p: resolve(it) })).filter(x => x.p)
    const total = rows.reduce((s, r) => s + r.p.price * r.n, 0)
    const step = (id, d) => save(lists.map(l => l.id !== cur.id ? l : {
      ...l,
      items: l.items.map(i => (i.id === id ? { ...i, n: Math.max(0, i.n + d) } : i)).filter(i => i.n > 0),
    }))
    return (
      <>
        <button className="pl-back" onClick={() => setOpenId(null)}>
          <ArrowLeftIcon width={13} height={13} /> All lists
        </button>
        <div className="cp-card">
          <Flex align="center" justify="between">
            <Heading size="4" style={{ letterSpacing: '-0.3px' }}>{cur.name}</Heading>
            <Text size="1" weight="bold" color="gray">{rows.length} items</Text>
          </Flex>
          {rows.map(r => (
            <div className="cs-row" key={r.id}>
              <Img src={img(r.p.ph, 120)} alt="" />
              <Box flexGrow="1" style={{ minWidth: 0 }}>
                <Text size="1" weight="bold" as="div" className="clamp2" style={{ lineHeight: 1.3 }}>{r.p.name}</Text>
                <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>₹{r.p.price.toLocaleString('en-IN')}</Text>
              </Box>
              <div className="cs-step">
                <button onClick={() => step(r.id, -1)} aria-label="Less"><MinusIcon width={12} height={12} /></button>
                <Text key={r.n} className="numpop" size="1" weight="bold" style={{ width: 26, textAlign: 'center', color: '#fff' }}>{r.n}</Text>
                <button onClick={() => step(r.id, 1)} aria-label="More"><PlusIcon width={12} height={12} /></button>
              </div>
              <Text size="1" weight="bold" style={{ minWidth: 56, textAlign: 'right', flex: 'none', whiteSpace: 'nowrap' }}>
                ₹{(r.n * r.p.price).toLocaleString('en-IN')}
              </Text>
            </div>
          ))}
          {rows.length === 0 && (
            <Text size="1" color="gray" as="div" mt="2">
              Empty list — save products here from any product page (bookmark icon, top right).
            </Text>
          )}
        </div>
        {rows.length > 0 && (
          <button className="qs-cta" onClick={(e) => { rows.forEach(r => onChange(r.n, r.p, { noReco: true })); sparkle(e) }}>
            <span>Add all to cart</span>
            <span>₹{total.toLocaleString('en-IN')}</span>
          </button>
        )}
        <button className="pl-del" onClick={() => { save(lists.filter(l => l.id !== cur.id)); setOpenId(null) }}>
          Delete list
        </button>
      </>
    )
  }
  return (
    <>
      <div className="cp-card">
        {lists.map(l => {
          const rows = l.items.map(resolve).filter(Boolean)
          const total = l.items.reduce((s, it) => s + (resolve(it)?.price || 0) * it.n, 0)
          return (
            <div className="ro-past" key={l.id} onClick={() => setOpenId(l.id)}>
              <Flex>
                {rows.slice(0, 3).map(p => <Img key={`pl-${l.id}-${p.id}`} className="thumb" src={img(p.ph, 80)} alt="" />)}
              </Flex>
              <Box flexGrow="1" style={{ minWidth: 0 }}>
                <Text size="2" weight="bold" as="div">{l.name}</Text>
                <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>
                  {l.items.length} items · ₹{total.toLocaleString('en-IN')}
                </Text>
              </Box>
              <ChevronRightIcon width={14} height={14} color="var(--gray-8)" style={{ flex: 'none' }} />
            </div>
          )
        })}
        {lists.length === 0 && (
          <Text size="1" color="gray" as="div">No lists yet — create one per site or job.</Text>
        )}
      </div>
      {adding ? (
        <div className="cp-card">
          <input
            className="cp-input" placeholder="List name — e.g. Sharma kitchen site" autoFocus
            value={name} onChange={(e) => setName(e.target.value)}
          />
          <Button
            size="2" color="green" style={{ fontWeight: 800, width: '100%' }} disabled={!name.trim()}
            onClick={() => { save([...lists, { id: `l${Date.now()}`, name: name.trim(), items: [] }]); setName(''); setAdding(false) }}
          >
            Create list
          </Button>
        </div>
      ) : (
        <button className="addr-add" onClick={() => setAdding(true)}>
          <PlusIcon width={14} height={14} /> New project list
        </button>
      )}
    </>
  )
}

/* ---------------- Credit ledger (30-day dealer credit) ---------------- */

/* GST invoice generated on-device (restored; Sprint-1 reworks to bill snapshot) */
function downloadInvoice(o) {
  let gst = { gstin: '29ABCDE1234F1Z5', name: 'Bora Hardware & Plywood' }
  try { gst = { ...gst, ...(JSON.parse(localStorage.getItem('qc-gst') || 'null') || {}) } } catch { /* defaults */ }
  const bill = o.bill || null
  const total = bill ? bill.toPay
    : o.items.reduce((s, it) => s + (it.unit ?? unitPriceFor(it.p, it.n)) * it.n, 0)
  const taxable = Math.round(total / 1.18)
  const tax = total - taxable
  const rows = o.items.map((it) => {
    const u = it.unit ?? unitPriceFor(it.p, it.n)
    return `
    <tr><td>${it.p.name}</td><td class="r">${it.n}</td><td class="r">₹${u.toLocaleString('en-IN')}</td><td class="r">₹${(u * it.n).toLocaleString('en-IN')}</td></tr>`
  }).join('')
    + (bill && bill.schemeOff > 0 ? `
    <tr><td colspan="3" class="r mut">Volume scheme discount</td><td class="r">−₹${bill.schemeOff.toLocaleString('en-IN')}</td></tr>` : '')
    + (bill && bill.coupon ? `
    <tr><td colspan="3" class="r mut">Coupon · ${bill.coupon.label}</td><td class="r">−₹${bill.coupon.off.toLocaleString('en-IN')}</td></tr>` : '')
    + (bill && (bill.deliveryFee > 0 || bill.expressFee > 0) ? `
    <tr><td colspan="3" class="r mut">Delivery${bill.expressFee ? ' + express' : ''}</td><td class="r">₹${(bill.deliveryFee + bill.expressFee).toLocaleString('en-IN')}</td></tr>` : '')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${o.id}</title><style>
    body{font-family:-apple-system,Segoe UI,sans-serif;margin:32px;color:#1a1a1a}
    h1{font-size:20px;margin:0;color:#0E4A2F} .mut{color:#777;font-size:12px}
    table{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px}
    th,td{padding:8px 10px;border-bottom:1px solid #e5e5e5;text-align:left} .r{text-align:right}
    th{background:#F1F8F4;font-size:11px;letter-spacing:.4px;text-transform:uppercase}
    .tot td{font-weight:700;border-top:2px solid #0E4A2F;border-bottom:none}
    .top{display:flex;justify-content:space-between;align-items:flex-start}
  </style></head><body>
    <div class="top"><div><h1>QuickCart</h1><div class="mut">Furniture hardware for dealers<br/>GSTIN 29QCKRT5678K1Z9 · Bengaluru</div></div>
    <div class="mut" style="text-align:right">TAX INVOICE<br/><b style="color:#1a1a1a">PO ${o.id}</b><br/>${o.date}</div></div>
    <p class="mut" style="margin-top:16px">Billed to<br/><b style="color:#1a1a1a">${gst.name}</b><br/>GSTIN ${gst.gstin.toUpperCase()}</p>
    <table><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr>${rows}
    <tr><td colspan="3" class="r mut">Taxable value</td><td class="r">₹${taxable.toLocaleString('en-IN')}</td></tr>
    <tr><td colspan="3" class="r mut">CGST 9% + SGST 9%</td><td class="r">₹${tax.toLocaleString('en-IN')}</td></tr>
    <tr class="tot"><td colspan="3" class="r">Grand total</td><td class="r">₹${total.toLocaleString('en-IN')}</td></tr></table>
    <p class="mut">${o.payMode ? `Settled to ${o.payMode}${o.dueTs ? ` · due ${new Date(o.dueTs).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}. ` : ''}Input credit available on this invoice. Computer-generated — no signature required.</p>
  </body></html>`
  const blob = new Blob([html], { type: 'text/html' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `Invoice-${o.id}.html`
  a.click()
  URL.revokeObjectURL(a.href)
}

function downloadLedger() {
  let paid = []
  try { paid = JSON.parse(localStorage.getItem('qc-paid') || '[]') } catch { /* none */ }
  let bal = 0
  const rows = CREDIT.bills.map(b => {
    const isPaid = paid.includes(b.id)
    if (!isPaid) bal += b.amt
    return `<tr><td>PO ${b.id}</td><td>Credit invoice</td><td class="r">₹${b.amt.toLocaleString('en-IN')}</td><td class="r">${isPaid ? 'Paid' : b.days < 0 ? `Overdue ${-b.days}d` : `Due in ${b.days}d`}</td><td class="r">₹${bal.toLocaleString('en-IN')}</td></tr>`
  }).join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Ledger FY 2026-27</title><style>
    body{font-family:-apple-system,Segoe UI,sans-serif;margin:32px;color:#1a1a1a}
    h1{font-size:20px;margin:0;color:#0E4A2F} .mut{color:#777;font-size:12px}
    table{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px}
    th,td{padding:8px 10px;border-bottom:1px solid #e5e5e5;text-align:left} .r{text-align:right}
    th{background:#F1F8F4;font-size:11px;letter-spacing:.4px;text-transform:uppercase}
  </style></head><body>
    <h1>QuickCart — Dealer Ledger</h1>
    <div class="mut">Bora Hardware &amp; Plywood · FY 2026–27 · credit limit ₹5,00,000</div>
    <table><tr><th>Ref</th><th>Type</th><th class="r">Amount</th><th class="r">Status</th><th class="r">Balance</th></tr>${rows}</table>
    <p class="mut">Computer-generated statement — share with your CA directly.</p>
  </body></html>`
  const blob = new Blob([html], { type: 'text/html' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'Ledger-FY-2026-27.html'
  a.click()
  URL.revokeObjectURL(a.href)
}

function AcctCredit() {
  const [paid, setPaid] = usePersisted('qc-paid', [])
  const [pay, setPay] = useState(null)
  const [method, setMethod] = useState('UPI')
  const [done, setDone] = useState(null)
  const [ledgerMsg, setLedgerMsg] = useState(false)
  const cs = creditState()
  const bills = cs.open
  const settled = cs.all.filter(b => paid.includes(b.id))
  const outstanding = bills.reduce((s, b) => s + b.amt, 0)
  const avail = CREDIT.limit - outstanding
  const overdue = bills.filter(b => b.days < 0)
  // bar reflects status: overdue -> red, running low -> amber, healthy -> green
  const barColor = overdue.length > 0 ? 'var(--red-9)' : avail / CREDIT.limit < .35 ? 'var(--amber-9)' : 'var(--green-9)'
  const payAmt = pay ? pay.reduce((s, b) => s + b.amt, 0) : 0
  const confirm = (e) => {
    sparkle(e)
    setPaid([...paid, ...pay.map(b => b.id)])
    setDone(payAmt)
    setPay(null)
  }
  return (
    <>
      <div className="cr-hero">
        <Text size="1" weight="bold" as="div" style={{ color: 'rgba(255,255,255,.6)', fontSize: 10, letterSpacing: '.6px' }}>
          CREDIT AVAILABLE
        </Text>
        <Flex align="baseline" gap="2" mt="1">
          <Text weight="bold" style={{ fontSize: 30, color: '#fff', letterSpacing: '-0.8px' }}>{fmtL(avail)}</Text>
          <Text size="1" style={{ color: 'rgba(255,255,255,.6)' }}>of {fmtL(CREDIT.limit)} limit</Text>
        </Flex>
        <div className="cr-bar"><div style={{ width: `${Math.round((avail / CREDIT.limit) * 100)}%`, background: barColor }} /></div>
        <Flex gap="2" mt="3" wrap="wrap">
          <span className="cr-chip">Outstanding {fmtL(outstanding)}</span>
          {overdue.length > 0 && <span className="cr-chip bad">{overdue.length} overdue</span>}
          <span className="cr-chip">30-day · interest-free</span>
        </Flex>
      </div>

      {bills.length > 0 ? (
        <div className="cp-card">
          <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
            OPEN BILLS
          </Text>
          {bills.map(b => (
            <div className="bill-row" key={b.id}>
              <Box flexGrow="1" style={{ minWidth: 0 }}>
                <Text size="2" weight="bold" as="div">₹{b.amt.toLocaleString('en-IN')}</Text>
                <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>PO {b.id}</Text>
              </Box>
              <span className={`st-chip ${b.days < 0 ? 'bad' : b.days <= 7 ? '' : 'ok'}`}>
                {b.days < 0 ? `Overdue ${-b.days}d` : `Due in ${b.days}d`}
              </span>
              <Button size="1" variant="soft" color="green" radius="full" style={{ fontWeight: 800, flex: 'none' }} onClick={() => setPay([b])}>
                Pay
              </Button>
            </div>
          ))}
          <button className="qs-cta" onClick={() => setPay(bills)}>
            <span>Pay all bills</span>
            <span>₹{outstanding.toLocaleString('en-IN')}</span>
          </button>
        </div>
      ) : (
        <div className="cp-card">
          <Flex align="center" gap="2">
            <CheckIcon width={15} height={15} color="var(--green-11)" />
            <Text size="2" weight="bold" style={{ color: 'var(--green-11)' }}>All clear — nothing due</Text>
          </Flex>
          <Text size="1" color="gray" as="div" mt="1">Your full {fmtL(CREDIT.limit)} credit line is available.</Text>
        </div>
      )}

      {settled.length > 0 && (
        <div className="cp-card">
          <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
            SETTLED
          </Text>
          {settled.map(b => (
            <div className="bill-row" key={`s-${b.id}`}>
              <Box flexGrow="1">
                <Text size="2" weight="bold" as="div" style={{ color: 'var(--gray-9)' }}>₹{b.amt.toLocaleString('en-IN')}</Text>
                <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-9)' }}>PO {b.id}</Text>
              </Box>
              <span className="st-chip ok"><CheckIcon width={10} height={10} /> Paid</span>
            </div>
          ))}
        </div>
      )}

      <div className="cp-card">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
          LEDGER STATEMENT · FY 2026–27
        </Text>
        <Text size="1" color="gray" as="div" mt="1">Every bill, payment and running balance — CA-ready.</Text>
        <Flex gap="2" mt="3">
          <Button size="2" variant="soft" color="green" radius="full" style={{ fontWeight: 800, flex: 1 }} onClick={downloadLedger}>
            Download
          </Button>
          <Button size="2" variant="soft" color="gray" radius="full" style={{ fontWeight: 800, flex: 1 }} onClick={() => setLedgerMsg(true)}>
            Email me
          </Button>
        </Flex>
        {ledgerMsg && (
          <Flex align="center" gap="2" mt="2">
            <CheckIcon width={13} height={13} color="var(--green-11)" />
            <Text size="1" weight="bold" style={{ color: 'var(--green-11)' }}>Ledger on its way to virag@borahardware.in</Text>
          </Flex>
        )}
      </div>

      {pay && (
        <div className="qsheet-overlay" onClick={() => setPay(null)}>
          <div className="qsheet" onClick={(e) => e.stopPropagation()}>
            <div className="qsheet-grab" />
            <Heading size="4" style={{ letterSpacing: '-0.3px' }}>Pay ₹{payAmt.toLocaleString('en-IN')}</Heading>
            <Text size="1" color="gray" as="div" mt="1">
              {pay.length} bill{pay.length === 1 ? '' : 's'} · settles to QuickCart Trading Pvt Ltd
            </Text>
            <Text size="1" weight="bold" as="div" mt="4" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
              PAY VIA
            </Text>
            <Flex gap="2" mt="1">
              {['UPI', 'Netbanking', 'Cheque on pickup'].map(m => (
                <button key={m} className={`seg-b ${method === m ? 'on' : ''}`} style={{ flex: 1 }} onClick={() => setMethod(m)}>{m}</button>
              ))}
            </Flex>
            <button className="qs-cta" onClick={confirm}>
              <span>Pay via {method}</span>
              <span>₹{payAmt.toLocaleString('en-IN')}</span>
            </button>
          </div>
        </div>
      )}
      {done && (
        <div className="order-done" onClick={() => setDone(null)}>
          <div className="od-card" onClick={(e) => e.stopPropagation()}>
            <div className="od-tick">✓</div>
            <Heading size="5" mt="3" style={{ letterSpacing: '-0.3px' }}>Payment received</Heading>
            <Text size="2" color="gray" as="div" mt="1">₹{done.toLocaleString('en-IN')} · credit limit freed up instantly</Text>
            <Button mt="4" size="3" color="green" radius="full" style={{ fontWeight: 800, width: '100%' }} onClick={() => setDone(null)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

/* ---------------- Dealer login (demo gate, Instacart-style) ---------------- */

const WaMark = () => (
  <svg width="19" height="19" viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="16" r="16" fill="#25D366"/>
    <path fill="#fff" d="M16 6.5c-5.2 0-9.4 4.2-9.4 9.4 0 1.8.5 3.5 1.4 5L6.5 25.5l4.7-1.5c1.4.8 3.1 1.3 4.8 1.3 5.2 0 9.4-4.2 9.4-9.4S21.2 6.5 16 6.5zm5.5 13.3c-.2.7-1.4 1.3-1.9 1.4-.5.1-1.1.1-1.8-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 .9-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4.2.5.7 1.9.8 2 .1.1.1.3 0 .5-.1.2-.1.3-.3.5l-.4.5c-.1.1-.3.3-.1.6.2.3.7 1.2 1.6 1.9 1.1.9 2 1.2 2.3 1.4.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.3.1 1.7.8 2 1 .3.1.5.2.5.3.1.2.1.7-.1 1.2z"/>
  </svg>
)



function LoginGate({ onDone }) {
  const [tab, setTab] = useState('phone')
  const [stage, setStage] = useState('cred')
  const [ph, setPh] = useState('')
  const [em, setEm] = useState('')
  const [otp, setOtp] = useState('')
  const [reqSent, setReqSent] = useState(false)
  const h = new Date().getHours()
  const greet = h < 12 ? 'GOOD MORNING' : h < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING'
  const ready = tab === 'phone' ? ph.length === 10 : /\S+@\S+\.\S+/.test(em)
  return (
    <div className="login2">
      <Text size="1" weight="bold" as="div" style={{ color: 'var(--green-10)', letterSpacing: '.9px', fontSize: 11, marginTop: 36 }}>
        {stage === 'otp' ? 'ALMOST THERE' : greet}
      </Text>
      <Heading style={{ fontSize: 31, letterSpacing: '-1px', marginTop: 4 }}>
        {stage === 'otp' ? 'One last step' : 'Welcome back, partner'}
      </Heading>
      {stage === 'cred' && (
        <Text size="2" color="gray" as="div" mt="2" style={{ lineHeight: 1.5 }}>
          Your counter's command centre — orders, credit and margins in one place.
        </Text>
      )}
      {stage === 'cred' ? (
        <>
          <div className="lg-tabs">
            <button className={tab === 'phone' ? 'on' : ''} onClick={() => setTab('phone')}>Phone number</button>
            <button className={tab === 'email' ? 'on' : ''} onClick={() => setTab('email')}>Email</button>
          </div>
          {tab === 'phone' ? (
            <div className="lg-group">
              <span>+91</span>
              <input
                inputMode="numeric" maxLength={10} placeholder="Phone number"
                value={ph} onChange={(e) => setPh(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          ) : (
            <div className="lg-group">
              <input type="email" placeholder="Work email" value={em} onChange={(e) => setEm(e.target.value)} />
            </div>
          )}
          <Text size="1" color="gray" as="div" mt="3" style={{ lineHeight: 1.55 }}>
            We'll send a verification code. By continuing you agree to our{' '}
            <span className="lg-link">Dealer Terms</span> & <span className="lg-link">Privacy Policy</span>.
          </Text>
          <button className="lg-cta" disabled={!ready} onClick={() => setStage('otp')}>Continue</button>
          <div className="lg-or"><span>or</span></div>
          <button className="lg-soc wa" onClick={onDone}><WaMark /> Continue with WhatsApp</button>
          <Text size="2" as="div" mt="4" style={{ textAlign: 'center' }}>
            or <span className="lg-link" onClick={onDone}>continue as guest</span>
          </Text>
          <div className="lg-new">
            <Text size="2" weight="bold" as="div">New to QuickCart?</Text>
            <Text size="1" color="gray" as="div" mt="1" style={{ lineHeight: 1.55 }}>
              Extra margins, 30-day credit and 1-hour delivery for registered dealers.
            </Text>
            {reqSent ? (
              <Flex align="center" gap="2" mt="2">
                <CheckIcon width={13} height={13} color="var(--green-11)" />
                <Text size="1" weight="bold" style={{ color: 'var(--green-11)' }}>
                  Request received — we'll call within 4 working hours
                </Text>
              </Flex>
            ) : (
              <Button mt="2" size="2" variant="soft" color="green" radius="full" style={{ fontWeight: 800 }} onClick={() => setReqSent(true)}>
                Request a dealer account
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <Text size="2" color="gray" as="div" mt="2">
            Sent to {tab === 'phone' ? `+91 ${ph}` : em} · any 4 digits work in this demo
          </Text>
          <input
            className="lg-otp" inputMode="numeric" maxLength={4} placeholder="••••"
            value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          />
          <button className="lg-cta" disabled={otp.length !== 4} onClick={onDone}>Verify & continue</button>
          <Text size="2" as="div" mt="4" style={{ textAlign: 'center' }}>
            <span className="lg-link" onClick={() => setStage('cred')}>Change number</span>
          </Text>
        </>
      )}
      <div className="lg-brands">
        {Object.values(BRAND_LOGOS).map((src, i) => <img key={i} src={src} alt="" />)}
      </div>
    </div>
  )
}

/* ---------------- Account page ---------------- */

function Toggle({ on, onToggle }) {
  return (
    <button className={`tgl ${on ? 'on' : ''}`} onClick={onToggle} role="switch" aria-checked={on}>
      <span />
    </button>
  )
}

function usePersisted(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = JSON.parse(localStorage.getItem(key) || 'null'); return s ?? initial } catch { return initial }
  })
  const set = (next) => {
    setV(next)
    localStorage.setItem(key, JSON.stringify(next))
  }
  return [v, set]
}

/* interactive monthly bar chart: tap a bar to inspect it */
function Bars({ data }) {
  const [sel, setSel] = useState(data.length - 1)
  const ready = useNextFrame()
  const max = Math.max(...data.map(d => d[1]))
  const si = Math.min(sel, data.length - 1)
  return (
    <>
      <Flex align="baseline" gap="3" mt="2">
        <Text size="5" weight="bold" style={{ letterSpacing: '-0.4px', whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtL(data[si][1] * 1000)}</Text>
        <Text size="1" style={{ color: '#98A0AB', whiteSpace: 'nowrap' }}>{data[si][0]} purchases</Text>
      </Flex>
      <div className="bars">
        {data.map(([m, v], i) => (
          <button key={m} className={`bar ${i === si ? 'on' : ''}`} onClick={() => setSel(i)}>
            <span style={{ height: ready ? `${(v / max) * 100}%` : '0%' }} />
            <em>{m}</em>
          </button>
        ))}
      </div>
    </>
  )
}

/* category donut: tap the legend to read the center */
function Donut({ cats }) {
  const [sel, setSel] = useState(0)
  let acc = 0
  const stops = cats.map(([, pct, c]) => {
    const s = `${c} ${acc}% ${acc + pct}%`
    acc += pct
    return s
  }).join(', ')
  return (
    <Flex gap="4" align="center" mt="3">
      <div className="donut" style={{ background: `conic-gradient(${stops})` }}>
        <div className="donut-hole">
          <Text size="4" weight="bold" as="div">{cats[sel][1]}%</Text>
          <Text as="div" style={{ fontSize: 9, color: 'var(--gray-10)' }}>{cats[sel][0]}</Text>
        </div>
      </div>
      <Box flexGrow="1" style={{ minWidth: 0 }}>
        {cats.map(([l, pct, c], i) => (
          <button key={l} className={`leg ${i === sel ? 'on' : ''}`} onClick={() => setSel(i)}>
            <span className="leg-dot" style={{ background: c }} />
            <Text size="1" weight={i === sel ? 'bold' : 'medium'}>{l}</Text>
            <Text size="1" color="gray" style={{ marginLeft: 'auto' }}>{pct}%</Text>
          </button>
        ))}
      </Box>
    </Flex>
  )
}

/* tiny dark-mode charts for stat cards */
function MiniBars({ data, color = '#2E6E4E', hi = -1 }) {
  const mx = Math.max(...data)
  return (
    <div className="mini-bars">
      {data.map((v, i) => (
        <span key={i} style={{ height: `${22 + 78 * (v / mx)}%`, background: i === hi ? '#F5C242' : color }} />
      ))}
    </div>
  )
}

function MiniLine({ data, color = '#3E63DD', fill }) {
  const mx = Math.max(...data)
  const mn = Math.min(...data)
  const pt = (v, i) => `${(i / (data.length - 1)) * 100},${28 - 24 * ((v - mn) / (mx - mn || 1))}`
  const pts = data.map(pt).join(' ')
  return (
    <svg className="mini-line" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      {fill && <polygon points={`0,32 ${pts} 100,32`} fill={color} opacity=".18" />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function AcctDash({ onReorder }) {
  const [per, setPer] = useState(12)
  const [tab, setTab] = useState('trend')
  const [tper, setTper] = useState('monthly')
  const ready = useNextFrame()
  const k = DASH.kpis
  const tt = TARGETS[tper]
  const tpct = Math.min(100, Math.round((tt.done / tt.target) * 100))
  const big = useCountUp(k.month, true, 1100)
  const best = DASH.months.reduce((a, b) => (b[1] > a[1] ? b : a))
  const bestIdx = DASH.months.findIndex(d => d[1] === best[1])
  const pctile = Math.round(((MY_RANK.of - MY_RANK.rank) / MY_RANK.of) * 100)
  const mser = DASH.months.slice(-8).map(d => d[1])
  const ordSer = mser.map(v => Math.round(v / 8.3))
  const aovSer = mser.map((v, i) => v / ordSer[i])
  const savSer = mser.map(v => v * 0.115)
  const tgtPct = Math.min(100, Math.round((k.month / TARGETS.monthly.target) * 100))
  return (
    <>
      <div className="dash-hero d3h">
        <Flex align="center" gap="4">
          <svg width="74" height="74" viewBox="0 0 74 74" style={{ flex: 'none' }}>
            <circle cx="37" cy="37" r="30" stroke="rgba(255,255,255,.2)" strokeWidth="7" fill="none" />
            <circle
              cx="37" cy="37" r="30" stroke="#FFD43B" strokeWidth="7" fill="none" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 30}
              strokeDashoffset={(2 * Math.PI * 30) * (1 - (ready ? Math.min(1, k.month / TARGETS.monthly.target) : 0))}
              transform="rotate(-90 37 37)"
              style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.22, 1, .36, 1)' }}
            />
            <text x="37" y="42" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="800">{tgtPct}%</text>
          </svg>
          <Box style={{ minWidth: 0 }}>
            <Text size="1" weight="bold" as="div" style={{ color: 'rgba(255,255,255,.65)', letterSpacing: '.6px', fontSize: 10 }}>
              PURCHASES THIS MONTH
            </Text>
            <Text weight="bold" as="div" mt="1" style={{ fontSize: 32, color: '#fff', letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>
              {fmtL(big)}
            </Text>
            <span className="up-chip" style={{ marginTop: 6, display: 'inline-flex' }}>
              <ChevronUpIcon width={12} height={12} /> {k.growth}% vs last year
            </span>
          </Box>
        </Flex>
      </div>

      <div className="cp-card dk">
        <Flex align="center" justify="between">
          <Text size="1" weight="bold" style={{ color: '#98A0AB', letterSpacing: '.5px', fontSize: 10.5 }}>
            TARGETS
          </Text>
          <div className="seg" style={{ margin: 0 }}>
            {Object.keys(TARGETS).map(kk => (
              <button key={kk} className={`seg-b ${tper === kk ? 'on' : ''}`} onClick={() => setTper(kk)}>
                {TARGETS[kk].label}
              </button>
            ))}
          </div>
        </Flex>
        <Flex align="baseline" gap="2" mt="2">
          <Text weight="bold" style={{ fontSize: 27, color: '#F2F4F7', letterSpacing: '-0.6px' }}>{tpct}%</Text>
          <Text style={{ fontSize: 10.5, color: '#98A0AB' }}>achieved</Text>
          <Text size="1" weight="bold" style={{ marginLeft: 'auto', color: '#F2F4F7' }}>
            {fmtL(tt.done)} <span style={{ color: '#98A0AB', fontWeight: 600 }}>of {fmtL(tt.target)}</span>
          </Text>
        </Flex>
        <div className="dk-bar">
          <div style={{ width: ready ? `${tpct}%` : '0%' }} />
        </div>
        <Flex align="center" justify="between" mt="2">
          <Text style={{ fontSize: 10.5, color: '#98A0AB' }}>{fmtL(tt.target - tt.done)} to go · ends {tt.ends}</Text>
          <Text style={{ fontSize: 10.5, color: '#F5C242', fontWeight: 800 }}>{tt.note}</Text>
        </Flex>
      </div>

      <div className="kpi-grid">
        <div className="kpi dk">
          <Text size="1" style={{ color: 'var(--blue-9)', fontWeight: 700 }}>Orders</Text>
          <Flex align="baseline" gap="2">
            <Text size="4" weight="bold" as="div" style={{ color: '#F2F4F7' }}>{k.orders}</Text>
            <Text style={{ fontSize: 10, color: '#56C271', fontWeight: 800 }}>▲ 3</Text>
          </Flex>
          <MiniBars data={ordSer} color="#2A4364" />
        </div>
        <div className="kpi dk">
          <Text size="1" style={{ color: 'var(--violet-9)', fontWeight: 700 }}>Avg order</Text>
          <Flex align="baseline" gap="2">
            <Text size="4" weight="bold" as="div" style={{ color: '#F2F4F7' }}>₹{(k.aov / 1000).toFixed(1)}k</Text>
            <Text style={{ fontSize: 10, color: '#56C271', fontWeight: 800 }}>▲ 6%</Text>
          </Flex>
          <MiniLine data={aovSer} color="#8E7AF0" />
        </div>
        <div className="kpi dk">
          <Text size="1" style={{ color: 'var(--green-9)', fontWeight: 700 }}>Saved</Text>
          <Flex align="baseline" gap="2">
            <Text size="4" weight="bold" as="div" style={{ color: '#F2F4F7' }}>₹{(k.saved / 1000).toFixed(1)}k</Text>
            <Text style={{ fontSize: 10, color: '#56C271', fontWeight: 800 }}>▲ ₹2.1k</Text>
          </Flex>
          <MiniLine data={savSer} color="#46B576" fill />
        </div>
        <div className="kpi dk">
          <Text size="1" style={{ color: '#F5C242', fontWeight: 700 }}>Best month</Text>
          <Flex align="baseline" gap="2">
            <Text size="4" weight="bold" as="div" style={{ color: '#F2F4F7' }}>{fmtL(best[1] * 1000)}</Text>
            <Text style={{ fontSize: 10, color: '#98A0AB', fontWeight: 700 }}>{best[0]}</Text>
          </Flex>
          <MiniBars data={DASH.months.map(d => d[1])} hi={bestIdx} />
        </div>
      </div>

      <div className="cp-card dk">
        <Text size="1" weight="bold" as="div" style={{ color: '#98A0AB', letterSpacing: '.5px', fontSize: 10.5 }}>
          HIGHLIGHTS
        </Text>
        <div className="dkrow">
          <span className="bdg-ic" style={{ background: 'rgba(245,194,66,.14)', color: '#F5C242' }}>
            <StarFilledIcon width={14} height={14} />
          </span>
          <Text size="2" weight="bold" style={{ flex: 1, color: '#F2F4F7' }}>Top 25% dealer in HSR Layout</Text>
        </div>
        <div className="dkrow">
          <span className="bdg-ic" style={{ background: 'rgba(62,99,221,.16)', color: '#7E9BF2' }}>
            <BarChartIcon width={14} height={14} />
          </span>
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Text size="2" weight="bold" style={{ color: '#F2F4F7' }}>Ahead of {pctile}% of dealers</Text>
            <div className="dk-bar slim"><div style={{ width: ready ? `${pctile}%` : '0%' }} /></div>
          </Box>
        </div>
        <button className="dkrow act" onClick={onReorder}>
          <span className="bdg-ic" style={{ background: 'rgba(70,181,118,.16)', color: '#56C271' }}>
            <CounterClockwiseClockIcon width={14} height={14} />
          </span>
          <Text size="2" weight="bold" style={{ flex: 1, textAlign: 'left', color: '#F2F4F7' }}>
            4 regulars due — restock in one tap
          </Text>
          <ChevronRightIcon width={15} height={15} color="#5A6270" />
        </button>
        <div className="dkrow">
          <span className="bdg-ic" style={{ background: 'rgba(245,194,66,.14)', color: '#F5C242' }}>
            <RocketIcon width={14} height={14} />
          </span>
          <Text size="2" weight="bold" style={{ flex: 1, color: '#F2F4F7' }}>
            {fmtL(best[1] * 1000 - k.month)} from beating your {best[0]} record
          </Text>
        </div>
      </div>

      <div className="cp-card dk d3-card">
        <div className="seg" style={{ marginTop: 0, marginBottom: 14 }}>
          {[['trend', 'Trend'], ['mix', 'Category mix'], ['brands', 'Brands']].map(([kk, l]) => (
            <button key={kk} className={`seg-b ${tab === kk ? 'on' : ''}`} onClick={() => setTab(kk)}>{l}</button>
          ))}
        </div>
        {tab === 'trend' && (
          <>
            <Flex align="center" justify="between">
              <Text size="2" weight="bold" style={{ color: '#F2F4F7' }}>Purchases</Text>
              <div className="seg" style={{ margin: 0 }}>
                {[[6, '6M'], [12, '1Y']].map(([n, l]) => (
                  <button key={l} className={`seg-b ${per === n ? 'on' : ''}`} onClick={() => setPer(n)}>{l}</button>
                ))}
              </div>
            </Flex>
            <Bars key={per} data={DASH.months.slice(-per)} />
          </>
        )}
        {tab === 'mix' && <Donut cats={DASH.cats} />}
        {tab === 'brands' && (
          <Box pt="1">
            {DASH.brands.map(([b, pct], i) => (
              <Flex key={b} align="center" gap="3" mt={i === 0 ? '1' : '2'}>
                <Text size="1" weight="bold" style={{ width: 76, flex: 'none', color: '#F2F4F7' }}>{b}</Text>
                <div className="hbar"><div style={{ width: ready ? `${pct}%` : '0%' }} /></div>
                <Text size="1" style={{ width: 34, textAlign: 'right', flex: 'none', color: '#98A0AB' }}>{pct}%</Text>
              </Flex>
            ))}
          </Box>
        )}
      </div>
      <Box pb="4" />
    </>
  )
}

const ordPgRef = { current: false }

const POD_SHOTS = ['1586528116311-ad8dd3c8310d', '1566576721346-d4a3b4eaeb55']

function OrderDetailPage({ order, onClose, onChange }) {
  const pieces = order.items.reduce((s, { n }) => s + n, 0)
  const bill = order.bill || null
  // snapshotted bill wins; legacy seeds fall back to effective pricing
  const total = bill ? bill.toPay
    : order.items.reduce((s, it) => s + (it.unit ?? unitPriceFor(it.p, it.n)) * it.n, 0)
  const saved = bill
    ? bill.bulkSave + bill.schemeOff + (bill.coupon?.off || 0)
    : order.items.reduce((s, { p, n }) => {
      const t = bulkTier(p)
      return t && n >= t.thr ? s + (p.price - t.bp) * n : s
    }, 0)
  const live = order.status !== 'Delivered'
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!live) return undefined
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [live])
  const elapsed = live && order.ts ? (now - order.ts) / 1000 : Infinity
  let si = 0
  ORDER_STAGES.forEach(([, t], i) => { if (elapsed >= t) si = i })
  if (!live) si = ORDER_STAGES.length - 1
  const fill = (si / (ORDER_STAGES.length - 1)) * 100
  const TL = [
    ['Order placed', 'Confirmed at HSR depot'],
    ['Packed', 'Quality-checked and invoiced'],
    ['On the way', order.promise ? `Out for delivery · ${order.promise}` : 'Out for delivery'],
    ['Delivered', `Received at ${order.addrLabel || 'Shop'}`],
  ]
  const timeFor = (i) => {
    if (!live) return order.date
    if (i > si) return '—'
    return new Date(order.ts + ORDER_STAGES[i][1] * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }
  const repeat = (e) => {
    order.items.forEach(({ p, n }) => onChange(n, p, { noReco: true }))
    sparkle(e)
  }
  return (
    <div className="ordpage">
      <div className="pdp-head">
        <button className="sheet-back" onClick={onClose} aria-label="Back"><ArrowLeftIcon /></button>
        <Heading size="4" style={{ flex: 1, letterSpacing: '-0.3px' }}>PO {order.id}</Heading>
        <span className={`st-chip ${live ? '' : 'ok'}`}>{live ? ORDER_STAGES[si][0] : 'Delivered'}</span>
      </div>
      <div className="cp-body">
        <div className="cp-card">
          <Flex align="center" justify="between">
            <Text size="2" weight="bold">{order.date} · {order.addrLabel || 'Shop'}</Text>
            <Text size="1" weight="bold" color="gray">{Math.round(fill)}%</Text>
          </Flex>
          <div className="oc-line" style={{ marginTop: 10 }}>
            <div style={{ width: `${fill}%` }} />
          </div>
          <div className="tl">
            {TL.map(([t, s], i) => {
              const done = i < si || !live
              const cur = live && i === si
              return (
                <div className="tl-row" key={t}>
                  <div className="tl-rail">
                    <span className={`tl-dot ${done ? 'done' : cur ? 'cur' : ''}`}>
                      {done && <CheckIcon width={11} height={11} />}
                    </span>
                    {i < TL.length - 1 && <span className={`tl-line ${done ? 'done' : ''}`} />}
                  </div>
                  <Box flexGrow="1" style={{ minWidth: 0, paddingBottom: i < TL.length - 1 ? 16 : 0 }}>
                    <Text size="2" weight={cur || done ? 'bold' : 'medium'} as="div" color={done || cur ? undefined : 'gray'}>{t}</Text>
                    <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>{s}</Text>
                  </Box>
                  <Text style={{ fontSize: 10, color: 'var(--gray-9)', flex: 'none' }}>{timeFor(i)}</Text>
                </div>
              )
            })}
          </div>
        </div>
        {(!live || si === ORDER_STAGES.length - 1) && (
          <div className="cp-card">
            <Flex align="center" justify="between">
              <Text size="1" weight="bold" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
                PROOF OF DELIVERY
              </Text>
              <span className="st-chip ok">OTP VERIFIED</span>
            </Flex>
            <div className="pod-shots">
              {POD_SHOTS.map(s => <Img key={s} src={img(s, 360)} alt="Delivery photo" />)}
            </div>
            <Flex align="center" gap="2" mt="2">
              <div className="vr-av">S</div>
              <Box flexGrow="1" style={{ minWidth: 0 }}>
                <Text size="1" weight="bold" as="div">Received by Suresh · store staff</Text>
                <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>
                  Geo-tagged at {order.addrLabel || 'Shop'} · {timeFor(3)}
                </Text>
              </Box>
            </Flex>
          </div>
        )}
        <div className="cp-card">
          <div className="ods-stats" style={{ marginTop: 0 }}>
            <div><Text size="2" weight="bold" as="div">{pieces}</Text><span>pieces</span></div>
            <div><Text size="2" weight="bold" as="div">{order.items.length}</Text><span>SKUs</span></div>
            <div><Text size="2" weight="bold" as="div">₹{(total / 1000).toFixed(1)}k</Text><span>value</span></div>
            <div><Text size="2" weight="bold" as="div" style={{ color: 'var(--green-11)' }}>₹{saved.toLocaleString('en-IN')}</Text><span>saved</span></div>
          </div>
        </div>
        <div className="cp-card">
          <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>ITEMS</Text>
          {order.items.map((it) => {
            const u = it.unit ?? unitPriceFor(it.p, it.n)
            return (
              <div className="cs-row" key={`op-${it.p.id}`}>
                <Img src={img(it.p.ph, 120)} alt="" />
                <Box flexGrow="1" style={{ minWidth: 0 }}>
                  <Text size="1" weight="bold" as="div" className="clamp2" style={{ lineHeight: 1.3 }}>{it.p.name}</Text>
                  <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>{it.n} × ₹{u.toLocaleString('en-IN')}</Text>
                </Box>
                <Text size="1" weight="bold" style={{ minWidth: 60, textAlign: 'right', flex: 'none', whiteSpace: 'nowrap' }}>
                  ₹{(it.n * u).toLocaleString('en-IN')}
                </Text>
              </div>
            )
          })}
          <div className="cp-divider" />
          {bill && (
            <>
              {bill.schemeOff > 0 && (
                <Flex justify="between">
                  <Text size="1" color="gray">Volume scheme</Text>
                  <Text size="1" weight="bold" style={{ color: 'var(--green-11)' }}>−₹{bill.schemeOff.toLocaleString('en-IN')}</Text>
                </Flex>
              )}
              {bill.coupon && (
                <Flex justify="between" mt="1">
                  <Text size="1" color="gray">Coupon · {bill.coupon.label}</Text>
                  <Text size="1" weight="bold" style={{ color: 'var(--green-11)' }}>−₹{bill.coupon.off.toLocaleString('en-IN')}</Text>
                </Flex>
              )}
              {(bill.deliveryFee > 0 || bill.expressFee > 0) && (
                <Flex justify="between" mt="1">
                  <Text size="1" color="gray">Delivery{bill.expressFee ? ' + express' : ''}</Text>
                  <Text size="1" weight="bold">₹{(bill.deliveryFee + bill.expressFee).toLocaleString('en-IN')}</Text>
                </Flex>
              )}
            </>
          )}
          <Flex justify="between" mt={bill ? '1' : '0'}>
            <Text size="2" weight="bold">Order total</Text>
            <Text size="2" weight="bold">₹{total.toLocaleString('en-IN')}</Text>
          </Flex>
          {order.payMode && order.dueTs && (
            <Text size="1" as="div" mt="1" style={{ color: 'var(--green-11)', fontWeight: 700 }}>
              {order.payMode} · due {new Date(order.dueTs).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
          )}
        </div>
        <Flex gap="2">
          <button className="qs-cta ghost" style={{ marginTop: 0, flex: 1, justifyContent: 'center', gap: 7 }} onClick={() => downloadInvoice(order)}>
            <FileTextIcon width={14} height={14} /> Invoice
          </button>
          <button className="qs-cta" style={{ marginTop: 0, flex: 1.3, justifyContent: 'center' }} onClick={repeat}>
            Repeat order
          </button>
        </Flex>
      </div>
    </div>
  )
}

function AcctOrders({ lastOrder, onChange }) {
  const [view, setView] = useState(null)
  ordPgRef.current = view !== null
  useEffect(() => {
    if (!view) return
    if (!window.history.state?.qcOrdPg) window.history.pushState({ qcOrdPg: true }, '')
    const onPop = () => setView(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [view !== null]) // eslint-disable-line react-hooks/exhaustive-deps
  const closeView = () => {
    if (window.history.state?.qcOrdPg) window.history.back()
    else setView(null)
  }
  // #ordpg: open the first receipt for design review
  useEffect(() => {
    if (window.location.hash === '#ordpg' && hist[0]) setView(hist[0])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [preset, setPreset] = useState('fy')
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const hist = [
    ...(lastOrder ? [{
      id: lastOrder.id, date: 'Today', status: 'In transit', ts: lastOrder.ts, addrLabel: lastOrder.addrLabel,
      items: (lastOrder.items || []).map(({ p, n }) => ({ p, n })),
    }] : []),
    ...PAST_ORDERS.map(o => ({
      ...o, status: 'Delivered',
      items: o.items.map(([id, n, unit]) => ({ p: FEED_POOL.find(p => p.id === id), n, unit })).filter(x => x.p),
    })),
  ]
  const nowTs = Date.now()
  let f0 = 0
  let t0 = Infinity
  if (preset === 'custom') {
    f0 = from ? from.getTime() : 0
    t0 = to ? to.getTime() + 86399999 : Infinity
  } else if (preset === '7d') {
    f0 = nowTs - 7 * 864e5
  } else if (preset === '30d') {
    f0 = nowTs - 30 * 864e5
  } else if (preset === 'qtr') {
    const d = new Date()
    f0 = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1).getTime()
  } else {
    const d = new Date()
    f0 = (d.getMonth() >= 3 ? new Date(d.getFullYear(), 3, 1) : new Date(d.getFullYear() - 1, 3, 1)).getTime()
  }
  const shownH = hist.filter(o => (o.ts || nowTs) >= f0 && (o.ts || nowTs) <= t0)
  const totalVal = hist.reduce((s, o) => s + o.items.reduce((x, { p, n }) => x + p.price * n, 0), 0)
  const repeat = (o, e) => {
    o.items.forEach(({ p, n }) => onChange(n, p, { noReco: true }))
    sparkle(e)
  }
  return (
    <>
      <div className="sub-hero blue">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--blue-11)', fontSize: 10, letterSpacing: '.6px' }}>
          ORDERS
        </Text>
        <Flex align="baseline" gap="2" mt="1">
          <Text weight="bold" style={{ fontSize: 27, letterSpacing: '-0.6px' }}>{hist.length}</Text>
          <Text size="1" color="gray">orders · {fmtL(totalVal)} billed · tap any for invoice</Text>
        </Flex>
      </div>
      <div className="seg" style={{ marginTop: 0, marginBottom: 12 }}>
        {[['7d', '7D'], ['30d', '30D'], ['qtr', 'Qtr'], ['fy', 'FY'], ['custom', 'Custom']].map(([k, l]) => (
          <button key={k} className={`seg-b ${preset === k ? 'on' : ''}`} onClick={() => setPreset(k)}>{l}</button>
        ))}
      </div>
      {preset === 'custom' && (
        <Flex gap="2" mb="2">
          <Box style={{ flex: 1 }}>
            <Text size="1" color="gray" as="div" mb="1">From</Text>
            <CalPicker value={from} onChange={setFrom} allowPast />
          </Box>
          <Box style={{ flex: 1 }}>
            <Text size="1" color="gray" as="div" mb="1">To</Text>
            <CalPicker value={to} onChange={setTo} allowPast />
          </Box>
        </Flex>
      )}
      <Text size="1" color="gray" as="div" mb="3" style={{ padding: '0 4px' }}>
        Showing {shownH.length} invoice{shownH.length === 1 ? '' : 's'}
      </Text>
      {shownH.length === 0 && (
        <div className="cp-card"><Text size="1" color="gray">No invoices in this range — widen the dates.</Text></div>
      )}
      {shownH.map(o => {
        const total = o.items.reduce((s, { p, n }) => s + p.price * n, 0)
        return (
          <div className="oh-card" key={`h-${o.id}`}>
            <Flex align="center" justify="between">
              <Text size="2" weight="bold">{o.date}</Text>
              <span className={`st-chip ${o.status === 'Delivered' ? 'ok' : ''}`}>{o.status}</span>
            </Flex>
            <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>PO {o.id} · {o.items.length} SKUs</Text>
            <Flex align="center" gap="2" mt="2">
              <Flex>
                {o.items.slice(0, 3).map(({ p }) => (
                  <Img key={`hp-${o.id}-${p.id}`} className="thumb" src={img(p.ph, 80)} alt="" />
                ))}
              </Flex>
              <Text size="2" weight="bold" style={{ marginLeft: 'auto' }}>₹{total.toLocaleString('en-IN')}</Text>
            </Flex>
            <div className="oh-actions">
              <button onClick={() => downloadInvoice(o)}><FileTextIcon width={13} height={13} /> Invoice</button>
              <button onClick={(e) => repeat(o, e)}><CounterClockwiseClockIcon width={13} height={13} /> Repeat</button>
              <button className="pri" onClick={() => setView(o)}>Details</button>
            </div>
          </div>
        )
      })}
      <PageExit open={view !== null}>
        {view && <OrderDetailPage key={view.id} order={view} onClose={closeView} onChange={onChange} />}
      </PageExit>
    </>
  )
}

function AcctSchemes({ onCategory }) {
  return (
    <>
      <div className="sub-hero violet">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--violet-11)', fontSize: 10, letterSpacing: '.6px' }}>
          SAVED THIS FY
        </Text>
        <Text weight="bold" as="div" style={{ fontSize: 27, letterSpacing: '-0.6px' }}>₹14,320</Text>
        <Text size="1" color="gray" as="div">through volume schemes and bulk prices</Text>
      </div>
      <div className="cp-card cp-scheme">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--violet-11)', letterSpacing: '.5px', fontSize: 10.5 }}>PER-ORDER VOLUME SCHEME</Text>
        {SCHEMES.map(s => (
          <Flex key={s.min} justify="between" mt="2">
            <Text size="2">Orders above {fmtL(s.min)}</Text>
            <Text size="2" weight="bold" style={{ color: 'var(--violet-11)' }}>{s.off}% off invoice</Text>
          </Flex>
        ))}
        <Text size="1" color="gray" as="div" mt="2">Applied automatically at checkout · stacks with bulk prices</Text>
      </div>
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>MONTHLY TIER PERKS</Text>
        {TIERS.map(t => (
          <Flex key={t.name} align="center" gap="2" mt="2">
            <span className="tier-mini" style={{ background: t.c }} />
            <Text size="2" weight="bold" style={{ width: 76, flex: 'none' }}>{t.name}</Text>
            <Text size="1" color="gray" style={{ flex: 1 }}>{t.min === 0 ? 'Base' : `${fmtL(t.min)}+/mo`}</Text>
            <Text size="1" weight="bold" style={{ color: 'var(--green-11)' }}>{t.perk}</Text>
          </Flex>
        ))}
      </div>
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
          LIVE CATEGORY SCHEMES
        </Text>
        {CAT_SCHEMES.map(s => {
          const c = CATEGORIES.find(x => x[1] === s.cat)
          return (
            <button key={s.cat} className="cs-cat" onClick={() => onCategory && onCategory(s.cat)}>
              {c && <Img src={img(c[0], 100)} alt="" />}
              <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <Text size="2" weight="bold" as="div">{s.cat}</Text>
                <Text as="div" style={{ fontSize: 10.5, color: 'var(--violet-11)', fontWeight: 700 }}>{s.deal}</Text>
                <Text as="div" style={{ fontSize: 9.5, color: 'var(--gray-9)' }}>{s.till}</Text>
              </span>
              <span className="st-chip">{s.tag}</span>
              <ChevronRightIcon width={14} height={14} color="var(--gray-8)" style={{ flex: 'none' }} />
            </button>
          )
        })}
        <Text size="1" color="gray" as="div" mt="2">Tap a category to see the products in scheme.</Text>
      </div>
    </>
  )
}

function AcctGst() {
  const [gst, setGst] = usePersisted('qc-gst', { gstin: '29ABCDE1234F1Z5', name: 'Bora Hardware & Plywood' })
  const valid = /^[0-9]{2}[A-Z0-9]{13}$/.test(gst.gstin.toUpperCase())
  return (
    <div className="cp-card">
      <Flex align="center" justify="between">
        <Text size="1" weight="bold" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>GST DETAILS</Text>
        {valid && <span className="st-chip ok"><CheckIcon width={10} height={10} /> Verified</span>}
      </Flex>
      <Text size="1" color="gray" as="div" mt="3">GSTIN</Text>
      <input className="cp-input" style={{ marginTop: 4, textTransform: 'uppercase' }} value={gst.gstin}
        onChange={(e) => setGst({ ...gst, gstin: e.target.value })} maxLength={15} />
      <Text size="1" color="gray" as="div">Registered business name</Text>
      <input className="cp-input" style={{ marginTop: 4 }} value={gst.name}
        onChange={(e) => setGst({ ...gst, name: e.target.value })} />
      <Text size="1" color="gray" as="div" mt="1">Input credit appears on every invoice automatically.</Text>
    </div>
  )
}

function AcctAddr() {
  const [addrs, setAddrs] = useState(loadAddrs)
  const [sel, setSel] = usePersisted('qc-addr-sel', loadAddrs()[0].id)
  const [adding, setAdding] = useState(false)
  const addNew = (a) => {
    const next = [...addrs, a]
    setAddrs(next)
    localStorage.setItem('qc-addr', JSON.stringify(next))
    setSel(a.id)
    setAdding(false)
  }
  const remove = (id) => {
    const next = addrs.filter(a => a.id !== id)
    setAddrs(next)
    localStorage.setItem('qc-addr', JSON.stringify(next))
    if (sel === id && next[0]) setSel(next[0].id)
  }
  return (
    <div className="cp-card">
      {addrs.map(a => (
        <div key={a.id} className="addr-row" style={{ cursor: 'default' }}>
          <button className={`radio ${a.id === sel ? 'on' : ''}`} style={{ marginTop: 2, cursor: 'pointer', background: 'none', padding: 0 }} onClick={() => setSel(a.id)} aria-label="Default" />
          <span style={{ minWidth: 0, flex: 1 }}>
            <Text size="2" weight="bold" as="div">{a.label} {a.id === sel && <span className="st-chip ok" style={{ marginLeft: 4 }}>Default</span>}</Text>
            <Text size="1" color="gray" as="div" style={{ lineHeight: 1.35 }}>{a.addr}</Text>
          </span>
          {addrs.length > 1 && (
            <button className="reco-x" onClick={() => remove(a.id)} aria-label="Delete"><Cross2Icon width={12} height={12} /></button>
          )}
        </div>
      ))}
      {adding ? (
        <AddrFields onSave={addNew} />
      ) : (
        <button className="addr-add" onClick={() => setAdding(true)}><PlusIcon width={14} height={14} /> Add new address</button>
      )}
    </div>
  )
}

/* recommendation row shared by the calculators */
function CalcSugg({ p, qty, note }) {
  const openQty = useContext(QtyCtx)
  if (!p) {
    return (
      <div className="calc-out">
        <Text size="1" weight="bold" style={{ color: 'var(--amber-11)' }}>
          Beyond the standard range — talk to support for engineered options
        </Text>
      </div>
    )
  }
  return (
    <div className="calc-out">
      <Text size="1" weight="bold" as="div" style={{ color: 'var(--green-11)' }}>{note}</Text>
      <Flex align="center" gap="3" mt="2">
        <Img src={img(p.ph, 100)} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
        <Box flexGrow="1" style={{ minWidth: 0 }}>
          <Text size="1" weight="bold" as="div" className="clamp1">{p.name}</Text>
          <Text size="1" color="gray" as="div">₹{p.price.toLocaleString('en-IN')}{p.bulk ? ` · ${p.bulk}` : ''}</Text>
        </Box>
        <Button
          size="1" color="green" radius="full" style={{ fontWeight: 800, flex: 'none' }}
          onClick={() => openQty && openQty(p, null, { noReco: true })}
        >
          ADD{qty ? ` ${qty}` : ''}
        </Button>
      </Flex>
    </div>
  )
}

function AcctCalc() {
  const [tab, setTab] = useState('slide')
  const [wt, setWt] = useState(30)
  const [sz, setSz] = useState(450)
  const [ht, setHt] = useState(1800)
  // door-closer selector
  const [cw, setCw] = useState(900)
  const [chh, setChh] = useState(2100)
  const [cth, setCth] = useState(25)
  const [cmat, setCmat] = useState('Engineered wood')
  const DENSITY = { 'Engineered wood': 650, 'Solid wood': 750, 'Glass': 2500, 'Aluminium': 1600 }
  const doorKg = Math.round((cw / 1000) * (chh / 1000) * (cth / 1000) * DENSITY[cmat])
  const closer = FEED_POOL
    .filter(p => /closer/i.test(p.name) && p.load >= doorKg && p.size >= cw)
    .sort((a, b) => a.load - b.load)[0]
  const slide = FEED_POOL
    .filter(p => p.load && p.load >= wt && (!p.size || p.size === sz) && /slide|channel|tandem|quadro/i.test(p.name))
    .sort((a, b) => a.load - b.load)[0]
  const hingeCount = ht < 900 ? 2 : ht < 1500 ? 3 : ht < 2100 ? 4 : 5
  const hinge = FEED_POOL.find(p => /hinge/i.test(p.name))
  return (
    <>
      <div className="seg" style={{ marginTop: 0 }}>
        <button className={`seg-b ${tab === 'slide' ? 'on' : ''}`} onClick={() => setTab('slide')}>Slide load</button>
        <button className={`seg-b ${tab === 'hinge' ? 'on' : ''}`} onClick={() => setTab('hinge')}>Hinges</button>
        <button className={`seg-b ${tab === 'closer' ? 'on' : ''}`} onClick={() => setTab('closer')}>Door closer</button>
      </div>
      {tab === 'slide' ? (
        <div className="cp-card">
          <Text size="2" weight="bold" as="div">Drawer slide selector</Text>
          <Text size="1" color="gray" as="div" mt="1">Loaded drawer weight (kg)</Text>
          <input className="cp-input" style={{ marginTop: 4 }} type="number" min="1" max="80" value={wt}
            onChange={(e) => setWt(Math.max(1, +e.target.value || 0))} />
          <Text size="1" color="gray" as="div">Slide length</Text>
          <Flex gap="2" mt="1" mb="2">
            {[450, 500, 600].map(s => (
              <button key={s} className={`seg-b ${sz === s ? 'on' : ''}`} style={{ flex: 1 }} onClick={() => setSz(s)}>{s} mm</button>
            ))}
          </Flex>
          <CalcSugg p={slide} note={`For ${wt} kg · recommended ${slide ? `${slide.load} kg rated` : ''}`} />
        </div>
      ) : (
        <div className="cp-card">
          <Text size="2" weight="bold" as="div">Hinges per door</Text>
          <Text size="1" color="gray" as="div" mt="1">Door height (mm)</Text>
          <input className="cp-input" style={{ marginTop: 4 }} type="number" min="300" max="3000" value={ht}
            onChange={(e) => setHt(Math.max(300, +e.target.value || 0))} />
          <CalcSugg p={hinge} qty={hingeCount} note={`${ht} mm door → ${hingeCount} hinges per door`} />
        </div>
      )}
      {tab === 'closer' && (
        <div className="cp-card">
          <Text size="2" weight="bold" as="div">Door closer selector</Text>
          <Text size="1" color="gray" as="div" mt="1">Door size & material → estimated weight → the right closer</Text>
          <Flex gap="2" mt="2">
            <Box style={{ flex: 1 }}>
              <Text size="1" color="gray" as="div">Width (mm)</Text>
              <input
                className="cp-input" style={{ marginTop: 4 }} type="number" min="400" max="1400"
                value={cw} onChange={(e) => setCw(Math.max(300, +e.target.value || 0))}
              />
            </Box>
            <Box style={{ flex: 1 }}>
              <Text size="1" color="gray" as="div">Height (mm)</Text>
              <input
                className="cp-input" style={{ marginTop: 4 }} type="number" min="1200" max="3000"
                value={chh} onChange={(e) => setChh(Math.max(900, +e.target.value || 0))}
              />
            </Box>
          </Flex>
          <Text size="1" color="gray" as="div">Thickness</Text>
          <Flex gap="2" mt="1" mb="2">
            {[18, 25, 32, 40].map(t => (
              <button key={t} className={`seg-b ${cth === t ? 'on' : ''}`} style={{ flex: 1 }} onClick={() => setCth(t)}>{t} mm</button>
            ))}
          </Flex>
          <Text size="1" color="gray" as="div">Material</Text>
          <Flex gap="2" mt="1" mb="2" wrap="wrap">
            {Object.keys(DENSITY).map(m => (
              <button key={m} className={`seg-b ${cmat === m ? 'on' : ''}`} style={{ flex: '1 1 40%' }} onClick={() => setCmat(m)}>{m}</button>
            ))}
          </Flex>
          <CalcSugg p={closer} note={`~${doorKg} kg · ${cw} mm door → ${closer ? closer.qty : 'no standard match'}`} />
        </div>
      )}
    </>
  )
}

/* shadcn-style date picker: field button + month-grid calendar */
function CalPicker({ value, onChange, allowPast }) {
  const today = new Date()
  const [vm, setVm] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('days')
  const dow = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const years = Array.from({ length: 12 }, (_, i) => today.getFullYear() - 6 + i)
  const startPad = new Date(vm.getFullYear(), vm.getMonth(), 1).getDay()
  const dim = new Date(vm.getFullYear(), vm.getMonth() + 1, 0).getDate()
  const cells = [...Array(startPad).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)]
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const isPast = (d) => new Date(vm.getFullYear(), vm.getMonth(), d) < t0
  const isSel = (d) => value && value.getDate() === d && value.getMonth() === vm.getMonth() && value.getFullYear() === vm.getFullYear()
  const isToday = (d) => d === today.getDate() && vm.getMonth() === today.getMonth() && vm.getFullYear() === today.getFullYear()
  return (
    <>
      <button className={`cal-field ${value ? 'has' : ''}`} onClick={() => { setOpen(o => !o); setMode('days') }}>
        <CalendarIcon width={15} height={15} />
        <span>{value ? value.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Pick a date'}</span>
        <ChevronDownIcon width={14} height={14} style={{ marginLeft: 'auto', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      {open && (
        <div className="cal-pop">
          {mode === 'days' && (
            <>
              <div className="cal-head">
                <button onClick={() => setVm(new Date(vm.getFullYear(), vm.getMonth() - 1, 1))} aria-label="Previous month">
                  <ChevronLeftIcon width={14} height={14} />
                </button>
                <button className="cal-title" onClick={() => setMode('months')}>
                  {vm.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  <ChevronDownIcon width={12} height={12} />
                </button>
                <button onClick={() => setVm(new Date(vm.getFullYear(), vm.getMonth() + 1, 1))} aria-label="Next month">
                  <ChevronRightIcon width={14} height={14} />
                </button>
              </div>
              <div className="cal-grid">
                {dow.map(d => <span key={d} className="cal-dow">{d}</span>)}
                {cells.map((d, i) => d === null ? <span key={`e${i}`} /> : (
                  <button
                    key={d} disabled={!allowPast && isPast(d)}
                    className={`cal-day ${isSel(d) ? 'sel' : ''} ${isToday(d) ? 'today' : ''}`}
                    onClick={() => { onChange(new Date(vm.getFullYear(), vm.getMonth(), d)); setOpen(false) }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </>
          )}
          {mode === 'months' && (
            <>
              <div className="cal-head">
                <button onClick={() => setVm(new Date(vm.getFullYear() - 1, vm.getMonth(), 1))} aria-label="Previous year">
                  <ChevronLeftIcon width={14} height={14} />
                </button>
                <button className="cal-title" onClick={() => setMode('years')}>
                  {vm.getFullYear()}
                  <ChevronDownIcon width={12} height={12} />
                </button>
                <button onClick={() => setVm(new Date(vm.getFullYear() + 1, vm.getMonth(), 1))} aria-label="Next year">
                  <ChevronRightIcon width={14} height={14} />
                </button>
              </div>
              <div className="cal-mgrid">
                {MONTHS.map((m, i) => (
                  <button
                    key={m} className={`cal-mcell ${i === vm.getMonth() ? 'sel' : ''}`}
                    onClick={() => { setVm(new Date(vm.getFullYear(), i, 1)); setMode('days') }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </>
          )}
          {mode === 'years' && (
            <>
              <div className="cal-head">
                <Text size="2" weight="bold" style={{ width: '100%', textAlign: 'center' }}>Select year</Text>
              </div>
              <div className="cal-mgrid">
                {years.map(y => (
                  <button
                    key={y} className={`cal-mcell ${y === vm.getFullYear() ? 'sel' : ''}`}
                    onClick={() => { setVm(new Date(y, vm.getMonth(), 1)); setMode('months') }}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

const TIME_SLOTS = ['10 AM', '11 AM', '12 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM']
const VISIT_STAGES = {
  site: ['Received', 'Team assigned', 'Visit scheduled'],
  display: ['Received', 'Slot confirmed', 'Visited'],
}
const visitStage = (r, now) => {
  const el = (now - r.ts) / 1000
  const raw = el < 90 ? 0 : el < 240 ? 1 : 2
  // the terminal stage (visited/scheduled-complete) can't precede the booked day
  return r.date && now < r.date ? Math.min(raw, 1) : raw
}

function VisitRow({ r, now, kind }) {
  const STAGES = VISIT_STAGES[kind]
  const si = visitStage(r, now)
  const dl = r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''
  const place = r.addr ? r.addr.split(',').slice(-1)[0].trim() : ''
  return (
    <div className="vr-row">
      <div className="vr-av">{(r.cName || 'C').slice(0, 1).toUpperCase()}</div>
      <Box flexGrow="1" style={{ minWidth: 0 }}>
        <Flex align="center" gap="2">
          <Text size="2" weight="bold" className="clamp1">{r.cName}</Text>
          <span className="st-chip" style={{ fontSize: 8.5 }}>{kind === 'site' ? 'SITE' : 'SHOWROOM'}</span>
        </Flex>
        <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>
          {[r.type, dl && `${dl} · ${r.slot}`, place].filter(Boolean).join(' · ')} · #{r.id}
        </Text>
        <Flex gap="1" mt="1" align="center">
          {STAGES.map((s, i) => <span key={s} className={`vr-dot ${i <= si ? 'on' : ''}`} />)}
          <Text weight="bold" style={{ marginLeft: 6, color: si === 2 ? 'var(--green-11)' : 'var(--amber-11)', fontSize: 10 }}>
            {STAGES[si]}
          </Text>
        </Flex>
      </Box>
      <a className="vr-call" href={`tel:+91${r.cPh}`} aria-label="Call customer">
        <MobileIcon width={14} height={14} />
      </a>
    </div>
  )
}

function VisitForm({ kind }) {
  const storeKey = kind === 'site' ? 'qc-visits-site' : 'qc-visits-display'
  const [reqs, setReqs] = usePersisted(storeKey, [])
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(t)
  }, [])
  const [cName, setCName] = useState('')
  const [cPh, setCPh] = useState('')
  const [type, setType] = useState('New site')
  const [date, setDate] = useState(null)
  const [slot, setSlot] = useState(null)
  const [l1, setL1] = useState('')
  const [l2, setL2] = useState('')
  const [lm, setLm] = useState('')
  const [ct, setCt] = useState('')
  const [pin, setPin] = useState('')
  const [notes, setNotes] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const valid = cName.trim() && cPh.length === 10 && date && slot
    && (kind === 'display' || (l1.trim() && ct.trim() && pin.length === 6))
  const submit = (e) => {
    sparkle(e)
    const addr = kind === 'site'
      ? [l1.trim(), l2.trim(), lm.trim() && `Near ${lm.trim()}`, `${ct.trim()} ${pin}`].filter(Boolean).join(', ')
      : ''
    setReqs([{
      id: `V${String(Date.now()).slice(-5)}`, cName: cName.trim(), cPh,
      type: kind === 'site' ? type : 'Showroom visit',
      date: date.getTime(), slot, addr, notes: notes.trim(), ts: Date.now(),
    }, ...reqs])
    setCName(''); setCPh(''); setDate(null); setSlot(null)
    setL1(''); setL2(''); setLm(''); setCt(''); setPin(''); setNotes('')
    setFormOpen(false)
  }
  const hero = kind === 'display' ? (
    <div className="sub-photo">
      <Img src={img(BRAND_DAY.ph, 700)} alt="" />
      <div className="sub-photo-cap">
        <Text size="2" weight="bold" as="div" style={{ color: '#fff' }}>Ebco Display Centre</Text>
        <Text size="1" as="div" style={{ color: 'rgba(255,255,255,.85)' }}>Indiranagar · the full range, live</Text>
      </div>
    </div>
  ) : (
    <div className="sub-hero orange">
      <SewingPinIcon width={15} height={15} color="var(--orange-11)" style={{ flex: 'none' }} />
      <Text size="1" weight="bold" style={{ color: 'var(--orange-11)' }}>Our team comes with samples, catalogues and a measuring kit</Text>
    </div>
  )
  return (
    <>
      {hero}
      {!formOpen && (
        <button className="qs-cta" style={{ marginTop: 0, marginBottom: 12 }} onClick={() => setFormOpen(true)}>
          <span>{kind === 'site' ? 'Submit a site visit request' : 'Book a showroom slot'}</span>
          <PlusIcon width={16} height={16} />
        </button>
      )}
      {formOpen && (
      <div className="cp-card" style={{ animation: 'stepin .22s cubic-bezier(.22, 1, .36, 1)' }}>
        <Flex align="center" justify="between">
          <Text size="1" weight="bold" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
            CUSTOMER DETAILS
          </Text>
          <button className="reco-x" onClick={() => setFormOpen(false)} aria-label="Close form">
            <Cross2Icon width={12} height={12} />
          </button>
        </Flex>
        <input
          className="cp-input" style={{ marginTop: 8 }} placeholder="Customer / firm name"
          value={cName} onChange={(e) => setCName(e.target.value)}
        />
        <input
          className="cp-input" placeholder="Customer phone (10 digits)" inputMode="numeric" maxLength={10}
          value={cPh} onChange={(e) => setCPh(e.target.value.replace(/\D/g, ''))}
        />
        {kind === 'site' && (
          <>
            <Text size="1" color="gray" as="div">Visit type</Text>
            <Flex gap="2" mt="1" mb="2">
              {['New site', 'Renovation', 'Project bid'].map(o => (
                <button key={o} className={`seg-b ${type === o ? 'on' : ''}`} style={{ flex: 1 }} onClick={() => setType(o)}>{o}</button>
              ))}
            </Flex>
          </>
        )}

        <Text size="1" weight="bold" as="div" mt="2" mb="1" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
          DATE & TIME
        </Text>
        <CalPicker value={date} onChange={setDate} />
        <div className="slot-grid">
          {TIME_SLOTS.map(s => (
            <button key={s} className={`slot ${slot === s ? 'on' : ''}`} onClick={() => setSlot(s)}>{s}</button>
          ))}
        </div>

        {kind === 'site' && (
          <>
            <Text size="1" weight="bold" as="div" mt="2" mb="1" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
              SITE ADDRESS
            </Text>
            <input className="cp-input" placeholder="Line 1 — building / site no." value={l1} onChange={(e) => setL1(e.target.value)} />
            <input className="cp-input" placeholder="Line 2 — street / area (optional)" value={l2} onChange={(e) => setL2(e.target.value)} />
            <input className="cp-input" placeholder="Landmark (optional)" value={lm} onChange={(e) => setLm(e.target.value)} />
            <Flex gap="2">
              <input className="cp-input" style={{ flex: 1.4 }} placeholder="City" value={ct} onChange={(e) => setCt(e.target.value)} />
              <input
                className="cp-input" style={{ flex: 1 }} placeholder="Pincode" inputMode="numeric" maxLength={6}
                value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              />
            </Flex>
          </>
        )}

        <textarea
          className="cp-note" rows={2}
          placeholder={kind === 'site' ? 'What should the team bring?' : 'Anything specific the customer wants to see?'}
          value={notes} onChange={(e) => setNotes(e.target.value)}
        />
        <Button mt="3" size="2" color="green" style={{ fontWeight: 800, width: '100%' }} disabled={!valid} onClick={submit}>
          Submit request
        </Button>
      </div>
      )}
      {reqs.length > 0 ? (
        <div className="cp-card">
          <Flex align="center" justify="between">
            <Text size="1" weight="bold" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
              YOUR REQUESTS · {reqs.length}
            </Text>
            {reqs.filter(r => visitStage(r, now) < 2).length > 0 && (
              <span className="st-chip">{reqs.filter(r => visitStage(r, now) < 2).length} in progress</span>
            )}
          </Flex>
          {reqs.map(r => <VisitRow key={r.id} r={r} now={now} kind={kind} />)}
        </div>
      ) : (
        <div className="cp-card">
          <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
            YOUR REQUESTS
          </Text>
          <Text size="1" color="gray" as="div" mt="2">
            No requests yet — tap the button above to book {kind === 'site' ? 'a site visit' : 'a slot'}.
          </Text>
        </div>
      )}
    </>
  )
}

/* ---------------- Brand support: branding / demo / carpenter / promo ---------------- */

const MKT_TYPES = ['Branding kit', 'In-shop demo', 'Carpenter meet', 'Promo items']
const MKT_STAGES = (type) =>
  type === 'In-shop demo' || type === 'Carpenter meet'
    ? ['Received', 'Approved', 'Scheduled']
    : ['Received', 'Approved', 'Dispatched']
const mktStage = (r, now) => {
  const el = (now - r.ts) / 1000
  const raw = el < 90 ? 0 : el < 240 ? 1 : 2
  return r.date && now < r.date ? Math.min(raw, 1) : raw
}

function AcctBrand() {
  const [reqs, setReqs] = usePersisted('qc-mkt', [])
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(t)
  }, [])
  const [formOpen, setFormOpen] = useState(false)
  const [type, setType] = useState('Branding kit')
  const [qty, setQty] = useState('')
  const [date, setDate] = useState(null)
  const [notes, setNotes] = useState('')
  const needsDate = type === 'In-shop demo' || type === 'Carpenter meet'
  const needsQty = !needsDate
  const valid = needsDate ? !!date : String(qty).trim() !== ''
  const submit = (e) => {
    sparkle(e)
    setReqs([{
      id: `B${String(Date.now()).slice(-5)}`, type,
      qty: needsQty ? +qty || 0 : null,
      date: needsDate && date ? date.getTime() : null,
      notes: notes.trim(), ts: Date.now(),
    }, ...reqs])
    setQty('')
    setDate(null)
    setNotes('')
    setFormOpen(false)
  }
  return (
    <>
      <div className="sub-hero orange">
        <SpeakerLoudIcon width={15} height={15} color="var(--orange-11)" style={{ flex: 'none' }} />
        <Text size="1" weight="bold" style={{ color: 'var(--orange-11)' }}>
          Boards, demos, carpenter meets and promo stock — on the brand
        </Text>
      </div>
      {!formOpen && (
        <button className="qs-cta" style={{ marginTop: 0, marginBottom: 12 }} onClick={() => setFormOpen(true)}>
          <span>Request brand support</span>
          <PlusIcon width={16} height={16} />
        </button>
      )}
      {formOpen && (
        <div className="cp-card" style={{ animation: 'stepin .22s cubic-bezier(.22, 1, .36, 1)' }}>
          <Flex align="center" justify="between">
            <Text size="1" weight="bold" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
              WHAT DO YOU NEED?
            </Text>
            <button className="reco-x" onClick={() => setFormOpen(false)} aria-label="Close form">
              <Cross2Icon width={12} height={12} />
            </button>
          </Flex>
          <div className="claim-types">
            {MKT_TYPES.map(t => (
              <button key={t} className={`seg-b ${type === t ? 'on' : ''}`} onClick={() => setType(t)}>{t}</button>
            ))}
          </div>
          {needsQty ? (
            <>
              <Text size="1" color="gray" as="div" mt="2">
                {type === 'Branding kit' ? 'Boards / standees needed' : 'Approx. pieces needed'}
              </Text>
              <input
                className="cp-input" style={{ marginTop: 4 }} type="number" min="1" placeholder="e.g. 2"
                value={qty} onChange={(e) => setQty(e.target.value)}
              />
            </>
          ) : (
            <>
              <Text size="1" color="gray" as="div" mt="2" mb="1">Preferred date</Text>
              <CalPicker value={date} onChange={setDate} />
            </>
          )}
          <textarea
            className="cp-note" rows={2}
            placeholder={needsDate ? 'Audience, location, what to cover…' : 'Sizes, languages, placement…'}
            value={notes} onChange={(e) => setNotes(e.target.value)}
          />
          <Button mt="3" size="2" color="green" style={{ fontWeight: 800, width: '100%' }} disabled={!valid} onClick={submit}>
            Submit request
          </Button>
        </div>
      )}
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
          YOUR REQUESTS{reqs.length ? ` · ${reqs.length}` : ''}
        </Text>
        {reqs.length === 0 && (
          <Text size="1" color="gray" as="div" mt="2">Nothing yet — tap the button above to raise one.</Text>
        )}
        {reqs.map(r => {
          const STAGES = MKT_STAGES(r.type)
          const si = mktStage(r, now)
          return (
            <div className="vr-row" key={r.id}>
              <div className="vr-av">{r.type.slice(0, 1)}</div>
              <Box flexGrow="1" style={{ minWidth: 0 }}>
                <Text size="2" weight="bold" as="div" className="clamp1">{r.type}</Text>
                <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>
                  {[r.qty ? `${r.qty} pcs` : '', r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '', `#${r.id}`].filter(Boolean).join(' · ')}
                </Text>
                <Flex gap="1" mt="1" align="center">
                  {STAGES.map((s, i) => <span key={s} className={`vr-dot ${i <= si ? 'on' : ''}`} />)}
                  <Text weight="bold" style={{ marginLeft: 6, color: si === 2 ? 'var(--green-11)' : 'var(--amber-11)', fontSize: 10 }}>
                    {STAGES[si]}
                  </Text>
                </Flex>
              </Box>
            </div>
          )
        })}
      </div>
    </>
  )
}

/* ---------------- Claims & returns: CN / return / wrong / damaged ---------------- */

const CLAIM_TYPES = ['Pending CN', 'Material return', 'Wrong delivery', 'Damaged']
const CLAIM_TERMINAL = {
  'Pending CN': 'CN issued',
  'Material return': 'Pickup scheduled',
  'Wrong delivery': 'Replacement dispatched',
  'Damaged': 'Replacement dispatched',
}
const claimStage = (r, now) => {
  const el = (now - r.ts) / 1000
  return el < 120 ? 0 : el < 300 ? 1 : 2
}

function AcctClaims({ lastOrder }) {
  const [claims, setClaims] = usePersisted('qc-claims', [])
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(t)
  }, [])
  const orders = [
    ...(lastOrder ? [{
      id: lastOrder.id, date: 'Today',
      items: (lastOrder.items || []).map(it => ({ p: it.p, n: it.n })),
    }] : []),
    ...PAST_ORDERS.map(o => ({
      id: o.id, date: o.date,
      items: o.items.map(([id, n]) => ({ p: FEED_POOL.find(p => p.id === id), n })).filter(x => x.p),
    })),
  ]
  const [formOpen, setFormOpen] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [type, setType] = useState('Pending CN')
  const [picked, setPicked] = useState({})
  const [photos, setPhotos] = useState([])
  const [notes, setNotes] = useState('')
  const order = orders.find(o => o.id === orderId)
  const pickedCount = Object.values(picked).filter(n => n > 0).length
  const valid = order && pickedCount > 0
  const toggle = (it) => {
    setPicked(prev => ({ ...prev, [it.p.id]: prev[it.p.id] ? 0 : it.n }))
  }
  const stepPick = (it, d) => {
    setPicked(prev => ({
      ...prev,
      [it.p.id]: Math.max(0, Math.min(it.n, (prev[it.p.id] || 0) + d)),
    }))
  }
  const onPhotos = (e) => {
    const files = [...(e.target.files || [])].slice(0, 4)
    setPhotos(files.map(f => ({ name: f.name, url: URL.createObjectURL(f) })))
  }
  const submit = (e) => {
    sparkle(e)
    setClaims([{
      id: `CL${String(Date.now()).slice(-5)}`,
      orderId: order.id, orderDate: order.date, type,
      items: order.items
        .filter(it => (picked[it.p.id] || 0) > 0)
        .map(it => ({ name: it.p.name, n: picked[it.p.id] })),
      photos: photos.length, notes: notes.trim(), ts: Date.now(),
    }, ...claims])
    setFormOpen(false)
    setOrderId(null)
    setPicked({})
    setPhotos([])
    setNotes('')
  }
  return (
    <>
      <div className="sub-hero blue">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--blue-11)', fontSize: 10, letterSpacing: '.6px' }}>
          CLAIMS & RETURNS
        </Text>
        <Text size="2" weight="bold" as="div" mt="1">Wrong, damaged or pending CN — sorted from here</Text>
        <Text size="1" color="gray" as="div">Pickups are free · CNs reflect in your credit ledger</Text>
      </div>
      {!formOpen && (
        <button className="qs-cta" style={{ marginTop: 0, marginBottom: 12 }} onClick={() => setFormOpen(true)}>
          <span>Raise a claim</span>
          <PlusIcon width={16} height={16} />
        </button>
      )}
      {formOpen && (
        <div className="cp-card" style={{ animation: 'stepin .22s cubic-bezier(.22, 1, .36, 1)' }}>
          <Flex align="center" justify="between">
            <Text size="1" weight="bold" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
              WHICH ORDER?
            </Text>
            <button className="reco-x" onClick={() => setFormOpen(false)} aria-label="Close form">
              <Cross2Icon width={12} height={12} />
            </button>
          </Flex>
          <div className="claim-orders">
            {orders.map(o => (
              <button key={o.id} className={`claim-ord ${orderId === o.id ? 'on' : ''}`} onClick={() => { setOrderId(o.id); setPicked({}) }}>
                <Text size="1" weight="bold" as="div">{o.date}</Text>
                <Text as="div" style={{ fontSize: 9.5, color: 'var(--gray-10)' }}>PO {o.id}</Text>
              </button>
            ))}
          </div>
          <Text size="1" weight="bold" as="div" mt="3" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
            CLAIM TYPE
          </Text>
          <div className="claim-types">
            {CLAIM_TYPES.map(t => (
              <button key={t} className={`seg-b ${type === t ? 'on' : ''}`} onClick={() => setType(t)}>{t}</button>
            ))}
          </div>
          {order && (
            <>
              <Text size="1" weight="bold" as="div" mt="3" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
                AFFECTED ITEMS
              </Text>
              {order.items.map(it => {
                const sel = (picked[it.p.id] || 0) > 0
                return (
                  <div key={it.p.id} className={`claim-item ${sel ? 'on' : ''}`}>
                    <button className="claim-check" onClick={() => toggle(it)} aria-label={sel ? 'Deselect' : 'Select'}>
                      {sel && <CheckIcon width={12} height={12} />}
                    </button>
                    <Box flexGrow="1" style={{ minWidth: 0 }} onClick={() => toggle(it)}>
                      <Text size="1" weight="bold" as="div" className="clamp1">{it.p.name}</Text>
                      <Text as="div" style={{ fontSize: 10, color: 'var(--gray-10)' }}>ordered {it.n}</Text>
                    </Box>
                    {sel && (
                      <div className="cs-step">
                        <button onClick={() => stepPick(it, -1)} aria-label="Less"><MinusIcon width={12} height={12} /></button>
                        <Text size="1" weight="bold" style={{ width: 24, textAlign: 'center', color: '#fff' }}>{picked[it.p.id]}</Text>
                        <button onClick={() => stepPick(it, 1)} aria-label="More"><PlusIcon width={12} height={12} /></button>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
          <label className="photo-add">
            <UploadIcon width={14} height={14} />
            {photos.length ? `${photos.length} photo${photos.length > 1 ? 's' : ''} attached` : 'Add photos (damage, labels, package)'}
            <input type="file" accept="image/*" multiple onChange={onPhotos} style={{ display: 'none' }} />
          </label>
          {photos.length > 0 && (
            <Flex gap="2" mt="2">
              {photos.map(ph => <img key={ph.url} src={ph.url} alt="" className="photo-thumb" />)}
            </Flex>
          )}
          <textarea
            className="cp-note" rows={2} placeholder="What went wrong?"
            value={notes} onChange={(e) => setNotes(e.target.value)}
          />
          <Button mt="3" size="2" color="green" style={{ fontWeight: 800, width: '100%' }} disabled={!valid} onClick={submit}>
            Submit claim
          </Button>
        </div>
      )}
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
          YOUR CLAIMS{claims.length ? ` · ${claims.length}` : ''}
        </Text>
        {claims.length === 0 && (
          <Text size="1" color="gray" as="div" mt="2">No claims — long may it last.</Text>
        )}
        {claims.map(r => {
          const STAGES = ['Raised', 'Under review', CLAIM_TERMINAL[r.type]]
          const si = claimStage(r, now)
          return (
            <div className="vr-row" key={r.id}>
              <div className="vr-av" style={{ background: 'var(--blue-3)', color: 'var(--blue-11)' }}>{r.type.slice(0, 1)}</div>
              <Box flexGrow="1" style={{ minWidth: 0 }}>
                <Text size="2" weight="bold" as="div" className="clamp1">{r.type} · PO {r.orderId}</Text>
                <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>
                  {r.items.length} item{r.items.length > 1 ? 's' : ''}{r.photos ? ` · ${r.photos} photos` : ''} · #{r.id}
                </Text>
                <Flex gap="1" mt="1" align="center">
                  {STAGES.map((s, i) => <span key={s} className={`vr-dot ${i <= si ? 'on' : ''}`} />)}
                  <Text weight="bold" style={{ marginLeft: 6, color: si === 2 ? 'var(--green-11)' : 'var(--amber-11)', fontSize: 10 }}>
                    {STAGES[si]}
                  </Text>
                </Flex>
              </Box>
            </div>
          )
        })}
      </div>
    </>
  )
}

function AcctSupport() {
  const rows = [
    [MobileIcon, 'Call dealer desk', '080 4512 3456 · Mon–Sat, 9–7', 'tel:+918045123456'],
    [ChatBubbleIcon, 'WhatsApp us', 'Replies in ~10 min', 'https://wa.me/918045123456'],
    [EnvelopeClosedIcon, 'Email', 'dealers@quickcart.in', 'mailto:dealers@quickcart.in'],
  ]
  const faqs = [
    ['Where is my invoice?', 'Invoices land on your email and WhatsApp within 15 minutes of dispatch, with GST input credit itemised.'],
    ['How do bulk prices apply?', 'Bulk unit prices apply automatically once a line crosses its threshold; the savings are itemised on the invoice.'],
    ['Can I return hardware?', 'Unopened boxes can be returned within 7 days from the order detail page — pickup is free.'],
  ]
  return (
    <>
      <div className="sub-hero green-line">
        <span className="oc-pulse" />
        <Text size="2" weight="bold">We're online</Text>
        <Text size="1" color="gray" style={{ marginLeft: 'auto' }}>avg reply ~10 min</Text>
      </div>
      <div className="cp-card">
        {rows.map(([Icon, t, s, href]) => (
          <a key={t} className="sup-row" href={href} target="_blank" rel="noreferrer">
            <span className="mrow-ic"><Icon width={16} height={16} /></span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <Text size="2" weight="bold" as="div">{t}</Text>
              <Text size="1" color="gray" as="div">{s}</Text>
            </span>
            <ChevronRightIcon width={14} height={14} color="var(--gray-8)" />
          </a>
        ))}
      </div>
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>FAQS</Text>
        {faqs.map(([q, a]) => (
          <details className="faq" key={q}>
            <summary><Text size="2" weight="bold">{q}</Text><ChevronDownIcon width={14} height={14} /></summary>
            <Text size="1" color="gray" as="div" style={{ lineHeight: 1.5, paddingBottom: 10 }}>{a}</Text>
          </details>
        ))}
      </div>
    </>
  )
}

function AcctNotif() {
  const [prefs, setPrefs] = usePersisted('qc-notif', { orders: true, flash: true, quiz: true, price: false, wa: true })
  const defs = [
    ['orders', 'Order updates', 'Dispatch, delivery, invoices'],
    ['flash', 'Flash sale alerts', 'When deals go live'],
    ['quiz', 'Quiz & rewards', 'Daily quiz, spins, streaks'],
    ['price', 'Price drops', 'On items you buy often'],
    ['wa', 'WhatsApp updates', 'Mirror everything on WhatsApp'],
  ]
  const on = Object.values(prefs).filter(Boolean).length
  return (
    <>
      <div className="sub-hero green-line">
        <BellIcon width={15} height={15} color="var(--green-11)" style={{ flex: 'none' }} />
        <Text size="2" weight="bold">{on} of {defs.length} channels on</Text>
      </div>
      <div className="cp-card">
      {defs.map(([k, t, s]) => (
        <Flex key={k} align="center" gap="3" className="pref-row">
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Text size="2" weight="bold" as="div">{t}</Text>
            <Text size="1" color="gray" as="div">{s}</Text>
          </Box>
          <Toggle on={!!prefs[k]} onToggle={() => setPrefs({ ...prefs, [k]: !prefs[k] })} />
        </Flex>
      ))}
      </div>
    </>
  )
}

function AcctPrivacy() {
  const [prefs, setPrefs] = usePersisted('qc-priv', { personalize: true, analytics: true })
  const [msg, setMsg] = useState(null)
  return (
    <>
      <div className="cp-card">
        {[['personalize', 'Personalised offers', 'Recommendations from your buying pattern'], ['analytics', 'Usage analytics', 'Helps us improve the app']].map(([k, t, s]) => (
          <Flex key={k} align="center" gap="3" className="pref-row">
            <Box flexGrow="1" style={{ minWidth: 0 }}>
              <Text size="2" weight="bold" as="div">{t}</Text>
              <Text size="1" color="gray" as="div">{s}</Text>
            </Box>
            <Toggle on={!!prefs[k]} onToggle={() => setPrefs({ ...prefs, [k]: !prefs[k] })} />
          </Flex>
        ))}
      </div>
      <div className="cp-card">
        <button className="sup-row" style={{ width: '100%' }} onClick={() => setMsg('A copy of your data will reach your email within 24 hours.')}>
          <span className="mrow-ic"><FileTextIcon width={16} height={16} /></span>
          <Text size="2" weight="bold" style={{ flex: 1, textAlign: 'left' }}>Download my data</Text>
          <ChevronRightIcon width={14} height={14} color="var(--gray-8)" />
        </button>
        <button className="sup-row" style={{ width: '100%' }} onClick={() => setMsg('Deletion request noted. The dealer desk will call to confirm before anything is removed.')}>
          <span className="mrow-ic" style={{ background: 'var(--red-3)', color: 'var(--red-11)' }}><Cross2Icon width={14} height={14} /></span>
          <Text size="2" weight="bold" style={{ flex: 1, textAlign: 'left', color: 'var(--red-11)' }}>Request account deletion</Text>
          <ChevronRightIcon width={14} height={14} color="var(--gray-8)" />
        </button>
        {msg && <Text size="1" as="div" mt="2" style={{ color: 'var(--green-11)', fontWeight: 700 }}>{msg}</Text>}
      </div>
    </>
  )
}

const ACCT_TILES = [
  ['addr', HomeIcon, 'Address', 'Book'],
  ['credit', IdCardIcon, 'Credit', 'Ledger'],
  ['orders', FileTextIcon, 'My', 'Orders'],
  ['lists', BookmarkIcon, 'Project', 'Lists'],
]

const ACCT_FLAT = [
  ['calc', RulerSquareIcon, 'Calculators'],
  ['claims', ExclamationTriangleIcon, 'Claims & returns'],
  ['site', SewingPinIcon, 'Submit site visit'],
  ['display', EyeOpenIcon, 'Display centre visit'],
  ['brand', SpeakerLoudIcon, 'Brand support'],
  ['estpdf', FileTextIcon, 'Estimate PDF settings'],
  ['support', ChatBubbleIcon, 'Support'],
  ['notif', BellIcon, 'Notification preferences'],
  ['privacy', LockClosedIcon, 'Account privacy'],
]

const ACCT_TITLES = {
  dash: 'Performance dashboard', orders: 'My orders', credit: 'Credit ledger',
  lists: 'Project lists', schemes: 'Schemes & discounts',
  gst: 'GST details', calc: 'Calculators', site: 'Submit site visit',
  display: 'Display centre visit', support: 'Support', claims: 'Claims & returns', brand: 'Brand support', addr: 'Address book',
  notif: 'Notification preferences', privacy: 'Account privacy',
  estpdf: 'Estimate PDF settings',
}

/* Estimate PDF branding: company name, logo upload, text colours */
const EST_SWATCHES = ['#1A1C1F', '#696E74', '#1A2342', '#14633F', '#30A46C', '#1A43AE', '#C9A44A', '#9A3412']
const EST_PAPERS = ['#F8F5ED', '#FFFFFF', '#F2F2F0', '#F1F5EF', '#F8F1ED', '#EFF3F6']
function ColorRow({ label, value, onChange, swatches = EST_SWATCHES }) {
  return (
    <div>
      <Text size="1" weight="bold" as="div" mt="3" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
        {label}
      </Text>
      <div className="clr-row">
        {swatches.map(c => (
          <button
            key={c} type="button"
            className={`clr-dot ${value.toUpperCase() === c ? 'on' : ''}`}
            style={{ background: c }}
            onClick={() => onChange(c)} aria-label={`Colour ${c}`}
          />
        ))}
        <label className="clr-custom" title="Custom colour">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-label="Custom colour" />
        </label>
      </div>
    </div>
  )
}

function AcctEstPdf() {
  const [saved, setBrand] = usePersisted('qc-est-brand', EST_BRAND_DEFAULT)
  const brand = { ...EST_BRAND_DEFAULT, ...saved }
  const set = (k, v) => setBrand({ ...brand, [k]: v })
  const onFile = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => {
      // downscale to ≤512px so the dataURL stays localStorage-friendly
      const sc = Math.min(1, 512 / Math.max(im.naturalWidth, im.naturalHeight))
      const c = document.createElement('canvas')
      c.width = Math.round(im.naturalWidth * sc)
      c.height = Math.round(im.naturalHeight * sc)
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height)
      set('logo', c.toDataURL('image/png'))
      URL.revokeObjectURL(url)
    }
    im.src = url
    e.target.value = ''
  }
  return (
    <>
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
          COMPANY ON THE PDF
        </Text>
        <Flex direction="column" gap="2" mt="2">
          <input className="cp-input" style={{ fontSize: 16 }} placeholder="Company name" value={brand.name} onChange={(e) => set('name', e.target.value)} />
        </Flex>
        <Flex align="center" gap="3" mt="3">
          <img className="est-logo-prev" src={brand.logo || '/brand-logo.png'} alt="Company logo preview" />
          <Flex direction="column" gap="2" style={{ flex: 1 }}>
            <Button asChild size="2" variant="soft" color="green" radius="full" style={{ fontWeight: 800 }}>
              <label style={{ cursor: 'pointer', justifyContent: 'center' }}>
                Upload logo
                <input type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
              </label>
            </Button>
            {brand.logo && (
              <Button size="2" variant="ghost" color="gray" radius="full" style={{ fontWeight: 700 }} onClick={() => set('logo', null)}>
                Reset to default
              </Button>
            )}
          </Flex>
        </Flex>
        <Text size="1" color="gray" as="div" mt="2">Shown at the top-right of every customer estimate.</Text>
      </div>

      <div className="cp-card">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
          PDF TEXT COLOURS
        </Text>
        <ColorRow label="FOOTER TEXT" value={brand.footer} onChange={(v) => set('footer', v)} />
        <ColorRow label="SIDE VERTICAL TEXT" value={brand.side} onChange={(v) => set('side', v)} />
        <Text size="1" color="gray" as="div" mt="3">Item rows and totals always stay ink-on-paper for readability.</Text>
      </div>
    </>
  )
}

function AccountPage({ onClose, onChange, lastOrder, subRef, initialSub, onCategory, onGoReorder }) {
  const [sub, setSub] = useState(() => {
    const h = window.location.hash
    if (h === '#dash') return 'dash'
    if (h === '#credit') return 'credit'
    if (h === '#lists') return 'lists'
    if (h === '#orders' || h === '#ordpg') return 'orders'
    if (h === '#claims') return 'claims'
    if (h === '#brand') return 'brand'
    if (h === '#site') return 'site'
    return initialSub || null
  })
  const [lo, setLo] = useState(null) // null | 'confirm' | 'out'
  subRef.current = sub !== null
  const backSub = () => {
    if (window.history.state?.qcAcctSub) window.history.back()
    else setSub(null)
  }
  useEffect(() => {
    if (!sub) return
    if (!window.history.state?.qcAcctSub) window.history.pushState({ qcAcctSub: true }, '')
    const onPop = () => { if (!ordPgRef.current) setSub(null) }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [sub !== null]) // eslint-disable-line react-hooks/exhaustive-deps
  const renderSub = () => {
    switch (sub) {
      case 'dash': return <AcctDash onReorder={onGoReorder} />
      case 'orders': return <AcctOrders lastOrder={lastOrder} onChange={onChange} />
      case 'credit': return <AcctCredit />
      case 'lists': return <AcctLists onChange={onChange} />
      case 'schemes': return <AcctSchemes onCategory={onCategory} />
      case 'gst': return <AcctGst />
      case 'calc': return <AcctCalc />
      case 'site': return <VisitForm kind="site" />
      case 'display': return <VisitForm kind="display" />
      case 'claims': return <AcctClaims lastOrder={lastOrder} />
      case 'brand': return <AcctBrand />
      case 'support': return <AcctSupport />
      case 'addr': return <AcctAddr />
      case 'notif': return <AcctNotif />
      case 'privacy': return <AcctPrivacy />
      case 'estpdf': return <AcctEstPdf />
      default: return null
    }
  }
  return (
    <div className="acctpage">
      <div className="acct-head2">
        <Flex align="center" justify="between">
          <button className="sheet-back" onClick={onClose} aria-label="Back" style={{ background: 'rgba(255,255,255,.7)' }}>
            <ArrowLeftIcon />
          </button>
          <button className="help-pill" onClick={() => setSub('support')}>Help</button>
        </Flex>
        <Heading mt="4" style={{ fontSize: 27, letterSpacing: '-0.8px' }}>Virag Bora</Heading>
        <Text size="2" color="gray" as="div" mt="1">+91 98860 12345 · Bora Hardware & Plywood</Text>
        <Text size="2" color="gray" as="div">virag@borahardware.in</Text>
        <div className="joy-chip">
          <StarFilledIcon width={11} height={11} /> Top 25% dealer in HSR Layout — great going
        </div>
      </div>
      <div className="cp-body">
        <div className="mem-card">
          <Flex align="center" gap="2">
            <span className="tier-mini" style={{ background: '#98A2B3', width: 15, height: 15 }} />
            <Text size="4" weight="bold" style={{ letterSpacing: '-0.4px' }}>Silver Dealer</Text>
            <span className="mem-join">Gold at ₹2L/mo</span>
          </Flex>
          <Text size="2" weight="bold" as="div" mt="2" style={{ lineHeight: 1.4 }}>
            +2% margin & priority dispatch at Gold — ₹75,500 to go this month
          </Text>
          <div className="mem-bar"><div style={{ width: '62%' }} /></div>
          <div className="mem-divider" />
          <button className="mem-row" onClick={() => setSub('dash')}>
            <BarChartIcon width={16} height={16} />
            <span>View dealer journey</span>
            <ChevronRightIcon width={15} height={15} color="var(--gray-8)" />
          </button>
          <button className="mem-row" onClick={() => setSub('schemes')}>
            <StarFilledIcon width={15} height={15} />
            <span>Schemes & discounts</span>
            <ChevronRightIcon width={15} height={15} color="var(--gray-8)" />
          </button>
        </div>

        <div className="qt-row">
          {ACCT_TILES.map(([k, Icon, l1, l2]) => (
            <button key={k} className="qt" onClick={() => setSub(k)}>
              <Icon width={19} height={19} />
              <Text weight="bold" as="div" mt="1" style={{ lineHeight: 1.3, fontSize: 11 }}>{l1}<br />{l2}</Text>
            </button>
          ))}
        </div>

        {(() => {
          const cs = creditState()
          const out = cs.outstanding
          const avail = cs.limit - out
          const od = cs.open.filter(b => b.days < 0).length
          return (
            <button className="credit-snap" onClick={() => setSub('credit')}>
              <Flex align="center" justify="between">
                <Text size="1" weight="bold" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
                  CREDIT AVAILABLE
                </Text>
                {od > 0 ? <span className="st-chip bad">{od} overdue</span> : <span className="st-chip ok">On track</span>}
              </Flex>
              <Flex align="baseline" gap="2" mt="1">
                <Text size="5" weight="bold" style={{ letterSpacing: '-0.5px' }}>{fmtL(avail)}</Text>
                <Text size="1" color="gray">of {fmtL(CREDIT.limit)}{out > 0 ? ` · ${fmtL(out)} due` : ''}</Text>
                <ChevronRightIcon width={15} height={15} color="var(--gray-8)" style={{ marginLeft: 'auto' }} />
              </Flex>
              <div className="mem-bar">
                <div style={{
                  width: `${Math.round((avail / CREDIT.limit) * 100)}%`,
                  background: od > 0 ? 'var(--red-9)' : avail / CREDIT.limit < .35 ? 'var(--amber-9)' : 'var(--green-9)',
                }} />
              </div>
            </button>
          )
        })()}

        <div className="cp-card" style={{ padding: '2px 16px' }}>
          {ACCT_FLAT.map(([key, Icon, t]) => (
            <button key={key} className="flat-row" onClick={() => setSub(key)}>
              <Icon width={17} height={17} />
              <Text size="2" weight="medium" style={{ flex: 1, textAlign: 'left' }}>{t}</Text>
              <ChevronRightIcon width={15} height={15} color="var(--gray-8)" />
            </button>
          ))}
        </div>

        <div className="cp-card" style={{ padding: '2px 16px' }}>
          <button className="flat-row" onClick={() => setLo('confirm')}>
            <ExitIcon width={16} height={16} color="var(--red-11)" />
            <Text size="2" weight="bold" style={{ flex: 1, textAlign: 'left', color: 'var(--red-11)' }}>Log out</Text>
          </button>
        </div>
        <Text size="1" color="gray" as="div" style={{ textAlign: 'center', padding: '4px 0 16px' }}>QuickCart · v1.0 · Furniture hardware for dealers</Text>
      </div>

      <PageExit open={sub !== null}>
      {sub && (
        <div className={`acct-sub ${sub === 'dash' ? 'sub-dark' : ''}`}>
          <div className="pdp-head">
            <button className="sheet-back" onClick={backSub} aria-label="Back"><ArrowLeftIcon /></button>
            <Heading size="4" style={{ flex: 1, letterSpacing: '-0.3px' }}>{ACCT_TITLES[sub]}</Heading>
          </div>
          <div className="cp-body">{renderSub()}</div>
        </div>
      )}
      </PageExit>

      {lo && (
        <div className="order-done" onClick={() => lo === 'confirm' && setLo(null)}>
          <div className="od-card" onClick={(e) => e.stopPropagation()}>
            {lo === 'confirm' ? (
              <>
                <Heading size="5" style={{ letterSpacing: '-0.3px' }}>Log out?</Heading>
                <Text size="2" color="gray" as="div" mt="1">Your cart and preferences stay saved on this device.</Text>
                <Flex gap="2" mt="4">
                  <Button size="3" variant="soft" color="gray" radius="full" style={{ fontWeight: 800, flex: 1 }} onClick={() => setLo(null)}>Cancel</Button>
                  <Button size="3" color="red" radius="full" style={{ fontWeight: 800, flex: 1 }} onClick={() => setLo('out')}>Log out</Button>
                </Flex>
              </>
            ) : (
              <>
                <div className="od-tick">✓</div>
                <Heading size="5" mt="3" style={{ letterSpacing: '-0.3px' }}>Logged out</Heading>
                <Text size="2" color="gray" as="div" mt="1">See you soon — your targets are waiting.</Text>
                <Button mt="4" size="3" color="green" radius="full" style={{ fontWeight: 800, width: '100%' }} onClick={() => { setLo(null); onClose() }}>
                  Log back in
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------- Bulk qty sheet — every ADD opens dealer-scale options ---------------- */

const QTY_PACKS = [10, 50, 100]

function QtySheet({ q, onClose, onConfirm }) {
  const p = q.p
  const maxN = p.stock != null && p.stock > 0 ? p.stock : 999
  const [n, setN] = useState(() => Math.min(10, maxN))
  const tier = bulkTier(p)
  const unlocked = tier && n >= tier.thr
  const saved = unlocked ? (p.price - tier.bp) * n : 0
  return (
    <div className="qsheet-overlay" onClick={onClose}>
      <div className="qsheet" onClick={(e) => e.stopPropagation()}>
        <div className="qsheet-grab" />
        <div className="qs-prod">
          <Img src={img(p.ph, 140)} alt="" />
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Text size="2" weight="bold" as="div" className="clamp2" style={{ lineHeight: 1.3 }}>{p.name}</Text>
            {p.qty && <Text size="1" color="gray" as="div" truncate>{p.qty}</Text>}
            <Flex align="center" gap="2" mt="1">
              <Text size="2" weight="bold">₹{p.price.toLocaleString('en-IN')}</Text>
              {p.mrp && <Text size="1" color="gray" style={{ textDecoration: 'line-through' }}>₹{p.mrp.toLocaleString('en-IN')}</Text>}
              {tier && <span className="qs-bulkpill">{tier.thr}+ @ ₹{tier.bp.toLocaleString('en-IN')}</span>}
            </Flex>
          </Box>
        </div>
        <Text size="1" weight="bold" as="div" mt="4" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
          SELECT QUANTITY
        </Text>
        <div className="qs-chips">
          {QTY_PACKS.map(k => (
            <button key={k} className={`qs-chip ${n === k ? 'on' : ''}`} disabled={k > maxN} onClick={() => setN(k)}>
              {tier && k >= tier.thr && <span className="qs-off">{tier.pct}% OFF</span>}
              <span className="qn">{k}</span>
              <span className="qp">₹{(k * (tier && k >= tier.thr ? tier.bp : p.price)).toLocaleString('en-IN')}</span>
            </button>
          ))}
        </div>
        <div className="qs-step">
          <button className="qs-sbtn" onClick={() => setN(v => Math.max(1, v - 1))} aria-label="Less"><MinusIcon /></button>
          <Text size="3" weight="bold" style={{ width: 44, textAlign: 'center' }}>{n}</Text>
          <button className="qs-sbtn" onClick={() => setN(v => Math.min(maxN, v + 1))} aria-label="More"><PlusIcon /></button>
          <Text size="1" color="gray" style={{ marginLeft: 'auto' }}>or set a custom quantity</Text>
        </div>
        {tier && (
          <div className={`qs-meter ${unlocked ? 'done' : ''}`}>
            <Text size="1" weight="bold" as="div" style={{ color: unlocked ? 'var(--green-11)' : 'var(--amber-11)', display: 'flex', alignItems: 'center', gap: 5 }}>
              {unlocked && <CheckIcon width={12} height={12} style={{ flex: 'none' }} />}
              {unlocked
                ? `${tier.pct}% bulk price applied — you save ₹${saved.toLocaleString('en-IN')}`
                : `Add ${tier.thr - n} more to unlock ₹${tier.bp.toLocaleString('en-IN')}/pc (${tier.pct}% off)`}
            </Text>
            <div className="qs-mbar"><div style={{ width: `${Math.min(100, (n / tier.thr) * 100)}%` }} /></div>
          </div>
        )}
        <button className="qs-cta" onClick={(e) => onConfirm(n, e)}>
          <span>Add {n} {n === 1 ? 'piece' : 'pieces'}</span>
          <span>
            ₹{lineTotal(p, n).toLocaleString('en-IN')}
            {unlocked && (
              <s style={{ opacity: .65, fontWeight: 600, marginLeft: 7, fontSize: 12 }}>
                ₹{(n * p.price).toLocaleString('en-IN')}
              </s>
            )}
          </span>
        </button>
      </div>
    </div>
  )
}

/* Swipe-left to reveal a Remove action (cart lines, reorder rows) */
function SwipeRow({ onRemove, children }) {
  const ref = useRef(null)
  const t = useRef(null)
  const open = useRef(false)
  const set = (x, anim) => {
    const el = ref.current
    if (!el) return
    el.style.transition = anim ? 'transform .25s cubic-bezier(.22, 1, .36, 1)' : 'none'
    el.style.transform = `translateX(${x}px)`
  }
  const start = (e) => {
    t.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, axis: null, base: open.current ? -84 : 0 }
  }
  const move = (e) => {
    const s = t.current
    if (!s) return
    const dx = e.touches[0].clientX - s.x
    const dy = e.touches[0].clientY - s.y
    if (!s.axis) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return
      s.axis = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
    }
    if (s.axis !== 'h') return
    set(Math.min(0, Math.max(-110, s.base + dx)), false)
  }
  const end = (e) => {
    const s = t.current
    t.current = null
    if (!s || s.axis !== 'h') return
    const pos = s.base + (e.changedTouches[0].clientX - s.x)
    if (pos < -55) { open.current = true; set(-84, true) }
    else { open.current = false; set(0, true) }
  }
  return (
    <div className="swipe-wrap">
      <button className="swipe-del" onClick={onRemove}>Remove</button>
      <div className="swipe-inner" ref={ref} onTouchStart={start} onTouchMove={move} onTouchEnd={end} onTouchCancel={end}>
        {children}
      </div>
    </div>
  )
}

/* ---------------- Reorder page — regulars, one tap away ---------------- */

function RoRow({ m, onAdd, onStep, onCustom }) {
  const openPdp = useContext(PdpCtx)
  const qty = useContext(CartItemsCtx)[m.p.id]?.n || 0
  const p = m.p
  const off = p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0
  const oos = p.stock === 0
  return (
    <div className="ro-row" onClick={openPdp ? () => openPdp(p) : undefined}>
      <Img src={img(p.ph, 140)} alt="" />
      <Box flexGrow="1" style={{ minWidth: 0 }}>
        <Text size="1" weight="bold" as="div" className="clamp2" style={{ lineHeight: 1.3 }}>{p.name}</Text>
        <Flex align="center" gap="2" mt="1">
          <Text size="1" weight="bold">₹{p.price.toLocaleString('en-IN')}</Text>
          {off > 0 && <span className="off-pill" style={{ fontSize: 9, padding: '1px 5px' }}>{off}% OFF</span>}
        </Flex>
        {(oos || (p.stock != null && p.stock <= 10)) && (
          <Text as="div" weight="bold" style={{ fontSize: 9.5, color: oos ? 'var(--red-10)' : 'var(--amber-11)' }}>
            {oos ? `Out of stock · ships in ${p.lead} days` : `Only ${p.stock} left`}
          </Text>
        )}
        <Flex gap="1" mt="1" wrap="wrap">
          <button className={`ro-chip ${m.due ? 'due' : ''}`} onClick={(e) => { e.stopPropagation(); onCustom(m) }}>
            {m.due ? 'Due · ' : ''}usually {m.usual} pcs <ChevronDownIcon width={9} height={9} />
          </button>
          <span className="ro-chip plain">{m.every} · last {m.last}d</span>
        </Flex>
      </Box>
      {qty === 0 ? (
        <button className="ro-add" onClick={(e) => { e.stopPropagation(); onAdd(m, e) }}>
          ADD {m.usual}
        </button>
      ) : (
        <div className="ro-step" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onStep(m, -1)} aria-label="Less"><MinusIcon width={12} height={12} /></button>
          <Text
            key={qty} className="numpop" size="1" weight="bold"
            style={{ width: 28, textAlign: 'center', color: '#fff', cursor: 'pointer' }}
            onClick={() => onCustom(m)}
          >
            {qty}
          </Text>
          <button onClick={() => onStep(m, 1)} aria-label="More"><PlusIcon width={12} height={12} /></button>
        </div>
      )}
    </div>
  )
}

/* Past order detail: every line editable before re-adding */
function PastOrderSheet({ order, onClose, onChange }) {
  const [draft, setDraft] = useState(() => Object.fromEntries(order.items.map(({ p, n }) => [p.id, n])))
  const lines = order.items.filter(({ p }) => (draft[p.id] || 0) > 0)
  const total = lines.reduce((s, { p }) => s + p.price * draft[p.id], 0)
  const count = lines.reduce((s, { p }) => s + draft[p.id], 0)
  const step = (p, d) => setDraft(dr => ({ ...dr, [p.id]: Math.max(0, (dr[p.id] || 0) + d) }))
  const addAll = (e) => {
    lines.forEach(({ p }) => onChange(draft[p.id], p, { noReco: true }))
    sparkle(e)
    onClose()
  }
  return (
    <div className="qsheet-overlay" onClick={onClose}>
      <div className="qsheet cart-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="qsheet-grab" />
        <Flex align="center" justify="between">
          <Box>
            <Heading size="4" style={{ letterSpacing: '-0.3px' }}>{order.date}</Heading>
            <Text size="1" color="gray" as="div">PO {order.id} · adjust quantities, then add</Text>
          </Box>
          <Text size="1" weight="bold" color="gray" style={{ flex: 'none' }}>{count} pcs</Text>
        </Flex>
        <div className="cs-list">
          {order.items.map(({ p, n }) => {
            const q = draft[p.id] || 0
            return (
              <div className={`cs-row ${q === 0 ? 'cs-off' : ''}`} key={`po-${p.id}`}>
                <Img src={img(p.ph, 120)} alt="" />
                <Box flexGrow="1" style={{ minWidth: 0 }}>
                  <Text size="1" weight="bold" as="div" className="clamp2" style={{ lineHeight: 1.3 }}>{p.name}</Text>
                  <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>
                    ₹{p.price.toLocaleString('en-IN')} · last time {n} pcs
                  </Text>
                </Box>
                {q === 0 ? (
                  <Button
                    size="1" variant="soft" color="green" radius="full"
                    style={{ fontWeight: 800, flex: 'none' }} onClick={() => step(p, n)}
                  >
                    Add back
                  </Button>
                ) : (
                  <>
                    <div className="cs-step">
                      <button onClick={() => step(p, -1)} aria-label="Less"><MinusIcon width={12} height={12} /></button>
                      <Text key={q} className="numpop" size="1" weight="bold" style={{ width: 26, textAlign: 'center', color: '#fff' }}>{q}</Text>
                      <button onClick={() => step(p, 1)} aria-label="More"><PlusIcon width={12} height={12} /></button>
                    </div>
                    <Text size="1" weight="bold" style={{ minWidth: 56, textAlign: 'right', flex: 'none', whiteSpace: 'nowrap' }}>
                      ₹{(q * p.price).toLocaleString('en-IN')}
                    </Text>
                  </>
                )}
              </div>
            )
          })}
        </div>
        <button className="qs-cta" onClick={addAll} disabled={count === 0} style={count === 0 ? { opacity: .5 } : undefined}>
          <span>Add {count} pieces to cart</span>
          <span>₹{total.toLocaleString('en-IN')}</span>
        </button>
      </div>
    </div>
  )
}

function ReorderPage({ onClose, onChange, cart, lastOrder }) {
  const [view, setView] = useState(null)
  // #pastorder: open the first receipt for design review
  useEffect(() => {
    if (window.location.hash === '#pastorder') {
      const o = PAST_ORDERS[0]
      setView({ ...o, items: o.items.map(([id, n, unit]) => ({ p: FEED_POOL.find(p => p.id === id), n, unit })).filter(x => x.p) })
    }
  }, [])
  const ready = useNextFrame()
  const meta = useMemo(
    () => REORDER.map(m => ({ ...m, p: FEED_POOL.find(p => p.id === m.id) })).filter(x => x.p),
    [],
  )
  const [hidden, setHidden] = useState({})
  const due = meta.filter(m => m.due && !hidden[m.id])
  const regular = meta.filter(m => !m.due && !hidden[m.id])
  const cartItems = useContext(CartItemsCtx)
  const openQty = useContext(QtyCtx)
  const custom = (m) => {
    if (openQty) openQty(m.p, null, { noReco: true })
  }
  const removeRow = (m) => {
    const q = cartItems[m.p.id]?.n || 0
    if (q > 0) onChange(-q, m.p)
    setHidden(h => ({ ...h, [m.id]: true }))
  }
  const addUsual = (m, e) => {
    onChange(m.usual, m.p, { noReco: true })
    if (e) sparkle(e)
  }
  const step = (m, d) => {
    onChange(d, m.p, { noReco: true })
  }
  const pendingDue = due.filter(m => !cartItems[m.p.id]?.n)
  const dueTotal = pendingDue.reduce((s, m) => s + m.usual * m.p.price, 0)
  const addAllDue = (e) => {
    pendingDue.forEach(m => addUsual(m))
    if (e) sparkle(e)
  }
  const past = [
    ...(lastOrder ? [{
      id: lastOrder.id, date: 'Today',
      items: (lastOrder.items || []).map(({ p, n }) => ({ p, n })),
    }] : []),
    ...PAST_ORDERS.map(o => ({
      ...o,
      items: o.items.map(([id, n, unit]) => ({ p: FEED_POOL.find(p => p.id === id), n, unit })).filter(x => x.p),
    })),
  ]
  const repeat = (o, e) => {
    o.items.forEach(({ p, n }) => onChange(n, p, { noReco: true }))
    if (e) sparkle(e)
  }
  return (
    <div className="reorderpage">
      <div className="pdp-head">
        <button className="sheet-back" onClick={onClose} aria-label="Back"><ArrowLeftIcon /></button>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Heading size="4" style={{ letterSpacing: '-0.3px' }}>Reorder</Heading>
          <Text size="1" color="gray" as="div">One tap adds your usual quantity</Text>
        </Box>
        <CounterClockwiseClockIcon width={18} height={18} color="var(--gray-9)" />
      </div>
      <div className="cp-body">
        {ready && (
          <>
            <div className={`ro-banner ${pendingDue.length === 0 ? 'done' : ''}`}>
              {pendingDue.length > 0 ? (
                <>
                  <Box style={{ minWidth: 0 }}>
                    <Text size="2" weight="bold" as="div" style={{ color: '#fff' }}>
                      {pendingDue.length} item{pendingDue.length === 1 ? '' : 's'} due for reorder
                    </Text>
                    <Text size="1" as="div" style={{ color: 'rgba(255,255,255,.85)' }}>
                      Your usual quantities · ₹{dueTotal.toLocaleString('en-IN')}
                    </Text>
                  </Box>
                  <button className="ro-banner-cta" onClick={addAllDue}>Add all</button>
                </>
              ) : (
                <Flex align="center" gap="2">
                  <CheckIcon width={15} height={15} color="#fff" />
                  <Text size="2" weight="bold" style={{ color: '#fff' }}>All due items are in your cart</Text>
                </Flex>
              )}
            </div>

            {due.length > 0 && (
              <div className="cp-card">
                <Text size="1" weight="bold" as="div" style={{ color: 'var(--amber-11)', letterSpacing: '.5px', fontSize: 10.5 }}>
                  DUE NOW
                </Text>
                {due.map(m => (
                  <SwipeRow key={m.id} onRemove={() => removeRow(m)}>
                    <RoRow m={m} onAdd={addUsual} onStep={step} onCustom={custom} />
                  </SwipeRow>
                ))}
              </div>
            )}

            <div className="cp-card">
              <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
                YOUR REGULARS
              </Text>
              {regular.map(m => (
                <SwipeRow key={m.id} onRemove={() => removeRow(m)}>
                  <RoRow m={m} onAdd={addUsual} onStep={step} onCustom={custom} />
                </SwipeRow>
              ))}
            </div>

            <div className="cp-card">
              <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
                PAST ORDERS
              </Text>
              {past.map(o => (
                <div className="ro-past" key={o.id} onClick={() => setView(o)}>
                  <Flex>
                    {o.items.slice(0, 3).map(({ p }) => (
                      <Img key={`rp-${o.id}-${p.id}`} className="thumb" src={img(p.ph, 80)} alt="" />
                    ))}
                  </Flex>
                  <Box flexGrow="1" style={{ minWidth: 0 }}>
                    <Text size="1" weight="bold" as="div">{o.date} · {o.items.length} items</Text>
                    <Text as="div" className="clamp1" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>
                      ₹{o.items.reduce((s, { p, n }) => s + p.price * n, 0).toLocaleString('en-IN')} · PO {o.id}
                    </Text>
                  </Box>
                  <Button
                    size="1" variant="soft" color="green" radius="full" style={{ fontWeight: 800, flex: 'none' }}
                    onClick={(e) => { e.stopPropagation(); repeat(o, e) }}
                  >
                    Repeat
                  </Button>
                  <ChevronRightIcon width={14} height={14} color="var(--gray-8)" style={{ flex: 'none' }} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="plp-cartwrap"><CartBar cart={cart} /></div>
      {view && (
        <PastOrderSheet key={view.id} order={view} onClose={() => setView(null)} onChange={onChange} />
      )}
    </div>
  )
}

/* ---------------- Live order status card (home, after placing) ---------------- */

const ORDER_STAGES = [['Placed', 0], ['Packed', 45], ['On the way', 150], ['Delivered', 300]]

function OrderCard({ order, onDismiss, onReorder, onAddMore }) {
  const [now, setNow] = useState(() => Date.now())
  const doneAt = order.ts + ORDER_STAGES[ORDER_STAGES.length - 1][1] * 1000
  useEffect(() => {
    if (Date.now() >= doneAt) return undefined
    const t = setInterval(() => {
      setNow(Date.now())
      if (Date.now() >= doneAt) clearInterval(t)
    }, 1000)
    return () => clearInterval(t)
  }, [doneAt])
  const [rated, setRated] = useState(order.rated || 0)
  const elapsed = Math.max(0, (now - order.ts) / 1000)
  let si = 0
  ORDER_STAGES.forEach(([, t], i) => { if (elapsed >= t) si = i })
  const nextT = ORDER_STAGES[si + 1]?.[1]
  const frac = nextT ? Math.min(1, (elapsed - ORDER_STAGES[si][1]) / (nextT - ORDER_STAGES[si][1])) : 1
  const fill = ((si + frac) / (ORDER_STAGES.length - 1)) * 100
  const delivered = si === ORDER_STAGES.length - 1
  const windowLeft = Math.max(0, 300 - Math.floor(elapsed))
  const mmss = `${Math.floor(windowLeft / 60)}:${String(windowLeft % 60).padStart(2, '0')}`
  const head = delivered ? 'Order delivered' : si === 2 ? 'Out for delivery' : si === 1 ? 'Order packed' : 'Order placed'
  const eta = delivered
    ? 'Delivered — invoice sent on email'
    : si === 2
      ? (order.promise ? `Arriving · ${order.promise}` : 'Arriving today by 6 PM')
      : si === 1 ? 'Packed at depot — rider assigning' : 'Confirmed at depot'
  const rate = (n) => {
    setRated(n)
    localStorage.setItem('qc-order', JSON.stringify({ ...order, rated: n }))
  }
  return (
    <Box px="4" pt="4">
      <div className="ocard">
        <Flex align="center" justify="between">
          <Flex align="center" gap="2">
            <span className={`oc-pulse ${delivered ? 'done' : ''}`} />
            <Text size="2" weight="bold">{head}</Text>
          </Flex>
          <Text size="1" weight="bold" color="gray">PO {order.id}</Text>
        </Flex>
        <Text size="1" color="gray" as="div" mt="1">{eta} · {order.addrLabel}</Text>
        <div className="oc-track">
          <div className="oc-line"><div style={{ width: `${fill}%` }} /></div>
          <div className="oc-steps">
            {ORDER_STAGES.map(([label], i) => (
              <div key={label} className="oc-step">
                <span className={`oc-dot ${i <= si ? 'on' : ''}`} />
                <Text style={{ fontSize: 9.5 }} color={i <= si ? undefined : 'gray'} weight={i === si ? 'bold' : 'regular'}>
                  {label}
                </Text>
              </div>
            ))}
          </div>
        </div>
        <Flex align="center" gap="2" mt="3">
          <Flex>
            {(order.items || []).slice(0, 3).map(({ p }) => (
              <Img key={`oc-${p.id}`} className="thumb" src={img(p.ph, 80)} alt="" />
            ))}
          </Flex>
          <Text size="1" weight="bold" style={{ whiteSpace: 'nowrap' }}>
            {order.count} items · ₹{order.amt.toLocaleString('en-IN')}
          </Text>
          <Text size="1" color="gray" style={{ marginLeft: 'auto', whiteSpace: 'nowrap' }}>Target at {order.tPct}%</Text>
        </Flex>
        {!delivered && windowLeft > 0 && (
          <button className="oc-window" onClick={onAddMore}>
            Forgot something? Reorder window open · {mmss} left
          </button>
        )}
        {delivered && (
          <Flex align="center" gap="2" mt="3">
            <div className="oc-stars">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} className={`oc-star ${n <= rated ? 'on' : ''}`} onClick={() => rate(n)} aria-label={`${n} stars`}>
                  <StarFilledIcon width={17} height={17} />
                </button>
              ))}
            </div>
            <Button size="1" color="green" radius="full" style={{ fontWeight: 800, marginLeft: 'auto', flex: 'none' }} onClick={onReorder}>
              Reorder
            </Button>
            <button className="reco-x" onClick={onDismiss} aria-label="Dismiss">
              <Cross2Icon width={13} height={13} />
            </button>
          </Flex>
        )}
      </div>
    </Box>
  )
}

/* ---------------- Cart page — items, schemes, address, instructions ---------------- */

function loadAddrs() {
  try {
    const s = JSON.parse(localStorage.getItem('qc-addr') || 'null')
    if (Array.isArray(s) && s.length) return s
  } catch { /* fall through to defaults */ }
  return ADDRESSES
}

function AddressSheet({ addrs, sel, onPick, onAdd, onClose }) {
  const [adding, setAdding] = useState(false)
  return (
    <div className="qsheet-overlay" onClick={onClose}>
      <div className="qsheet" onClick={(e) => e.stopPropagation()}>
        <div className="qsheet-grab" />
        <Heading size="4" style={{ letterSpacing: '-0.3px' }}>Delivery address</Heading>
        <div className="addr-list">
          {addrs.map(a => (
            <button key={a.id} className="addr-row" onClick={() => { onPick(a.id); onClose() }}>
              <span className={`radio ${a.id === sel ? 'on' : ''}`} style={{ marginTop: 2 }} />
              <span style={{ minWidth: 0 }}>
                <Text size="2" weight="bold" as="div">{a.label}</Text>
                <Text size="1" color="gray" as="div" style={{ lineHeight: 1.35 }}>{a.addr}</Text>
              </span>
            </button>
          ))}
        </div>
        {adding ? (
          <AddrFields onSave={(a) => { onAdd(a); onClose() }} />
        ) : (
          <button className="addr-add" onClick={() => setAdding(true)}>
            <PlusIcon width={14} height={14} /> Add new address
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------------- Customer estimate (PDF export) ---------------- */
/* jspdf + the DejaVu font (₹ glyph) are lazy-loaded on first export only,
   so the main bundle doesn't grow. Bill numbers are passed in from CartPage
   so the PDF can never drift from the on-screen bill. */
const fetchB64 = async (url) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`fetch ${url}: ${r.status}`)
  const b = new Uint8Array(await r.arrayBuffer())
  let s = ''
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000))
  return btoa(s)
}
/* original PNG bytes go straight into the PDF (a canvas re-encode would
   balloon palette PNGs into full RGBA); Image is only used to read dims */
const imgData = async (url) => {
  const data = url.startsWith('data:') ? url : 'data:image/png;base64,' + await fetchB64(url)
  return new Promise((resolve, reject) => {
    const im = new Image()
    im.onload = () => resolve({ data, w: im.naturalWidth, h: im.naturalHeight })
    im.onerror = () => reject(new Error(`image ${url}`))
    im.src = data
  })
}

/* dealer-editable PDF branding (Account → Estimate PDF settings) */
const EST_BRAND_DEFAULT = {
  name: 'Interior Innovation',
  logo: null, // dataURL from upload; null = bundled /brand-logo.png
  footer: '#696E74',
  side: '#696E74',
  wordmark: '#1A1C1F',
  paper: '#F8F5ED', // hairlines are derived from this so any paper tone stays coherent
  photos: true,
  validDays: 7,
}
const hexToRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '')
  if (!m) return [105, 110, 116]
  const v = parseInt(m[1], 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

async function generateEstimate({ cust, items, bill, brand = EST_BRAND_DEFAULT }) {
  // product thumbnails: square JPEGs fetched per line item; a failed fetch
  // degrades to a neutral placeholder square rather than failing the export
  const showImg = brand.photos !== false
  const thumb = (ph) => fetchB64(`https://images.unsplash.com/photo-${ph}?fit=crop&w=160&h=160&q=70&fm=jpg`)
    .then(b => 'data:image/jpeg;base64,' + b).catch(() => null)
  const [{ jsPDF }, { default: autoTable }, fontN, fontB, mark, thumbs, ...brands] = await Promise.all([
    import('jspdf'), import('jspdf-autotable'),
    fetchB64('/fonts/PJS-Regular.ttf'), fetchB64('/fonts/PJS-Bold.ttf'),
    imgData(brand.logo || '/brand-logo.png'),
    showImg ? Promise.all(items.map(({ p }) => thumb(p.ph))) : Promise.resolve([]),
    ...Object.values(BRAND_LOGOS).map(imgData),
  ])
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  doc.addFileToVFS('PJS-Regular.ttf', fontN)
  doc.addFont('PJS-Regular.ttf', 'PJS', 'normal')
  doc.addFileToVFS('PJS-Bold.ttf', fontB)
  doc.addFont('PJS-Bold.ttf', 'PJS', 'bold')

  const W = 210, H = 297, M = 14 // 14mm sides, ~6mm top
  // monochrome ink on dealer-chosen paper; hairlines derive from the paper
  // tone so any background stays coherent
  const INK = [26, 28, 31], GRAY = [105, 110, 116]
  const PAPER = hexToRgb(brand.paper || EST_BRAND_DEFAULT.paper)
  const HAIR = PAPER.map(c => Math.max(0, c - 42))
  const inr = (n) => '₹' + n.toLocaleString('en-IN')
  const no = `QE-${String(Date.now()).slice(-6)}`
  const d = new Date()
  const today = [String(d.getDate()).padStart(2, '0'), String(d.getMonth() + 1).padStart(2, '0'), d.getFullYear()].join('.')
  const paper = () => doc.setFillColor(...PAPER).rect(0, 0, W, H, 'F')
  paper()

  // ---- masthead: company wordmark left, company logo right (tight)
  const FOOT = hexToRgb(brand.footer), SIDE = hexToRgb(brand.side), WORD = hexToRgb(brand.wordmark || '#1A1C1F')
  doc.setFont('PJS', 'bold').setFontSize(brand.name.length > 14 ? 20 : 25).setTextColor(...WORD).text(brand.name, M, 13.5)
  const mw = Math.min(40, (mark.w / mark.h) * 16)
  doc.addImage(mark.data, 'PNG', W - M - mw, 6, mw, 16)

  // ---- brand strip on page 1 (keeps every page's bottom free for line items)
  doc.setFont('PJS', 'bold').setFontSize(6.5).setTextColor(...GRAY).setCharSpace(0.5)
  doc.text('AUTHORIZED DEALER FOR', M, 25)
  doc.setCharSpace(0)
  const lh = 9
  let bx = M
  for (const b of brands) {
    const dw = (b.w / b.h) * lh
    doc.addImage(b.data, 'PNG', bx, 27.5, dw, lh)
    bx += dw + 10
  }

  // ---- information columns
  doc.setFont('PJS', 'bold').setFontSize(9).setTextColor(...INK)
  doc.text('Customer Information', M, 45).text('Dealer Information', 112, 45)
  doc.setFont('PJS', 'normal').setFontSize(8.5).setTextColor(...GRAY)
  const custLines = [cust.name, cust.phone, ...(cust.site ? doc.splitTextToSize(cust.site, 80) : [])].filter(Boolean)
  doc.text(custLines, M, 51)
  doc.text([`Virag Bora — ${brand.name}`, '304 Maple Heights, HSR Layout', 'Bengaluru 560102 · +91 98450 00000'], 112, 51)

  // ---- title row between hairlines: Estimate big, number/date body-size
  const tTop = 51 + Math.max(custLines.length, 3) * 4.3 + 5
  doc.setDrawColor(...HAIR).setLineWidth(0.3).line(M, tTop, W - M, tTop)
  doc.setFont('PJS', 'bold').setFontSize(17).setTextColor(...INK).text('Estimate', M, tTop + 9.5)
  doc.setFont('PJS', 'normal').setFontSize(10).setTextColor(...GRAY)
  doc.text(no, W / 2, tTop + 9.5, { align: 'center' })
  doc.text(today, W - M, tTop + 9.5, { align: 'right' })
  doc.line(M, tTop + 14, W - M, tTop + 14)

  // ---- items table: hairline rows; photo column only when enabled
  const priceCols = showImg ? [4, 5] : [3, 4]
  autoTable(doc, {
    startY: tTop + 19,
    margin: { left: M, right: M, top: 12, bottom: 24 },
    head: [showImg
      ? ['Qty', '', 'Item no', 'Description', 'Unit price', 'Amount']
      : ['Qty', 'Item no', 'Description', 'Unit price', 'Amount']],
    body: items.map(({ p, n }) => {
      const cells = [n, p.id.toUpperCase(), `${p.name}\n${p.qty || ''}`, inr(p.price), inr(p.price * n)]
      if (showImg) cells.splice(1, 0, '')
      return cells
    }),
    theme: 'plain',
    styles: { font: 'PJS', fontSize: 8.5, textColor: INK, cellPadding: { top: 2.2, bottom: 2.2, left: 0, right: 2 }, valign: 'middle' },
    headStyles: { font: 'PJS', fontStyle: 'bold', fontSize: 8.5, textColor: INK, lineWidth: { bottom: 0.35 }, lineColor: INK },
    bodyStyles: { lineWidth: { bottom: 0.18 }, lineColor: HAIR },
    columnStyles: showImg
      ? {
        0: { cellWidth: 11 },
        1: { cellWidth: 13, minCellHeight: 12.5 },
        2: { cellWidth: 20, textColor: GRAY },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 25, halign: 'right', textColor: GRAY },
        5: { cellWidth: 27, halign: 'right' },
      }
      : {
        0: { cellWidth: 11 },
        1: { cellWidth: 20, textColor: GRAY },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 25, halign: 'right', textColor: GRAY },
        4: { cellWidth: 27, halign: 'right' },
      },
    willDrawPage: (data) => { if (data.pageNumber > 1) paper() },
    didParseCell: (data) => {
      if (data.section === 'head' && priceCols.includes(data.column.index)) data.cell.styles.halign = 'right'
    },
    didDrawCell: (data) => {
      if (!showImg || data.section !== 'body' || data.column.index !== 1) return
      const t = thumbs[data.row.index]
      const s = 9, ix = data.cell.x, iy = data.cell.y + (data.cell.height - s) / 2
      if (t) doc.addImage(t, 'JPEG', ix, iy, s, s)
      else doc.setFillColor(225, 225, 221).rect(ix, iy, s, s, 'F')
    },
  })

  // ---- totals: hairline-separated right block (same numbers as the cart bill)
  let y = doc.lastAutoTable.finalY + 8
  const rows = [
    ['Item total', inr(bill.itemTotal)],
    bill.bulkSave > 0 && ['Bulk price savings', '−' + inr(bill.bulkSave)],
    bill.schemeOff > 0 && [`Volume scheme (${bill.slabPct}%)`, '−' + inr(bill.schemeOff)],
    ['Delivery' + (bill.express ? ' (express · 1 hr)' : ''), bill.fee === 0 ? 'FREE' : inr(bill.fee)],
  ].filter(Boolean)
  const blockH = (rows.length + 1) * 7.5 + 14
  if (y + blockH > H - 24) { doc.addPage(); paper(); y = 30 }
  const tx = 118
  for (const [label, val] of rows) {
    doc.setFont('PJS', 'normal').setFontSize(8.5).setTextColor(...GRAY)
    doc.text(label, tx, y)
    doc.setTextColor(...INK).text(val, W - M, y, { align: 'right' })
    doc.setDrawColor(...HAIR).setLineWidth(0.18).line(tx, y + 2.6, W - M, y + 2.6)
    y += 7.5
  }
  doc.setFont('PJS', 'bold').setFontSize(10).setTextColor(...INK)
  doc.text('Total', tx, y)
  doc.text(inr(bill.toPay), W - M, y, { align: 'right' })
  doc.setDrawColor(...INK).setLineWidth(0.35).line(tx, y + 3, W - M, y + 3)
  doc.setFont('PJS', 'normal').setFontSize(8).setTextColor(...INK)
    .text(doc.splitTextToSize(`Please confirm this estimate within ${brand.validDays || 7} days — GST as applicable.`, W - M - tx), tx, y + 9.5)

  // ---- footer on every page: hairline + contact columns + side text
  const pages = doc.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setDrawColor(...INK).setLineWidth(0.4).line(M, H - 21, W - M, H - 21)
    doc.setFont('PJS', 'normal').setFontSize(7.5).setTextColor(...FOOT)
    doc.text(['estimates@quickcart.in', 'quickcart-nine-iota.vercel.app'], M, H - 15.5)
    doc.text(['304 Maple Heights, HSR Layout', 'Bengaluru 560102'], 72, H - 15.5)
    doc.text(['Trade prices · GST billing', '90-min site delivery'], 128, H - 15.5)
    doc.text(['GSTIN', '29AAACQ1234L1ZQ'], 176, H - 15.5)
    doc.setFontSize(6.5).setTextColor(...SIDE)
      .text(`${brand.name} · Furniture Hardware · Registered dealer — Bengaluru`, 8, H - 10, { angle: 90 })
  }

  doc.save(`${no} ${cust.name.trim()} estimate.pdf`)
}

function EstimateSheet({ items, bill, onClose }) {
  const [cust, setCust] = usePersisted('qc-est-cust', { name: '', phone: '', site: '' })
  const [brand] = usePersisted('qc-est-brand', EST_BRAND_DEFAULT)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const go = async () => {
    setBusy(true)
    setErr(null)
    try {
      await generateEstimate({ cust, items, bill, brand: { ...EST_BRAND_DEFAULT, ...brand } })
      onClose()
    } catch {
      setErr('Could not prepare the PDF. Check your connection and try again.')
      setBusy(false)
    }
  }
  const f = (k) => (e) => setCust({ ...cust, [k]: e.target.value })
  return (
    <div className="qsheet-overlay" onClick={onClose}>
      <div className="qsheet" onClick={(e) => e.stopPropagation()}>
        <div className="qsheet-grab" />
        <Heading size="4" style={{ letterSpacing: '-0.3px' }}>Customer estimate</Heading>
        <Text size="1" color="gray" as="div" mt="1">
          {items.length} item{items.length === 1 ? '' : 's'} · ₹{bill.toPay.toLocaleString('en-IN')} — exported as a branded PDF for your customer.
        </Text>
        {/* 16px font so iOS Safari doesn't zoom the sheet on focus */}
        <Flex direction="column" gap="2" mt="3">
          <input className="cp-input" style={{ fontSize: 16 }} placeholder="Customer / site name" autoComplete="name" value={cust.name} onChange={f('name')} />
          <input className="cp-input" style={{ fontSize: 16 }} type="tel" inputMode="tel" autoComplete="tel" placeholder="Phone (optional)" value={cust.phone} onChange={f('phone')} />
          <textarea className="cp-note" style={{ fontSize: 16 }} rows={2} placeholder="Site address (optional)" value={cust.site} onChange={f('site')} />
        </Flex>
        {err && <Text size="1" as="div" mt="2" style={{ color: 'var(--red-10)', fontWeight: 700 }}>{err}</Text>}
        <button className="qs-cta" style={{ justifyContent: 'center', gap: 7 }} disabled={!cust.name.trim() || busy} onClick={go}>
          <FileTextIcon width={15} height={15} /> {busy ? 'Preparing PDF…' : 'Download estimate PDF'}
        </button>
      </div>
    </div>
  )
}

function CartPage({ cart, onClose, onChange, onPlaced }) {
  const openQty = useContext(QtyCtx)
  const items = Object.values(cart.items)
  const [addrs, setAddrs] = useState(loadAddrs)
  const [sel, setSel] = useState(() => localStorage.getItem('qc-addr-sel') || loadAddrs()[0].id)
  const [addrSheet, setAddrSheet] = useState(false)
  const [estSheet, setEstSheet] = useState(false)
  const [note, setNote] = useState(() => localStorage.getItem('qc-note') || '')
  const [placed, setPlaced] = useState(null)
  const [express, setExpress] = useState(false)
  const pickAddr = (id) => { setSel(id); localStorage.setItem('qc-addr-sel', id) }
  const addAddr = (a) => {
    const next = [...addrs, a]
    setAddrs(next)
    localStorage.setItem('qc-addr', JSON.stringify(next))
    pickAddr(a.id)
  }
  const saveNote = (v) => { setNote(v); localStorage.setItem('qc-note', v) }

  const [coupon, setCoupon] = usePersisted('qc-coupon', null)
  const couponOff = coupon
    ? coupon.kind === 'pct'
      ? Math.round((cart.total * coupon.value) / 100)
      : coupon.kind === 'amt' ? Math.min(coupon.value, cart.total) : 0
    : 0
  const baseFee = coupon?.kind === 'freedel' || cart.total >= FREE_DELIVERY_AT || cart.total === 0 ? 0 : 49
  const fee = baseFee + (express ? 200 : 0)
  const credit = creditState()
  const dueTs = Date.now() + 30 * 864e5
  const dueLabel = new Date(dueTs).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const bulkSave = items.reduce((s, { p, n }) => {
    const t = bulkTier(p)
    return t && n >= t.thr ? s + (p.price - t.bp) * n : s
  }, 0)
  const mrpSave = items.reduce((s, { p, n }) => s + ((p.mrp || p.price) - p.price) * n, 0)
  // cart.total is already NET of bulk pricing (lineTotal charges the tier rate),
  // so the bill presents gross → bulk deduction → net; toPay must NOT subtract
  // bulkSave again
  const grossTotal = cart.total + bulkSave
  const slab = [...SCHEMES].reverse().find(s => cart.total >= s.min)
  const nextSlab = SCHEMES.find(s => cart.total < s.min)
  const schemeOff = slab ? Math.round((cart.total * slab.off) / 100) : 0
  const toPay = Math.max(0, cart.total - schemeOff - couponOff + fee)
  const saving = mrpSave + bulkSave + schemeOff + couponOff
  const addr = addrs.find(a => a.id === sel) || addrs[0]
  const deals = applyF(DEALS, { ...DEFAULT_F, sort: 3 }, 'ALL').filter(d => !cart.items[d.id]).slice(0, 6)
  const tPct = Math.min(100, Math.round(((TARGETS.monthly.done + cart.total) / TARGETS.monthly.target) * 100))

  return (
    <div className="cartpage">
      <div className="pdp-head">
        <button className="sheet-back" onClick={onClose} aria-label="Back"><ArrowLeftIcon /></button>
        <Heading size="4" style={{ flex: 1, letterSpacing: '-0.3px' }}>Your cart</Heading>
        <Text size="1" weight="bold" color="gray">{cart.count} item{cart.count === 1 ? '' : 's'}</Text>
        {items.length > 0 && (
          <button className="est-btn" onClick={() => setEstSheet(true)} aria-label="Download estimate PDF">
            <FileTextIcon width={13} height={13} /> Estimate
          </button>
        )}
      </div>
      <div className="cp-body">
        {items.length === 0 ? (
          <Box p="6" style={{ textAlign: 'center' }}>
            <Text size="2" color="gray" as="div">Your cart is empty — add products to get rolling</Text>
            <Button mt="3" size="2" color="green" radius="full" style={{ fontWeight: 800 }} onClick={onClose}>
              Browse products
            </Button>
          </Box>
        ) : (
          <>
            {saving > 0 && (
              <div className="cp-save">
                <StarFilledIcon width={13} height={13} style={{ flex: 'none' }} />
                You're saving ₹{saving.toLocaleString('en-IN')} on this order
              </div>
            )}

            <div className="cp-card">
              {items.map(({ p, n }) => {
                const t = bulkTier(p)
                const bulkOn = t && n >= t.thr
                return (
                  <div key={p.id}>
                    <SwipeRow onRemove={() => onChange(-n, p)}>
                    <div className="cs-row">
                      <Img src={img(p.ph, 120)} alt="" />
                      <Box flexGrow="1" style={{ minWidth: 0 }}>
                        <Text size="1" weight="bold" as="div" className="clamp2" style={{ lineHeight: 1.3 }}>{p.name}</Text>
                        <Text as="div" style={{ fontSize: 10.5, color: bulkOn ? 'var(--green-11)' : 'var(--gray-10)', fontWeight: bulkOn ? 700 : 500 }}>
                          ₹{unitPriceFor(p, n).toLocaleString('en-IN')}
                          {bulkOn && <s style={{ color: 'var(--gray-9)', marginLeft: 5 }}> ₹{p.price.toLocaleString('en-IN')}</s>}
                          {bulkOn ? ` · ${t.pct}% bulk applied` : ''}
                        </Text>
                      </Box>
                      <div className="cs-step">
                        <button onClick={() => onChange(-1, p)} aria-label="Less"><MinusIcon width={12} height={12} /></button>
                        <Text key={n} className="numpop" size="1" weight="bold" style={{ width: 26, textAlign: 'center', color: '#fff' }}>{n}</Text>
                        <button onClick={() => onChange(1, p, { noReco: true })} aria-label="More"><PlusIcon width={12} height={12} /></button>
                      </div>
                      <Text size="1" weight="bold" style={{ minWidth: 60, textAlign: 'right', flex: 'none', whiteSpace: 'nowrap' }}>₹{lineTotal(p, n).toLocaleString('en-IN')}</Text>
                    </div>
                    </SwipeRow>
                    {t && !bulkOn && (
                      <button className="cs-nudge" onClick={() => onChange(t.thr - n, p, { noReco: true })}>
                        Add {t.thr - n} more → {t.pct}% off this item
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {deals.length > 0 && (
              <div className="cp-card cp-flash">
                <Flex align="center" justify="between">
                  <Text size="2" weight="bold" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <LightningBoltIcon width={14} height={14} color="#FFD43B" /> Flash deals before you checkout
                  </Text>
                  <DealTimer />
                </Flex>
                <div className="cp-deals">
                  {deals.map(d => (
                    <div key={`cpd-${d.id}`} className="cp-deal">
                      <div style={{ position: 'relative' }}>
                        <Img src={img(d.ph, 160)} alt="" />
                        {d.mrp && <span className="flash-off" style={{ top: 4, left: 4 }}>-{Math.round(((d.mrp - d.price) / d.mrp) * 100)}%</span>}
                      </div>
                      <Text as="div" weight="bold" className="clamp2" style={{ fontSize: 10.5, lineHeight: 1.25, height: 27, marginTop: 4 }}>{d.name}</Text>
                      <Flex align="center" justify="between" mt="1">
                        <Text size="1" weight="bold">₹{d.price.toLocaleString('en-IN')}</Text>
                        <Button
                          size="1" color="green" radius="full" style={{ fontWeight: 800, height: 22, padding: '0 10px' }}
                          onClick={() => openQty && openQty(d, null, { noReco: true })}
                        >
                          ADD
                        </Button>
                      </Flex>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="cp-card cp-scheme">
              <Text size="1" weight="bold" as="div" style={{ color: 'var(--violet-11)', letterSpacing: '.5px', fontSize: 10.5 }}>
                VOLUME SCHEME
              </Text>
              {nextSlab ? (
                <>
                  <Text size="2" weight="bold" as="div" mt="1">
                    Add ₹{(nextSlab.min - cart.total).toLocaleString('en-IN')} more → {nextSlab.off}% off the entire invoice
                  </Text>
                  <div className="qs-mbar" style={{ marginTop: 8 }}>
                    <div style={{ width: `${Math.min(100, (cart.total / nextSlab.min) * 100)}%` }} />
                  </div>
                  {slab && (
                    <Text size="1" as="div" mt="1" style={{ color: 'var(--violet-11)', fontWeight: 700 }}>
                      {slab.off}% scheme active — saving ₹{schemeOff.toLocaleString('en-IN')}
                    </Text>
                  )}
                </>
              ) : (
                <Text size="2" weight="bold" as="div" mt="1" style={{ color: 'var(--violet-11)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckIcon width={14} height={14} style={{ flex: 'none' }} />
                  Top slab unlocked · {slab.off}% off the entire invoice — ₹{schemeOff.toLocaleString('en-IN')} saved
                </Text>
              )}
              <Text size="1" color="gray" as="div" mt="1">
                This order takes your monthly target to {tPct}%
              </Text>
            </div>

            <div className="cp-card">
              <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
                DELIVERY SPEED
              </Text>
              <button className="dlv-row" onClick={() => setExpress(false)}>
                <span className={`radio ${!express ? 'on' : ''}`} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <Text size="2" weight="bold" as="div">Standard · today by 6 PM</Text>
                  <Text size="1" color="gray" as="div">FREE above ₹{FREE_DELIVERY_AT}</Text>
                </span>
                <Text size="1" weight="bold" style={baseFee === 0 ? { color: 'var(--green-10)' } : undefined}>
                  {baseFee === 0 ? 'FREE' : `₹${baseFee}`}
                </Text>
              </button>
              <button className={`dlv-row express ${express ? 'sel' : ''}`} onClick={() => setExpress(true)}>
                <span className={`radio ${express ? 'on' : ''}`} />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <Text size="2" weight="bold" as="div" style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <LightningBoltIcon width={13} height={13} color="var(--amber-9)" style={{ flex: 'none' }} />
                    Express · at your shop in 1 hour <span className="fast-tag">FASTEST</span>
                  </Text>
                  <Text size="1" color="gray" as="div">Rush dispatch from the nearest depot</Text>
                </span>
                <Text size="1" weight="bold">+₹200</Text>
              </button>
            </div>

            <div className="cp-card">
              <Flex align="center" justify="between" gap="3">
                <Box style={{ minWidth: 0 }}>
                  <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
                    DELIVER TO · {addr.label.toUpperCase()}
                  </Text>
                  <Text size="1" as="div" mt="1" style={{ lineHeight: 1.4 }}>{addr.addr}</Text>
                </Box>
                <Button
                  size="1" variant="soft" color="green" radius="full" style={{ fontWeight: 800, flex: 'none' }}
                  onClick={() => setAddrSheet(true)}
                >
                  Change
                </Button>
              </Flex>
            </div>

            <div className="cp-card">
              <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
                SPECIAL INSTRUCTIONS
              </Text>
              <textarea
                className="cp-note" rows={2}
                value={note} onChange={(e) => saveNote(e.target.value)}
              />
            </div>

            <div className="cp-card">
              <Flex align="center" justify="between">
                <Text size="1" weight="bold" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
                  PAYMENT
                </Text>
                <span className="st-chip ok">30-DAY CREDIT</span>
              </Flex>
              <Text size="2" weight="bold" as="div" mt="2">
                ₹{toPay.toLocaleString('en-IN')} on credit · due {dueLabel}
              </Text>
              <Text size="1" color="gray" as="div" mt="1">
                Interest-free · ₹{Math.max(0, credit.limit - credit.outstanding - toPay).toLocaleString('en-IN')} credit left after this order
              </Text>
            </div>

            <div className="cp-card">
              <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', letterSpacing: '.5px', fontSize: 10.5 }}>
                BILL DETAILS
              </Text>
              <Flex justify="between" mt="2"><Text size="1" color="gray">Item total</Text><Text size="1" weight="bold">₹{grossTotal.toLocaleString('en-IN')}</Text></Flex>
              {bulkSave > 0 && (
                <Flex justify="between" mt="1">
                  <Text size="1" style={{ color: 'var(--green-11)' }}>Bulk price savings</Text>
                  <Text size="1" weight="bold" style={{ color: 'var(--green-11)' }}>−₹{bulkSave.toLocaleString('en-IN')}</Text>
                </Flex>
              )}
              {schemeOff > 0 && (
                <Flex justify="between" mt="1">
                  <Text size="1" style={{ color: 'var(--green-11)' }}>Volume scheme ({slab.off}%)</Text>
                  <Text size="1" weight="bold" style={{ color: 'var(--green-11)' }}>−₹{schemeOff.toLocaleString('en-IN')}</Text>
                </Flex>
              )}
              {couponOff > 0 && coupon && (
                <Flex justify="between" mt="1" align="center">
                  <Flex align="center" gap="1">
                    <Text size="1" style={{ color: 'var(--green-11)' }}>Coupon · {coupon.label}</Text>
                    <button className="reco-x" style={{ width: 18, height: 18 }} onClick={() => setCoupon(null)} aria-label="Remove coupon">
                      <Cross2Icon width={10} height={10} />
                    </button>
                  </Flex>
                  <Text size="1" weight="bold" style={{ color: 'var(--green-11)' }}>−₹{couponOff.toLocaleString('en-IN')}</Text>
                </Flex>
              )}
              <Flex justify="between" mt="1">
                <Text size="1" color="gray">Delivery{coupon?.kind === 'freedel' ? ' · coupon applied' : ''}</Text>
                <Text size="1" weight="bold" style={baseFee === 0 ? { color: 'var(--green-10)' } : undefined}>{baseFee === 0 ? 'FREE' : `₹${baseFee}`}</Text>
              </Flex>
              {express && (
                <Flex justify="between" mt="1">
                  <Text size="1" color="gray">Express 1-hour delivery</Text>
                  <Text size="1" weight="bold">+₹200</Text>
                </Flex>
              )}
              {baseFee > 0 && (
                <Text size="1" as="div" mt="1" style={{ color: 'var(--amber-11)', fontWeight: 700 }}>
                  Add ₹{(FREE_DELIVERY_AT - cart.total).toLocaleString('en-IN')} more for FREE standard delivery
                </Text>
              )}
              <div className="cp-divider" />
              <Flex justify="between"><Text size="2" weight="bold">To pay</Text><Text size="2" weight="bold">₹{toPay.toLocaleString('en-IN')}</Text></Flex>
              <Text size="1" as="div" mt="1" color="gray">
                Includes GST (18%) ₹{(toPay - Math.round(toPay / 1.18)).toLocaleString('en-IN')} · input credit on invoice
              </Text>
              {mrpSave > 0 && (
                <Text size="1" as="div" mt="1" color="gray">Plus ₹{mrpSave.toLocaleString('en-IN')} below MRP on these items</Text>
              )}
            </div>

            <button
              className="qs-cta ghost" style={{ marginTop: 0, justifyContent: 'center', gap: 7 }}
              onClick={() => setEstSheet(true)}
            >
              <FileTextIcon width={14} height={14} /> Download estimate for customer
            </button>
          </>
        )}
      </div>
      {items.length > 0 && (
        <div className="pdp-cta">
          <Box style={{ flex: 'none' }}>
            <Text size="3" weight="bold" as="div">₹{toPay.toLocaleString('en-IN')}</Text>
            <Text size="1" color="gray" as="div">
              {addr.label} · {express ? 'Express · 1 hr' : baseFee === 0 ? 'FREE delivery' : `+₹${baseFee} delivery`}
            </Text>
          </Box>
          <button
            className="qs-cta" style={{ marginTop: 0, flex: 1, justifyContent: 'center' }}
            onClick={(e) => {
              sparkle(e)
              setPlaced({
                id: `QC-${String(Date.now()).slice(-6)}`,
                amt: toPay, count: cart.count, ts: Date.now(), express,
                addrLabel: addr.label, addr: addr.addr, tPct,
                payMode: '30-day credit', dueTs,
                promise: express ? 'Express · ~1 hr' : 'Today by 6 PM',
                bill: {
                  itemTotal: cart.total, bulkSave, schemeOff,
                  coupon: coupon && couponOff > 0 ? { label: coupon.label, off: couponOff } : null,
                  freeDelCoupon: coupon?.kind === 'freedel' || false,
                  deliveryFee: baseFee, expressFee: express ? 200 : 0, toPay,
                },
                items: Object.values(cart.items).map(({ p, n }) => ({
                  p: { id: p.id, ph: p.ph, name: p.name, price: p.price, mrp: p.mrp, bulk: p.bulk },
                  n, unit: unitPriceFor(p, n),
                })),
              })
              if (coupon) setCoupon(null) // consumed by this order
            }}
          >
            Place order
          </button>
        </div>
      )}
      {addrSheet && (
        <AddressSheet addrs={addrs} sel={sel} onPick={pickAddr} onAdd={addAddr} onClose={() => setAddrSheet(false)} />
      )}
      {estSheet && (
        <EstimateSheet
          items={items}
          bill={{ itemTotal: grossTotal, bulkSave, schemeOff, slabPct: slab ? slab.off : 0, fee, express, toPay }}
          onClose={() => setEstSheet(false)}
        />
      )}
      {placed && (
        <div className="order-done">
          <div className="od-card">
            <div className="od-tick">✓</div>
            <Heading size="5" mt="3" style={{ letterSpacing: '-0.3px' }}>Order placed!</Heading>
            <Text size="2" color="gray" as="div" mt="1">PO {placed.id} · ₹{placed.amt.toLocaleString('en-IN')}</Text>
            <Text size="1" weight="bold" as="div" mt="1" style={{ color: 'var(--green-11)' }}>
              On 30-day credit · due {new Date(placed.dueTs).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </Text>
            <Text size="1" color="gray" as="div" mt="1">Invoice & dispatch details on WhatsApp + email</Text>
            <Button mt="4" size="3" color="green" radius="full" style={{ fontWeight: 800, width: '100%' }} onClick={() => onPlaced(placed)}>
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------- Product details page ---------------- */

let PDP_DIR = 0 // swipe direction handoff to the next ProductPage mount (slide-in side)
const PDP_SWAPF = { current: false } // product switched while the page was already open

function ProductPage({ p, onClose, onChange, cart }) {
  const openQty = useContext(QtyCtx)
  const openPdp = useContext(PdpCtx)
  const openCart = useContext(CartCtx)
  const added = useContext(CartItemsCtx)[p.id]?.n || 0
  const [listSheet, setListSheet] = useState(false)
  // Zara-style gestures: horizontal swipe anywhere on the page moves to the
  // prev/next product in this range; vertical swipe (or tap) on the photo
  // cycles through photo crops. touch-action: pan-x on the hero hands
  // vertical drags there to us instead of the page scroll.
  const [shot, setShot] = useState(0)
  const shots = useMemo(() => [
    img(p.ph, 720),
    `${img(p.ph, 720)}&h=720&crop=entropy`,
    `${img(p.ph, 720)}&h=900&crop=edges`,
  ], [p])
  const sibs = useMemo(() => {
    const c = catOf(p)
    const list = FEED_POOL.filter(x => catOf(x) === c)
    return list.length > 1 ? list : FEED_POOL
  }, [p])
  const sibNext = (dir) => {
    const i = sibs.findIndex(x => x.id === p.id)
    const next = sibs[(i + dir + sibs.length) % sibs.length]
    return next && next.id !== p.id ? next : null
  }
  const rootRef = useRef(null)
  const [enter] = useState(() => {
    const d = PDP_DIR
    PDP_DIR = 0
    const sw = PDP_SWAPF.current
    PDP_SWAPF.current = false
    return d === 1 ? 'pdp-in-r' : d === -1 ? 'pdp-in-l' : sw ? 'pdp-swap' : ''
  })
  const touch = useRef(null)
  const onTouchStart = (e) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, axis: null }
  }
  // the page follows the finger (damped) during a horizontal drag — attached
  // non-passive so preventDefault can freeze vertical scroll while the gesture
  // is horizontal (otherwise the page bobs up and down during the swipe)
  const bodyRef = useRef(null)
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const onMove = (e) => {
      const t = touch.current
      if (!t) return
      const dx = e.touches[0].clientX - t.x
      const dy = e.touches[0].clientY - t.y
      if (!t.axis) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        t.axis = Math.abs(dx) > 1.2 * Math.abs(dy) ? 'h' : 'v'
      }
      if (t.axis !== 'h') return
      e.preventDefault()
      const r = rootRef.current
      if (r) {
        r.style.transition = 'none'
        r.style.transform = `translateX(${dx * 0.4}px)`
        r.style.opacity = String(Math.max(0.65, 1 - Math.abs(dx) / 700))
      }
    }
    el.addEventListener('touchmove', onMove, { passive: false })
    return () => el.removeEventListener('touchmove', onMove)
  }, [])
  const settleBack = () => {
    const el = rootRef.current
    if (!el) return
    el.style.transition = 'transform .3s cubic-bezier(.22, 1, .36, 1), opacity .3s ease'
    el.style.transform = 'translateX(0)'
    el.style.opacity = '1'
  }
  const onTouchEnd = (e) => {
    const t = touch.current
    touch.current = null
    if (!t) return
    const dx = e.changedTouches[0].clientX - t.x
    const next = t.axis === 'h' && Math.abs(dx) > 70 ? sibNext(dx < 0 ? 1 : -1) : null
    if (next && openPdp) {
      const dir = dx < 0 ? 1 : -1
      const el = rootRef.current
      if (el) {
        el.style.transition = 'transform .16s ease-in, opacity .16s ease-in'
        el.style.transform = `translateX(${dir === 1 ? '-64px' : '64px'})`
        el.style.opacity = '0'
        setTimeout(() => { PDP_DIR = dir; openPdp(next) }, 140)
      } else { PDP_DIR = dir; openPdp(next) }
    } else settleBack()
  }
  const onTouchCancel = settleBack
  const onHeroEnd = (e) => {
    const t = touch.current
    if (!t || t.axis === 'h') return
    const dx = e.changedTouches[0].clientX - t.x
    const dy = e.changedTouches[0].clientY - t.y
    if (Math.abs(dy) > 45 && Math.abs(dy) > 1.5 * Math.abs(dx)) {
      e.stopPropagation()
      touch.current = null
      setShot(s => (s + (dy < 0 ? 1 : -1) + shots.length) % shots.length)
    }
  }
  const recos = useMemo(() => recosFor(p), [p])
  // size variants: lengths available in this range, linking sibling products
  const sizes = useMemo(() => {
    if (!p.size) return []
    const map = new Map()
    FEED_POOL.filter(x => x.size && catOf(x) === catOf(p))
      .sort((a, b) => a.size - b.size)
      .forEach(x => { if (!map.has(x.size)) map.set(x.size, x) })
    if (map.has(p.size)) map.set(p.size, p)
    return [...map.entries()]
  }, [p])
  const club = recos[0]
  // 3×3 recommendations: same-range first, padded from the pool
  const more = useMemo(() => {
    const list = recos.slice(1)
    for (const x of FEED_POOL) {
      if (list.length >= 9) break
      if (x.id !== p.id && (!club || x.id !== club.id) && !list.some(y => y.id === x.id)) list.push(x)
    }
    return list.slice(0, 9)
  }, [recos, p, club])
  const tier = bulkTier(p)
  const off = p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0
  const oos = p.stock === 0
  const specs = [
    ['Brand', BRAND_NAMES[p.brand] || p.brand],
    p.mat && ['Material / finish', p.mat],
    p.load && ['Load capacity', `${p.load} kg`],
    p.size && ['Size', `${p.size} mm`],
    p.qty && ['Pack contents', p.qty],
    p.bulk && ['Bulk pricing', p.bulk],
    ['Item code', p.id.toUpperCase()],
    [oos ? 'Lead time' : 'Availability', oos ? `Ships in ${p.lead} days` : `In stock · ${p.stock}+ pcs`],
  ].filter(Boolean)
  return (
    <>
    <div className="pdp-back" />
    <div ref={rootRef} className={`pdp ${enter}`}>
      <div className="pdp-head">
        <button className="sheet-back" onClick={onClose} aria-label="Back"><ArrowLeftIcon /></button>
        <Text size="3" weight="bold" style={{ flex: 1, minWidth: 0, letterSpacing: '-0.2px' }} truncate>Product details</Text>
        <button className="sheet-back" style={{ width: 36, height: 36 }} onClick={() => setListSheet(true)} aria-label="Save to list">
          <BookmarkIcon width={16} height={16} />
        </button>
        {BRAND_LOGOS[p.brand] && <img src={BRAND_LOGOS[p.brand]} alt={p.brand} style={{ height: 16, flex: 'none' }} />}
      </div>
      <div ref={bodyRef} className="pdp-body" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={onTouchCancel}>
        <div className="pdp-hero" onTouchEnd={onHeroEnd} onClick={() => setShot(s => (s + 1) % shots.length)}>
          {shots.map((s, i) => (
            <Img key={i} src={s} alt={p.name} className={`pdp-shot ${i === shot ? 'cur' : ''}`} />
          ))}
          {(p.tag || off > 0) && <span className="pbadge" style={{ top: 14, left: 14 }}>{p.tag || `${off}% OFF`}</span>}
          <div className="pdp-dots">
            {shots.map((_, i) => <span key={i} className={i === shot ? 'on' : ''} />)}
          </div>
          <span className="pdp-shotn">{shot + 1}/{shots.length}</span>
        </div>
        <Box px="4" pt="4">
          <Heading size="5" style={{ letterSpacing: '-0.3px', lineHeight: 1.25 }}>{p.name}</Heading>
          {p.qty && <Text size="2" color="gray" as="div" mt="1">{p.qty}</Text>}
          {(p.rating || p.buys) && (
            <Flex align="center" gap="3" mt="2">
              {p.rating && <span className="pdp-rate"><StarFilledIcon width={11} height={11} /> {p.rating}</span>}
              {p.buys && (
                <Flex align="center" gap="1">
                  <LightningBoltIcon width={11} height={11} color="var(--amber-11)" />
                  <Text size="1" weight="bold">{p.buys}</Text>
                </Flex>
              )}
            </Flex>
          )}
          {p.stock != null && (
            <Text size="1" as="div" mt="2" weight="bold" style={{
              color: oos ? 'var(--red-10)' : p.stock <= 10 ? 'var(--amber-11)' : 'var(--green-10)',
            }}>
              {oos
                ? `Out of stock · ships in ${p.lead} days`
                : p.stock <= 10 ? `Only ${p.stock} left` : `In stock · ${p.stock}+ pcs · same-day dispatch`}
            </Text>
          )}
          <Flex align="center" gap="2" mt="3">
            <Text weight="bold" style={{ fontSize: 24, letterSpacing: '-0.4px' }}>₹{p.price.toLocaleString('en-IN')}</Text>
            {p.mrp && <Text size="2" color="gray" style={{ textDecoration: 'line-through' }}>₹{p.mrp.toLocaleString('en-IN')}</Text>}
            {off > 0 && <span className="off-pill">{off}% OFF</span>}
            {off === 0 && !tier && <span className="st-chip ok">DEALER PRICE</span>}
          </Flex>
          <Text size="1" color="gray" as="div" mt="1">GST included · input credit itemised on your invoice</Text>
          {sizes.length > 1 && (
            <Box mt="3">
              <Text size="1" weight="bold" as="div" style={{ color: 'var(--gray-10)', fontSize: 10.5, letterSpacing: '.5px' }}>
                AVAILABLE LENGTHS · THIS RANGE
              </Text>
              <Flex gap="2" mt="1">
                {sizes.map(([sz, prod]) => (
                  <button
                    key={sz} className={`size-chip ${sz === p.size ? 'on' : ''}`}
                    onClick={() => { if (sz !== p.size && openPdp) openPdp(prod) }}
                  >
                    {sz} mm
                  </button>
                ))}
              </Flex>
            </Box>
          )}
          {tier && (
            <div className="bulk-box">
              <div className="bulk-row">
                <Text size="1" weight="bold" style={{ color: 'var(--green-11)', fontSize: 10.5, letterSpacing: '.5px' }}>
                  DEALER BULK PRICING
                </Text>
                <Text size="1" color="gray">per pc / set</Text>
              </div>
              <div className="bulk-row">
                <Text size="2">1–{tier.thr - 1} pcs</Text>
                <Text size="2" weight="bold">₹{p.price.toLocaleString('en-IN')}</Text>
              </div>
              <div className="bulk-row hot">
                <Flex align="center" gap="2">
                  <Text size="2" weight="bold">{tier.thr}+ pcs</Text>
                  <span className="off-pill">{tier.pct}% OFF</span>
                </Flex>
                <Text size="2" weight="bold" style={{ color: 'var(--green-11)' }}>₹{tier.bp.toLocaleString('en-IN')}</Text>
              </div>
            </div>
          )}
        </Box>

        {club && (
          <Box px="4" pt="5">
            <SectionHead title="Buy it with" sub="Dealers usually club these together" />
            <div className="club">
              <Img src={img(p.ph, 160)} alt="" />
              <div className="club-plus"><PlusIcon width={14} height={14} /></div>
              <Img src={img(club.ph, 160)} alt={club.name} />
              <Box flexGrow="1" style={{ minWidth: 0 }}>
                <Text size="1" weight="bold" as="div" className="clamp2" style={{ lineHeight: 1.3 }}>{club.name}</Text>
                <Text size="2" weight="bold" as="div" mt="1">
                  ₹{(p.price + club.price).toLocaleString('en-IN')} <Text size="1" color="gray" weight="medium">for both</Text>
                </Text>
                <Button
                  size="1" color="green" radius="full" mt="2" style={{ fontWeight: 800 }}
                  onClick={(e) => {
                    onChange(1, p, { noReco: true }); onChange(1, club, { noReco: true })
                    sparkle(e)
                  }}
                >
                  Add both
                </Button>
              </Box>
            </div>
          </Box>
        )}

        <Box px="4" pt="5">
          <SectionHead title="Specifications" />
          <div className="spec-card">
            {specs.map(([k, v]) => (
              <div className="spec-row" key={k}>
                <Text size="2" color="gray" style={{ flex: 'none' }}>{k}</Text>
                <Text size="2" weight="bold" style={{ textAlign: 'right', minWidth: 0 }}>{v}</Text>
              </div>
            ))}
          </div>
        </Box>

        {more.length > 0 && (
          <Box pt="5" pb="4">
            <SectionHead title="You may also like" sub="More from this range" />
            <div className="pdp-grid">
              {more.map(x => <ProductCard key={`pd-${x.id}`} p={x} grid onChange={onChange} />)}
            </div>
          </Box>
        )}
      </div>
      <div className="pdp-cta">
        {added > 0 ? (
          <>
            <button
              className="qs-cta ghost" style={{ marginTop: 0, flex: 1, justifyContent: 'center' }}
              onClick={() => openQty && openQty(p)}
            >
              Add more
            </button>
            <button
              className="qs-cta" style={{ marginTop: 0, flex: 1.35, justifyContent: 'space-between' }}
              onClick={() => openCart && openCart()}
            >
              <span>Go to cart</span>
              <span className="cta-count">{cart ? cart.count : added}</span>
            </button>
          </>
        ) : (
          <>
            <Box style={{ minWidth: 0, flex: 'none' }}>
              <Text size="3" weight="bold" as="div">₹{p.price.toLocaleString('en-IN')}</Text>
              <Text size="1" color="gray" as="div" truncate>
                {p.mrp ? `MRP ₹${p.mrp.toLocaleString('en-IN')}` : 'per unit'}
              </Text>
            </Box>
            <button
              className="qs-cta" style={{ marginTop: 0, flex: 1, justifyContent: 'center' }}
              onClick={() => openQty && openQty(p)}
            >
              Add to cart
            </button>
          </>
        )}
      </div>
      {listSheet && <ListSheet p={p} onClose={() => setListSheet(false)} />}
    </div>
    </>
  )
}

export default function App() {
  const [cartItems, setCartItems] = useState({})
  // derived view keeps every existing consumer signature intact
  const cart = useMemo(() => {
    let count = 0
    let total = 0
    const photos = []
    Object.values(cartItems).forEach(({ p, n }) => {
      count += n
      total += lineTotal(p, n)
      if (!photos.includes(p.ph)) photos.push(p.ph)
    })
    return { items: cartItems, count, total, photos }
  }, [cartItems])
  // #compact hash forces the scrolled header state (handy for design review)
  const [scrolled, setScrolled] = useState(window.location.hash === '#compact')
  const [quizOpen, setQuizOpen] = useState(false)
  const [wheelOpen, setWheelOpen] = useState(window.location.hash === '#wheel')
  const [glow, setGlow] = useState(null)
  const playedRef = useRef(localStorage.getItem('qc-quiz-day') === DAY)
  const markPlayed = () => {
    playedRef.current = true
    localStorage.setItem('qc-quiz-day', DAY)
  }
  const fetchedSky = useSkyTheme()
  const [sim, setSim] = useState(null)
  const [simSkin, setSimSkin] = useState(null)
  const simEnabled = window.location.hash === '#sim'
  const heroVariant = window.location.hash === '#hero-classic' ? 'classic' : 'fest'
  // fest grid layout rotates per open: a classic · b mirrored
  const [festL] = useState(() => {
    const m = window.location.hash.match(/^#fest-([a-e])$/)
    if (m) return m[1]
    const L = ['a', 'b']
    const i = (Number(localStorage.getItem('qc-fest-idx') || -1) + 1) % L.length
    localStorage.setItem('qc-fest-idx', String(i))
    return L[i]
  })
  const [heroPal, setHeroPal] = useState(() => {
    const m = window.location.hash.match(/^#hero-(\w+)$/)
    const hit = m && HERO_PALETTES.find(p => p.name.toLowerCase() === m[1].toLowerCase())
    if (hit) return hit
    // rotate through palette combinations on every app open (until client finalizes one)
    const idx = (Number(localStorage.getItem('qc-hero-idx') || -1) + 1) % HERO_PALETTES.length
    localStorage.setItem('qc-hero-idx', String(idx))
    return HERO_PALETTES[idx]
  })
  const sky = sim ?? fetchedSky
  // Campaign takeover ONLY when explicitly scheduled (hash preview / future campaign flag).
  // Default is always weather + time of day — consistent across opens.
  const campaign = useMemo(() => {
    const m = window.location.hash.match(/^#campaign-(\d)$/)
    return m && CAMPAIGN_HEADERS[+m[1]] ? CAMPAIGN_HEADERS[+m[1]] : null
  }, [])
  const T = useMemo(() => (heroVariant === 'fest'
    ? { ...heroPal }
    : ((campaign && !sim) ? campaign : SKY[sky.dp][sky.cond])), [heroVariant, heroPal, campaign, sim, sky])
  // Quiz edition rotates daily, independent of weather — novelty is the hook
  const quizSkin = simSkin ?? QUIZ_SKINS[Math.floor(Date.now() / 86400000) % QUIZ_SKINS.length]

  // Brand tab filtering + search/listing sheet (#brand-<key> hash for design review)
  const [brand, setBrand] = useState(() => {
    const m = window.location.hash.match(/#brand-(\w+)/)
    return m && BRAND_KEYS.includes(m[1]) ? m[1] : 'ALL'
  })
  const [sheet, setSheet] = useState(() =>
    window.location.hash === '#search' ? { items: FEED_POOL } : null)
  const [pdp, setPdp] = useState(() => (window.location.hash === '#pdp' ? FEED_POOL[0] : null))
  const [qsheet, setQsheet] = useState(() => (window.location.hash === '#qty' ? { p: BUY_AGAIN[0] } : null))
  const [cartOpen, setCartOpen] = useState(window.location.hash === '#cart')
  const [reorderOpen, setReorderOpen] = useState(['#reorder', '#pastorder'].includes(window.location.hash))
  const [acctOpen, setAcctOpen] = useState(['#account', '#dash', '#credit', '#lists', '#orders', '#site', '#ordpg', '#claims', '#brand'].includes(window.location.hash))
  const acctSubRef = useRef(false)
  const acctInitSub = useRef(null)
  const [authed, setAuthed] = useState(() => {
    if (window.location.hash === '#login') return false
    if (window.location.hash) return true
    return localStorage.getItem('qc-auth') === '1'
  })
  const [order, setOrder] = useState(() => {
    if (window.location.hash === '#order') {
      return {
        id: 'QC-482913', amt: 5240, count: 14, ts: Date.now() - 100000, express: false,
        addrLabel: 'Shop', tPct: 65,
        items: [{ p: BUY_AGAIN[0], n: 12 }, { p: DEALS[0], n: 2 }],
      }
    }
    try { return JSON.parse(localStorage.getItem('qc-order') || 'null') } catch { return null }
  })
  const dismissOrder = () => { setOrder(null); localStorage.removeItem('qc-order') }
  const reorder = () => {
    order?.items?.forEach(({ p, n }) => changeCart(n, p, { noReco: true }))
    setCartOpen(true)
  }
  const [plp, setPlp] = useState(() => {
    if (window.location.hash.startsWith('#fsheet')) return 'Hinges'
    if (window.location.hash === '#strip') return 'All'
    const m = window.location.hash.match(/^#plp(?:-(\w+))?$/)
    if (!m) return null
    return m[1] && CAT_RULES[m[1]] ? m[1] : 'All'
  })
  const bf = (items) => (brand === 'ALL' ? items : items.filter(p => p.brand === brand))
  const pool = useMemo(
    () => (brand === 'ALL' ? FEED_POOL : FEED_POOL.filter(p => p.brand === brand)),
    [brand],
  )
  const openCategory = (label) => setPlp(label)

  // Browser/phone back gesture closes the topmost overlay instead of leaving the app.
  // UI close buttons route THROUGH history.back() so the entry stack stays consistent.
  const sheetRef = useRef(sheet)
  sheetRef.current = sheet
  const pdpRef = useRef(pdp)
  pdpRef.current = pdp
  const qtyRef = useRef(qsheet)
  qtyRef.current = qsheet
  const cartRef = useRef(cartOpen)
  cartRef.current = cartOpen
  const reorderRef = useRef(reorderOpen)
  reorderRef.current = reorderOpen
  const acctRef = useRef(acctOpen)
  acctRef.current = acctOpen
  const plpOpen = plp !== null
  const closePlp = () => {
    if (window.history.state?.qcPlp) window.history.back()
    else setPlp(null)
  }
  useEffect(() => {
    if (!plpOpen) return
    if (!window.history.state?.qcPlp) window.history.pushState({ qcPlp: true }, '')
    const onPop = () => { if (!sheetRef.current && !pdpRef.current && !qtyRef.current && !cartRef.current && !reorderRef.current) setPlp(null) }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [plpOpen])
  const sheetOpen = sheet !== null
  const closeSheet = () => {
    if (window.history.state?.qcSheet) window.history.back()
    else setSheet(null)
  }
  useEffect(() => {
    if (!sheetOpen) return
    if (!window.history.state?.qcSheet) window.history.pushState({ qcSheet: true }, '')
    const onPop = () => { if (!pdpRef.current && !qtyRef.current && !cartRef.current) setSheet(null) }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [sheetOpen])
  const pdpOpen = pdp !== null
  const closePdp = () => {
    if (window.history.state?.qcPdp) window.history.back()
    else setPdp(null)
  }
  useEffect(() => {
    if (!pdpOpen) return
    if (!window.history.state?.qcPdp) window.history.pushState({ qcPdp: true }, '')
    const onPop = () => { if (!qtyRef.current && !cartRef.current) setPdp(null) }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [pdpOpen])
  const qtyOpen = qsheet !== null
  const closeQty = () => {
    if (window.history.state?.qcQty) window.history.back()
    else setQsheet(null)
  }
  useEffect(() => {
    if (!qtyOpen) return
    if (!window.history.state?.qcQty) window.history.pushState({ qcQty: true }, '')
    const onPop = () => setQsheet(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [qtyOpen])

  const closeAcct = () => {
    if (window.history.state?.qcAcct) window.history.back()
    else setAcctOpen(false)
  }
  useEffect(() => {
    if (!acctOpen) return
    if (!window.history.state?.qcAcct) window.history.pushState({ qcAcct: true }, '')
    const onPop = () => {
      if (!pdpRef.current && !qtyRef.current && !cartRef.current && !acctSubRef.current) setAcctOpen(false)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [acctOpen])
  const closeReorder = () => {
    if (window.history.state?.qcReorder) window.history.back()
    else setReorderOpen(false)
  }
  useEffect(() => {
    if (!reorderOpen) return
    if (!window.history.state?.qcReorder) window.history.pushState({ qcReorder: true }, '')
    const onPop = () => {
      if (!pdpRef.current && !qtyRef.current && !cartRef.current) setReorderOpen(false)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [reorderOpen])
  const closeCart = () => {
    if (window.history.state?.qcCart) window.history.back()
    else setCartOpen(false)
  }
  useEffect(() => {
    if (!cartOpen) return
    if (!window.history.state?.qcCart) window.history.pushState({ qcCart: true }, '')
    const onPop = () => { if (!qtyRef.current) setCartOpen(false) }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [cartOpen])

  // stable intents — memoized cards subscribe via context, never re-render
  const openQty = useCallback((p, apply, opts) => setQsheet({ p, apply, opts }), [])
  const openPdp = useCallback((p) => setPdp(prev => {
    if (prev) PDP_SWAPF.current = true
    return p
  }), [])
  const openCart = useCallback(() => setCartOpen(true), [])
  const confirmQty = (n, e) => {
    const q = qsheet
    if (!q) return
    changeCart(n, q.p, q.opts)
    q.apply?.(n)
    if (e) sparkle(e)
    closeQty()
  }

  // Theme vars go on :root so portaled dialogs (quiz popup) inherit the sky too
  useEffect(() => {
    const r = document.documentElement.style
    r.setProperty('--hdr-a', T.a)
    r.setProperty('--hdr-b', T.b)
    r.setProperty('--hdr-c', T.c)
    r.setProperty('--hdr-d', T.d)
  }, [T])

  // rAF-throttled with hysteresis (on >110, off <70) so the header never flaps mid-scroll.
  // navMini: Apple-style — scrolling DOWN shrinks the navbar, scrolling UP restores it.
  const [navMini, setNavMini] = useState(window.location.hash === '#navmini')
  useEffect(() => {
    // --hdr-p drives the header-row collapse as a pure function of scroll
    // position (0 → 1 over the first 80px). Heights derived from scroll can
    // never be caught mid-flight the way time-based transitions were.
    const setP = (p) => document.documentElement.style.setProperty('--hdr-p', String(p))
    if (['#compact', '#navmini'].includes(window.location.hash)) { setP(1); return }
    let ticking = false
    let lastY = window.scrollY
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        setP(Math.min(1, Math.max(0, y / 80)))
        setScrolled(s => (s ? y > 70 : y > 110))
        const dy = y - lastY
        if (Math.abs(dy) > 6) {
          setNavMini(y > 140 && dy > 0)
          lastY = y
        }
        ticking = false
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // initialize for reloads that restore a scroll position
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Quiz auto-pops 15s after open (once per session, skipped if already played)
  useEffect(() => {
    const t = setTimeout(() => { if (!playedRef.current) setQuizOpen(true) }, 15000)
    return () => clearTimeout(t)
  }, [])

  const [reco, setReco] = useState(null)
  const [recoStrip, setRecoStrip] = useState(null)
  useEffect(() => {
    if (!reco) return
    const t = setTimeout(() => setReco(null), 7000)
    return () => clearTimeout(t)
  }, [reco])

  // stable identity so memoized ProductCards skip re-render on cart changes
  const recoSrc = useRef(null)
  const changeCart = useCallback((delta, p, opts) => {
    setCartItems(items => {
      const n = (items[p.id]?.n || 0) + delta
      if (n <= 0) {
        if (!items[p.id]) return items
        const next = { ...items }
        delete next[p.id]
        return next
      }
      return { ...items, [p.id]: { p, n } }
    })
    if (delta > 0 && !opts?.noReco) {
      const items = recosFor(p)
      if (items.length) {
        recoSrc.current = p.id
        setReco(items[0])
        setRecoStrip(items)
      }
    }
    // removing the product that triggered a recommendation dismisses its card
    if (delta < 0 && recoSrc.current === p.id) {
      recoSrc.current = null
      setReco(null)
      setRecoStrip(null)
    }
  }, [])

  // #cart hash: preload a mixed cart so the sheet can be reviewed
  useEffect(() => {
    if (window.location.hash !== '#cart') return
    const t = setTimeout(() => {
      changeCart(12, BUY_AGAIN[0], { noReco: true })
      changeCart(2, DEALS[0], { noReco: true })
    }, 400)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // #reco / #strip hashes: auto-add an item so recommendations can be reviewed
  useEffect(() => {
    if (!['#reco', '#strip'].includes(window.location.hash)) return
    const t = setTimeout(() => changeCart(1, BUY_AGAIN[0]), 600)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const h = new Date().getHours()
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  // Home merchandising mode: category-led default; brand-led preserved at #brandhome
  const homeMode = window.location.hash === '#brandhome' ? 'brand' : 'category'
  const catShelf = (i) => {
    const c = CAT_SHELVES[i]
    if (!c) return null
    const items = bf(FEED_POOL.filter(CAT_RULES[c.cat]))
    if (items.length === 0) return null
    return (
      <Shelf
        title={c.t} items={items} onChange={changeCart} band={c.band}
        sub={catShelfSub(c.cat)} light={false}
        onSeeAll={() => setPlp(c.cat)}
      />
    )
  }

  return (
    <Theme accentColor="green" grayColor="slate" radius="large">
      <QtyCtx.Provider value={openQty}>
      <PdpCtx.Provider value={openPdp}>
      <CartCtx.Provider value={openCart}>
      <CartItemsCtx.Provider value={cart.items}>
      <div className="app">
        <TopBar
          compact={scrolled} dp={sky.dp} cond={sky.cond}
          brand={brand} onBrand={setBrand} onSearch={() => setSheet({ items: FEED_POOL })}
          cartCount={cart.count} plain={heroVariant === 'fest'}
          onTargets={() => { acctInitSub.current = 'dash'; setAcctOpen(true) }}
          onAccount={() => { acctInitSub.current = null; setAcctOpen(true) }}
        />

        {heroVariant === 'fest' ? (
          <FestHero onCat={(c) => setPlp(c)} palette={heroPal} layout={festL} />
        ) : (
          <div className="header-extend" style={glow ? { '--banner-glow': glow } : undefined}>
            <BannerCarousel quizSkin={quizSkin} onGlow={setGlow} />
          </div>
        )}

        {order && (
          <OrderCard
            order={order} onDismiss={dismissOrder} onReorder={reorder}
            onAddMore={() => scrollToId('deals')}
          />
        )}

        <BestSellers onCat={(c) => setPlp(c)} />

        {brand !== 'ALL' && (
          <div className="filter-strip">
            <Text size="1" weight="bold" style={{ flex: 1 }}>
              Showing {brand.toUpperCase()} products only
            </Text>
            <button className="filter-clear" onClick={() => setBrand('ALL')}>
              Clear <Cross2Icon width={11} height={11} />
            </button>
          </div>
        )}

        {bf(BUY_AGAIN).length > 0 && (
          <Shelf
            title={`${greet}, Virag`} sub="Your regulars — from your recent orders"
            items={bf(BUY_AGAIN)} onChange={changeCart}
            onSeeAll={() => setSheet({ items: bf(BUY_AGAIN), title: 'Your regulars' })}
          />
        )}

        {heroVariant === 'classic' && <TargetsCard />}

        <CategoryGrid onPick={openCategory} onSeeAll={() => setPlp('All')} />

        <FlashSale
          items={applyF(bf(DEALS), { ...DEFAULT_F, sort: 3 }, 'ALL')}
          onChange={changeCart}
          onSeeAll={() => setSheet({ items: bf(DEALS), title: 'Flash sale' })}
        />

        {/* engagement break #1: timed quiz right after the urgency band */}
        <QuizCard onFinish={markPlayed} skin={quizSkin} />

        {brand === 'ALL' && <ComboDeals onChange={changeCart} />}

        {brand === 'ALL' && (
          <BrandDay onShop={() => setSheet({ items: FEED_POOL, query: BRAND_DAY.query, title: 'Product of the day' })} />
        )}

        {homeMode === 'brand' && bf(NEW_EBCO).length > 0 && (
          <Shelf
            title="New from Ebco" items={bf(NEW_EBCO)} onChange={changeCart} band="band-green"
            onSeeAll={() => setSheet({ items: bf(NEW_EBCO), title: 'New from Ebco' })}
          />
        )}
        {homeMode === 'category' && catShelf(0)}

        {/* engagement break #2: daily spin + streak check-in mid-page */}
        <GameRow onSpin={() => setWheelOpen(true)} />

        {homeMode === 'brand' ? (
          <>
            {bf(WORKSMART).length > 0 && (
              <Shelf
                title="Worksmart picks" items={bf(WORKSMART)} onChange={changeCart} sub="Office fittings by Ebco"
                onSeeAll={() => setSheet({ items: bf(WORKSMART), title: 'Worksmart picks' })}
              />
            )}
            {bf(LIVESMART).length > 0 && (
              <Shelf
                title="Livsmart corner" items={bf(LIVESMART)} onChange={changeCart} sub="Smart living, by Ebco"
                onSeeAll={() => setSheet({ items: bf(LIVESMART), title: 'Livsmart corner' })}
              />
            )}
          </>
        ) : (
          <>
            {catShelf(1)}
            {catShelf(2)}
          </>
        )}

        {/* engagement break #3: the status race, deep enough to reward scrolling */}
        <Leaderboard />

        {homeMode === 'brand' ? (
          bf(ZIPCO_PEKO).length > 0 && (
            <Shelf
              title="Zipco & Peka corner" items={bf(ZIPCO_PEKO)} onChange={changeCart} band="band-pink"
              onSeeAll={() => setSheet({ items: bf(ZIPCO_PEKO), title: 'Zipco & Peka' })}
            />
          )
        ) : (
          <>
            {catShelf(3)}
            {catShelf(4)}
            {catShelf(5)}
          </>
        )}

        <EndlessFeed onChange={changeCart} pool={pool} />

        <QuizDialog
          open={quizOpen} onOpenChange={setQuizOpen}
          onFinish={markPlayed} skin={quizSkin}
        />
        <SpinDialog open={wheelOpen} onOpenChange={setWheelOpen} />

        {simEnabled && (
          <DevSimulator
            dp={sky.dp} cond={sky.cond} onChange={setSim}
            skinName={quizSkin.name} onSkin={setSimSkin}
            heroPalName={heroPal.name} onHeroPal={setHeroPal}
          />
        )}

        <PageExit open={plp !== null}>
          {plp && (
            <CategoryPage
              cat={plp} onPick={setPlp} onClose={closePlp}
              onChange={changeCart} cart={cart} homeBrand={brand}
              onSearch={() => setSheet({ items: FEED_POOL })}
              recoStrip={recoStrip} onRecoClose={() => setRecoStrip(null)}
            />
          )}
        </PageExit>

        <PageExit open={sheet !== null}>
          <SearchSheet sheet={sheet} onClose={closeSheet} onChange={changeCart} recoStrip={recoStrip} onRecoClose={() => setRecoStrip(null)} />
        </PageExit>

        <PageExit open={reorderOpen}>
          {reorderOpen && (
            <ReorderPage onClose={closeReorder} onChange={changeCart} cart={cart} lastOrder={order} />
          )}
        </PageExit>

        <PageExit open={acctOpen}>
          {acctOpen && (
          <AccountPage
            onClose={closeAcct} onChange={changeCart} lastOrder={order}
            subRef={acctSubRef} initialSub={acctInitSub.current}
            onCategory={(cat) => { setAcctOpen(false); setPlp(cat) }}
            onGoReorder={() => { setAcctOpen(false); setReorderOpen(true) }}
          />
          )}
        </PageExit>

        <PageExit open={pdp !== null}>
          {pdp && <ProductPage key={pdp.id} p={pdp} onClose={closePdp} onChange={changeCart} cart={cart} />}
        </PageExit>

        <PageExit open={qsheet !== null} variant="sheetv" dur={240}>
          {qsheet && <QtySheet q={qsheet} onClose={closeQty} onConfirm={confirmQty} />}
        </PageExit>

        <PageExit open={cartOpen}>
          {cartOpen && (
          <CartPage
            cart={cart} onClose={closeCart} onChange={changeCart}
            onPlaced={(rec) => {
              setOrder(rec)
              localStorage.setItem('qc-order', JSON.stringify(rec))
              try {
                const bills = JSON.parse(localStorage.getItem('qc-bills') || '[]')
                bills.push({ id: rec.id, amt: rec.bill?.toPay ?? rec.amt, due: rec.dueTs })
                localStorage.setItem('qc-bills', JSON.stringify(bills))
              } catch { /* storage off */ }
              setCartItems({})
              // land on home with the tracking card in view, whatever the stack was
              setCartOpen(false)
              setQsheet(null)
              setPdp(null)
              setSheet(null)
              setPlp(null)
              setReorderOpen(false)
              setAcctOpen(false)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
          )}
        </PageExit>

        {!authed && (
          <LoginGate onDone={() => { localStorage.setItem('qc-auth', '1'); setAuthed(true) }} />
        )}

        <div className="footer">
          {reco && (
            <div className="reco">
              <Img className="reco-img" src={img(reco.ph, 100)} alt="" />
              <Box flexGrow="1" style={{ minWidth: 0 }}>
                <Text size="1" weight="bold" as="div" style={{ color: 'var(--green-11)', fontSize: 10.5 }}>
                  PEOPLE ALSO ADD
                </Text>
                <Text size="2" weight="bold" as="div" truncate>
                  {reco.name} · ₹{reco.price.toLocaleString('en-IN')}
                </Text>
              </Box>
              <Button
                size="1" color="green" radius="full" style={{ fontWeight: 800, flex: 'none' }}
                onClick={() => { const r = reco; setReco(null); openQty(r, null, { noReco: true }) }}
              >
                ADD
              </Button>
              <button className="reco-x" onClick={() => setReco(null)} aria-label="Dismiss">
                <Cross2Icon width={13} height={13} />
              </button>
            </div>
          )}
          <CartBar cart={cart} />
          <div className="navrow">
            <NavBar
              onCategories={() => setPlp('All')}
              onUtilities={() => { /* Utilities page comes later */ }}
              onReorder={() => setReorderOpen(true)}
              onAccount={() => { acctInitSub.current = null; setAcctOpen(true) }}
              active={acctOpen ? 'account' : reorderOpen ? 'reorder' : plp ? 'categories' : 'home'}
              mini={navMini}
            />
            <button
              className={`fab ${scrolled ? 'show' : ''} ${navMini ? 'mini' : ''}`}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Back to top"
            >
              <ChevronUpIcon width={20} height={20} />
            </button>
          </div>
        </div>
      </div>
      </CartItemsCtx.Provider>
      </CartCtx.Provider>
      </PdpCtx.Provider>
      </QtyCtx.Provider>
    </Theme>
  )
}

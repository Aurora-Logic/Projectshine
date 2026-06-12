import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Theme, Box, Flex, Grid, Text, Heading, Button, IconButton, TextField, Dialog,
} from '@radix-ui/themes'
import {
  MagnifyingGlassIcon, ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, PersonIcon,
  LightningBoltIcon, StarFilledIcon, MinusIcon, PlusIcon, TimerIcon, Cross2Icon,
  HomeIcon, DashboardIcon, CounterClockwiseClockIcon, RocketIcon, ArrowLeftIcon,
  MixerHorizontalIcon, GearIcon,
} from '@radix-ui/react-icons'
import {
  FREE_DELIVERY_AT, FEED_CAP, BUY_AGAIN, NEW_EBCO, DEALS, WORKSMART, LIVESMART, ZIPCO_PEKO,
  FEED_POOL, CATEGORIES, BANNERS, COMBOS, CLEARANCE_TILES, QUIZ,
  LEADERS, SEARCH_HINTS, HEADER_TABS, WHEEL, QUIZ_SECONDS, SKY, QUIZ_SKINS, BRAND_LOGOS,
  BRAND_DAY, CAMPAIGN_HEADERS, MY_RANK, TARGETS, FEST, HERO_PALETTES,
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
    s.style.background = ['#12A594', '#FFD43B', '#7CCEC2'][i % 3]
    s.style.left = `${e.clientX}px`
    s.style.top = `${e.clientY}px`
    s.style.setProperty('--dx', `${Math.random() * 90 - 45}px`)
    s.style.setProperty('--dy', `${-25 - Math.random() * 60}px`)
    document.body.appendChild(s)
    setTimeout(() => s.remove(), 550)
  }
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
        <span className="leafy" style={{ top: 30, animationDuration: '7s' }}>🍃</span>
        <span className="leafy" style={{ top: 80, animationDuration: '9s', animationDelay: '2.5s' }}>🍃</span>
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

function TopBar({ compact, weather, dp, cond, brand, onBrand, onSearch, cartCount, plain }) {
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
            304, Maple Heights{plain ? '' : ` · ${weather.icon}`}
          </Text>
        </Box>
        <div className="avatar" aria-label="Cart">
          <CartGlyph />
          {cartCount > 0 && <span className="cart-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
        </div>
        <div className="avatar"><PersonIcon width={19} height={19} /></div>
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
        <Text size="1" weight="bold" truncate style={{ flex: 1, minWidth: 0 }}>
          You’re #{MY_RANK.rank} of {MY_RANK.of} dealers · ↑{MY_RANK.moved} this week
        </Text>
        <Text size="1" weight="bold" color="amber" style={{ flex: 'none' }}>View board</Text>
        <ChevronRightIcon width={13} height={13} color="var(--amber-11)" style={{ flex: 'none' }} />
      </div>

      {plain && (
        <div className="tgt-mini" title="Analytics page coming soon">
          <Text size="1" weight="bold" style={{ color: '#fff', flex: 'none' }}>Monthly target</Text>
          <div className="tgt-mini-bar">
            <div className="tgt-mini-fill" style={{ width: `${Math.min(100, Math.round((TARGETS.monthly.done / TARGETS.monthly.target) * 100))}%` }} />
          </div>
          <Text size="1" weight="bold" style={{ color: '#FFD43B', flex: 'none' }}>
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
      <span className="timer-dot" /> ENDS IN {mm}:{ss}
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

function AddControl({ qty, onAdd, onRemove }) {
  if (qty === 0) {
    return (
      <Button
        className="padd" variant="outline" color="teal" size="2"
        onClick={onAdd} style={{ fontWeight: 800, margin: 0 }}
      >
        ADD
      </Button>
    )
  }
  return (
    <Flex className="padd" align="center" justify="between" style={{ background: 'var(--teal-9)' }}>
      <IconButton size="1" onClick={onRemove} style={{ background: 'transparent', color: '#fff' }}>
        <MinusIcon />
      </IconButton>
      <Text size="2" weight="bold" style={{ color: '#fff' }}>{qty}</Text>
      <IconButton size="1" onClick={onAdd} style={{ background: 'transparent', color: '#fff' }}>
        <PlusIcon />
      </IconButton>
    </Flex>
  )
}

const ProductCard = memo(function ProductCard({ p, grid, onChange }) {
  const [qty, setQty] = useState(0)
  const add = (e) => { setQty(q => q + 1); onChange(1, p); sparkle(e) }
  const remove = () => { setQty(q => q - 1); onChange(-1, p) }

  const oos = p.stock === 0
  return (
    <div className={`pcard ${grid ? 'grid' : ''}`}>
      <div className="pimg-wrap">
        <Img className={`pimg ${oos ? 'oos' : ''}`} src={img(p.ph, 360)} alt={p.name} loading="lazy" />
        {p.tag && <span className="pbadge">{p.tag}</span>}
        <AddControl qty={qty} onAdd={add} onRemove={remove} />
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
            color: oos ? 'var(--red-10)' : p.stock <= 10 ? 'var(--amber-11)' : 'var(--teal-10)',
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
  Locks: p => /lock|aldrop|bolt/i.test(p.name),
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
  { icon: '🧾', t: 'GST input credit on every invoice', s: 'Business billing built in' },
  { icon: '🚚', t: 'Free delivery above ₹999', s: 'Straight to your site, no surge' },
]

/* ---------- Shared filter system: subcat · brand · material · load · size · deals · sort ---------- */

const DEFAULT_F = { deals: false, spec: null, sort: 0, mat: null, load: 0, size: null }
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
  if (f.deals) out = out.filter(p => p.tag)
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
  deal: f.deals ? 1 : 0,
  sort: f.sort > 0 ? 1 : 0,
})

const fSummary = (f, b) => [
  b !== 'ALL' && b.charAt(0).toUpperCase() + b.slice(1),
  f.spec && f.spec[0],
  f.mat,
  f.load > 0 && `≥ ${f.load} kg`,
  f.size && `${f.size}mm`,
  f.deals && 'Deals only',
  f.sort > 0 && SORT_OPTIONS[f.sort],
].filter(Boolean)

function FilterSheet({ group, onGroup, cat = 'All', b, setB, f, setF, count }) {
  if (!group) return null
  const set = (patch) => setF(cur => ({ ...cur, ...patch }))
  const badges = fBadges(f, b)
  const groups = [
    ['sub', 'Subcategory'], ['brand', 'Brand'], ['material', 'Material'],
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
                  <Text size="2" weight="bold" style={{ color: 'var(--teal-11)' }}>
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
            {group === 'deal' && (
              <div className="fs-tiles">
                <button className={`fs-tile ${!f.deals ? 'on' : ''}`} onClick={() => set({ deals: false })}>
                  <div className="media"><Text size="7">🗂️</Text></div>
                  <div className="fs-cap"><Text size="2" weight="bold">All items</Text></div>
                </button>
                <button className={`fs-tile ${f.deals ? 'on' : ''}`} onClick={() => set({ deals: true })}>
                  <div className="media"><Text size="7">🏷️</Text></div>
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
          <Button size="3" color="teal" radius="full" style={{ flex: 1, fontWeight: 800 }} onClick={() => onGroup(null)}>
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
                    <Text size="4" style={{ flex: 'none' }}>{MERCH_ROWS[c.merchIdx].icon}</Text>
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
        {recoStrip && recoStrip.length > 0 && (
          <div className="rstrip">
            <Flex align="center" justify="between" px="3" pb="2">
              <Text size="1" weight="bold" style={{ color: 'var(--teal-11)', fontSize: 10.5 }}>
                PEOPLE ALSO ADD
              </Text>
              <button className="reco-x" onClick={onRecoClose} aria-label="Dismiss">
                <Cross2Icon width={12} height={12} />
              </button>
            </Flex>
            <div className="rstrip-scroll">
              {recoStrip.map(x => (
                <div key={`rs-${x.id}`} className="rmini">
                  <div style={{ position: 'relative' }}>
                    <Img src={img(x.ph, 220)} alt={x.name} loading="lazy" />
                    {x.tag && <span className="pbadge" style={{ fontSize: 9, padding: '3px 6px', top: 6, left: 6 }}>{x.tag}</span>}
                  </div>
                  <Text as="div" weight="bold" className="clamp2" style={{ fontSize: 12, lineHeight: 1.3, height: 31 }}>
                    {x.name}
                  </Text>
                  <Text as="div" color="gray" truncate style={{ fontSize: 10.5 }}>{x.qty}</Text>
                  {x.stock != null && (
                    <Text as="div" weight="bold" style={{
                      fontSize: 10,
                      color: x.stock === 0 ? 'var(--red-10)' : x.stock <= 10 ? 'var(--amber-11)' : 'var(--teal-10)',
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
                      size="1" color="teal" radius="full" style={{ fontWeight: 800, height: 26, padding: '0 12px', flex: 'none' }}
                      onClick={(e) => { onChange(1, x, { noReco: true }); sparkle(e) }}
                    >
                      ADD
                    </Button>
                  </Flex>
                </div>
              ))}
            </div>
          </div>
        )}
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
function SearchSheet({ sheet, onClose, onChange }) {
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
  const hits = base.filter(p => !ql || `${p.name} ${p.qty}`.toLowerCase().includes(ql))
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
          <Grid columns="2" gapX="3" gapY="4" pt="3" pb="9">
            {pageReady
              ? shown.map(p => <ProductCard key={`s-${p.id}`} p={p} grid onChange={onChange} />)
              : [0, 1, 2, 3].map(i => <div className="skel" key={`sk${i}`} />)}
          </Grid>
        </div>
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
  const [qty, setQty] = useState(0)
  const p = { id: c.id, ph: c.ph, price: c.price }
  const add = (e) => { setQty(q => q + 1); onChange(1, p); sparkle(e) }
  const remove = () => { setQty(q => q - 1); onChange(-1, p) }

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
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--teal-11)', marginTop: 2 }}>
          You save ₹{(c.was - c.price).toLocaleString('en-IN')}
        </Text>
      </div>
    </div>
  )
}

function ClearanceStore() {
  return (
    <div className="band-clearance" id="season-store">
      <Flex align="center" justify="between">
        <Box>
          <Flex align="center" gap="2">
            <Heading size="6" style={{ color: '#fff', letterSpacing: '-0.4px' }}>Clearance stock</Heading>
            <span className="cl-pill">UP TO 60% OFF</span>
          </Flex>
          <Text size="2" as="div" mt="1" style={{ color: 'rgba(255,255,255,.7)' }}>
            Last units — gone when they’re gone
          </Text>
        </Box>
        <Text size="2" weight="bold" style={{ color: '#fff', cursor: 'pointer', flex: 'none' }}>See all</Text>
      </Flex>
      <Grid columns="2" gap="3" mt="4">
        {CLEARANCE_TILES.map(t => (
          <div className="m-tile" key={t.label}>
            <div className="m-label" style={{ display: 'block' }}>
              <Text size="2" weight="bold" as="div" style={{ color: '#fff', lineHeight: 1.3 }}>{t.label}</Text>
              <Text size="1" weight="bold" as="div" mt="1" style={{ color: '#FFD43B' }}>Only {t.left} left</Text>
            </div>
            <div style={{ position: 'relative' }}>
              <Img src={img(t.ph, 280)} alt={t.label} loading="lazy" style={{ display: 'block', width: '100%', height: 104, objectFit: 'cover' }} />
              <span className="cl-off">-{t.off}%</span>
            </div>
          </div>
        ))}
      </Grid>
    </div>
  )
}

/* ---------------- Quiz + leaderboard ---------------- */

function QuizFlow({ onFinish, onLeaderboard, autoStart, skin }) {
  const [stage, setStage] = useState(autoStart ? 'playing' : 'idle') // idle | playing | done
  const [qi, setQi] = useState(0)
  const [picked, setPicked] = useState(null)
  const [correct, setCorrect] = useState(0)
  const [tleft, setTleft] = useState(QUIZ_SECONDS)

  const start = () => { setStage('playing'); setQi(0); setCorrect(0); setPicked(null) }

  const advance = (isRight) => {
    if (qi + 1 < QUIZ.length) { setQi(q => q + 1); setPicked(null) }
    else {
      if (onFinish) onFinish()
      setStage('done')
    }
  }

  const pick = (i, e) => {
    if (picked !== null) return
    setPicked(i)
    const isRight = i === QUIZ[qi].a
    if (isRight) { setCorrect(c => c + 1); sparkle(e) }
    setTimeout(() => advance(isRight), 900)
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
      setTimeout(() => advance(false), 900)
    }
  }, [tleft]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {stage === 'idle' && (
        <Flex align="center" gap="3">
          <Box flexGrow="1">
            <span className="edition-pill" style={{ color: skin.btn }}>TODAY’S EDITION · {skin.name.toUpperCase()}</span>
            <Heading size="5" mt="2" style={{ color: '#fff', letterSpacing: '-0.3px' }}>Daily Hardware Quiz</Heading>
            <Text size="2" as="div" mt="1" style={{ color: 'rgba(255,255,255,.85)' }}>
              3 questions · win an order coupon · new look every day
            </Text>
            <Button
              size="2" mt="3" radius="full"
              style={{ background: '#fff', color: skin.btn, fontWeight: 800 }}
              onClick={start}
            >
              <RocketIcon width={14} height={14} /> Play now
            </Button>
          </Box>
          <StarFilledIcon width={56} height={56} color="rgba(255,255,255,.25)" style={{ flex: 'none' }} />
        </Flex>
      )}

      {stage === 'playing' && (
        <Box>
          <Flex align="center" justify="between">
            <Text size="1" weight="bold" style={{ color: 'rgba(255,255,255,.7)' }}>
              QUESTION {qi + 1} OF {QUIZ.length} · {Math.ceil(tleft)}s
            </Text>
            <Text size="1" weight="bold" style={{ color: skin.accent }}>
              {correct} correct so far
            </Text>
          </Flex>
          <div className="qbar">
            <div className="qbar-fill" style={{ width: `${(tleft / QUIZ_SECONDS) * 100}%`, background: skin.accent }} />
          </div>
          <Heading size="4" mt="2" style={{ color: '#fff', lineHeight: 1.3 }}>{QUIZ[qi].q}</Heading>
          <Box mt="2">
            {QUIZ[qi].opts.map((o, i) => {
              let cls = 'quiz-opt'
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
        <Flex align="center" gap="3">
          <Box flexGrow="1">
            <Heading size="5" style={{ color: '#fff' }}>
              {correct > 0 ? `${correct}/${QUIZ.length} correct — ₹${correct * 25} OFF won!` : `${correct}/${QUIZ.length} — better luck tomorrow`}
            </Heading>
            <Text size="2" as="div" mt="1" style={{ color: 'rgba(255,255,255,.85)' }}>
              {correct > 0 ? 'Coupon auto-applies on your next order. ' : ''}New quiz drops tomorrow at 8 AM.
            </Text>
            <Button
              size="2" mt="3" radius="full" variant="outline"
              style={{ color: '#fff', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.5)', fontWeight: 700 }}
              onClick={onLeaderboard}
            >
              View leaderboard
            </Button>
          </Box>
          <StarFilledIcon width={56} height={56} color={skin.accent} style={{ flex: 'none' }} />
        </Flex>
      )}
    </>
  )
}

function QuizCard({ onFinish, skin }) {
  return (
    <div className={`quiz-card deco-${skin.deco}`} id="quiz" style={{ background: skin.bg }}>
      <QuizFlow skin={skin} onFinish={onFinish} onLeaderboard={() => scrollToId('leaderboard')} />
    </div>
  )
}

function QuizDialog({ open, onOpenChange, onFinish, skin }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className={`quiz-dialog deco-${skin.deco}`} maxWidth="380px" aria-describedby={undefined} style={{ background: skin.bg }}>
        <Dialog.Title size="4" mb="3" style={{ color: skin.accent, paddingRight: 32 }}>
          Quiz time — win an order coupon
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

function LeaderCol({ entry, index, max, animate }) {
  const e = entry
  const shown = useCountUp(e.value, animate, 900, index * 110)
  return (
    <div className={`lbv-col ${e.me ? 'me' : ''}`}>
      <Text size="1" weight="bold" color={e.me ? 'green' : 'gray'} style={{ fontSize: 10.5 }}>
        {fmtL(shown)}
      </Text>
      {e.top && <StarFilledIcon width={12} height={12} color="var(--amber-9)" />}
      <div className="lb-av" style={{ background: e.me ? 'var(--teal-9)' : e.color, width: 30, height: 30, fontSize: 12, animationDelay: `${index * 110}ms` }}>
        {e.name[0]}
      </div>
      <div
        className="lbv-bar"
        style={{
          height: animate ? Math.max(14, Math.round((e.value / max) * 150)) : 8,
          transitionDelay: `${index * 110}ms`,
          background: e.me
            ? 'linear-gradient(180deg, var(--teal-9), var(--teal-11))'
            : `linear-gradient(180deg, ${e.color}CC, ${e.color}66)`,
        }}
      />
      <Text size="1" weight="bold" color={e.me ? 'green' : 'gray'} style={{ fontSize: 10.5 }}>
        #{e.rank}
      </Text>
      <Text size="1" weight={e.me ? 'bold' : 'medium'} truncate style={{ fontSize: 10.5, maxWidth: '100%' }}>
        {e.name}
      </Text>
    </div>
  )
}

function GameRow({ onSpin }) {
  return (
    <div className="game-row">
      <button className="game-card game-spin" onClick={onSpin}>
        <Text size="6" as="div">🎡</Text>
        <Text size="3" weight="bold" as="div" mt="1" style={{ color: '#fff' }}>Spin & Win</Text>
        <Text size="1" as="div" mt="1" style={{ color: 'rgba(255,255,255,.88)' }}>
          1 free spin today · up to ₹250 off
        </Text>
      </button>
      <StreakCard />
    </div>
  )
}

function StreakCard() {
  const [claimed, setClaimed] = useState(() => localStorage.getItem('qc-streak-day') === DAY)
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const hit = claimed ? 6 : 5
  return (
    <button
      className="game-card game-streak"
      onClick={(e) => {
        if (claimed) return
        setClaimed(true)
        localStorage.setItem('qc-streak-day', DAY)
        sparkle(e)
      }}
    >
      <Text size="3" weight="bold" as="div" style={{ color: '#fff' }}>{hit}-day streak</Text>
      <Text size="1" as="div" mt="1" style={{ color: 'rgba(255,255,255,.88)' }}>
        {claimed ? 'Checked in · see you tomorrow' : 'Tap to check in · 7 days → ₹100 voucher'}
      </Text>
      <div className="day-dots">
        {days.map((d, i) => (
          <span key={i} className={`day-dot ${i < hit ? 'hit' : ''} ${i === hit && !claimed ? 'today' : ''}`}>
            {i < hit ? '✓' : d}
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
      setState('done')
    }, 4200)
  }

  const gradient = WHEEL.map((s, i) => `${s.color} ${i * segs}deg ${(i + 1) * segs}deg`).join(', ')

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="wheel-dialog" maxWidth="360px" aria-describedby={undefined}>
        <Dialog.Title size="4" style={{ color: '#fff', paddingRight: 32 }}>Spin & Win</Dialog.Title>
        <button className="quiz-close" onClick={() => onOpenChange(false)} aria-label="Close">
          <Cross2Icon width={15} height={15} />
        </button>
        <div className="wheel-wrap">
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
            <Heading size="5" style={{ color: '#FFD43B' }}>
              {prize.label === 'TRY AGAIN' ? 'So close!' : `You won ${prize.label}!`}
            </Heading>
            <Text size="2" align="center" style={{ color: 'rgba(255,255,255,.9)' }}>
              {prize.label === 'TRY AGAIN'
                ? 'No luck this time — your free spin is back tomorrow.'
                : 'Auto-applied on your next order.'}
            </Text>
            <Button size="2" mt="2" radius="full" style={{ background: '#fff', color: '#B34A0A', fontWeight: 800 }}
              onClick={() => onOpenChange(false)}>
              Keep shopping
            </Button>
          </Flex>
        ) : state === 'used' ? (
          <Flex direction="column" align="center" gap="1" mt="3" pb="2">
            <Heading size="5" style={{ color: '#FFD43B' }}>Spin used for today</Heading>
            <Text size="2" align="center" style={{ color: 'rgba(255,255,255,.9)' }}>
              Your next free spin lands tomorrow morning.
            </Text>
            <Button size="2" mt="2" radius="full" style={{ background: '#fff', color: '#B34A0A', fontWeight: 800 }}
              onClick={() => onOpenChange(false)}>
              Keep shopping
            </Button>
          </Flex>
        ) : (
          <Flex direction="column" align="center" gap="1" mt="3" pb="2">
            <Button
              size="3" radius="full" disabled={state === 'spinning'}
              style={{ background: '#fff', color: '#B34A0A', fontWeight: 800, opacity: state === 'spinning' ? .7 : 1 }}
              onClick={spin}
            >
              {state === 'spinning' ? 'Spinning…' : 'SPIN NOW'}
            </Button>
            <Text size="1" style={{ color: 'rgba(255,255,255,.8)' }}>1 free spin every day</Text>
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
  const max = Math.max(...LEADERS.map(l => l.vol), myVol)
  const toTop5 = Math.max(0, LEADERS[LEADERS.length - 1].vol - myVol + 1)

  return (
    <Box pt="5" id="leaderboard">
      <SectionHead title="Top dealers — HSR region" extra={<span className="save-pill">WEEKLY</span>} />
      <Box px="4" mt="-2">
        <Text size="1" color="gray" as="div">
          Ranked by monthly purchase volume. Top 3 earn extra margin this month.
        </Text>
      </Box>
      <div className={`lb-card ${animate ? 'go' : ''}`} ref={ref}>
        <div className="lbv">
          {[
            ...LEADERS.map((l, i) => ({ rank: i + 1, name: l.name.split(' ')[0], value: l.vol, color: l.c, top: i === 0 })),
            { rank: 12, name: 'You', value: myVol, me: true },
          ].map((e, i) => (
            <LeaderCol key={e.name} entry={e} index={i} max={max} animate={animate} />
          ))}
        </div>
      </div>
      <div className="lb-tip">
        <RocketIcon width={15} height={15} color="var(--amber-11)" style={{ flex: 'none' }} />
        <Text size="1" weight="bold" style={{ flex: 1, color: 'var(--amber-11)' }}>
          {fmtL(toTop5)} more in purchases to crack the top 5 — every order counts
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

/* Hero v2: client "fest" takeover — promo card + 2x2 category tiles, scalloped edge */
function FestHero({ onCat }) {
  return (
    <div className="fest-wrap">
      <div className="fest-grid">
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
      <div className="fest-scallop" />
      <div className="fest-dots">
        {Array.from({ length: 12 }, (_, i) => <span key={i} />)}
      </div>
    </div>
  )
}

/* Flash Sale — Deal of the day + Clearance merged: timer, discounts, selling-fast bars */
function FlashCard({ p, onChange }) {
  const [qty, setQty] = useState(0)
  const add = (e) => { setQty(q => q + 1); onChange(1, p); sparkle(e) }
  const remove = () => { setQty(q => q - 1); onChange(-1, p) }
  const pct = p.mrp ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0
  const sold = Math.max(15, Math.min(95, 100 - (p.stock ?? 50)))
  return (
    <div className="flash-card">
      <div className="pimg-wrap" style={{ aspectRatio: 'auto', height: 104 }}>
        <Img className="pimg" src={img(p.ph, 320)} alt={p.name} style={{ borderRadius: '16px 16px 0 0' }} />
        {pct > 0 && <span className="flash-off">-{pct}%</span>}
        <AddControl qty={qty} onAdd={add} onRemove={remove} />
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
          <Heading size="4" style={{ color: '#fff', letterSpacing: '-0.2px' }}>⚡ Flash sale</Heading>
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
          <Button size="2" color="teal" radius="full" style={{ fontWeight: 800, flex: 'none' }} onClick={onShop}>
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
  const [items, setItems] = useState(() => pool.slice(0, 6).map(p => ({ ...p, id: `f0-${p.id}` })))
  const [loading, setLoading] = useState(false)
  const sentinel = useRef(null)
  const batch = useRef(1)

  // brand filter changed → restart the feed from the new pool
  useEffect(() => {
    setItems(pool.slice(0, 6).map(p => ({ ...p, id: `f0-${p.id}` })))
    batch.current = 1
  }, [pool])

  const loadMore = useCallback(() => {
    if (loading || items.length >= FEED_CAP || pool.length === 0) return
    setLoading(true)
    setTimeout(() => {
      const b = batch.current++
      const start = (b * 6) % pool.length
      const next = [...pool, ...pool].slice(start, start + 6)
        .map(p => ({ ...p, id: `f${b}-${p.id}` }))
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
        {items.map(p => <ProductCard key={p.id} p={p} grid onChange={onChange} />)}
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
  const note = cart.total >= FREE_DELIVERY_AT
    ? 'FREE delivery unlocked'
    : `Add ₹${FREE_DELIVERY_AT - cart.total} more for FREE delivery`
  return (
    <div className={`cartbar ${cart.count > 0 ? 'show' : ''}`}>
      <Flex>
        {cart.photos.slice(-3).map(ph => (
          <Img key={ph} className="thumb" src={img(ph, 120)} alt="" />
        ))}
      </Flex>
      <Box flexGrow="1">
        <Text size="2" weight="bold" as="div">
          {cart.count} item{cart.count === 1 ? '' : 's'} · ₹{cart.total}
        </Text>
        <Text size="1" weight="medium" as="div" style={{ color: 'var(--teal-4)' }}>{note}</Text>
      </Box>
      <Flex align="center" gap="1">
        <Text size="2" weight="bold">View cart</Text>
        <ChevronRightIcon width={16} height={16} />
      </Flex>
    </div>
  )
}

function NavBar({ onCategories, onUtilities, active = 'home', mini = false }) {
  const items = [
    { icon: HomeIcon, label: 'Home', key: 'home', go: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { icon: DashboardIcon, label: 'Categories', key: 'categories', go: onCategories },
    { icon: GearIcon, label: 'Utilities', key: 'utilities', go: onUtilities },
    { icon: CounterClockwiseClockIcon, label: 'Reorder', key: 'reorder', go: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
    { icon: PersonIcon, label: 'Account', key: 'account' },
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

export default function App() {
  const [cart, setCart] = useState({ count: 0, total: 0, photos: [] })
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
  const [heroPal, setHeroPal] = useState(() => {
    const m = window.location.hash.match(/^#hero-(\w+)$/)
    const hit = m && HERO_PALETTES.find(p => p.name.toLowerCase() === m[1].toLowerCase())
    return hit || HERO_PALETTES[0]
  })
  const sky = sim ?? fetchedSky
  // Campaign takeover ONLY when explicitly scheduled (hash preview / future campaign flag).
  // Default is always weather + time of day — consistent across opens.
  const campaign = useMemo(() => {
    const m = window.location.hash.match(/^#campaign-(\d)$/)
    return m && CAMPAIGN_HEADERS[+m[1]] ? CAMPAIGN_HEADERS[+m[1]] : null
  }, [])
  const T = heroVariant === 'fest'
    ? { ...heroPal, icon: '' }
    : ((campaign && !sim) ? campaign : SKY[sky.dp][sky.cond])
  // Quiz edition rotates daily, independent of weather — novelty is the hook
  const quizSkin = simSkin ?? QUIZ_SKINS[Math.floor(Date.now() / 86400000) % QUIZ_SKINS.length]

  // Brand tab filtering + search/listing sheet (#brand-<key> hash for design review)
  const [brand, setBrand] = useState(() => {
    const m = window.location.hash.match(/#brand-(\w+)/)
    return m && BRAND_KEYS.includes(m[1]) ? m[1] : 'ALL'
  })
  const [sheet, setSheet] = useState(() =>
    window.location.hash === '#search' ? { items: FEED_POOL } : null)
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
  const plpOpen = plp !== null
  const closePlp = () => {
    if (window.history.state?.qcPlp) window.history.back()
    else setPlp(null)
  }
  useEffect(() => {
    if (!plpOpen) return
    if (!window.history.state?.qcPlp) window.history.pushState({ qcPlp: true }, '')
    const onPop = () => { if (!sheetRef.current) setPlp(null) }
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
    const onPop = () => setSheet(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [sheetOpen])

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
    if (['#compact', '#navmini'].includes(window.location.hash)) return
    let ticking = false
    let lastY = window.scrollY
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
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
  const changeCart = useCallback((delta, p, opts) => {
    setCart(c => ({
      count: c.count + delta,
      total: c.total + delta * p.price,
      photos: delta > 0 && !c.photos.includes(p.ph) ? [...c.photos, p.ph] : c.photos,
    }))
    if (delta > 0 && !opts?.noReco) {
      const items = recosFor(p)
      if (items.length) {
        setReco(items[0])
        setRecoStrip(items)
      }
    }
  }, [])

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
    <Theme accentColor="teal" grayColor="slate" radius="large">
      <div className="app">
        <TopBar
          compact={scrolled} weather={{ icon: T.icon }} dp={sky.dp} cond={sky.cond}
          brand={brand} onBrand={setBrand} onSearch={() => setSheet({ items: FEED_POOL })}
          cartCount={cart.count} plain={heroVariant === 'fest'}
        />

        {heroVariant === 'fest' ? (
          <FestHero onCat={(c) => setPlp(c)} />
        ) : (
          <div className="header-extend" style={glow ? { '--banner-glow': glow } : undefined}>
            <BannerCarousel quizSkin={quizSkin} onGlow={setGlow} />
          </div>
        )}

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
          <BrandDay onShop={() => setSheet({ items: FEED_POOL, query: BRAND_DAY.query, title: 'Brand of the day' })} />
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

        {plp && (
          <CategoryPage
            cat={plp} onPick={setPlp} onClose={closePlp}
            onChange={changeCart} cart={cart} homeBrand={brand}
            onSearch={() => setSheet({ items: FEED_POOL })}
            recoStrip={recoStrip} onRecoClose={() => setRecoStrip(null)}
          />
        )}

        <SearchSheet sheet={sheet} onClose={closeSheet} onChange={changeCart} />

        <button
          className={`backtop ${scrolled ? 'show' : ''}`}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <ChevronUpIcon width={14} height={14} /> Back to top
        </button>

        <div className="footer">
          {reco && (
            <div className="reco">
              <Img className="reco-img" src={img(reco.ph, 100)} alt="" />
              <Box flexGrow="1" style={{ minWidth: 0 }}>
                <Text size="1" weight="bold" as="div" style={{ color: 'var(--teal-11)', fontSize: 10.5 }}>
                  PEOPLE ALSO ADD
                </Text>
                <Text size="2" weight="bold" as="div" truncate>
                  {reco.name} · ₹{reco.price.toLocaleString('en-IN')}
                </Text>
              </Box>
              <Button
                size="1" color="teal" radius="full" style={{ fontWeight: 800, flex: 'none' }}
                onClick={(e) => { changeCart(1, reco, { noReco: true }); sparkle(e); setReco(null) }}
              >
                ADD
              </Button>
              <button className="reco-x" onClick={() => setReco(null)} aria-label="Dismiss">
                <Cross2Icon width={13} height={13} />
              </button>
            </div>
          )}
          <CartBar cart={cart} />
          <NavBar
            onCategories={() => setPlp('All')}
            onUtilities={() => { /* Utilities page comes later */ }}
            active={plp ? 'categories' : 'home'}
            mini={navMini}
          />
        </div>
      </div>
    </Theme>
  )
}

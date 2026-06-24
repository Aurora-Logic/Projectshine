import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Theme, Box, Flex, Grid, Text, Heading, Button, TextField, Dialog,
} from '@radix-ui/themes'
import {
  MagnifyingGlassIcon, ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, PersonIcon,
  LightningBoltIcon, StarFilledIcon, MinusIcon, PlusIcon, Cross2Icon,
  HomeIcon, DashboardIcon, CounterClockwiseClockIcon, RocketIcon, ArrowLeftIcon,
  MixerHorizontalIcon, GearIcon, FileTextIcon, DiscIcon, CheckIcon,
  BarChartIcon, BellIcon, LockClosedIcon, ExitIcon, SewingPinIcon,
  EyeOpenIcon, ChatBubbleIcon, MobileIcon, EnvelopeClosedIcon, CalendarIcon,
  IdCardIcon, BookmarkIcon, ChevronLeftIcon, ExclamationTriangleIcon,
  UploadIcon, DownloadIcon, Share2Icon, TrashIcon, RowsIcon,
} from '@radix-ui/react-icons'
import {
  FREE_DELIVERY_AT, FEED_CAP, BUY_AGAIN, NEW_EBCO, DEALS,
  FEED_POOL, CATEGORIES, COMBOS, QUIZ, KITS, PROS, INSPO, INSPO_ROOMS,
  SEARCH_HINTS, HEADER_TABS, WHEEL, QUIZ_SECONDS, SKY, QUIZ_SKINS, BRAND_LOGOS,
  BRAND_DAY, CAMPAIGN_HEADERS, MY_RANK, TARGETS, HERO_PALETTES, TIERS, SCHEMES, ADDRESSES, REORDER, PAST_ORDERS, DASH, CREDIT, CAT_SCHEMES,
  ORDER_STAGES,
  tierSwap, tierSwapCount,
} from './data.js'
import { generateEstimate, EST_BRAND_DEFAULT, EST_FONTS, EST_PAPERS } from './lib/estimate.js'
import { calculateBoM } from './lib/spsBom.js'
import { calculateWeights } from './lib/panelWeight.js'
import { img, DAY, sparkle, scrollToId } from './lib/util.js'
import { LEARN } from './lib/learn.js'
import { usePersisted, safeGet, safeSet, safeRemove, getJSON, setJSON } from './lib/storage.js'
import { useSkyTheme, useNextFrame, useSheetA11y, useCountUp } from './hooks.js'
import { QtyCtx, PdpCtx, CartCtx, CartItemsCtx } from './contexts.js'
import { Img } from './components/Img.jsx'
import { PageExit, SkyLayer, CartGlyph, SectionHead, btnish } from './components/ui.jsx'
import { ProductCard, ProductRow, ComboCard } from './components/cards.jsx'
import { RecoStrip } from './components/feed.jsx'
import { TplCard, ColorRow } from './components/estpdf.jsx'
import { bulkTier, unitPriceFor, lineTotal } from './money.js'
import {
  CAT_RULES, PLP_RAIL, catOf, recosFor, SORT_OPTIONS, SUBCATS, subcatThumb,
  MERCH_ROWS, DEFAULT_F, MATERIALS, SIZES, matThumb,
  applyF, fBadges, fSummary,
} from './lib/catalog.js'
import './App.css'


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


/* Bulk-tier nudge: "Add N more → X% off" — the dealer upsell loop */


const BRAND_NAMES = { ebco: 'Ebco', zipco: 'Zipco', peka: 'Peka', worksmart: 'Worksmart by Ebco', livsmart: 'Livsmart by Ebco' }

/* Parse "10+ @ ₹350/pc" into a usable tier: threshold, bulk price, % off */
// money math lives in money.js (pure, unit-tested)

/* one coupon slot — written by wheel/quiz/streak, consumed at checkout */
const saveCoupon = (c) => {
  try { safeSet('qc-coupon', JSON.stringify(c)) } catch { /* storage off */ }
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
  try { paid = JSON.parse(safeGet('qc-paid') || '[]') } catch { /* none */ }
  try { extra = JSON.parse(safeGet('qc-bills') || '[]') } catch { /* none */ }
  const all = [
    ...CREDIT.bills,
    ...extra.map(b => ({ ...b, days: Math.ceil((b.due - Date.now()) / 864e5) })),
  ]
  const open = all.filter(b => !paid.includes(b.id))
  const outstanding = open.reduce((s, b) => s + b.amt, 0)
  return { limit: CREDIT.limit, open, paidIds: paid, all, outstanding }
}

/* Keeps an overlay mounted briefly after close so it can slide out */
/* Image with blur-up fade-in (gray well → photo) */
// neutral packshot placeholder shown when a product image fails to load
// (Unsplash rate-limit, offline, hotlink block) instead of an invisible gray box
const BRAND_KEYS = ['ALL', 'ebco', 'zipco', 'peka', 'worksmart', 'livsmart']

/* ---------------- Header (seasonal monsoon skin) ---------------- */

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

/* ---------------- Shared bits ---------------- */

/* Deal window persists across refreshes; rolls to a new 30-min window when it expires */

/* ---------------- Category listing page (PLP) ---------------- */


function FilterSheet({ group, onGroup, cat = 'All', b, setB, f, setF, count }) {
  const a11y = useSheetA11y(() => onGroup(null), !!group)
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
      <div
        className="bsheet fsheet" role="dialog" aria-modal="true" aria-label="Filters and sorting" tabIndex={-1}
        ref={a11y} onClick={(e) => e.stopPropagation()}
      >
        <Flex align="center" justify="between" px="4" pt="4" pb="3">
          <Heading as="h2" size="4">Filters & sorting</Heading>
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
                  aria-label="Minimum load rating"
                  aria-valuetext={f.load ? `${f.load} kg or more` : 'Any load'}
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
  const [plpView, setPlpView] = usePersisted('qc-plp-view', 'list')
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
          <Heading as="h2" size="4" style={{ letterSpacing: '-0.2px' }}>
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
            <div key={label} className={`rail-item ${label === cat ? 'on' : ''}`} {...btnish(() => onPick(label))}>
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

          <Flex align="center" justify="between" pt="2" pb="1">
            <Text size="1" color="gray">{summary}</Text>
            <div className="view-toggle">
              <button className={plpView === 'list' ? 'on' : ''} onClick={() => setPlpView('list')} aria-label="List view"><RowsIcon width={15} height={15} /></button>
              <button className={plpView === 'grid' ? 'on' : ''} onClick={() => setPlpView('grid')} aria-label="Grid view"><DashboardIcon width={15} height={15} /></button>
            </div>
          </Flex>

          {!pageReady ? (
            <Grid columns="2" gapX="3" gapY="4" pt="1">
              {[0, 1, 2, 3].map(i => <div className="skel" key={`pk${i}`} />)}
            </Grid>
          ) : products.length > 0 ? (
            plpView === 'list' ? (
              <div className="plp-list" key={gridKey}>
                {products.map(p => <ProductRow key={`pl-${p.id}`} p={p} onChange={onChange} />)}
              </div>
            ) : (
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
            )
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
  const a11y = useSheetA11y(onClose)
  const [q, setQ] = useState(sheet?.query || '')
  const [b, setB] = useState('ALL')
  const [cat, setCat] = useState('All')
  const [f, setF] = useState(DEFAULT_F)
  const [fOpen, setFOpen] = useState(null)
  const [pageReady, setPageReady] = useState(false)
  const [plpView, setPlpView] = usePersisted('qc-plp-view', 'list')
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
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Search" tabIndex={-1} ref={a11y}>
      <div className="sheet-head">
        <button className="sheet-back" onClick={onClose} aria-label="Back">
          <ArrowLeftIcon width={18} height={18} />
        </button>
        <TextField.Root
          size="3" radius="full" autoFocus enterKeyHint="search" value={q} placeholder="Search fittings, brands, sizes…"
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
          <Flex align="center" justify="between" pt="2" gap="2">
            <Text size="1" color="gray" style={{ flex: 1, minWidth: 0 }}>
              {fallback
                ? `No exact matches for “${q}” — showing everything${cat !== 'All' ? ` in ${cat}` : ''}`
                : [
                    `${shown.length} item${shown.length === 1 ? '' : 's'}`,
                    cat !== 'All' && cat,
                    ...fSummary(f, b),
                    sheet.title,
                  ].filter(Boolean).join(' · ')}
            </Text>
            <div className="view-toggle">
              <button className={plpView === 'list' ? 'on' : ''} onClick={() => setPlpView('list')} aria-label="List view"><RowsIcon width={15} height={15} /></button>
              <button className={plpView === 'grid' ? 'on' : ''} onClick={() => setPlpView('grid')} aria-label="Grid view"><DashboardIcon width={15} height={15} /></button>
            </div>
          </Flex>
          {pageReady && shown.length === 0 ? (
            <Flex direction="column" align="center" py="8" gap="2">
              <Text size="2" weight="bold" color="gray">Nothing matches these filters</Text>
              <Button size="1" radius="full" variant="soft" onClick={() => { setB('ALL'); setF(DEFAULT_F); setCat('All') }}>
                Clear filters
              </Button>
            </Flex>
          ) : !pageReady ? (
            <Grid columns="2" gapX="3" gapY="4" pt="3" pb="9">
              {[0, 1, 2, 3].map(i => <div className="skel" key={`sk${i}`} />)}
            </Grid>
          ) : plpView === 'list' ? (
            <div className="plp-list" style={{ paddingTop: 6, paddingBottom: 36 }}>
              {shown.map(p => <ProductRow key={`s-${p.id}`} p={p} onChange={onChange} />)}
            </div>
          ) : (
            <Grid columns="2" gapX="3" gapY="4" pt="3" pb="9">
              {shown.map(p => <ProductCard key={`s-${p.id}`} p={p} grid onChange={onChange} />)}
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

/* ---------------- B10/B11 · Inspiration — shop the look ---------------- */

function InspoStrip({ onOpen }) {
  return (
    <Box pt="5">
      <SectionHead
        title="Shop the look" extra={<span className="save-pill">UPDATED WEEKLY</span>}
        onSeeAll={() => onOpen(null)}
      />
      <div className="hscroll">
        {INSPO.slice(0, 4).map(lk => (
          <div key={lk.id} className="insp-mini" {...btnish(() => onOpen(lk.id))}>
            <Img src={img(lk.ph, 360)} alt="" />
            {lk.fresh && <span className="insp-new">NEW</span>}
            <span className="insp-mini-cap">
              <b>{lk.title}</b>
              <i>{lk.room} · {lk.products.length} products</i>
            </span>
          </div>
        ))}
        <div className="insp-mini more" {...btnish(() => onOpen(null))}>
          <span>See all<br />looks</span>
          <ChevronRightIcon width={16} height={16} />
        </div>
      </div>
    </Box>
  )
}

function InspoPage({ onClose, onChange, startLook, lookRef }) {
  useSheetA11y(onClose)
  const openQty = useContext(QtyCtx)
  const items = useContext(CartItemsCtx)
  const [room, setRoom] = useState('All')
  const [look, setLook] = useState(() => INSPO.find(l => l.id === startLook) || null)
  useEffect(() => { if (lookRef) lookRef.current = !!look }, [look, lookRef])
  // detail gets its own history entry so back returns to the grid
  useEffect(() => {
    if (!look) return undefined
    if (!window.history.state?.qcInspoLook) window.history.pushState({ qcInspoLook: true }, '')
    const onPop = () => setLook(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [look])
  const closeLook = () => {
    if (window.history.state?.qcInspoLook) window.history.back()
    else setLook(null)
  }
  const shown = room === 'All' ? INSPO : INSPO.filter(l => l.room === room)
  const resolve = (ids) => ids.map(id => FEED_POOL.find(p => p.id === id)).filter(Boolean)
  const [added, setAdded] = useState(false)
  const addAll = (e) => {
    resolve(look.products).forEach(p => onChange(1, p, { noReco: true }))
    sparkle(e)
    setAdded(true)
  }
  return (
    <div className="inspopage" role="dialog" aria-modal="true" aria-label="Inspiration" tabIndex={-1}>
      <div className="pdp-head">
        <button className="sheet-back" onClick={onClose} aria-label="Back"><ArrowLeftIcon /></button>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>Inspiration</Heading>
          <Text size="1" color="gray" as="div">Real installs · every look is shoppable</Text>
        </Box>
      </div>
      <div className="insp-chips">
        {INSPO_ROOMS.map(r => (
          <button key={r} className={`seg-b ${room === r ? 'on' : ''}`} onClick={() => setRoom(r)}>{r}</button>
        ))}
      </div>
      <div className="cp-body" style={{ paddingTop: 4 }}>
        <div className="insp-grid">
          {shown.map((lk, i) => (
            <div
              key={lk.id} className="insp-card cardin" style={{ animationDelay: `${i * 40}ms` }}
              {...btnish(() => setLook(lk))}
            >
              <div className="insp-ph" style={{ aspectRatio: ['3 / 4', '1 / 1', '4 / 5'][i % 3] }}>
                <Img src={img(lk.ph, 480)} alt={lk.title} />
                {lk.fresh && <span className="insp-new">NEW</span>}
                <span className="insp-cap">
                  <b>{lk.title}</b>
                  <i>{lk.room} · {lk.products.length} products</i>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {look && (
        <div className="insp-detail">
          <div className="insp-hero">
            <Img src={img(look.ph, 800)} alt="" />
            <button className="sheet-back insp-back" onClick={closeLook} aria-label="Back to looks">
              <ArrowLeftIcon width={18} height={18} />
            </button>
            <span className="insp-room">{look.room}</span>
          </div>
          <div className="insp-body">
            <Heading as="h2" size="4" style={{ letterSpacing: '-0.4px' }}>{look.title}</Heading>
            <Text size="1" color="gray" as="div" mt="1">
              Every fitting in this install, ready to order
            </Text>
            <div className="cp-card" style={{ marginTop: 14 }}>
              <Text size="1" weight="bold" as="div" className="u-seclabel">
                SHOP THIS LOOK · {look.products.length} ITEMS
              </Text>
              {resolve(look.products).map(p => {
                const n = items[p.id]?.n || 0
                return (
                  <div className="cs-row" key={`il-${p.id}`}>
                    <Img src={img(p.ph, 120)} alt="" />
                    <Box flexGrow="1" style={{ minWidth: 0 }}>
                      <Text size="1" weight="bold" as="div" className="clamp1">{p.name}</Text>
                      <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>
                        ₹{p.price.toLocaleString('en-IN')}{p.bulk ? ` · ${p.bulk}` : ''}
                      </Text>
                    </Box>
                    <button className={`insp-add ${n > 0 ? 'in' : ''}`} onClick={() => (openQty ? openQty(p) : onChange(1, p))}>
                      {n > 0 ? `${n} ✓` : 'ADD'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="kit-bar">
            <Box style={{ minWidth: 0 }}>
              <Text size="1" color="gray" as="div">{look.products.length} fittings</Text>
              <Text size="2" weight="bold" as="div">Start with 1 pc each</Text>
            </Box>
            <button className="qs-cta" style={{ margin: 0, flex: 1 }} onClick={added ? closeLook : addAll}>
              <span>{added ? 'Added — keep browsing' : 'Add full look'}</span>
              {!added && <PlusIcon width={15} height={15} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------- B8/B9 · Find a Pro (the Utilities tab) ---------------- */

function ProCard({ pro, i }) {
  const initials = pro.name.replace(/^(Ar\.|Er\.)\s*/, '').split(' ').slice(0, 2).map(w => w[0]).join('')
  return (
    <div className="pro-card cardin" style={{ animationDelay: `${i * 45}ms` }}>
      <Flex gap="3" align="center">
        <div className="pro-av" style={{ background: pro.c }}>{initials}</div>
        <Box flexGrow="1" style={{ minWidth: 0 }}>
          <Flex align="center" gap="2">
            <Text size="2" weight="bold" truncate>{pro.name}</Text>
            <span className="pro-rate"><StarFilledIcon width={10} height={10} /> {pro.rating}</span>
          </Flex>
          <Text size="1" color="gray" as="div" truncate>{pro.firm} · {pro.skills}</Text>
        </Box>
      </Flex>
      <div className="pro-meta">
        <span><SewingPinIcon width={11} height={11} /> {pro.area}</span>
        <span>{pro.jobs} jobs</span>
        <span>{pro.yrs} yrs</span>
      </div>
      <div className="pro-actions">
        <a className="pro-call" href={`tel:+91${pro.phone}`}>
          <MobileIcon width={13} height={13} /> Call
        </a>
        <a className="pro-wa" href={`https://wa.me/91${pro.phone}`} target="_blank" rel="noreferrer">
          <WaMark /> WhatsApp
        </a>
      </div>
    </div>
  )
}

/* ---------------- Utilities hub + flagship calculator (replaces the old Find-a-Pro page) ---------------- */

function Stepper({ value, set, min = 0, max = 16, suffix }) {
  return (
    <div className="sc-step">
      <button className="sc-step-b" onClick={() => set(Math.max(min, value - 1))} disabled={value <= min} aria-label="Decrease"><MinusIcon width={15} height={15} /></button>
      <span className="sc-step-v">{value}{suffix ? <i>{suffix}</i> : null}</span>
      <button className="sc-step-b" onClick={() => set(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase"><PlusIcon width={15} height={15} /></button>
    </div>
  )
}

/* LSPS / SSPS sliding-partition BoM calculator — the flagship "3D" tool */
function SpsCalc({ onBack, init }) {
  const a11y = useSheetA11y(onBack)
  const [material, setMaterial] = useState(init?.material || 'P')
  const [widthFt, setWidthFt] = useState(init?.widthFt || 12)
  const [heightFt, setHeightFt] = useState(init?.heightFt || 9)
  const [lF, setLF] = useState(1)
  const [lM, setLM] = useState(3)
  const [sF, setSF] = useState(2)
  const [sM, setSM] = useState(2)
  const [sys, setSys] = useState('lsps')
  const inr = (n) => '₹' + n.toLocaleString('en-IN')

  const res = useMemo(() => {
    try { return { data: calculateBoM({ lspsFixedDoors: lF, lspsMovableDoors: lM, sspsFixedDoors: sF, sspsMovableDoors: sM, heightFt, widthFt, material }), err: null } }
    catch (e) { return { data: null, err: e.message } }
  }, [material, widthFt, heightFt, lF, lM, sF, sM])

  const data = res.data
  const items = data ? (sys === 'lsps' ? data.lsps : data.ssps) : []
  const total = data ? (sys === 'lsps' ? data.lspsTotal : data.sspsTotal) : 0

  return (
    <div className="sc-page" role="dialog" aria-modal="true" aria-label="Partition BoM Calculator" tabIndex={-1} ref={a11y}>
      <div className="pdp-head">
        <button className="sheet-back" onClick={onBack} aria-label="Back"><ArrowLeftIcon /></button>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>Partition BoM Calculator</Heading>
          <Text size="1" color="gray" as="div">Linked & 2-Way Syncro sliding systems</Text>
        </Box>
      </div>
      <div className="cp-body">
        <div className="sc-card">
          <Text size="1" weight="bold" className="u-seclabel" as="div">MATERIAL</Text>
          <div className="sc-mat">
            {[['P', 'Aluminium', 'Profile frame'], ['W', 'Wood', 'Wooden doors']].map(([k, t, s]) => (
              <button key={k} className={`sc-mat-b ${material === k ? 'on' : ''}`} onClick={() => setMaterial(k)}>
                <Text size="2" weight="bold" as="div">{t}</Text>
                <Text size="1" color="gray" as="div">{s}</Text>
              </button>
            ))}
          </div>
          <div className="sc-grid" style={{ marginTop: 14 }}>
            <div className="sc-field">
              <Text size="1" color="gray" as="div" mb="1">Total width</Text>
              <Stepper value={widthFt} set={setWidthFt} min={1} max={16} suffix="ft" />
            </div>
            <div className="sc-field">
              <Text size="1" color="gray" as="div" mb="1">Height</Text>
              <Stepper value={heightFt} set={setHeightFt} min={1} max={10} suffix="ft" />
            </div>
          </div>
        </div>

        <div className="sc-card">
          <Flex justify="between" align="center">
            <Text size="1" weight="bold" className="u-seclabel" as="div">LSPS · LINKED DOORS</Text>
            <span className="sc-badge l">{data ? inr(data.lspsTotal) : '—'}</span>
          </Flex>
          <div className="sc-grid" style={{ marginTop: 10 }}>
            <div className="sc-field"><Text size="1" color="gray" as="div" mb="1">Fixed</Text><Stepper value={lF} set={setLF} min={0} max={6} /></div>
            <div className="sc-field"><Text size="1" color="gray" as="div" mb="1">Movable</Text><Stepper value={lM} set={setLM} min={0} max={6} /></div>
          </div>
        </div>

        <div className="sc-card">
          <Flex justify="between" align="center">
            <Text size="1" weight="bold" className="u-seclabel" as="div">SSPS · SYNCRO DOORS</Text>
            <span className="sc-badge s">{data ? inr(data.sspsTotal) : '—'}</span>
          </Flex>
          <div className="sc-grid" style={{ marginTop: 10 }}>
            <div className="sc-field"><Text size="1" color="gray" as="div" mb="1">Fixed</Text><Stepper value={sF} set={setSF} min={0} max={6} /></div>
            <div className="sc-field"><Text size="1" color="gray" as="div" mb="1">Movable</Text><Stepper value={sM} set={setSM} min={0} max={6} /></div>
          </div>
        </div>

        {res.err && <div className="sc-warn err"><ExclamationTriangleIcon width={13} height={13} /> <span>{res.err}</span></div>}
        {data && data.warnings.length > 0 && (
          <div className="sc-warn">
            {data.warnings.map((w, i) => <div key={i} className="sc-warn-row"><ExclamationTriangleIcon width={13} height={13} style={{ flex: 'none', marginTop: 1 }} /> <span>{w}</span></div>)}
          </div>
        )}

        <div className="seg sc-seg">
          <button className={`seg-b ${sys === 'lsps' ? 'on' : ''}`} onClick={() => setSys('lsps')}>LSPS · {data ? inr(data.lspsTotal) : '—'}</button>
          <button className={`seg-b ${sys === 'ssps' ? 'on' : ''}`} onClick={() => setSys('ssps')}>SSPS · {data ? inr(data.sspsTotal) : '—'}</button>
        </div>

        <div className="sc-bom">
          {items.length === 0 ? (
            <Text size="2" color="gray" as="div" style={{ textAlign: 'center', padding: '24px 0' }}>No items for this configuration.</Text>
          ) : items.map(it => (
            <div key={it.code} className="sc-line">
              <span className="sc-line-sr">{it.sr}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text size="2" weight="bold" as="div" style={{ lineHeight: 1.25 }}>{it.name}</Text>
                <Text size="1" color="gray" as="div">{it.code} · {it.finish} · MRP {inr(it.mrp)}</Text>
              </div>
              <div className="sc-line-amt">
                <span className="sc-qty">× {it.qty}</span>
                <Text size="2" weight="bold" as="div">{inr(it.amount)}</Text>
              </div>
            </div>
          ))}
        </div>

        <div className="sc-total">
          <div>
            <Text size="1" as="div" style={{ color: 'rgba(255,255,255,.82)', fontWeight: 700 }}>{sys === 'lsps' ? 'LSPS' : 'SSPS'} grand total</Text>
            <Text size="1" as="div" style={{ color: 'rgba(255,255,255,.62)' }}>{items.length} line item{items.length === 1 ? '' : 's'}</Text>
          </div>
          <Heading as="div" size="6" style={{ color: '#fff', letterSpacing: '-0.6px' }}>{inr(total)}</Heading>
        </div>
        <Text size="1" color="gray" as="div" style={{ textAlign: 'center', marginTop: 10 }}>Indicative MRP — verify before quoting. Height is kept for records but does not change quantities.</Text>
      </div>
    </div>
  )
}

/* Panel weight calculator — Ply / MDF / HDHMR / Glass, 3D */
function WeightCalc({ onBack }) {
  const a11y = useSheetA11y(onBack)
  const [t, setT] = useState(18)
  const [w, setW] = useState('1255')
  const [h, setH] = useState('125')
  const res = useMemo(() => {
    try { return { data: calculateWeights({ thicknessMm: t, widthMm: w, heightMm: h }), err: null } }
    catch (e) { return { data: null, err: e.message } }
  }, [t, w, h])
  const data = res.data
  const MATS = [['Ply', 'green'], ['MDF', 'amber'], ['HDHMR', 'blue'], ['Glass', 'indigo']]
  return (
    <div className="sc-page" role="dialog" aria-modal="true" aria-label="Panel Weight Calculator" tabIndex={-1} ref={a11y}>
      <div className="pdp-head">
        <button className="sheet-back" onClick={onBack} aria-label="Back"><ArrowLeftIcon /></button>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>Panel Weight Calculator</Heading>
          <Text size="1" color="gray" as="div">Ply · MDF · HDHMR · Glass</Text>
        </Box>
      </div>
      <div className="cp-body">
        <div className="sc-card">
          <Text size="1" weight="bold" className="u-seclabel" as="div">PANEL SIZE</Text>
          <div className="sc-field" style={{ marginTop: 12 }}>
            <Text size="1" color="gray" as="div" mb="1">Thickness</Text>
            <Stepper value={t} set={setT} min={1} max={50} suffix="mm" />
          </div>
          <div className="sc-grid" style={{ marginTop: 14 }}>
            <div className="sc-field">
              <Text size="1" color="gray" as="div" mb="1">Width</Text>
              <div className="wt-in"><input type="text" inputMode="numeric" style={{ fontSize: 16 }} value={w} onChange={(e) => setW(e.target.value.replace(/[^\d.]/g, ''))} /><span>mm</span></div>
            </div>
            <div className="sc-field">
              <Text size="1" color="gray" as="div" mb="1">Height</Text>
              <div className="wt-in"><input type="text" inputMode="numeric" style={{ fontSize: 16 }} value={h} onChange={(e) => setH(e.target.value.replace(/[^\d.]/g, ''))} /><span>mm</span></div>
            </div>
          </div>
        </div>

        {res.err && <div className="sc-warn err"><ExclamationTriangleIcon width={13} height={13} /> <span>Enter a positive thickness, width and height.</span></div>}

        <div className="wt-grid">
          {MATS.map(([m, c]) => {
            const v = data ? data[m] : null
            const cap = v === 'Not Recommended'
            return (
              <div key={m} className={`wt-card k-${c} ${cap ? 'cap' : ''}`}>
                <Flex align="center" gap="2">
                  <span className={`flat-ic c-${c} wt-dot`}>{m[0]}</span>
                  <Text size="2" weight="bold">{m}</Text>
                </Flex>
                <div className="wt-val">{cap ? 'Not advised' : (data ? v : '—')}{(!cap && data) ? <i>kg</i> : null}</div>
                {cap
                  ? <Text size="1" style={{ color: 'var(--red-10)', fontWeight: 600 }}>Glass &gt; 20 mm thickness</Text>
                  : <Text size="1" color="gray">approx. per panel</Text>}
              </div>
            )
          })}
        </div>
        <Text size="1" color="gray" as="div" style={{ textAlign: 'center', marginTop: 12 }}>Conservative estimate (rounded up). Densities — Ply 618 · MDF 752 · HDHMR 897 · Glass 2520 kg/m³.</Text>
      </div>
    </div>
  )
}

/* ============ Utilities hub — helper components (place ABOVE UtilitiesPage) ============ */

// Rotating search-pill hints for the Utilities header (home-style chrome).
const UTIL_HINTS = [
  'Search “partition BoM”', 'Search “panel weight”', 'Search “branded quote PDF”',
  'Search “hardware calc”', 'Search “find a carpenter”',
]

// "Most-used tools" rail — the Bestsellers analog: 2×2 photo collages + scroll progress.
function UtilToolsRail({ tools }) {
  const ref = useRef(null)
  const [idx, setIdx] = useState(0)
  const onScroll = () => {
    const el = ref.current
    if (el) setIdx(Math.min(tools.length - 1, Math.round(el.scrollLeft / 180)))
  }
  return (
    <Box pt="5" className="cv" data-sec="tools">
      <SectionHead title="Most-used tools" sub="Your top utilities this month" />
      <div className="hscroll" ref={ref} onScroll={onScroll}>
        {tools.map(t => (
          <button key={t.label} className="bs-card" onClick={t.go}>
            <div className="bs-gridwrap">
              <div className="bs-grid">{t.phs.map((ph, i) => <Img key={i} src={img(ph, 180)} alt="" loading="lazy" />)}</div>
              <span className="bs-more">{t.pill}</span>
            </div>
            <Text as="div" weight="bold" style={{ fontSize: 15, letterSpacing: '-0.2px', padding: '14px 4px 2px' }}>{t.label}</Text>
          </button>
        ))}
      </div>
      <div className="bs-prog">{tools.map((_, i) => <span key={i} className={i === idx ? 'on' : ''} />)}</div>
    </Box>
  )
}

function UtilitiesPage({ onClose, lastOrder, onChange, onGoReorder, onGoKit, onSpin, onQuiz, bomCount = 0 }) {
  const a11y = useSheetA11y(onClose)
  const [stack, setStack] = useState(['hub'])
  const view = stack[stack.length - 1]
  const push = (v) => setStack(s => [...s, v])
  const back = () => { if (stack.length > 1) setStack(s => s.slice(0, -1)); else onClose() }
  const [proTab, setProTab] = useState('carpenter')
  const [refs, setRefs] = usePersisted('qc-refs', [])
  const [rName, setRName] = useState('')
  const [rPhone, setRPhone] = useState('')
  const [rType, setRType] = useState('Carpenter')
  const [sent, setSent] = useState(false)
  const [openLearn, setOpenLearn] = useState(null)
  // calculator-first hero state + live estimate (a typical 4-door linked partition)
  const [cMat, setCMat] = useState('P')
  const [cW, setCW] = useState(12)
  const [cH, setCH] = useState(9)
  const ucInr = (n) => '₹' + n.toLocaleString('en-IN')
  const ucTotal = useMemo(() => {
    try { return calculateBoM({ lspsFixedDoors: 1, lspsMovableDoors: 3, sspsFixedDoors: 0, sspsMovableDoors: 0, heightFt: cH, widthFt: cW, material: cMat }).lspsTotal }
    catch { return 0 }
  }, [cMat, cW, cH])

  // home-style header chrome: scoped in-modal scroll, rotating hint, cart + tab state
  const bodyRef = useRef(null)
  const [hint, setHint] = useState(0)
  const [tab, setTab] = useState('all')
  const [compact, setCompact] = useState(false)  // collapse the header once the feed scrolls
  useEffect(() => {
    const t = setInterval(() => setHint(h => (h + 1) % UTIL_HINTS.length), 2600)
    return () => clearInterval(t)
  }, [])
  const openCart = useContext(CartCtx)
  const cartItems = useContext(CartItemsCtx)
  const cartCount = Object.values(cartItems || {}).reduce((s, it) => s + (it?.n || 0), 0)
  const scrollSec = (sec) => {
    const el = bodyRef.current?.querySelector(`[data-sec="${sec}"]`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const refer = (e) => {
    sparkle(e)
    setRefs([{ name: rName.trim(), phone: rPhone, type: rType, ts: Date.now() }, ...refs])
    setSent(true); setRName(''); setRPhone('')
  }

  // sub-screen shell (header + body) wrapping a reused account component; a plain
  // helper (not a nested component) so the child keeps its state across renders.
  const subScreen = (title, sub, body) => (
    <div className="prospage" role="dialog" aria-modal="true" tabIndex={-1}>
      <div className="pdp-head">
        <button className="sheet-back" onClick={back} aria-label="Back"><ArrowLeftIcon /></button>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>{title}</Heading>
          {sub ? <Text size="1" color="gray" as="div">{sub}</Text> : null}
        </Box>
      </div>
      <div className="cp-body">{body}</div>
    </div>
  )

  if (view === 'spscalc') return <SpsCalc onBack={back} init={{ material: cMat, widthFt: cW, heightFt: cH }} />
  if (view === 'weightcalc') return <WeightCalc onBack={back} />
  if (view === 'calc') return subScreen('Hardware calculators', 'Slides · hinges · closers', <AcctCalc />)
  if (view === 'bom') return subScreen('BOM', null, <AcctBoms onSettings={() => push('estpdf')} />)
  if (view === 'estpdf') return subScreen('BOM PDF settings', null, <AcctEstPdf />)
  if (view === 'claims') return subScreen('Claims & returns', null, <AcctClaims lastOrder={lastOrder} />)
  if (view === 'brand') return subScreen('Brand support', null, <AcctBrand />)
  if (view === 'site') return subScreen('Submit site visit', null, <VisitForm kind="site" />)
  if (view === 'display') return subScreen('Display centre visit', null, <VisitForm kind="display" />)
  if (view === 'credit') return subScreen('Credit ledger', '30-day dealer credit', <AcctCredit />)
  if (view === 'lists') return subScreen('Project lists', 'Saved fittings lists', <AcctLists onChange={onChange} onGoKit={onGoKit} />)
  if (view === 'dash') return subScreen('Dealer dashboard', 'Performance & targets', <AcctDash onReorder={onGoReorder} />)
  if (view === 'learn') {
    const a = LEARN.find(l => l.id === openLearn) || LEARN[0]
    return (
      <div className="prospage uh-readpage" role="dialog" aria-modal="true" aria-label={a.title} tabIndex={-1}>
        <div className="uh-read-hero">
          <Img src={img(a.ph, 800)} alt="" />
          <button className="sheet-back insp-back" onClick={back} aria-label="Back"><ArrowLeftIcon width={18} height={18} /></button>
          <span className="uh-read-k">{a.kicker} · {a.mins} min read</span>
        </div>
        <div className="cp-body">
          <Heading as="h2" size="5" style={{ letterSpacing: '-0.4px', lineHeight: 1.15 }}>{a.title}</Heading>
          <Text size="2" as="div" mt="3" style={{ lineHeight: 1.7, color: 'var(--gray-12)' }}>{a.body}</Text>
          <div className="cp-divider" style={{ margin: '18px 0' }} />
          <Text size="1" weight="bold" as="div" className="u-seclabel">MORE GUIDES</Text>
          <div className="hscroll" style={{ marginTop: 10, padding: 0 }}>
            {LEARN.filter(x => x.id !== a.id).slice(0, 5).map(l => (
              <button key={l.id} className="insp-mini" onClick={() => setOpenLearn(l.id)}>
                <Img src={img(l.ph, 360)} alt="" />
                <span className="insp-mini-cap"><b>{l.title}</b><i>{l.mins} min</i></span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (view === 'pros') {
    const pros = PROS[proTab]
    return (
      <div className="prospage" role="dialog" aria-modal="true" aria-label="Find a Pro" tabIndex={-1}>
        <div className="pdp-head">
          <button className="sheet-back" onClick={back} aria-label="Back"><ArrowLeftIcon /></button>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>{proTab === 'carpenter' ? 'Find a Carpenter' : 'Find an Architect'}</Heading>
            <Text size="1" color="gray" as="div">Dealer-verified, rated on real jobs</Text>
          </Box>
        </div>
        <div className="cp-body">
          <div className="sub-hero green-line">
            <span className="oc-pulse" />
            <Text size="1" weight="bold">Every pro is verified on real installed jobs</Text>
            <Text size="1" color="gray" style={{ marginLeft: 'auto', flex: 'none' }}>avg reply ~2 hrs</Text>
          </div>
          <div className="seg" style={{ marginTop: 0, marginBottom: 12 }}>
            <button className={`seg-b ${proTab === 'carpenter' ? 'on' : ''}`} onClick={() => setProTab('carpenter')}>Carpenters</button>
            <button className={`seg-b ${proTab === 'designer' ? 'on' : ''}`} onClick={() => setProTab('designer')}>Architects & designers</button>
          </div>
          {pros.map((pro, i) => <ProCard key={pro.id} pro={pro} i={i} />)}
          <div className="cp-card" style={{ marginTop: 16 }}>
            <Text size="1" weight="bold" as="div" className="u-seclabel">REFER A PRO</Text>
            <Text size="1" color="gray" as="div" mt="1">Know a good {rType === 'Carpenter' ? 'carpenter' : 'designer'}? Referrals count toward your partner standing.</Text>
            {sent ? (
              <Flex align="center" gap="2" mt="3">
                <CheckIcon width={14} height={14} color="var(--green-11)" />
                <Text size="1" weight="bold" style={{ color: 'var(--green-11)' }}>Referral received — we'll verify and onboard them</Text>
              </Flex>
            ) : (
              <>
                <div className="seg" style={{ margin: '10px 0 0' }}>
                  {['Carpenter', 'Designer'].map(t => (
                    <button key={t} className={`seg-b ${rType === t ? 'on' : ''}`} onClick={() => setRType(t)}>{t}</button>
                  ))}
                </div>
                <input className="cp-input" style={{ marginTop: 8 }} placeholder="Their name / firm" value={rName} onChange={(e) => setRName(e.target.value)} />
                <input className="cp-input" style={{ marginTop: 8 }} type="tel" autoComplete="off" inputMode="numeric" maxLength={10} placeholder="Their phone" value={rPhone} onChange={(e) => setRPhone(e.target.value.replace(/\D/g, ''))} />
                <Button mt="3" size="2" color="green" style={{ fontWeight: 800, width: '100%' }} disabled={!rName.trim() || rPhone.length !== 10} onClick={refer}>Send referral</Button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ---------------- hub: home-style feed (shared DNA, distinct tools content) ----------------
  const TOOLS = [
    { label: 'Partition BoM', pill: 'LIVE', go: () => push('spscalc'), phs: ['1558997519-83ea9252edf8', '1595428774223-ef52624120d2', '1594026112284-02bb6f3352fe', '1556228453-efd6c1ff04f6'] },
    { label: 'Branded BoM PDF', pill: 'PRO · PDF', go: () => push('bom'), phs: ['1582139329536-e7284fece509', '1556228453-efd6c1ff04f6', '1484154218962-a197022b5858', '1595428774223-ef52624120d2'] },
    { label: 'Hardware calc', pill: 'POPULAR', go: () => push('calc'), phs: ['1595428774223-ef52624120d2', '1594026112284-02bb6f3352fe', '1556911220-bff31c812dba', '1489171078254-c3365d6e359f'] },
    { label: 'Panel weight', pill: 'QUICK', go: () => push('weightcalc'), phs: ['1489171078254-c3365d6e359f', '1582139329536-e7284fece509', '1558997519-83ea9252edf8', '1565814329452-e1efa11c5b89'] },
  ]
  const COLLAGES = [
    { label: 'Create a BoM', pill: '+ Branded PDF', phs: ['1594026112284-02bb6f3352fe', '1582139329536-e7284fece509', '1595428774223-ef52624120d2', '1556228453-efd6c1ff04f6'], go: () => push('bom') },
    { label: 'Find a Carpenter', pill: '120+ verified', phs: ['1503387762-592deb58ef4e', '1556228453-efd6c1ff04f6', '1524758631624-e2822e304c36', '1484154218962-a197022b5858'], go: () => { setProTab('carpenter'); push('pros') } },
    { label: 'Find an Architect', pill: 'Designers near you', phs: ['1497366216548-37526070297c', '1556911220-bff31c812dba', '1558997519-83ea9252edf8', '1565814329452-e1efa11c5b89'], go: () => { setProTab('designer'); push('pros') } },
  ]
  const SERVICES = [
    ['Site visit', '1582139329536-e7284fece509', SewingPinIcon, 'amber', null, () => push('site')],
    ['Display centre', '1556911220-bff31c812dba', EyeOpenIcon, 'pink', null, () => push('display')],
    ['Brand support', '1565814329452-e1efa11c5b89', BellIcon, 'blue', 'NEW', () => push('brand')],
    ['Claims & returns', '1503387762-592deb58ef4e', ExclamationTriangleIcon, 'red', null, () => push('claims')],
  ]
  const BIZ = [
    ['Credit ledger', '1484154218962-a197022b5858', '30-day credit', '₹2.4L free', () => push('credit')],
    ['Project lists', '1489171078254-c3365d6e359f', 'Saved fittings', null, () => push('lists')],
    ['Dashboard', '1497366216548-37526070297c', 'Targets & rank', '78%', () => push('dash')],
  ]
  const TABS = [
    ['all', 'All', DashboardIcon, 'top'],
    ['tools', 'Tools', MixerHorizontalIcon, 'tools'],
    ['quote', 'Quotes', FileTextIcon, 'quote'],
    ['svc', 'Services', GearIcon, 'services'],
    ['biz', 'Business', BarChartIcon, 'business'],
  ]

  return (
    <div className="utilpage" role="dialog" aria-modal="true" aria-label="Utilities" tabIndex={-1} ref={a11y}>
      <div className={`util-top ${compact ? 'util-compact' : ''}`}>
        <Flex align="center" gap="3" className="util-toprow">
          <button className="avatar util-back" onClick={onClose} aria-label="Back"><ArrowLeftIcon width={18} height={18} /></button>
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Heading as="h2" size="4" style={{ color: '#fff', letterSpacing: '-0.3px' }}>Utilities</Heading>
            <Text size="1" as="div" truncate className="util-sub" style={{ color: 'rgba(255,255,255,.8)' }}>Quote, calculate &amp; run your business</Text>
          </Box>
          <div className="avatar" {...btnish(() => push('bom'))} aria-label="Saved BOMs">
            <BookmarkIcon width={17} height={17} />
            {bomCount > 0 && <span className="cart-badge">{bomCount > 9 ? '9+' : bomCount}</span>}
          </div>
          <div className="avatar" onClick={openCart || undefined} aria-label="Cart">
            <CartGlyph />
            {cartCount > 0 && <span className="cart-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
          </div>
        </Flex>

        <TextField.Root
          size="3" radius="full" placeholder={UTIL_HINTS[hint]} readOnly
          onClick={() => { setTab('tools'); scrollSec('tools') }}
          onFocus={(e) => { e.target.blur(); setTab('tools'); scrollSec('tools') }}
          style={{ background: '#fff', boxShadow: '0 3px 10px rgba(0,0,0,.2)', cursor: 'pointer' }}
        >
          <TextField.Slot><MagnifyingGlassIcon width={17} height={17} /></TextField.Slot>
        </TextField.Root>

        <div className="rewards-strip" {...btnish(() => scrollSec('journey'))}>
          <StarFilledIcon width={14} height={14} color="var(--amber-9)" style={{ flex: 'none' }} />
          <span className="tier-mini" style={{ background: '#98A2B3' }} />
          <Text size="1" weight="bold" truncate style={{ flex: 1, minWidth: 0 }}>
            Silver dealer · ahead of {Math.round(((MY_RANK.of - MY_RANK.rank) / MY_RANK.of) * 100)}% in your region
          </Text>
          <Text size="1" weight="bold" color="amber" style={{ flex: 'none' }}>View journey</Text>
          <ChevronRightIcon width={13} height={13} color="var(--amber-11)" style={{ flex: 'none' }} />
        </div>

        <div className="tgt-mini" {...btnish(() => scrollSec('journey'))}>
          <Text size="1" weight="bold" style={{ color: '#fff', flex: 'none' }}>Monthly target</Text>
          <div className="tgt-mini-bar">
            <div className="tgt-mini-fill" style={{ width: `${Math.min(100, Math.round((TARGETS.monthly.done / TARGETS.monthly.target) * 100))}%` }} />
          </div>
          <Text size="1" weight="bold" style={{ color: '#fff', flex: 'none' }}>
            {Math.round((TARGETS.monthly.done / TARGETS.monthly.target) * 100)}% · ₹{Math.round((TARGETS.monthly.target - TARGETS.monthly.done) / 1000)}k to go
          </Text>
          <ChevronRightIcon width={12} height={12} color="rgba(255,255,255,.7)" style={{ flex: 'none' }} />
        </div>

        <div className="tabs-t util-tabs">
          {TABS.map(([key, label, Icon, sec]) => (
            <button key={key} className={`tab-t ${key === tab ? 'active' : ''}`} onClick={() => { setTab(key); scrollSec(sec) }}>
              <span className="tab-chip"><Icon width={18} height={18} color="var(--green-11)" /></span>
              <span className="lb">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="cp-body" ref={bodyRef} onScroll={(e) => setCompact(e.currentTarget.scrollTop > 40)}>
        <div className="wb-hero" data-sec="top">
          <Img className="wb-hero-photo" src={img('1558997519-83ea9252edf8', 400)} alt="" />
          <div className="wb-hero-scrim" />
          <div className="wb-hero-in">
            <Flex align="center" gap="2">
              <span className="uc-flag">FLAGSHIP CALCULATOR</span>
              <span className="wb-live"><span className="oc-pulse" /> LIVE</span>
            </Flex>
            <Text size="5" weight="bold" as="div" style={{ color: '#fff', letterSpacing: '-0.4px', marginTop: 8 }}>Partition BoM</Text>
            <Text size="1" as="div" style={{ color: 'rgba(255,255,255,.72)' }}>Linked &amp; 2-Way Syncro sliding systems</Text>

            <div className="wb-panel">
              <div className="sc-mat">
                {[['P', 'Aluminium', 'Profile frame'], ['W', 'Wood', 'Wooden doors']].map(([k, t, s]) => (
                  <button key={k} className={`sc-mat-b ${cMat === k ? 'on' : ''}`} onClick={() => setCMat(k)}>
                    <Text size="2" weight="bold" as="div">{t}</Text>
                    <Text size="1" color="gray" as="div">{s}</Text>
                  </button>
                ))}
              </div>
              <div className="uc-fields" style={{ marginTop: 12 }}>
                <div className="uc-field"><Text size="1" color="gray" as="div" mb="1">Total width</Text><Stepper value={cW} set={setCW} min={1} max={16} suffix="ft" /></div>
                <div className="uc-field"><Text size="1" color="gray" as="div" mb="1">Height</Text><Stepper value={cH} set={setCH} min={1} max={10} suffix="ft" /></div>
              </div>
            </div>

            <div className="uc-est">
              <Img src={img('1558997519-83ea9252edf8', 80)} alt="" className="wb-est-thumb" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text size="1" as="div" style={{ color: 'rgba(255,255,255,.78)', fontWeight: 700 }}>Indicative · 4-door linked partition</Text>
                <Heading as="div" size="7" key={ucTotal} className="wb-est-val" style={{ color: '#fff', letterSpacing: '-0.6px' }}>{ucInr(ucTotal)}</Heading>
              </div>
              <button className="uc-cta" onClick={() => push('spscalc')}>Build full BoM <ChevronRightIcon width={15} height={15} /></button>
            </div>
          </div>
          <div className="fest-edge scallop" />
          <div className="fest-dots d-dot">{Array.from({ length: 12 }, (_, i) => <span key={i} />)}</div>
        </div>

        <UtilToolsRail tools={TOOLS} />

        <GameRow onSpin={onSpin} />

        <div className="band-green wb-band" data-sec="quote">
          <SectionHead title="Quote &amp; hire a job" sub="Win the job, then staff it" extra={<span className="save-pill">VERIFIED</span>} />
          <div className="hscroll">
            {COLLAGES.map(c => (
              <button key={c.label} className="bs-card" onClick={c.go}>
                <div className="bs-gridwrap">
                  <div className="bs-grid">{c.phs.map((ph, i) => <Img key={i} src={img(ph, 180)} alt="" loading="lazy" />)}</div>
                  <span className="bs-more">{c.pill}</span>
                </div>
                <Text as="div" weight="bold" style={{ fontSize: 15, letterSpacing: '-0.2px', padding: '14px 4px 2px' }}>{c.label}</Text>
              </button>
            ))}
          </div>
        </div>

        <button className="kit-banner wb-feat" onClick={() => push('bom')}>
          <Img src={img('1556228453-efd6c1ff04f6', 640)} alt="" />
          <div className="kit-scrim" />
          <div className="kit-copy">
            <span className="kit-eyebrow">PROFESSIONAL · PDF</span>
            <Text size="3" weight="bold" as="div" style={{ color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.2 }}>Send a quote that looks like a brand</Text>
            <Text as="div" style={{ fontSize: 11.5, color: 'rgba(255,255,255,.85)', marginTop: 3, lineHeight: 1.4 }}>Your logo, your margins, customer-ready in 60 seconds</Text>
            <span className="kit-cta">Create a BOM <ChevronRightIcon width={13} height={13} /></span>
          </div>
        </button>

        <div className="band-flash wb-band" data-sec="services">
          <SectionHead title="Services &amp; support" sub="Book a visit or raise a claim" light />
          <div className="wb-stiles">
            {SERVICES.map(([label, ph, Icon, c, badge, go]) => (
              <button key={label} className="fest-tile wb-stile" onClick={go}>
                <Img src={img(ph, 300)} alt={label} loading="lazy" />
                <span className={`flat-ic c-${c} wb-chip`}><Icon width={14} height={14} /></span>
                {badge ? <span className="flash-off wb-pop">{badge}</span> : null}
                <span className="fest-tl">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <button className="util-quiz" onClick={() => onQuiz && onQuiz()}>
          <div className="util-quiz-bd">
            <span className="util-quiz-k">TONIGHT’S TABLE · QUIZ</span>
            <Text size="3" weight="bold" as="div" style={{ color: '#fff', letterSpacing: '-0.2px', lineHeight: 1.2 }}>Know your hardware? Win ₹75 off</Text>
            <Text size="1" as="div" style={{ color: 'rgba(255,243,209,.78)', marginTop: 3 }}>3 questions · 10s each · banked to your next bill</Text>
          </div>
          <span className="util-quiz-cta">Play now <ChevronRightIcon width={14} height={14} /></span>
        </button>

        <div data-sec="journey"><Leaderboard /></div>

        <div className="band-pink wb-band" data-sec="business">
          <SectionHead title="Your business" sub="Credit, lists &amp; performance" onSeeAll={() => push('dash')} />
          <Grid columns="3" gapX="3" gapY="4" px="4">
            {BIZ.map(([label, ph, stat, chip, go]) => (
              <div className="cat-tile" key={label} {...btnish(go)}>
                <span className="wb-cat-imgwrap">
                  <Img className="cat-img" src={img(ph, 280)} alt={label} loading="lazy" />
                  {chip ? <span className="wb-cat-chip">{chip}</span> : null}
                </span>
                <Text size="1" weight="bold" as="div" align="center" mt="2" truncate>{label}</Text>
                <Text as="div" align="center" style={{ fontSize: 10.5, color: 'var(--gray-9)', fontWeight: 600 }}>{stat}</Text>
              </div>
            ))}
          </Grid>
        </div>

        <div className="sub-hero green-line" style={{ marginTop: 22 }}>
          <span className="oc-pulse" />
          <Text size="1" weight="bold">Indicative MRP · verify before quoting · prices update live</Text>
        </div>
        <div style={{ height: 14 }} />
      </div>
    </div>
  )
}

/* ---------------- B1 · Project Kit Builder ---------------- */

function KitBanner({ onOpen }) {
  return (
    <div className="kit-banner" {...btnish(onOpen)}>
      <Img src={img(KITS[0].ph, 640)} alt="" />
      <div className="kit-scrim" />
      <div className="kit-copy">
        <span className="kit-eyebrow">KITCHEN · WARDROBE · OFFICE</span>
        <Text size="3" weight="bold" as="div" style={{ color: '#fff', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
          Fitting out a full site?
        </Text>
        <Text as="div" style={{ fontSize: 11.5, color: 'rgba(255, 255, 255, .85)', marginTop: 3, lineHeight: 1.4 }}>
          The complete fittings list, sized to your project
        </Text>
        <span className="kit-cta">Build a project kit <ChevronRightIcon width={13} height={13} /></span>
      </div>
    </div>
  )
}

function KitPage({ onClose, onChange, onGoCart }) {
  useSheetA11y(onClose)
  const [kitKey, setKitKey] = useState('kitchen')
  const kit = KITS.find(k => k.key === kitKey)
  const [counts, setCounts] = useState(() =>
    Object.fromEntries(KITS.flatMap(k => k.counts.map(([key, , def]) => [key, def]))))
  const [off, setOff] = useState({}) // excluded line ids
  const [done, setDone] = useState(false)
  const [savedList, setSavedList] = useState(false)
  const rows = kit.items
    .map(([id, per, q]) => {
      const p = FEED_POOL.find(x => x.id === id)
      if (!p) return null
      const n = per === 'fixed' ? q : Math.max(1, Math.ceil((counts[per] || 0) * q))
      return { p, n, on: !off[id] }
    })
    .filter(Boolean)
  const live = rows.filter(r => r.on)
  const total = live.reduce((s, r) => s + lineTotal(r.p, r.n), 0)
  const listSave = live.reduce((s, r) => s + (r.p.price * r.n - lineTotal(r.p, r.n)), 0)
  const pieces = live.reduce((s, r) => s + r.n, 0)
  const step = (key, d) => {
    setDone(false)
    setCounts(c => ({ ...c, [key]: Math.min(20, Math.max(1, (c[key] || 1) + d)) }))
  }
  const addAll = (e) => {
    live.forEach(r => onChange(r.n, r.p, { noReco: true }))
    sparkle(e)
    setDone(true)
  }
  const saveAsList = () => {
    const lists = loadLists()
    saveLists([...lists, {
      id: `l${Date.now()}`,
      name: `${kit.label} kit`,
      items: live.map(r => ({ id: r.p.id, n: r.n })),
    }])
    setSavedList(true)
  }
  return (
    <div className="kitpage" role="dialog" aria-modal="true" aria-label="Project Kit Builder" tabIndex={-1}>
      <div className="pdp-head">
        <button className="sheet-back" onClick={onClose} aria-label="Back"><ArrowLeftIcon /></button>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>Project Kit Builder</Heading>
          <Text size="1" color="gray" as="div">Complete fittings list, sized to your site</Text>
        </Box>
      </div>
      <div className="cp-body">
        <div className="kit-tiles">
          {KITS.map(k => {
            const on = k.key === kitKey
            return (
              <button
                key={k.key} className={`kit-tile ${on ? 'on' : ''}`}
                onClick={() => { setKitKey(k.key); setOff({}); setDone(false); setSavedList(false) }}
              >
                <Img src={img(k.ph, 300)} alt="" />
                <span className="kit-cap">{k.label}</span>
                {on && <span className="kit-check"><CheckIcon width={12} height={12} /></span>}
              </button>
            )
          })}
        </div>
        <Text size="1" color="gray" as="div" mt="2" mb="3" style={{ padding: '0 4px' }}>{kit.blurb}</Text>

        <div className="cp-card">
          <Text size="1" weight="bold" as="div" className="u-seclabel">
            PROJECT SIZE
          </Text>
          {kit.counts.map(([key, label]) => (
            <Flex key={key} align="center" justify="between" mt="3">
              <Text size="2" weight="bold">{label}</Text>
              <div className="qs-step" style={{ margin: 0, padding: 0, border: 'none' }}>
                <button className="qs-sbtn" onClick={() => step(key, -1)} aria-label={`Fewer ${label}`}><MinusIcon /></button>
                <Text size="3" weight="bold" style={{ width: 38, textAlign: 'center' }}>{counts[key]}</Text>
                <button className="qs-sbtn" onClick={() => step(key, 1)} aria-label={`More ${label}`}><PlusIcon /></button>
              </div>
            </Flex>
          ))}
        </div>

        <div className="cp-card">
          <Flex align="center" justify="between">
            <Text size="1" weight="bold" className="u-seclabel">
              YOUR KIT · {live.length} ITEMS · {pieces} PCS
            </Text>
            {listSave > 0 && <span className="st-chip ok">SAVES ₹{listSave.toLocaleString('en-IN')}</span>}
          </Flex>
          {rows.map(r => {
            const u = unitPriceFor(r.p, r.n)
            return (
              <div key={r.p.id} className={`claim-item ${r.on ? 'on' : ''}`}>
                <button
                  className="claim-check"
                  onClick={() => { setOff(o => ({ ...o, [r.p.id]: !o[r.p.id] })); setDone(false) }}
                  aria-label={r.on ? `Remove ${r.p.name}` : `Include ${r.p.name}`}
                >
                  {r.on && <CheckIcon width={12} height={12} />}
                </button>
                <Img src={img(r.p.ph, 120)} alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover', flex: 'none', opacity: r.on ? 1 : .45 }} />
                <Box flexGrow="1" style={{ minWidth: 0, opacity: r.on ? 1 : .45 }}>
                  <Text size="1" weight="bold" as="div" className="clamp1">{r.p.name}</Text>
                  <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>
                    {r.n} × ₹{u.toLocaleString('en-IN')}{u < r.p.price ? ' · bulk price' : ''}
                  </Text>
                </Box>
                <Text size="1" weight="bold" style={{ flex: 'none', whiteSpace: 'nowrap', opacity: r.on ? 1 : .45 }}>
                  ₹{lineTotal(r.p, r.n).toLocaleString('en-IN')}
                </Text>
              </div>
            )
          })}
          <button className={`kit-save ${savedList ? 'done' : ''}`} onClick={savedList ? undefined : saveAsList}>
            {savedList ? <><CheckIcon width={13} height={13} /> Saved — Account → Project lists</> : <><BookmarkIcon width={13} height={13} /> Save as a project list</>}
          </button>
        </div>
      </div>
      <div className="kit-bar">
        <Box style={{ minWidth: 0 }}>
          <Text size="1" color="gray" as="div">{pieces} pieces</Text>
          <Text size="3" weight="bold" as="div" style={{ letterSpacing: '-0.3px' }}>₹{total.toLocaleString('en-IN')}</Text>
        </Box>
        {done ? (
          <button className="qs-cta" style={{ margin: 0, flex: 1 }} onClick={onGoCart}>
            <span><CheckIcon width={14} height={14} style={{ marginRight: 6, verticalAlign: -2 }} />Kit added</span>
            <span>Go to cart</span>
          </button>
        ) : (
          <button className="qs-cta" style={{ margin: 0, flex: 1 }} onClick={addAll} disabled={live.length === 0}>
            <span>Add kit to cart</span>
            <span>{live.length} items</span>
          </button>
        )}
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
              <Text size="1" weight="bold" style={{ color: 'var(--gold-10)', marginLeft: 8, whiteSpace: 'nowrap' }}>
                ₹{correct * 25} in the bank
              </Text>
            </div>
            <div className="cz-chip"><span>{Math.ceil(tleft)}</span></div>
          </Flex>
          <div className="qbar" style={{ background: 'rgba(255,255,255,.18)', marginTop: 12 }}>
            <div
              className="qbar-fill"
              style={{ width: `${(tleft / QUIZ_SECONDS) * 100}%`, background: 'linear-gradient(90deg, var(--gold-10), var(--gold-4))' }}
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
        <Dialog.Title size="3" mb="3" align="center" style={{ color: 'var(--gold-10)', letterSpacing: '2px', textShadow: '0 2px 0 rgba(0,0,0,.4)' }}>
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
    const a = JSON.parse(safeGet('qc-streak-days') || '[]')
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
      try { safeSet('qc-streak-days', JSON.stringify([DAY])) } catch { /* storage off */ }
    } else {
      setDays(next)
      try { safeSet('qc-streak-days', JSON.stringify(next)) } catch { /* storage off */ }
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
    safeGet('qc-spin-day') === DAY ? 'used' : 'ready') // ready | spinning | done | used
  const [prize, setPrize] = useState(null)
  const segs = 360 / WHEEL.length

  const spin = () => {
    if (state !== 'ready') return
    const k = Math.floor(Math.random() * WHEEL.length)
    setRot(360 * 5 + (360 - (k * segs + segs / 2)))
    setState('spinning')
    safeSet('qc-spin-day', DAY)
    setTimeout(() => {
      setPrize(WHEEL[k])
      const c = couponFromWheel(WHEEL[k].label)
      if (c) saveCoupon(c)
      setState('done')
    }, 4200)
  }

  // thin gold separators between prize segments
  const gradient = WHEEL.map((s, i) =>
    `var(--gold-10) ${i * segs}deg ${i * segs + 1.4}deg, ${s.color} ${i * segs + 1.4}deg ${(i + 1) * segs}deg`
  ).join(', ')

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content className="wheel-dialog czn" maxWidth="360px" aria-describedby={undefined}>
        <Bulbs n={11} />
        <Dialog.Title size="3" align="center" mb="0" style={{ color: 'var(--gold-10)', letterSpacing: '2px', textShadow: '0 2px 0 rgba(0,0,0,.4)' }}>
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
          <Heading as="h2" size="4" style={{ letterSpacing: '-0.2px' }}>Your targets</Heading>
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
      <SectionHead title="Categories" />
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
    const s = JSON.parse(safeGet('qc-lists') || 'null')
    if (Array.isArray(s)) return s
  } catch { /* seed below */ }
  return LIST_SEED
}
const saveLists = (l) => safeSet('qc-lists', JSON.stringify(l))

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
      <input className="cp-input" autoComplete="address-line1" placeholder="Line 1 — shop / building no." value={l1} onChange={(e) => setL1(e.target.value)} />
      <input className="cp-input" autoComplete="address-line2" placeholder="Line 2 — street / area (optional)" value={l2} onChange={(e) => setL2(e.target.value)} />
      <input className="cp-input" placeholder="Landmark (optional)" value={lm} onChange={(e) => setLm(e.target.value)} />
      <Flex gap="2">
        <input className="cp-input" style={{ flex: 1.4 }} autoComplete="address-level2" placeholder="City" value={ct} onChange={(e) => setCt(e.target.value)} />
        <input
          className="cp-input" style={{ flex: 1 }} autoComplete="postal-code" placeholder="Pincode" inputMode="numeric" maxLength={6}
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
        <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>Save to project list</Heading>
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

function AcctLists({ onChange, onGoKit }) {
  const [lists, setLists] = useState(loadLists)
  const [openId, setOpenId] = useState(null)
  const [delArm, setDelArm] = useState(false)
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
        <button className="pl-back" onClick={() => { setOpenId(null); setDelArm(false) }}>
          <ArrowLeftIcon width={13} height={13} /> All lists
        </button>
        <div className="cp-card">
          <Flex align="center" justify="between">
            <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>{cur.name}</Heading>
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
        <button
          className={`pl-del ${delArm ? 'arm' : ''}`}
          onClick={() => {
            if (!delArm) { setDelArm(true); return }
            save(lists.filter(l => l.id !== cur.id))
            setOpenId(null)
            setDelArm(false)
          }}
        >
          {delArm ? 'Tap again to delete' : 'Delete list'}
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
          <>
            <Text size="1" color="gray" as="div">No lists yet — create one per site or job.</Text>
            {onGoKit && (
              <Button mt="2" size="2" variant="soft" color="green" radius="full" style={{ fontWeight: 800 }} onClick={onGoKit}>
                Start with a project kit
              </Button>
            )}
          </>
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
  try { gst = { ...gst, ...(JSON.parse(safeGet('qc-gst') || 'null') || {}) } } catch { /* defaults */ }
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
  try { paid = JSON.parse(safeGet('qc-paid') || '[]') } catch { /* none */ }
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
          <Text size="1" weight="bold" as="div" className="u-seclabel">
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
          <Text size="1" weight="bold" as="div" className="u-seclabel">
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
        <Text size="1" weight="bold" as="div" className="u-seclabel">
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
            <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>Pay ₹{payAmt.toLocaleString('en-IN')}</Heading>
            <Text size="1" color="gray" as="div" mt="1">
              {pay.length} bill{pay.length === 1 ? '' : 's'} · settles to QuickCart Trading Pvt Ltd
            </Text>
            <Text size="1" weight="bold" as="div" mt="4" className="u-seclabel">
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
            <Heading as="h2" size="5" mt="3" style={{ letterSpacing: '-0.3px' }}>Payment received</Heading>
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

const WaMark = ({ s = 19 }) => (
  <svg width={s} height={s} viewBox="0 0 32 32" aria-hidden="true">
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
      <Heading as="h2" style={{ fontSize: 31, letterSpacing: '-1px', marginTop: 4 }}>
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
                type="tel" autoComplete="tel" inputMode="numeric" maxLength={10} placeholder="Phone number" aria-label="Phone number"
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
          <Text size="1" color="gray" as="div" mt="2" style={{ textAlign: 'center' }}>
            Demo build — no SMS goes out
          </Text>
          <div className="lg-or"><span>or</span></div>
          <button className="lg-soc wa" onClick={onDone}><WaMark /> Continue with WhatsApp</button>
          <Text size="2" as="div" mt="4" style={{ textAlign: 'center' }}>
            or <button type="button" className="lg-link" onClick={onDone}>continue as guest</button>
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
            className="lg-otp" autoComplete="one-time-code" inputMode="numeric" maxLength={4} placeholder="••••" aria-label="One-time code"
            value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          />
          <button className="lg-cta" disabled={otp.length !== 4} onClick={onDone}>Verify & continue</button>
          <Text size="2" as="div" mt="4" style={{ textAlign: 'center' }}>
            <button type="button" className="lg-link" onClick={() => setStage('cred')}>Change number</button>
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
        <span key={i} style={{ height: `${22 + 78 * (v / mx)}%`, background: i === hi ? 'var(--gold-10)' : color }} />
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
              cx="37" cy="37" r="30" style={{ stroke: 'var(--gold-9)' }} strokeWidth="7" fill="none" strokeLinecap="round"
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
          <Text style={{ fontSize: 10.5, color: 'var(--gold-10)', fontWeight: 800 }}>{tt.note}</Text>
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
          <Text size="1" style={{ color: 'var(--gold-10)', fontWeight: 700 }}>Best month</Text>
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
          <span className="bdg-ic" style={{ background: 'rgba(245,194,66,.14)', color: 'var(--gold-10)' }}>
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
          <span className="bdg-ic" style={{ background: 'rgba(245,194,66,.14)', color: 'var(--gold-10)' }}>
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
  useSheetA11y(onClose) // Escape-to-close
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
        <Heading as="h2" size="4" style={{ flex: 1, letterSpacing: '-0.3px' }}>PO {order.id}</Heading>
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
              <Text size="1" weight="bold" className="u-seclabel">
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
          <Text size="1" weight="bold" as="div" className="u-seclabel">ITEMS</Text>
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
        <Text size="1" weight="bold" as="div" className="u-seclabel">MONTHLY TIER PERKS</Text>
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
        <Text size="1" weight="bold" as="div" className="u-seclabel">
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
  const valid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst.gstin.toUpperCase())
  return (
    <div className="cp-card">
      <Flex align="center" justify="between">
        <Text size="1" weight="bold" className="u-seclabel">GST DETAILS</Text>
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
  const [armed, setArmed] = useState(null) // two-tap delete
  const [adding, setAdding] = useState(false)
  const addNew = (a) => {
    const next = [...addrs, a]
    setAddrs(next)
    safeSet('qc-addr', JSON.stringify(next))
    setSel(a.id)
    setAdding(false)
  }
  const remove = (id) => {
    const next = addrs.filter(a => a.id !== id)
    setAddrs(next)
    safeSet('qc-addr', JSON.stringify(next))
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
            armed === a.id ? (
              <button className="addr-delc" onClick={() => { remove(a.id); setArmed(null) }}>Delete?</button>
            ) : (
              <button className="reco-x" onClick={() => setArmed(a.id)} aria-label="Delete"><Cross2Icon width={12} height={12} /></button>
            )
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
          <Text size="1" weight="bold" className="u-seclabel">
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

        <Text size="1" weight="bold" as="div" mt="2" mb="1" className="u-seclabel">
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
            <Text size="1" weight="bold" as="div" mt="2" mb="1" className="u-seclabel">
              SITE ADDRESS
            </Text>
            <input className="cp-input" placeholder="Line 1 — building / site no." value={l1} onChange={(e) => setL1(e.target.value)} />
            <input className="cp-input" placeholder="Line 2 — street / area (optional)" value={l2} onChange={(e) => setL2(e.target.value)} />
            <input className="cp-input" placeholder="Landmark (optional)" value={lm} onChange={(e) => setLm(e.target.value)} />
            <Flex gap="2">
              <input className="cp-input" style={{ flex: 1.4 }} autoComplete="address-level2" placeholder="City" value={ct} onChange={(e) => setCt(e.target.value)} />
              <input
                className="cp-input" style={{ flex: 1 }} autoComplete="postal-code" placeholder="Pincode" inputMode="numeric" maxLength={6}
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
            <Text size="1" weight="bold" className="u-seclabel">
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
          <Text size="1" weight="bold" as="div" className="u-seclabel">
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
      <div className="sub-hero orange stack">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--orange-11)', fontSize: 10, letterSpacing: '.6px' }}>
          BRAND SUPPORT
        </Text>
        <Text size="2" weight="bold" as="div" mt="1">Boards, demos, meets & promo stock — on us</Text>
        <Text size="1" color="gray" as="div">Approved by your area manager · tracked right here</Text>
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
            <Text size="1" weight="bold" className="u-seclabel">
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
              <Text size="1" weight="bold" as="div" mt="3" className="u-seclabel">
                {type === 'Branding kit' ? 'BOARDS / STANDEES NEEDED' : 'APPROX. PIECES NEEDED'}
              </Text>
              <input
                className="cp-input" style={{ marginTop: 4 }} type="number" min="1" placeholder="e.g. 2"
                value={qty} onChange={(e) => setQty(e.target.value)}
              />
            </>
          ) : (
            <>
              <Text size="1" weight="bold" as="div" mt="3" mb="1" className="u-seclabel">
                PREFERRED DATE
              </Text>
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
        <Text size="1" weight="bold" as="div" className="u-seclabel">
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
            <Text size="1" weight="bold" className="u-seclabel">
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
          <Text size="1" weight="bold" as="div" mt="3" className="u-seclabel">
            CLAIM TYPE
          </Text>
          <div className="claim-types">
            {CLAIM_TYPES.map(t => (
              <button key={t} className={`seg-b ${type === t ? 'on' : ''}`} onClick={() => setType(t)}>{t}</button>
            ))}
          </div>
          {order && (
            <>
              <Text size="1" weight="bold" as="div" mt="3" className="u-seclabel">
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
        <Text size="1" weight="bold" as="div" className="u-seclabel">
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
        <Text size="1" weight="bold" as="div" className="u-seclabel">FAQS</Text>
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

// Calculators / BOM / Claims now live in the Utilities tab, so they're not duplicated here
// Calculators / BOM / Claims / Brand support / Site & Display visits now live in Utilities
const ACCT_FLAT = [
  ['support', ChatBubbleIcon, 'Support'],
  ['notif', BellIcon, 'Notification preferences'],
  ['privacy', LockClosedIcon, 'Account privacy'],
]

// per-row accent for the glossy 3D icon tiles
const ACCT_ICO = {
  calc: 'blue', claims: 'orange', site: 'teal', display: 'violet',
  brand: 'pink', boms: 'green', support: 'indigo', notif: 'amber', privacy: 'slate',
}

const ACCT_TITLES = {
  dash: 'Performance dashboard', orders: 'My orders', credit: 'Credit ledger',
  lists: 'Project lists', schemes: 'Schemes & discounts',
  gst: 'GST details', calc: 'Calculators', site: 'Submit site visit',
  display: 'Display centre visit', support: 'Support', claims: 'Claims & returns', brand: 'Brand support', addr: 'Address book',
  notif: 'Notification preferences', privacy: 'Account privacy',
  estpdf: 'BOM PDF settings', boms: 'BOM',
}

/* Estimate PDF branding: company name, logo upload, text colours */
/* live mini-mockups of the three BOM layouts, tinted by the chosen colours */
function AcctEstPdf() {
  const [saved, setBrand] = usePersisted('qc-est-brand', EST_BRAND_DEFAULT)
  const brand = { ...EST_BRAND_DEFAULT, ...saved, dealer: { ...EST_BRAND_DEFAULT.dealer, ...(saved && saved.dealer) } }
  const set = (k, v) => setBrand({ ...brand, [k]: v })
  const setDealer = (k) => (e) => setBrand({ ...brand, dealer: { ...brand.dealer, [k]: e.target.value } })
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
  const [busy, setBusy] = useState(false)
  const previewSample = async () => {
    if (busy) return
    setBusy(true)
    try {
      const items = NEW_EBCO.slice(0, 5).map((p, i) => ({ p, n: [4, 2, 6, 1, 3][i] }))
      const itemTotal = items.reduce((s, { p, n }) => s + p.price * n, 0)
      const bulkSave = Math.round(itemTotal * 0.04), schemeOff = Math.round(itemTotal * 0.05)
      const bill = { itemTotal, bulkSave, schemeOff, slabPct: 5, fee: 0, express: false, toPay: itemTotal - bulkSave - schemeOff, special: 0 }
      const cust = { name: 'Sample Customer', phone: '+91 90000 00000', site: 'Sample Site · Koramangala, Bengaluru', refBy: '' }
      const { blob } = await generateEstimate({ cust, items, bill, brand, out: 'blob' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (e) { console.error('[QuickCart] sample preview failed', e) }
    finally { setBusy(false) }
  }
  // normalise stale/removed template ids (e.g. a previously-saved 'japan') to a live one
  const tpl = ['classic', 'bold', 'studio'].includes(brand.template) ? brand.template : 'classic'
  const tplName = { classic: 'Classic', bold: 'Bold', studio: 'Studio' }[tpl]
  const fontName = (EST_FONTS[brand.font || 'pjs'] || [])[2] || 'Plus Jakarta Sans'
  const tplMeta = tpl === 'classic' ? `logos ${brand.logosPos || 'top'}` : '4 brand logos'
  return (
    <>
      <div className="cp-card est-hero">
        <div className="est-hero-prev">
          <TplCard
            k={tpl} label={`Preview ${tplName} sample`}
            active={false} paper={brand.paper || '#F8F5ED'} accent={brand.accent || '#CDE76D'}
            onClick={previewSample}
          />
        </div>
        <div className="est-hero-body">
          <Text size="1" weight="bold" as="div" className="u-seclabel">YOUR CUSTOMER BOM</Text>
          <Text size="5" weight="bold" as="div" style={{ letterSpacing: '-0.4px', lineHeight: 1.1, margin: '2px 0' }}>{brand.name}</Text>
          <Text size="1" color="gray" as="div">{tplName} · {fontName} · {tplMeta}</Text>
          <Button size="2" color="green" radius="full" highContrast onClick={previewSample} disabled={busy} style={{ fontWeight: 800, marginTop: 10, alignSelf: 'flex-start' }}>
            <EyeOpenIcon /> {busy ? 'Building…' : 'Preview sample BOM'}
          </Button>
        </div>
      </div>

      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">
          COMPANY ON THE PDF
        </Text>
        <Flex direction="column" gap="2" mt="2">
          <input className="cp-input" style={{ fontSize: 16 }} placeholder="Company name" value={brand.name} onChange={(e) => set('name', e.target.value)} />
          <input className="cp-input" style={{ fontSize: 16 }} placeholder="Prepared by (your name)" value={brand.preparedBy || ''} onChange={(e) => set('preparedBy', e.target.value)} />
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
        <Text size="1" color="gray" as="div" mt="2">Shown at the top-right of every customer BOM.</Text>
      </div>

      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">
          TEMPLATE
        </Text>
        <div className="tpl-grid">
          {[['classic', 'Classic'], ['bold', 'Bold'], ['studio', 'Studio']].map(([k, l]) => (
            <TplCard
              key={k} k={k} label={l}
              active={tpl === k}
              paper={brand.paper || '#F8F5ED'} accent={brand.accent || '#CDE76D'}
              onClick={() => set('template', k)}
            />
          ))}
        </div>
        <Text size="1" color="gray" as="div" mt="2">
          Classic — hairlines, logos on top. Bold — colour bands, logos below. Studio — editorial caps, amount in words.
        </Text>
        <Text size="1" weight="bold" as="div" mt="3" className="u-seclabel">
          FONT
        </Text>
        <Flex gap="2" mt="2" wrap="wrap">
          {Object.entries(EST_FONTS).map(([k, [, , label]]) => (
            <Button
              key={k} size="1" radius="full"
              variant={(brand.font || 'pjs') === k ? 'solid' : 'soft'}
              color={(brand.font || 'pjs') === k ? 'green' : 'gray'}
              style={{ fontWeight: 800 }}
              onClick={() => set('font', k)}
            >
              {label}
            </Button>
          ))}
        </Flex>
        <Text size="1" weight="bold" as="div" mt="3" className="u-seclabel">
          BRAND LOGOS (CLASSIC)
        </Text>
        <Flex gap="2" mt="2">
          {[['top', 'Top'], ['bottom', 'Bottom']].map(([k, l]) => (
            <Button
              key={k} size="1" radius="full"
              variant={(brand.logosPos || 'top') === k ? 'solid' : 'soft'}
              color={(brand.logosPos || 'top') === k ? 'green' : 'gray'}
              style={{ fontWeight: 800 }}
              onClick={() => set('logosPos', k)}
            >
              {l}
            </Button>
          ))}
        </Flex>
      </div>

      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">
          PDF COLOURS
        </Text>
        <ColorRow label="PAPER BACKGROUND" value={brand.paper} onChange={(v) => set('paper', v)} swatches={EST_PAPERS} />
        <ColorRow label="ACCENT (BOLD TEMPLATE)" value={brand.accent || '#CDE76D'} onChange={(v) => set('accent', v)} swatches={['#CDE76D', 'var(--gold-9)', '#9BE3C0', '#F2B8A0', '#BFD3F2', '#E8C7F2']} />
        <ColorRow label="COMPANY NAME" value={brand.wordmark} onChange={(v) => set('wordmark', v)} />
        <ColorRow label="FOOTER TEXT" value={brand.footer} onChange={(v) => set('footer', v)} />
        <ColorRow label="SIDE VERTICAL TEXT" value={brand.side} onChange={(v) => set('side', v)} />
        <Text size="1" color="gray" as="div" mt="3">Hairlines tint themselves to the paper; item rows and totals stay ink for readability.</Text>
      </div>

      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">
          CONTENT
        </Text>
        <Flex align="center" justify="between" mt="2">
          <div>
            <Text size="2" weight="bold" as="div">Product photos</Text>
            <Text size="1" color="gray" as="div">Off packs more line items per page</Text>
          </div>
          <Toggle on={brand.photos !== false} onToggle={() => set('photos', brand.photos === false)} />
        </Flex>
        <Text size="1" weight="bold" as="div" mt="3" className="u-seclabel">
          VALID FOR
        </Text>
        <Flex gap="2" mt="2">
          {[3, 7, 14, 30].map(dv => (
            <Button
              key={dv} size="1" radius="full"
              variant={(brand.validDays || 7) === dv ? 'solid' : 'soft'}
              color={(brand.validDays || 7) === dv ? 'green' : 'gray'}
              style={{ fontWeight: 800 }}
              onClick={() => set('validDays', dv)}
            >
              {dv} days
            </Button>
          ))}
        </Flex>
        <Text size="1" weight="bold" as="div" mt="3" className="u-seclabel">
          NOTE ON EVERY BOM
        </Text>
        <textarea
          className="cp-note" style={{ fontSize: 16 }} rows={3}
          value={brand.note ?? EST_BRAND_DEFAULT.note}
          onChange={(e) => set('note', e.target.value)}
        />
        <Text size="1" color="gray" as="div" mt="1">Wrap words in **double asterisks** to make them bold on the PDF.</Text>
      </div>

      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">
          DEALER DETAILS ON THE PDF
        </Text>
        <Flex direction="column" gap="2" mt="2">
          <input className="cp-input" style={{ fontSize: 16 }} placeholder="Address line" value={brand.dealer.addr1} onChange={setDealer('addr1')} />
          <input className="cp-input" style={{ fontSize: 16 }} placeholder="City · PIN" value={brand.dealer.addr2} onChange={setDealer('addr2')} />
          <Flex gap="2">
            <input className="cp-input" style={{ fontSize: 16, flex: 1, minWidth: 0 }} type="tel" placeholder="Phone" value={brand.dealer.phone} onChange={setDealer('phone')} />
            <input className="cp-input" style={{ fontSize: 16, flex: 1, minWidth: 0 }} placeholder="GSTIN" value={brand.dealer.gstin} onChange={setDealer('gstin')} />
          </Flex>
          <Flex gap="2">
            <input className="cp-input" style={{ fontSize: 16, flex: 1, minWidth: 0 }} type="email" placeholder="Email" value={brand.dealer.email} onChange={setDealer('email')} />
            <input className="cp-input" style={{ fontSize: 16, flex: 1, minWidth: 0 }} placeholder="Website" value={brand.dealer.website} onChange={setDealer('website')} />
          </Flex>
        </Flex>
      </div>

      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">
          TERMS ON THE PDF
        </Text>
        <Text size="1" color="gray" as="div" mt="1">Shown in a panel under the items. Leave blank to hide.</Text>
        <Flex direction="column" gap="2" mt="2">
          <textarea
            className="cp-note" style={{ fontSize: 16 }} rows={3}
            placeholder="Terms & conditions (one per line). Wrap **words** to bold them."
            value={brand.terms}
            onChange={(e) => set('terms', e.target.value)}
          />
        </Flex>
      </div>

      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">
          DOCUMENT
        </Text>
        <Flex direction="column" gap="2" mt="2">
          <input className="cp-input" style={{ fontSize: 16 }} placeholder="Document title" value={brand.docTitle} onChange={(e) => set('docTitle', e.target.value)} />
          <input className="cp-input" style={{ fontSize: 16 }} placeholder="Watermark (empty = none, e.g. DRAFT)" value={brand.watermark} onChange={(e) => set('watermark', e.target.value)} />
        </Flex>
      </div>

      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">
          PRICING ON THE PDF
        </Text>
        <Flex align="center" justify="between" mt="2">
          <div>
            <Text size="2" weight="bold" as="div">Show prices</Text>
            <Text size="1" color="gray" as="div">Off makes a quantities-only material list</Text>
          </div>
          <Toggle on={brand.showPrices !== false} onToggle={() => set('showPrices', brand.showPrices === false)} />
        </Flex>
        {brand.showPrices !== false && (
          <>
            <Flex align="center" justify="between" mt="3">
              <div>
                <Text size="2" weight="bold" as="div">Show savings rows</Text>
                <Text size="1" color="gray" as="div">Off shows net prices without discount lines</Text>
              </div>
              <Toggle on={brand.showSavings !== false} onToggle={() => set('showSavings', brand.showSavings === false)} />
            </Flex>
            <Flex align="center" justify="between" mt="3">
              <div>
                <Text size="2" weight="bold" as="div">Volume scheme discount</Text>
                <Text size="1" color="gray" as="div">Off keeps the scheme off the customer BOM</Text>
              </div>
              <Toggle on={brand.showScheme !== false} onToggle={() => set('showScheme', brand.showScheme === false)} />
            </Flex>
            <Text size="1" weight="bold" as="div" mt="3" className="u-seclabel">
              GST LINE
            </Text>
            <Flex gap="2" mt="2">
              {[[0, 'Off'], [5, '5%'], [12, '12%'], [18, '18%'], [28, '28%']].map(([v, l]) => (
                <Button
                  key={v} size="1" radius="full"
                  variant={(Number(brand.gstPct) || 0) === v ? 'solid' : 'soft'}
                  color={(Number(brand.gstPct) || 0) === v ? 'green' : 'gray'}
                  style={{ fontWeight: 800 }}
                  onClick={() => set('gstPct', v)}
                >
                  {l}
                </Button>
              ))}
            </Flex>
          </>
        )}
      </div>
    </>
  )
}

function AccountPage({ onClose, onChange, lastOrder, subRef, initialSub, onCategory, onGoReorder, onGoKit }) {
  // a stack so back goes up ONE level (e.g. estpdf -> boms) instead of exiting outright
  const [subStack, setSubStack] = useState(() => {
    const h = window.location.hash
    let init = null
    if (h === '#dash') init = 'dash'
    else if (h === '#credit') init = 'credit'
    else if (h === '#lists') init = 'lists'
    else if (h === '#orders' || h === '#ordpg') init = 'orders'
    else if (h === '#claims') init = 'claims'
    else if (h === '#brand') init = 'brand'
    else if (h === '#site') init = 'site'
    else init = initialSub || null
    return init ? [init] : []
  })
  const sub = subStack.length ? subStack[subStack.length - 1] : null
  const setSub = (s) => setSubStack(s ? [s] : [])        // open from the account root / exit
  const pushSub = (s) => {                               // go one level deeper, keeping the back trail
    window.history.pushState({ qcAcctSub: true }, '')
    setSubStack(st => [...st, s])
  }
  const [lo, setLo] = useState(null) // null | 'confirm' | 'out'
  subRef.current = sub !== null
  const backSub = () => {
    if (window.history.state?.qcAcctSub) window.history.back()
    else setSubStack(st => (st.length > 1 ? st.slice(0, -1) : []))
  }
  useEffect(() => {
    if (!sub) return
    if (!window.history.state?.qcAcctSub) window.history.pushState({ qcAcctSub: true }, '')
    const onPop = () => { if (!ordPgRef.current) setSubStack(st => st.slice(0, -1)) }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [sub !== null]) // eslint-disable-line react-hooks/exhaustive-deps
  const renderSub = () => {
    switch (sub) {
      case 'dash': return <AcctDash onReorder={onGoReorder} />
      case 'orders': return <AcctOrders lastOrder={lastOrder} onChange={onChange} />
      case 'credit': return <AcctCredit />
      case 'lists': return <AcctLists onChange={onChange} onGoKit={onGoKit} />
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
      case 'boms': return <AcctBoms onSettings={() => pushSub('estpdf')} />
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
        <Heading as="h2" mt="4" style={{ fontSize: 27, letterSpacing: '-0.8px' }}>Virag Bora</Heading>
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
                <Text size="1" weight="bold" className="u-seclabel">
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
              <span className={`flat-ic c-${ACCT_ICO[key] || 'slate'}`}><Icon width={15} height={15} /></span>
              <Text size="2" weight="medium" style={{ flex: 1, textAlign: 'left' }}>{t}</Text>
              <ChevronRightIcon width={15} height={15} color="var(--gray-8)" />
            </button>
          ))}
        </div>

        <div className="cp-card" style={{ padding: '2px 16px' }}>
          <button className="flat-row" onClick={() => setLo('confirm')}>
            <span className="flat-ic c-red"><ExitIcon width={15} height={15} /></span>
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
            <Heading as="h2" size="4" style={{ flex: 1, letterSpacing: '-0.3px' }}>{ACCT_TITLES[sub]}</Heading>
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
                <Heading as="h2" size="5" style={{ letterSpacing: '-0.3px' }}>Log out?</Heading>
                <Text size="2" color="gray" as="div" mt="1">Your cart and preferences stay saved on this device.</Text>
                <Flex gap="2" mt="4">
                  <Button size="3" variant="soft" color="gray" radius="full" style={{ fontWeight: 800, flex: 1 }} onClick={() => setLo(null)}>Cancel</Button>
                  <Button size="3" color="red" radius="full" style={{ fontWeight: 800, flex: 1 }} onClick={() => setLo('out')}>Log out</Button>
                </Flex>
              </>
            ) : (
              <>
                <div className="od-tick">✓</div>
                <Heading as="h2" size="5" mt="3" style={{ letterSpacing: '-0.3px' }}>Logged out</Heading>
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

/* qty presets follow the SKU's bulk tier: ease-in, unlock point, stock-up */
const packsFor = (p, maxN) => {
  const t = bulkTier(p)
  const base = t ? [...new Set([Math.max(1, Math.ceil(t.thr / 2)), t.thr, t.thr * 5])] : [10, 50, 100]
  return base.filter(k => k <= maxN).slice(0, 3)
}

function QtySheet({ q, onClose, onConfirm }) {
  const p = q.p
  const maxN = p.stock != null && p.stock > 0 ? p.stock : 999
  const packs = packsFor(p, maxN)
  const [n, setN] = useState(() => Math.min(packs[0] ?? 10, maxN))
  const nv = n === '' ? 1 : n
  const tier = bulkTier(p)
  const unlocked = tier && nv >= tier.thr
  const saved = unlocked ? (p.price - tier.bp) * nv : 0
  const shRef = useRef(null)
  const a11yRef = useSheetA11y(onClose)
  const drag = useRef(null)
  const dStart = (e) => { drag.current = { y: e.touches[0].clientY, dy: 0 } }
  const dMove = (e) => {
    const d = drag.current
    const el = shRef.current
    if (!d || !el) return
    d.dy = Math.max(0, e.touches[0].clientY - d.y)
    el.style.transition = 'none'
    el.style.transform = `translateY(${d.dy}px)`
  }
  const dEnd = () => {
    const d = drag.current
    const el = shRef.current
    drag.current = null
    if (!el) return
    el.style.transition = 'transform .22s cubic-bezier(.22, 1, .36, 1)'
    if ((d?.dy || 0) > 90) {
      el.style.transform = 'translateY(105%)'
      setTimeout(onClose, 170)
    } else {
      el.style.transform = 'translateY(0)'
    }
  }
  return (
    <div className="qsheet-overlay" onClick={onClose}>
      <div
        className="qsheet" role="dialog" aria-modal="true" aria-label={`Select quantity — ${p.name}`} tabIndex={-1}
        ref={(el) => { shRef.current = el; a11yRef.current = el }} onClick={(e) => e.stopPropagation()}
      >
        <div
          className="qsheet-grab drag" onTouchStart={dStart} onTouchMove={dMove}
          onTouchEnd={dEnd} onTouchCancel={dEnd}
        />
        <div className="qs-prod">
          <Img src={img(p.ph, 140)} alt="" />
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Text size="2" weight="bold" as="div" className="clamp2" style={{ lineHeight: 1.3 }}>{p.name}</Text>
            {p.qty && <Text size="1" color="gray" as="div" truncate>{p.qty}</Text>}
            <Flex align="center" gap="2" mt="1">
              <Text size="2" weight="bold">₹{p.price.toLocaleString('en-IN')}</Text>
              {p.mrp && <Text size="1" color="gray" style={{ textDecoration: 'line-through' }}><span className="sr-only">M.R.P. </span>₹{p.mrp.toLocaleString('en-IN')}</Text>}
              {tier && <span className="qs-bulkpill">{tier.thr}+ @ ₹{tier.bp.toLocaleString('en-IN')}</span>}
            </Flex>
          </Box>
        </div>
        <Text size="1" weight="bold" as="div" mt="4" className="u-seclabel">
          SELECT QUANTITY
        </Text>
        <div className="qs-chips">
          {packs.map(k => (
            <button key={k} className={`qs-chip ${nv === k ? 'on' : ''}`} disabled={k > maxN} onClick={() => setN(k)}>
              {tier && k >= tier.thr && <span className="qs-off">{tier.pct}% OFF</span>}
              <span className="qn">{k}</span>
              <span className="qp">₹{(k * (tier && k >= tier.thr ? tier.bp : p.price)).toLocaleString('en-IN')}</span>
            </button>
          ))}
        </div>
        <div className="qs-step">
          <button className="qs-sbtn" onClick={() => setN(v => Math.max(1, (v === '' ? 2 : v) - 1))} aria-label="Less"><MinusIcon /></button>
          <input
            className="qs-qin" type="number" inputMode="numeric" min={1} max={maxN} value={n} aria-label="Quantity"
            onChange={(e) => {
              if (e.target.value === '') return setN('')
              const v = parseInt(e.target.value, 10)
              if (!Number.isNaN(v)) setN(Math.min(maxN, Math.max(1, v)))
            }}
            onBlur={() => { if (n === '') setN(1) }}
          />
          <button className="qs-sbtn" onClick={() => setN(v => Math.min(maxN, (v === '' ? 0 : v) + 1))} aria-label="More"><PlusIcon /></button>
          <Text size="1" color="gray" style={{ marginLeft: 'auto' }}>tap the number to type</Text>
        </div>
        {tier && (
          <div className={`qs-meter ${unlocked ? 'done' : ''}`}>
            <Text size="1" weight="bold" as="div" style={{ color: unlocked ? 'var(--green-11)' : 'var(--amber-11)', display: 'flex', alignItems: 'center', gap: 5 }}>
              {unlocked && <CheckIcon width={12} height={12} style={{ flex: 'none' }} />}
              {unlocked
                ? `${tier.pct}% bulk price applied — you save ₹${saved.toLocaleString('en-IN')}`
                : `Add ${tier.thr - nv} more to unlock ₹${tier.bp.toLocaleString('en-IN')}/pc (${tier.pct}% off)`}
            </Text>
            <div className="qs-mbar"><div style={{ width: `${Math.min(100, (nv / tier.thr) * 100)}%` }} /></div>
          </div>
        )}
        <button className="qs-cta" onClick={(e) => onConfirm(nv, e)}>
          <span>Add {nv} {nv === 1 ? 'piece' : 'pieces'}</span>
          <span>
            ₹{lineTotal(p, nv).toLocaleString('en-IN')}
            {unlocked && (
              <s style={{ opacity: .65, fontWeight: 600, marginLeft: 7, fontSize: 12 }}>
                ₹{(nv * p.price).toLocaleString('en-IN')}
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
      <button className="swipe-x" onClick={onRemove} aria-label="Remove">
        <Cross2Icon width={11} height={11} />
      </button>
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
    <div className="ro-row" {...(openPdp ? btnish(() => openPdp(p)) : {})}>
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
            <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>{order.date}</Heading>
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
          <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>Reorder</Heading>
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
              <Text size="1" weight="bold" as="div" className="u-seclabel">
                YOUR REGULARS
              </Text>
              {regular.map(m => (
                <SwipeRow key={m.id} onRemove={() => removeRow(m)}>
                  <RoRow m={m} onAdd={addUsual} onStep={step} onCustom={custom} />
                </SwipeRow>
              ))}
            </div>

            <div className="cp-card">
              <Text size="1" weight="bold" as="div" className="u-seclabel">
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

/* ---------------- Cart page — items, schemes, address, instructions ---------------- */

function loadAddrs() {
  try {
    const s = JSON.parse(safeGet('qc-addr') || 'null')
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
        <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>Delivery address</Heading>
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

/* ---------------- Saved BOMs (#8) — persist, re-download, view, share ---------------- */
const loadBoms = () => getJSON('qc-boms', [])
const saveBom = (rec) => setJSON('qc-boms', [rec, ...loadBoms()].slice(0, 50))
const fullBrand = (b) => ({ ...EST_BRAND_DEFAULT, ...b, dealer: { ...EST_BRAND_DEFAULT.dealer, ...(b && b.dealer) } })
const bomItems = (rec) => rec.items.map(it => ({ p: { id: it.id, name: it.name, qty: it.qty, price: it.price, ph: it.ph }, n: it.n, disc: it.disc || 0 }))
// re-generate a saved BOM with CURRENT branding but its original content + number/date/template
const regenBom = (rec, out) => generateEstimate({
  cust: rec.cust, items: bomItems(rec), bill: rec.bill,
  brand: { ...fullBrand(getJSON('qc-est-brand', EST_BRAND_DEFAULT)), template: rec.template },
  out, meta: { no: rec.no, date: rec.ts },
})
const viewBom = async (rec) => {
  const { blob } = await regenBom(rec, 'blob')
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
const shareBom = async (rec) => {
  const { blob, filename } = await regenBom(rec, 'blob')
  const file = new File([blob], filename, { type: 'application/pdf' })
  const text = `BOM ${rec.no} for ${rec.cust.name} — ₹${(rec.total || 0).toLocaleString('en-IN')}`
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename, text }) } catch { /* cancelled */ }
  } else {
    regenBom(rec, 'save') // desktop: no file-share — download so it can be attached
  }
}
const waBom = (rec) => window.open(`https://wa.me/?text=${encodeURIComponent(`BOM ${rec.no} for ${rec.cust.name} — ₹${(rec.total || 0).toLocaleString('en-IN')}. Sending the BOM PDF next.`)}`, '_blank')
const mailBom = (rec) => { window.location.href = `mailto:?subject=${encodeURIComponent(`BOM ${rec.no}`)}&body=${encodeURIComponent(`BOM ${rec.no} for ${rec.cust.name} — ₹${(rec.total || 0).toLocaleString('en-IN')}.\n\nThe BOM PDF is attached separately.`)}` }

function EstimateSheet({ items, bill, onClose, onSettings }) {
  const [cust, setCust] = usePersisted('qc-est-cust', { name: '', phone: '', site: '', refBy: '' })
  const [brand] = usePersisted('qc-est-brand', EST_BRAND_DEFAULT)
  const [special, setSpecial] = useState('')
  const [disc, setDisc] = useState({})
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const discOf = (p, n) => Math.min(p.price * n, Math.max(0, Number(disc[p.id]) || 0))
  const grossItems = items.reduce((s, { p, n }) => s + p.price * n, 0)
  const lineDisc = items.reduce((s, { p, n }) => s + discOf(p, n), 0)
  const specialN = Math.max(0, Number(special) || 0)
  const grandTotal = Math.max(0, bill.toPay - lineDisc - specialN)
  const go = async () => {
    setBusy(true)
    setErr(null)
    try {
      const itemsOut = items.map(it => ({ ...it, disc: discOf(it.p, it.n) }))
      const billOut = { ...bill, special: specialN }
      const res = await generateEstimate({ cust, items: itemsOut, bill: billOut, brand: fullBrand(brand) })
      saveBom({
        no: res.no, ts: Date.now(), cust, total: res.grand, count: items.length,
        template: brand.template || 'classic', bill: billOut,
        items: items.map(({ p, n }) => ({ id: p.id, name: p.name, qty: p.qty, price: p.price, ph: p.ph, n, disc: discOf(p, n) })),
      })
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
        <Flex align="center" justify="between">
          <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>Bill of Materials</Heading>
          {onSettings && (
            <button className="bom-set-btn" onClick={onSettings} aria-label="BOM PDF settings">
              <GearIcon width={15} height={15} /> Settings
            </button>
          )}
        </Flex>
        <Text size="1" color="gray" as="div" mt="1">
          {items.length} item{items.length === 1 ? '' : 's'} · ₹{grandTotal.toLocaleString('en-IN')} — branded BOM PDF for your customer.
        </Text>

        <Text size="1" weight="bold" className="u-seclabel" as="div" style={{ marginTop: 14 }}>LINE ITEMS · set a discount per line</Text>
        <div className="bom-lines">
          {items.map(({ p, n }) => {
            const gross = p.price * n
            const d = discOf(p, n)
            return (
              <div className="bom-line" key={p.id}>
                <Img src={img(p.ph, 80)} alt="" />
                <div className="bom-line-tx">
                  <Text size="1" weight="bold" as="div" className="clamp1">{p.name}</Text>
                  <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>{n} × ₹{p.price.toLocaleString('en-IN')} = ₹{gross.toLocaleString('en-IN')}</Text>
                </div>
                <div className="bom-disc">
                  <span>₹</span>
                  <input
                    type="number" inputMode="numeric" min="0" max={gross} placeholder="0" aria-label={`Discount for ${p.name}`}
                    value={disc[p.id] || ''} onChange={(e) => setDisc({ ...disc, [p.id]: e.target.value })}
                  />
                </div>
                <Text size="1" weight="bold" as="div" className="bom-net">₹{(gross - d).toLocaleString('en-IN')}</Text>
              </div>
            )
          })}
        </div>

        <div className="bom-tot">
          <Flex justify="between"><Text size="1" color="gray">Items total</Text><Text size="1" weight="bold">₹{grossItems.toLocaleString('en-IN')}</Text></Flex>
          {lineDisc > 0 && (
            <Flex justify="between" mt="1"><Text size="1" style={{ color: 'var(--green-11)' }}>Line discounts</Text><Text size="1" weight="bold" style={{ color: 'var(--green-11)' }}>−₹{lineDisc.toLocaleString('en-IN')}</Text></Flex>
          )}
          {specialN > 0 && (
            <Flex justify="between" mt="1"><Text size="1" style={{ color: 'var(--green-11)' }}>Extra discount</Text><Text size="1" weight="bold" style={{ color: 'var(--green-11)' }}>−₹{specialN.toLocaleString('en-IN')}</Text></Flex>
          )}
          <div className="cp-divider" style={{ margin: '8px 0' }} />
          <Flex justify="between"><Text size="2" weight="bold">Customer total</Text><Text size="2" weight="bold">₹{grandTotal.toLocaleString('en-IN')}</Text></Flex>
        </div>

        <Flex direction="column" gap="2" mt="3">
          <input className="cp-input" style={{ fontSize: 16 }} placeholder="Customer / site name" autoComplete="name" value={cust.name} onChange={f('name')} />
          <input className="cp-input" style={{ fontSize: 16 }} type="tel" inputMode="tel" autoComplete="tel" placeholder="Phone (optional)" value={cust.phone} onChange={f('phone')} />
          <textarea className="cp-note" style={{ fontSize: 16 }} rows={2} placeholder="Site address (optional)" value={cust.site} onChange={f('site')} />
          <input className="cp-input" style={{ fontSize: 16 }} placeholder="Ref. by (optional) — e.g. visited earlier" value={cust.refBy || ''} onChange={f('refBy')} />
          <input className="cp-input" style={{ fontSize: 16 }} type="number" inputMode="numeric" min="0" placeholder="Extra discount ₹ on the whole bill (optional)" value={special} onChange={(e) => setSpecial(e.target.value)} />
        </Flex>
        {err && <Text size="1" as="div" mt="2" style={{ color: 'var(--red-10)', fontWeight: 700 }}>{err}</Text>}
        <button className="qs-cta" style={{ justifyContent: 'center', gap: 7 }} disabled={!cust.name.trim() || busy} onClick={go}>
          <FileTextIcon width={15} height={15} /> {busy ? 'Preparing PDF…' : 'Download BOM PDF'}
        </button>
      </div>
    </div>
  )
}

/* Saved BOMs list — re-view / re-download / share past BOMs (#8) */
const BOM_TPL = {
  classic: { c: 'green', label: 'Classic' },
  bold: { c: 'amber', label: 'Bold' },
  studio: { c: 'indigo', label: 'Studio' },
}
function AcctBoms({ onSettings }) {
  const [boms, setBoms] = usePersisted('qc-boms', [])
  const [q, setQ] = useState('')
  const [delRec, setDelRec] = useState(null)
  const del = (no) => setBoms(boms.filter(b => b.no !== no))
  const settingsBtn = onSettings && (
    <button className="bom-settings-pill" onClick={onSettings}>
      <span className="flat-ic c-green sm"><GearIcon width={13} height={13} /></span> Settings
    </button>
  )
  if (!boms.length) {
    return (
      <div className="bom-wrap">
        <div className="bom-empty">
          <div className="bom-empty-ico"><FileTextIcon width={26} height={26} /></div>
          <Text size="3" weight="bold" as="div" mt="3">No saved BOMs yet</Text>
          <Text size="2" color="gray" as="div" mt="1" style={{ maxWidth: 290, marginInline: 'auto', lineHeight: 1.5 }}>
            Generate a BOM from your cart — every one you export is saved here to re-view, re-download or share with customers.
          </Text>
          {onSettings && (
            <Text size="1" color="gray" as="div" mt="4" mb="2">Set up your company branding first:</Text>
          )}
          <Flex justify="center">{settingsBtn}</Flex>
        </div>
      </div>
    )
  }
  const totalVal = boms.reduce((s, b) => s + (b.total || 0), 0)
  const ql = q.trim().toLowerCase()
  const filtered = ql
    ? boms.filter(b => (b.cust.name || '').toLowerCase().includes(ql) || (b.no || '').toLowerCase().includes(ql))
    : boms
  return (
    <div className="bom-wrap">
      <div className="bom-head">
        <div style={{ minWidth: 0 }}>
          <Text size="3" weight="bold" as="div" style={{ letterSpacing: '-0.3px' }}>{boms.length} saved BOM{boms.length === 1 ? '' : 's'}</Text>
          <Text size="1" color="gray" as="div">₹{totalVal.toLocaleString('en-IN')} quoted · saved on this device</Text>
        </div>
        {settingsBtn}
      </div>

      <div className="bom-search">
        <MagnifyingGlassIcon width={16} height={16} />
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Search by customer or BOM number" style={{ fontSize: 16 }}
          aria-label="Search saved BOMs"
        />
        {q && <button className="bom-search-x" onClick={() => setQ('')} aria-label="Clear search"><Cross2Icon width={15} height={15} /></button>}
      </div>

      {filtered.length === 0 ? (
        <Text size="2" color="gray" as="div" style={{ textAlign: 'center', padding: '28px 0' }}>
          No BOMs match “{q}”.
        </Text>
      ) : filtered.map(rec => {
        const tpl = BOM_TPL[rec.template] || BOM_TPL.classic
        return (
          <div key={rec.no} className="bom-card">
            <Flex gap="3" align="center">
              <div className={`bom-tile t-${tpl.c}`}><FileTextIcon width={20} height={20} /></div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Text size="2" weight="bold" as="div" truncate>{rec.cust.name || 'Customer'}</Text>
                <Text size="1" color="gray" as="div" truncate>
                  {rec.no} · {new Date(rec.ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {rec.count} item{rec.count === 1 ? '' : 's'}
                </Text>
              </div>
              <div style={{ textAlign: 'right', flex: 'none' }}>
                <Text size="3" weight="bold" as="div" style={{ color: 'var(--green-11)', letterSpacing: '-0.3px' }}>₹{(rec.total || 0).toLocaleString('en-IN')}</Text>
                <span className={`bom-badge b-${tpl.c}`}>{tpl.label}</span>
              </div>
            </Flex>
            <div className="bom-divider" />
            <div className="bom-actions">
              <button className="bom-act primary" onClick={() => shareBom(rec)}><Share2Icon width={14} height={14} /> Share</button>
              <button className="bom-act" onClick={() => viewBom(rec)}><EyeOpenIcon width={14} height={14} /> View</button>
              <button className="bom-act" onClick={() => regenBom(rec, 'save')}><DownloadIcon width={14} height={14} /> Download</button>
            </div>
            <div className="bom-actions2">
              <button className="bom-ic" onClick={() => waBom(rec)} aria-label="Share on WhatsApp"><WaMark s={16} /> WhatsApp</button>
              <button className="bom-ic" onClick={() => mailBom(rec)} aria-label="Send by email"><EnvelopeClosedIcon width={15} height={15} /> Email</button>
              <button className="bom-ic del" onClick={() => setDelRec(rec)} aria-label="Delete BOM" style={{ marginLeft: 'auto' }}><TrashIcon width={15} height={15} /></button>
            </div>
          </div>
        )
      })}

      {delRec && (
        <div className="order-done" onClick={() => setDelRec(null)}>
          <div className="od-card" onClick={(e) => e.stopPropagation()}>
            <div className="od-ico-red"><TrashIcon width={24} height={24} /></div>
            <Heading as="h2" size="5" mt="3" style={{ letterSpacing: '-0.3px' }}>Delete this BOM?</Heading>
            <Text size="2" color="gray" as="div" mt="2">
              <Text weight="bold" style={{ color: 'var(--gray-12)' }}>{delRec.cust.name || 'Customer'}</Text> · {delRec.no}
            </Text>
            <Text size="1" color="gray" as="div" mt="1">Removes it from this device — this can’t be undone.</Text>
            <Flex gap="2" mt="4">
              <Button size="3" variant="soft" color="gray" radius="full" style={{ fontWeight: 800, flex: 1 }} onClick={() => setDelRec(null)}>Cancel</Button>
              <Button size="3" color="red" radius="full" style={{ fontWeight: 800, flex: 1 }} onClick={() => { del(delRec.no); setDelRec(null) }}>Delete</Button>
            </Flex>
          </div>
        </div>
      )}
    </div>
  )
}

function CartPage({ cart, onClose, onChange, onConvertTier, onSettings, onPlaced, onClear }) {
  const a11y = useSheetA11y(onClose)
  const items = Object.values(cart.items)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [addrs, setAddrs] = useState(loadAddrs)
  const [sel, setSel] = useState(() => safeGet('qc-addr-sel') || loadAddrs()[0].id)
  const [addrSheet, setAddrSheet] = useState(false)
  const [estSheet, setEstSheet] = useState(false)
  const [note, setNote] = useState(() => safeGet('qc-note') || '')
  const [placed, setPlaced] = useState(null)
  const [express, setExpress] = useState(false)
  const pickAddr = (id) => { setSel(id); safeSet('qc-addr-sel', id) }
  const addAddr = (a) => {
    const next = [...addrs, a]
    setAddrs(next)
    safeSet('qc-addr', JSON.stringify(next))
    pickAddr(a.id)
  }
  const saveNote = (v) => { setNote(v); safeSet('qc-note', v) }

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
  const addr = addrs.find(a => a.id === sel) || addrs[0]
  const tPct = Math.min(100, Math.round(((TARGETS.monthly.done + cart.total) / TARGETS.monthly.target) * 100))

  return (
    <div className="cartpage" role="dialog" aria-modal="true" aria-label="Cart" tabIndex={-1} ref={a11y}>
      <div className="pdp-head">
        <button className="sheet-back" onClick={onClose} aria-label="Back"><ArrowLeftIcon /></button>
        <Heading as="h2" size="4" style={{ flex: 1, letterSpacing: '-0.3px' }}>Your cart</Heading>
        <Text size="1" weight="bold" color="gray">{cart.count} item{cart.count === 1 ? '' : 's'}</Text>
        {items.length > 0 && (
          <button className="est-btn" onClick={() => setEstSheet(true)} aria-label="Download BOM PDF">
            <FileTextIcon width={13} height={13} /> BOM
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
            <Flex align="center" justify="between" mt="2" mb="1" px="1">
              <Text size="1" weight="bold" className="u-seclabel" as="div">{cart.count} ITEM{cart.count === 1 ? '' : 'S'} IN CART</Text>
              <button className="cart-clear" onClick={() => setClearConfirm(true)}>
                <TrashIcon width={13} height={13} /> Clear cart
              </button>
            </Flex>

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

            {onConvertTier && (
              <div className="cp-card cp-tier">
                <Flex align="center" justify="between">
                  <Text size="1" weight="bold" className="u-seclabel">DEALER · QUOTE TIER</Text>
                  <span className="tier-hint">customers never see this</span>
                </Flex>
                <Text size="1" color="gray" as="div" mt="1">Swap the whole list to a price tier in one tap.</Text>
                <Flex gap="2" mt="2">
                  {[['economy', 'Economy'], ['standard', 'Standard'], ['premium', 'Premium']].map(([k, l]) => {
                    const cnt = tierSwapCount(items.map(it => it.p.id), k)
                    return (
                      <button key={k} className="tier-chip" disabled={cnt === 0} onClick={() => onConvertTier(k)}>
                        {l}{cnt > 0 ? ` · ${cnt}` : ''}
                      </button>
                    )
                  })}
                </Flex>
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
              <Text size="1" weight="bold" as="div" className="u-seclabel">
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
                  <Text size="1" weight="bold" as="div" className="u-seclabel">
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
              <Text size="1" weight="bold" as="div" className="u-seclabel">
                SPECIAL INSTRUCTIONS
              </Text>
              <textarea
                className="cp-note" rows={2}
                value={note} onChange={(e) => saveNote(e.target.value)}
              />
            </div>

            <div className="cp-card">
              <Text size="1" weight="bold" as="div" className="u-seclabel">
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

            <div className="cp-card cp-credit">
              <Flex align="center" justify="between">
                <Text size="1" weight="bold" className="u-seclabel">
                  PAYMENT
                </Text>
                <span className="st-chip ok">30-DAY CREDIT</span>
              </Flex>
              <Text size="2" weight="bold" as="div" mt="2" style={{ color: 'var(--green-11)' }}>
                ₹{toPay.toLocaleString('en-IN')} on credit · due {dueLabel}
              </Text>
              <Text size="1" color="gray" as="div" mt="1">
                Interest-free · ₹{Math.max(0, credit.limit - credit.outstanding - toPay).toLocaleString('en-IN')} credit left after this order
              </Text>
            </div>

            <button
              className="qs-cta ghost" style={{ marginTop: 0, justifyContent: 'center', gap: 7 }}
              onClick={() => setEstSheet(true)}
            >
              <FileTextIcon width={14} height={14} /> Download BOM for customer
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
      {clearConfirm && (
        <div className="order-done" onClick={() => setClearConfirm(false)}>
          <div className="od-card" onClick={(e) => e.stopPropagation()}>
            <div className="od-ico-red"><TrashIcon width={24} height={24} /></div>
            <Heading as="h2" size="5" mt="3" style={{ letterSpacing: '-0.3px' }}>Clear your cart?</Heading>
            <Text size="2" color="gray" as="div" mt="2">This removes all {cart.count} item{cart.count === 1 ? '' : 's'} — you can’t undo it.</Text>
            <Flex gap="2" mt="4">
              <Button size="3" variant="soft" color="gray" radius="full" style={{ fontWeight: 800, flex: 1 }} onClick={() => setClearConfirm(false)}>Cancel</Button>
              <Button size="3" color="red" radius="full" style={{ fontWeight: 800, flex: 1 }} onClick={() => { onClear(); setClearConfirm(false) }}>Clear cart</Button>
            </Flex>
          </div>
        </div>
      )}
      {estSheet && (
        <EstimateSheet
          items={items}
          bill={{ itemTotal: grossTotal, bulkSave, schemeOff, slabPct: slab ? slab.off : 0, fee, express, toPay }}
          onClose={() => setEstSheet(false)}
          onSettings={onSettings ? () => { setEstSheet(false); onSettings() } : undefined}
        />
      )}
      {placed && (
        <div className="order-done">
          <div className="od-card">
            <div className="od-tick">✓</div>
            <Heading as="h2" size="5" mt="3" style={{ letterSpacing: '-0.3px' }}>Order placed!</Heading>
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
  useSheetA11y(onClose) // Escape-to-close; page manages its own focus
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
          <Heading as="h2" size="5" style={{ letterSpacing: '-0.3px', lineHeight: 1.25 }}>{p.name}</Heading>
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
              <Text size="1" weight="bold" as="div" className="u-seclabel">
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

export default function RootLayout() {
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
  const playedRef = useRef(safeGet('qc-quiz-day') === DAY)
  const markPlayed = () => {
    playedRef.current = true
    safeSet('qc-quiz-day', DAY)
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
    const i = (Number(safeGet('qc-fest-idx') || -1) + 1) % L.length
    safeSet('qc-fest-idx', String(i))
    return L[i]
  })
  const [heroPal, setHeroPal] = useState(() => {
    const m = window.location.hash.match(/^#hero-(\w+)$/)
    const hit = m && HERO_PALETTES.find(p => p.name.toLowerCase() === m[1].toLowerCase())
    if (hit) return hit
    // rotate through palette combinations on every app open (until client finalizes one)
    const idx = (Number(safeGet('qc-hero-idx') || -1) + 1) % HERO_PALETTES.length
    safeSet('qc-hero-idx', String(idx))
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
  // ---- Router: each page is a real URL. Which overlay is open is DERIVED from
  // the path (single source of truth); navigation is react-router-owned. ----
  const navigate = useNavigate()
  const location = useLocation()
  const bootHashRef = useRef(window.location.hash) // legacy deep-link, captured before the shim clears it
  const seg = location.pathname.split('/').filter(Boolean)
  const root = (seg[0] || '').toLowerCase()
  const plp = root === 'category' ? (seg[1] ? decodeURIComponent(seg[1]) : 'All') : null
  const sheetOpen = root === 'search'
  const cartOpen = root === 'cart'
  const reorderOpen = root === 'reorder'
  const acctOpen = root === 'account'
  const acctSection = acctOpen ? (seg[1] || null) : null
  const kitOpen = root === 'kit'
  const prosOpen = root === 'utilities'
  const inspoOpen = root === 'inspo'
  const inspoLook = inspoOpen && seg[1] ? decodeURIComponent(seg[1]) : null
  const pdpId = new URLSearchParams(location.search).get('p')
  const pdp = pdpId ? FEED_POOL.find(p => p.id === pdpId) : null
  // search-sheet content (which list to show) rides in state; the URL just says /search
  const [sheetPayload, setSheetPayload] = useState(null)
  const inspoLookRef = useRef(false)
  const acctSubRef = useRef(false)

  // Close any overlay → step back one history entry (or home if we're at the root).
  const goBack = useCallback(() => {
    const idx = window.history.state?.idx
    if (typeof idx === 'number' && idx > 0) navigate(-1)
    else navigate('/')
  }, [navigate])
  const openCategory = useCallback((cat, opts) => {
    navigate('/category' + (cat && cat !== 'All' ? '/' + encodeURIComponent(cat) : ''), opts)
  }, [navigate])
  const openSearch = useCallback((payload) => {
    setSheetPayload(payload || { items: FEED_POOL })
    navigate('/search')
  }, [navigate])

  const [authed, setAuthed] = useState(() => {
    if (window.location.hash === '#login') return false
    if (window.location.hash) return true
    return safeGet('qc-auth') === '1'
  })
  const [order, setOrder] = useState(() => {
    if (window.location.hash === '#order') {
      return {
        id: 'QC-482913', amt: 5240, count: 14, ts: Date.now() - 100000, express: false,
        addrLabel: 'Shop', tPct: 65,
        items: [{ p: BUY_AGAIN[0], n: 12 }, { p: DEALS[0], n: 2 }],
      }
    }
    try { return JSON.parse(safeGet('qc-order') || 'null') } catch { return null }
  })
  const dismissOrder = () => { setOrder(null); safeRemove('qc-order') }
  const reorder = () => {
    order?.items?.forEach(({ p, n }) => changeCart(n, p, { noReco: true }))
    navigate('/cart')
  }
  const [qsheet, setQsheet] = useState(() => (window.location.hash === '#qty' ? { p: BUY_AGAIN[0] } : null))

  // Any overlay up -> the page behind must not scroll
  const overlayUp = !!(sheetOpen || pdp || qsheet || cartOpen || reorderOpen || acctOpen || plp || kitOpen || prosOpen || inspoOpen)
  useEffect(() => {
    document.body.classList.toggle('no-scroll', overlayUp)
    return () => document.body.classList.remove('no-scroll')
  }, [overlayUp])

  // The browser/phone back button now closes overlays for free: react-router pops
  // the URL, the derived open-states above recompute, and the overlay unmounts.
  // Every page's close button just steps back one history entry.
  const closePlp = goBack
  const closeSheet = goBack
  const closeReorder = goBack
  const closeAcct = goBack
  const closeInspo = goBack
  const closePros = goBack
  const closeKit = goBack
  const closeCart = goBack
  const closePdp = goBack          // back drops the ?p product param
  const closeQty = () => setQsheet(null)

  // stable intents — memoized cards subscribe via context, never re-render
  const openQty = useCallback((p, apply, opts) => setQsheet({ p, apply, opts }), [])
  const openPdp = useCallback((p) => {
    // PDP rides on a ?p=<id> param so it stacks over whatever page is underneath
    const had = new URLSearchParams(window.location.search).has('p')
    if (had) PDP_SWAPF.current = true // switching products while the page is open
    const sp = new URLSearchParams(window.location.search)
    sp.set('p', p.id)
    navigate({ pathname: window.location.pathname, search: '?' + sp.toString() }, { replace: had })
  }, [navigate])
  const openCart = useCallback(() => navigate('/cart'), [navigate])
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
    // pinned to one fixed blue-shades gradient — no time/weather colour shift
    r.setProperty('--hdr-a', '#2F6BE0')
    r.setProperty('--hdr-b', '#1F4FB5')
    r.setProperty('--hdr-c', '#163A93')
    r.setProperty('--hdr-d', '#112C72')
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

  // (quiz auto-popup removed — quiz is opt-in via Utilities)

  const [reco, setReco] = useState(null)
  const [recoStrip, setRecoStrip] = useState(null)
  useEffect(() => {
    if (!reco) return
    const t = setTimeout(() => setReco(null), 7000)
    return () => clearTimeout(t)
  }, [reco])

  // stable identity so memoized ProductCards skip re-render on cart changes
  const recoSrc = useRef(null)
  const [live, setLive] = useState('') // screen-reader announcements
  const changeCart = useCallback((delta, p, opts) => {
    setLive(delta > 0 ? `Added ${p.name} to cart` : `Removed ${p.name} from cart`)
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

  const clearCart = useCallback(() => {
    setCartItems({})
    recoSrc.current = null
    setReco(null)
    setRecoStrip(null)
    setLive('Cart cleared')
  }, [])

  // #13 · one-click tier conversion — swap every cart line to its economy/standard/
  // premium equivalent (dealer-only; the customer BOM never shows these labels)
  const convertTier = useCallback((target) => {
    setCartItems(items => {
      const next = {}
      for (const { p, n } of Object.values(items)) {
        const id = tierSwap(p.id, target)
        const np = id === p.id ? p : (FEED_POOL.find(x => x.id === id) || p)
        next[np.id] = { p: np, n: (next[np.id]?.n || 0) + n }
      }
      return next
    })
  }, [])

  // Legacy deep-link compatibility: translate the old page #hashes (used by the
  // run-quickcart driver and shared links) into the new real paths, once on boot.
  // Design-review flags (#sim, #compact, #brandhome, #hero-*, #brand-*, #order,
  // #login, #qty, #wheel …) are NOT pages, so they're left untouched.
  useEffect(() => {
    const h = bootHashRef.current
    if (!h) return
    const exact = {
      '#search': '/search', '#cart': '/cart', '#reorder': '/reorder', '#pastorder': '/reorder',
      '#account': '/account', '#dash': '/account/dash', '#credit': '/account/credit',
      '#lists': '/account/lists', '#orders': '/account/orders', '#ordpg': '/account/orders',
      '#site': '/account/site', '#claims': '/account/claims', '#brand': '/account/brand',
      '#kit': '/kit', '#pros': '/utilities', '#inspo': '/inspo',
      '#strip': '/category', '#fsheet': '/category/Hinges',
    }
    let to = exact[h]
    let m
    if (!to && (m = h.match(/^#plp(?:-(\w+))?$/))) to = '/category' + (m[1] && CAT_RULES[m[1]] ? '/' + m[1] : '')
    else if (!to && h === '#pdp') to = '/?p=' + FEED_POOL[0].id
    else if (!to && (m = h.match(/^#inspo-(\w+)/))) to = '/inspo/' + m[1]
    if (to) navigate(to, { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // #cart hash: preload a mixed cart so the sheet can be reviewed
  useEffect(() => {
    if (bootHashRef.current !== '#cart') return
    const t = setTimeout(() => {
      changeCart(12, BUY_AGAIN[0], { noReco: true })
      changeCart(2, DEALS[0], { noReco: true })
    }, 400)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // #reco / #strip hashes: auto-add an item so recommendations can be reviewed
  useEffect(() => {
    if (!['#reco', '#strip'].includes(bootHashRef.current)) return
    const t = setTimeout(() => changeCart(1, BUY_AGAIN[0]), 600)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Values the routed page (Home) needs — handed down through the router Outlet.
  const pageCtx = {
    changeCart, brand, setBrand, setPlp: openCategory, setSheet: openSearch,
    order, dismissOrder, reorder,
    heroVariant, heroPal, festL, quizSkin, glow, setGlow,
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
          brand={brand} onBrand={setBrand} onSearch={() => openSearch({ items: FEED_POOL })}
          cartCount={cart.count} plain={heroVariant === 'fest'}
          onTargets={() => navigate('/account/dash')}
          onAccount={() => navigate('/account')}
        />

        {/* Routed page content (Home and, as they migrate, other pages) */}
        <Outlet context={pageCtx} />

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
              cat={plp} onPick={(c) => openCategory(c, { replace: true })} onClose={closePlp}
              onChange={changeCart} cart={cart} homeBrand={brand}
              onSearch={() => openSearch({ items: FEED_POOL })}
              recoStrip={recoStrip} onRecoClose={() => setRecoStrip(null)}
            />
          )}
        </PageExit>

        <PageExit open={sheetOpen}>
          <SearchSheet sheet={sheetPayload || { items: FEED_POOL }} onClose={closeSheet} onChange={changeCart} recoStrip={recoStrip} onRecoClose={() => setRecoStrip(null)} />
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
            subRef={acctSubRef} initialSub={acctSection}
            onCategory={(cat) => openCategory(cat)}
            onGoReorder={() => navigate('/reorder')}
            onGoKit={() => navigate('/kit')}
          />
          )}
        </PageExit>

        <PageExit open={kitOpen}>
          {kitOpen && <KitPage onClose={closeKit} onChange={changeCart} onGoCart={() => navigate('/cart')} />}
        </PageExit>

        <PageExit open={inspoOpen}>
          {inspoOpen && (
            <InspoPage
              onClose={closeInspo} onChange={changeCart}
              startLook={inspoLook} lookRef={inspoLookRef}
            />
          )}
        </PageExit>

        <PageExit open={prosOpen}>
          {prosOpen && (
            <UtilitiesPage
              onClose={closePros}
              onSpin={() => setWheelOpen(true)}
              onQuiz={() => setQuizOpen(true)}
              lastOrder={order}
              bomCount={loadBoms().length}
              onChange={changeCart}
              onGoReorder={() => navigate('/reorder')}
              onGoKit={() => navigate('/kit')}
            />
          )}
        </PageExit>

        <PageExit open={pdp !== null}>
          {pdp && <ProductPage key={pdp.id} p={pdp} onClose={closePdp} onChange={changeCart} cart={cart} />}
        </PageExit>

        <PageExit open={qsheet !== null} variant="sheetv" dur={240}>
          <div className="sr-only" role="status" aria-live="polite">{live}</div>
          {qsheet && <QtySheet q={qsheet} onClose={closeQty} onConfirm={confirmQty} />}
        </PageExit>

        <PageExit open={cartOpen}>
          {cartOpen && (
          <CartPage
            cart={cart} onClose={closeCart} onChange={changeCart} onConvertTier={convertTier} onClear={clearCart}
            onSettings={() => navigate('/account/estpdf')}
            onPlaced={(rec) => {
              setOrder(rec)
              safeSet('qc-order', JSON.stringify(rec))
              try {
                const bills = JSON.parse(safeGet('qc-bills') || '[]')
                bills.push({ id: rec.id, amt: rec.bill?.toPay ?? rec.amt, due: rec.dueTs })
                safeSet('qc-bills', JSON.stringify(bills))
              } catch { /* storage off */ }
              setCartItems({})
              setQsheet(null)
              // navigating home closes every URL-driven overlay at once
              navigate('/')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
          )}
        </PageExit>

        {!authed && (
          <LoginGate onDone={() => { safeSet('qc-auth', '1'); setAuthed(true) }} />
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
              onCategories={() => openCategory('All')}
              onUtilities={() => navigate('/utilities')}
              onReorder={() => navigate('/reorder')}
              onAccount={() => navigate('/account')}
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

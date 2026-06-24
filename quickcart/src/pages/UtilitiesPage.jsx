import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Flex, Grid, Heading, Text, TextField } from '@radix-ui/themes'
import {
  ArrowLeftIcon, BarChartIcon, BellIcon, BookmarkIcon, CheckIcon, ChevronRightIcon,
  DashboardIcon, ExclamationTriangleIcon, EyeOpenIcon, FileTextIcon, GearIcon,
  MagnifyingGlassIcon, MixerHorizontalIcon, SewingPinIcon, StarFilledIcon,
} from '@radix-ui/react-icons'
import { useNavigate } from 'react-router-dom'
import { PROS, MY_RANK, TARGETS } from '../data.js'
import { LEARN } from '../lib/learn.js'
import { calculateBoM } from '../lib/spsBom.js'
import { CartCtx, CartItemsCtx } from '../contexts.js'
import { usePersisted } from '../lib/storage.js'
import { useSheetA11y } from '../hooks.js'
import { SectionHead, CartGlyph, SkyLayer, btnish } from '../components/ui.jsx'
import { GameRow, Leaderboard } from '../components/home.jsx'
import { Img, img, sparkle } from '../lib/catalog.js'
import { AcctCalc, AcctCredit, AcctLists } from './account/AcctOrders.jsx'
import { AcctBrand, AcctClaims, VisitForm } from './account/AcctTools.jsx'
import { AcctBoms, AcctEstPdf } from './account/AcctBoms.jsx'
import { AcctDash } from './account/AcctDash.jsx'

const UTIL_HINTS = [
  'Search "partition BoM"', 'Search "panel weight"', 'Search "branded quote PDF"',
  'Search "hardware calc"', 'Search "find a carpenter"',
]

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

function Stepper({ value, set, min = 0, max = 16, suffix }) {
  return (
    <div className="stepper">
      <button onClick={() => set(Math.max(min, value - 1))} aria-label="Less">−</button>
      <span>{value}{suffix ? ` ${suffix}` : ''}</span>
      <button onClick={() => set(Math.min(max, value + 1))} aria-label="More">+</button>
    </div>
  )
}

function ProCard({ pro, i }) {
  return (
    <div className="pro-card" style={{ animationDelay: `${i * 60}ms` }}>
      <Img src={img(pro.ph, 280)} alt={pro.name} className="pro-avatar" />
      <Box flexGrow="1" style={{ minWidth: 0 }}>
        <Text size="2" weight="bold" as="div">{pro.name}</Text>
        <Text size="1" color="gray" as="div">{pro.area} · {pro.exp} yrs exp</Text>
        <Flex align="center" gap="2" mt="1">
          <span className="star-row">{'★'.repeat(Math.round(pro.rating))}</span>
          <Text size="1" color="gray">{pro.rating} ({pro.jobs} jobs)</Text>
        </Flex>
      </Box>
      <Button size="1" color="green" radius="full" style={{ fontWeight: 800, flex: 'none' }}
        onClick={() => window.open(`https://wa.me/91${pro.phone}?text=Hi+${encodeURIComponent(pro.name)},+got+your+number+from+QuickCart`, '_blank')}>
        WhatsApp
      </Button>
    </div>
  )
}

function SpsCalcView({ onBack, init }) {
  const [cMat, setCMat] = useState(init?.material || 'P')
  const [cW, setCW] = useState(init?.widthFt || 12)
  const [cH, setCH] = useState(init?.heightFt || 9)
  const [lF, setLF] = useState(1); const [lM, setLM] = useState(3)
  const [sF, setSF] = useState(0); const [sM, setSM] = useState(0)
  const result = useMemo(() => {
    try { return { data: calculateBoM({ lspsFixedDoors: lF, lspsMovableDoors: lM, sspsFixedDoors: sF, sspsMovableDoors: sM, heightFt: cH, widthFt: cW, material: cMat }), err: null } }
    catch (e) { return { data: null, err: e.message } }
  }, [cMat, cW, cH, lF, lM, sF, sM])
  const d = result.data
  return (
    <div className="spscalc">
      <div className="pdp-head">
        <button className="sheet-back" onClick={onBack} aria-label="Back"><ArrowLeftIcon /></button>
        <Heading as="h2" size="4" style={{ flex: 1, letterSpacing: '-0.3px' }}>Partition BoM</Heading>
      </div>
      <div className="cp-body">
        <div className="sc-mat">
          {[['P', 'Aluminium', 'Profile frame'], ['W', 'Wood', 'Wooden doors']].map(([k, t, s]) => (
            <button key={k} className={`sc-mat-b ${cMat === k ? 'on' : ''}`} onClick={() => setCMat(k)}>
              <Text size="2" weight="bold" as="div">{t}</Text>
              <Text size="1" color="gray" as="div">{s}</Text>
            </button>
          ))}
        </div>
        <div className="uc-fields" style={{ marginTop: 12 }}>
          <div className="uc-field"><Text size="1" color="gray" as="div" mb="1">Total width (ft)</Text><Stepper value={cW} set={setCW} min={1} max={16} /></div>
          <div className="uc-field"><Text size="1" color="gray" as="div" mb="1">Height (ft)</Text><Stepper value={cH} set={setCH} min={1} max={10} /></div>
        </div>
        <div className="uc-fields" style={{ marginTop: 12 }}>
          <div className="uc-field"><Text size="1" color="gray" as="div" mb="1">Fixed doors</Text><Stepper value={lF} set={setLF} min={0} max={8} /></div>
          <div className="uc-field"><Text size="1" color="gray" as="div" mb="1">Movable doors</Text><Stepper value={lM} set={setLM} min={0} max={8} /></div>
        </div>
        {result.err && <Text size="1" color="red" as="div" mt="2">{result.err}</Text>}
        {d && (
          <div className="cp-card" style={{ marginTop: 16 }}>
            <Text size="1" weight="bold" as="div" className="u-seclabel">ESTIMATED COST</Text>
            <Heading as="div" size="7" mt="2" style={{ letterSpacing: '-0.6px' }}>₹{d.lspsTotal?.toLocaleString('en-IN')}</Heading>
            <Text size="1" color="gray" as="div">Indicative · verify before quoting</Text>
          </div>
        )}
      </div>
    </div>
  )
}

function WeightCalcView({ onBack }) {
  const [mat, setMat] = useState('ply'); const [thick, setThick] = useState(18)
  const [w, setW] = useState(4); const [h, setH] = useState(8)
  const DENSITY = { ply: 600, mdf: 750, hdhmr: 820, particle: 650 }
  const weight = useMemo(() => {
    const d = DENSITY[mat] || 600
    return parseFloat(((w * 0.3048) * (h * 0.3048) * (thick / 1000) * d).toFixed(2))
  }, [mat, thick, w, h])
  return (
    <div className="spscalc">
      <div className="pdp-head">
        <button className="sheet-back" onClick={onBack} aria-label="Back"><ArrowLeftIcon /></button>
        <Heading as="h2" size="4" style={{ flex: 1, letterSpacing: '-0.3px' }}>Panel Weight Calculator</Heading>
      </div>
      <div className="cp-body">
        <div className="sc-mat">
          {[['ply', 'Plywood'], ['mdf', 'MDF'], ['hdhmr', 'HDHMR'], ['particle', 'Particle']].map(([k, t]) => (
            <button key={k} className={`sc-mat-b ${mat === k ? 'on' : ''}`} onClick={() => setMat(k)}>
              <Text size="2" weight="bold" as="div">{t}</Text>
            </button>
          ))}
        </div>
        <div className="uc-fields" style={{ marginTop: 12 }}>
          <div className="uc-field"><Text size="1" color="gray" as="div" mb="1">Thickness (mm)</Text><Stepper value={thick} set={setThick} min={6} max={32} /></div>
          <div className="uc-field"><Text size="1" color="gray" as="div" mb="1">Width (ft)</Text><Stepper value={w} set={setW} min={1} max={8} /></div>
          <div className="uc-field"><Text size="1" color="gray" as="div" mb="1">Height (ft)</Text><Stepper value={h} set={setH} min={1} max={12} /></div>
        </div>
        <div className="cp-card" style={{ marginTop: 16 }}>
          <Text size="1" weight="bold" as="div" className="u-seclabel">PANEL WEIGHT</Text>
          <Heading as="div" size="7" mt="2" style={{ letterSpacing: '-0.6px' }}>{weight} kg</Heading>
        </div>
      </div>
    </div>
  )
}

export default function UtilitiesPage({ onClose, lastOrder, onChange, onGoReorder, onGoKit, onSpin, onQuiz, bomCount = 0 }) {
  const a11y = useSheetA11y(onClose)
  const navigate = useNavigate()
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
  const [cMat, setCMat] = useState('P')
  const [cW, setCW] = useState(12)
  const [cH, setCH] = useState(9)
  const ucInr = (n) => '₹' + n.toLocaleString('en-IN')
  const ucTotal = useMemo(() => {
    try { return calculateBoM({ lspsFixedDoors: 1, lspsMovableDoors: 3, sspsFixedDoors: 0, sspsMovableDoors: 0, heightFt: cH, widthFt: cW, material: cMat }).lspsTotal }
    catch { return 0 }
  }, [cMat, cW, cH])
  const bodyRef = useRef(null)
  const [hint, setHint] = useState(0)
  const [tab, setTab] = useState('all')
  const [compact, setCompact] = useState(false)
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

  if (view === 'spscalc') return <SpsCalcView onBack={back} init={{ material: cMat, widthFt: cW, heightFt: cH }} />
  if (view === 'weightcalc') return <WeightCalcView onBack={back} />
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
            <span className="util-quiz-k">TONIGHT'S TABLE · QUIZ</span>
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

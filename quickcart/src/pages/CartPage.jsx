import { useCallback, useContext, useRef, useState } from 'react'
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes'
import {
  ArrowLeftIcon, CheckIcon, ChevronDownIcon, Cross2Icon, FileTextIcon,
  GearIcon, LightningBoltIcon, MinusIcon, PlusIcon, StarFilledIcon, TrashIcon,
} from '@radix-ui/react-icons'
import { useNavigate } from 'react-router-dom'
import {
  DEALS, FREE_DELIVERY_AT, ADDRESSES, SCHEMES, TARGETS, CREDIT, tierSwapCount,
} from '../data.js'
import { generateEstimate, EST_BRAND_DEFAULT } from '../lib/estimate.js'
import { safeGet, safeSet, getJSON, setJSON, usePersisted } from '../lib/storage.js'
import { img, sparkle } from '../lib/util.js'
import { applyF, DEFAULT_F } from '../lib/catalog.js'
import { bulkTier, unitPriceFor, lineTotal } from '../money.js'
import { useSheetA11y } from '../hooks.js'
import { QtyCtx, VariantCtx } from '../contexts.js'
import { Img } from '../components/Img.jsx'
import { DealTimer, btnish } from '../components/ui.jsx'

/* ---------- helpers ---------- */

function creditState() {
  let paid = []
  let extra = []
  try { paid = JSON.parse(safeGet('qc-paid') || '[]') } catch { /**/ }
  try { extra = JSON.parse(safeGet('qc-bills') || '[]') } catch { /**/ }
  const all = [
    ...CREDIT.bills,
    ...extra.map(b => ({ ...b, days: Math.ceil((b.due - Date.now()) / 864e5) })),
  ]
  const open = all.filter(b => !paid.includes(b.id))
  const outstanding = open.reduce((s, b) => s + b.amt, 0)
  return { limit: CREDIT.limit, open, paidIds: paid, all, outstanding }
}

function loadAddrs() {
  try {
    const s = JSON.parse(safeGet('qc-addr') || 'null')
    if (Array.isArray(s) && s.length) return s
  } catch { /**/ }
  return ADDRESSES
}

const saveCoupon = (c) => {
  try { safeSet('qc-coupon', JSON.stringify(c)) } catch { /**/ }
}

const loadBoms = () => getJSON('qc-boms', [])
const saveBom = (rec) => setJSON('qc-boms', [rec, ...loadBoms()].slice(0, 50))
const fullBrand = (b) => ({ ...EST_BRAND_DEFAULT, ...b, dealer: { ...EST_BRAND_DEFAULT.dealer, ...(b && b.dealer) } })

/* ---------- AddrFields ---------- */

export function AddrFields({ onSave, cta = 'Save address' }) {
  const [label, setLabel] = useState('')
  const [l1, setL1] = useState('')
  const [l2, setL2] = useState('')
  const [lm, setLm] = useState('')
  const [ct, setCt] = useState('')
  const [pin, setPin] = useState('')
  const valid = label.trim() && l1.trim() && ct.trim() && pin.length === 6
  const save = () => {
    const addr = [l1.trim(), l2.trim(), lm.trim() && `Near ${lm.trim()}`, `${ct.trim()} ${pin}`].filter(Boolean).join(', ')
    onSave({ id: `a${Date.now()}`, label: label.trim(), addr })
  }
  return (
    <div className="addr-form">
      <input className="cp-input" placeholder="Label — e.g. Site 2, New godown" value={label} onChange={(e) => setLabel(e.target.value)} />
      <input className="cp-input" placeholder="Line 1" value={l1} onChange={(e) => setL1(e.target.value)} />
      <input className="cp-input" placeholder="Line 2 (optional)" value={l2} onChange={(e) => setL2(e.target.value)} />
      <input className="cp-input" placeholder="Landmark (optional)" value={lm} onChange={(e) => setLm(e.target.value)} />
      <input className="cp-input" placeholder="City" value={ct} onChange={(e) => setCt(e.target.value)} />
      <input className="cp-input" placeholder="Pincode" maxLength={6} inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/, ''))} />
      <Button size="3" color="green" radius="full" style={{ fontWeight: 800, width: '100%', marginTop: 10 }} disabled={!valid} onClick={save}>{cta}</Button>
    </div>
  )
}

/* ---------- SwipeRow ---------- */

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
  const start = (e) => { t.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, axis: null, base: open.current ? -84 : 0 } }
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
      <button className="swipe-x" onClick={onRemove} aria-label="Remove"><Cross2Icon width={11} height={11} /></button>
      <div className="swipe-inner" ref={ref} onTouchStart={start} onTouchMove={move} onTouchEnd={end} onTouchCancel={end}>
        {children}
      </div>
    </div>
  )
}

/* ---------- AddressSheet ---------- */

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

/* ---------- EstimateSheet ---------- */

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
        <Text size="1" weight="bold" className="u-seclabel" as="div" style={{ marginTop: 14 }}>CUSTOMER DETAILS</Text>
        <input className="cp-input" placeholder="Customer name" value={cust.name} onChange={f('name')} />
        <input className="cp-input" placeholder="Phone" value={cust.phone} onChange={f('phone')} />
        <input className="cp-input" placeholder="Site / project" value={cust.site} onChange={f('site')} />
        <input className="cp-input" placeholder="Referred by (optional)" value={cust.refBy} onChange={f('refBy')} />
        <Text size="1" weight="bold" className="u-seclabel" as="div" style={{ marginTop: 14 }}>SPECIAL DISCOUNT</Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Text size="1" color="gray">₹</Text>
          <input
            className="cp-input" style={{ flex: 1 }} type="number" min="0" placeholder="0"
            value={special} onChange={(e) => setSpecial(e.target.value)}
          />
        </div>
        <div className="bom-tot">
          <Flex justify="between">
            <Text size="1" weight="bold">Grand total</Text>
            <Text size="1" weight="bold">₹{grandTotal.toLocaleString('en-IN')}</Text>
          </Flex>
        </div>
        {err && <Text size="1" color="red" as="div" mt="2">{err}</Text>}
        <Button
          size="3" color="green" radius="full" style={{ fontWeight: 800, width: '100%', marginTop: 14 }}
          loading={busy} disabled={!cust.name.trim()} onClick={go}
        >
          {busy ? 'Generating…' : 'Generate BOM PDF'}
        </Button>
      </div>
    </div>
  )
}

/* ---------- CartPage ---------- */

export default function CartPage({ cart, onChange, onConvertTier, onClear, onSettings, onPlaced }) {
  const navigate = useNavigate()
  const variant = useContext(VariantCtx)
  const openQty = useContext(QtyCtx)
  const onClose = () => navigate(-1)
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
    ? coupon.kind === 'pct' ? Math.round((cart.total * coupon.value) / 100)
    : coupon.kind === 'amt' ? Math.min(coupon.value, cart.total) : 0
    : 0
  const baseFee = coupon?.kind === 'freedel' || cart.total >= FREE_DELIVERY_AT || cart.total === 0 ? 0 : 49
  const fee = baseFee + (express ? 200 : 0)
  const dueTs = Date.now() + 30 * 864e5
  const dueLabel = new Date(dueTs).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const bulkSave = items.reduce((s, { p, n }) => {
    const t = bulkTier(p)
    return t && n >= t.thr ? s + (p.price - t.bp) * n : s
  }, 0)
  const mrpSave = items.reduce((s, { p, n }) => s + ((p.mrp || p.price) - p.price) * n, 0)
  const grossTotal = cart.total + bulkSave
  const slab = [...SCHEMES].reverse().find(s => cart.total >= s.min)
  const nextSlab = SCHEMES.find(s => cart.total < s.min)
  const schemeOff = slab ? Math.round((cart.total * slab.off) / 100) : 0
  const toPay = Math.max(0, cart.total - schemeOff - couponOff + fee)
  const saving = mrpSave + bulkSave + schemeOff + couponOff
  const addr = addrs.find(a => a.id === sel) || addrs[0]
  const deals = variant === 'control'
    ? applyF(DEALS, { ...DEFAULT_F, sort: 3 }, 'ALL').filter(d => !cart.items[d.id]).slice(0, 6)
    : []
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
            <Button mt="3" size="2" color="green" radius="full" style={{ fontWeight: 800 }} onClick={() => navigate('/')}>
              Browse products
            </Button>
          </Box>
        ) : (
          <>
            {variant === 'control' && saving > 0 && (
              <div className="cp-save">
                <StarFilledIcon width={13} height={13} style={{ flex: 'none' }} />
                You're saving ₹{saving.toLocaleString('en-IN')} on this order
              </div>
            )}

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

            {variant === 'control' && deals.length > 0 && (
              <div className="cp-card cp-flash">
                <Flex align="center" justify="between">
                  <Text size="2" weight="bold" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <LightningBoltIcon width={14} height={14} style={{ color: 'var(--gold-9)' }} /> Flash deals before you checkout
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
                        >ADD</Button>
                      </Flex>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="cp-card cp-scheme">
              <Text size="1" weight="bold" as="div" style={{ color: 'var(--violet-11)', letterSpacing: '.5px', fontSize: 10.5 }}>VOLUME SCHEME</Text>
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
                  Top slab unlocked · {slab?.off}% off the entire invoice
                </Text>
              )}
              <Text size="1" color="gray" as="div" mt="1">This order takes your monthly target to {tPct}%</Text>
            </div>

            <div className="cp-card">
              <Text size="1" weight="bold" as="div" className="u-seclabel">DELIVERY SPEED</Text>
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
                  <Text size="1" weight="bold" as="div" className="u-seclabel">DELIVER TO · {addr.label.toUpperCase()}</Text>
                  <Text size="1" as="div" mt="1" style={{ lineHeight: 1.4 }}>{addr.addr}</Text>
                </Box>
                <Button size="1" variant="soft" color="green" radius="full" style={{ fontWeight: 800, flex: 'none' }} onClick={() => setAddrSheet(true)}>Change</Button>
              </Flex>
            </div>

            <div className="cp-card">
              <Text size="1" weight="bold" as="div" className="u-seclabel">SPECIAL INSTRUCTIONS</Text>
              <textarea className="cp-note" rows={2} value={note} onChange={(e) => saveNote(e.target.value)} />
            </div>

            <div className="cp-card">
              <Text size="1" weight="bold" as="div" className="u-seclabel">BILL DETAILS</Text>
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
                    <button className="reco-x" style={{ width: 18, height: 18 }} onClick={() => setCoupon(null)} aria-label="Remove coupon"><Cross2Icon width={10} height={10} /></button>
                  </Flex>
                  <Text size="1" weight="bold" style={{ color: 'var(--green-11)' }}>−₹{couponOff.toLocaleString('en-IN')}</Text>
                </Flex>
              )}
              <Flex justify="between" mt="1">
                <Text size="1" color="gray">Delivery</Text>
                <Text size="1" weight="bold" style={baseFee === 0 ? { color: 'var(--green-10)' } : undefined}>{baseFee === 0 ? 'FREE' : `₹${baseFee}`}</Text>
              </Flex>
              {express && <Flex justify="between" mt="1"><Text size="1" color="gray">Express delivery</Text><Text size="1" weight="bold">+₹200</Text></Flex>}
              <div className="cp-divider" />
              <Flex justify="between"><Text size="2" weight="bold">To pay</Text><Text size="2" weight="bold">₹{toPay.toLocaleString('en-IN')}</Text></Flex>
              <Text size="1" as="div" mt="1" color="gray">Includes GST (18%) · input credit on invoice</Text>
            </div>

            <div className="cp-card cp-credit">
              <Flex align="center" justify="between">
                <Text size="1" weight="bold" className="u-seclabel">PAYMENT</Text>
                <span className="st-chip ok">30-DAY CREDIT</span>
              </Flex>
              <Text size="2" weight="bold" as="div" mt="2" style={{ color: 'var(--green-11)' }}>₹{toPay.toLocaleString('en-IN')} on credit · due {dueLabel}</Text>
            </div>

            <button className="qs-cta ghost" style={{ marginTop: 0, justifyContent: 'center', gap: 7 }} onClick={() => setEstSheet(true)}>
              <FileTextIcon width={14} height={14} /> Download BOM for customer
            </button>
          </>
        )}
      </div>
      {items.length > 0 && (
        <div className="pdp-cta">
          <Box style={{ flex: 'none' }}>
            <Text size="3" weight="bold" as="div">₹{toPay.toLocaleString('en-IN')}</Text>
            <Text size="1" color="gray" as="div">{addr.label} · {express ? 'Express · 1 hr' : baseFee === 0 ? 'FREE delivery' : `+₹${baseFee} delivery`}</Text>
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
                bill: { itemTotal: cart.total, bulkSave, schemeOff, coupon: coupon && couponOff > 0 ? { label: coupon.label, off: couponOff } : null, freeDelCoupon: coupon?.kind === 'freedel' || false, deliveryFee: baseFee, expressFee: express ? 200 : 0, toPay },
                items: Object.values(cart.items).map(({ p, n }) => ({ p: { id: p.id, ph: p.ph, name: p.name, price: p.price, mrp: p.mrp, bulk: p.bulk }, n, unit: unitPriceFor(p, n) })),
              })
              if (coupon) setCoupon(null)
            }}
          >
            Place order
          </button>
        </div>
      )}
      {addrSheet && <AddressSheet addrs={addrs} sel={sel} onPick={pickAddr} onAdd={addAddr} onClose={() => setAddrSheet(false)} />}
      {clearConfirm && (
        <div className="order-done" onClick={() => setClearConfirm(false)}>
          <div className="od-card" onClick={(e) => e.stopPropagation()}>
            <div className="od-ico-red"><TrashIcon width={24} height={24} /></div>
            <Heading as="h2" size="5" mt="3" style={{ letterSpacing: '-0.3px' }}>Clear your cart?</Heading>
            <Text size="2" color="gray" as="div" mt="2">This removes all {cart.count} item{cart.count === 1 ? '' : 's'}.</Text>
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
            <Button mt="4" size="3" color="green" radius="full" style={{ fontWeight: 800, width: '100%' }} onClick={() => onPlaced(placed)}>Done</Button>
          </div>
        </div>
      )}
    </div>
  )
}

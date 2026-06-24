import { useContext, useEffect, useState } from 'react'
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes'
import {
  ArrowLeftIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon,
  CounterClockwiseClockIcon, Cross2Icon, FileTextIcon, MinusIcon, PlusIcon,
} from '@radix-ui/react-icons'
import { CREDIT, PAST_ORDERS, FEED_POOL, CATEGORIES, CAT_SCHEMES, TIERS, SCHEMES, ADDRESSES } from '../../data.js'
import { safeGet, safeSet, usePersisted } from '../../lib/storage.js'
import { img, sparkle } from '../../lib/util.js'
import { bulkTier, unitPriceFor } from '../../money.js'
import { useSheetA11y } from '../../hooks.js'
import { QtyCtx } from '../../contexts.js'
import { Img } from '../../components/Img.jsx'
import { PageExit } from '../../components/ui.jsx'
import { fmtL } from '../../components/home.jsx'
import { AddrFields } from '../CartPage.jsx'
import { creditState, downloadInvoice, downloadLedger, loadAddrs, ORDER_STAGES, ordPgRef, POD_SHOTS } from './helpers.js'

/* CalPicker used by AcctOrders */
export function CalPicker({ value, onChange, allowPast }) {
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
  const { ChevronLeftIcon } = { ChevronLeftIcon: (p) => <svg {...p} viewBox="0 0 15 15"><path d="M8.84 3.14L4.99 7l3.85 3.86" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg> }
  return (
    <>
      <button className={`cal-field ${value ? 'has' : ''}`} onClick={() => { setOpen(o => !o); setMode('days') }}>
        <span>{value ? value.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : 'Pick a date'}</span>
        <ChevronDownIcon width={14} height={14} style={{ marginLeft: 'auto', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      {open && (
        <div className="cal-pop">
          {mode === 'days' && (
            <>
              <div className="cal-head">
                <button onClick={() => setVm(new Date(vm.getFullYear(), vm.getMonth() - 1, 1))} aria-label="Previous month">‹</button>
                <button className="cal-title" onClick={() => setMode('months')}>
                  {vm.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  <ChevronDownIcon width={12} height={12} />
                </button>
                <button onClick={() => setVm(new Date(vm.getFullYear(), vm.getMonth() + 1, 1))} aria-label="Next month">›</button>
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
                <button onClick={() => setVm(new Date(vm.getFullYear() - 1, vm.getMonth(), 1))}>‹</button>
                <button className="cal-title" onClick={() => setMode('years')}>{vm.getFullYear()}<ChevronDownIcon width={12} height={12} /></button>
                <button onClick={() => setVm(new Date(vm.getFullYear() + 1, vm.getMonth(), 1))}>›</button>
              </div>
              <div className="cal-mgrid">
                {MONTHS.map((m, i) => (
                  <button key={m} className={`cal-mcell ${i === vm.getMonth() ? 'sel' : ''}`}
                    onClick={() => { setVm(new Date(vm.getFullYear(), i, 1)); setMode('days') }}>{m}</button>
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
                  <button key={y} className={`cal-mcell ${y === vm.getFullYear() ? 'sel' : ''}`}
                    onClick={() => { setVm(new Date(y, vm.getMonth(), 1)); setMode('months') }}>{y}</button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

function OrderDetailPage({ order, onClose, onChange }) {
  useSheetA11y(onClose)
  const pieces = order.items.reduce((s, { n }) => s + n, 0)
  const bill = order.bill || null
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
  const repeat = (e) => { order.items.forEach(({ p, n }) => onChange(n, p, { noReco: true })); sparkle(e) }
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
          <div className="oc-line" style={{ marginTop: 10 }}><div style={{ width: `${fill}%` }} /></div>
          <div className="tl">
            {TL.map(([t, s], i) => {
              const done = i < si || !live
              const cur = live && i === si
              return (
                <div className="tl-row" key={t}>
                  <div className="tl-rail">
                    <span className={`tl-dot ${done ? 'done' : cur ? 'cur' : ''}`}>{done && <CheckIcon width={11} height={11} />}</span>
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
              <Text size="1" weight="bold" className="u-seclabel">PROOF OF DELIVERY</Text>
              <span className="st-chip ok">OTP VERIFIED</span>
            </Flex>
            <div className="pod-shots">{POD_SHOTS.map(s => <Img key={s} src={img(s, 360)} alt="Delivery photo" />)}</div>
            <Flex align="center" gap="2" mt="2">
              <div className="vr-av">S</div>
              <Box flexGrow="1" style={{ minWidth: 0 }}>
                <Text size="1" weight="bold" as="div">Received by Suresh · store staff</Text>
                <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>Geo-tagged at {order.addrLabel || 'Shop'} · {timeFor(3)}</Text>
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
                <Text size="1" weight="bold" style={{ minWidth: 60, textAlign: 'right', flex: 'none', whiteSpace: 'nowrap' }}>₹{(it.n * u).toLocaleString('en-IN')}</Text>
              </div>
            )
          })}
          <div className="cp-divider" />
          {bill && (
            <>
              {bill.schemeOff > 0 && <Flex justify="between"><Text size="1" color="gray">Volume scheme</Text><Text size="1" weight="bold" style={{ color: 'var(--green-11)' }}>−₹{bill.schemeOff.toLocaleString('en-IN')}</Text></Flex>}
              {bill.coupon && <Flex justify="between" mt="1"><Text size="1" color="gray">Coupon · {bill.coupon.label}</Text><Text size="1" weight="bold" style={{ color: 'var(--green-11)' }}>−₹{bill.coupon.off.toLocaleString('en-IN')}</Text></Flex>}
              {(bill.deliveryFee > 0 || bill.expressFee > 0) && <Flex justify="between" mt="1"><Text size="1" color="gray">Delivery{bill.expressFee ? ' + express' : ''}</Text><Text size="1" weight="bold">₹{(bill.deliveryFee + bill.expressFee).toLocaleString('en-IN')}</Text></Flex>}
            </>
          )}
          <Flex justify="between" mt={bill ? '1' : '0'}><Text size="2" weight="bold">Order total</Text><Text size="2" weight="bold">₹{total.toLocaleString('en-IN')}</Text></Flex>
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
          <button className="qs-cta" style={{ marginTop: 0, flex: 1.3, justifyContent: 'center' }} onClick={repeat}>Repeat order</button>
        </Flex>
      </div>
    </div>
  )
}

export function AcctOrders({ lastOrder, onChange }) {
  const [view, setView] = useState(null)
  ordPgRef.current = view !== null
  useEffect(() => {
    if (!view) return
    if (!window.history.state?.qcOrdPg) window.history.pushState({ qcOrdPg: true }, '')
    const onPop = () => setView(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [view !== null]) // eslint-disable-line react-hooks/exhaustive-deps
  const closeView = () => { if (window.history.state?.qcOrdPg) window.history.back(); else setView(null) }
  useEffect(() => {
    if (window.location.hash === '#ordpg' && hist[0]) setView(hist[0])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [preset, setPreset] = useState('fy')
  const [from, setFrom] = useState(null)
  const [to, setTo] = useState(null)
  const hist = [
    ...(lastOrder ? [{ id: lastOrder.id, date: 'Today', status: 'In transit', ts: lastOrder.ts, addrLabel: lastOrder.addrLabel, items: (lastOrder.items || []).map(({ p, n }) => ({ p, n })) }] : []),
    ...PAST_ORDERS.map(o => ({ ...o, status: 'Delivered', items: o.items.map(([id, n, unit]) => ({ p: FEED_POOL.find(p => p.id === id), n, unit })).filter(x => x.p) })),
  ]
  const nowTs = Date.now()
  let f0 = 0; let t0 = Infinity
  if (preset === 'custom') { f0 = from ? from.getTime() : 0; t0 = to ? to.getTime() + 86399999 : Infinity }
  else if (preset === '7d') f0 = nowTs - 7 * 864e5
  else if (preset === '30d') f0 = nowTs - 30 * 864e5
  else if (preset === 'qtr') { const d = new Date(); f0 = new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1).getTime() }
  else { const d = new Date(); f0 = (d.getMonth() >= 3 ? new Date(d.getFullYear(), 3, 1) : new Date(d.getFullYear() - 1, 3, 1)).getTime() }
  const shownH = hist.filter(o => (o.ts || nowTs) >= f0 && (o.ts || nowTs) <= t0)
  const totalVal = hist.reduce((s, o) => s + o.items.reduce((x, { p, n }) => x + p.price * n, 0), 0)
  const repeat = (o, e) => { o.items.forEach(({ p, n }) => onChange(n, p, { noReco: true })); sparkle(e) }
  return (
    <>
      <div className="sub-hero blue">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--blue-11)', fontSize: 10, letterSpacing: '.6px' }}>ORDERS</Text>
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
          <Box style={{ flex: 1 }}><Text size="1" color="gray" as="div" mb="1">From</Text><CalPicker value={from} onChange={setFrom} allowPast /></Box>
          <Box style={{ flex: 1 }}><Text size="1" color="gray" as="div" mb="1">To</Text><CalPicker value={to} onChange={setTo} allowPast /></Box>
        </Flex>
      )}
      <Text size="1" color="gray" as="div" mb="3" style={{ padding: '0 4px' }}>Showing {shownH.length} invoice{shownH.length === 1 ? '' : 's'}</Text>
      {shownH.length === 0 && <div className="cp-card"><Text size="1" color="gray">No invoices in this range — widen the dates.</Text></div>}
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
              <Flex>{o.items.slice(0, 3).map(({ p }) => <Img key={`hp-${o.id}-${p.id}`} className="thumb" src={img(p.ph, 80)} alt="" />)}</Flex>
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

export function AcctCredit() {
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
  const barColor = overdue.length > 0 ? 'var(--red-9)' : avail / CREDIT.limit < .35 ? 'var(--amber-9)' : 'var(--green-9)'
  const payAmt = pay ? pay.reduce((s, b) => s + b.amt, 0) : 0
  const confirm = (e) => { sparkle(e); setPaid([...paid, ...pay.map(b => b.id)]); setDone(payAmt); setPay(null) }
  return (
    <>
      <div className="cr-hero">
        <Text size="1" weight="bold" as="div" style={{ color: 'rgba(255,255,255,.6)', fontSize: 10, letterSpacing: '.6px' }}>CREDIT AVAILABLE</Text>
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
          <Text size="1" weight="bold" as="div" className="u-seclabel">OPEN BILLS</Text>
          {bills.map(b => (
            <div className="bill-row" key={b.id}>
              <Box flexGrow="1" style={{ minWidth: 0 }}>
                <Text size="2" weight="bold" as="div">₹{b.amt.toLocaleString('en-IN')}</Text>
                <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>PO {b.id}</Text>
              </Box>
              <span className={`st-chip ${b.days < 0 ? 'bad' : b.days <= 7 ? '' : 'ok'}`}>{b.days < 0 ? `Overdue ${-b.days}d` : `Due in ${b.days}d`}</span>
              <Button size="1" variant="soft" color="green" radius="full" style={{ fontWeight: 800, flex: 'none' }} onClick={() => setPay([b])}>Pay</Button>
            </div>
          ))}
          <button className="qs-cta" onClick={() => setPay(bills)}><span>Pay all bills</span><span>₹{outstanding.toLocaleString('en-IN')}</span></button>
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
          <Text size="1" weight="bold" as="div" className="u-seclabel">SETTLED</Text>
          {settled.map(b => (
            <div className="bill-row" key={`s-${b.id}`}>
              <Box flexGrow="1"><Text size="2" weight="bold" as="div" style={{ color: 'var(--gray-9)' }}>₹{b.amt.toLocaleString('en-IN')}</Text><Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-9)' }}>PO {b.id}</Text></Box>
              <span className="st-chip ok"><CheckIcon width={10} height={10} /> Paid</span>
            </div>
          ))}
        </div>
      )}
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">LEDGER STATEMENT · FY 2026–27</Text>
        <Text size="1" color="gray" as="div" mt="1">Every bill, payment and running balance — CA-ready.</Text>
        <Flex gap="2" mt="3">
          <Button size="2" variant="soft" color="green" radius="full" style={{ fontWeight: 800, flex: 1 }} onClick={downloadLedger}>Download</Button>
          <Button size="2" variant="soft" color="gray" radius="full" style={{ fontWeight: 800, flex: 1 }} onClick={() => setLedgerMsg(true)}>Email me</Button>
        </Flex>
        {ledgerMsg && <Flex align="center" gap="2" mt="2"><CheckIcon width={13} height={13} color="var(--green-11)" /><Text size="1" weight="bold" style={{ color: 'var(--green-11)' }}>Ledger on its way to virag@borahardware.in</Text></Flex>}
      </div>
      {pay && (
        <div className="qsheet-overlay" onClick={() => setPay(null)}>
          <div className="qsheet" onClick={(e) => e.stopPropagation()}>
            <div className="qsheet-grab" />
            <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>Pay ₹{payAmt.toLocaleString('en-IN')}</Heading>
            <Text size="1" color="gray" as="div" mt="1">{pay.length} bill{pay.length === 1 ? '' : 's'} · settles to QuickCart Trading Pvt Ltd</Text>
            <Text size="1" weight="bold" as="div" mt="4" className="u-seclabel">PAY VIA</Text>
            <Flex gap="2" mt="1">{['UPI', 'Netbanking', 'Cheque on pickup'].map(m => <button key={m} className={`seg-b ${method === m ? 'on' : ''}`} style={{ flex: 1 }} onClick={() => setMethod(m)}>{m}</button>)}</Flex>
            <button className="qs-cta" onClick={confirm}><span>Pay via {method}</span><span>₹{payAmt.toLocaleString('en-IN')}</span></button>
          </div>
        </div>
      )}
      {done && (
        <div className="order-done" onClick={() => setDone(null)}>
          <div className="od-card" onClick={(e) => e.stopPropagation()}>
            <div className="od-tick">✓</div>
            <Heading as="h2" size="5" mt="3" style={{ letterSpacing: '-0.3px' }}>Payment received</Heading>
            <Text size="2" color="gray" as="div" mt="1">₹{done.toLocaleString('en-IN')} · credit limit freed up instantly</Text>
            <Button mt="4" size="3" color="green" radius="full" style={{ fontWeight: 800, width: '100%' }} onClick={() => setDone(null)}>Done</Button>
          </div>
        </div>
      )}
    </>
  )
}

export function AcctSchemes({ onCategory }) {
  return (
    <>
      <div className="sub-hero violet">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--violet-11)', fontSize: 10, letterSpacing: '.6px' }}>SAVED THIS FY</Text>
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
        <Text size="1" weight="bold" as="div" className="u-seclabel">LIVE CATEGORY SCHEMES</Text>
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

export function AcctGst() {
  const [gst, setGst] = usePersisted('qc-gst', { gstin: '29ABCDE1234F1Z5', name: 'Bora Hardware & Plywood' })
  const valid = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst.gstin.toUpperCase())
  return (
    <div className="cp-card">
      <Flex align="center" justify="between">
        <Text size="1" weight="bold" className="u-seclabel">GST DETAILS</Text>
        {valid && <span className="st-chip ok"><CheckIcon width={10} height={10} /> Verified</span>}
      </Flex>
      <Text size="1" color="gray" as="div" mt="3">GSTIN</Text>
      <input className="cp-input" style={{ marginTop: 4, textTransform: 'uppercase' }} value={gst.gstin} onChange={(e) => setGst({ ...gst, gstin: e.target.value })} maxLength={15} />
      <Text size="1" color="gray" as="div">Registered business name</Text>
      <input className="cp-input" style={{ marginTop: 4 }} value={gst.name} onChange={(e) => setGst({ ...gst, name: e.target.value })} />
      <Text size="1" color="gray" as="div" mt="1">Input credit appears on every invoice automatically.</Text>
    </div>
  )
}

export function AcctAddr() {
  const [addrs, setAddrs] = useState(loadAddrs)
  const [sel, setSel] = usePersisted('qc-addr-sel', loadAddrs()[0].id)
  const [armed, setArmed] = useState(null)
  const [adding, setAdding] = useState(false)
  const addNew = (a) => {
    const next = [...addrs, a]; setAddrs(next); safeSet('qc-addr', JSON.stringify(next)); setSel(a.id); setAdding(false)
  }
  const remove = (id) => {
    const next = addrs.filter(a => a.id !== id); setAddrs(next); safeSet('qc-addr', JSON.stringify(next))
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
            armed === a.id
              ? <button className="addr-delc" onClick={() => { remove(a.id); setArmed(null) }}>Delete?</button>
              : <button className="reco-x" onClick={() => setArmed(a.id)} aria-label="Delete"><Cross2Icon width={12} height={12} /></button>
          )}
        </div>
      ))}
      {adding ? <AddrFields onSave={addNew} /> : <button className="addr-add" onClick={() => setAdding(true)}><PlusIcon width={14} height={14} /> Add new address</button>}
    </div>
  )
}

export function AcctCalc() {
  const [tab, setTab] = useState('slide')
  const [wt, setWt] = useState(30)
  const [sz, setSz] = useState(450)
  const [ht, setHt] = useState(1800)
  const [cw, setCw] = useState(900)
  const [chh, setChh] = useState(2100)
  const [cth, setCth] = useState(25)
  const [cmat, setCmat] = useState('Engineered wood')
  const DENSITY = { 'Engineered wood': 650, 'Solid wood': 750, 'Glass': 2500, 'Aluminium': 1600 }
  const doorKg = Math.round((cw / 1000) * (chh / 1000) * (cth / 1000) * DENSITY[cmat])
  const openQty = useContext(QtyCtx)
  const closer = FEED_POOL.filter(p => /closer/i.test(p.name) && p.load >= doorKg && p.size >= cw).sort((a, b) => a.load - b.load)[0]
  const slide = FEED_POOL.filter(p => p.load && p.load >= wt && (!p.size || p.size === sz) && /slide|channel|tandem|quadro/i.test(p.name)).sort((a, b) => a.load - b.load)[0]
  const hingeCount = ht < 900 ? 2 : ht < 1500 ? 3 : ht < 2100 ? 4 : 5
  const hinge = FEED_POOL.find(p => /hinge/i.test(p.name))
  const CalcSugg = ({ p, qty, note }) => {
    if (!p) return <div className="calc-out"><Text size="1" weight="bold" style={{ color: 'var(--amber-11)' }}>Beyond the standard range — talk to support for engineered options</Text></div>
    return (
      <div className="calc-out">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--green-11)' }}>{note}</Text>
        <Flex align="center" gap="3" mt="2">
          <Img src={img(p.ph, 100)} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Text size="1" weight="bold" as="div" className="clamp1">{p.name}</Text>
            <Text size="1" color="gray" as="div">₹{p.price.toLocaleString('en-IN')}{p.bulk ? ` · ${p.bulk}` : ''}</Text>
          </Box>
          <Button size="1" color="green" radius="full" style={{ fontWeight: 800, flex: 'none' }} onClick={() => openQty && openQty(p, null, { noReco: true })}>ADD{qty ? ` ${qty}` : ''}</Button>
        </Flex>
      </div>
    )
  }
  return (
    <>
      <div className="seg" style={{ marginTop: 0 }}>
        <button className={`seg-b ${tab === 'slide' ? 'on' : ''}`} onClick={() => setTab('slide')}>Slide load</button>
        <button className={`seg-b ${tab === 'hinge' ? 'on' : ''}`} onClick={() => setTab('hinge')}>Hinges</button>
        <button className={`seg-b ${tab === 'closer' ? 'on' : ''}`} onClick={() => setTab('closer')}>Door closer</button>
      </div>
      {tab === 'slide' && (
        <div className="cp-card">
          <Text size="2" weight="bold" as="div">Drawer slide selector</Text>
          <Text size="1" color="gray" as="div" mt="1">Loaded drawer weight (kg)</Text>
          <input className="cp-input" style={{ marginTop: 4 }} type="number" min="1" max="80" value={wt} onChange={(e) => setWt(Math.max(1, +e.target.value || 0))} />
          <Text size="1" color="gray" as="div">Slide length</Text>
          <Flex gap="2" mt="1" mb="2">{[450, 500, 600].map(s => <button key={s} className={`seg-b ${sz === s ? 'on' : ''}`} style={{ flex: 1 }} onClick={() => setSz(s)}>{s} mm</button>)}</Flex>
          <CalcSugg p={slide} note={`For ${wt} kg · recommended ${slide ? `${slide.load} kg rated` : ''}`} />
        </div>
      )}
      {tab === 'hinge' && (
        <div className="cp-card">
          <Text size="2" weight="bold" as="div">Hinges per door</Text>
          <Text size="1" color="gray" as="div" mt="1">Door height (mm)</Text>
          <input className="cp-input" style={{ marginTop: 4 }} type="number" min="300" max="3000" value={ht} onChange={(e) => setHt(Math.max(300, +e.target.value || 0))} />
          <CalcSugg p={hinge} qty={hingeCount} note={`${ht} mm door → ${hingeCount} hinges per door`} />
        </div>
      )}
      {tab === 'closer' && (
        <div className="cp-card">
          <Text size="2" weight="bold" as="div">Door closer selector</Text>
          <Text size="1" color="gray" as="div" mt="1">Door size & material → estimated weight → the right closer</Text>
          <Flex gap="2" mt="2">
            <Box style={{ flex: 1 }}><Text size="1" color="gray" as="div">Width (mm)</Text><input className="cp-input" style={{ marginTop: 4 }} type="number" min="400" max="1400" value={cw} onChange={(e) => setCw(Math.max(300, +e.target.value || 0))} /></Box>
            <Box style={{ flex: 1 }}><Text size="1" color="gray" as="div">Height (mm)</Text><input className="cp-input" style={{ marginTop: 4 }} type="number" min="1200" max="3000" value={chh} onChange={(e) => setChh(Math.max(900, +e.target.value || 0))} /></Box>
          </Flex>
          <Text size="1" color="gray" as="div">Thickness</Text>
          <Flex gap="2" mt="1" mb="2">{[18, 25, 32, 40].map(t => <button key={t} className={`seg-b ${cth === t ? 'on' : ''}`} style={{ flex: 1 }} onClick={() => setCth(t)}>{t} mm</button>)}</Flex>
          <Text size="1" color="gray" as="div">Material</Text>
          <Flex gap="2" mt="1" mb="2" wrap="wrap">{Object.keys(DENSITY).map(m => <button key={m} className={`seg-b ${cmat === m ? 'on' : ''}`} style={{ flex: '1 1 40%' }} onClick={() => setCmat(m)}>{m}</button>)}</Flex>
          <CalcSugg p={closer} note={`~${doorKg} kg · ${cw} mm door → ${closer ? closer.qty : 'no standard match'}`} />
        </div>
      )}
    </>
  )
}

import { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes'
import {
  ArrowLeftIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon,
  CounterClockwiseClockIcon, Cross2Icon, MinusIcon, PlusIcon,
} from '@radix-ui/react-icons'
import { useNavigate } from 'react-router-dom'
import { FEED_POOL, PAST_ORDERS, REORDER } from '../data.js'
import { CartItemsCtx, PdpCtx, QtyCtx } from '../contexts.js'
import { useNextFrame } from '../hooks.js'
import { Img, img, btnish, sparkle } from '../lib/catalog.js'
import CartBar from '../components/CartBar.jsx'

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
                  <Button size="1" variant="soft" color="green" radius="full" style={{ fontWeight: 800, flex: 'none' }} onClick={() => step(p, n)}>
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

export default function ReorderPage({ onChange, lastOrder }) {
  const navigate = useNavigate()
  const [view, setView] = useState(null)
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
  const custom = (m) => { if (openQty) openQty(m.p, null, { noReco: true }) }
  const removeRow = (m) => {
    const q = cartItems[m.p.id]?.n || 0
    if (q > 0) onChange(-q, m.p)
    setHidden(h => ({ ...h, [m.id]: true }))
  }
  const addUsual = (m, e) => { onChange(m.usual, m.p, { noReco: true }); if (e) sparkle(e) }
  const step = (m, d) => onChange(d, m.p, { noReco: true })
  const pendingDue = due.filter(m => !cartItems[m.p.id]?.n)
  const dueTotal = pendingDue.reduce((s, m) => s + m.usual * m.p.price, 0)
  const addAllDue = (e) => { pendingDue.forEach(m => addUsual(m)); if (e) sparkle(e) }
  const past = [
    ...(lastOrder ? [{ id: lastOrder.id, date: 'Today', items: (lastOrder.items || []).map(({ p, n }) => ({ p, n })) }] : []),
    ...PAST_ORDERS.map(o => ({
      ...o,
      items: o.items.map(([id, n, unit]) => ({ p: FEED_POOL.find(p => p.id === id), n, unit })).filter(x => x.p),
    })),
  ]
  const repeat = (o, e) => { o.items.forEach(({ p, n }) => onChange(n, p, { noReco: true })); if (e) sparkle(e) }
  return (
    <div className="reorderpage">
      <div className="pdp-head">
        <button className="sheet-back" onClick={() => navigate(-1)} aria-label="Back"><ArrowLeftIcon /></button>
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
                <Text size="1" weight="bold" as="div" style={{ color: 'var(--amber-11)', letterSpacing: '.5px', fontSize: 10.5 }}>DUE NOW</Text>
                {due.map(m => (
                  <SwipeRow key={m.id} onRemove={() => removeRow(m)}>
                    <RoRow m={m} onAdd={addUsual} onStep={step} onCustom={custom} />
                  </SwipeRow>
                ))}
              </div>
            )}

            <div className="cp-card">
              <Text size="1" weight="bold" as="div" className="u-seclabel">YOUR REGULARS</Text>
              {regular.map(m => (
                <SwipeRow key={m.id} onRemove={() => removeRow(m)}>
                  <RoRow m={m} onAdd={addUsual} onStep={step} onCustom={custom} />
                </SwipeRow>
              ))}
            </div>

            <div className="cp-card">
              <Text size="1" weight="bold" as="div" className="u-seclabel">PAST ORDERS</Text>
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
                  <Button size="1" variant="soft" color="green" radius="full" style={{ fontWeight: 800, flex: 'none' }}
                    onClick={(e) => { e.stopPropagation(); repeat(o, e) }}>
                    Repeat
                  </Button>
                  <ChevronRightIcon width={14} height={14} color="var(--gray-8)" style={{ flex: 'none' }} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="plp-cartwrap"><CartBar /></div>
      {view && <PastOrderSheet key={view.id} order={view} onClose={() => setView(null)} onChange={onChange} />}
    </div>
  )
}

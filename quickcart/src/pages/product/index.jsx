import { useState, useMemo, useEffect, useRef, useContext } from 'react'
import { Box, Flex, Heading, Text, Button } from '@radix-ui/themes'
import { ArrowLeftIcon, BookmarkIcon, StarFilledIcon, LightningBoltIcon, PlusIcon } from '@radix-ui/react-icons'
import { FEED_POOL, BRAND_NAMES, BRAND_LOGOS } from '../../data.js'
import { catOf, recosFor } from '../../lib/catalog.js'
import { img, sparkle } from '../../lib/util.js'
import { bulkTier } from '../../money.js'
import { useSheetA11y } from '../../hooks.js'
import { QtyCtx, PdpCtx, CartCtx, CartItemsCtx } from '../../contexts.js'
import { Img } from '../../components/Img.jsx'
import { SectionHead } from '../../components/ui.jsx'
import { ProductCard } from '../../components/cards.jsx'
import { ListSheet } from '../../components/product/ListSheet.jsx'
import { PDP_SWAPF } from './swap.js'

let PDP_DIR = 0 // swipe direction handoff to the next ProductPage mount (slide-in side)

/* Product details page (PDP) — hero gallery with swipe gestures, bulk pricing,
   "buy it with", specs and recommendations. Rendered via the ?p=<id> param so it
   stacks over whatever page is underneath. */
export function ProductPage({ p, onClose, onChange, cart }) {
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

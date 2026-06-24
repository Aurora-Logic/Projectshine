import { memo, useContext } from 'react'
import { Text, Flex } from '@radix-ui/themes'
import { LightningBoltIcon, StarFilledIcon, CheckIcon } from '@radix-ui/react-icons'
import { CartItemsCtx, QtyCtx, PdpCtx } from '../contexts.js'
import { Img } from './Img.jsx'
import { AddControl, btnish } from './ui.jsx'
import { img, sparkle, bulkNudge } from '../lib/util.js'

/* product / flash / combo cards — extracted from App.jsx (A5.1) */

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
    <div className={`pcard ${grid ? 'grid' : ''}`} {...(openPdp ? btnish(() => openPdp(p)) : {})}>
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
            <Text size="1" color="gray" style={{ textDecoration: 'line-through' }}><span className="sr-only">M.R.P. </span>₹{p.mrp.toLocaleString('en-IN')}</Text>
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

/* dense list row — experiment variant: scan many SKUs + add inline */
const ProductRow = memo(function ProductRow({ p, onChange }) {
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
  const off = p.mrp && p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0
  return (
    <div className="prow" {...(openPdp ? btnish(() => openPdp(p)) : {})}>
      <div className="prow-imgwrap">
        <Img className={`prow-img ${oos ? 'oos' : ''}`} src={img(p.ph, 160)} alt={p.name} loading="lazy" />
        {off > 0 && <span className="prow-off">{off}%</span>}
      </div>
      <div className="prow-mid">
        <Text size="2" weight="bold" as="div" className="clamp1" style={{ fontSize: 13 }}>{p.name}</Text>
        {p.qty && <Text size="1" color="gray" as="div" truncate>{p.qty}</Text>}
        <Flex align="center" gap="2" mt="1">
          <Text size="2" weight="bold">₹{p.price.toLocaleString('en-IN')}</Text>
          {p.mrp && <Text size="1" color="gray" style={{ textDecoration: 'line-through' }}>₹{p.mrp.toLocaleString('en-IN')}</Text>}
        </Flex>
        {p.bulk && (
          <Text size="1" as="div" weight="bold" style={{ fontSize: 10.5, color: 'var(--blue-11)' }}>Bulk: {p.bulk}</Text>
        )}
        {p.stock != null && (
          <Text size="1" as="div" weight="bold" style={{ fontSize: 10, color: oos ? 'var(--red-10)' : p.stock <= 10 ? 'var(--amber-11)' : 'var(--green-10)' }}>
            {oos ? `Out of stock · ships in ${p.lead}d` : p.stock <= 10 ? `Only ${p.stock} left` : `In stock · ${p.stock}+ pcs`}
          </Text>
        )}
      </div>
      <div className="prow-add">
        <AddControl qty={qty} onAdd={add} onRemove={remove} onBulk={openQty ? () => openQty(p) : undefined} />
      </div>
    </div>
  )
})

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
    <div className="flash-card" {...(openPdp ? btnish(() => openPdp(p)) : {})}>
      <div className="pimg-wrap" style={{ aspectRatio: 'auto', height: 104 }}>
        <Img className="pimg" src={img(p.ph, 320)} alt={p.name} />
        {pct > 0 && <span className="flash-off">-{pct}%</span>}
        <AddControl qty={qty} onAdd={add} onRemove={remove} onBulk={openQty ? () => openQty(p) : undefined} />
      </div>
      <div className="flash-body">
        <Text as="div" weight="bold" className="clamp1" style={{ fontSize: 12.5 }}>{p.name}</Text>
        <Flex align="center" gap="2" mt="1">
          <Text size="2" weight="bold">₹{p.price.toLocaleString('en-IN')}</Text>
          {p.mrp && <Text size="1" color="gray" style={{ textDecoration: 'line-through' }}><span className="sr-only">M.R.P. </span>₹{p.mrp.toLocaleString('en-IN')}</Text>}
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

export { ProductCard, ProductRow, FlashCard, ComboCard }

import { useContext } from 'react'
import { Box, Text, Flex, Button } from '@radix-ui/themes'
import { Cross2Icon } from '@radix-ui/react-icons'
import { QtyCtx, PdpCtx } from '../contexts.js'
import { sparkle } from '../lib/util.js'
import { Img } from './Img.jsx'
import { SectionHead } from './ui.jsx'
import { ProductCard } from './cards.jsx'
import { img } from '../lib/util.js'

/* feed sections — extracted from App.jsx (A5.1) */

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

export { Shelf, RecoStrip }

import { useEffect, useState } from 'react'
import { Box, Flex, Text, Button } from '@radix-ui/themes'
import { StarFilledIcon, Cross2Icon } from '@radix-ui/react-icons'
import { ORDER_STAGES } from '../../data.js'
import { img } from '../../lib/util.js'
import { safeSet } from '../../lib/storage.js'
import { Img } from '../Img.jsx'

/* Live order status card — shown on home right after placing an order */
export function OrderCard({ order, onDismiss, onReorder, onAddMore }) {
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
    safeSet('qc-order', JSON.stringify({ ...order, rated: n }))
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

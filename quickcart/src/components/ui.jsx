import { memo, useState, useEffect, useRef, useContext } from 'react'
import { Box, Flex, Heading, Text, Button, IconButton } from '@radix-ui/themes'
import { MinusIcon, PlusIcon, ChevronRightIcon } from '@radix-ui/react-icons'
import { dealSecsLeft, img } from '../lib/util.js'
import { FREE_DELIVERY_AT } from '../data.js'
import { CartCtx } from '../contexts.js'
import { Img } from './Img.jsx'

/* shared leaf UI components — extracted from App.jsx (A5.1 components phase) */

function PageExit({ open, children, variant = 'page', dur = 300 }) {
  const [state, setState] = useState(open ? 'open' : 'closed')
  const last = useRef(children)
  if (open) last.current = children
  useEffect(() => {
    if (open) {
      setState('open')
      return
    }
    setState(s => (s === 'closed' ? s : 'closing'))
    const t = setTimeout(() => setState('closed'), dur)
    return () => clearTimeout(t)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps
  if (state === 'closed') return null
  return (
    <div className={`pgx ${variant} ${state === 'closing' ? 'out' : ''}`}>
      {open ? children : last.current}
    </div>
  )
}

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
        <span className="leafy" style={{ top: 30, animationDuration: '7s' }} />
        <span className="leafy" style={{ top: 80, animationDuration: '9s', animationDelay: '2.5s' }} />
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

function DealTimer() {
  const [secs, setSecs] = useState(dealSecsLeft)
  useEffect(() => {
    const t = setInterval(() => setSecs(dealSecsLeft()), 1000)
    return () => clearInterval(t)
  }, [])
  const mm = String(Math.floor(secs / 60)).padStart(2, '0')
  const ss = String(secs % 60).padStart(2, '0')
  return (
    <span className="timer-chip" aria-hidden="true">
      <span className="timer-dot" /> Ends in {mm}:{ss}
    </span>
  )
}

function SectionHead({ title, extra, light, sub, onSeeAll }) {
  return (
    <Box px="4" mb="3">
      <Flex align="center" justify="between">
        <Flex align="center" gap="3" style={{ minWidth: 0 }}>
          <Heading as="h2" size="4" style={{ letterSpacing: '-0.2px', ...(light ? { color: '#fff' } : {}) }}>
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

function AddControl({ qty, onAdd, onRemove, onBulk }) {
  // bulk sheet opens on long-press of the count — a plain tap between − and +
  // must never pop a sheet (fat-finger hazard on the highest-frequency control)
  const lpTimer = useRef(null)
  useEffect(() => () => clearTimeout(lpTimer.current), [])
  const lpStart = onBulk ? () => { lpTimer.current = setTimeout(onBulk, 450) } : undefined
  const lpEnd = onBulk ? () => clearTimeout(lpTimer.current) : undefined
  if (qty === 0) {
    return (
      <Button
        className="padd stepin" variant="outline" color="green" size="2"
        onClick={onAdd} style={{ fontWeight: 800, margin: 0 }}
      >
        ADD
      </Button>
    )
  }
  return (
    <Flex className="padd stepin on" align="center" justify="between" style={{ background: 'var(--green-11)' }}>
      <IconButton size="1" aria-label="Decrease quantity" onClick={onRemove} style={{ background: 'transparent', color: '#fff' }}>
        <MinusIcon />
      </IconButton>
      <Text
        key={qty} className="numpop"
        size="2" weight="bold" style={{ color: '#fff', userSelect: 'none' }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={lpStart} onPointerUp={lpEnd} onPointerLeave={lpEnd} onPointerCancel={lpEnd}
      >
        {qty}
      </Text>
      <IconButton size="1" aria-label="Increase quantity" onClick={onAdd} style={{ background: 'transparent', color: '#fff' }}>
        <PlusIcon />
      </IconButton>
    </Flex>
  )
}

/* Sticky cart summary bar — shared across the footer and most full-screen pages */
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

export { PageExit, SkyLayer, CartGlyph, DealTimer, SectionHead, AddControl, CartBar }

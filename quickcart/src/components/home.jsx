import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, Flex, Grid, Heading, Text } from '@radix-ui/themes'
import { ChevronRightIcon, LightningBoltIcon, RocketIcon } from '@radix-ui/react-icons'
import {
  BESTS, BRAND_DAY, CAT_RULES, CATEGORIES, COMBOS, FEED_CAP, FEED_POOL, INSPO, INSPO_ROOMS, TARGETS, TIERS, MY_RANK,
} from '../data.js'
import { safeGet, safeSet } from '../lib/storage.js'
import { DAY, sparkle, scrollToId, img, btnish } from '../lib/util.js'
import { SectionHead, DealTimer } from './ui.jsx'
import { ProductCard, FlashCard, ComboCard } from './cards.jsx'
import { Img } from './Img.jsx'

export const fmtL = (n) => (n >= 100000 ? `₹${(n / 100000).toFixed(2)}L` : `₹${n.toLocaleString('en-IN')}`)

const saveCoupon = (c) => {
  try { safeSet('qc-coupon', JSON.stringify(c)) } catch { /**/ }
}

function streakDays() {
  try {
    const a = JSON.parse(safeGet('qc-streak-days') || '[]')
    return Array.isArray(a) ? a : []
  } catch { return [] }
}

function streakCount(days) {
  let count = 0
  const d = new Date()
  if (!days.includes(d.toDateString())) d.setDate(d.getDate() - 1)
  while (days.includes(d.toDateString())) {
    count += 1
    d.setDate(d.getDate() - 1)
  }
  return count
}

export function StreakCard() {
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
      setDays([DAY])
      try { safeSet('qc-streak-days', JSON.stringify([DAY])) } catch { /**/ }
    } else {
      setDays(next)
      try { safeSet('qc-streak-days', JSON.stringify(next)) } catch { /**/ }
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

export function GameRow({ onSpin }) {
  return (
    <div className="game-row">
      <button className="game-card game-spin" onClick={onSpin}>
        <Text size="3" weight="bold" as="div" mt="1" style={{ color: '#fff' }}>Spin & Win</Text>
        <Text size="1" as="div" mt="1" style={{ color: 'rgba(255,255,255,.88)' }}>
          1 free spin today · up to ₹250 off
        </Text>
      </button>
      <StreakCard />
    </div>
  )
}

export function Leaderboard() {
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

export function BestSellers({ onCat }) {
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
          const imgs = []; const seen = new Set()
          for (const p of [...FEED_POOL.filter(CAT_RULES[cat]), ...FEED_POOL]) {
            if (imgs.length >= 4) break
            if (!seen.has(p.ph)) { seen.add(p.ph); imgs.push(p) }
          }
          const count = (CATEGORIES.find(c => c[1] === cat) || [])[2] || 99
          return (
            <button key={cat} className="bs-card" onClick={() => onCat(cat)}>
              <div className="bs-gridwrap">
                <div className="bs-grid">{imgs.map(p => <Img key={p.id} src={img(p.ph, 180)} alt="" loading="lazy" />)}</div>
                <span className="bs-more">+{count} more</span>
              </div>
              <Text as="div" weight="bold" style={{ fontSize: 15, letterSpacing: '-0.2px', padding: '14px 4px 2px' }}>{label}</Text>
            </button>
          )
        })}
      </div>
      <div className="bs-prog">{BESTS.map((_, i) => <span key={i} className={i === idx ? 'on' : ''} />)}</div>
    </Box>
  )
}

export function FlashSale({ items, onChange, onSeeAll }) {
  if (items.length === 0) return null
  return (
    <div className="band-flash cv" id="deals">
      <Flex align="center" justify="between" px="4">
        <Flex align="center" gap="3" style={{ minWidth: 0 }}>
          <Heading as="h2" size="4" style={{ color: '#fff', letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <LightningBoltIcon width={17} height={17} style={{ color: 'var(--gold-9)' }} /> Flash sale
          </Heading>
          <DealTimer />
        </Flex>
        <Text size="2" weight="bold" style={{ color: 'rgba(255,255,255,.9)', cursor: 'pointer', flex: 'none' }} onClick={onSeeAll}>See all</Text>
      </Flex>
      <Box px="4" mt="1" mb="3">
        <Text size="1" style={{ color: 'rgba(255,255,255,.8)' }}>Deals + clearance · up to 60% off · last units</Text>
      </Box>
      <div className="hscroll">{items.map(p => <FlashCard key={`fl-${p.id}`} p={p} onChange={onChange} />)}</div>
    </div>
  )
}

export function ComboDeals({ onChange }) {
  return (
    <Box pt="5">
      <SectionHead title="Combo kits" extra={<span className="save-pill">BUNDLE &amp; SAVE</span>} />
      <div className="hscroll">{COMBOS.map(c => <ComboCard key={c.id} c={c} onChange={onChange} />)}</div>
    </Box>
  )
}

export function InspoStrip({ onOpen }) {
  return (
    <Box pt="5">
      <SectionHead title="Shop the look" extra={<span className="save-pill">UPDATED WEEKLY</span>} onSeeAll={() => onOpen(null)} />
      <div className="hscroll">
        {INSPO.slice(0, 4).map(lk => (
          <div key={lk.id} className="insp-mini" {...btnish(() => onOpen(lk.id))}>
            <Img src={img(lk.ph, 360)} alt="" />
            {lk.fresh && <span className="insp-new">NEW</span>}
            <span className="insp-mini-cap"><b>{lk.title}</b><i>{lk.room} · {lk.products.length} products</i></span>
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

export function BrandDay({ onShop }) {
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
          <Button size="2" color="green" radius="full" style={{ fontWeight: 800, flex: 'none' }} onClick={onShop}>{BRAND_DAY.cta}</Button>
        </Flex>
      </div>
    </Box>
  )
}

export function CategoryGrid({ onPick, onSeeAll }) {
  return (
    <Box pt="5">
      <SectionHead title="Shop by category" onSeeAll={onSeeAll} />
      <Grid columns="3" gapX="3" gapY="4" px="4">
        {CATEGORIES.map(([ph, label, count]) => (
          <div className="cat-tile" key={label} {...btnish(() => onPick(label))}>
            <Img className="cat-img" src={img(ph, 280)} alt={label} loading="lazy" />
            <Text size="1" weight="bold" as="div" align="center" mt="2" truncate>{label}</Text>
            <Text as="div" align="center" style={{ fontSize: 10.5, color: 'var(--gray-9)', fontWeight: 600 }}>{count} items</Text>
          </div>
        ))}
      </Grid>
    </Box>
  )
}

export function EndlessFeed({ onChange, pool }) {
  const [items, setItems] = useState(() => pool.slice(0, 6).map(p => ({ p, k: `f0-${p.id}` })))
  const [loading, setLoading] = useState(false)
  const sentinel = useRef(null)
  const batch = useRef(1)
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
      const next = [...pool, ...pool].slice(start, start + 6).map(p => ({ p, k: `f${b}-${p.id}` }))
      setItems(cur => [...cur, ...next])
      setLoading(false)
    }, 700)
  }, [loading, items.length, pool])
  useEffect(() => {
    const ob = new IntersectionObserver(entries => { if (entries[0].isIntersecting) loadMore() }, { rootMargin: '600px' })
    if (sentinel.current) ob.observe(sentinel.current)
    return () => ob.disconnect()
  }, [loadMore])
  const done = items.length >= FEED_CAP
  return (
    <Box pt="5">
      <SectionHead title="You might also like" />
      <Grid columns="3" gapX="3" gapY="4" px="4">
        {items.map(it => <ProductCard key={it.k} p={it.p} grid onChange={onChange} />)}
        {loading && [0, 1, 2].map(i => <div className="skel" key={`sk${i}`} />)}
      </Grid>
      <div ref={sentinel} />
      {done && (
        <Flex direction="column" align="center" py="6" gap="1">
          <Text size="2" weight="bold" color="gray">You're all caught up</Text>
          <Text size="1" color="gray">Fresh picks land every morning</Text>
        </Flex>
      )}
    </Box>
  )
}

import { useState, useMemo, useEffect, useRef } from 'react'
import { Box, Flex, Grid, Heading, Text, Button } from '@radix-ui/themes'
import {
  ArrowLeftIcon, MagnifyingGlassIcon, MixerHorizontalIcon, ChevronDownIcon,
  RowsIcon, DashboardIcon, FileTextIcon, RocketIcon,
} from '@radix-ui/react-icons'
import { FEED_POOL, BRAND_KEYS, BRAND_LOGOS } from '../../data.js'
import {
  DEFAULT_F, fBadges, fSummary, CAT_RULES, applyF, PLP_RAIL,
  SORT_OPTIONS, SUBCATS, subcatThumb, MERCH_ROWS,
} from '../../lib/catalog.js'
import { img, btnish } from '../../lib/util.js'
import { useNextFrame } from '../../hooks.js'
import { usePersisted } from '../../lib/storage.js'
import { Img } from '../../components/Img.jsx'
import { CartBar } from '../../components/ui.jsx'
import { ProductCard, ProductRow } from '../../components/cards.jsx'
import { RecoStrip } from '../../components/feed.jsx'
import { FilterSheet } from '../../components/category/FilterSheet.jsx'

/* Category listing page (PLP) — rail of categories, filter/sort chips, product
   grid/list, and the shared filter sheet. Rendered at /category[/:cat]. */
export function CategoryPage({ cat, onPick, onClose, onChange, onSearch, cart, homeBrand = 'ALL', recoStrip, onRecoClose }) {
  const [b, setB] = useState(homeBrand)
  const [f, setF] = useState(DEFAULT_F)
  // #fsheet hash opens the filter sheet for design review
  const [fOpen, setFOpen] = useState(() => {
    const m = window.location.hash.match(/^#fsheet(?:-(\w+))?$/)
    return m ? (m[1] || 'sub') : null
  })
  const mainRef = useRef(null)
  const badgeTotal = Object.values(fBadges(f, b)).reduce((a, x) => a + x, 0)

  // rail hop → back to top, and subcategories are category-specific so they reset
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 })
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear subcategory filter when the category changes
    setF(cur => ({ ...cur, spec: null }))
  }, [cat])

  const inCat = useMemo(() => FEED_POOL.filter(CAT_RULES[cat] || (() => true)), [cat])
  const dealsAvail = inCat.filter(p => p.tag).length

  const products = useMemo(() => applyF(inCat, f, b), [inCat, f, b])

  const railImg = (PLP_RAIL.find(r => r[1] === cat) || PLP_RAIL[0])[0]
  const pageReady = useNextFrame()
  const [plpView, setPlpView] = usePersisted('qc-plp-view', 'list')
  const gridKey = `${cat}|${b}|${JSON.stringify(f)}`
  const summary = [
    `${products.length} item${products.length === 1 ? '' : 's'}`,
    ...fSummary(f, b),
  ].join(' · ')

  // merch strip after every 6th product breaks grid monotony
  const cells = []
  products.forEach((p, i) => {
    if (i > 0 && i % 6 === 0) cells.push({ merchIdx: (i / 6 - 1) % MERCH_ROWS.length })
    cells.push(p)
  })

  return (
    <div className="plp">
      <div className="plp-head">
        <button className="sheet-back" onClick={onClose} aria-label="Back">
          <ArrowLeftIcon width={18} height={18} />
        </button>
        <Box style={{ flex: 1, textAlign: 'center' }}>
          <Heading as="h2" size="4" style={{ letterSpacing: '-0.2px' }}>
            {cat === 'All' ? 'All fittings' : cat}
          </Heading>
          {b !== 'ALL' && (
            <Text size="1" color="gray" as="div" style={{ marginTop: 1 }}>
              {b.charAt(0).toUpperCase() + b.slice(1)} store
            </Text>
          )}
        </Box>
        <button className="sheet-back" onClick={onSearch} aria-label="Search">
          <MagnifyingGlassIcon width={18} height={18} />
        </button>
      </div>
      <div className="plp-body">
        <div className="plp-rail">
          {PLP_RAIL.map(([ph, label]) => (
            <div key={label} className={`rail-item ${label === cat ? 'on' : ''}`} {...btnish(() => onPick(label))}>
              <Img src={img(ph, 140)} alt={label} loading="lazy" />
              <span className="rl">{label}</span>
            </div>
          ))}
        </div>
        <div className="plp-main" ref={mainRef}>
          <div className="plp-sticky">
            <div className="plp-chips">
              <button className={`pchip ${badgeTotal > 0 ? 'on' : ''}`} onClick={() => setFOpen(cat === 'All' ? 'material' : 'sub')}>
                <MixerHorizontalIcon width={13} height={13} />
                Filters{badgeTotal > 0 ? ` · ${badgeTotal}` : ''}
              </button>
              <button className={`pchip ${f.sort > 0 ? 'on' : ''}`} onClick={() => setFOpen('sort')}>
                {f.sort > 0 ? SORT_OPTIONS[f.sort] : 'Sort'} <ChevronDownIcon width={13} height={13} />
              </button>
              <button className={`pchip ${f.deals ? 'on' : ''}`} onClick={() => setF(cur => ({ ...cur, deals: !cur.deals }))}>
                Deals only
              </button>
              {(SUBCATS[cat] || []).map(([label, kw]) => {
                const th = subcatThumb(kw)
                return (
                  <button
                    key={kw} className={`pchip ${f.spec?.[1] === kw ? 'on' : ''}`}
                    onClick={() => setF(cur => ({ ...cur, spec: cur.spec?.[1] === kw ? null : [label, kw] }))}
                  >
                    {th && <Img className="pi" src={img(th, 80)} alt="" />}
                    {label}
                  </button>
                )
              })}
              {BRAND_KEYS.slice(1).map(k => (
                <button key={k} className={`pchip ${b === k ? 'on' : ''}`} onClick={() => setB(cur => (cur === k ? 'ALL' : k))}>
                  <img className="pi-logo" src={BRAND_LOGOS[k]} alt="" />
                  {k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button
            className="plp-banner"
            onClick={() => dealsAvail > 0 && setF(cur => ({ ...cur, deals: !cur.deals }))}
            style={{ cursor: dealsAvail > 0 ? 'pointer' : 'default' }}
          >
            <Box flexGrow="1">
              <Text size="3" weight="bold" as="div" style={{ color: '#5c3a10', letterSpacing: '-0.2px' }}>
                {dealsAvail > 0
                  ? (f.deals ? 'Showing deals only' : `${dealsAvail} deal${dealsAvail === 1 ? '' : 's'} live in ${cat === 'All' ? 'fittings' : cat.toLowerCase()}`)
                  : `Pro picks: ${cat === 'All' ? 'every fitting' : cat.toLowerCase()}`}
              </Text>
              <Text size="1" weight="medium" as="div" mt="1" style={{ color: '#7a5420' }}>
                {dealsAvail > 0
                  ? (f.deals ? 'Tap to see everything again' : 'Trade prices · tap to show only deals')
                  : 'Trade prices · GST billing · 90-min delivery'}
              </Text>
            </Box>
            <Img src={img(railImg, 200)} alt="" />
          </button>

          <Flex align="center" justify="between" pt="2" pb="1">
            <Text size="1" color="gray">{summary}</Text>
            <div className="view-toggle">
              <button className={plpView === 'list' ? 'on' : ''} onClick={() => setPlpView('list')} aria-label="List view"><RowsIcon width={15} height={15} /></button>
              <button className={plpView === 'grid' ? 'on' : ''} onClick={() => setPlpView('grid')} aria-label="Grid view"><DashboardIcon width={15} height={15} /></button>
            </div>
          </Flex>

          {!pageReady ? (
            <Grid columns="2" gapX="3" gapY="4" pt="1">
              {[0, 1, 2, 3].map(i => <div className="skel" key={`pk${i}`} />)}
            </Grid>
          ) : products.length > 0 ? (
            plpView === 'list' ? (
              <div className="plp-list" key={gridKey}>
                {products.map(p => <ProductRow key={`pl-${p.id}`} p={p} onChange={onChange} />)}
              </div>
            ) : (
            <Grid columns="2" gapX="3" gapY="4" pt="1" key={gridKey}>
              {cells.map((c, i) =>
                c.merchIdx != null ? (
                  <div className="merch-row cardin" key={`m${i}`} style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                    <span className="merch-ic">
                      {MERCH_ROWS[c.merchIdx].icon === 'gst'
                        ? <FileTextIcon width={18} height={18} />
                        : <RocketIcon width={18} height={18} />}
                    </span>
                    <Box>
                      <Text size="1" weight="bold" as="div" style={{ color: 'var(--blue-11)' }}>{MERCH_ROWS[c.merchIdx].t}</Text>
                      <Text as="div" style={{ fontSize: 11, color: 'var(--blue-11)', opacity: .8 }}>{MERCH_ROWS[c.merchIdx].s}</Text>
                    </Box>
                  </div>
                ) : (
                  <div className="cardin" key={`plp-${c.id}`} style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}>
                    <ProductCard p={c} grid onChange={onChange} />
                  </div>
                ),
              )}
            </Grid>
            )
          ) : (
            <Flex direction="column" align="center" py="8" gap="2">
              <Text size="2" weight="bold" color="gray">Nothing matches these filters</Text>
              <Button size="1" radius="full" variant="soft" onClick={() => { setB('ALL'); setF(DEFAULT_F) }}>
                Clear filters
              </Button>
            </Flex>
          )}
        </div>
      </div>
      <div className="plp-cartwrap">
        <RecoStrip items={recoStrip} onClose={onRecoClose} onChange={onChange} />
        <CartBar cart={cart} />
      </div>

      <FilterSheet
        group={fOpen} onGroup={setFOpen} cat={cat}
        b={b} setB={setB} f={f} setF={setF} count={products.length}
      />
    </div>
  )
}

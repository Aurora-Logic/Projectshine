import { useContext, useEffect, useState } from 'react'
import { Box, Button, Flex, Grid, Text, TextField } from '@radix-ui/themes'
import { ArrowLeftIcon, MagnifyingGlassIcon, MixerHorizontalIcon, RowsIcon, DashboardIcon } from '@radix-ui/react-icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { FEED_POOL, BRAND_LOGOS } from '../data.js'
import { img } from '../lib/util.js'
import { usePersisted } from '../lib/storage.js'
import { CAT_RULES, PLP_RAIL, BRAND_KEYS, DEFAULT_F, applyF, fBadges, fSummary } from '../lib/catalog.js'
import { VariantCtx } from '../contexts.js'
import { Img } from '../components/Img.jsx'
import { ProductCard, ProductRow } from '../components/cards.jsx'
import { RecoStrip } from '../components/feed.jsx'
import { FilterSheet } from '../components/FilterSheet.jsx'

export default function SearchPage({ onChange, recoStrip, onRecoClose }) {
  const navigate = useNavigate()
  const { state } = useLocation()
  const variant = useContext(VariantCtx)

  // sheet data passed via router state, or default to all products
  const sheetItems = state?.items || FEED_POOL
  const sheetTitle = state?.title || null
  const sheetQuery = state?.query || ''

  const [q, setQ] = useState(sheetQuery)
  const [b, setB] = useState('ALL')
  const [cat, setCat] = useState('All')
  const [f, setF] = useState(DEFAULT_F)
  const [fOpen, setFOpen] = useState(null)
  const [pageReady, setPageReady] = useState(false)
  const [plpView, setPlpView] = usePersisted('qc-plp-view', 'list')

  useEffect(() => {
    setPageReady(false)
    const id = requestAnimationFrame(() => setPageReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const ql = q.trim().toLowerCase()
  const base = applyF(sheetItems.filter(CAT_RULES[cat] || (() => true)), f, b)
  const snorm = (s) => s.toLowerCase().replace(/-/g, ' ')
  const tokens = snorm(ql).split(/\s+/).filter(Boolean).map(t => t.replace(/s$/, ''))
  const hits = base.filter(p => {
    if (tokens.length === 0) return true
    const hay = snorm(`${p.name} ${p.qty || ''} ${p.brand} ${p.mat || ''}`)
    return tokens.every(t => hay.includes(t))
  })
  const fallback = ql && hits.length === 0
  const shown = fallback ? base : hits

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label="Search" tabIndex={-1}>
      <div className="sheet-head">
        <button className="sheet-back" onClick={() => navigate(-1)} aria-label="Back">
          <ArrowLeftIcon width={18} height={18} />
        </button>
        <TextField.Root
          size="3" radius="full" autoFocus enterKeyHint="search" value={q} placeholder="Search fittings, brands, sizes…"
          onChange={(e) => setQ(e.target.value)} style={{ flex: 1 }}
        >
          <TextField.Slot>
            <MagnifyingGlassIcon width={16} height={16} />
          </TextField.Slot>
        </TextField.Root>
        <button
          className="sheet-back" aria-label="Filters" style={{ position: 'relative' }}
          onClick={() => setFOpen(cat === 'All' ? 'material' : 'sub')}
        >
          <MixerHorizontalIcon width={17} height={17} />
          {Object.values(fBadges(f, b)).reduce((a, x) => a + x, 0) > 0 && (
            <span className="fs-dot" />
          )}
        </button>
      </div>
      <div className="plp-body">
        <div className="plp-rail">
          {PLP_RAIL.map(([ph, label]) => (
            <div key={label} className={`rail-item ${label === cat ? 'on' : ''}`} onClick={() => setCat(label)}>
              <Img src={img(ph, 140)} alt={label} loading="lazy" />
              <span className="rl">{label}</span>
            </div>
          ))}
        </div>
        <div className="plp-main">
          <div className="sheet-brands" style={{ padding: '12px 0 2px' }}>
            {BRAND_KEYS.map(k => (
              <button key={k} className={`sim-chip ${b === k ? 'on' : ''}`} onClick={() => setB(k)}>
                {k !== 'ALL' && (
                  <span className="lgchip"><img src={BRAND_LOGOS[k]} alt="" /></span>
                )}
                {k === 'ALL' ? 'All brands' : k.charAt(0).toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
          <Flex align="center" justify="between" pt="2" gap="2">
            <Text size="1" color="gray" style={{ flex: 1, minWidth: 0 }}>
              {fallback
                ? `No exact matches for "${q}" — showing everything${cat !== 'All' ? ` in ${cat}` : ''}`
                : [
                    `${shown.length} item${shown.length === 1 ? '' : 's'}`,
                    cat !== 'All' && cat,
                    ...fSummary(f, b),
                    sheetTitle,
                  ].filter(Boolean).join(' · ')}
            </Text>
            {variant === 'experiment' && (
              <div className="view-toggle">
                <button className={plpView === 'list' ? 'on' : ''} onClick={() => setPlpView('list')} aria-label="List view"><RowsIcon width={15} height={15} /></button>
                <button className={plpView === 'grid' ? 'on' : ''} onClick={() => setPlpView('grid')} aria-label="Grid view"><DashboardIcon width={15} height={15} /></button>
              </div>
            )}
          </Flex>
          {pageReady && shown.length === 0 ? (
            <Flex direction="column" align="center" py="8" gap="2">
              <Text size="2" weight="bold" color="gray">Nothing matches these filters</Text>
              <Button size="1" radius="full" variant="soft" onClick={() => { setB('ALL'); setF(DEFAULT_F); setCat('All') }}>
                Clear filters
              </Button>
            </Flex>
          ) : !pageReady ? (
            <Grid columns="2" gapX="3" gapY="4" pt="3" pb="9">
              {[0, 1, 2, 3].map(i => <div className="skel" key={`sk${i}`} />)}
            </Grid>
          ) : variant === 'experiment' && plpView === 'list' ? (
            <div className="plp-list" style={{ paddingTop: 6, paddingBottom: 36 }}>
              {shown.map(p => <ProductRow key={`s-${p.id}`} p={p} onChange={onChange} />)}
            </div>
          ) : (
            <Grid columns="2" gapX="3" gapY="4" pt="3" pb="9">
              {shown.map(p => <ProductCard key={`s-${p.id}`} p={p} grid onChange={onChange} />)}
            </Grid>
          )}
        </div>
      </div>
      <div className="sheet-reco">
        <RecoStrip items={recoStrip} onClose={onRecoClose} onChange={onChange} />
      </div>
      <FilterSheet
        group={fOpen} onGroup={setFOpen} cat={cat}
        b={b} setB={setB} f={f} setF={setF} count={shown.length}
      />
    </div>
  )
}

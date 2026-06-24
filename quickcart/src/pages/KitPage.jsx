import { useState } from 'react'
import { Box, Flex, Heading, Text } from '@radix-ui/themes'
import { ArrowLeftIcon, BookmarkIcon, CheckIcon, MinusIcon, PlusIcon } from '@radix-ui/react-icons'
import { useNavigate } from 'react-router-dom'
import { KITS, FEED_POOL } from '../data.js'

const LIST_SEED = [
  { id: 'l1', name: 'Sharma kitchen site', items: [{ id: 'ba1', n: 20 }, { id: 'ba2', n: 30 }, { id: 'dl1', n: 12 }] },
]
import { safeGet, safeSet } from '../lib/storage.js'
import { img, sparkle } from '../lib/util.js'
import { lineTotal, unitPriceFor } from '../money.js'
import { useSheetA11y } from '../hooks.js'
import { Img } from '../components/Img.jsx'

/* ---------- list persistence ---------- */

function loadLists() {
  try {
    const s = JSON.parse(safeGet('qc-lists') || 'null')
    if (Array.isArray(s)) return s
  } catch { /**/ }
  return LIST_SEED || []
}

const saveLists = (l) => safeSet('qc-lists', JSON.stringify(l))

/* ---------- KitPage ---------- */

export default function KitPage({ onChange }) {
  const navigate = useNavigate()
  const onClose = () => navigate(-1)
  const a11y = useSheetA11y(onClose)
  const onGoCart = () => navigate('/cart')

  const [kitKey, setKitKey] = useState('kitchen')
  const kit = KITS.find(k => k.key === kitKey)
  const [counts, setCounts] = useState(() =>
    Object.fromEntries(KITS.flatMap(k => k.counts.map(([key, , def]) => [key, def]))))
  const [off, setOff] = useState({})
  const [done, setDone] = useState(false)
  const [savedList, setSavedList] = useState(false)

  const rows = kit.items
    .map(([id, per, q]) => {
      const p = FEED_POOL.find(x => x.id === id)
      if (!p) return null
      const n = per === 'fixed' ? q : Math.max(1, Math.ceil((counts[per] || 0) * q))
      return { p, n, on: !off[id] }
    })
    .filter(Boolean)

  const live = rows.filter(r => r.on)
  const total = live.reduce((s, r) => s + lineTotal(r.p, r.n), 0)
  const listSave = live.reduce((s, r) => s + (r.p.price * r.n - lineTotal(r.p, r.n)), 0)
  const pieces = live.reduce((s, r) => s + r.n, 0)

  const step = (key, d) => {
    setDone(false)
    setCounts(c => ({ ...c, [key]: Math.min(20, Math.max(1, (c[key] || 1) + d)) }))
  }

  const addAll = (e) => {
    live.forEach(r => onChange(r.n, r.p, { noReco: true }))
    sparkle(e)
    setDone(true)
  }

  const saveAsList = () => {
    const lists = loadLists()
    saveLists([...lists, {
      id: `l${Date.now()}`,
      name: `${kit.label} kit`,
      items: live.map(r => ({ id: r.p.id, n: r.n })),
    }])
    setSavedList(true)
  }

  return (
    <div className="kitpage" role="dialog" aria-modal="true" aria-label="Project Kit Builder" tabIndex={-1} ref={a11y}>
      <div className="pdp-head">
        <button className="sheet-back" onClick={onClose} aria-label="Back"><ArrowLeftIcon /></button>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>Project Kit Builder</Heading>
          <Text size="1" color="gray" as="div">Complete fittings list, sized to your site</Text>
        </Box>
      </div>
      <div className="cp-body">
        <div className="kit-tiles">
          {KITS.map(k => {
            const on = k.key === kitKey
            return (
              <button
                key={k.key} className={`kit-tile ${on ? 'on' : ''}`}
                onClick={() => { setKitKey(k.key); setOff({}); setDone(false); setSavedList(false) }}
              >
                <Img src={img(k.ph, 300)} alt="" />
                <span className="kit-cap">{k.label}</span>
                {on && <span className="kit-check"><CheckIcon width={12} height={12} /></span>}
              </button>
            )
          })}
        </div>
        <Text size="1" color="gray" as="div" mt="2" mb="3" style={{ padding: '0 4px' }}>{kit.blurb}</Text>

        <div className="cp-card">
          <Text size="1" weight="bold" as="div" className="u-seclabel">PROJECT SIZE</Text>
          {kit.counts.map(([key, label]) => (
            <Flex key={key} align="center" justify="between" mt="3">
              <Text size="2" weight="bold">{label}</Text>
              <div className="qs-step" style={{ margin: 0, padding: 0, border: 'none' }}>
                <button className="qs-sbtn" onClick={() => step(key, -1)} aria-label={`Fewer ${label}`}><MinusIcon /></button>
                <Text size="3" weight="bold" style={{ width: 38, textAlign: 'center' }}>{counts[key]}</Text>
                <button className="qs-sbtn" onClick={() => step(key, 1)} aria-label={`More ${label}`}><PlusIcon /></button>
              </div>
            </Flex>
          ))}
        </div>

        <div className="cp-card">
          <Flex align="center" justify="between">
            <Text size="1" weight="bold" className="u-seclabel">
              YOUR KIT · {live.length} ITEMS · {pieces} PCS
            </Text>
            {listSave > 0 && <span className="st-chip ok">SAVES ₹{listSave.toLocaleString('en-IN')}</span>}
          </Flex>
          {rows.map(r => {
            const u = unitPriceFor(r.p, r.n)
            return (
              <div key={r.p.id} className={`claim-item ${r.on ? 'on' : ''}`}>
                <button
                  className="claim-check"
                  onClick={() => { setOff(o => ({ ...o, [r.p.id]: !o[r.p.id] })); setDone(false) }}
                  aria-label={r.on ? `Remove ${r.p.name}` : `Include ${r.p.name}`}
                >
                  {r.on && <CheckIcon width={12} height={12} />}
                </button>
                <Img src={img(r.p.ph, 120)} alt="" style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover', flex: 'none', opacity: r.on ? 1 : .45 }} />
                <Box flexGrow="1" style={{ minWidth: 0, opacity: r.on ? 1 : .45 }}>
                  <Text size="1" weight="bold" as="div" className="clamp1">{r.p.name}</Text>
                  <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>
                    {r.n} × ₹{u.toLocaleString('en-IN')}{u < r.p.price ? ' · bulk price' : ''}
                  </Text>
                </Box>
                <Text size="1" weight="bold" style={{ flex: 'none', whiteSpace: 'nowrap', opacity: r.on ? 1 : .45 }}>
                  ₹{lineTotal(r.p, r.n).toLocaleString('en-IN')}
                </Text>
              </div>
            )
          })}
          <button className={`kit-save ${savedList ? 'done' : ''}`} onClick={savedList ? undefined : saveAsList}>
            {savedList
              ? <><CheckIcon width={13} height={13} /> Saved — Account → Project lists</>
              : <><BookmarkIcon width={13} height={13} /> Save as a project list</>}
          </button>
        </div>
      </div>
      <div className="kit-bar">
        <Box style={{ minWidth: 0 }}>
          <Text size="1" color="gray" as="div">{pieces} pieces</Text>
          <Text size="3" weight="bold" as="div" style={{ letterSpacing: '-0.3px' }}>₹{total.toLocaleString('en-IN')}</Text>
        </Box>
        {done ? (
          <button className="qs-cta" style={{ margin: 0, flex: 1 }} onClick={onGoCart}>
            <span><CheckIcon width={14} height={14} style={{ marginRight: 6, verticalAlign: -2 }} />Kit added</span>
            <span>Go to cart</span>
          </button>
        ) : (
          <button className="qs-cta" style={{ margin: 0, flex: 1 }} onClick={addAll} disabled={live.length === 0}>
            <span>Add kit to cart</span>
            <span>{live.length} items</span>
          </button>
        )}
      </div>
    </div>
  )
}

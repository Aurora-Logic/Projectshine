import { useContext, useEffect, useState } from 'react'
import { Box, Heading, Text } from '@radix-ui/themes'
import { ArrowLeftIcon, PlusIcon } from '@radix-ui/react-icons'
import { useNavigate, useParams } from 'react-router-dom'
import { INSPO, INSPO_ROOMS, FEED_POOL } from '../data.js'
import { img, sparkle, btnish } from '../lib/util.js'
import { useSheetA11y } from '../hooks.js'
import { QtyCtx, CartItemsCtx } from '../contexts.js'
import { Img } from '../components/Img.jsx'

export default function InspoPage({ onChange }) {
  const navigate = useNavigate()
  const { id: startId } = useParams()
  const onClose = () => navigate(-1)
  const a11y = useSheetA11y(onClose)
  const openQty = useContext(QtyCtx)
  const items = useContext(CartItemsCtx)

  const [room, setRoom] = useState('All')
  const [look, setLook] = useState(() => (startId ? INSPO.find(l => l.id === startId) : null) || null)

  useEffect(() => {
    if (!look) return undefined
    if (!window.history.state?.qcInspoLook) window.history.pushState({ qcInspoLook: true }, '')
    const onPop = () => setLook(null)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [look])

  const closeLook = () => {
    if (window.history.state?.qcInspoLook) window.history.back()
    else setLook(null)
  }

  const shown = room === 'All' ? INSPO : INSPO.filter(l => l.room === room)
  const resolve = (ids) => ids.map(id => FEED_POOL.find(p => p.id === id)).filter(Boolean)
  const [added, setAdded] = useState(false)

  const addAll = (e) => {
    resolve(look.products).forEach(p => onChange(1, p, { noReco: true }))
    sparkle(e)
    setAdded(true)
  }

  return (
    <div className="inspopage" role="dialog" aria-modal="true" aria-label="Inspiration" tabIndex={-1} ref={a11y}>
      <div className="pdp-head">
        <button className="sheet-back" onClick={onClose} aria-label="Back"><ArrowLeftIcon /></button>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>Inspiration</Heading>
          <Text size="1" color="gray" as="div">Real installs · every look is shoppable</Text>
        </Box>
      </div>
      <div className="insp-chips">
        {INSPO_ROOMS.map(r => (
          <button key={r} className={`seg-b ${room === r ? 'on' : ''}`} onClick={() => setRoom(r)}>{r}</button>
        ))}
      </div>
      <div className="cp-body" style={{ paddingTop: 4 }}>
        <div className="insp-grid">
          {shown.map((lk, i) => (
            <div
              key={lk.id} className="insp-card cardin" style={{ animationDelay: `${i * 40}ms` }}
              {...btnish(() => setLook(lk))}
            >
              <div className="insp-ph" style={{ aspectRatio: ['3 / 4', '1 / 1', '4 / 5'][i % 3] }}>
                <Img src={img(lk.ph, 480)} alt={lk.title} />
                {lk.fresh && <span className="insp-new">NEW</span>}
                <span className="insp-cap">
                  <b>{lk.title}</b>
                  <i>{lk.room} · {lk.products.length} products</i>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {look && (
        <div className="insp-detail">
          <div className="insp-hero">
            <Img src={img(look.ph, 800)} alt="" />
            <button className="sheet-back insp-back" onClick={closeLook} aria-label="Back to looks">
              <ArrowLeftIcon width={18} height={18} />
            </button>
            <span className="insp-room">{look.room}</span>
          </div>
          <div className="insp-body">
            <Heading as="h2" size="4" style={{ letterSpacing: '-0.4px' }}>{look.title}</Heading>
            <Text size="1" color="gray" as="div" mt="1">
              Every fitting in this install, ready to order
            </Text>
            <div className="cp-card" style={{ marginTop: 14 }}>
              <Text size="1" weight="bold" as="div" className="u-seclabel">
                SHOP THIS LOOK · {look.products.length} ITEMS
              </Text>
              {resolve(look.products).map(p => {
                const n = items[p.id]?.n || 0
                return (
                  <div className="cs-row" key={`il-${p.id}`}>
                    <Img src={img(p.ph, 120)} alt="" />
                    <Box flexGrow="1" style={{ minWidth: 0 }}>
                      <Text size="1" weight="bold" as="div" className="clamp1">{p.name}</Text>
                      <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>
                        ₹{p.price.toLocaleString('en-IN')}{p.bulk ? ` · ${p.bulk}` : ''}
                      </Text>
                    </Box>
                    <button className={`insp-add ${n > 0 ? 'in' : ''}`} onClick={() => (openQty ? openQty(p) : onChange(1, p))}>
                      {n > 0 ? `${n} ✓` : 'ADD'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="kit-bar">
            <Box style={{ minWidth: 0 }}>
              <Text size="1" color="gray" as="div">{look.products.length} fittings</Text>
              <Text size="2" weight="bold" as="div">Start with 1 pc each</Text>
            </Box>
            <button className="qs-cta" style={{ margin: 0, flex: 1 }} onClick={added ? closeLook : addAll}>
              <span>{added ? 'Added — keep browsing' : 'Add full look'}</span>
              {!added && <PlusIcon width={15} height={15} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

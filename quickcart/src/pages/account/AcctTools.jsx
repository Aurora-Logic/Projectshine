import { useEffect, useState } from 'react'
import { Box, Button, Flex, Text } from '@radix-ui/themes'
import { CheckIcon, ChevronDownIcon, ChevronRightIcon, Cross2Icon, EnvelopeClosedIcon, MobileIcon, MinusIcon, PlusIcon, SewingPinIcon, UploadIcon } from '@radix-ui/react-icons'
import { BRAND_DAY, PAST_ORDERS, FEED_POOL } from '../../data.js'
import { usePersisted } from '../../lib/storage.js'
import { img, sparkle } from '../../lib/util.js'
import { Img } from '../../components/Img.jsx'
import { Toggle } from './AcctDash.jsx'
import { CalPicker } from './AcctOrders.jsx'

const TIME_SLOTS = ['10 AM', '11 AM', '12 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM']
const VISIT_STAGES = { site: ['Received', 'Team assigned', 'Visit scheduled'], display: ['Received', 'Slot confirmed', 'Visited'] }
const visitStage = (r, now) => {
  const el = (now - r.ts) / 1000
  const raw = el < 90 ? 0 : el < 240 ? 1 : 2
  return r.date && now < r.date ? Math.min(raw, 1) : raw
}

function VisitRow({ r, now, kind }) {
  const STAGES = VISIT_STAGES[kind]
  const si = visitStage(r, now)
  const dl = r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''
  const place = r.addr ? r.addr.split(',').slice(-1)[0].trim() : ''
  return (
    <div className="vr-row">
      <div className="vr-av">{(r.cName || 'C').slice(0, 1).toUpperCase()}</div>
      <Box flexGrow="1" style={{ minWidth: 0 }}>
        <Flex align="center" gap="2">
          <Text size="2" weight="bold" className="clamp1">{r.cName}</Text>
          <span className="st-chip" style={{ fontSize: 8.5 }}>{kind === 'site' ? 'SITE' : 'SHOWROOM'}</span>
        </Flex>
        <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>
          {[r.type, dl && `${dl} · ${r.slot}`, place].filter(Boolean).join(' · ')} · #{r.id}
        </Text>
        <Flex gap="1" mt="1" align="center">
          {STAGES.map((s, i) => <span key={s} className={`vr-dot ${i <= si ? 'on' : ''}`} />)}
          <Text weight="bold" style={{ marginLeft: 6, color: si === 2 ? 'var(--green-11)' : 'var(--amber-11)', fontSize: 10 }}>{STAGES[si]}</Text>
        </Flex>
      </Box>
      <a className="vr-call" href={`tel:+91${r.cPh}`} aria-label="Call customer"><MobileIcon width={14} height={14} /></a>
    </div>
  )
}

export function VisitForm({ kind }) {
  const storeKey = kind === 'site' ? 'qc-visits-site' : 'qc-visits-display'
  const [reqs, setReqs] = usePersisted(storeKey, [])
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(t) }, [])
  const [cName, setCName] = useState('')
  const [cPh, setCPh] = useState('')
  const [type, setType] = useState('New site')
  const [date, setDate] = useState(null)
  const [slot, setSlot] = useState(null)
  const [l1, setL1] = useState(''); const [l2, setL2] = useState(''); const [lm, setLm] = useState('')
  const [ct, setCt] = useState(''); const [pin, setPin] = useState('')
  const [notes, setNotes] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const valid = cName.trim() && cPh.length === 10 && date && slot && (kind === 'display' || (l1.trim() && ct.trim() && pin.length === 6))
  const submit = (e) => {
    sparkle(e)
    const addr = kind === 'site' ? [l1.trim(), l2.trim(), lm.trim() && `Near ${lm.trim()}`, `${ct.trim()} ${pin}`].filter(Boolean).join(', ') : ''
    setReqs([{ id: `V${String(Date.now()).slice(-5)}`, cName: cName.trim(), cPh, type: kind === 'site' ? type : 'Showroom visit', date: date.getTime(), slot, addr, notes: notes.trim(), ts: Date.now() }, ...reqs])
    setCName(''); setCPh(''); setDate(null); setSlot(null); setL1(''); setL2(''); setLm(''); setCt(''); setPin(''); setNotes(''); setFormOpen(false)
  }
  const hero = kind === 'display' ? (
    <div className="sub-photo">
      <Img src={img(BRAND_DAY.ph, 700)} alt="" />
      <div className="sub-photo-cap">
        <Text size="2" weight="bold" as="div" style={{ color: '#fff' }}>Ebco Display Centre</Text>
        <Text size="1" as="div" style={{ color: 'rgba(255,255,255,.85)' }}>Indiranagar · the full range, live</Text>
      </div>
    </div>
  ) : (
    <div className="sub-hero orange">
      <SewingPinIcon width={15} height={15} color="var(--orange-11)" style={{ flex: 'none' }} />
      <Text size="1" weight="bold" style={{ color: 'var(--orange-11)' }}>Our team comes with samples, catalogues and a measuring kit</Text>
    </div>
  )
  return (
    <>
      {hero}
      {!formOpen && <button className="qs-cta" style={{ marginTop: 0, marginBottom: 12 }} onClick={() => setFormOpen(true)}><span>{kind === 'site' ? 'Submit a site visit request' : 'Book a showroom slot'}</span><PlusIcon width={16} height={16} /></button>}
      {formOpen && (
        <div className="cp-card" style={{ animation: 'stepin .22s cubic-bezier(.22, 1, .36, 1)' }}>
          <Flex align="center" justify="between">
            <Text size="1" weight="bold" className="u-seclabel">CUSTOMER DETAILS</Text>
            <button className="reco-x" onClick={() => setFormOpen(false)} aria-label="Close form"><Cross2Icon width={12} height={12} /></button>
          </Flex>
          <input className="cp-input" style={{ marginTop: 8 }} placeholder="Customer / firm name" value={cName} onChange={(e) => setCName(e.target.value)} />
          <input className="cp-input" placeholder="Customer phone (10 digits)" inputMode="numeric" maxLength={10} value={cPh} onChange={(e) => setCPh(e.target.value.replace(/\D/g, ''))} />
          {kind === 'site' && (
            <>
              <Text size="1" color="gray" as="div">Visit type</Text>
              <Flex gap="2" mt="1" mb="2">{['New site', 'Renovation', 'Project bid'].map(o => <button key={o} className={`seg-b ${type === o ? 'on' : ''}`} style={{ flex: 1 }} onClick={() => setType(o)}>{o}</button>)}</Flex>
            </>
          )}
          <Text size="1" weight="bold" as="div" mt="2" mb="1" className="u-seclabel">DATE & TIME</Text>
          <CalPicker value={date} onChange={setDate} />
          <div className="slot-grid">{TIME_SLOTS.map(s => <button key={s} className={`slot ${slot === s ? 'on' : ''}`} onClick={() => setSlot(s)}>{s}</button>)}</div>
          {kind === 'site' && (
            <>
              <Text size="1" weight="bold" as="div" mt="2" mb="1" className="u-seclabel">SITE ADDRESS</Text>
              <input className="cp-input" placeholder="Line 1 — building / site no." value={l1} onChange={(e) => setL1(e.target.value)} />
              <input className="cp-input" placeholder="Line 2 — street / area (optional)" value={l2} onChange={(e) => setL2(e.target.value)} />
              <input className="cp-input" placeholder="Landmark (optional)" value={lm} onChange={(e) => setLm(e.target.value)} />
              <Flex gap="2">
                <input className="cp-input" style={{ flex: 1.4 }} autoComplete="address-level2" placeholder="City" value={ct} onChange={(e) => setCt(e.target.value)} />
                <input className="cp-input" style={{ flex: 1 }} autoComplete="postal-code" placeholder="Pincode" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
              </Flex>
            </>
          )}
          <textarea className="cp-note" rows={2} placeholder={kind === 'site' ? 'What should the team bring?' : 'Anything specific the customer wants to see?'} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button mt="3" size="2" color="green" style={{ fontWeight: 800, width: '100%' }} disabled={!valid} onClick={submit}>Submit request</Button>
        </div>
      )}
      {reqs.length > 0 ? (
        <div className="cp-card">
          <Flex align="center" justify="between">
            <Text size="1" weight="bold" className="u-seclabel">YOUR REQUESTS · {reqs.length}</Text>
            {reqs.filter(r => visitStage(r, now) < 2).length > 0 && <span className="st-chip">{reqs.filter(r => visitStage(r, now) < 2).length} in progress</span>}
          </Flex>
          {reqs.map(r => <VisitRow key={r.id} r={r} now={now} kind={kind} />)}
        </div>
      ) : (
        <div className="cp-card">
          <Text size="1" weight="bold" as="div" className="u-seclabel">YOUR REQUESTS</Text>
          <Text size="1" color="gray" as="div" mt="2">No requests yet — tap the button above to book {kind === 'site' ? 'a site visit' : 'a slot'}.</Text>
        </div>
      )}
    </>
  )
}

const MKT_TYPES = ['Branding kit', 'In-shop demo', 'Carpenter meet', 'Promo items']
const MKT_STAGES = (type) => type === 'In-shop demo' || type === 'Carpenter meet' ? ['Received', 'Approved', 'Scheduled'] : ['Received', 'Approved', 'Dispatched']
const mktStage = (r, now) => { const el = (now - r.ts) / 1000; const raw = el < 90 ? 0 : el < 240 ? 1 : 2; return r.date && now < r.date ? Math.min(raw, 1) : raw }

export function AcctBrand() {
  const [reqs, setReqs] = usePersisted('qc-mkt', [])
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(t) }, [])
  const [formOpen, setFormOpen] = useState(false)
  const [type, setType] = useState('Branding kit')
  const [qty, setQty] = useState('')
  const [date, setDate] = useState(null)
  const [notes, setNotes] = useState('')
  const needsDate = type === 'In-shop demo' || type === 'Carpenter meet'
  const needsQty = !needsDate
  const valid = needsDate ? !!date : String(qty).trim() !== ''
  const submit = (e) => {
    sparkle(e)
    setReqs([{ id: `B${String(Date.now()).slice(-5)}`, type, qty: needsQty ? +qty || 0 : null, date: needsDate && date ? date.getTime() : null, notes: notes.trim(), ts: Date.now() }, ...reqs])
    setQty(''); setDate(null); setNotes(''); setFormOpen(false)
  }
  return (
    <>
      <div className="sub-hero orange stack">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--orange-11)', fontSize: 10, letterSpacing: '.6px' }}>BRAND SUPPORT</Text>
        <Text size="2" weight="bold" as="div" mt="1">Boards, demos, meets & promo stock — on us</Text>
        <Text size="1" color="gray" as="div">Approved by your area manager · tracked right here</Text>
      </div>
      {!formOpen && <button className="qs-cta" style={{ marginTop: 0, marginBottom: 12 }} onClick={() => setFormOpen(true)}><span>Request brand support</span><PlusIcon width={16} height={16} /></button>}
      {formOpen && (
        <div className="cp-card" style={{ animation: 'stepin .22s cubic-bezier(.22, 1, .36, 1)' }}>
          <Flex align="center" justify="between">
            <Text size="1" weight="bold" className="u-seclabel">WHAT DO YOU NEED?</Text>
            <button className="reco-x" onClick={() => setFormOpen(false)} aria-label="Close form"><Cross2Icon width={12} height={12} /></button>
          </Flex>
          <div className="claim-types">{MKT_TYPES.map(t => <button key={t} className={`seg-b ${type === t ? 'on' : ''}`} onClick={() => setType(t)}>{t}</button>)}</div>
          {needsQty ? (
            <>
              <Text size="1" weight="bold" as="div" mt="3" className="u-seclabel">{type === 'Branding kit' ? 'BOARDS / STANDEES NEEDED' : 'APPROX. PIECES NEEDED'}</Text>
              <input className="cp-input" style={{ marginTop: 4 }} type="number" min="1" placeholder="e.g. 2" value={qty} onChange={(e) => setQty(e.target.value)} />
            </>
          ) : (
            <>
              <Text size="1" weight="bold" as="div" mt="3" mb="1" className="u-seclabel">PREFERRED DATE</Text>
              <CalPicker value={date} onChange={setDate} />
            </>
          )}
          <textarea className="cp-note" rows={2} placeholder={needsDate ? 'Audience, location, what to cover…' : 'Sizes, languages, placement…'} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button mt="3" size="2" color="green" style={{ fontWeight: 800, width: '100%' }} disabled={!valid} onClick={submit}>Submit request</Button>
        </div>
      )}
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">YOUR REQUESTS{reqs.length ? ` · ${reqs.length}` : ''}</Text>
        {reqs.length === 0 && <Text size="1" color="gray" as="div" mt="2">Nothing yet — tap the button above to raise one.</Text>}
        {reqs.map(r => {
          const STAGES = MKT_STAGES(r.type)
          const si = mktStage(r, now)
          return (
            <div className="vr-row" key={r.id}>
              <div className="vr-av">{r.type.slice(0, 1)}</div>
              <Box flexGrow="1" style={{ minWidth: 0 }}>
                <Text size="2" weight="bold" as="div" className="clamp1">{r.type}</Text>
                <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>{[r.qty ? `${r.qty} pcs` : '', r.date ? new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '', `#${r.id}`].filter(Boolean).join(' · ')}</Text>
                <Flex gap="1" mt="1" align="center">
                  {STAGES.map((s, i) => <span key={s} className={`vr-dot ${i <= si ? 'on' : ''}`} />)}
                  <Text weight="bold" style={{ marginLeft: 6, color: si === 2 ? 'var(--green-11)' : 'var(--amber-11)', fontSize: 10 }}>{STAGES[si]}</Text>
                </Flex>
              </Box>
            </div>
          )
        })}
      </div>
    </>
  )
}

const CLAIM_TYPES = ['Pending CN', 'Material return', 'Wrong delivery', 'Damaged']
const CLAIM_TERMINAL = { 'Pending CN': 'CN issued', 'Material return': 'Pickup scheduled', 'Wrong delivery': 'Replacement dispatched', 'Damaged': 'Replacement dispatched' }
const claimStage = (r, now) => { const el = (now - r.ts) / 1000; return el < 120 ? 0 : el < 300 ? 1 : 2 }

export function AcctClaims({ lastOrder }) {
  const [claims, setClaims] = usePersisted('qc-claims', [])
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 5000); return () => clearInterval(t) }, [])
  const orders = [
    ...(lastOrder ? [{ id: lastOrder.id, date: 'Today', items: (lastOrder.items || []).map(it => ({ p: it.p, n: it.n })) }] : []),
    ...PAST_ORDERS.map(o => ({ id: o.id, date: o.date, items: o.items.map(([id, n]) => ({ p: FEED_POOL.find(p => p.id === id), n })).filter(x => x.p) })),
  ]
  const [formOpen, setFormOpen] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const [type, setType] = useState('Pending CN')
  const [picked, setPicked] = useState({})
  const [photos, setPhotos] = useState([])
  const [notes, setNotes] = useState('')
  const order = orders.find(o => o.id === orderId)
  const pickedCount = Object.values(picked).filter(n => n > 0).length
  const valid = order && pickedCount > 0
  const toggle = (it) => setPicked(prev => ({ ...prev, [it.p.id]: prev[it.p.id] ? 0 : it.n }))
  const stepPick = (it, d) => setPicked(prev => ({ ...prev, [it.p.id]: Math.max(0, Math.min(it.n, (prev[it.p.id] || 0) + d)) }))
  const onPhotos = (e) => { const files = [...(e.target.files || [])].slice(0, 4); setPhotos(files.map(f => ({ name: f.name, url: URL.createObjectURL(f) }))) }
  const submit = (e) => {
    sparkle(e)
    setClaims([{ id: `CL${String(Date.now()).slice(-5)}`, orderId: order.id, orderDate: order.date, type, items: order.items.filter(it => (picked[it.p.id] || 0) > 0).map(it => ({ name: it.p.name, n: picked[it.p.id] })), photos: photos.length, notes: notes.trim(), ts: Date.now() }, ...claims])
    setFormOpen(false); setOrderId(null); setPicked({}); setPhotos([]); setNotes('')
  }
  return (
    <>
      <div className="sub-hero blue">
        <Text size="1" weight="bold" as="div" style={{ color: 'var(--blue-11)', fontSize: 10, letterSpacing: '.6px' }}>CLAIMS & RETURNS</Text>
        <Text size="2" weight="bold" as="div" mt="1">Wrong, damaged or pending CN — sorted from here</Text>
        <Text size="1" color="gray" as="div">Pickups are free · CNs reflect in your credit ledger</Text>
      </div>
      {!formOpen && <button className="qs-cta" style={{ marginTop: 0, marginBottom: 12 }} onClick={() => setFormOpen(true)}><span>Raise a claim</span><PlusIcon width={16} height={16} /></button>}
      {formOpen && (
        <div className="cp-card" style={{ animation: 'stepin .22s cubic-bezier(.22, 1, .36, 1)' }}>
          <Flex align="center" justify="between">
            <Text size="1" weight="bold" className="u-seclabel">WHICH ORDER?</Text>
            <button className="reco-x" onClick={() => setFormOpen(false)} aria-label="Close form"><Cross2Icon width={12} height={12} /></button>
          </Flex>
          <div className="claim-orders">{orders.map(o => <button key={o.id} className={`claim-ord ${orderId === o.id ? 'on' : ''}`} onClick={() => { setOrderId(o.id); setPicked({}) }}><Text size="1" weight="bold" as="div">{o.date}</Text><Text as="div" style={{ fontSize: 9.5, color: 'var(--gray-10)' }}>PO {o.id}</Text></button>)}</div>
          <Text size="1" weight="bold" as="div" mt="3" className="u-seclabel">CLAIM TYPE</Text>
          <div className="claim-types">{CLAIM_TYPES.map(t => <button key={t} className={`seg-b ${type === t ? 'on' : ''}`} onClick={() => setType(t)}>{t}</button>)}</div>
          {order && (
            <>
              <Text size="1" weight="bold" as="div" mt="3" className="u-seclabel">AFFECTED ITEMS</Text>
              {order.items.map(it => {
                const sel = (picked[it.p.id] || 0) > 0
                return (
                  <div key={it.p.id} className={`claim-item ${sel ? 'on' : ''}`}>
                    <button className="claim-check" onClick={() => toggle(it)} aria-label={sel ? 'Deselect' : 'Select'}>{sel && <CheckIcon width={12} height={12} />}</button>
                    <Box flexGrow="1" style={{ minWidth: 0 }} onClick={() => toggle(it)}>
                      <Text size="1" weight="bold" as="div" className="clamp1">{it.p.name}</Text>
                      <Text as="div" style={{ fontSize: 10, color: 'var(--gray-10)' }}>ordered {it.n}</Text>
                    </Box>
                    {sel && (
                      <div className="cs-step">
                        <button onClick={() => stepPick(it, -1)} aria-label="Less"><MinusIcon width={12} height={12} /></button>
                        <Text size="1" weight="bold" style={{ width: 24, textAlign: 'center', color: '#fff' }}>{picked[it.p.id]}</Text>
                        <button onClick={() => stepPick(it, 1)} aria-label="More"><PlusIcon width={12} height={12} /></button>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
          <label className="photo-add">
            <UploadIcon width={14} height={14} />
            {photos.length ? `${photos.length} photo${photos.length > 1 ? 's' : ''} attached` : 'Add photos (damage, labels, package)'}
            <input type="file" accept="image/*" multiple onChange={onPhotos} style={{ display: 'none' }} />
          </label>
          {photos.length > 0 && <Flex gap="2" mt="2">{photos.map(ph => <img key={ph.url} src={ph.url} alt="" className="photo-thumb" />)}</Flex>}
          <textarea className="cp-note" rows={2} placeholder="What went wrong?" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button mt="3" size="2" color="green" style={{ fontWeight: 800, width: '100%' }} disabled={!valid} onClick={submit}>Submit claim</Button>
        </div>
      )}
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">YOUR CLAIMS{claims.length ? ` · ${claims.length}` : ''}</Text>
        {claims.length === 0 && <Text size="1" color="gray" as="div" mt="2">No claims — long may it last.</Text>}
        {claims.map(r => {
          const STAGES = ['Raised', 'Under review', CLAIM_TERMINAL[r.type]]
          const si = claimStage(r, now)
          return (
            <div className="vr-row" key={r.id}>
              <div className="vr-av" style={{ background: 'var(--blue-3)', color: 'var(--blue-11)' }}>{r.type.slice(0, 1)}</div>
              <Box flexGrow="1" style={{ minWidth: 0 }}>
                <Text size="2" weight="bold" as="div" className="clamp1">{r.type} · PO {r.orderId}</Text>
                <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>{r.items.length} item{r.items.length > 1 ? 's' : ''}{r.photos ? ` · ${r.photos} photos` : ''} · #{r.id}</Text>
                <Flex gap="1" mt="1" align="center">
                  {STAGES.map((s, i) => <span key={s} className={`vr-dot ${i <= si ? 'on' : ''}`} />)}
                  <Text weight="bold" style={{ marginLeft: 6, color: si === 2 ? 'var(--green-11)' : 'var(--amber-11)', fontSize: 10 }}>{STAGES[si]}</Text>
                </Flex>
              </Box>
            </div>
          )
        })}
      </div>
    </>
  )
}

export function AcctSupport() {
  const rows = [
    [MobileIcon, 'Call dealer desk', '080 4512 3456 · Mon–Sat, 9–7', 'tel:+918045123456'],
    [({ width, height }) => <svg width={width} height={height} viewBox="0 0 15 15"><path d="M7.5 1a6.5 6.5 0 1 0 0 13A6.5 6.5 0 0 0 7.5 1zm.8 9.5H6.7V6.7h1.6v3.8zm0-5H6.7V4h1.6v1.5z" fill="currentColor"/></svg>, 'WhatsApp us', 'Replies in ~10 min', 'https://wa.me/918045123456'],
    [EnvelopeClosedIcon, 'Email', 'dealers@quickcart.in', 'mailto:dealers@quickcart.in'],
  ]
  const faqs = [
    ['Where is my invoice?', 'Invoices land on your email and WhatsApp within 15 minutes of dispatch, with GST input credit itemised.'],
    ['How do bulk prices apply?', 'Bulk unit prices apply automatically once a line crosses its threshold; the savings are itemised on the invoice.'],
    ['Can I return hardware?', 'Unopened boxes can be returned within 7 days from the order detail page — pickup is free.'],
  ]
  return (
    <>
      <div className="sub-hero green-line">
        <span className="oc-pulse" />
        <Text size="2" weight="bold">We're online</Text>
        <Text size="1" color="gray" style={{ marginLeft: 'auto' }}>avg reply ~10 min</Text>
      </div>
      <div className="cp-card">
        {rows.map(([Icon, t, s, href]) => (
          <a key={t} className="sup-row" href={href} target="_blank" rel="noreferrer">
            <span className="mrow-ic"><Icon width={16} height={16} /></span>
            <span style={{ flex: 1, minWidth: 0 }}><Text size="2" weight="bold" as="div">{t}</Text><Text size="1" color="gray" as="div">{s}</Text></span>
            <ChevronRightIcon width={14} height={14} color="var(--gray-8)" />
          </a>
        ))}
      </div>
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">FAQS</Text>
        {faqs.map(([q, a]) => (
          <details className="faq" key={q}>
            <summary><Text size="2" weight="bold">{q}</Text><ChevronDownIcon width={14} height={14} /></summary>
            <Text size="1" color="gray" as="div" style={{ lineHeight: 1.5, paddingBottom: 10 }}>{a}</Text>
          </details>
        ))}
      </div>
    </>
  )
}

export function AcctNotif() {
  const [prefs, setPrefs] = usePersisted('qc-notif', { orders: true, flash: true, quiz: true, price: false, wa: true })
  const defs = [
    ['orders', 'Order updates', 'Dispatch, delivery, invoices'],
    ['flash', 'Flash sale alerts', 'When deals go live'],
    ['quiz', 'Quiz & rewards', 'Daily quiz, spins, streaks'],
    ['price', 'Price drops', 'On items you buy often'],
    ['wa', 'WhatsApp updates', 'Mirror everything on WhatsApp'],
  ]
  const on = Object.values(prefs).filter(Boolean).length
  return (
    <>
      <div className="sub-hero green-line">
        <Text size="2" weight="bold">{on} of {defs.length} channels on</Text>
      </div>
      <div className="cp-card">
        {defs.map(([k, t, s]) => (
          <Flex key={k} align="center" gap="3" className="pref-row">
            <Box flexGrow="1" style={{ minWidth: 0 }}><Text size="2" weight="bold" as="div">{t}</Text><Text size="1" color="gray" as="div">{s}</Text></Box>
            <Toggle on={!!prefs[k]} onToggle={() => setPrefs({ ...prefs, [k]: !prefs[k] })} />
          </Flex>
        ))}
      </div>
    </>
  )
}

export function AcctPrivacy() {
  const [prefs, setPrefs] = usePersisted('qc-priv', { personalize: true, analytics: true })
  const [msg, setMsg] = useState(null)
  return (
    <>
      <div className="cp-card">
        {[['personalize', 'Personalised offers', 'Recommendations from your buying pattern'], ['analytics', 'Usage analytics', 'Helps us improve the app']].map(([k, t, s]) => (
          <Flex key={k} align="center" gap="3" className="pref-row">
            <Box flexGrow="1" style={{ minWidth: 0 }}><Text size="2" weight="bold" as="div">{t}</Text><Text size="1" color="gray" as="div">{s}</Text></Box>
            <Toggle on={!!prefs[k]} onToggle={() => setPrefs({ ...prefs, [k]: !prefs[k] })} />
          </Flex>
        ))}
      </div>
      <div className="cp-card">
        <button className="sup-row" style={{ width: '100%' }} onClick={() => setMsg('A copy of your data will reach your email within 24 hours.')}>
          <Text size="2" weight="bold" style={{ flex: 1, textAlign: 'left' }}>Download my data</Text>
          <ChevronRightIcon width={14} height={14} color="var(--gray-8)" />
        </button>
        <button className="sup-row" style={{ width: '100%' }} onClick={() => setMsg('Deletion request noted. The dealer desk will call to confirm before anything is removed.')}>
          <Text size="2" weight="bold" style={{ flex: 1, textAlign: 'left', color: 'var(--red-11)' }}>Request account deletion</Text>
          <ChevronRightIcon width={14} height={14} color="var(--gray-8)" />
        </button>
        {msg && <Text size="1" as="div" mt="2" style={{ color: 'var(--green-11)', fontWeight: 700 }}>{msg}</Text>}
      </div>
    </>
  )
}

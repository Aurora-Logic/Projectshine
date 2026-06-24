import { useState } from 'react'
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes'
import {
  ArrowLeftIcon, BookmarkIcon, CheckIcon, Cross2Icon, DownloadIcon,
  EyeOpenIcon, FileTextIcon, GearIcon, MagnifyingGlassIcon, MinusIcon,
  PlusIcon, Share2Icon, TrashIcon,
} from '@radix-ui/react-icons'
import { FEED_POOL, NEW_EBCO } from '../../data.js'
import { usePersisted, setJSON } from '../../lib/storage.js'
import { img, sparkle } from '../../lib/util.js'
import { generateEstimate, EST_BRAND_DEFAULT, EST_FONTS, EST_PAPERS } from '../../lib/estimate.js'
import { Img } from '../../components/Img.jsx'
import { TplCard, ColorRow } from '../../components/estpdf.jsx'
import { Toggle } from './AcctDash.jsx'
import { loadLists, saveLists, loadBoms, fullBrand, regenBom, viewBom, shareBom, waBom, mailBom, BOM_TPL } from './helpers.js'
import { WaMark } from './LoginGate.jsx'

export function AcctLists({ onChange, onGoKit }) {
  const [lists, setLists] = useState(loadLists)
  const [openId, setOpenId] = useState(null)
  const [delArm, setDelArm] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const save = (next) => { setLists(next); saveLists(next) }
  const resolve = (it) => FEED_POOL.find(p => p.id === it.id)
  const cur = lists.find(l => l.id === openId)
  if (cur) {
    const rows = cur.items.map(it => ({ ...it, p: resolve(it) })).filter(x => x.p)
    const total = rows.reduce((s, r) => s + r.p.price * r.n, 0)
    const step = (id, d) => save(lists.map(l => l.id !== cur.id ? l : {
      ...l,
      items: l.items.map(i => (i.id === id ? { ...i, n: Math.max(0, i.n + d) } : i)).filter(i => i.n > 0),
    }))
    return (
      <>
        <button className="pl-back" onClick={() => { setOpenId(null); setDelArm(false) }}>
          <ArrowLeftIcon width={13} height={13} /> All lists
        </button>
        <div className="cp-card">
          <Flex align="center" justify="between">
            <Heading as="h2" size="4" style={{ letterSpacing: '-0.3px' }}>{cur.name}</Heading>
            <Text size="1" weight="bold" color="gray">{rows.length} items</Text>
          </Flex>
          {rows.map(r => (
            <div className="cs-row" key={r.id}>
              <Img src={img(r.p.ph, 120)} alt="" />
              <Box flexGrow="1" style={{ minWidth: 0 }}>
                <Text size="1" weight="bold" as="div" className="clamp2" style={{ lineHeight: 1.3 }}>{r.p.name}</Text>
                <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>₹{r.p.price.toLocaleString('en-IN')}</Text>
              </Box>
              <div className="cs-step">
                <button onClick={() => step(r.id, -1)} aria-label="Less"><MinusIcon width={12} height={12} /></button>
                <Text key={r.n} className="numpop" size="1" weight="bold" style={{ width: 26, textAlign: 'center', color: '#fff' }}>{r.n}</Text>
                <button onClick={() => step(r.id, 1)} aria-label="More"><PlusIcon width={12} height={12} /></button>
              </div>
              <Text size="1" weight="bold" style={{ minWidth: 56, textAlign: 'right', flex: 'none', whiteSpace: 'nowrap' }}>
                ₹{(r.n * r.p.price).toLocaleString('en-IN')}
              </Text>
            </div>
          ))}
          {rows.length === 0 && <Text size="1" color="gray" as="div" mt="2">Empty list — save products here from any product page.</Text>}
        </div>
        {rows.length > 0 && (
          <button className="qs-cta" onClick={(e) => { rows.forEach(r => onChange(r.n, r.p, { noReco: true })); sparkle(e) }}>
            <span>Add all to cart</span><span>₹{total.toLocaleString('en-IN')}</span>
          </button>
        )}
        <button className={`pl-del ${delArm ? 'arm' : ''}`} onClick={() => { if (!delArm) { setDelArm(true); return } save(lists.filter(l => l.id !== cur.id)); setOpenId(null); setDelArm(false) }}>
          {delArm ? 'Tap again to delete' : 'Delete list'}
        </button>
      </>
    )
  }
  return (
    <>
      <div className="cp-card">
        {lists.map(l => {
          const rows = l.items.map(resolve).filter(Boolean)
          const total = l.items.reduce((s, it) => s + (resolve(it)?.price || 0) * it.n, 0)
          return (
            <div className="ro-past" key={l.id} onClick={() => setOpenId(l.id)}>
              <Flex>{rows.slice(0, 3).map(p => <Img key={`pl-${l.id}-${p.id}`} className="thumb" src={img(p.ph, 80)} alt="" />)}</Flex>
              <Box flexGrow="1" style={{ minWidth: 0 }}>
                <Text size="2" weight="bold" as="div">{l.name}</Text>
                <Text as="div" style={{ fontSize: 10.5, color: 'var(--gray-10)' }}>{l.items.length} items · ₹{total.toLocaleString('en-IN')}</Text>
              </Box>
              <BookmarkIcon width={14} height={14} color="var(--gray-8)" style={{ flex: 'none' }} />
            </div>
          )
        })}
        {lists.length === 0 && (
          <>
            <Text size="1" color="gray" as="div">No lists yet — create one per site or job.</Text>
            {onGoKit && <Button mt="2" size="2" variant="soft" color="green" radius="full" style={{ fontWeight: 800 }} onClick={onGoKit}>Start with a project kit</Button>}
          </>
        )}
      </div>
      {adding ? (
        <div className="cp-card">
          <input className="cp-input" placeholder="List name — e.g. Sharma kitchen site" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          <Button size="2" color="green" style={{ fontWeight: 800, width: '100%' }} disabled={!name.trim()} onClick={() => { save([...lists, { id: `l${Date.now()}`, name: name.trim(), items: [] }]); setName(''); setAdding(false) }}>Create list</Button>
        </div>
      ) : (
        <button className="addr-add" onClick={() => setAdding(true)}><PlusIcon width={14} height={14} /> New project list</button>
      )}
    </>
  )
}

export function AcctEstPdf() {
  const [saved, setBrand] = usePersisted('qc-est-brand', EST_BRAND_DEFAULT)
  const brand = { ...EST_BRAND_DEFAULT, ...saved, dealer: { ...EST_BRAND_DEFAULT.dealer, ...(saved && saved.dealer) } }
  const set = (k, v) => setBrand({ ...brand, [k]: v })
  const setDealer = (k) => (e) => setBrand({ ...brand, dealer: { ...brand.dealer, [k]: e.target.value } })
  const onFile = (e) => {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => {
      const sc = Math.min(1, 512 / Math.max(im.naturalWidth, im.naturalHeight))
      const c = document.createElement('canvas')
      c.width = Math.round(im.naturalWidth * sc); c.height = Math.round(im.naturalHeight * sc)
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height)
      set('logo', c.toDataURL('image/png')); URL.revokeObjectURL(url)
    }
    im.src = url; e.target.value = ''
  }
  const [busy, setBusy] = useState(false)
  const previewSample = async () => {
    if (busy) return; setBusy(true)
    try {
      const items = NEW_EBCO.slice(0, 5).map((p, i) => ({ p, n: [4, 2, 6, 1, 3][i] }))
      const itemTotal = items.reduce((s, { p, n }) => s + p.price * n, 0)
      const bulkSave = Math.round(itemTotal * 0.04), schemeOff = Math.round(itemTotal * 0.05)
      const bill = { itemTotal, bulkSave, schemeOff, slabPct: 5, fee: 0, express: false, toPay: itemTotal - bulkSave - schemeOff, special: 0 }
      const cust = { name: 'Sample Customer', phone: '+91 90000 00000', site: 'Sample Site · Koramangala, Bengaluru', refBy: '' }
      const { blob } = await generateEstimate({ cust, items, bill, brand, out: 'blob' })
      const url = URL.createObjectURL(blob); window.open(url, '_blank'); setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch (e) { console.error('[QuickCart] sample preview failed', e) }
    finally { setBusy(false) }
  }
  const tpl = ['classic', 'bold', 'studio'].includes(brand.template) ? brand.template : 'classic'
  const tplName = { classic: 'Classic', bold: 'Bold', studio: 'Studio' }[tpl]
  const fontName = (EST_FONTS[brand.font || 'pjs'] || [])[2] || 'Plus Jakarta Sans'
  const tplMeta = tpl === 'classic' ? `logos ${brand.logosPos || 'top'}` : '4 brand logos'
  return (
    <>
      <div className="cp-card est-hero">
        <div className="est-hero-prev">
          <TplCard k={tpl} label={`Preview ${tplName} sample`} active={false} paper={brand.paper || '#F8F5ED'} accent={brand.accent || '#CDE76D'} onClick={previewSample} />
        </div>
        <div className="est-hero-body">
          <Text size="1" weight="bold" as="div" className="u-seclabel">YOUR CUSTOMER BOM</Text>
          <Text size="5" weight="bold" as="div" style={{ letterSpacing: '-0.4px', lineHeight: 1.1, margin: '2px 0' }}>{brand.name}</Text>
          <Text size="1" color="gray" as="div">{tplName} · {fontName} · {tplMeta}</Text>
          <Button size="2" color="green" radius="full" highContrast onClick={previewSample} disabled={busy} style={{ fontWeight: 800, marginTop: 10, alignSelf: 'flex-start' }}>
            <EyeOpenIcon /> {busy ? 'Building…' : 'Preview sample BOM'}
          </Button>
        </div>
      </div>
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">COMPANY ON THE PDF</Text>
        <Flex direction="column" gap="2" mt="2">
          <input className="cp-input" style={{ fontSize: 16 }} placeholder="Company name" value={brand.name} onChange={(e) => set('name', e.target.value)} />
          <input className="cp-input" style={{ fontSize: 16 }} placeholder="Prepared by (your name)" value={brand.preparedBy || ''} onChange={(e) => set('preparedBy', e.target.value)} />
        </Flex>
        <Flex align="center" gap="3" mt="3">
          <img className="est-logo-prev" src={brand.logo || '/brand-logo.png'} alt="Company logo preview" />
          <Flex direction="column" gap="2" style={{ flex: 1 }}>
            <Button asChild size="2" variant="soft" color="green" radius="full" style={{ fontWeight: 800 }}>
              <label style={{ cursor: 'pointer', justifyContent: 'center' }}>Upload logo<input type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} /></label>
            </Button>
            {brand.logo && <Button size="2" variant="ghost" color="gray" radius="full" style={{ fontWeight: 700 }} onClick={() => set('logo', null)}>Reset to default</Button>}
          </Flex>
        </Flex>
        <Text size="1" color="gray" as="div" mt="2">Shown at the top-right of every customer BOM.</Text>
      </div>
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">TEMPLATE</Text>
        <div className="tpl-grid">
          {[['classic', 'Classic'], ['bold', 'Bold'], ['studio', 'Studio']].map(([k, l]) => (
            <TplCard key={k} k={k} label={l} active={tpl === k} paper={brand.paper || '#F8F5ED'} accent={brand.accent || '#CDE76D'} onClick={() => set('template', k)} />
          ))}
        </div>
        <Text size="1" color="gray" as="div" mt="2">Classic — hairlines, logos on top. Bold — colour bands, logos below. Studio — editorial caps, amount in words.</Text>
        <Text size="1" weight="bold" as="div" mt="3" className="u-seclabel">FONT</Text>
        <Flex gap="2" mt="2" wrap="wrap">
          {Object.entries(EST_FONTS).map(([k, [, , label]]) => (
            <Button key={k} size="1" radius="full" variant={(brand.font || 'pjs') === k ? 'solid' : 'soft'} color={(brand.font || 'pjs') === k ? 'green' : 'gray'} style={{ fontWeight: 800 }} onClick={() => set('font', k)}>{label}</Button>
          ))}
        </Flex>
        <Text size="1" weight="bold" as="div" mt="3" className="u-seclabel">BRAND LOGOS (CLASSIC)</Text>
        <Flex gap="2" mt="2">
          {[['top', 'Top'], ['bottom', 'Bottom']].map(([k, l]) => (
            <Button key={k} size="1" radius="full" variant={(brand.logosPos || 'top') === k ? 'solid' : 'soft'} color={(brand.logosPos || 'top') === k ? 'green' : 'gray'} style={{ fontWeight: 800 }} onClick={() => set('logosPos', k)}>{l}</Button>
          ))}
        </Flex>
      </div>
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">PDF COLOURS</Text>
        <ColorRow label="PAPER BACKGROUND" value={brand.paper} onChange={(v) => set('paper', v)} swatches={EST_PAPERS} />
        <ColorRow label="ACCENT (BOLD TEMPLATE)" value={brand.accent || '#CDE76D'} onChange={(v) => set('accent', v)} swatches={['#CDE76D', 'var(--gold-9)', '#9BE3C0', '#F2B8A0', '#BFD3F2', '#E8C7F2']} />
        <ColorRow label="COMPANY NAME" value={brand.wordmark} onChange={(v) => set('wordmark', v)} />
        <ColorRow label="FOOTER TEXT" value={brand.footer} onChange={(v) => set('footer', v)} />
        <ColorRow label="SIDE VERTICAL TEXT" value={brand.side} onChange={(v) => set('side', v)} />
        <Text size="1" color="gray" as="div" mt="3">Hairlines tint themselves to the paper; item rows and totals stay ink for readability.</Text>
      </div>
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">CONTENT</Text>
        <Flex align="center" justify="between" mt="2">
          <div><Text size="2" weight="bold" as="div">Product photos</Text><Text size="1" color="gray" as="div">Off packs more line items per page</Text></div>
          <Toggle on={brand.photos !== false} onToggle={() => set('photos', brand.photos === false)} />
        </Flex>
        <Text size="1" weight="bold" as="div" mt="3" className="u-seclabel">VALID FOR</Text>
        <Flex gap="2" mt="2">
          {[3, 7, 14, 30].map(dv => (
            <Button key={dv} size="1" radius="full" variant={(brand.validDays || 7) === dv ? 'solid' : 'soft'} color={(brand.validDays || 7) === dv ? 'green' : 'gray'} style={{ fontWeight: 800 }} onClick={() => set('validDays', dv)}>{dv} days</Button>
          ))}
        </Flex>
        <Text size="1" weight="bold" as="div" mt="3" className="u-seclabel">NOTE ON EVERY BOM</Text>
        <textarea className="cp-note" style={{ fontSize: 16 }} rows={3} value={brand.note ?? EST_BRAND_DEFAULT.note} onChange={(e) => set('note', e.target.value)} />
        <Text size="1" color="gray" as="div" mt="1">Wrap words in **double asterisks** to make them bold on the PDF.</Text>
      </div>
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">DEALER DETAILS ON THE PDF</Text>
        <Flex direction="column" gap="2" mt="2">
          <input className="cp-input" style={{ fontSize: 16 }} placeholder="Address line" value={brand.dealer.addr1} onChange={setDealer('addr1')} />
          <input className="cp-input" style={{ fontSize: 16 }} placeholder="City · PIN" value={brand.dealer.addr2} onChange={setDealer('addr2')} />
          <Flex gap="2">
            <input className="cp-input" style={{ fontSize: 16, flex: 1, minWidth: 0 }} type="tel" placeholder="Phone" value={brand.dealer.phone} onChange={setDealer('phone')} />
            <input className="cp-input" style={{ fontSize: 16, flex: 1, minWidth: 0 }} placeholder="GSTIN" value={brand.dealer.gstin} onChange={setDealer('gstin')} />
          </Flex>
          <Flex gap="2">
            <input className="cp-input" style={{ fontSize: 16, flex: 1, minWidth: 0 }} type="email" placeholder="Email" value={brand.dealer.email} onChange={setDealer('email')} />
            <input className="cp-input" style={{ fontSize: 16, flex: 1, minWidth: 0 }} placeholder="Website" value={brand.dealer.website} onChange={setDealer('website')} />
          </Flex>
        </Flex>
      </div>
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">TERMS ON THE PDF</Text>
        <Text size="1" color="gray" as="div" mt="1">Shown in a panel under the items. Leave blank to hide.</Text>
        <textarea className="cp-note" style={{ fontSize: 16 }} rows={3} placeholder="Terms & conditions (one per line). Wrap **words** to bold them." value={brand.terms} onChange={(e) => set('terms', e.target.value)} />
      </div>
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">DOCUMENT</Text>
        <Flex direction="column" gap="2" mt="2">
          <input className="cp-input" style={{ fontSize: 16 }} placeholder="Document title" value={brand.docTitle} onChange={(e) => set('docTitle', e.target.value)} />
          <input className="cp-input" style={{ fontSize: 16 }} placeholder="Watermark (empty = none, e.g. DRAFT)" value={brand.watermark} onChange={(e) => set('watermark', e.target.value)} />
        </Flex>
      </div>
      <div className="cp-card">
        <Text size="1" weight="bold" as="div" className="u-seclabel">PRICING ON THE PDF</Text>
        <Flex align="center" justify="between" mt="2">
          <div><Text size="2" weight="bold" as="div">Show prices</Text><Text size="1" color="gray" as="div">Off makes a quantities-only material list</Text></div>
          <Toggle on={brand.showPrices !== false} onToggle={() => set('showPrices', brand.showPrices === false)} />
        </Flex>
        {brand.showPrices !== false && (
          <>
            <Flex align="center" justify="between" mt="3">
              <div><Text size="2" weight="bold" as="div">Show savings rows</Text><Text size="1" color="gray" as="div">Off shows net prices without discount lines</Text></div>
              <Toggle on={brand.showSavings !== false} onToggle={() => set('showSavings', brand.showSavings === false)} />
            </Flex>
            <Flex align="center" justify="between" mt="3">
              <div><Text size="2" weight="bold" as="div">Volume scheme discount</Text><Text size="1" color="gray" as="div">Off keeps the scheme off the customer BOM</Text></div>
              <Toggle on={brand.showScheme !== false} onToggle={() => set('showScheme', brand.showScheme === false)} />
            </Flex>
            <Text size="1" weight="bold" as="div" mt="3" className="u-seclabel">GST LINE</Text>
            <Flex gap="2" mt="2">
              {[[0, 'Off'], [5, '5%'], [12, '12%'], [18, '18%'], [28, '28%']].map(([v, l]) => (
                <Button key={v} size="1" radius="full" variant={(Number(brand.gstPct) || 0) === v ? 'solid' : 'soft'} color={(Number(brand.gstPct) || 0) === v ? 'green' : 'gray'} style={{ fontWeight: 800 }} onClick={() => set('gstPct', v)}>{l}</Button>
              ))}
            </Flex>
          </>
        )}
      </div>
    </>
  )
}

export function AcctBoms({ onSettings }) {
  const [boms, setBoms] = usePersisted('qc-boms', [])
  const [q, setQ] = useState('')
  const [delRec, setDelRec] = useState(null)
  const del = (no) => setBoms(boms.filter(b => b.no !== no))
  const settingsBtn = onSettings && (
    <button className="bom-settings-pill" onClick={onSettings}>
      <span className="flat-ic c-green sm"><GearIcon width={13} height={13} /></span> Settings
    </button>
  )
  if (!boms.length) {
    return (
      <div className="bom-wrap">
        <div className="bom-empty">
          <div className="bom-empty-ico"><FileTextIcon width={26} height={26} /></div>
          <Text size="3" weight="bold" as="div" mt="3">No saved BOMs yet</Text>
          <Text size="2" color="gray" as="div" mt="1" style={{ maxWidth: 290, marginInline: 'auto', lineHeight: 1.5 }}>
            Generate a BOM from your cart — every one you export is saved here to re-view, re-download or share with customers.
          </Text>
          {onSettings && <Text size="1" color="gray" as="div" mt="4" mb="2">Set up your company branding first:</Text>}
          <Flex justify="center">{settingsBtn}</Flex>
        </div>
      </div>
    )
  }
  const totalVal = boms.reduce((s, b) => s + (b.total || 0), 0)
  const ql = q.trim().toLowerCase()
  const filtered = ql ? boms.filter(b => (b.cust.name || '').toLowerCase().includes(ql) || (b.no || '').toLowerCase().includes(ql)) : boms
  return (
    <div className="bom-wrap">
      <div className="bom-head">
        <div style={{ minWidth: 0 }}>
          <Text size="3" weight="bold" as="div" style={{ letterSpacing: '-0.3px' }}>{boms.length} saved BOM{boms.length === 1 ? '' : 's'}</Text>
          <Text size="1" color="gray" as="div">₹{totalVal.toLocaleString('en-IN')} quoted · saved on this device</Text>
        </div>
        {settingsBtn}
      </div>
      <div className="bom-search">
        <MagnifyingGlassIcon width={16} height={16} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by customer or BOM number" style={{ fontSize: 16 }} aria-label="Search saved BOMs" />
        {q && <button className="bom-search-x" onClick={() => setQ('')} aria-label="Clear search"><Cross2Icon width={15} height={15} /></button>}
      </div>
      {filtered.length === 0 ? (
        <Text size="2" color="gray" as="div" style={{ textAlign: 'center', padding: '28px 0' }}>No BOMs match "{q}".</Text>
      ) : filtered.map(rec => {
        const tpl = BOM_TPL[rec.template] || BOM_TPL.classic
        return (
          <div key={rec.no} className="bom-card">
            <Flex gap="3" align="center">
              <div className={`bom-tile t-${tpl.c}`}><FileTextIcon width={20} height={20} /></div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Text size="2" weight="bold" as="div" truncate>{rec.cust.name || 'Customer'}</Text>
                <Text size="1" color="gray" as="div" truncate>
                  {rec.no} · {new Date(rec.ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {rec.count} item{rec.count === 1 ? '' : 's'}
                </Text>
              </div>
              <div style={{ textAlign: 'right', flex: 'none' }}>
                <Text size="3" weight="bold" as="div" style={{ color: 'var(--green-11)', letterSpacing: '-0.3px' }}>₹{(rec.total || 0).toLocaleString('en-IN')}</Text>
                <span className={`bom-badge b-${tpl.c}`}>{tpl.label}</span>
              </div>
            </Flex>
            <div className="bom-divider" />
            <div className="bom-actions">
              <button className="bom-act primary" onClick={() => shareBom(rec)}><Share2Icon width={14} height={14} /> Share</button>
              <button className="bom-act" onClick={() => viewBom(rec)}><EyeOpenIcon width={14} height={14} /> View</button>
              <button className="bom-act" onClick={() => regenBom(rec, 'save')}><DownloadIcon width={14} height={14} /> Download</button>
            </div>
            <div className="bom-actions2">
              <button className="bom-ic" onClick={() => waBom(rec)} aria-label="Share on WhatsApp"><WaMark s={16} /> WhatsApp</button>
              <button className="bom-ic" onClick={() => mailBom(rec)} aria-label="Send by email"><span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>✉ Email</span></button>
              <button className="bom-ic del" onClick={() => setDelRec(rec)} aria-label="Delete BOM" style={{ marginLeft: 'auto' }}><TrashIcon width={15} height={15} /></button>
            </div>
          </div>
        )
      })}
      {delRec && (
        <div className="order-done" onClick={() => setDelRec(null)}>
          <div className="od-card" onClick={(e) => e.stopPropagation()}>
            <div className="od-ico-red"><TrashIcon width={24} height={24} /></div>
            <Heading as="h2" size="5" mt="3" style={{ letterSpacing: '-0.3px' }}>Delete this BOM?</Heading>
            <Text size="2" color="gray" as="div" mt="2"><Text weight="bold" style={{ color: 'var(--gray-12)' }}>{delRec.cust.name || 'Customer'}</Text> · {delRec.no}</Text>
            <Text size="1" color="gray" as="div" mt="1">Removes it from this device — this can't be undone.</Text>
            <Flex gap="2" mt="4">
              <Button size="3" variant="soft" color="gray" radius="full" style={{ fontWeight: 800, flex: 1 }} onClick={() => setDelRec(null)}>Cancel</Button>
              <Button size="3" color="red" radius="full" style={{ fontWeight: 800, flex: 1 }} onClick={() => { del(delRec.no); setDelRec(null) }}>Delete</Button>
            </Flex>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Box, Button, Flex, Heading, Text } from '@radix-ui/themes'
import {
  ArrowLeftIcon, BarChartIcon, BellIcon, BookmarkIcon, ChevronRightIcon,
  ExitIcon, FileTextIcon, HomeIcon, IdCardIcon, LockClosedIcon, StarFilledIcon,
} from '@radix-ui/react-icons'
import { useNavigate } from 'react-router-dom'
import { CREDIT } from '../../data.js'
import { PageExit } from '../../components/ui.jsx'
import { fmtL } from '../../components/home.jsx'
import { creditState, ordPgRef } from './helpers.js'
import { AcctDash } from './AcctDash.jsx'
import { AcctOrders, AcctCredit, AcctSchemes, AcctGst, AcctAddr, AcctCalc } from './AcctOrders.jsx'
import { VisitForm, AcctBrand, AcctClaims, AcctSupport, AcctNotif, AcctPrivacy } from './AcctTools.jsx'
import { AcctLists, AcctBoms, AcctEstPdf } from './AcctBoms.jsx'

const ACCT_TILES = [
  ['addr', HomeIcon, 'Address', 'Book'],
  ['credit', IdCardIcon, 'Credit', 'Ledger'],
  ['orders', FileTextIcon, 'My', 'Orders'],
  ['lists', BookmarkIcon, 'Project', 'Lists'],
]

const ACCT_FLAT = [
  ['support', () => <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><path d="M7.5 1a6.5 6.5 0 1 0 0 13A6.5 6.5 0 0 0 7.5 1zM2 7.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0zm6 2.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zM7 4.5a.5.5 0 0 0-1 0V8a.5.5 0 0 0 1 0V4.5z"/></svg>, 'Support'],
  ['notif', BellIcon, 'Notification preferences'],
  ['privacy', LockClosedIcon, 'Account privacy'],
]

const ACCT_ICO = {
  calc: 'blue', claims: 'orange', site: 'teal', display: 'violet',
  brand: 'pink', boms: 'green', support: 'indigo', notif: 'amber', privacy: 'slate',
}

const ACCT_TITLES = {
  dash: 'Performance dashboard', orders: 'My orders', credit: 'Credit ledger',
  lists: 'Project lists', schemes: 'Schemes & discounts',
  gst: 'GST details', calc: 'Calculators', site: 'Submit site visit',
  display: 'Display centre visit', support: 'Support', claims: 'Claims & returns', brand: 'Brand support', addr: 'Address book',
  notif: 'Notification preferences', privacy: 'Account privacy',
  estpdf: 'BOM PDF settings', boms: 'BOM',
}

export default function AccountPage({ onClose, onChange, lastOrder, subRef, initialSub, onCategory, onGoReorder, onGoKit }) {
  const [subStack, setSubStack] = useState(() => {
    const h = window.location.hash
    let init = null
    if (h === '#dash') init = 'dash'
    else if (h === '#credit') init = 'credit'
    else if (h === '#lists') init = 'lists'
    else if (h === '#orders' || h === '#ordpg') init = 'orders'
    else if (h === '#claims') init = 'claims'
    else if (h === '#brand') init = 'brand'
    else if (h === '#site') init = 'site'
    else init = initialSub || null
    return init ? [init] : []
  })
  const sub = subStack.length ? subStack[subStack.length - 1] : null
  const setSub = (s) => setSubStack(s ? [s] : [])
  const pushSub = (s) => { window.history.pushState({ qcAcctSub: true }, ''); setSubStack(st => [...st, s]) }
  const [lo, setLo] = useState(null)
  if (subRef) subRef.current = sub !== null
  const backSub = () => {
    if (window.history.state?.qcAcctSub) window.history.back()
    else setSubStack(st => (st.length > 1 ? st.slice(0, -1) : []))
  }
  useEffect(() => {
    if (!sub) return
    if (!window.history.state?.qcAcctSub) window.history.pushState({ qcAcctSub: true }, '')
    const onPop = () => { if (!ordPgRef.current) setSubStack(st => st.slice(0, -1)) }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [sub !== null]) // eslint-disable-line react-hooks/exhaustive-deps

  const renderSub = () => {
    switch (sub) {
      case 'dash': return <AcctDash onReorder={onGoReorder} />
      case 'orders': return <AcctOrders lastOrder={lastOrder} onChange={onChange} />
      case 'credit': return <AcctCredit />
      case 'lists': return <AcctLists onChange={onChange} onGoKit={onGoKit} />
      case 'schemes': return <AcctSchemes onCategory={onCategory} />
      case 'gst': return <AcctGst />
      case 'calc': return <AcctCalc />
      case 'site': return <VisitForm kind="site" />
      case 'display': return <VisitForm kind="display" />
      case 'claims': return <AcctClaims lastOrder={lastOrder} />
      case 'brand': return <AcctBrand />
      case 'support': return <AcctSupport />
      case 'addr': return <AcctAddr />
      case 'notif': return <AcctNotif />
      case 'privacy': return <AcctPrivacy />
      case 'estpdf': return <AcctEstPdf />
      case 'boms': return <AcctBoms onSettings={() => pushSub('estpdf')} />
      default: return null
    }
  }

  const cs = creditState()
  const avail = cs.limit - cs.outstanding
  const od = cs.open.filter(b => b.days < 0).length

  return (
    <div className="acctpage">
      <div className="acct-head2">
        <Flex align="center" justify="between">
          <button className="sheet-back" onClick={onClose} aria-label="Back" style={{ background: 'rgba(255,255,255,.7)' }}>
            <ArrowLeftIcon />
          </button>
          <button className="help-pill" onClick={() => setSub('support')}>Help</button>
        </Flex>
        <Heading as="h2" mt="4" style={{ fontSize: 27, letterSpacing: '-0.8px' }}>Virag Bora</Heading>
        <Text size="2" color="gray" as="div" mt="1">+91 98860 12345 · Bora Hardware & Plywood</Text>
        <Text size="2" color="gray" as="div">virag@borahardware.in</Text>
        <div className="joy-chip"><StarFilledIcon width={11} height={11} /> Top 25% dealer in HSR Layout — great going</div>
      </div>

      <div className="cp-body">
        <div className="mem-card">
          <Flex align="center" gap="2">
            <span className="tier-mini" style={{ background: '#98A2B3', width: 15, height: 15 }} />
            <Text size="4" weight="bold" style={{ letterSpacing: '-0.4px' }}>Silver Dealer</Text>
            <span className="mem-join">Gold at ₹2L/mo</span>
          </Flex>
          <Text size="2" weight="bold" as="div" mt="2" style={{ lineHeight: 1.4 }}>
            +2% margin & priority dispatch at Gold — ₹75,500 to go this month
          </Text>
          <div className="mem-bar"><div style={{ width: '62%' }} /></div>
          <div className="mem-divider" />
          <button className="mem-row" onClick={() => setSub('dash')}>
            <BarChartIcon width={16} height={16} /><span>View dealer journey</span><ChevronRightIcon width={15} height={15} color="var(--gray-8)" />
          </button>
          <button className="mem-row" onClick={() => setSub('schemes')}>
            <StarFilledIcon width={15} height={15} /><span>Schemes & discounts</span><ChevronRightIcon width={15} height={15} color="var(--gray-8)" />
          </button>
        </div>

        <div className="qt-row">
          {ACCT_TILES.map(([k, Icon, l1, l2]) => (
            <button key={k} className="qt" onClick={() => setSub(k)}>
              <Icon width={19} height={19} />
              <Text weight="bold" as="div" mt="1" style={{ lineHeight: 1.3, fontSize: 11 }}>{l1}<br />{l2}</Text>
            </button>
          ))}
        </div>

        <button className="credit-snap" onClick={() => setSub('credit')}>
          <Flex align="center" justify="between">
            <Text size="1" weight="bold" className="u-seclabel">CREDIT AVAILABLE</Text>
            {od > 0 ? <span className="st-chip bad">{od} overdue</span> : <span className="st-chip ok">On track</span>}
          </Flex>
          <Flex align="baseline" gap="2" mt="1">
            <Text size="5" weight="bold" style={{ letterSpacing: '-0.5px' }}>{fmtL(avail)}</Text>
            <Text size="1" color="gray">of {fmtL(CREDIT.limit)}{cs.outstanding > 0 ? ` · ${fmtL(cs.outstanding)} due` : ''}</Text>
            <ChevronRightIcon width={15} height={15} color="var(--gray-8)" style={{ marginLeft: 'auto' }} />
          </Flex>
          <div className="mem-bar">
            <div style={{ width: `${Math.round((avail / CREDIT.limit) * 100)}%`, background: od > 0 ? 'var(--red-9)' : avail / CREDIT.limit < .35 ? 'var(--amber-9)' : 'var(--green-9)' }} />
          </div>
        </button>

        <div className="cp-card" style={{ padding: '2px 16px' }}>
          {ACCT_FLAT.map(([key, Icon, t]) => (
            <button key={key} className="flat-row" onClick={() => setSub(key)}>
              <span className={`flat-ic c-${ACCT_ICO[key] || 'slate'}`}><Icon width={15} height={15} /></span>
              <Text size="2" weight="medium" style={{ flex: 1, textAlign: 'left' }}>{t}</Text>
              <ChevronRightIcon width={15} height={15} color="var(--gray-8)" />
            </button>
          ))}
        </div>

        <div className="cp-card" style={{ padding: '2px 16px' }}>
          <button className="flat-row" onClick={() => setLo('confirm')}>
            <span className="flat-ic c-red"><ExitIcon width={15} height={15} /></span>
            <Text size="2" weight="bold" style={{ flex: 1, textAlign: 'left', color: 'var(--red-11)' }}>Log out</Text>
          </button>
        </div>
        <Text size="1" color="gray" as="div" style={{ textAlign: 'center', padding: '4px 0 16px' }}>QuickCart · v1.0 · Furniture hardware for dealers</Text>
      </div>

      <PageExit open={sub !== null}>
        {sub && (
          <div className={`acct-sub ${sub === 'dash' ? 'sub-dark' : ''}`}>
            <div className="pdp-head">
              <button className="sheet-back" onClick={backSub} aria-label="Back"><ArrowLeftIcon /></button>
              <Heading as="h2" size="4" style={{ flex: 1, letterSpacing: '-0.3px' }}>{ACCT_TITLES[sub]}</Heading>
            </div>
            <div className="cp-body">{renderSub()}</div>
          </div>
        )}
      </PageExit>

      {lo && (
        <div className="order-done" onClick={() => lo === 'confirm' && setLo(null)}>
          <div className="od-card" onClick={(e) => e.stopPropagation()}>
            {lo === 'confirm' ? (
              <>
                <Heading as="h2" size="5" style={{ letterSpacing: '-0.3px' }}>Log out?</Heading>
                <Text size="2" color="gray" as="div" mt="1">Your cart and preferences stay saved on this device.</Text>
                <Flex gap="2" mt="4">
                  <Button size="3" variant="soft" color="gray" radius="full" style={{ fontWeight: 800, flex: 1 }} onClick={() => setLo(null)}>Cancel</Button>
                  <Button size="3" color="red" radius="full" style={{ fontWeight: 800, flex: 1 }} onClick={() => setLo('out')}>Log out</Button>
                </Flex>
              </>
            ) : (
              <>
                <div className="od-tick">✓</div>
                <Heading as="h2" size="5" mt="3" style={{ letterSpacing: '-0.3px' }}>Logged out</Heading>
                <Text size="2" color="gray" as="div" mt="1">See you soon — your targets are waiting.</Text>
                <Button mt="4" size="3" color="green" radius="full" style={{ fontWeight: 800, width: '100%' }} onClick={() => { setLo(null); onClose() }}>Log back in</Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

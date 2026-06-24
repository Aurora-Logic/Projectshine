import { useContext, useEffect, useState } from 'react'
import { Box, Flex, Text, TextField } from '@radix-ui/themes'
import {
  MagnifyingGlassIcon, ChevronDownIcon, ChevronRightIcon, PersonIcon,
  StarFilledIcon, DashboardIcon,
} from '@radix-ui/react-icons'
import { CartCtx, VariantCtx } from '../../contexts.js'
import { SkyLayer, CartGlyph, btnish } from '../ui.jsx'
import { SEARCH_HINTS, HEADER_TABS, MY_RANK, TARGETS } from '../../data.js'
import { scrollToId } from '../../lib/util.js'
import { BRAND_KEYS } from '../../lib/catalog.js'

export function TopBar({ compact, dp, cond, brand, onBrand, onSearch, cartCount, plain, onTargets, onAccount }) {
  const openCart = useContext(CartCtx)
  const variant = useContext(VariantCtx)
  const [hint, setHint] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setHint(h => (h + 1) % SEARCH_HINTS.length), 2500)
    return () => clearInterval(t)
  }, [])

  return (
    <div className={`topbar ${compact ? 'compact' : ''}`}>
      {!plain && <SkyLayer dp={dp} cond={cond} />}
      <Flex align="center" gap="3" className="loc-row" mb="3">
        <Box flexGrow="1" style={{ cursor: 'pointer', minWidth: 0 }}>
          <Flex align="center" gap="2">
            <Text size="2" weight="bold" truncate style={{ color: '#fff' }}>Home · HSR Layout</Text>
            <ChevronDownIcon width={14} height={14} color="#fff" style={{ flex: 'none' }} />
          </Flex>
          <Text size="1" truncate as="div" style={{ color: 'rgba(255,255,255,.72)' }}>
            304, Maple Heights
          </Text>
        </Box>
        <div className="avatar" aria-label="Cart" onClick={openCart || undefined}>
          <CartGlyph />
          {cartCount > 0 && <span className="cart-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
        </div>
        <div className="avatar" onClick={onAccount || undefined}><PersonIcon width={19} height={19} /></div>
      </Flex>

      <TextField.Root
        size="3" radius="full" placeholder={SEARCH_HINTS[hint]} readOnly
        onClick={onSearch} onFocus={(e) => { e.target.blur(); onSearch() }}
        style={{ background: '#fff', boxShadow: '0 3px 10px rgba(0,0,0,.2)', cursor: 'pointer' }}
      >
        <TextField.Slot>
          <MagnifyingGlassIcon width={17} height={17} />
        </TextField.Slot>
      </TextField.Root>

      {variant === 'control' && (
        <div className="rewards-strip" {...btnish(() => scrollToId('leaderboard'))}>
          <StarFilledIcon width={14} height={14} color="var(--amber-9)" style={{ flex: 'none' }} />
          <span className="tier-mini" style={{ background: '#98A2B3' }} />
          <Text size="1" weight="bold" truncate style={{ flex: 1, minWidth: 0 }}>
            Silver dealer · ahead of {Math.round(((MY_RANK.of - MY_RANK.rank) / MY_RANK.of) * 100)}% in your region
          </Text>
          <Text size="1" weight="bold" color="amber" style={{ flex: 'none' }}>View journey</Text>
          <ChevronRightIcon width={13} height={13} color="var(--amber-11)" style={{ flex: 'none' }} />
        </div>
      )}

      {plain && (
        <div className="tgt-mini" onClick={onTargets}>
          <Text size="1" weight="bold" style={{ color: '#fff', flex: 'none' }}>Monthly target</Text>
          <div className="tgt-mini-bar">
            <div className="tgt-mini-fill" style={{ width: `${Math.min(100, Math.round((TARGETS?.monthly?.done / TARGETS?.monthly?.target) * 100))}%` }} />
          </div>
          <Text size="1" weight="bold" style={{ color: '#fff', flex: 'none' }}>
            {Math.round((TARGETS?.monthly?.done / TARGETS?.monthly?.target) * 100)}% · ₹{Math.round((TARGETS?.monthly?.target - TARGETS?.monthly?.done) / 1000)}k to go
          </Text>
          <ChevronRightIcon width={12} height={12} color="rgba(255,255,255,.7)" style={{ flex: 'none' }} />
        </div>
      )}

      <div className="tabs-t">
        {HEADER_TABS.map((t, i) => {
          const key = BRAND_KEYS[i]
          return (
            <button key={t.l} className={`tab-t ${key === brand ? 'active' : ''}`} onClick={() => onBrand(key)}>
              <span className="tab-chip">
                {t.logo
                  ? <img src={t.logo} alt={t.l} />
                  : <DashboardIcon width={16} height={16} color="var(--gray-11)" />}
              </span>
              <span className="lb">{t.l}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

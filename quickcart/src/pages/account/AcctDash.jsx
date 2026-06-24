import { useState } from 'react'
import { Box, Button, Flex, Text } from '@radix-ui/themes'
import { BarChartIcon, ChevronRightIcon, ChevronUpIcon, CounterClockwiseClockIcon, RocketIcon, StarFilledIcon } from '@radix-ui/react-icons'
import { DASH, TARGETS, MY_RANK, TIERS } from '../../data.js'
import { useNextFrame, useCountUp } from '../../hooks.js'
import { fmtL } from '../../components/home.jsx'

export function Toggle({ on, onToggle }) {
  return (
    <button className={`tgl ${on ? 'on' : ''}`} onClick={onToggle} role="switch" aria-checked={on}>
      <span />
    </button>
  )
}

function MiniBars({ data, color = '#2E6E4E', hi = -1 }) {
  const mx = Math.max(...data)
  return (
    <div className="mini-bars">
      {data.map((v, i) => (
        <span key={i} style={{ height: `${22 + 78 * (v / mx)}%`, background: i === hi ? 'var(--gold-10)' : color }} />
      ))}
    </div>
  )
}

function MiniLine({ data, color = '#3E63DD', fill }) {
  const mx = Math.max(...data)
  const mn = Math.min(...data)
  const pt = (v, i) => `${(i / (data.length - 1)) * 100},${28 - 24 * ((v - mn) / (mx - mn || 1))}`
  const pts = data.map(pt).join(' ')
  return (
    <svg className="mini-line" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      {fill && <polygon points={`0,32 ${pts} 100,32`} fill={color} opacity=".18" />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Bars({ data }) {
  const [sel, setSel] = useState(data.length - 1)
  const ready = useNextFrame()
  const max = Math.max(...data.map(d => d[1]))
  const si = Math.min(sel, data.length - 1)
  return (
    <>
      <Flex align="baseline" gap="3" mt="2">
        <Text size="5" weight="bold" style={{ letterSpacing: '-0.4px', whiteSpace: 'nowrap', flexShrink: 0 }}>{fmtL(data[si][1] * 1000)}</Text>
        <Text size="1" style={{ color: '#98A0AB', whiteSpace: 'nowrap' }}>{data[si][0]} purchases</Text>
      </Flex>
      <div className="bars">
        {data.map(([m, v], i) => (
          <button key={m} className={`bar ${i === si ? 'on' : ''}`} onClick={() => setSel(i)}>
            <span style={{ height: ready ? `${(v / max) * 100}%` : '0%' }} />
            <em>{m}</em>
          </button>
        ))}
      </div>
    </>
  )
}

function Donut({ cats }) {
  const [sel, setSel] = useState(0)
  let acc = 0
  const stops = cats.map(([, pct, c]) => {
    const s = `${c} ${acc}% ${acc + pct}%`
    acc += pct
    return s
  }).join(', ')
  return (
    <Flex gap="4" align="center" mt="3">
      <div className="donut" style={{ background: `conic-gradient(${stops})` }}>
        <div className="donut-hole">
          <Text size="4" weight="bold" as="div">{cats[sel][1]}%</Text>
          <Text as="div" style={{ fontSize: 9, color: 'var(--gray-10)' }}>{cats[sel][0]}</Text>
        </div>
      </div>
      <Box flexGrow="1" style={{ minWidth: 0 }}>
        {cats.map(([l, pct, c], i) => (
          <button key={l} className={`leg ${i === sel ? 'on' : ''}`} onClick={() => setSel(i)}>
            <span className="leg-dot" style={{ background: c }} />
            <Text size="1" weight={i === sel ? 'bold' : 'medium'}>{l}</Text>
            <Text size="1" color="gray" style={{ marginLeft: 'auto' }}>{pct}%</Text>
          </button>
        ))}
      </Box>
    </Flex>
  )
}

export function AcctDash({ onReorder }) {
  const [per, setPer] = useState(12)
  const [tab, setTab] = useState('trend')
  const [tper, setTper] = useState('monthly')
  const ready = useNextFrame()
  const k = DASH.kpis
  const tt = TARGETS[tper]
  const tpct = Math.min(100, Math.round((tt.done / tt.target) * 100))
  const big = useCountUp(k.month, true, 1100)
  const best = DASH.months.reduce((a, b) => (b[1] > a[1] ? b : a))
  const bestIdx = DASH.months.findIndex(d => d[1] === best[1])
  const pctile = Math.round(((MY_RANK.of - MY_RANK.rank) / MY_RANK.of) * 100)
  const mser = DASH.months.slice(-8).map(d => d[1])
  const ordSer = mser.map(v => Math.round(v / 8.3))
  const aovSer = mser.map((v, i) => v / ordSer[i])
  const savSer = mser.map(v => v * 0.115)
  const tgtPct = Math.min(100, Math.round((k.month / TARGETS.monthly.target) * 100))
  return (
    <>
      <div className="dash-hero d3h">
        <Flex align="center" gap="4">
          <svg width="74" height="74" viewBox="0 0 74 74" style={{ flex: 'none' }}>
            <circle cx="37" cy="37" r="30" stroke="rgba(255,255,255,.2)" strokeWidth="7" fill="none" />
            <circle
              cx="37" cy="37" r="30" strokeWidth="7" fill="none" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 30}
              strokeDashoffset={(2 * Math.PI * 30) * (1 - (ready ? Math.min(1, k.month / TARGETS.monthly.target) : 0))}
              transform="rotate(-90 37 37)"
              style={{ stroke: 'var(--gold-9)', transition: 'stroke-dashoffset 1.1s cubic-bezier(.22, 1, .36, 1)' }}
            />
            <text x="37" y="42" textAnchor="middle" fill="#fff" fontSize="15" fontWeight="800">{tgtPct}%</text>
          </svg>
          <Box style={{ minWidth: 0 }}>
            <Text size="1" weight="bold" as="div" style={{ color: 'rgba(255,255,255,.65)', letterSpacing: '.6px', fontSize: 10 }}>
              PURCHASES THIS MONTH
            </Text>
            <Text weight="bold" as="div" mt="1" style={{ fontSize: 32, color: '#fff', letterSpacing: '-1px', fontVariantNumeric: 'tabular-nums' }}>
              {fmtL(big)}
            </Text>
            <span className="up-chip" style={{ marginTop: 6, display: 'inline-flex' }}>
              <ChevronUpIcon width={12} height={12} /> {k.growth}% vs last year
            </span>
          </Box>
        </Flex>
      </div>

      <div className="cp-card dk">
        <Flex align="center" justify="between">
          <Text size="1" weight="bold" style={{ color: '#98A0AB', letterSpacing: '.5px', fontSize: 10.5 }}>TARGETS</Text>
          <div className="seg" style={{ margin: 0 }}>
            {Object.keys(TARGETS).map(kk => (
              <button key={kk} className={`seg-b ${tper === kk ? 'on' : ''}`} onClick={() => setTper(kk)}>
                {TARGETS[kk].label}
              </button>
            ))}
          </div>
        </Flex>
        <Flex align="baseline" gap="2" mt="2">
          <Text weight="bold" style={{ fontSize: 27, color: '#F2F4F7', letterSpacing: '-0.6px' }}>{tpct}%</Text>
          <Text style={{ fontSize: 10.5, color: '#98A0AB' }}>achieved</Text>
          <Text size="1" weight="bold" style={{ marginLeft: 'auto', color: '#F2F4F7' }}>
            {fmtL(tt.done)} <span style={{ color: '#98A0AB', fontWeight: 600 }}>of {fmtL(tt.target)}</span>
          </Text>
        </Flex>
        <div className="dk-bar"><div style={{ width: ready ? `${tpct}%` : '0%' }} /></div>
        <Flex align="center" justify="between" mt="2">
          <Text style={{ fontSize: 10.5, color: '#98A0AB' }}>{fmtL(tt.target - tt.done)} to go · ends {tt.ends}</Text>
          <Text style={{ fontSize: 10.5, color: 'var(--gold-10)', fontWeight: 800 }}>{tt.note}</Text>
        </Flex>
      </div>

      <div className="kpi-grid">
        <div className="kpi dk">
          <Text size="1" style={{ color: 'var(--blue-9)', fontWeight: 700 }}>Orders</Text>
          <Flex align="baseline" gap="2">
            <Text size="4" weight="bold" as="div" style={{ color: '#F2F4F7' }}>{k.orders}</Text>
            <Text style={{ fontSize: 10, color: '#56C271', fontWeight: 800 }}>▲ 3</Text>
          </Flex>
          <MiniBars data={ordSer} color="#2A4364" />
        </div>
        <div className="kpi dk">
          <Text size="1" style={{ color: 'var(--violet-9)', fontWeight: 700 }}>Avg order</Text>
          <Flex align="baseline" gap="2">
            <Text size="4" weight="bold" as="div" style={{ color: '#F2F4F7' }}>₹{(k.aov / 1000).toFixed(1)}k</Text>
            <Text style={{ fontSize: 10, color: '#56C271', fontWeight: 800 }}>▲ 6%</Text>
          </Flex>
          <MiniLine data={aovSer} color="#8E7AF0" />
        </div>
        <div className="kpi dk">
          <Text size="1" style={{ color: 'var(--green-9)', fontWeight: 700 }}>Saved</Text>
          <Flex align="baseline" gap="2">
            <Text size="4" weight="bold" as="div" style={{ color: '#F2F4F7' }}>₹{(k.saved / 1000).toFixed(1)}k</Text>
            <Text style={{ fontSize: 10, color: '#56C271', fontWeight: 800 }}>▲ ₹2.1k</Text>
          </Flex>
          <MiniLine data={savSer} color="#46B576" fill />
        </div>
        <div className="kpi dk">
          <Text size="1" style={{ color: 'var(--gold-10)', fontWeight: 700 }}>Best month</Text>
          <Flex align="baseline" gap="2">
            <Text size="4" weight="bold" as="div" style={{ color: '#F2F4F7' }}>{fmtL(best[1] * 1000)}</Text>
            <Text style={{ fontSize: 10, color: '#98A0AB', fontWeight: 700 }}>{best[0]}</Text>
          </Flex>
          <MiniBars data={DASH.months.map(d => d[1])} hi={bestIdx} />
        </div>
      </div>

      <div className="cp-card dk">
        <Text size="1" weight="bold" as="div" style={{ color: '#98A0AB', letterSpacing: '.5px', fontSize: 10.5 }}>HIGHLIGHTS</Text>
        <div className="dkrow">
          <span className="bdg-ic" style={{ background: 'rgba(245,194,66,.14)', color: 'var(--gold-10)' }}><StarFilledIcon width={14} height={14} /></span>
          <Text size="2" weight="bold" style={{ flex: 1, color: '#F2F4F7' }}>Top 25% dealer in HSR Layout</Text>
        </div>
        <div className="dkrow">
          <span className="bdg-ic" style={{ background: 'rgba(62,99,221,.16)', color: '#7E9BF2' }}><BarChartIcon width={14} height={14} /></span>
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Text size="2" weight="bold" style={{ color: '#F2F4F7' }}>Ahead of {pctile}% of dealers</Text>
            <div className="dk-bar slim"><div style={{ width: ready ? `${pctile}%` : '0%' }} /></div>
          </Box>
        </div>
        <button className="dkrow act" onClick={onReorder}>
          <span className="bdg-ic" style={{ background: 'rgba(70,181,118,.16)', color: '#56C271' }}><CounterClockwiseClockIcon width={14} height={14} /></span>
          <Text size="2" weight="bold" style={{ flex: 1, textAlign: 'left', color: '#F2F4F7' }}>4 regulars due — restock in one tap</Text>
          <ChevronRightIcon width={15} height={15} color="#5A6270" />
        </button>
        <div className="dkrow">
          <span className="bdg-ic" style={{ background: 'rgba(245,194,66,.14)', color: 'var(--gold-10)' }}><RocketIcon width={14} height={14} /></span>
          <Text size="2" weight="bold" style={{ flex: 1, color: '#F2F4F7' }}>
            {fmtL(best[1] * 1000 - k.month)} from beating your {best[0]} record
          </Text>
        </div>
      </div>

      <div className="cp-card dk d3-card">
        <div className="seg" style={{ marginTop: 0, marginBottom: 14 }}>
          {[['trend', 'Trend'], ['mix', 'Category mix'], ['brands', 'Brands']].map(([kk, l]) => (
            <button key={kk} className={`seg-b ${tab === kk ? 'on' : ''}`} onClick={() => setTab(kk)}>{l}</button>
          ))}
        </div>
        {tab === 'trend' && (
          <>
            <Flex align="center" justify="between">
              <Text size="2" weight="bold" style={{ color: '#F2F4F7' }}>Purchases</Text>
              <div className="seg" style={{ margin: 0 }}>
                {[[6, '6M'], [12, '1Y']].map(([n, l]) => (
                  <button key={l} className={`seg-b ${per === n ? 'on' : ''}`} onClick={() => setPer(n)}>{l}</button>
                ))}
              </div>
            </Flex>
            <Bars key={per} data={DASH.months.slice(-per)} />
          </>
        )}
        {tab === 'mix' && <Donut cats={DASH.cats} />}
        {tab === 'brands' && (
          <Box pt="1">
            {DASH.brands.map(([b, pct], i) => (
              <Flex key={b} align="center" gap="3" mt={i === 0 ? '1' : '2'}>
                <Text size="1" weight="bold" style={{ width: 76, flex: 'none', color: '#F2F4F7' }}>{b}</Text>
                <div className="hbar"><div style={{ width: ready ? `${pct}%` : '0%' }} /></div>
                <Text size="1" style={{ width: 34, textAlign: 'right', flex: 'none', color: '#98A0AB' }}>{pct}%</Text>
              </Flex>
            ))}
          </Box>
        )}
      </div>
      <Box pb="4" />
    </>
  )
}

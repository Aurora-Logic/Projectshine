import { Box, Flex, Heading, Text, Button } from '@radix-ui/themes'
import { DashboardIcon, LightningBoltIcon } from '@radix-ui/react-icons'
import { BRAND_KEYS, BRAND_LOGOS } from '../../data.js'
import {
  DEFAULT_F, fBadges, SUBCATS, subcatThumb, MATERIALS, matThumb, SIZES, SORT_OPTIONS,
} from '../../lib/catalog.js'
import { img } from '../../lib/util.js'
import { useSheetA11y } from '../../hooks.js'
import { Img } from '../Img.jsx'

/* Filters & sorting bottom-sheet for the category listing page (PLP). */
export function FilterSheet({ group, onGroup, cat = 'All', b, setB, f, setF, count }) {
  const a11y = useSheetA11y(() => onGroup(null), !!group)
  if (!group) return null
  const set = (patch) => setF(cur => ({ ...cur, ...patch }))
  const badges = fBadges(f, b)
  const groups = [
    ['sub', 'Subcategory'], ['brand', 'Brand'], ['material', 'Material'],
    // spec filters appear only where the category carries the spec
    ...(cat === 'Hinges' ? [['doorThk', 'Door thk'], ['carcassThk', 'Carcass']] : []),
    ['load', 'Load'], ['size', 'Size'], ['deal', 'Deals'], ['sort', 'Sort'],
  ]
  return (
    <div className="bsheet-overlay" onClick={() => onGroup(null)}>
      <div
        className="bsheet fsheet" role="dialog" aria-modal="true" aria-label="Filters and sorting" tabIndex={-1}
        ref={a11y} onClick={(e) => e.stopPropagation()}
      >
        <Flex align="center" justify="between" px="4" pt="4" pb="3">
          <Heading as="h2" size="4">Filters & sorting</Heading>
          <Text size="2" weight="bold" color="red" style={{ cursor: 'pointer' }}
            onClick={() => { setB('ALL'); setF(DEFAULT_F) }}>
            Clear all
          </Text>
        </Flex>
        <div className="fs-body">
          <div className="fs-rail">
            {groups.map(([k, l]) => (
              <div key={k} className={`fs-group ${group === k ? 'on' : ''}`} onClick={() => onGroup(k)}>
                {badges[k] > 0 && <span className="fs-badge">{badges[k]}</span>}
                <Text size="1" weight="bold">{l}</Text>
              </div>
            ))}
          </div>
          <div className="fs-pane">
            {group === 'sub' && (
              cat === 'All' ? (
                <Text size="2" color="gray">
                  Pick a category first — subcategories live inside each category.
                </Text>
              ) : (
                <div className="fs-tiles">
                  {(SUBCATS[cat] || []).map(([label, kw]) => {
                    const th = subcatThumb(kw)
                    const on = f.spec?.[1] === kw
                    return (
                      <button key={kw} className={`fs-tile ${on ? 'on' : ''}`} onClick={() => set({ spec: on ? null : [label, kw] })}>
                        {th && <Img className="ph" src={img(th, 220)} alt="" />}
                        <div className="fs-cap"><Text size="2" weight="bold">{label}</Text></div>
                      </button>
                    )
                  })}
                </div>
              )
            )}
            {group === 'brand' && (
              <div className="fs-tiles">
                <button className={`fs-tile ${b === 'ALL' ? 'on' : ''}`} onClick={() => setB('ALL')}>
                  <div className="media">
                    <DashboardIcon width={26} height={26} color="var(--gray-11)" />
                  </div>
                  <div className="fs-cap"><Text size="2" weight="bold">All brands</Text></div>
                </button>
                {BRAND_KEYS.slice(1).map(k => (
                  <button key={k} className={`fs-tile ${b === k ? 'on' : ''}`} onClick={() => setB(cur => (cur === k ? 'ALL' : k))}>
                    <div className="media">
                      <img className="lg" src={BRAND_LOGOS[k]} alt={k} />
                    </div>
                    <div className="fs-cap"><Text size="2" weight="bold">{k.charAt(0).toUpperCase() + k.slice(1)}</Text></div>
                  </button>
                ))}
              </div>
            )}
            {group === 'material' && (
              <div className="fs-tiles">
                {MATERIALS.map(m => {
                  const th = matThumb(m)
                  const on = f.mat === m
                  return (
                    <button key={m} className={`fs-tile ${on ? 'on' : ''}`} onClick={() => set({ mat: on ? null : m })}>
                      {th && <Img className="ph" src={img(th, 220)} alt="" />}
                      <div className="fs-cap"><Text size="2" weight="bold">{m}</Text></div>
                    </button>
                  )
                })}
              </div>
            )}
            {group === 'load' && (
              <Box>
                <Flex align="center" justify="between">
                  <Text size="2" weight="bold">Min load capacity</Text>
                  <Text size="2" weight="bold" style={{ color: 'var(--green-11)' }}>
                    {f.load > 0 ? `≥ ${f.load} kg` : 'Any'}
                  </Text>
                </Flex>
                <input
                  type="range" className="ldr" min="0" max="60" step="5" value={f.load}
                  aria-label="Minimum load rating"
                  aria-valuetext={f.load ? `${f.load} kg or more` : 'Any load'}
                  onChange={(e) => set({ load: +e.target.value })}
                />
                <Flex align="center" justify="between">
                  <Text size="1" color="gray">Any</Text>
                  <Text size="1" color="gray">60 kg</Text>
                </Flex>
                <Text size="1" color="gray" as="div" mt="3">
                  Filters slides, systems & arms by rated load. Unrated items hide when set.
                </Text>
              </Box>
            )}
            {group === 'size' && (
              <div className="fs-tiles">
                {SIZES.map(sz => {
                  const on = f.size === sz
                  return (
                    <button key={sz} className={`fs-tile ${on ? 'on' : ''}`} onClick={() => set({ size: on ? null : sz })}>
                      <div className="media"><Text weight="bold" style={{ fontSize: 24 }}>{sz}<span style={{ fontSize: 13 }}>mm</span></Text></div>
                      <div className="fs-cap"><Text size="2" weight="bold">{sz} mm</Text></div>
                    </button>
                  )
                })}
              </div>
            )}
            {group === 'doorThk' && (
              <div className="fs-tiles">
                {[16, 18, 19, 25].map(v => {
                  const on = f.doorThk === v
                  return (
                    <button key={v} className={`fs-tile ${on ? 'on' : ''}`} onClick={() => set({ doorThk: on ? null : v })}>
                      <div className="media"><Text weight="bold" style={{ fontSize: 24 }}>{v}<span style={{ fontSize: 13 }}>mm</span></Text></div>
                      <div className="fs-cap"><Text size="2" weight="bold">{v} mm door</Text></div>
                    </button>
                  )
                })}
              </div>
            )}
            {group === 'carcassThk' && (
              <div className="fs-tiles">
                {[16, 18].map(v => {
                  const on = f.carcassThk === v
                  return (
                    <button key={v} className={`fs-tile ${on ? 'on' : ''}`} onClick={() => set({ carcassThk: on ? null : v })}>
                      <div className="media"><Text weight="bold" style={{ fontSize: 24 }}>{v}<span style={{ fontSize: 13 }}>mm</span></Text></div>
                      <div className="fs-cap"><Text size="2" weight="bold">{v} mm board</Text></div>
                    </button>
                  )
                })}
              </div>
            )}
            {group === 'deal' && (
              <div className="fs-tiles">
                <button className={`fs-tile ${!f.deals ? 'on' : ''}`} onClick={() => set({ deals: false })}>
                  <div className="media media-ic"><DashboardIcon width={26} height={26} /></div>
                  <div className="fs-cap"><Text size="2" weight="bold">All items</Text></div>
                </button>
                <button className={`fs-tile ${f.deals ? 'on' : ''}`} onClick={() => set({ deals: true })}>
                  <div className="media media-ic"><LightningBoltIcon width={26} height={26} /></div>
                  <div className="fs-cap"><Text size="2" weight="bold">Deals only</Text></div>
                </button>
              </div>
            )}
            {group === 'sort' && SORT_OPTIONS.map((o, i) => (
              <button key={o} className="bsheet-row" onClick={() => set({ sort: i })}>
                <span className={`radio ${i === f.sort ? 'on' : ''}`} />
                <Text size="2" weight={i === f.sort ? 'bold' : 'medium'}>{o}</Text>
              </button>
            ))}
          </div>
        </div>
        <div className="fs-foot">
          <Button size="3" variant="soft" color="gray" radius="full" onClick={() => onGroup(null)}>
            Close
          </Button>
          <Button size="3" color="green" radius="full" style={{ flex: 1, fontWeight: 800 }} onClick={() => onGroup(null)}>
            Show {count} result{count === 1 ? '' : 's'}
          </Button>
        </div>
      </div>
    </div>
  )
}

import { Flex, Text } from '@radix-ui/themes'
import { EST_SWATCHES } from '../lib/estimate.js'

/* BOM-PDF settings presentational leaves — extracted from App.jsx (A5.1 components phase) */

function TplCard({ k, label, active, paper, accent, onClick }) {
  const ink = 'rgba(0,0,0,.55)'
  return (
    <button type="button" className={`tpl-card ${active ? 'on' : ''}`} onClick={onClick} aria-label={`${label} template`}>
      <div className="tpl-page" style={{ background: paper }}>
        {k === 'classic' && (
          <>
            <Flex justify="between" align="center">
              <div className="tp-line" style={{ width: '38%', height: 4, background: ink }} />
              <div className="tp-dot" />
            </Flex>
            <Flex gap="1">{[14, 14, 14, 14].map((w, i) => <div key={i} className="tp-row" style={{ width: w }} />)}</Flex>
            <div className="tp-line" style={{ marginTop: 4 }} />
            <div className="tp-row" style={{ width: '52%' }} />
            <div className="tp-line" />
            {[1, 2, 3].map(i => <div key={i} className="tp-row" />)}
            <div className="tp-row" style={{ width: '46%', alignSelf: 'flex-end', background: 'rgba(0,0,0,.16)' }} />
          </>
        )}
        {k === 'bold' && (
          <>
            <div className="tp-band" style={{ background: accent, height: 26, margin: '-7px -7px 0', borderRadius: 0, padding: '5px 7px' }}>
              <div className="tp-line" style={{ width: '34%', height: 6, background: 'rgba(0,0,0,.65)' }} />
            </div>
            {[1, 2, 3].map(i => <div key={i} className="tp-row" style={{ marginTop: i === 1 ? 5 : 0 }} />)}
            <div className="tp-row" style={{ width: '46%', alignSelf: 'flex-end', background: 'rgba(0,0,0,.16)' }} />
            <div style={{ flex: 1 }} />
            <div className="tp-band" style={{ background: 'rgba(0,0,0,.55)', height: 9, margin: '0 -7px' }} />
            <div className="tp-band" style={{ background: accent, height: 8, margin: '0 -7px' }} />
          </>
        )}
        {k === 'studio' && (
          <>
            <Flex justify="between">
              <div className="tp-dot" style={{ borderRadius: 99 }} />
              <Flex direction="column" gap="1" style={{ width: '46%' }}>
                {[1, 2, 3].map(i => <div key={i} className="tp-line" style={{ width: '100%' }} />)}
              </Flex>
            </Flex>
            <div className="tp-line" style={{ width: '44%', height: 3, background: ink, marginTop: 3 }} />
            {[1, 2].map(i => <div key={i} className="tp-row" style={{ marginTop: i === 1 ? 4 : 0 }} />)}
            <div className="tp-row" style={{ width: '46%', alignSelf: 'flex-end' }} />
            <div className="tp-row" style={{ width: '60%', alignSelf: 'flex-end', background: 'rgba(0,0,0,.14)', height: 3 }} />
          </>
        )}
      </div>
      <span className="tpl-lab">{label}</span>
    </button>
  )
}

function ColorRow({ label, value, onChange, swatches = EST_SWATCHES }) {
  return (
    <div>
      <Text size="1" weight="bold" as="div" mt="3" className="u-seclabel">
        {label}
      </Text>
      <div className="clr-row">
        {swatches.map(c => (
          <button
            key={c} type="button"
            className={`clr-dot ${value.toUpperCase() === c ? 'on' : ''}`}
            style={{ background: c }}
            onClick={() => onChange(c)} aria-label={`Colour ${c}`}
          />
        ))}
        <label className="clr-custom" title="Custom colour">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value.toUpperCase())} aria-label="Custom colour" />
        </label>
      </div>
    </div>
  )
}

export { TplCard, ColorRow }

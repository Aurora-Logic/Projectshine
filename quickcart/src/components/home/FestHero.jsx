import { Text } from '@radix-ui/themes'
import { FEST } from '../../data.js'
import { img } from '../../lib/util.js'
import { Img } from '../Img.jsx'

/* Festive hero — big promo tile + category tiles (default home header variant) */
export function FestHero({ onCat, palette, layout = 'a' }) {
  return (
    <div className="fest-wrap">
      <div className={`fest-grid f-${layout}`}>
        <button className="fest-promo" onClick={() => onCat(FEST.cat)}>
          <Text as="div" weight="bold" style={{ fontSize: 21, lineHeight: 1.15, color: '#2b2200' }}>{FEST.title}</Text>
          <Text as="div" weight="bold" style={{ fontSize: 19, color: '#2b2200' }}>{FEST.off}</Text>
          <span className="fest-cta">{FEST.cta}</span>
          <Img className="fest-promo-img" src={img(FEST.ph, 300)} alt="" />
        </button>
        <div className="fest-tiles">
          {FEST.tiles.map(t => (
            <button key={t.l} className="fest-tile" onClick={() => onCat(t.cat)}>
              <Img src={img(t.ph, 300)} alt={t.l} loading="lazy" />
              <span className="fest-tl">{t.l}</span>
            </button>
          ))}
        </div>
      </div>
      <div className={`fest-edge ${palette?.edge || 'scallop'}`} />
      <div className={`fest-dots d-${palette?.dot || 'dot'}`}>
        {Array.from({ length: 12 }, (_, i) => <span key={i} />)}
      </div>
    </div>
  )
}

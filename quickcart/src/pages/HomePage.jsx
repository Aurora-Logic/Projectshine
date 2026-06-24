import { useContext } from 'react'
import { Text } from '@radix-ui/themes'
import { Cross2Icon } from '@radix-ui/react-icons'
import { VariantCtx } from '../contexts.js'
import {
  BestSellers, FlashSale, ComboDeals, InspoStrip,
  BrandDay, CategoryGrid, EndlessFeed,
  GameRow, Leaderboard,
} from '../components/home.jsx'
import { Shelf } from '../components/feed.jsx'
import {
  FEED_POOL, DEALS, BUY_AGAIN, NEW_EBCO, WORKSMART, LIVESMART, ZIPCO_PEKO,
  BRAND_DAY, CAT_SHELVES, CAT_RULES,
} from '../data.js'

/* Props supplied by AppShell: onChange, brand, setBrand, applyF, bf, DEFAULT_F,
   onGoKit, onGoInspo, onGoSearch, onGoCategory, onSpin, onQuiz,
   quizCardSlot (rendered QuizCard node from shell), kitBannerSlot */

export function ControlHomeFeed({
  onChange, brand, setBrand, applyF, bf, DEFAULT_F,
  onGoKit, onGoInspo, onGoCategory, onGoSearch,
  onSpin, quizCardSlot, kitBannerSlot,
}) {
  const navigate = useNavigate()
  const homeMode = window.location.hash === '#brandhome' ? 'brand' : 'category'
  const h = new Date().getHours()
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  const catShelf = (i) => {
    const c = CAT_SHELVES[i]
    if (!c) return null
    const items = bf(FEED_POOL.filter(CAT_RULES[c.cat]))
    if (items.length === 0) return null
    return (
      <Shelf
        key={c.cat} title={c.t} items={items} onChange={onChange} band={c.band}
        onSeeAll={() => onGoCategory(c.cat)}
      />
    )
  }

  return (
    <>
      <BestSellers onCat={onGoCategory} />

      {brand !== 'ALL' && (
        <div className="filter-strip">
          <Text size="1" weight="bold" style={{ flex: 1 }}>
            Showing {brand.toUpperCase()} products only
          </Text>
          <button className="filter-clear" onClick={() => setBrand('ALL')}>
            Clear <Cross2Icon width={11} height={11} />
          </button>
        </div>
      )}

      {bf(BUY_AGAIN).length > 0 && (
        <Shelf
          title={`${greet}, Virag`} sub="Your regulars — from your recent orders"
          items={bf(BUY_AGAIN)} onChange={onChange}
          onSeeAll={() => onGoSearch({ items: bf(BUY_AGAIN), title: 'Your regulars' })}
        />
      )}

      <CategoryGrid onPick={onGoCategory} onSeeAll={() => onGoCategory('All')} />

      <FlashSale
        items={applyF(bf(DEALS), { ...DEFAULT_F, sort: 3 }, 'ALL')}
        onChange={onChange}
        onSeeAll={() => onGoSearch({ items: bf(DEALS), title: 'Flash sale' })}
      />

      {quizCardSlot}

      {brand === 'ALL' && <ComboDeals onChange={onChange} />}
      {brand === 'ALL' && (kitBannerSlot || null)}

      {brand === 'ALL' && (
        <BrandDay onShop={() => onGoSearch({ items: FEED_POOL, query: BRAND_DAY.query, title: 'Product of the day' })} />
      )}
      {brand === 'ALL' && (
        <InspoStrip onOpen={(id) => onGoInspo(id)} />
      )}

      {homeMode === 'brand' && bf(NEW_EBCO).length > 0 && (
        <Shelf
          title="New from Ebco" items={bf(NEW_EBCO)} onChange={onChange} band="band-green"
          onSeeAll={() => onGoSearch({ items: bf(NEW_EBCO), title: 'New from Ebco' })}
        />
      )}
      {homeMode === 'category' && catShelf(0)}

      <GameRow onSpin={onSpin} />

      {homeMode === 'brand' ? (
        <>
          {bf(WORKSMART).length > 0 && (
            <Shelf title="Worksmart picks" items={bf(WORKSMART)} onChange={onChange} sub="Office fittings by Ebco"
              onSeeAll={() => onGoSearch({ items: bf(WORKSMART), title: 'Worksmart picks' })} />
          )}
          {bf(LIVESMART).length > 0 && (
            <Shelf title="Livsmart corner" items={bf(LIVESMART)} onChange={onChange} sub="Smart living, by Ebco"
              onSeeAll={() => onGoSearch({ items: bf(LIVESMART), title: 'Livsmart corner' })} />
          )}
        </>
      ) : (
        <>{catShelf(1)}{catShelf(2)}</>
      )}

      <Leaderboard />

      {homeMode === 'brand' ? (
        bf(ZIPCO_PEKO).length > 0 && (
          <Shelf title="Zipco & Peka corner" items={bf(ZIPCO_PEKO)} onChange={onChange} band="band-pink"
            onSeeAll={() => onGoSearch({ items: bf(ZIPCO_PEKO), title: 'Zipco & Peka' })} />
        )
      ) : (
        <>{catShelf(3)}{catShelf(4)}{catShelf(5)}</>
      )}

      <EndlessFeed onChange={onChange} pool={FEED_POOL} />
    </>
  )
}

export function ExperimentHomeFeed({ onChange, applyF, bf, DEFAULT_F, onGoCategory, onGoSearch }) {
  return (
    <>
      <FlashSale
        items={applyF(bf(DEALS), { ...DEFAULT_F, sort: 3 }, 'ALL')}
        onChange={onChange}
        onSeeAll={() => onGoSearch({ items: bf(DEALS), title: 'Flash sale' })}
      />
      <CategoryGrid onPick={onGoCategory} onSeeAll={() => onGoCategory('All')} />
    </>
  )
}

export default function HomePage(props) {
  const variant = useContext(VariantCtx)
  if (variant === 'experiment') return <ExperimentHomeFeed {...props} />
  return <ControlHomeFeed {...props} />
}

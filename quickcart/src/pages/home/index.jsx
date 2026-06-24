import { useOutletContext } from 'react-router-dom'
import { Text } from '@radix-ui/themes'
import { Cross2Icon } from '@radix-ui/react-icons'
import { BUY_AGAIN, NEW_EBCO, DEALS, WORKSMART, LIVESMART } from '../../data.js'
import { applyF, DEFAULT_F } from '../../lib/catalog.js'
import { scrollToId } from '../../lib/util.js'
import { Shelf } from '../../components/feed.jsx'
import { FestHero } from '../../components/home/FestHero.jsx'
import { BannerCarousel } from '../../components/home/BannerCarousel.jsx'
import { OrderCard } from '../../components/home/OrderCard.jsx'
import { FlashSale } from '../../components/home/FlashSale.jsx'
import { CategoryGrid } from '../../components/home/CategoryGrid.jsx'

/* Home page — stitches the home feed together. Global state (cart, order, theme,
   brand, navigation intents) comes from the RootLayout via the router Outlet. */
export default function HomePage() {
  const {
    changeCart, brand, setBrand, setPlp, setSheet,
    order, dismissOrder, reorder,
    heroVariant, heroPal, festL, quizSkin, glow, setGlow,
  } = useOutletContext()

  // brand filter — narrow any shelf to the active brand tab
  const bf = (items) => (brand === 'ALL' ? items : items.filter(p => p.brand === brand))

  const h = new Date().getHours()
  const greet = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  // Home merchandising mode: category-led default; brand-led preserved at #brandhome
  const homeMode = window.location.hash === '#brandhome' ? 'brand' : 'category'

  return (
    <>
      {heroVariant === 'fest' ? (
        <FestHero onCat={(c) => setPlp(c)} palette={heroPal} layout={festL} />
      ) : (
        <div className="header-extend" style={glow ? { '--banner-glow': glow } : undefined}>
          <BannerCarousel quizSkin={quizSkin} onGlow={setGlow} />
        </div>
      )}

      {order && (
        <OrderCard
          order={order} onDismiss={dismissOrder} onReorder={reorder}
          onAddMore={() => scrollToId('deals')}
        />
      )}

      {/* Flash sale leads — the urgency band sits up top */}
      <FlashSale
        items={applyF(bf(DEALS), { ...DEFAULT_F, sort: 3 }, 'ALL')}
        onChange={changeCart}
        onSeeAll={() => setSheet({ items: bf(DEALS), title: 'Flash sale' })}
      />

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
          items={bf(BUY_AGAIN)} onChange={changeCart}
          onSeeAll={() => setSheet({ items: bf(BUY_AGAIN), title: 'Your regulars' })}
        />
      )}

      <CategoryGrid onPick={(c) => setPlp(c)} onSeeAll={() => setPlp('All')} />

      {homeMode === 'brand' ? (
        <>
          {bf(NEW_EBCO).length > 0 && (
            <Shelf
              title="New from Ebco" items={bf(NEW_EBCO)} onChange={changeCart} band="band-green"
              onSeeAll={() => setSheet({ items: bf(NEW_EBCO), title: 'New from Ebco' })}
            />
          )}
          {bf(WORKSMART).length > 0 && (
            <Shelf
              title="Worksmart picks" items={bf(WORKSMART)} onChange={changeCart} sub="Office fittings by Ebco"
              onSeeAll={() => setSheet({ items: bf(WORKSMART), title: 'Worksmart picks' })}
            />
          )}
          {bf(LIVESMART).length > 0 && (
            <Shelf
              title="Livsmart corner" items={bf(LIVESMART)} onChange={changeCart} sub="Smart living, by Ebco"
              onSeeAll={() => setSheet({ items: bf(LIVESMART), title: 'Livsmart corner' })}
            />
          )}
        </>
      ) : null}
    </>
  )
}

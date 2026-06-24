import { Box, Flex, Heading, Text } from '@radix-ui/themes'
import { LightningBoltIcon } from '@radix-ui/react-icons'
import { DealTimer } from '../ui.jsx'
import { FlashCard } from '../cards.jsx'

/* Flash Sale — Deal of the day + Clearance merged: timer, discounts, selling-fast bars */
export function FlashSale({ items, onChange, onSeeAll }) {
  if (items.length === 0) return null
  return (
    <div className="band-flash cv" id="deals">
      <Flex align="center" justify="between" px="4">
        <Flex align="center" gap="3" style={{ minWidth: 0 }}>
          <Heading as="h2" size="4" style={{ color: '#fff', letterSpacing: '-0.2px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <LightningBoltIcon width={17} height={17} style={{ color: 'var(--gold-9)' }} /> Flash sale
        </Heading>
          <DealTimer />
        </Flex>
        <Text size="2" weight="bold" style={{ color: 'rgba(255,255,255,.9)', cursor: 'pointer', flex: 'none' }} onClick={onSeeAll}>
          See all
        </Text>
      </Flex>
      <Box px="4" mt="1" mb="3">
        <Text size="1" style={{ color: 'rgba(255,255,255,.8)' }}>Deals + clearance · up to 60% off · last units</Text>
      </Box>
      <div className="hscroll">
        {items.map(p => <FlashCard key={`fl-${p.id}`} p={p} onChange={onChange} />)}
      </div>
    </div>
  )
}

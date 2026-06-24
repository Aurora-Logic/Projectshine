import { Box, Grid, Text } from '@radix-ui/themes'
import { CATEGORIES } from '../../data.js'
import { img } from '../../lib/util.js'
import { Img } from '../Img.jsx'
import { SectionHead, btnish } from '../ui.jsx'

/* Category grid — the "Categories" section on home */
export function CategoryGrid({ onPick, onSeeAll }) {
  return (
    <Box pt="5">
      <SectionHead title="Categories" onSeeAll={onSeeAll} />
      <Grid columns="3" gapX="3" gapY="4" px="4">
        {CATEGORIES.map(([ph, label, count]) => (
          <div className="cat-tile" key={label} {...btnish(() => onPick(label))}>
            <Img className="cat-img" src={img(ph, 280)} alt={label} loading="lazy" />
            <Text size="1" weight="bold" as="div" align="center" mt="2" truncate>
              {label}
            </Text>
            <Text as="div" align="center" style={{ fontSize: 10.5, color: 'var(--gray-9)', fontWeight: 600 }}>
              {count} items
            </Text>
          </div>
        ))}
      </Grid>
    </Box>
  )
}

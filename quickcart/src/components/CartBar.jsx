import { useContext } from 'react'
import { Box, Flex, Text } from '@radix-ui/themes'
import { ChevronRightIcon } from '@radix-ui/react-icons'
import { CartCtx, CartDataCtx } from '../contexts.js'
import { Img } from './Img.jsx'
import { img } from '../lib/util.js'
import { FREE_DELIVERY_AT } from '../data.js'

export function CartBar() {
  const openCart = useContext(CartCtx)
  const cart = useContext(CartDataCtx)
  const note = cart.total >= FREE_DELIVERY_AT
    ? 'FREE delivery unlocked'
    : `Add ₹${FREE_DELIVERY_AT - cart.total} more for FREE delivery`
  return (
    <div className={`cartbar ${cart.count > 0 ? 'show' : ''}`} onClick={openCart || undefined}>
      <Flex>
        {(cart.photos || []).slice(-3).map(ph => (
          <Img key={ph} className="thumb" src={img(ph, 120)} alt="" />
        ))}
      </Flex>
      <Box flexGrow="1">
        <Text key={cart.count} className="linepop" size="2" weight="bold" as="div">
          {cart.count} item{cart.count === 1 ? '' : 's'} · ₹{cart.total.toLocaleString('en-IN')}
        </Text>
        <Text size="1" weight="medium" as="div" style={{ color: 'var(--green-4)' }}>{note}</Text>
      </Box>
      <Flex align="center" gap="1">
        <Text size="2" weight="bold">View cart</Text>
        <ChevronRightIcon width={16} height={16} />
      </Flex>
    </div>
  )
}

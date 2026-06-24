import { useEffect, useRef, useState } from 'react'
import { Box, Heading, Text, Button } from '@radix-ui/themes'
import { BANNERS } from '../../data.js'
import { img, scrollToId } from '../../lib/util.js'
import { Img } from '../Img.jsx'

/* Auto-rotating hero banner carousel (default home header) */
export function BannerCarousel({ quizSkin, onGlow }) {
  const ref = useRef(null)
  const [idx, setIdx] = useState(0)

  // the header sheet's bottom tint follows the active banner
  useEffect(() => {
    const b = BANNERS[idx]
    if (b && onGlow) onGlow(b.key === 'quiz' ? quizSkin.btn : (b.glow || null))
  }, [idx, quizSkin, onGlow])

  useEffect(() => {
    const t = setInterval(() => {
      const el = ref.current
      if (!el) return
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % BANNERS.length
      el.scrollTo({ left: next * el.clientWidth, behavior: 'smooth' })
    }, 3800)
    return () => clearInterval(t)
  }, [])

  const onScroll = () => {
    const el = ref.current
    if (el) setIdx(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <Box>
      <div className="banner-car" ref={ref} onScroll={onScroll}>
        {BANNERS.map(b => (
          <div className="banner-slide" key={b.key}>
            <div className="banner-inner" style={{ background: b.key === 'quiz' ? quizSkin.bg : b.bg }}>
              <Box flexGrow="1">
                <Heading as="h2" size="6" style={{ color: b.dark ? '#2b2200' : '#fff', letterSpacing: '-0.4px', lineHeight: 1.15 }}>
                  {b.title}
                </Heading>
                <Text size="2" weight="medium" as="div" mt="1" style={{ color: b.dark ? '#5c4a00' : 'rgba(255,255,255,.9)' }}>
                  {b.sub}
                </Text>
                <Button
                  size="2" mt="3" radius="full"
                  color={b.dark ? 'green' : undefined}
                  style={{ fontWeight: 700, ...(b.dark ? {} : { background: '#fff', color: 'var(--gray-12)' }) }}
                  onClick={() => b.anchor && scrollToId(b.anchor)}
                >
                  {b.cta}
                </Button>
              </Box>
              <Img className="banner-img" src={img(b.ph, 280)} alt="" />
            </div>
          </div>
        ))}
      </div>
    </Box>
  )
}

import { memo, useState, useRef, useEffect } from 'react'

const IMG_FALLBACK = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#E9E9E6"/>' +
  '<g fill="none" stroke="#B6B6B0" stroke-width="3.5" stroke-linejoin="round"><rect x="38" y="40" width="44" height="40" rx="2"/>' +
  '<path d="M38 54h44M60 40v40"/></g></svg>')
const Img = memo(function Img(props) {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef(null)
  useEffect(() => { if (ref.current?.complete && ref.current.naturalWidth) setLoaded(true) }, [])
  return (
    <img
      decoding="async"
      {...props} ref={ref}
      onLoad={() => setLoaded(true)}
      onError={(e) => { if (e.currentTarget.src !== IMG_FALLBACK) { e.currentTarget.src = IMG_FALLBACK } setLoaded(true) }}
      className={`${props.className || ''} fadeimg ${loaded ? 'in' : ''}`}
    />
  )
})

export { Img }

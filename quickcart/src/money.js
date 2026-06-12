/* Money math — pure, shared by the app and the test suite.
   ONE price story: once a line crosses its bulk threshold, the tier price IS
   the price — on the qty sheet, the cart row, the bill and the invoice. */

export const bulkTier = (p) => {
  const m = p.bulk?.match(/(\d+)\+\s*@\s*₹([\d,]+)/)
  if (!m) return null
  const bp = +m[2].replace(/,/g, '')
  return { thr: +m[1], bp, pct: Math.max(1, Math.round((1 - bp / p.price) * 100)) }
}

export const unitPriceFor = (p, n) => {
  const t = bulkTier(p)
  return t && n >= t.thr ? t.bp : p.price
}

export const lineTotal = (p, n) => unitPriceFor(p, n) * n

/* coupon → rupees off, given the cart's item total */
export const couponOff = (coupon, itemTotal) => {
  if (!coupon) return 0
  if (coupon.kind === 'pct') return Math.round((itemTotal * coupon.value) / 100)
  if (coupon.kind === 'amt') return Math.min(coupon.value, itemTotal)
  return 0
}

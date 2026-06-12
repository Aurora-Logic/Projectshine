import { describe, expect, it } from 'vitest'
import { bulkTier, couponOff, lineTotal, unitPriceFor } from './money.js'

const slide = { price: 385, mrp: 450, bulk: '10+ @ ₹350/pc' }
const lock = { price: 78 } // no tier
const system = { price: 5450, bulk: '5+ @ ₹4,990/set' } // comma in tier price

describe('bulkTier', () => {
  it('parses threshold, price and percent', () => {
    expect(bulkTier(slide)).toEqual({ thr: 10, bp: 350, pct: 9 })
  })
  it('parses comma-grouped tier prices', () => {
    expect(bulkTier(system)).toEqual({ thr: 5, bp: 4990, pct: 8 })
  })
  it('returns null without a bulk string', () => {
    expect(bulkTier(lock)).toBeNull()
  })
  it('never reports a 0% tier', () => {
    expect(bulkTier({ price: 100, bulk: '10+ @ ₹100/pc' }).pct).toBe(1)
  })
})

describe('unitPriceFor / lineTotal — the one price story', () => {
  it('list price below the threshold', () => {
    expect(unitPriceFor(slide, 9)).toBe(385)
    expect(lineTotal(slide, 9)).toBe(3465)
  })
  it('tier price exactly at the threshold', () => {
    expect(unitPriceFor(slide, 10)).toBe(350)
    expect(lineTotal(slide, 10)).toBe(3500)
  })
  it('tier price above the threshold', () => {
    expect(lineTotal(slide, 20)).toBe(7000)
  })
  it('crossing the threshold can lower the line total (and that is correct)', () => {
    expect(lineTotal(slide, 10)).toBeLessThanOrEqual(lineTotal(slide, 9) + slide.price)
  })
  it('untiered SKUs always use list price', () => {
    expect(lineTotal(lock, 50)).toBe(3900)
  })
})

describe('couponOff', () => {
  it('percent coupons round to the rupee', () => {
    expect(couponOff({ kind: 'pct', value: 10 }, 4995)).toBe(500)
  })
  it('amount coupons never exceed the cart', () => {
    expect(couponOff({ kind: 'amt', value: 150 }, 90)).toBe(90)
  })
  it('free-delivery coupons take nothing off items', () => {
    expect(couponOff({ kind: 'freedel' }, 5000)).toBe(0)
  })
  it('no coupon, no discount', () => {
    expect(couponOff(null, 5000)).toBe(0)
  })
})

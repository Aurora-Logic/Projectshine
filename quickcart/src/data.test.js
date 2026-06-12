import { describe, expect, it } from 'vitest'
import { bulkTier } from './money.js'
import {
  CREDIT, DOOR_CLOSERS, FEED_POOL, INSPO, KITS, PAST_ORDERS, PROS, REORDER,
} from './data.js'

const ids = new Set(FEED_POOL.map(p => p.id))

describe('catalog integrity', () => {
  it('product ids are unique', () => {
    expect(ids.size).toBe(FEED_POOL.length)
  })
  it('every bulk string parses', () => {
    FEED_POOL.filter(p => p.bulk).forEach(p => {
      expect(bulkTier(p), `${p.id} bulk "${p.bulk}"`).not.toBeNull()
    })
  })
  it('tier prices undercut list prices', () => {
    FEED_POOL.filter(p => p.bulk).forEach(p => {
      expect(bulkTier(p).bp, p.id).toBeLessThan(p.price)
    })
  })
  it('discounted SKUs stay below MRP', () => {
    FEED_POOL.filter(p => p.mrp).forEach(p => {
      expect(p.price, p.id).toBeLessThanOrEqual(p.mrp)
    })
  })
})

describe('cross-references resolve', () => {
  it('kit recipes only reference real SKUs', () => {
    KITS.flatMap(k => k.items).forEach(([id]) => {
      expect(ids.has(id), `kit item ${id}`).toBe(true)
    })
  })
  it('kit count keys cover every per-unit line', () => {
    KITS.forEach(k => {
      const keys = new Set(k.counts.map(([key]) => key))
      k.items.forEach(([id, per]) => {
        if (per !== 'fixed') expect(keys.has(per), `${k.key}/${id} → ${per}`).toBe(true)
      })
    })
  })
  it('inspiration looks only reference real SKUs', () => {
    INSPO.flatMap(l => l.products).forEach(id => {
      expect(ids.has(id), `look item ${id}`).toBe(true)
    })
  })
  it('reorder + past orders only reference real SKUs', () => {
    REORDER.forEach(m => expect(ids.has(m.id), `reorder ${m.id}`).toBe(true))
    PAST_ORDERS.flatMap(o => o.items).forEach(([id]) => {
      expect(ids.has(id), `past order ${id}`).toBe(true)
    })
  })
})

describe('domain seeds', () => {
  it('door closers carry load + size ratings for the selector', () => {
    expect(DOOR_CLOSERS.length).toBeGreaterThanOrEqual(3)
    DOOR_CLOSERS.forEach(c => {
      expect(c.load).toBeGreaterThan(0)
      expect(c.size).toBeGreaterThan(0)
    })
  })
  it('pro directory entries are dialable', () => {
    [...PROS.carpenter, ...PROS.designer].forEach(pro => {
      expect(pro.phone).toMatch(/^\d{10}$/)
      expect(pro.rating).toBeGreaterThan(3.5)
    })
  })
  it('credit seeds sum within the limit', () => {
    const out = CREDIT.bills.reduce((s, b) => s + b.amt, 0)
    expect(out).toBeLessThanOrEqual(CREDIT.limit)
  })
})

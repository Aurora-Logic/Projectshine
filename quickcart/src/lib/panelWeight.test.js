import { describe, expect, it } from 'vitest'
import { calculateWeights } from './panelWeight.js'

describe('panel weight — Vector 1 (sample inputs match the sheet)', () => {
  it('20 × 1255 × 125 → Ply 2.0 / MDF 2.4 / HDHMR 2.9 / Glass 8.0', () => {
    expect(calculateWeights({ thicknessMm: 20, widthMm: 1255, heightMm: 125 }))
      .toEqual({ Ply: 2.0, MDF: 2.4, HDHMR: 2.9, Glass: 8.0 })
  })
})

describe('panel weight — Vector 2 (glass thickness cap)', () => {
  const r = calculateWeights({ thicknessMm: 21, widthMm: 1255, heightMm: 125 })
  it('glass > 20 mm is "Not Recommended"', () => {
    expect(r.Glass).toBe('Not Recommended')
  })
  it('ply / mdf / hdhmr still return numbers (no cap)', () => {
    expect(typeof r.Ply).toBe('number')
    expect(typeof r.MDF).toBe('number')
    expect(typeof r.HDHMR).toBe('number')
  })
  it('exactly 20 mm is still allowed', () => {
    expect(calculateWeights({ thicknessMm: 20, widthMm: 1255, heightMm: 125 }).Glass).toBe(8.0)
  })
})

describe('panel weight — Vector 3 (ROUNDUP, not naive round)', () => {
  const r = calculateWeights({ thicknessMm: 20, widthMm: 1255, heightMm: 125 })
  it('ceil-based: 2.0 / 2.9 / 8.0 (naive round would give 1.9 / 2.8 / 7.9)', () => {
    expect(r.Ply).toBe(2.0)
    expect(r.HDHMR).toBe(2.9)
    expect(r.Glass).toBe(8.0)
  })
})

describe('panel weight — Vector 4 (input validation)', () => {
  it('rejects non-positive / non-numeric dimensions', () => {
    expect(() => calculateWeights({ thicknessMm: 0, widthMm: 1255, heightMm: 125 })).toThrow()
    expect(() => calculateWeights({ thicknessMm: -5, widthMm: 1255, heightMm: 125 })).toThrow()
    expect(() => calculateWeights({ thicknessMm: 20, widthMm: 'x', heightMm: 125 })).toThrow()
    expect(() => calculateWeights({ thicknessMm: 20, widthMm: 1255 })).toThrow()
  })
})

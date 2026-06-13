import { describe, expect, it } from 'vitest'
import { calculateBoM } from './spsBom.js'

const get = (items, code) => items.find(it => it.code === code)
const qty = (items, code) => (get(items, code)?.qty ?? 0)
const amt = (items, code) => (get(items, code)?.amount ?? 0)

describe('SPS BoM — Vector 1 (Profile, the original sheet sample)', () => {
  const r = calculateBoM({ lspsFixedDoors: 1, lspsMovableDoors: 3, sspsFixedDoors: 2, sspsMovableDoors: 2, heightFt: 9, widthFt: 12, material: 'p' })

  it('LSPS line quantities & amounts', () => {
    expect([qty(r.lsps, 'LSPS-100A-SC'), amt(r.lsps, 'LSPS-100A-SC')]).toEqual([1, 15659])
    expect([qty(r.lsps, 'AK-LSPS-100A-SC'), amt(r.lsps, 'AK-LSPS-100A-SC')]).toEqual([1, 7067])
    expect([qty(r.lsps, 'TST1-3-AB'), amt(r.lsps, 'TST1-3-AB')]).toEqual([4, 19964])
    expect([qty(r.lsps, 'TTCP-3'), amt(r.lsps, 'TTCP-3')]).toEqual([1, 2066])
    expect([qty(r.lsps, 'ADP2-H'), amt(r.lsps, 'ADP2-H')]).toEqual([3, 9900])
    expect([qty(r.lsps, 'ADP2-V'), amt(r.lsps, 'ADP2-V')]).toEqual([8, 19776])
    expect([qty(r.lsps, 'RA-JC-ADP2'), amt(r.lsps, 'RA-JC-ADP2')]).toEqual([4, 1468])
    expect([qty(r.lsps, 'HL1-SPS'), amt(r.lsps, 'HL1-SPS')]).toEqual([1, 2351])
    expect([qty(r.lsps, 'SPS-FDBA1'), amt(r.lsps, 'SPS-FDBA1')]).toEqual([1, 955])
  })
  it('LSPS has no wood/empty rows', () => {
    for (const c of ['LSPS-100W-SC', 'AK-LSPS-100W-SC', 'TST1-2-AB', 'TST1-5-AB', 'BGT-2-AB', 'BGT-3', 'TTCP-2', 'TTCP-5', 'SPS-FDBW1']) {
      expect(get(r.lsps, c)).toBeUndefined()
    }
  })
  it('LSPS total = ₹79,206', () => { expect(r.lspsTotal).toBe(79206) })

  it('SSPS line quantities & amounts', () => {
    expect([qty(r.ssps, 'SSPS-100A-SC'), amt(r.ssps, 'SSPS-100A-SC')]).toEqual([1, 21073])
    expect([qty(r.ssps, 'TST1-3'), amt(r.ssps, 'TST1-3')]).toEqual([2, 9982])
    expect([qty(r.ssps, 'TTCP-3'), amt(r.ssps, 'TTCP-3')]).toEqual([1, 2066])
    expect([qty(r.ssps, 'ADP2-H'), amt(r.ssps, 'ADP2-H')]).toEqual([3, 9900])
    expect([qty(r.ssps, 'ADP2-V'), amt(r.ssps, 'ADP2-V')]).toEqual([8, 19776])
    expect([qty(r.ssps, 'RA-JC-ADP2'), amt(r.ssps, 'RA-JC-ADP2')]).toEqual([4, 1468])
    expect([qty(r.ssps, 'HL1-SPS'), amt(r.ssps, 'HL1-SPS')]).toEqual([1, 2351])
    expect([qty(r.ssps, 'SPS-FDBA1'), amt(r.ssps, 'SPS-FDBA1')]).toEqual([2, 1910])
  })
  it('SSPS total = ₹68,526', () => { expect(r.sspsTotal).toBe(68526) })
})

describe('SPS BoM — Vector 2 (Wood, LSPS branch)', () => {
  const r = calculateBoM({ lspsFixedDoors: 1, lspsMovableDoors: 3, heightFt: 9, widthFt: 12, material: 'W' })
  it('wood line items', () => {
    expect([qty(r.lsps, 'LSPS-100W-SC'), amt(r.lsps, 'LSPS-100W-SC')]).toEqual([1, 14261])
    expect([qty(r.lsps, 'AK-LSPS-100W-SC'), amt(r.lsps, 'AK-LSPS-100W-SC')]).toEqual([1, 6095])
    expect([qty(r.lsps, 'TST1-3-AB'), amt(r.lsps, 'TST1-3-AB')]).toEqual([4, 19964])
    expect([qty(r.lsps, 'BGT-3'), amt(r.lsps, 'BGT-3')]).toEqual([1, 1177])
    expect([qty(r.lsps, 'TTCP-3'), amt(r.lsps, 'TTCP-3')]).toEqual([1, 2066])
    expect([qty(r.lsps, 'SPS-FDBW1'), amt(r.lsps, 'SPS-FDBW1')]).toEqual([1, 955])
  })
  it('wood gets no profile rows', () => {
    for (const c of ['ADP2-H', 'ADP2-V', 'RA-JC-ADP2', 'HL1-SPS', 'BGT-2-AB', 'SPS-FDBA1']) {
      expect(get(r.lsps, c)).toBeUndefined()
    }
  })
  it('LSPS total = ₹44,518', () => { expect(r.lspsTotal).toBe(44518) })
})

describe('SPS BoM — Vector 3 (material case-insensitivity + validation)', () => {
  const base = { lspsFixedDoors: 1, lspsMovableDoors: 3, sspsFixedDoors: 2, sspsMovableDoors: 2, heightFt: 9, widthFt: 12 }
  it('p / P / "  P  " all match Vector 1', () => {
    const a = calculateBoM({ ...base, material: 'p' })
    const b = calculateBoM({ ...base, material: 'P' })
    const c = calculateBoM({ ...base, material: '  P  ' })
    expect(a.lspsTotal).toBe(79206)
    expect(b.lspsTotal).toBe(79206)
    expect(c.lspsTotal).toBe(79206)
    expect(a.sspsTotal).toBe(68526)
    expect(b.sspsTotal).toBe(68526)
    expect(c.sspsTotal).toBe(68526)
  })
  it('invalid / empty material throws', () => {
    expect(() => calculateBoM({ ...base, material: 'x' })).toThrow()
    expect(() => calculateBoM({ ...base, material: '' })).toThrow()
    expect(() => calculateBoM({ ...base })).toThrow()
  })
})

describe('SPS BoM — Vector 4 (width 16 ft, G2 decision = extend top bucket)', () => {
  const r = calculateBoM({ lspsFixedDoors: 1, lspsMovableDoors: 3, sspsFixedDoors: 2, sspsMovableDoors: 2, heightFt: 9, widthFt: 16, material: 'P' })
  it('does not throw and selects the 5000 mm parts', () => {
    expect(qty(r.lsps, 'TST1-5-AB')).toBe(4)   // M+1 = 4
    expect(qty(r.lsps, 'TTCP-5')).toBe(1)
    expect(qty(r.ssps, 'TST1-5')).toBe(2)
    expect(qty(r.ssps, 'TTCP-5')).toBe(1)
  })
  it('no 2440/3660 tracks at 16 ft', () => {
    expect(get(r.lsps, 'TST1-2-AB')).toBeUndefined()
    expect(get(r.lsps, 'TST1-3-AB')).toBeUndefined()
  })
})

describe('SPS BoM — divide-by-zero guard (door wider than stock length)', () => {
  const r = calculateBoM({ lspsFixedDoors: 0, lspsMovableDoors: 1, sspsFixedDoors: 2, sspsMovableDoors: 2, heightFt: 9, widthFt: 16, material: 'P' })
  it('clamps horizontal-profile qty and warns', () => {
    // doorWidth = 16/1 = 16 ft > 10 ft stock -> piecesPerStock clamped to 1
    expect(qty(r.lsps, 'ADP2-H')).toBe(2)  // ((0+1)*2)/1 = 2
    expect(r.warnings.some(w => /wider than the profile stock length/.test(w))).toBe(true)
  })
})

describe('SPS BoM — warnings (G4 / G5 / G6)', () => {
  it('warns on non-2+2 SSPS config (G4)', () => {
    const r = calculateBoM({ lspsFixedDoors: 1, lspsMovableDoors: 2, sspsFixedDoors: 3, sspsMovableDoors: 1, widthFt: 8, material: 'P' })
    expect(r.warnings.some(w => /2-fixed \+ 2-movable/.test(w))).toBe(true)
  })
  it('warns on unmodeled LSPS movable count (G5)', () => {
    const r = calculateBoM({ lspsFixedDoors: 1, lspsMovableDoors: 4, sspsFixedDoors: 2, sspsMovableDoors: 2, widthFt: 8, material: 'P' })
    expect(r.warnings.some(w => /only 2 \(base\) or 3/.test(w))).toBe(true)
  })
  it('warns that wood has no handle (G6)', () => {
    const r = calculateBoM({ lspsFixedDoors: 1, lspsMovableDoors: 3, widthFt: 12, material: 'W' })
    expect(r.warnings.some(w => /profile-only/.test(w))).toBe(true)
  })
})

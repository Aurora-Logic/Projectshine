/**
 * Panel weight calculator — approximate weight (kg) of a rectangular panel in
 * Ply / MDF / HDHMR / Glass, from thickness × width × height (all in mm).
 *
 *   weight_kg = COEFF[material] × t × w × h / 10_000_000     (COEFF = density kg/m³ ÷ 100)
 *
 * Transcribed from the source Excel with its two traps handled:
 *  - Rounding is Excel ROUNDUP(x, 1) = round AWAY FROM ZERO to 1 decimal (ceil-based,
 *    NOT round/toFixed/floor). Applied only at the final output step, on full-precision raw.
 *  - Glass has a strict thickness cap: thicknessMm > 20 → "Not Recommended" (20 is allowed).
 *    Ply / MDF / HDHMR have no cap.
 *
 * Notes (flagged, not silently changed):
 *  N1  COEFF are densities (618 / 752.31 / 897 / 2520 kg/m³) — named so suppliers can tune them.
 *  N2  Only Glass is capped at 20 mm (by design in the source sheet).
 *  N3  No upper bound on width/height — add max-dimension validation in the UI if needed.
 *  N4  Always rounds UP, so reported weights are slightly conservative (never under true). Intentional.
 */

// density (kg/m³) ÷ 100
export const PANEL_COEFF = { Ply: 6.18, MDF: 7.5231, HDHMR: 8.97, Glass: 25.2 }
export const GLASS_MAX_THICKNESS_MM = 20
export const PANEL_MATERIALS = ['Ply', 'MDF', 'HDHMR', 'Glass']

// Excel ROUNDUP(x, 1) — ceil away from zero to 1 dp. Inputs here are non-negative.
export const roundUp1 = (x) => Math.ceil(x * 10) / 10

export function calculateWeights(input) {
  const t = Number(input.thicknessMm)
  const w = Number(input.widthMm)
  const h = Number(input.heightMm)
  if (!(t > 0) || !(w > 0) || !(h > 0)) {
    throw new Error('thicknessMm, widthMm and heightMm must all be positive numbers.')
  }
  const raw = (coeff) => (coeff * t * w * h) / 10_000_000
  return {
    Ply: roundUp1(raw(PANEL_COEFF.Ply)),
    MDF: roundUp1(raw(PANEL_COEFF.MDF)),
    HDHMR: roundUp1(raw(PANEL_COEFF.HDHMR)),
    Glass: t > GLASS_MAX_THICKNESS_MM ? 'Not Recommended' : roundUp1(raw(PANEL_COEFF.Glass)),
  }
}

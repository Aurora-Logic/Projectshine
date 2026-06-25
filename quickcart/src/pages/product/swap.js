// One-shot flag: a product was switched while the PDP was already open, so the
// next ProductPage mount plays the "swap" transition instead of a fresh slide-in.
// Lives in its own module so the page file only exports its component (fast-refresh).
export const PDP_SWAPF = { current: false }

/* Functional UI audit — drives the installed Chrome over the dev/preview server
   and walks every dealer-facing flow. Run: npm run audit:e2e [BASE_URL]
   Exit code = number of failed flows. */
import { chromium } from 'playwright-core'

const BASE = process.argv[2] || 'http://localhost:5174'
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const results = []
const consoleErrors = []

const browser = await chromium.launch({ executablePath: CHROME, headless: true })

async function fresh(hash = '#home') {
  const ctx = await browser.newContext({ viewport: { width: 430, height: 932 } })
  await ctx.addInitScript(() => {
    const day = new Date().toDateString()
    localStorage.setItem('qc-auth', '1')
    localStorage.setItem('qc-quiz-day', day)   // keep the quiz from auto-popping mid-flow
    localStorage.setItem('qc-spin-day', day)
  })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => consoleErrors.push(`${hash}: ${e.message}`))
  await page.goto(`${BASE}/${hash}`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
  return { ctx, page }
}

async function step(name, fn, opts = {}) {
  const { ctx, page } = await fresh(opts.hash || '#home')
  try {
    await fn(page)
    results.push({ name, ok: true })
    console.log(`  ✓ ${name}`)
  } catch (e) {
    results.push({ name, ok: false, note: String(e.message || e).slice(0, 140) })
    console.log(`  ✗ ${name} — ${String(e.message || e).slice(0, 140)}`)
  } finally {
    await ctx.close()
  }
}

const rupees = (s) => Number((s.match(/₹([\d,]+)/) || [])[1]?.replace(/,/g, '') ?? NaN)

/* ---------------- flows ---------------- */

await step('home renders: navbar, hero, bestsellers, kit banner, inspo strip', async (page) => {
  for (const sel of ['.navbar', '.fest-hero, .topbar', '.kit-banner']) {
    if (!(await page.locator(sel).first().isVisible())) throw new Error(`${sel} not visible`)
  }
  if (!(await page.getByText('Shop the look').first().isVisible())) throw new Error('inspo strip missing')
})

await step('add to cart: card ADD → qty sheet → confirm → cart bar counts', async (page) => {
  await page.locator('.pcard .padd').first().click()
  await page.waitForSelector('.qsheet', { timeout: 4000 })
  const cta = page.locator('.qs-cta')
  const n = Number((await cta.innerText()).match(/Add (\d+)/)?.[1])
  if (!n) throw new Error('qty CTA has no count')
  await cta.click()
  await page.waitForSelector('.cartbar.show', { timeout: 4000 })
  const bar = await page.locator('.cartbar.show').innerText()
  if (!bar.match(new RegExp(`${n}\\s*item`))) throw new Error(`cart bar "${bar.slice(0, 40)}" ≠ ${n} items`)
})

await step('qty sheet: typeable input updates CTA and bulk meter', async (page) => {
  await page.locator('.pcard .padd').first().click()
  await page.waitForSelector('.qs-qin', { timeout: 4000 })
  await page.locator('.qs-qin').fill('17')
  const cta = await page.locator('.qs-cta').innerText()
  if (!cta.includes('Add 17')) throw new Error(`CTA "${cta.slice(0, 30)}" ignored typed qty`)
})

await step('bill math: item total − scheme − coupon + fee = to pay', async (page) => {
  await page.locator('.pcard .padd').first().click()
  await page.waitForSelector('.qs-cta', { timeout: 4000 })
  await page.locator('.qs-cta').click()
  await page.waitForSelector('.cartbar.show', { timeout: 4000 })
  await page.locator('.cartbar.show').click()
  await page.waitForSelector('.cartpage', { timeout: 4000 })
  const card = page.locator('.cp-card', { hasText: 'BILL DETAILS' })
  const lines = (await card.innerText()).split('\n').map(l => l.trim()).filter(Boolean)
  const after = (m) => {
    const i = lines.findIndex(l => m.test(l))
    if (i === -1) return 0
    return rupees(lines[i]) || rupees(lines[i + 1] || '') || 0
  }
  const item = after(/^Item total/)
  const toPay = after(/^To pay/)
  const scheme = after(/Volume scheme/)
  const coupon = after(/^Coupon/)
  const delivery = lines.some(l => l === 'FREE') ? 0 : after(/^Delivery/)
  if (Number.isNaN(item) || Number.isNaN(toPay)) throw new Error('could not parse bill lines')
  const expect = item - scheme - coupon + delivery
  if (expect !== toPay) throw new Error(`bill drifts: ${item}−${scheme}−${coupon}+${delivery}=${expect} but To pay=${toPay}`)
})

await step('place order: PO dialog, credit due line, ledger gets the PO', async (page) => {
  await page.locator('.pcard .padd').first().click()
  await page.waitForSelector('.qs-cta', { timeout: 4000 })
  await page.locator('.qs-cta').click()
  await page.waitForSelector('.cartbar.show', { timeout: 4000 })
  await page.locator('.cartbar.show').click()
  await page.waitForSelector('.cartpage', { timeout: 4000 })
  await page.getByRole('button', { name: /Place order/ }).click()
  await page.waitForSelector('text=/PO QC-\\d+/', { timeout: 5000 })
  if (!(await page.getByText(/30-day credit · due/).first().isVisible())) throw new Error('no credit echo on dialog')
  await page.getByRole('button', { name: 'Done' }).click()
  await page.waitForTimeout(500)
  const bills = await page.evaluate(() => JSON.parse(localStorage.getItem('qc-bills') || '[]'))
  if (!bills.length) throw new Error('PO not appended to qc-bills ledger')
})

await step('POD: delivered order detail shows verified proof card', async (page) => {
  await page.locator('.oh-card .pri').first().click()
  await page.waitForSelector('.ordpage', { timeout: 4000 })
  if (!(await page.getByText('PROOF OF DELIVERY').isVisible())) throw new Error('POD card missing')
  if (!(await page.getByText('OTP VERIFIED').isVisible())) throw new Error('OTP chip missing')
  if ((await page.locator('.pod-shots img').count()) < 2) throw new Error('POD photos missing')
}, { hash: '#orders' }).catch(() => {})

await step('claims: order pick → item pick → submit → tracked row', async (page) => {
  await page.getByRole('button', { name: /Raise a claim/ }).click()
  await page.locator('.claim-ord').first().click()
  await page.locator('.claim-check').first().click()
  await page.getByRole('button', { name: 'Submit claim' }).click()
  await page.waitForTimeout(400)
  if (!(await page.locator('.vr-row').first().isVisible())) throw new Error('claim row not listed')
  if (!(await page.getByText('Raised').first().isVisible())) throw new Error('stage label missing')
}, { hash: '#claims' })

await step('brand support: type-dependent form validates and tracks', async (page) => {
  await page.getByRole('button', { name: /Request brand support/ }).click()
  await page.locator('.claim-types .seg-b', { hasText: 'Branding kit' }).click()
  const submit = page.getByRole('button', { name: 'Submit request' })
  if (await submit.isEnabled()) throw new Error('submit enabled with empty qty')
  await page.locator('input[type="number"]').fill('2')
  await submit.click()
  await page.waitForTimeout(400)
  if (!(await page.locator('.vr-row').first().isVisible())) throw new Error('request row not listed')
}, { hash: '#brand' })

await step('kit builder: counts scale the list; add-all lands in cart', async (page) => {
  const before = await page.locator('.kitpage .claim-item').count()
  if (before < 5) throw new Error('kit list too short')
  const pcsBefore = Number((await page.locator('.kit-bar').innerText()).match(/(\d+) pieces/)?.[1])
  await page.locator('.kitpage .qs-sbtn').nth(1).click() // more drawers
  await page.waitForTimeout(250)
  const pcsAfter = Number((await page.locator('.kit-bar').innerText()).match(/(\d+) pieces/)?.[1])
  if (!(pcsAfter > pcsBefore)) throw new Error(`stepper did not scale: ${pcsBefore} → ${pcsAfter}`)
  await page.locator('.kit-bar .qs-cta').click()
  await page.waitForTimeout(400)
  if (!(await page.getByText('Kit added').isVisible())) throw new Error('no added state')
}, { hash: '#kit' })

await step('find a pro: tabs, dialable actions, referral validation', async (page) => {
  if ((await page.locator('.pro-card').count()) < 4) throw new Error('carpenter cards missing')
  const tel = await page.locator('.pro-call').first().getAttribute('href')
  if (!/^tel:\+91\d{10}$/.test(tel)) throw new Error(`bad tel href ${tel}`)
  await page.locator('.seg-b', { hasText: 'Architects' }).click()
  await page.waitForTimeout(300)
  if ((await page.locator('.pro-card').count()) < 3) throw new Error('designer cards missing')
  const send = page.getByRole('button', { name: 'Send referral' })
  if (await send.isEnabled()) throw new Error('referral enabled while empty')
  await page.locator('input[placeholder="Their name / firm"]').fill('Test Carpenter')
  await page.locator('input[placeholder="Their phone"]').fill('9876543210')
  if (!(await send.isEnabled())) throw new Error('referral stuck disabled when valid')
}, { hash: '#pros' })

await step('inspiration: grid → look detail → shop rows → add full look', async (page) => {
  if ((await page.locator('.insp-card').count()) < 6) throw new Error('grid sparse')
  await page.locator('.insp-card').first().click()
  await page.waitForSelector('.insp-detail', { timeout: 4000 })
  if ((await page.locator('.insp-detail .cs-row').count()) < 3) throw new Error('shop rows missing')
  await page.getByRole('button', { name: /Add full look/ }).click()
  await page.waitForTimeout(400)
  if (!(await page.getByText('Added — keep browsing').isVisible())) throw new Error('add-all no feedback')
}, { hash: '#inspo' }).catch(() => {})

await step('hinge filters: door-thickness chip narrows PLP', async (page) => {
  await page.waitForSelector('.plp-main .pcard', { timeout: 5000 })
  const before = await page.locator('.plp-main .pcard').count()
  await page.getByText(/Filters/).first().click()
  await page.waitForSelector('.fsheet', { timeout: 4000 })
  await page.locator('.fsheet').getByText('Door thk').click()
  await page.locator('.fs-tile', { hasText: '18 mm door' }).click()
  await page.locator('.fsheet').getByText(/Show \d+ result/).click()
  await page.waitForTimeout(400)
  const left = await page.locator('.plp-main .pcard').count()
  if (!(left >= 1 && left < before)) throw new Error(`filter no-op: ${before} → ${left}`)
}, { hash: '#plp-Hinges' })

await step('door-closer selector recommends a rated SKU', async (page) => {
  await page.getByText('Calculators', { exact: false }).first().click()
  await page.waitForTimeout(400)
  await page.locator('.seg-b', { hasText: 'Door closer' }).click()
  await page.waitForTimeout(300)
  const body = await page.locator('body').innerText()
  if (!/Door Closer DC-\d+/.test(body)) throw new Error('no closer recommendation visible')
}, { hash: '#account' }).catch(() => {})

await step('search: tokenized query finds the right SKUs', async (page) => {
  await page.locator('.sheet input').first().fill('soft close hinge')
  await page.waitForTimeout(600)
  const names = await page.locator('.sheet .pcard').allInnerTexts()
  if (!names.length) throw new Error('no results')
  if (!names.some(n => /Soft-Close Hinge/i.test(n))) throw new Error('top results miss soft-close hinges')
}, { hash: '#search' }).catch(() => {})

await step('back gesture: qty closes, pdp survives, then pdp closes', async (page) => {
  await page.locator('.pcard').first().click()
  await page.waitForSelector('.pdp', { timeout: 4000 })
  await page.locator('.pdp .padd, .pdp .pdp-cta button').first().click()
  await page.waitForSelector('.qsheet', { timeout: 4000 })
  await page.goBack()
  await page.waitForTimeout(450)
  if (await page.locator('.qsheet').count()) throw new Error('qty sheet survived back')
  if (!(await page.locator('.pdp').count())) throw new Error('pdp died with qty back')
  await page.goBack()
  await page.waitForTimeout(450)
  if (await page.locator('.pdp').count()) throw new Error('pdp survived second back')
})

await step('keyboard: Enter opens a focused card, Escape closes it', async (page) => {
  await page.locator('.pcard').first().focus()
  await page.keyboard.press('Enter')
  await page.waitForSelector('.pdp', { timeout: 4000 })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(450)
  if (await page.locator('.pdp').count()) throw new Error('Escape did not close pdp')
})

/* ---------------- report ---------------- */
const fails = results.filter(r => !r.ok)
console.log(`\n${results.length - fails.length}/${results.length} flows pass`)
if (consoleErrors.length) {
  console.log(`page errors (${consoleErrors.length}):`)
  consoleErrors.slice(0, 10).forEach(e => console.log('  •', e))
} else {
  console.log('zero page errors across all routes')
}
await browser.close()
process.exit(fails.length)

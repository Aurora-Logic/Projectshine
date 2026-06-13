/* QuickCart driver — launch + drive + screenshot the app headlessly.
 *
 * QuickCart is a single-page React/Vite PWA. It has no backend: state is
 * mock/seeded and persists to localStorage (qc-* keys). Every #hash route
 * bypasses the login gate, so deep-linking straight to a screen is the way
 * to drive it (see the hash table in quickcart/README.md).
 *
 * This driver owns its OWN dev server on a strict port (default 5199) so it
 * never collides with — or kills — a dev server the user already has running
 * on 5173/5174. Pass --base <url> to drive an already-running server instead.
 *
 * Usage (run from the quickcart/ dir):
 *   node .claude/skills/run-quickcart/driver.mjs shot '#home'
 *   node .claude/skills/run-quickcart/driver.mjs shot '#cart' cart.png
 *   node .claude/skills/run-quickcart/driver.mjs shots '#home' '#plp' '#pdp' '#credit'
 *   node .claude/skills/run-quickcart/driver.mjs smoke         # functional walk (npm run audit:e2e)
 *   node .claude/skills/run-quickcart/driver.mjs shot '#home' --base http://localhost:5174
 *
 * Screenshots land in .claude/skills/run-quickcart/shots/ (also printed).
 * Exit code is non-zero on failure / page errors.
 */
import { chromium } from 'playwright-core'
import { spawn, execSync } from 'node:child_process'
import { mkdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, isAbsolute, join } from 'node:path'
import http from 'node:http'

const HERE = dirname(fileURLToPath(import.meta.url))
const SHOTS = join(HERE, 'shots')
const PROJECT = resolve(HERE, '..', '..', '..')        // quickcart/
const PORT = 5199
const VIEWPORT = { width: 430, height: 932 }           // mobile-first PWA; min 500 to avoid headless clamp (see notes)

// macOS Chrome path; override with CHROME=/path env var (e.g. on Linux: chromium).
const CHROME = process.env.CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

const argv = process.argv.slice(2)
const baseIdx = argv.indexOf('--base')
const baseOverride = baseIdx !== -1 ? argv[baseIdx + 1] : null
const args = baseIdx === -1
  ? argv
  : argv.filter((_, i) => i !== baseIdx && i !== baseIdx + 1)
const cmd = args[0]

function ping(url) {
  return new Promise((res) => {
    const r = http.get(url, (resp) => { resp.resume(); res(resp.statusCode < 500) })
    r.on('error', () => res(false))
    r.setTimeout(1000, () => { r.destroy(); res(false) })
  })
}
async function waitForServer(url, ms = 30000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    if (await ping(url)) return true
    await new Promise((r) => setTimeout(r, 500))
  }
  return false
}

async function withServer(fn) {
  if (baseOverride) return fn(baseOverride)              // drive an existing server, don't spawn
  const base = `http://localhost:${PORT}`
  console.log(`▸ starting vite dev on ${base} (strictPort) …`)
  const srv = spawn('npm', ['run', 'dev', '--', '--port', String(PORT), '--strictPort'],
    { cwd: PROJECT, stdio: ['ignore', 'pipe', 'pipe'] })
  let log = ''
  srv.stdout.on('data', (d) => { log += d })
  srv.stderr.on('data', (d) => { log += d })
  try {
    if (!(await waitForServer(base))) {
      throw new Error(`dev server never came up on ${base}\n--- vite log ---\n${log.slice(-800)}`)
    }
    return await fn(base)
  } finally {
    try { process.kill(-srv.pid) } catch {}
    try { srv.kill('SIGTERM') } catch {}
  }
}

async function freshPage(browser, base, hash) {
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 2 })
  await ctx.addInitScript(() => {
    const day = new Date().toDateString()
    localStorage.setItem('qc-auth', '1')        // pre-auth (any hash bypasses the gate anyway)
    localStorage.setItem('qc-quiz-day', day)     // suppress the daily quiz pop-up mid-flow
    localStorage.setItem('qc-spin-day', day)     // suppress the spin pop-up
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  const url = `${base}/${hash.startsWith('#') ? hash : '#' + hash}`
  await page.goto(url, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(900)                 // let the route mount + first-paint settle
  return { ctx, page, errors }
}

async function shot(browser, base, hash, outName) {
  mkdirSync(SHOTS, { recursive: true })
  const safe = hash.replace(/[^\w-]/g, '') || 'home'
  const out = outName
    ? (isAbsolute(outName) ? outName : join(SHOTS, outName))
    : join(SHOTS, `${safe}.png`)
  const { ctx, page, errors } = await freshPage(browser, base, hash)
  await page.screenshot({ path: out, fullPage: false })
  await ctx.close()
  console.log(`  ✓ ${hash.padEnd(14)} → ${out}${errors.length ? `  ⚠ ${errors.length} page error(s)` : ''}`)
  errors.forEach((e) => console.log(`      ⚠ ${e.slice(0, 120)}`))
  return errors.length === 0
}

async function main() {
  if (!existsSync(CHROME)) {
    console.error(`Chrome not found at:\n  ${CHROME}\nSet CHROME=/path/to/chrome (e.g. a chromium binary).`)
    process.exit(2)
  }

  if (cmd === 'smoke') {
    // Delegate to the project's own functional audit against our managed server.
    // Exit code from the audit = number of failed flows; surface it, don't stack-trace.
    const code = await withServer((base) => {
      try {
        execSync(`npm run audit:e2e -- ${base}`, { cwd: PROJECT, stdio: 'inherit' })
        return 0
      } catch (e) {
        return e.status || 1
      }
    })
    process.exit(code)
  }

  if (cmd !== 'shot' && cmd !== 'shots') {
    console.log(`usage:
  node driver.mjs shot  '#hash' [out.png]   screenshot one route
  node driver.mjs shots '#a' '#b' ...        screenshot several routes
  node driver.mjs smoke                       run the functional audit
  (append --base http://localhost:5174 to drive an already-running server)`)
    process.exit(1)
  }

  const hashes = cmd === 'shot' ? [args[1] || '#home'] : args.slice(1)
  const outName = cmd === 'shot' ? args[2] : null
  if (!hashes.length) { console.error('no hash given'); process.exit(1) }

  const ok = await withServer(async (base) => {
    const browser = await chromium.launch({ executablePath: CHROME, headless: true })
    let allOk = true
    try {
      for (const h of hashes) {
        const r = await shot(browser, base, h, cmd === 'shot' ? outName : null)
        allOk = allOk && r
      }
    } finally {
      await browser.close()
    }
    return allOk
  })
  process.exit(ok ? 0 : 1)
}

main().catch((e) => { console.error(e.message || e); process.exit(1) })

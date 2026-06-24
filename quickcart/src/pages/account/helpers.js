import { CREDIT, ADDRESSES, FEED_POOL } from '../../data.js'
import { safeGet, safeSet, getJSON } from '../../lib/storage.js'
import { generateEstimate, EST_BRAND_DEFAULT } from '../../lib/estimate.js'
import { unitPriceFor } from '../../money.js'

export const LIST_SEED = [
  { id: 'l1', name: 'Sharma kitchen site', items: [{ id: 'ba1', n: 20 }, { id: 'ba2', n: 30 }, { id: 'dl1', n: 12 }] },
]

export function loadLists() {
  try {
    const s = JSON.parse(safeGet('qc-lists') || 'null')
    if (Array.isArray(s)) return s
  } catch { /**/ }
  return LIST_SEED
}

export const saveLists = (l) => safeSet('qc-lists', JSON.stringify(l))

export function loadAddrs() {
  try {
    const s = JSON.parse(safeGet('qc-addr') || 'null')
    if (Array.isArray(s) && s.length) return s
  } catch { /**/ }
  return ADDRESSES
}

export function creditState() {
  let paid = []
  let extra = []
  try { paid = JSON.parse(safeGet('qc-paid') || '[]') } catch { /**/ }
  try { extra = JSON.parse(safeGet('qc-bills') || '[]') } catch { /**/ }
  const all = [
    ...CREDIT.bills,
    ...extra.map(b => ({ ...b, days: Math.ceil((b.due - Date.now()) / 864e5) })),
  ]
  const open = all.filter(b => !paid.includes(b.id))
  const outstanding = open.reduce((s, b) => s + b.amt, 0)
  return { limit: CREDIT.limit, open, paidIds: paid, all, outstanding }
}

export function downloadInvoice(o) {
  let gst = { gstin: '29ABCDE1234F1Z5', name: 'Bora Hardware & Plywood' }
  try { gst = { ...gst, ...(JSON.parse(safeGet('qc-gst') || 'null') || {}) } } catch { /**/ }
  const bill = o.bill || null
  const total = bill ? bill.toPay
    : o.items.reduce((s, it) => s + (it.unit ?? unitPriceFor(it.p, it.n)) * it.n, 0)
  const taxable = Math.round(total / 1.18)
  const tax = total - taxable
  const rows = o.items.map((it) => {
    const u = it.unit ?? unitPriceFor(it.p, it.n)
    return `<tr><td>${it.p.name}</td><td class="r">${it.n}</td><td class="r">₹${u.toLocaleString('en-IN')}</td><td class="r">₹${(u * it.n).toLocaleString('en-IN')}</td></tr>`
  }).join('')
    + (bill && bill.schemeOff > 0 ? `<tr><td colspan="3" class="r mut">Volume scheme discount</td><td class="r">−₹${bill.schemeOff.toLocaleString('en-IN')}</td></tr>` : '')
    + (bill && bill.coupon ? `<tr><td colspan="3" class="r mut">Coupon · ${bill.coupon.label}</td><td class="r">−₹${bill.coupon.off.toLocaleString('en-IN')}</td></tr>` : '')
    + (bill && (bill.deliveryFee > 0 || bill.expressFee > 0) ? `<tr><td colspan="3" class="r mut">Delivery${bill.expressFee ? ' + express' : ''}</td><td class="r">₹${(bill.deliveryFee + bill.expressFee).toLocaleString('en-IN')}</td></tr>` : '')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${o.id}</title><style>body{font-family:-apple-system,Segoe UI,sans-serif;margin:32px;color:#1a1a1a}h1{font-size:20px;margin:0;color:#0E4A2F}.mut{color:#777;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px}th,td{padding:8px 10px;border-bottom:1px solid #e5e5e5;text-align:left}.r{text-align:right}th{background:#F1F8F4;font-size:11px;letter-spacing:.4px;text-transform:uppercase}.tot td{font-weight:700;border-top:2px solid #0E4A2F;border-bottom:none}.top{display:flex;justify-content:space-between;align-items:flex-start}</style></head><body><div class="top"><div><h1>QuickCart</h1><div class="mut">Furniture hardware for dealers<br/>GSTIN 29QCKRT5678K1Z9 · Bengaluru</div></div><div class="mut" style="text-align:right">TAX INVOICE<br/><b style="color:#1a1a1a">PO ${o.id}</b><br/>${o.date}</div></div><p class="mut" style="margin-top:16px">Billed to<br/><b style="color:#1a1a1a">${gst.name}</b><br/>GSTIN ${gst.gstin.toUpperCase()}</p><table><tr><th>Item</th><th class="r">Qty</th><th class="r">Rate</th><th class="r">Amount</th></tr>${rows}<tr><td colspan="3" class="r mut">Taxable value</td><td class="r">₹${taxable.toLocaleString('en-IN')}</td></tr><tr><td colspan="3" class="r mut">CGST 9% + SGST 9%</td><td class="r">₹${tax.toLocaleString('en-IN')}</td></tr><tr class="tot"><td colspan="3" class="r">Grand total</td><td class="r">₹${total.toLocaleString('en-IN')}</td></tr></table><p class="mut">${o.payMode ? `Settled to ${o.payMode}${o.dueTs ? ` · due ${new Date(o.dueTs).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}. ` : ''}Input credit available on this invoice. Computer-generated — no signature required.</p></body></html>`
  const blob = new Blob([html], { type: 'text/html' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `Invoice-${o.id}.html`
  a.click()
  URL.revokeObjectURL(a.href)
}

export function downloadLedger() {
  let paid = []
  try { paid = JSON.parse(safeGet('qc-paid') || '[]') } catch { /**/ }
  let bal = 0
  const rows = CREDIT.bills.map(b => {
    const isPaid = paid.includes(b.id)
    if (!isPaid) bal += b.amt
    return `<tr><td>PO ${b.id}</td><td>Credit invoice</td><td class="r">₹${b.amt.toLocaleString('en-IN')}</td><td class="r">${isPaid ? 'Paid' : b.days < 0 ? `Overdue ${-b.days}d` : `Due in ${b.days}d`}</td><td class="r">₹${bal.toLocaleString('en-IN')}</td></tr>`
  }).join('')
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Ledger FY 2026-27</title><style>body{font-family:-apple-system,Segoe UI,sans-serif;margin:32px;color:#1a1a1a}h1{font-size:20px;margin:0;color:#0E4A2F}.mut{color:#777;font-size:12px}table{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px}th,td{padding:8px 10px;border-bottom:1px solid #e5e5e5;text-align:left}.r{text-align:right}th{background:#F1F8F4;font-size:11px;letter-spacing:.4px;text-transform:uppercase}</style></head><body><h1>QuickCart — Dealer Ledger</h1><div class="mut">Bora Hardware &amp; Plywood · FY 2026–27 · credit limit ₹5,00,000</div><table><tr><th>Ref</th><th>Type</th><th class="r">Amount</th><th class="r">Status</th><th class="r">Balance</th></tr>${rows}</table><p class="mut">Computer-generated statement — share with your CA directly.</p></body></html>`
  const blob = new Blob([html], { type: 'text/html' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'Ledger-FY-2026-27.html'
  a.click()
  URL.revokeObjectURL(a.href)
}

export const loadBoms = () => getJSON('qc-boms', [])

export const fullBrand = (b) => ({ ...EST_BRAND_DEFAULT, ...b, dealer: { ...EST_BRAND_DEFAULT.dealer, ...(b && b.dealer) } })

export const bomItems = (rec) => rec.items.map(it => ({ p: { id: it.id, name: it.name, qty: it.qty, price: it.price, ph: it.ph }, n: it.n, disc: it.disc || 0 }))

export const regenBom = (rec, out) => generateEstimate({
  cust: rec.cust, items: bomItems(rec), bill: rec.bill,
  brand: { ...fullBrand(getJSON('qc-est-brand', EST_BRAND_DEFAULT)), template: rec.template },
  out, meta: { no: rec.no, date: rec.ts },
})

export const viewBom = async (rec) => {
  const { blob } = await regenBom(rec, 'blob')
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

export const shareBom = async (rec) => {
  const { blob, filename } = await regenBom(rec, 'blob')
  const file = new File([blob], filename, { type: 'application/pdf' })
  const text = `BOM ${rec.no} for ${rec.cust.name} — ₹${(rec.total || 0).toLocaleString('en-IN')}`
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename, text }) } catch { /**/ }
  } else {
    regenBom(rec, 'save')
  }
}

export const waBom = (rec) => window.open(`https://wa.me/?text=${encodeURIComponent(`BOM ${rec.no} for ${rec.cust.name} — ₹${(rec.total || 0).toLocaleString('en-IN')}. Sending the BOM PDF next.`)}`, '_blank')
export const mailBom = (rec) => { window.location.href = `mailto:?subject=${encodeURIComponent(`BOM ${rec.no}`)}&body=${encodeURIComponent(`BOM ${rec.no} for ${rec.cust.name} — ₹${(rec.total || 0).toLocaleString('en-IN')}.\n\nThe BOM PDF is attached separately.`)}` }

export const ORDER_STAGES = [['Placed', 0], ['Packed', 45], ['On the way', 150], ['Delivered', 300]]
export const ordPgRef = { current: false }
export const POD_SHOTS = ['1586528116311-ad8dd3c8310d', '1566576721346-d4a3b4eaeb55']

export const BOM_TPL = {
  classic: { c: 'green', label: 'Classic' },
  bold: { c: 'amber', label: 'Bold' },
  studio: { c: 'indigo', label: 'Studio' },
}

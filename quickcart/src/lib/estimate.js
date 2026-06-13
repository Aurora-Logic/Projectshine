import { BRAND_LOGOS } from '../data.js'

/* BOM (estimate) PDF system — extracted from App.jsx (A5.1) */

const EST_SWATCHES = ['#1A1C1F', '#696E74', '#1A2342', '#14633F', '#30A46C', '#1A43AE', '#C9A44A', '#9A3412']
const EST_PAPERS = ['#F8F5ED', '#FFFFFF', '#F2F2F0', '#F1F5EF', '#F8F1ED', '#EFF3F6']

/* ---------------- Customer estimate (PDF export) ---------------- */
/* jspdf + the DejaVu font (₹ glyph) are lazy-loaded on first export only,
   so the main bundle doesn't grow. Bill numbers are passed in from CartPage
   so the PDF can never drift from the on-screen bill. */
const fetchB64 = async (url) => {
  const r = await fetch(url)
  if (!r.ok) throw new Error(`fetch ${url}: ${r.status}`)
  const b = new Uint8Array(await r.arrayBuffer())
  let s = ''
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000))
  return btoa(s)
}
/* original PNG bytes go straight into the PDF (a canvas re-encode would
   balloon palette PNGs into full RGBA); Image is only used to read dims */
const imgData = async (url) => {
  const data = url.startsWith('data:') ? url : 'data:image/png;base64,' + await fetchB64(url)
  return new Promise((resolve, reject) => {
    const im = new Image()
    im.onload = () => resolve({ data, w: im.naturalWidth, h: im.naturalHeight })
    im.onerror = () => reject(new Error(`image ${url}`))
    im.src = data
  })
}

/* dealer-editable PDF branding (Account → Estimate PDF settings) */
const EST_BRAND_DEFAULT = {
  name: 'Interior Innovation',
  logo: null, // dataURL from upload; null = bundled /brand-logo.png
  footer: '#696E74',
  side: '#696E74',
  wordmark: '#1A1C1F',
  paper: '#F8F5ED', // hairlines are derived from this so any paper tone stays coherent
  photos: true,
  validDays: 7,
  template: 'classic', // classic | bold | studio
  accent: '#CDE76D', // colour-block bands in the Bold template
  font: 'pjs', // pjs | inter | opensans | robotomono | helvetica
  logosPos: 'top', // Classic template: brand strip on top or above the footer
  preparedBy: 'Virag Bora',
  note: 'This Bill of Materials is only for reference. **Prices are subject to change.**',
  docTitle: 'Bill of Materials',
  showPrices: true,
  showSavings: true,
  gstPct: 0, // 0 = no GST line; else 5/12/18/28
  signature: false,
  watermark: '', // empty = none; e.g. DRAFT
  dealer: {
    addr1: '304 Maple Heights, HSR Layout',
    addr2: 'Bengaluru 560102',
    phone: '+91 98450 00000',
    email: 'estimates@quickcart.in',
    website: 'quickcart-nine-iota.vercel.app',
    gstin: '29AAACQ1234L1ZQ',
  },
}
const hexToRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '')
  if (!m) return [105, 110, 116]
  const v = parseInt(m[1], 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

/* amount in words, Indian grouping (lakh / crore) */
const NW_ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const NW_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
const nwTwo = (n) => n < 20 ? NW_ONES[n] : NW_TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + NW_ONES[n % 10] : '')
const nwThree = (n) => (n >= 100 ? NW_ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' : '') : '') + (n % 100 ? nwTwo(n % 100) : '')
const inrWords = (n) => {
  if (!n) return 'zero'
  const cr = Math.floor(n / 1e7), l = Math.floor(n / 1e5) % 100, t = Math.floor(n / 1e3) % 100, h = n % 1000
  return [cr && nwTwo(cr) + ' crore', l && nwTwo(l) + ' lakh', t && nwTwo(t) + ' thousand', h && nwThree(h)]
    .filter(Boolean).join(', ')
}

/* minimal rich text: **bold** spans and newlines, word-wrapped; returns last baseline */
const drawRich = (doc, text, x, y, width, opts = {}) => {
  const { size = 8, lh = 4.2, color = [26, 28, 31] } = opts
  doc.setFontSize(size).setTextColor(...color)
  let cx = x, cy = y
  String(text).split('**').forEach((seg, i) => {
    doc.setFont('DOC', i % 2 ? 'bold' : 'normal')
    seg.split(/(\n)/).forEach(chunk => {
      if (chunk === '\n') { cx = x; cy += lh; return }
      chunk.split(/(\s+)/).forEach(tok => {
        if (!tok) return
        const w = doc.getTextWidth(tok)
        if (cx + w > x + width && tok.trim()) { cx = x; cy += lh }
        if (tok.trim() || cx > x) { doc.text(tok, cx, cy); cx += w }
      })
    })
  })
  return cy
}

const EST_FONTS = {
  pjs: ['PJS-Regular.ttf', 'PJS-Bold.ttf', 'Plus Jakarta Sans'],
  inter: ['Inter-Regular.ttf', 'Inter-Bold.ttf', 'Inter'],
  opensans: ['OpenSans-Regular.ttf', 'OpenSans-Bold.ttf', 'Open Sans'],
  robotomono: ['RobotoMono-Regular.ttf', 'RobotoMono-Bold.ttf', 'Roboto Mono'],
  helvetica: ['Arimo-Regular.ttf', 'Arimo-Bold.ttf', 'Helvetica'],
}

async function generateEstimate({ cust, items, bill, brand = EST_BRAND_DEFAULT }) {
  const showImg = brand.photos !== false
  const thumb = (ph) => fetchB64(`https://images.unsplash.com/photo-${ph}?fit=crop&w=160&h=160&q=70&fm=jpg`)
    .then(b => 'data:image/jpeg;base64,' + b).catch(() => null)
  const [fontRegFile, fontBoldFile] = EST_FONTS[brand.font] || EST_FONTS.pjs
  const [{ jsPDF }, { default: autoTable }, fontN, fontB, mark, thumbs, ...brands] = await Promise.all([
    import('jspdf'), import('jspdf-autotable'),
    fetchB64(`/fonts/${fontRegFile}`), fetchB64(`/fonts/${fontBoldFile}`),
    imgData(brand.logo || '/brand-logo.png'),
    showImg ? Promise.all(items.map(({ p }) => thumb(p.ph))) : Promise.resolve([]),
    ...Object.values(BRAND_LOGOS).map(imgData),
  ])
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  doc.addFileToVFS(fontRegFile, fontN)
  doc.addFont(fontRegFile, 'DOC', 'normal')
  doc.addFileToVFS(fontBoldFile, fontB)
  doc.addFont(fontBoldFile, 'DOC', 'bold')

  // Helvetica = uppercase everything (the "grid/typewriter" look) EXCEPT the
  // product description. capsSkip is flipped on while the description cell draws.
  const CAPS = brand.font === 'helvetica'
  let capsSkip = false
  if (CAPS) {
    const baseText = doc.text.bind(doc)
    doc.text = (txt, ...rest) => {
      if (!capsSkip) {
        if (typeof txt === 'string') txt = txt.toUpperCase()
        else if (Array.isArray(txt)) txt = txt.map(t => (typeof t === 'string' ? t.toUpperCase() : t))
      }
      return baseText(txt, ...rest)
    }
  }

  const W = 210, H = 297, M = 14 // 14mm sides, ~6mm top
  const INK = [26, 28, 31], GRAY = [105, 110, 116]
  const PAPER = hexToRgb(brand.paper || EST_BRAND_DEFAULT.paper)
  const HAIR = PAPER.map(c => Math.max(0, c - 42))
  const ACCENT = hexToRgb(brand.accent || EST_BRAND_DEFAULT.accent)
  const FOOT = hexToRgb(brand.footer), SIDE = hexToRgb(brand.side), WORD = hexToRgb(brand.wordmark || '#1A1C1F')
  const inr = (n) => '₹' + n.toLocaleString('en-IN')
  const no = `BOM-${String(Date.now()).slice(-6)}`
  const d = new Date()
  const today = [String(d.getDate()).padStart(2, '0'), String(d.getMonth() + 1).padStart(2, '0'), d.getFullYear()].join('.')
  const validDays = brand.validDays || 7
  const note0 = brand.note || EST_BRAND_DEFAULT.note
  // pre-uppercase wrapped text under CAPS so width measurement matches the draw
  const note = CAPS ? note0.toUpperCase() : note0
  const dealer = { ...EST_BRAND_DEFAULT.dealer, ...(brand.dealer || {}) }
  const docTitle = (brand.docTitle || 'Bill of Materials').trim() || 'Bill of Materials'
  const showPrices = brand.showPrices !== false
  const showSavings = brand.showSavings !== false
  const gstPct = Number(brand.gstPct) || 0
  const gstAmt = gstPct ? Math.round((bill.toPay * gstPct) / 100) : 0
  const grand = bill.toPay + gstAmt
  const totalPcs = items.reduce((s, { n }) => s + n, 0)
  const paper = () => {
    doc.setFillColor(...PAPER).rect(0, 0, W, H, 'F')
    if (brand.watermark) {
      doc.saveGraphicsState()
      doc.setGState(new doc.GState({ opacity: 0.07 }))
      doc.setFont('DOC', 'bold').setFontSize(86).setTextColor(...INK)
      doc.text(brand.watermark.toUpperCase(), W / 2, H / 2 + 30, { angle: 45, align: 'center' })
      doc.restoreGraphicsState()
    }
  }
  paper()

  const preparedBy = brand.preparedBy || 'Virag Bora'
  const dealerLines = [`${preparedBy} — ${brand.name}`, dealer.addr1, `${dealer.addr2} · ${dealer.phone}`]
  const custLines = [
    cust.name, cust.phone,
    ...(cust.site ? doc.splitTextToSize(CAPS ? cust.site.toUpperCase() : cust.site, 80) : []),
    cust.refBy ? `Ref. by — ${cust.refBy}` : null,
  ].filter(Boolean)
  const netItems = bill.itemTotal - bill.bulkSave - bill.schemeOff
  const billRows = !showPrices ? [] : [
    ...(showSavings ? [
      ['Item total', inr(bill.itemTotal)],
      bill.bulkSave > 0 && ['Bulk price savings', '−' + inr(bill.bulkSave)],
      bill.schemeOff > 0 && [`Volume scheme (${bill.slabPct}%)`, '−' + inr(bill.schemeOff)],
    ] : [['Item total', inr(netItems)]]),
    ['Delivery' + (bill.express ? ' (express · 1 hr)' : ''), bill.fee === 0 ? 'FREE' : inr(bill.fee)],
  ].filter(Boolean)

  /* shared items table; layout knobs vary per template */
  const itemsTable = ({ startY, bottom, headFill = null, headText = INK, big = false }) => {
    const cols = [{ h: 'Qty', w: 11 }]
    if (showImg) cols.push({ h: '', w: big ? 17 : 13, img: true })
    cols.push({ h: 'Item no', w: 20, gray: true })
    cols.push({ h: 'Description', w: 'auto' })
    if (showPrices) {
      cols.push({ h: 'Unit price', w: 25, right: true, gray: true })
      cols.push({ h: 'Amount', w: 27, right: true })
    }
    const imgCol = cols.findIndex(c => c.img)
    const columnStyles = {}
    cols.forEach((c, i) => {
      columnStyles[i] = {
        ...(c.w !== 'auto' ? { cellWidth: c.w } : { cellWidth: 'auto' }),
        ...(c.right ? { halign: 'right' } : {}),
        ...(c.gray ? { textColor: GRAY } : {}),
        ...(c.img ? { minCellHeight: big ? 16 : 12.5 } : {}),
      }
    })
    autoTable(doc, {
      startY,
      margin: { left: M, right: M, top: 14, bottom },
      head: [cols.map(c => c.h)],
      body: items.map(({ p, n }) => cols.map(c => {
        if (c.img) return ''
        switch (c.h) {
          case 'Qty': return n
          case 'Item no': return p.id.toUpperCase()
          case 'Description': return `${p.name}\n${p.qty || ''}`
          case 'Unit price': return inr(p.price)
          default: return inr(p.price * n)
        }
      })),
      theme: 'plain',
      styles: { font: 'DOC', fontSize: 8.5, textColor: INK, cellPadding: { top: 2.2, bottom: 2.2, left: headFill ? 1.5 : 0, right: 2 }, valign: 'middle' },
      headStyles: headFill
        ? { font: 'DOC', fontStyle: 'bold', fontSize: 8, textColor: headText, fillColor: headFill, lineWidth: 0 }
        : { font: 'DOC', fontStyle: 'bold', fontSize: 8.5, textColor: headText, lineWidth: { bottom: 0.35 }, lineColor: INK },
      bodyStyles: { lineWidth: { bottom: 0.18 }, lineColor: HAIR },
      columnStyles,
      willDrawPage: (data) => { if (data.pageNumber > 1) paper() },
      didParseCell: (data) => {
        if (data.section === 'head' && cols[data.column.index] && cols[data.column.index].right) data.cell.styles.halign = 'right'
      },
      willDrawCell: (data) => {
        // keep the product description in normal case even under Helvetica caps
        capsSkip = CAPS && data.section === 'body' && cols[data.column.index] && cols[data.column.index].h === 'Description'
      },
      didDrawCell: (data) => {
        capsSkip = false
        if (imgCol < 0 || data.section !== 'body' || data.column.index !== imgCol) return
        const t = thumbs[data.row.index]
        const s = big ? 12 : 9, ix = data.cell.x, iy = data.cell.y + (data.cell.height - s) / 2
        if (t) doc.addImage(t, 'JPEG', ix, iy, s, s)
        else doc.setFillColor(225, 225, 221).rect(ix, iy, s, s, 'F')
      },
    })
    return doc.lastAutoTable.finalY
  }

  /* shared totals block: hairline rows + bold total; returns last y */
  const totalsBlock = (startY, bottomGuard) => {
    let y = startY
    const nRows = 1 + billRows.length + (gstPct ? 2 : 0)
    const blockH = (nRows + 1) * 7.5 + 14
    if (y + blockH > bottomGuard) { doc.addPage(); paper(); y = 30 }
    const tx = 118
    const row = (label, val) => {
      doc.setFont('DOC', 'normal').setFontSize(8.5).setTextColor(...GRAY)
      doc.text(label, tx, y)
      doc.setTextColor(...INK).text(val, W - M, y, { align: 'right' })
      doc.setDrawColor(...HAIR).setLineWidth(0.18).line(tx, y + 2.6, W - M, y + 2.6)
      y += 7.5
    }
    row('Items', `${items.length} · ${totalPcs} pcs`)
    for (const [l, v] of billRows) row(l, v)
    if (showPrices && gstPct) row('Subtotal', inr(bill.toPay))
    if (showPrices && gstPct) row(`GST (${gstPct}%)`, inr(gstAmt))
    if (showPrices) {
      doc.setFont('DOC', 'bold').setFontSize(10).setTextColor(...INK)
      doc.text(gstPct ? 'Grand total' : 'Total', tx, y)
      doc.text(inr(grand), W - M, y, { align: 'right' })
      doc.setDrawColor(...INK).setLineWidth(0.35).line(tx, y + 3, W - M, y + 3)
    } else {
      doc.setFont('DOC', 'bold').setFontSize(9).setTextColor(...INK)
      doc.text('Material list — prices on request', tx, y)
      doc.setDrawColor(...INK).setLineWidth(0.35).line(tx, y + 3, W - M, y + 3)
    }
    return y
  }

  /* optional signature block; returns the y it ended at */
  const signature = (y, limit) => {
    if (!brand.signature) return y
    if (y + 30 > limit) { doc.addPage(); paper(); y = 36 }
    const sx = W - M - 62
    doc.setDrawColor(...INK).setLineWidth(0.3).line(sx, y + 20, W - M, y + 20)
    doc.setFont('DOC', 'normal').setFontSize(7.5).setTextColor(...GRAY)
    doc.text('Authorised signatory', sx, y + 24.5)
    doc.setFont('DOC', 'bold').setFontSize(8).setTextColor(...INK)
    doc.text(brand.name, sx, y + 28.5)
    return y + 30
  }

  /* ============ template: CLASSIC (Swiss hairlines, logos on top) ============ */
  const renderClassic = () => {
    const logosTop = brand.logosPos !== 'bottom'
    doc.setFont('DOC', 'bold').setFontSize(brand.name.length > 14 ? 20 : 25).setTextColor(...WORD).text(brand.name, M, 13.5)
    const mw = Math.min(40, (mark.w / mark.h) * 16)
    doc.addImage(mark.data, 'PNG', W - M - mw, 6, mw, 16)

    const logoStrip = (ly) => {
      doc.setFont('DOC', 'bold').setFontSize(6.5).setTextColor(...GRAY).setCharSpace(0.5)
      doc.text('AUTHORIZED DEALER FOR', M, ly)
      doc.setCharSpace(0)
      let bx = M
      for (const b of brands) {
        const dw = (b.w / b.h) * 9
        doc.addImage(b.data, 'PNG', bx, ly + 2.5, dw, 9)
        bx += dw + 10
      }
    }
    if (logosTop) logoStrip(25)

    const infoY = logosTop ? 45 : 31
    doc.setFont('DOC', 'bold').setFontSize(9).setTextColor(...INK)
    doc.text('Customer Information', M, infoY).text('Dealer Information', 112, infoY)
    doc.setFont('DOC', 'normal').setFontSize(8.5).setTextColor(...GRAY)
    doc.text(custLines, M, infoY + 6)
    doc.text(dealerLines, 112, infoY + 6)

    const tTop = infoY + 6 + Math.max(custLines.length, 3) * 4.3 + 5
    doc.setDrawColor(...HAIR).setLineWidth(0.3).line(M, tTop, W - M, tTop)
    doc.setFont('DOC', 'bold').setFontSize(docTitle.length > 22 ? 13 : 17).setTextColor(...INK).text(docTitle, M, tTop + 9.5)
    doc.setFont('DOC', 'normal').setFontSize(10).setTextColor(...GRAY)
    doc.text(no, 132, tTop + 9.5, { align: 'center' })
    doc.text(today, W - M, tTop + 9.5, { align: 'right' })
    doc.line(M, tTop + 14, W - M, tTop + 14)

    const fin = itemsTable({ startY: tTop + 19, bottom: logosTop ? 24 : 40 })
    let y = totalsBlock(fin + 8, H - (logosTop ? 24 : 42))
    if (!logosTop) logoStrip(H - 38)
    y = drawRich(doc, note, 118, y + 9.5, W - M - 118, { size: 8 })
    doc.setFont('DOC', 'normal').setFontSize(7.5).setTextColor(...GRAY)
      .text(`Valid ${validDays} days from the date above. Prepared by ${preparedBy}.`, 118, y + 4.5)
    signature(y + 8, H - (logosTop ? 26 : 44))

    const pages = doc.getNumberOfPages()
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i)
      doc.setDrawColor(...INK).setLineWidth(0.4).line(M, H - 21, W - M, H - 21)
      doc.setFont('DOC', 'normal').setFontSize(7.5).setTextColor(...FOOT)
      doc.text([dealer.email, dealer.website], M, H - 15.5)
      doc.text([dealer.addr1, dealer.addr2], 72, H - 15.5)
      doc.text(['Trade prices · GST billing', '90-min site delivery'], 128, H - 15.5)
      doc.text(['GSTIN', dealer.gstin], 176, H - 15.5)
      doc.setFontSize(6.5).setTextColor(...SIDE)
        .text(`${brand.name} · Furniture Hardware · Registered dealer — Bengaluru`, 8, H - 10, { angle: 90 })
    }
  }

  /* ============ template: BOLD (colour-block bands, logos in bottom band) ============ */
  const renderBold = () => {
    const onAccent = [20, 22, 24]
    doc.setFillColor(...ACCENT).rect(0, 0, W, 52, 'F')
    const bt = docTitle.length > 14 ? docTitle : docTitle.toUpperCase()
    doc.setFont('DOC', 'bold').setFontSize(bt.length > 18 ? 15 : bt.length > 8 ? 22 : 34).setTextColor(...WORD).text(bt, M, 20)
    const mw = Math.min(36, (mark.w / mark.h) * 14)
    doc.addImage(mark.data, 'PNG', W - M - mw, 7, mw, 14)
    const cap = (t, x, yy) => {
      doc.setFont('DOC', 'bold').setFontSize(6.5).setTextColor(...onAccent).setCharSpace(0.4)
      doc.text(t, x, yy)
      doc.setCharSpace(0)
    }
    cap('(DATE)', M, 30); cap('(VALID FOR)', M, 41); cap('(BILLED TO)', 74, 30); cap('(FROM)', 74, 41)
    doc.setFont('DOC', 'normal').setFontSize(8).setTextColor(...onAccent)
    doc.text(today, M, 34.5).text(`${validDays} days`, M, 45.5)
    doc.text(`${cust.name}${cust.phone ? ' · ' + cust.phone : ''}`, 74, 34.5)
    if (cust.refBy) doc.setFontSize(7).text(`Ref. by — ${cust.refBy}`, 74, 37.8).setFontSize(8)
    doc.text(`${dealerLines[0]} · Bengaluru`, 74, 45.5)

    const fin = itemsTable({ startY: 60, bottom: 48, headFill: PAPER.map(c => Math.max(0, c - 14)), big: false })
    let y = totalsBlock(fin + 8, H - 52)
    const ny = drawRich(doc, note, M, y + 2, 92, { size: 8 })
    signature(Math.max(y, ny) + 4, H - 44)

    const pages = doc.getNumberOfPages()
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i)
      doc.setFillColor(60, 64, 67).rect(0, H - 40, W, 26, 'F')
      doc.setFont('DOC', 'bold').setFontSize(6.5).setTextColor(255, 255, 255).setCharSpace(0.4)
      doc.text('(DEALER)', M, H - 33).text('(TERMS)', 96, H - 33).text('(PREPARED BY)', 162, H - 33)
      doc.setCharSpace(0)
      doc.setFont('DOC', 'normal').setFontSize(7.5)
      doc.text([dealer.addr1 + ', ' + dealer.addr2, 'GSTIN ' + dealer.gstin], M, H - 28)
      doc.text([`Confirm within ${validDays} days · GST as applicable`, 'Trade prices · 90-min site delivery'], 96, H - 28)
      doc.text(preparedBy, 162, H - 28)
      doc.setFillColor(...ACCENT).rect(0, H - 14, W, 14, 'F')
      doc.setFont('DOC', 'bold').setFontSize(9).setTextColor(...onAccent).text(brand.name, M, H - 5.5)
      let lx = W - M
      for (const b of [...brands].reverse()) {
        const dw = (b.w / b.h) * 7
        lx -= dw
        doc.setFillColor(255, 255, 255).roundedRect(lx - 1.5, H - 12, dw + 3, 10, 1.5, 1.5, 'F')
        doc.addImage(b.data, 'PNG', lx, H - 10.5, dw, 7)
        lx -= 7.5
      }
    }
  }

  /* ============ template: STUDIO (editorial caps, meta table, amount in words) ============ */
  const renderStudio = () => {
    const mw = Math.min(30, (mark.w / mark.h) * 13)
    doc.addImage(mark.data, 'PNG', M, 8, mw, 13)

    const metaRows = [
      ['TO', cust.name.toUpperCase()],
      cust.refBy ? ['REF. BY', cust.refBy.toUpperCase()] : null,
      ['DATE', today], ['BOM NO', no],
      ['ITEMS', `${items.length} · ${totalPcs} PCS`],
      ['PREPARED BY', preparedBy.toUpperCase()],
    ].filter(Boolean)
    let my = 10
    doc.setDrawColor(...HAIR).setLineWidth(0.25)
    for (const [l, v] of metaRows) {
      doc.line(118, my, W - M, my)
      doc.setFont('DOC', 'bold').setFontSize(7).setTextColor(...GRAY).setCharSpace(0.8).text(l, 118, my + 5)
      doc.setCharSpace(0)
      doc.setFont('DOC', 'normal').setFontSize(8).setTextColor(...INK).text(v, W - M, my + 5, { align: 'right' })
      my += 8
    }
    doc.line(118, my, W - M, my)

    doc.setFont('DOC', 'bold').setFontSize(11).setTextColor(...WORD).setCharSpace(1.5)
    doc.text(brand.name.toUpperCase(), M, 36)
    doc.setCharSpace(0.6).setFontSize(7).setTextColor(...GRAY)
    doc.text([dealerLines[1].toUpperCase(), dealerLines[2].toUpperCase()], M, 41.5)
    doc.setCharSpace(0)
    doc.setFont('DOC', 'bold').setFontSize(7.5).setTextColor(...INK).setCharSpace(0.8)
    doc.text('PRODUCTS', M, my + 12)
    doc.setCharSpace(0)

    const fin = itemsTable({ startY: my + 16, bottom: 50, big: true })
    let y = totalsBlock(fin + 8, H - 56)
    let wy = y + 7
    if (showPrices) {
      doc.setFont('DOC', 'normal').setFontSize(7).setTextColor(...GRAY)
      const words = doc.splitTextToSize(`${inrWords(grand).toUpperCase()} RUPEES ONLY`, 78)
      doc.text(words, W - M, wy, { align: 'right' })
      wy += words.length * 3.6 + 4
    }
    const sy = drawRich(doc, note, 118, wy, W - M - 118, { size: 7.5, lh: 3.9, color: GRAY })
    signature(sy + 4, H - 46)

    const pages = doc.getNumberOfPages()
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i)
      let lx = M
      for (const b of brands) {
        const dw = (b.w / b.h) * 6
        doc.addImage(b.data, 'PNG', lx, H - 38, dw, 6)
        lx += dw + 7
      }
      doc.setFont('DOC', 'normal').setFontSize(6.5).setTextColor(...FOOT).setCharSpace(0.6)
      doc.text(['REGISTERED OFFICE:', dealer.addr1.toUpperCase(), `${dealer.addr2} · ${dealer.phone}`.toUpperCase()], M, H - 26)
      doc.text(`${i} / ${pages}`, M, H - 8)
      doc.setCharSpace(0)
      doc.setFontSize(6.5).setTextColor(...SIDE)
        .text(`${brand.name} · Furniture Hardware — Bengaluru`, 8, H - 10, { angle: 90 })
    }
  }

  if (brand.template === 'bold') renderBold()
  else if (brand.template === 'studio') renderStudio()
  else renderClassic()

  doc.save(`${no} ${cust.name.trim()} BOM.pdf`)
}

export { generateEstimate, EST_BRAND_DEFAULT, EST_FONTS, EST_SWATCHES, EST_PAPERS, hexToRgb }

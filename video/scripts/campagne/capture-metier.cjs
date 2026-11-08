// Captures des vrais écrans au nom d'un autre commerce (série « par métier »).
// Usage : NODE_PATH=$(npm root -g) node scripts/campagne/capture-metier.cjs <clé> "<Nom du commerce>" "<titre de campagne>" "<message>" <fond> <texte> <libellés>
// → public/campagne/ecrans/m-<clé>-*.png (+ positions dans src/campagne/ecrans.json). Faux serveur et frontend lancés (voir capture.cjs).
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')
const ROOT = path.join(__dirname, '../..')
const OUT = path.join(ROOT, 'public/campagne/ecrans')
const JSON_OUT = path.join(ROOT, 'src/campagne/ecrans.json')
const DATA = path.join(__dirname, 'data.json')
const [key, nom, titre, message, bg, ink, label] = process.argv.slice(2)
const meta = JSON.parse(fs.readFileSync(JSON_OUT, 'utf8'))
const wait = ms => new Promise(r => setTimeout(r, ms))
const original = fs.readFileSync(DATA, 'utf8')
const d = JSON.parse(original)
const R = d.routes
for (const k of ['GET /pro/status', 'GET /pro/info']) R[k] = { ...R[k], nom }
R['GET /companies/.*/info'] = { ...R['GET /companies/.*/info'], nom }
Object.assign(R['GET /pro/card-customization/.*'], { logo_text: nom, primary_color: bg, text_color: ink, accent_color: label, google_primary_color: bg })
fs.writeFileSync(DATA, JSON.stringify(d, null, 1))
;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
  await ctx.addInitScript(n => { localStorage.setItem('token', 'demo.video.token'); localStorage.setItem('userRole', 'pro'); localStorage.setItem('companyName', n); localStorage.setItem('darkMode', 'true') }, nom)
  const page = await ctx.newPage()
  const go = async url => { await page.goto('http://localhost:3100' + url, { waitUntil: 'networkidle' }); await wait(900) }
  const rect = (sel, text) => page.evaluate(([s, t]) => {
    const els = [...document.querySelectorAll(s)].filter(e => e.offsetParent || e.getClientRects().length)
    const el = t ? els.find(e => e.textContent.includes(t)) : els[0]
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }
  }, [sel, text])
  const shot = async (name, spec = {}, full = false) => {
    const m = { rects: {}, height: full ? await page.evaluate(() => document.documentElement.scrollHeight) : 844, view: !full }
    for (const [k, s] of Object.entries(spec)) m.rects[k] = Array.isArray(s) ? await rect(...s) : await rect(s)
    if (full) {
      const top = await rect('.app-topbar'), tab = await rect('.app-tabbar')
      m.top = top.h; m.tab = tab.h
      await page.screenshot({ path: `${OUT}/m-${key}-${name}-top.png`, clip: { x: 0, y: 0, width: 390, height: top.h } })
      await page.screenshot({ path: `${OUT}/m-${key}-${name}-tab.png`, clip: { x: 0, y: 844 - tab.h, width: 390, height: tab.h } })
      await page.addStyleTag({ content: '.app-topbar, .app-tabbar { visibility: hidden !important }' })
      await page.screenshot({ path: `${OUT}/m-${key}-${name}.png`, fullPage: true })
      await page.addStyleTag({ content: '.app-topbar, .app-tabbar { visibility: visible !important }' })
    } else await page.screenshot({ path: `${OUT}/m-${key}-${name}.png` })
    meta[`m-${key}-${name}`] = m
    console.log('✓', `m-${key}-${name}`)
  }
  const tab = async t => { await page.evaluate(t => { const els = [...document.querySelectorAll('button, a')].filter(e => (e.title || e.textContent).trim().startsWith(t)); (els.find(e => e.offsetParent) || els[0]).click() }, t); await wait(1200); await page.evaluate(() => scrollTo(0, 0)) }
  try {
    await go('/pro/dashboard')
    const input = page.locator('input:visible').first()
    await input.fill('Camille'); await wait(900)
    await shot('caisse-search', { credit: ['button', 'Créditer'] })
    await page.locator('button:visible', { hasText: 'Créditer' }).first().click(); await wait(700)
    await page.locator('button:visible', { hasText: 'Continuer sans' }).first().click(); await wait(700)
    await shot('caisse-points', { b20: ['button', '20'] })
    await page.locator('button:visible', { hasText: /^\+?20$/ }).first().click(); await wait(500)
    await shot('caisse-points20', { ok: ['button', 'Valider'] })
    await page.locator('button:visible', { hasText: /Valider/ }).last().click(); await wait(600)
    await shot('caisse-done')
    await go('/pro/dashboard'); await tab('Campagnes')
    await page.locator('input:visible').first().fill(titre)
    await page.locator('textarea:visible').first().fill(message); await wait(300)
    await shot('campagnes', { title: 'input', msg: 'textarea', send: ['button', 'Envoyer'] }, true)
    await go('/pro/dashboard'); await tab('Ma carte')
    await shot('carte', { preview: '[class*=preview]' }, true)
  } finally {
    fs.writeFileSync(DATA, original)
    fs.writeFileSync(JSON_OUT, JSON.stringify(meta, null, 1))
    await browser.close()
  }
})()

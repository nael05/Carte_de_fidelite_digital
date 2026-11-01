// Captures haute définition des vrais écrans (site lancé en local sur un faux serveur d'API).
// Pour chaque écran : la page entière sans les barres fixes, les barres à part, et la position des éléments utiles.
//
// 1. node scripts/ecrans/server.mjs          (faux serveur d'API sur le port 5055, données dans data.json)
// 2. cd ../frontend && VITE_API_URL=http://localhost:5055/api npx vite --port 3100
// 3. node scripts/ecrans/capture.mjs [design,register,join,caisse,campaigns]
//    → public/explication/ecrans/*.png et rects.json (à recopier dans src/explication/rects.json)
// puppeteer-core n'est pas une dépendance du projet : npm i --no-save puppeteer-core@23
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(HERE, '../..')
const OUT = path.join(ROOT, 'public/explication/ecrans')
const ONLY = process.argv[2] ?? ''
fs.mkdirSync(OUT, { recursive: true })
const DATA = path.join(HERE, 'data.json')
const BASE = 'http://localhost:3100'
const DPR = 3
const rectsFile = `${OUT}/rects.json`
const rects = fs.existsSync(rectsFile) ? JSON.parse(fs.readFileSync(rectsFile, 'utf8')) : {}
const wait = ms => new Promise(r => setTimeout(r, ms))
const want = k => !ONLY || ONLY.split(',').includes(k)

const browser = await puppeteer.launch({ executablePath: path.join(ROOT, 'node_modules/.remotion/chrome-headless-shell/win64/chrome-headless-shell-win64/chrome-headless-shell.exe'), headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: DPR, isMobile: true, hasTouch: true })
await page.goto(BASE + '/', { waitUntil: 'networkidle0' })
await page.evaluate(() => { localStorage.setItem('token', 'demo.video.token'); localStorage.setItem('userRole', 'pro'); localStorage.setItem('companyName', 'Maison Lumière'); localStorage.setItem('darkMode', 'true') })

// Bannière de la carte : la même photo (SVG) que le pass de la page d'accueil
await wait(800)
const strip = await page.evaluate(() => { const s = document.querySelector('svg.wp-photo'); return s ? s.outerHTML.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="960" height="360"') : null })
if (strip) fs.writeFileSync(path.join(HERE, 'img/strip.svg'), strip)

const setSkin = skin => {
  const C = { graphite: ['#1c1c1e', '#ffffff', '#e3c9a4'], azur: ['#0b3a8f', '#ffffff', '#9fd0ff'], champagne: ['#dcc39d', '#2b1f12', '#7a5530'], ivory: ['#f5f5f7', '#1d1d1f', '#0071e3'] }[skin]
  const d = JSON.parse(fs.readFileSync(DATA, 'utf8'))
  const c = d.routes['GET /pro/card-customization/.*']
  Object.assign(c, { primary_color: C[0], text_color: C[1], accent_color: C[2], google_primary_color: C[0], logo_url: `http://localhost:5055/api/img/mark-${skin}.svg`, apple_logo_url: `http://localhost:5055/api/img/mark-${skin}.svg` })
  fs.writeFileSync(DATA, JSON.stringify(d, null, 1))
}

const HIDE = '.app-topbar, .app-tabbar { visibility: hidden !important }'
const rectOf = sel => page.evaluate(s => {
  const el = document.querySelector(s)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }
}, sel)
const rectByText = (sel, text) => page.evaluate((s, t) => {
  const el = [...document.querySelectorAll(s)].find(e => e.textContent.includes(t))
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }
}, sel, text)
const measure = async spec => {
  const r = {}
  for (const [k, sel] of Object.entries(spec)) r[k] = Array.isArray(sel) ? await rectByText(...sel) : await rectOf(sel)
  return r
}

async function full(name, { bars = true, spec = {} } = {}) {
  await wait(1400)
  const style = await page.addStyleTag({ content: HIDE + ' * { caret-color: transparent !important }' })
  await page.evaluate(() => window.scrollTo(0, 0))
  await wait(300)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  const height = await page.evaluate(() => document.documentElement.scrollHeight)
  const r = { height, ...(await measure(spec)) }
  await style.evaluate(s => s.remove())
  if (bars) {
    const top = await rectOf('.app-topbar'), tab = await rectOf('.app-tabbar')
    if (top) await page.screenshot({ path: `${OUT}/${name}-top.png`, clip: { x: 0, y: 0, width: 390, height: top.h } })
    if (tab) await page.screenshot({ path: `${OUT}/${name}-tab.png`, clip: { x: 0, y: 844 - tab.h, width: 390, height: tab.h } })
    r.top = top?.h
    r.tab = tab?.h
  }
  rects[name] = r
  console.log(name, height)
}
async function view(name, spec = {}) {
  await wait(700)
  const style = await page.addStyleTag({ content: '* { caret-color: transparent !important }' })
  await page.screenshot({ path: `${OUT}/${name}.png` })
  await style.evaluate(s => s.remove())
  const scrollY = await page.evaluate(() => scrollY)
  const m = await measure(spec)
  for (const k in m) if (m[k]) m[k].y -= scrollY
  rects[name] = { scrollY, ...m }
  console.log(name)
}
const type = async (sel, text) => { await page.click(sel); await page.type(sel, text, { delay: 5 }) }

// 1. Ma carte, quatre couleurs
if (want('design')) {
  for (const skin of ['graphite', 'azur', 'champagne', 'ivory']) {
    setSkin(skin)
    await page.goto(BASE + '/pro/dashboard?tab=design', { waitUntil: 'networkidle0' })
    await full(`design-${skin}`, { bars: skin === 'graphite', spec: { preview: '.customizer-preview .apple-card', fields: '.settings-card' } })
  }
  setSkin('graphite')
}

// 2. Recruter
if (want('register')) {
  await page.goto(BASE + '/pro/dashboard?tab=register', { waitUntil: 'networkidle0' })
  await full('register', { spec: { qr: 'canvas', qrCard: ['.ui-card', 'Télécharger en PNG'] } })
}

// 3. Inscription du client
if (want('join')) {
  await page.goto(BASE + '/join/e42', { waitUntil: 'networkidle0' })
  await full('join-empty', { bars: false, spec: { wallet: ['button', 'Cartes'] } })
  await type('input[placeholder="Jean"]', 'Camille')
  await type('input[placeholder="Dupont"]', 'Roux')
  await type('input[placeholder="votre@email.com"]', 'camille.roux@mail.fr')
  await type('input[placeholder="0612345678"]', '0612345678')
  const boxes = await page.$$('input[type="checkbox"]')
  await boxes[0].click()
  await boxes[1].click()
  await page.evaluate(() => document.activeElement?.blur())
  await full('join-filled', { bars: false, spec: { wallet: ['button', 'Cartes'], first: 'input[placeholder="Jean"]', last: 'input[placeholder="Dupont"]', email: 'input[placeholder="votre@email.com"]', phone: 'input[placeholder="0612345678"]' } })
}

// 4. Caisse
if (want('caisse')) {
  await page.goto(BASE + '/pro/dashboard?tab=scanner', { waitUntil: 'networkidle0' })
  await full('caisse', { spec: { scan: ['.ui-btn', 'Lancer le scan'], search: '.ui-search' } })
  await type('.ui-search input', 'Cam')
  await page.evaluate(() => document.activeElement?.blur())
  await full('caisse-search', { spec: { row: '.pd-manual-row', credit: '.pd-manual-row .ui-btn', search: '.ui-search' } })
  const searchTop = (await rectOf('.ui-search')).y
  await page.evaluate(y => window.scrollTo(0, y - 240), searchTop)
  await wait(400)
  await view('caisse-scrolled', { credit: '.pd-manual-row .ui-btn' })
  await page.click('.pd-manual-row .ui-btn')
  await view('caisse-reward', { modal: '.ui-modal', cont: '.ui-modal-foot .ui-btn' })
  await page.click('.ui-modal-foot .ui-btn')
  await view('caisse-points', { modal: '.ui-modal', plus20: ['.pd-shortcuts button', '+20'], ok: '.ui-modal-foot .ui-btn' })
  await page.evaluate(() => [...document.querySelectorAll('.pd-shortcuts button')].find(b => b.textContent.includes('+20')).click())
  await page.evaluate(() => document.activeElement?.blur())
  await view('caisse-points20', { modal: '.ui-modal', ok: '.ui-modal-foot .ui-btn' })
  await page.click('.ui-modal-foot .ui-btn')
  await view('caisse-done', { toast: '.ui-toast' })
}

// 5. Campagnes
if (want('campaigns')) {
  await page.goto(BASE + '/pro/dashboard?tab=campaigns', { waitUntil: 'networkidle0' })
  const spec = { title: 'input[maxlength="60"]', msg: 'textarea', send: 'form button[type=submit]', form: 'form.ui-card' }
  await full('campaigns', { spec })
  await type('input[maxlength="60"]', 'Le croissant du mois est là')
  await type('textarea', '-20 % sur les viennoiseries ce week-end. À tout de suite !')
  await page.evaluate(() => document.activeElement?.blur())
  await full('campaigns-filled', { spec })
  await page.evaluate(() => { window.confirm = () => true })
  await page.click('form button[type=submit]')
  await full('campaigns-sent', { spec: { ...spec, note: '.ui-note.success' } })
}

fs.writeFileSync(rectsFile, JSON.stringify(rects, null, 1))
await browser.close()

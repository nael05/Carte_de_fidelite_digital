// Captures haute définition des VRAIS écrans du site (frontend actuel lancé en local sur un faux serveur d'API).
//
// 1. node scripts/campagne/data.mjs && node scripts/campagne/server.mjs        (faux serveur, port 5056)
// 2. cd ../frontend && VITE_API_URL=http://localhost:5056/api npx vite --port 3100
// 3. NODE_PATH=$(npm root -g) node scripts/campagne/capture.cjs [mobile|desktop]
//    → public/campagne/ecrans/*.png et src/campagne/ecrans.json (taille des pages, position des éléments)
//
// Chaque écran : la page entière sans les barres fixes (<nom>.png), et les barres à part (<nom>-top.png, <nom>-tab.png).
const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')
const ROOT = path.join(__dirname, '../..')
const OUT = path.join(ROOT, 'public/campagne/ecrans')
const JSON_OUT = path.join(ROOT, 'src/campagne/ecrans.json')
const DATA = path.join(__dirname, 'data.json')
const BASE = 'http://localhost:3100'
const ONLY = process.argv[2] || ''
fs.mkdirSync(OUT, { recursive: true })
const meta = fs.existsSync(JSON_OUT) ? JSON.parse(fs.readFileSync(JSON_OUT, 'utf8')) : {}
const wait = ms => new Promise(r => setTimeout(r, ms))

const SKINS = {
  graphite: ['#1c1c1e', '#ffffff', '#e3c9a4'],
  azur: ['#0b3a8f', '#ffffff', '#9fd0ff'],
  champagne: ['#dcc39d', '#2b1f12', '#7a5530'],
  ivory: ['#f5f5f7', '#1d1d1f', '#0071e3'],
}
const setSkin = skin => {
  const C = SKINS[skin]
  const d = JSON.parse(fs.readFileSync(DATA, 'utf8'))
  const c = d.routes['GET /pro/card-customization/.*']
  Object.assign(c, { primary_color: C[0], text_color: C[1], accent_color: C[2], google_primary_color: C[0],
    logo_url: `http://localhost:5056/api/img/mark-${skin}.svg`, apple_logo_url: `http://localhost:5056/api/img/mark-${skin}.svg` })
  fs.writeFileSync(DATA, JSON.stringify(d, null, 1))
}

;(async () => {
  const browser = await chromium.launch()
  const desktop = ONLY === 'desktop'
  const ctx = await browser.newContext(desktop
    ? { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }
    : { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
  await ctx.addInitScript(() => {
    localStorage.setItem('token', 'demo.video.token'); localStorage.setItem('userRole', 'pro')
    localStorage.setItem('companyName', 'Maison Lumière'); localStorage.setItem('darkMode', 'true')
  })
  const page = await ctx.newPage()
  const P = desktop ? 'd-' : 'm-'
  // Adresse publique du site à la place de localhost
  const fixText = () => page.evaluate(() => {
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let n; while ((n = walk.nextNode())) n.nodeValue = n.nodeValue.replace(/https?:\/\/localhost:3100/g, 'https://fidelyzapp.fr')
    document.querySelectorAll('input').forEach(i => { if (i.value.includes('localhost:3100')) i.value = i.value.replace(/https?:\/\/localhost:3100/g, 'https://fidelyzapp.fr') })
  })
  const rect = (sel, text) => page.evaluate(([s, t]) => {
    const els = [...document.querySelectorAll(s)].filter(e => e.offsetParent || e.getClientRects().length)
    const el = t ? els.find(e => e.textContent.includes(t)) : els[0]
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.x + scrollX, y: r.y + scrollY, w: r.width, h: r.height }
  }, [sel, text])
  // Capture : page entière sans barres fixes + barres + éléments repérés
  const capture = async (name, spec = {}, { bars = true, view = false } = {}) => {
    await fixText(); await wait(300)
    const m = { rects: {} }
    for (const [k, s] of Object.entries(spec)) m.rects[k] = Array.isArray(s) ? await rect(...s) : await rect(s)
    if (view) {
      await page.screenshot({ path: `${OUT}/${P}${name}.png` })
      m.height = desktop ? 900 : 844; m.view = true
    } else {
      const top = await rect('.app-topbar'), tab = await rect('.app-tabbar')
      if (bars && !desktop && top) {
        m.top = top.h; m.tab = tab ? tab.h : 0
        await page.screenshot({ path: `${OUT}/${P}${name}-top.png`, clip: { x: 0, y: 0, width: 390, height: top.h } })
        if (tab) await page.screenshot({ path: `${OUT}/${P}${name}-tab.png`, clip: { x: 0, y: 844 - tab.h, width: 390, height: tab.h } })
        await page.addStyleTag({ content: '.app-topbar, .app-tabbar { visibility: hidden !important }' })
      }
      await page.screenshot({ path: `${OUT}/${P}${name}.png`, fullPage: true })
      m.height = await page.evaluate(() => document.documentElement.scrollHeight)
      if (bars && !desktop) await page.addStyleTag({ content: '.app-topbar, .app-tabbar { visibility: visible !important }' })
    }
    meta[P + name] = m
    console.log('✓', P + name, m.height)
  }
  const go = async url => { await page.goto(BASE + url, { waitUntil: 'networkidle' }); await wait(900) }
  const click = async (text, sel = 'button') => { await page.locator(sel.split(',').map(x => x.trim() + ':visible').join(', '), { hasText: text }).first().click({ timeout: 4000 }); await wait(700) }
  const tab = async t => {
    const ok = await page.evaluate(t => {
      const els = [...document.querySelectorAll('button, a')].filter(e => (e.title || e.textContent).trim().startsWith(t))
      const el = els.find(e => e.offsetParent) || els[0]
      if (el) el.click()
      return !!el
    }, t)
    if (!ok) console.log('onglet introuvable', t)
    await wait(1200); await page.evaluate(() => scrollTo(0, 0))
  }

  // ── Caisse ──
  setSkin('graphite')
  await go('/pro/dashboard')
  await capture('caisse', { scan: ['button', 'Lancer le scan'], search: 'input', card: ['div', 'Scanner une carte'] })
  if (!desktop) {
    const input = page.locator('input:visible').first()
    await input.click(); await wait(300)
    for (const [i, s] of ['C', 'Ca', 'Cam', 'Cami', 'Camil', 'Camill', 'Camille'].entries()) {
      await input.fill(s); await wait(i === 6 ? 900 : 150)
    }
    await page.evaluate(() => scrollTo(0, 0))
    await capture('caisse-search', { input: 'input', credit: ['button', 'Créditer'] }, { view: true })
    await click('Créditer')
    await capture('caisse-sheet', { cont: ['button', 'Continuer sans'], reward: ['div', 'Un café offert'] }, { view: true })
    await click('Continuer sans')
    console.log(await page.evaluate(() => [...document.querySelectorAll('button')].filter(e => e.offsetParent).map(e => e.textContent.trim()).join(' | ')))
    await capture('caisse-points', { b20: ['button', '20'], input: 'input[type=number], input' }, { view: true })
    await page.locator('button:visible', { hasText: /^\+?20$/ }).first().click({ timeout: 3000 }).catch(() => console.log('pas de bouton 20'))
    await wait(500)
    await capture('caisse-points20', { ok: ['button', 'Valider'] }, { view: true })
    console.log(await page.evaluate(() => [...document.querySelectorAll('button')].filter(e => e.offsetParent).map(e => e.textContent.trim()).join(' | ')))
    await page.locator('button:visible', { hasText: /Valider|Ajouter|Confirmer|Créditer/ }).last().click({ timeout: 3000 }).catch(() => console.log('pas de validation'))
    await wait(600)
    await capture('caisse-done', {}, { view: true })
    await wait(2500)
    await capture('caisse-after', {}, { view: true })
  }

  // ── Ma carte (4 couleurs, Apple puis Google) ──
  for (const skin of ['graphite', 'azur', 'champagne', 'ivory']) {
    setSkin(skin)
    await go('/pro/dashboard'); await tab('Ma carte')
    await capture(`carte-${skin}`, { preview: '.cc-preview, [class*=preview]', fields: ['div', 'Couleur de Fond'], save: ['button', 'Enregistrer'] })
  }
  setSkin('graphite')
  await go('/pro/dashboard'); await tab('Ma carte')
  await click('Google Wallet')
  await capture('carte-google', { preview: '.cc-preview, [class*=preview]' })
  await go('/pro/dashboard'); await tab('Ma carte')
  await click('Images')
  await capture('carte-images', {})

  // ── Campagnes ──
  await go('/pro/dashboard'); await tab('Campagnes')
  await capture('campagnes', { title: 'input', msg: 'textarea', send: ['button', 'Envoyer'] })
  const T = 'Le chocolat chaud est de retour ☕', M = 'Venez le goûter cette semaine : votre 2e boisson est offerte avec votre carte.'
  for (let i = 1; i <= T.length; i += 3) { await page.locator('input:visible').first().fill(T.slice(0, i)) }
  await page.locator('input:visible').first().fill(T)
  await page.locator('textarea:visible').first().fill(M)
  await wait(300)
  await capture('campagnes-filled', { title: 'input', msg: 'textarea', send: ['button', 'Envoyer'] })
  await click('Envoyer')
  await wait(400)
  console.log(await page.evaluate(() => [...document.querySelectorAll('button')].filter(e => e.offsetParent).map(e => e.textContent.trim()).join(' | ')))
  await capture('campagnes-confirm', { ok: ['button', 'Envoyer'] }, { view: true })
  await page.locator('button:visible', { hasText: /Confirmer|Envoyer/ }).last().click({ timeout: 3000 }).catch(() => {})
  await wait(700)
  await capture('campagnes-sent', {}, { view: true })

  // ── Recruter, statistiques, clients ──
  await go('/pro/dashboard'); await tab('Recruter')
  await capture('recruter', { qr: 'canvas, svg', link: 'input' })
  await go('/pro/dashboard')
  await tab('Statistiques')
  await capture('stats', {})
  await click('Activité').catch(() => {}); await wait(1200)
  await capture('stats-activite', {})
  await click('Clients', 'button').catch(() => {}); await wait(1200)
  await capture('stats-clients', {})
  await go('/pro/dashboard'); await tab('Clients')
  await capture('clients', {})

  // ── Réglages : programme de fidélité, notifications et proximité ──
  if (ONLY.includes('reglages') || !ONLY || ONLY === 'mobile' || ONLY === 'desktop') {
    await go('/pro/dashboard'); await tab('Réglages')
    await capture('reglages', {})
    for (const [k, label] of [['programme', 'Programme de fidélité'], ['notifs', 'Notifications push'], ['geo', 'Géolocalisation']]) {
      await go('/pro/dashboard'); await tab('Réglages')
      await page.evaluate(l => { const el = [...document.querySelectorAll('button, a, [role=button], div')].filter(e => e.textContent.trim().startsWith(l) && e.offsetParent).sort((a, b) => a.textContent.length - b.textContent.length)[0]; if (el) el.click() }, label)
      await wait(1200)
      if (k === 'notifs') {
        const ta = page.locator('textarea:visible').first()
        if (await ta.count()) await ta.fill('Maison Lumière est à 50 m : plus que 20 points avant votre café ☕')
      }
      if (k === 'geo') {
        await page.locator('input[placeholder="48.8566"]').first().fill('48.8642')
        await page.locator('input[placeholder="2.3522"]').first().fill('2.3488')
        await page.locator('input[placeholder^="Ex : Bienvenue"]').first().fill('Maison Lumière est à 50 m ☕')
      }
      await capture(`reglages-${k}`, { textarea: 'textarea', add: ['button', 'Ajouter'], msg: 'input[placeholder^="Ex : Bienvenue"]', save: ['button', 'Enregistrer'] })
    }
  }

  // ── Côté client : inscription ──
  await go('/join/e42')
  await capture('join', { prenom: 'input', wallet: ['button', 'Ajouter'] }, { bars: false })
  const vals = ['Camille', 'Roux', 'camille.roux@mail.fr', '0612345678']
  const phs = ['Jean', 'Dupont', 'votre@email.com', '0612345678']
  for (let i = 0; i < 4; i++) await page.locator(`input[placeholder="${phs[i]}"]`).first().fill(vals[i])
  const boxes = page.locator('input[type=checkbox]')
  for (let i = 0; i < (await boxes.count()); i++) await boxes.nth(i).check({ force: true }).catch(() => {})
  await capture('join-filled', { wallet: ['button', 'Ajouter'], iphone: ['button', 'iPhone'] }, { bars: false })

  // ── Accueil du site (bureau seulement) ──
  if (desktop) {
    await go('/')
    await page.screenshot({ path: `${OUT}/d-home.png` })
    meta['d-home'] = { height: 900, view: true }
  }

  fs.writeFileSync(JSON_OUT, JSON.stringify(meta, null, 1))
  await browser.close()
})()

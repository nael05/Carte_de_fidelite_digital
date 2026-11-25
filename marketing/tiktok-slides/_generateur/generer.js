#!/usr/bin/env node
/* Génère les carrousels TikTok de Fidelyz.
   Usage : node marketing/tiktok-slides/_generateur/generer.js [filtre]
   - 1080×1920 PNG (format photo TikTok) dans marketing/tiktok-slides/<dossier>/
   - + recadrage Instagram 1080×1350 (centré) dans <dossier>/instagram-4x5/
   - + legende.txt (légende TikTok et hashtags)
   Playwright : variable PLAYWRIGHT_PATH ou /opt/node-tools/node_modules/playwright. */
const fs = require('fs')
const os = require('os')
const path = require('path')
const { pathToFileURL } = require('url')
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright')
const { page: wrap } = require('./lib')
const CARROUSELS = require('./carrousels')

const OUT = path.resolve(__dirname, '..')
const filtre = process.argv[2] || ''

;(async () => {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
  const tab = await ctx.newPage()
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fz-slides-'))

  for (const c of CARROUSELS) {
    if (filtre && !c.dossier.includes(filtre)) continue
    const dir = path.join(OUT, c.dossier)
    const ig = path.join(dir, 'instagram-4x5')
    fs.mkdirSync(ig, { recursive: true })
    const n = c.slides.length
    for (let i = 0; i < n; i++) {
      const s = c.slides[i]
      const html = wrap({ body: s.body, i: i + 1, n, glow: s.glow, logo: !!s.logo })
      const f = path.join(tmp, `${c.dossier}-${i + 1}.html`)
      fs.writeFileSync(f, html)
      await tab.goto(pathToFileURL(f).href)
      await tab.evaluate(() => document.fonts.ready)
      const name = `${String(i + 1).padStart(2, '0')}.png`
      await tab.screenshot({ path: path.join(dir, name) })
      await tab.screenshot({ path: path.join(ig, name), clip: { x: 0, y: 285, width: 1080, height: 1350 } })
    }
    fs.writeFileSync(path.join(dir, 'legende.txt'), c.legende.trim() + '\n')
    console.log(`✓ ${c.dossier} (${n} slides)`)
  }
  await browser.close()
  fs.rmSync(tmp, { recursive: true, force: true })
})().catch(e => { console.error(e); process.exit(1) })

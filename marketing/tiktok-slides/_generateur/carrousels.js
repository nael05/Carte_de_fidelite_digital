/* Contenu des 6 carrousels — suit docs/conseil/05b-carrousels-brief.md (textes exacts, C1 à C6).
   Format 1080×1920 ; zones sûres : texte et éléments clés entre y = 285 et y = 1500, x ≤ 900
   (le recadrage Instagram 1080×1350 centré garde donc tout l'essentiel). */
const L = require('./lib')
const { pass, notif, phone, lockscreen, walletScreen, shot, check, cross, pin, qr, strip } = L

/* ───────── texte ───────── */
// t = phrase principale (titre), s = phrase secondaire ; sFirst : la secondaire passe au-dessus
const T = ({ t, s = '', ts = 100, ss = 60, top = 390, sFirst = false }) => `
<div class="c" style="top:${top}px">
  ${sFirst && s ? `<p class="lead" style="margin:0 0 26px;font-size:${ss}px">${s}</p>` : ''}
  <h2 style="font-size:${ts}px">${t}</h2>
  ${!sFirst && s ? `<p class="lead" style="font-size:${ss}px">${s}</p>` : ''}
</div>`

// Diapo « Papier : … / Wallet : … » (C1)
const VS = ({ p, w }) => `
<div class="c" style="top:390px">
  <div style="display:flex;gap:22px;align-items:flex-start;font-size:58px;line-height:1.18;color:rgba(245,245,247,.5)">
    <span style="flex-shrink:0;margin-top:6px">${cross(60)}</span><span><b style="color:#ff7b72;font-weight:700">Papier :</b> ${p}</span></div>
  <div style="display:flex;gap:22px;align-items:flex-start;margin-top:40px">
    <span style="flex-shrink:0;margin-top:14px">${check('#2997ff', 60)}</span>
    <h2 style="font-size:92px"><span class="grad">Wallet :</span> ${w}</h2></div>
</div>`

const abs = (x, y, html, style = '') => `<div style="position:absolute;left:${x}px;top:${y}px;${style}">${html}</div>`
const arrow = () => abs(80, 1400, `<div style="display:grid;place-items:center;width:88px;height:88px;border-radius:50%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16)">
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`)
const chip = (txt, size = 44) => `<div class="chip" style="font-size:${size}px;padding:${size * 0.45}px ${size * 0.8}px"><i style="width:${size * 0.34}px;height:${size * 0.34}px"></i>${txt}</div>`

/* ───────── cartes de commerces fictifs ───────── */
const art = {
  ciseaux: `<svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="ab" x1="0" x2="1"><stop offset="0" stop-color="#111"/><stop offset="1" stop-color="#2a2218"/></linearGradient></defs>
    <rect width="320" height="120" fill="url(#ab)"/>${Array.from({ length: 14 }, (_, i) => `<path d="M${i * 26 - 60} 120 L${i * 26 + 10} 0" stroke="#c8a46a" stroke-opacity=".16" stroke-width="7"/>`).join('')}
    <g transform="translate(200 22)" fill="none" stroke="#e8c88f" stroke-width="5" stroke-linecap="round"><circle cx="14" cy="62" r="13"/><circle cx="58" cy="62" r="13"/><path d="M24 52 L66 2 M48 52 L6 2"/></g></svg>`,
  ongles: `<svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="ao" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#f7cfda"/><stop offset="1" stop-color="#dc95aa"/></linearGradient></defs>
    <rect width="320" height="120" fill="url(#ao)"/>${[[40, 30, 18], [90, 84, 10], [140, 34, 13], [290, 96, 22], [300, 20, 9]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity=".35"/>`).join('')}
    ${[0, 1, 2, 3, 4].map(i => `<rect x="${172 + i * 22}" y="${34 + Math.abs(2 - i) * 7}" width="16" height="46" rx="8" fill="${['#b0234f', '#e05a80', '#8c1d40', '#f08aa8', '#c23a63'][i]}"/>`).join('')}</svg>`,
  ble: `<svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="aw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe2c8"/><stop offset="1" stop-color="#dcc39d"/></linearGradient></defs>
    <rect width="320" height="120" fill="url(#aw)"/>
    ${[[200, -8], [232, 6], [264, 18]].map(([x, r]) => `<g transform="translate(${x} 112) rotate(${r})"><path d="M0 0 V-92" stroke="#a0743c" stroke-width="3"/>${[0, 1, 2, 3, 4, 5].map(k => `<ellipse cx="-7" cy="${-30 - k * 11}" rx="5" ry="9" transform="rotate(-28 -7 ${-30 - k * 11})" fill="#c8954f"/><ellipse cx="7" cy="${-34 - k * 11}" rx="5" ry="9" transform="rotate(28 7 ${-34 - k * 11})" fill="#b8843f"/>`).join('')}</g>`).join('')}
    <g transform="rotate(-10 90 70)"><rect x="10" y="58" width="150" height="26" rx="13" fill="#c98a42"/>${[0, 1, 2, 3].map(i => `<path d="M${36 + i * 32} 64 q8 7 18 0" stroke="#f1d29c" stroke-width="3.5" fill="none" stroke-linecap="round"/>`).join('')}</g></svg>`,
  couverts: `<svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice"><defs><radialGradient id="ar" cx="70%" cy="50%" r="70%"><stop offset="0" stop-color="#8a2a3a"/><stop offset="1" stop-color="#3a0e17"/></radialGradient></defs>
    <rect width="320" height="120" fill="url(#ar)"/><circle cx="226" cy="60" r="44" fill="#f4e9e2"/><circle cx="226" cy="60" r="32" fill="none" stroke="#d9c6bb" stroke-width="2"/>
    <circle cx="226" cy="58" r="14" fill="#5a2a1a"/><circle cx="231" cy="52" r="4" fill="#d8344a"/>
    <g stroke="#e8d8cf" stroke-width="4" stroke-linecap="round" fill="none"><path d="M160 22 V98 M152 22 V44 Q160 52 168 44 V22"/><path d="M292 22 Q304 50 292 62 V98"/></g>
    <circle cx="60" cy="38" r="16" fill="#f3e3a8" fill-opacity=".85"/><circle cx="66" cy="34" r="14" fill="url(#ar)"/></svg>`,
  fleurs: `<svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice"><rect width="320" height="120" fill="#e6def5"/>
    ${[[200, 50, '#9b7fd1'], [244, 34, '#c86fa0'], [280, 66, '#7d62b8'], [226, 86, '#e39abd']].map(([x, y, c]) => `<g transform="translate(${x} ${y})">${[0, 72, 144, 216, 288].map(a => `<ellipse rx="9" ry="16" cy="-12" transform="rotate(${a})" fill="${c}"/>`).join('')}<circle r="7" fill="#f6d36b"/></g>`).join('')}
    <path d="M40 120 Q70 60 120 40 M70 120 Q90 80 140 70" stroke="#6f8f5a" stroke-width="4" fill="none"/></svg>`,
}

const CARDS = {
  barbier: { name: 'Atelier Nord', mark: 'N', holder: 'YANIS', points: 80, stripHtml: art.ciseaux, bg: '#1c1c1e', ink: '#fff', lab: '#e3c9a4', markBg: 'linear-gradient(135deg,#f6e4c8,#b8926a)', markInk: '#1d1d1f', edge: '#0e0e10' },
  ongles: { name: 'Studio Nacre', mark: 'S', holder: 'LÉA', points: 6, label: 'VISITES', stripHtml: art.ongles, bg: '#f6dfe6', ink: '#4a1027', lab: '#b0234f', markBg: '#b0234f', markInk: '#fff' },
  boulangerie: { name: 'Maison Lumière', mark: 'L', holder: 'PAUL', points: 8, label: 'BAGUETTES', stripHtml: art.ble, bg: '#f7f1e6', ink: '#2b1f12', lab: '#a0743c', markBg: '#2b1f12', markInk: '#f1dcc0' },
  cafe: { name: 'Le Comptoir', mark: 'C', holder: 'INÈS', points: 7, label: 'CAFÉS', stripHtml: null, bg: '#8ea486', ink: '#14200f', lab: '#2f4a2a', markBg: '#14200f', markInk: '#dfe9d6' },
  resto: { name: 'Bistrot Lune', mark: 'B', holder: 'HUGO', points: 3, label: 'DÉJEUNERS', stripHtml: art.couverts, bg: '#5c1a26', ink: '#fbe9ec', lab: '#f0b3bf', markBg: '#f0b3bf', markInk: '#5c1a26' },
  fleurs: { name: 'Fleurs & Co', mark: 'F', holder: 'CHLOÉ', points: 120, stripHtml: art.fleurs, bg: '#f1ecfa', ink: '#2d1f4a', lab: '#7d62b8', markBg: '#7d62b8', markInk: '#fff' },
  demo: { name: 'Fidelyz Café', mark: 'F', holder: 'TOI', points: 10, stripHtml: null, bg: '#0b3a8f', ink: '#fff', lab: '#9fd0ff', markBg: '#fff', markInk: '#0b3a8f' },
}

const card = (key, { w = 380, style = '', points } = {}) => {
  const d = CARDS[key]
  return `<div class="c3" style="--card-w:${w}px;--pass-bg:${d.bg};--ink:${d.ink};--label:${d.lab};--mark-bg:${d.markBg};--mark-ink:${d.markInk};${style}"><div class="c3-face c3-front"><div class="c3-foil"></div>
<div class="wp-head"><div class="wp-logo"><span class="wp-mark">${d.mark}</span><span class="wp-org">${d.name}</span></div>
<div class="wp-hfield"><span class="wp-label">${d.label || 'POINTS'}</span><span class="wp-hval">${points ?? d.points}</span></div></div>
<div class="wp-strip">${d.stripHtml || strip()}</div>
<div class="wp-fields"><div class="wp-col"><span class="wp-label">BONJOUR</span><span class="wp-val-lg">${d.holder}</span></div>
<div class="wp-col wp-right"><span class="wp-label">DÉTAILS DES RÉCOMPENSES</span><span class="wp-val">Au dos</span></div></div>
<div class="wp-barcode"><div class="wp-qr">${qr()}</div><span class="wp-id">N° Carte : 7KQ2M4</span></div></div></div>`
}

/* ───────── dessins ───────── */
const paperCard = ({ x, y, rot = -8, on = 3, total = 10, cols = 5, w = 560, title = 'Maison Lumière', sub = '10 tampons = 1 café offert', style = '', corner = true }) => `
<div class="paper" style="left:${x}px;top:${y}px;width:${w}px;height:auto;transform:rotate(${rot}deg);${corner ? 'clip-path:polygon(0 0,100% 0,100% 82%,90% 100%,0 100%);' : ''}${style}">
  <div class="pt">${title}</div><div class="ps">${sub}</div>
  <div class="stamps" style="grid-template-columns:repeat(${cols},1fr);gap:${cols > 5 ? 12 : 16}px">${Array.from({ length: total }, (_, i) => `<span class="${i < on ? 'on' : ''}"></span>`).join('')}</div>
</div>`

const lockPhone = ({ x = 310, y = 830, w = 460, time = '10:12', notifs = '', style = '' }) =>
  phone({ x, y, w, style, inner: lockscreen({ time, date: 'mardi 2 décembre', notifs }) })

const N = (title, body, time = 'maintenant', key) => {
  const d = CARDS[key] || CARDS.boulangerie
  return notif({ title, body, time, ico: d.mark, icoBg: d.markBg, icoInk: d.markInk })
}

const bigNotif = ({ title, body, time = 'maintenant', key, scale = 1.7 }) => `
<div style="width:${560}px;transform:scale(${scale});transform-origin:0 0">${N(title, body, time, key)}</div>`

const emptyWallet = `<svg width="400" height="300" viewBox="0 0 400 300"><defs><linearGradient id="lw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4226"/><stop offset="1" stop-color="#3e2414"/></linearGradient></defs>
  <rect x="20" y="40" width="360" height="240" rx="30" fill="url(#lw)"/><rect x="20" y="40" width="360" height="240" rx="30" fill="none" stroke="#2a170b" stroke-width="3" stroke-dasharray="6 8" transform="translate(0 0)"/>
  <rect x="60" y="70" width="280" height="120" rx="16" fill="#2c1a0e"/><rect x="74" y="84" width="252" height="92" rx="12" fill="none" stroke="#f5f5f7" stroke-opacity=".35" stroke-width="3" stroke-dasharray="12 10"/>
  <text x="200" y="142" text-anchor="middle" font-family="Inter" font-size="40" font-weight="700" fill="#f5f5f7" fill-opacity=".35">?</text>
  <rect x="20" y="200" width="360" height="80" rx="0" fill="#583520"/><path d="M20 200 H380 V250 Q380 280 350 280 H50 Q20 280 20 250 Z" fill="#583520"/></svg>`

const rubberStamp = `<svg width="380" height="380" viewBox="0 0 380 380">
  <ellipse cx="190" cy="330" rx="140" ry="26" fill="#7a1f1f" opacity=".5"/>
  <rect x="80" y="230" width="220" height="70" rx="12" fill="#7a5a3a"/><rect x="70" y="290" width="240" height="26" rx="6" fill="#3a2a1c"/>
  <path d="M160 230 V140 h60 V230 Z" fill="#a07a50"/><circle cx="190" cy="110" r="56" fill="#c09464"/><circle cx="174" cy="94" r="16" fill="#fff" opacity=".2"/>
  <path d="M40 40 L340 340" stroke="#ff453a" stroke-width="22" stroke-linecap="round"/></svg>`

const curve = `<svg width="820" height="520" viewBox="0 0 820 520"><defs>
  <linearGradient id="cs" x1="0" x2="1"><stop offset="0" stop-color="#5e9cff"/><stop offset=".6" stop-color="#2997ff"/><stop offset="1" stop-color="#e3c9a4"/></linearGradient>
  <linearGradient id="cf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2997ff" stop-opacity=".35"/><stop offset="1" stop-color="#2997ff" stop-opacity="0"/></linearGradient></defs>
  ${[100, 200, 300, 400].map(y => `<path d="M0 ${y} H820" stroke="#fff" stroke-opacity=".07" stroke-width="2"/>`).join('')}
  ${Array.from({ length: 12 }, (_, i) => `<rect x="${20 + i * 66}" y="${470 - (40 + i * 22 + (i % 3) * 18)}" width="40" height="${40 + i * 22 + (i % 3) * 18}" rx="10" fill="#fff" fill-opacity=".06"/>`).join('')}
  <path d="M0 440 C120 430 180 380 280 360 S440 300 520 240 S700 120 820 70 V520 H0 Z" fill="url(#cf)"/>
  <path d="M0 440 C120 430 180 380 280 360 S440 300 520 240 S700 120 820 70" stroke="url(#cs)" stroke-width="10" fill="none" stroke-linecap="round"/>
  <circle cx="820" cy="70" r="18" fill="#e3c9a4"/><circle cx="820" cy="70" r="36" fill="#e3c9a4" fill-opacity=".2"/></svg>`

const fan = (keys, { cx = 540, y = 860, w = 330, step = 12 }) => keys.map((k, i) => {
  const a = (i - (keys.length - 1) / 2) * step
  return abs(cx - w / 2, y, k.startsWith('skin:') ? pass({ w, skin: k.slice(5) }) : card(k, { w }), `transform-origin:50% 140%;transform:rotate(${a}deg);z-index:${i}`)
}).join('')

const door = `
<div style="position:absolute;left:150px;top:800px;width:640px;height:760px;border-radius:24px 24px 0 0;background:#20140b;padding:34px 34px 0;box-shadow:0 60px 120px -40px #000">
  <div style="position:relative;width:100%;height:100%;border-radius:10px 10px 0 0;overflow:hidden;background:linear-gradient(180deg,#5b6f8a,#2b3442 60%,#1a1f27)">
    ${[[90, 160, 70, '#ffd27a'], [300, 120, 50, '#ff9f6e'], [460, 220, 80, '#9fd0ff'], [180, 380, 110, '#ffcf8a'], [420, 440, 60, '#fff'], [60, 520, 90, '#6fa8ff']].map(([x, y, r, c]) => `<div style="position:absolute;left:${x - r}px;top:${y - r}px;width:${r * 2}px;height:${r * 2}px;border-radius:50%;background:${c};opacity:.35;filter:blur(18px)"></div>`).join('')}
    <div style="position:absolute;left:0;right:0;bottom:0;height:200px;background:linear-gradient(180deg,transparent,rgba(0,0,0,.5))"></div>
    <div style="position:absolute;left:50%;top:0;bottom:0;width:22px;margin-left:-11px;background:#20140b"></div>
  </div>
  <svg style="position:absolute;right:-40px;top:-70px" width="120" height="150" viewBox="0 0 120 150"><path d="M60 0 V30" stroke="#8a6a3a" stroke-width="4"/>
    <path d="M24 108 Q24 40 60 36 Q96 40 96 108 Z" fill="#d6a74a"/><rect x="16" y="104" width="88" height="12" rx="6" fill="#b88a32"/><circle cx="60" cy="126" r="11" fill="#b88a32"/></svg>
</div>`

const thinker = `<svg width="720" height="620" viewBox="0 0 720 620">
  <g fill="rgba(255,255,255,.1)" stroke="rgba(255,255,255,.4)" stroke-width="4">
    <ellipse cx="470" cy="150" rx="210" ry="120"/><circle cx="300" cy="300" r="26"/><circle cx="260" cy="350" r="16"/></g>
  <text x="470" y="170" text-anchor="middle" font-family="Inter" font-size="64" font-weight="700" fill="rgba(255,255,255,.25)">. . .</text>
  <circle cx="190" cy="430" r="70" fill="#2a2a30"/><path d="M60 620 Q60 520 190 510 Q320 520 320 620 Z" fill="#2a2a30"/></svg>`

const voucher = `<div style="position:absolute;left:170px;top:880px;width:600px;height:330px;border-radius:24px;background:#3a3a3e;filter:saturate(0);transform:rotate(-5deg);
  box-shadow:0 40px 80px -30px #000;display:flex;align-items:center;overflow:hidden">
  <div style="position:absolute;left:-30px;top:50%;margin-top:-30px;width:60px;height:60px;border-radius:50%;background:#0d0d12"></div>
  <div style="position:absolute;right:-30px;top:50%;margin-top:-30px;width:60px;height:60px;border-radius:50%;background:#0d0d12"></div>
  <div style="position:absolute;left:190px;top:30px;bottom:30px;border-left:4px dashed rgba(255,255,255,.15)"></div>
  <div style="width:190px;text-align:center;font-size:30px;font-weight:600;color:rgba(255,255,255,.3);letter-spacing:.1em">BON</div>
  <div style="flex:1;text-align:center;font-family:'Inter Display';font-weight:800;font-size:150px;color:rgba(255,255,255,.35);letter-spacing:-.04em">−5 %</div></div>`

const drawer = (() => {
  const cols = ['#e9d8b8', '#c94f4f', '#4f7fc9', '#f2f2f2', '#2c2c2c', '#e0a64a', '#7cb47c', '#b78ad6', '#d9c3a0', '#5aa6b8', '#f0d0d8', '#999']
  let cards = ''
  for (let i = 0; i < 22; i++) {
    const x = 30 + ((i * 137) % 560), y = 40 + ((i * 89) % 200), r = ((i * 47) % 70) - 35
    cards += `<div style="position:absolute;left:${x}px;top:${y}px;width:190px;height:118px;border-radius:12px;background:${cols[i % cols.length]};transform:rotate(${r}deg);box-shadow:0 8px 20px rgba(0,0,0,.5)">
      <div style="margin:16px;width:60px;height:12px;border-radius:6px;background:rgba(0,0,0,.18)"></div></div>`
  }
  return `<div style="position:absolute;left:110px;top:900px;width:780px;height:470px;perspective:1200px">
    <div style="position:absolute;inset:0;transform:rotateX(28deg);transform-origin:50% 100%;border-radius:20px;background:#2a1c12;box-shadow:inset 0 0 0 18px #3d2817,0 60px 100px -40px #000;overflow:hidden">${cards}</div>
    <div style="position:absolute;left:-20px;right:-20px;bottom:-110px;height:140px;border-radius:14px;background:linear-gradient(180deg,#4a301c,#2e1d10);box-shadow:0 30px 60px -20px #000">
      <div style="margin:50px auto 0;width:200px;height:26px;border-radius:13px;background:#8a6a42"></div></div></div>`
})()

const shopfront = ({ x, lit, w = 380 }) => `
<div style="position:absolute;left:${x}px;top:900px;width:${w}px;height:520px">
  ${lit ? `<div style="position:absolute;inset:-60px;border-radius:50%;background:radial-gradient(circle,rgba(41,151,255,.45),transparent 65%);filter:blur(20px)"></div>` : ''}
  <div style="position:absolute;left:0;right:0;top:0;height:90px;border-radius:12px 12px 0 0;background:repeating-linear-gradient(90deg,${lit ? '#2997ff 0 38px,#e9f3ff 38px 76px' : '#2a2a2e 0 38px,#1c1c20 38px 76px'})"></div>
  <div style="position:absolute;left:0;right:0;top:90px;bottom:0;background:${lit ? '#1b2a40' : '#141418'};border:6px solid ${lit ? '#2d4a70' : '#222'}">
    <div style="position:absolute;left:24px;right:24px;top:26px;height:230px;border-radius:8px;background:${lit ? 'linear-gradient(180deg,#ffe2a8,#f5b25f)' : '#0b0b0d'};box-shadow:${lit ? '0 0 60px rgba(255,200,120,.6)' : 'none'}"></div>
    <div style="position:absolute;left:50%;margin-left:-55px;bottom:0;width:110px;height:150px;background:${lit ? '#3a5e8f' : '#1a1a1e'}"></div>
  </div>
  ${lit ? `<div style="position:absolute;right:-26px;top:-60px;display:flex;flex-direction:column;gap:12px">
    ${[1, 0.7].map(o => `<div style="width:92px;height:56px;border-radius:16px;background:#2997ff;opacity:${o};display:grid;place-items:center"><svg width="40" height="30" viewBox="0 0 40 30"><rect x="4" y="6" width="22" height="4" rx="2" fill="#fff"/><rect x="4" y="16" width="32" height="4" rx="2" fill="#fff" opacity=".7"/></svg></div>`).join('')}</div>` : ''}
</div>`

const bookmark = `<svg width="300" height="360" viewBox="0 0 300 360"><defs><linearGradient id="bk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5e9cff"/><stop offset="1" stop-color="#e3c9a4"/></linearGradient></defs>
  <path d="M40 30 Q40 10 60 10 H240 Q260 10 260 30 V340 L150 260 L40 340 Z" fill="url(#bk)"/></svg>`

const ticket = (code = 'TIKTOK') => `
<div style="position:relative;width:820px;height:300px;border-radius:30px;background:linear-gradient(135deg,#2997ff,#1d5fd1 55%,#e3c9a4 140%);display:flex;align-items:center;box-shadow:0 50px 100px -40px rgba(41,151,255,.8);transform:rotate(-3deg)">
  <div style="position:absolute;left:-34px;top:50%;margin-top:-34px;width:68px;height:68px;border-radius:50%;background:#0e0e13"></div>
  <div style="position:absolute;right:-34px;top:50%;margin-top:-34px;width:68px;height:68px;border-radius:50%;background:#0e0e13"></div>
  <div style="position:absolute;left:230px;top:34px;bottom:34px;border-left:5px dashed rgba(255,255,255,.45)"></div>
  <div style="width:230px;display:grid;place-items:center"><img src="${L.A.logo}" style="width:130px;height:130px"></div>
  <div style="flex:1;text-align:center;font-family:'DejaVu Sans Mono',monospace;font-weight:700;font-size:118px;letter-spacing:.06em;color:#fff">${code}</div></div>`

const planCard = ({ name, price, per = 'TTC / mois', w = 560, accent = false }) => `
<div class="tile" style="width:${w}px;padding:44px 50px;${accent ? 'border-color:rgba(41,151,255,.6);background:linear-gradient(180deg,rgba(41,151,255,.2),rgba(41,151,255,.04));box-shadow:0 0 140px -40px rgba(41,151,255,.7)' : ''}">
  <div style="font-size:46px;font-weight:700">${name}</div>
  <div style="display:flex;align-items:baseline;gap:16px;margin-top:20px"><span class="price" style="font-size:170px">${price}</span><span class="ttc" style="font-size:36px">${per}</span></div></div>`

const formMock = `
<div class="tile" style="position:absolute;left:150px;top:880px;width:640px;padding:44px 46px;display:flex;flex-direction:column;gap:26px">
  <div style="display:flex;align-items:center;gap:28px">
    <div style="width:140px;height:140px;border-radius:30px;background:linear-gradient(135deg,#f6e4c8,#b8926a);display:grid;place-items:center;font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:64px;color:#1d1d1f;box-shadow:0 0 0 6px rgba(41,151,255,.5)">N</div>
    <div><div style="font-size:30px;font-weight:600">logo-atelier-nord.png</div><div style="font-size:24px;color:#2997ff;margin-top:6px;font-weight:600">${check('#2997ff', 26)} Importé</div></div></div>
  ${[['Nom du commerce', 'Atelier Nord'], ['Email', 'contact@atelier-nord.fr']].map(([l, v]) => `
  <div><div style="font-size:24px;color:rgba(245,245,247,.55);margin-bottom:10px">${l}</div>
  <div style="font-size:32px;padding:20px 24px;border-radius:16px;background:#000;border:1px solid rgba(255,255,255,.12)">${v}</div></div>`).join('')}
  <div style="text-align:center;font-size:32px;font-weight:600;padding:22px;border-radius:999px;background:#2997ff">Créer mon espace</div></div>`

const studioMock = `
<div class="tile" style="position:absolute;left:80px;top:840px;width:500px;padding:40px 40px;display:flex;flex-direction:column;gap:26px;z-index:2">
  <div style="font-size:26px;color:rgba(245,245,247,.55)">Couleurs</div>
  <div style="display:flex;gap:22px">${['#1c1c1e', '#0b3a8f', '#dcc39d', '#f5f5f7'].map((c, i) => `<span style="width:78px;height:78px;border-radius:50%;background:${c};box-shadow:${i === 0 ? '0 0 0 5px #000,0 0 0 10px #2997ff' : 'inset 0 0 0 2px rgba(255,255,255,.2)'}"></span>`).join('')}</div>
  <div style="font-size:26px;color:rgba(245,245,247,.55);margin-top:8px">Récompense</div>
  <div style="font-size:31px;padding:22px 24px;border-radius:16px;background:#000;border:1px solid rgba(41,151,255,.6)">Coupe offerte à 100 pts</div></div>
${abs(560, 940, card('barbier', { w: 330 }), 'transform:rotate(5deg)')}`

const easel = `
<div style="position:absolute;left:0;right:0;top:1330px;height:600px;background:linear-gradient(180deg,#5a3a22,#2e1d10);box-shadow:0 -2px 0 #7a5434"></div>
<div style="position:absolute;left:250px;top:830px;width:440px;height:560px;perspective:1400px">
  <div style="position:absolute;inset:0;transform:rotateX(8deg);transform-origin:50% 100%;border-radius:22px;background:#f7f4ee;padding:40px;display:flex;flex-direction:column;align-items:center;gap:22px;box-shadow:0 40px 60px -20px rgba(0,0,0,.9)">
    <div style="display:flex;align-items:center;gap:14px;color:#1d1d1f;font-weight:700;font-size:30px"><span style="width:52px;height:52px;border-radius:12px;background:linear-gradient(135deg,#f6e4c8,#b8926a);display:grid;place-items:center;font-family:Georgia,serif;font-style:italic">N</span>Atelier Nord</div>
    <div style="width:300px;height:300px;color:#000">${qr()}</div>
    <div style="width:220px;height:10px;border-radius:5px;background:#d9d3c8"></div></div></div>`

const scanPhone = `
${phone({ x: 120, y: 860, w: 400, inner: `<div style="position:absolute;inset:0;background:linear-gradient(180deg,#3b3026,#1c1712)">
  <div style="position:absolute;left:84px;top:260px;width:200px;height:200px;color:#111;background:#f7f4ee;padding:16px;border-radius:12px">${qr()}</div>
  ${[[64, 240, 'tl'], [304, 240, 'tr'], [64, 480, 'bl'], [304, 480, 'br']].map(([x, y, c]) => `<div style="position:absolute;left:${x - (c[1] === 'r' ? 40 : 0)}px;top:${y - (c[0] === 'b' ? 40 : 0)}px;width:40px;height:40px;border:${'6px solid #ffd60a'};${c[0] === 't' ? 'border-bottom:none' : 'border-top:none'};${c[1] === 'l' ? 'border-right:none' : 'border-left:none'};border-radius:6px"></div>`).join('')}
</div>` })}
${abs(560, 980, `<svg width="120" height="60" viewBox="0 0 120 60"><path d="M6 30 H100 M80 10 l22 20 -22 20" stroke="#2997ff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`)}
${abs(560, 1060, card('barbier', { w: 320, points: 0 }), 'transform:rotate(4deg)')}`

const calendar = `
<div class="tile" style="position:absolute;left:80px;top:880px;width:620px;padding:38px 40px">
  <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:14px;text-align:center;font-size:26px;font-weight:600;color:rgba(245,245,247,.5)">
    ${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<span>${d}</span>`).join('')}
    ${Array.from({ length: 28 }, (_, i) => `<div style="aspect-ratio:1;border-radius:16px;background:rgba(255,255,255,.04);display:grid;place-items:center">${[1, 4, 9, 12, 15, 19, 23, 26].includes(i) ? '<span style="width:26px;height:26px;border-radius:50%;background:#2997ff;box-shadow:0 0 14px #2997ff"></span>' : ''}</div>`).join('')}
  </div></div>
${abs(720, 900, `<svg width="170" height="170" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="rgba(255,255,255,.06)" stroke="rgba(255,255,255,.15)" stroke-width="2"/>
  <path d="M60 24 A28 28 0 1 0 74 62 A22 22 0 1 1 60 24 Z" fill="#e3c9a4"/><path d="M18 18 L82 82" stroke="#ff453a" stroke-width="7" stroke-linecap="round"/></svg>`)}`

const streetMap = `
<div style="position:absolute;left:60px;top:860px;width:520px;height:620px;border-radius:36px;overflow:hidden;background:#13161d;border:1px solid rgba(255,255,255,.08)">
  <svg width="520" height="620" viewBox="0 0 520 620">
    <g stroke="#252a35" stroke-width="34" fill="none"><path d="M-20 160 H560"/><path d="M-20 420 H560"/><path d="M140 -20 V640"/><path d="M380 -20 V640"/><path d="M-20 600 L560 -10" stroke-width="22"/></g>
    <path d="M60 560 C 120 470, 140 430, 260 420" stroke="#2997ff" stroke-width="6" stroke-dasharray="4 14" stroke-linecap="round" fill="none"/>
    <circle cx="260" cy="420" r="70" fill="#2997ff" fill-opacity=".18"/><circle cx="260" cy="420" r="16" fill="#2997ff" stroke="#fff" stroke-width="5"/>
  </svg>
  <div style="position:absolute;left:226px;top:254px">${pin(70, '#e3c9a4')}</div></div>
${lockPhone({ x: 520, y: 900, w: 380, time: '12:40', notifs: `<div style="border-radius:28px;padding:20px;background:rgba(40,40,46,.75);border:1px solid rgba(255,255,255,.1);display:flex;gap:16px;align-items:center">
  <span style="width:56px;height:56px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#f6e4c8,#b8926a);color:#1d1d1f;font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:28px">N</span>
  <div><div style="font-size:22px;font-weight:700">Atelier Nord</div><div style="font-size:19px;color:rgba(245,245,247,.7);margin-top:2px">À proximité · 80 points</div></div></div>` })}`

const toggle = `
<div style="position:absolute;left:110px;top:920px;width:720px;height:150px;border-radius:999px;background:#1c1c1f;border:1px solid rgba(255,255,255,.1);padding:12px;display:flex">
  <div style="flex:1;display:grid;place-items:center;font-size:40px;font-weight:600;color:rgba(245,245,247,.5)">Mensuel</div>
  <div style="flex:1.2;display:flex;align-items:center;justify-content:center;gap:16px;border-radius:999px;background:#2997ff;font-size:40px;font-weight:700">Annuel <span style="padding:6px 16px;border-radius:999px;background:#fff;color:#0b3a8f;font-size:32px">−20 %</span></div></div>`

const coffee = `<svg width="360" height="360" viewBox="0 0 360 360"><defs><radialGradient id="cfe" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#d9a46a"/><stop offset=".6" stop-color="#8a4f22"/><stop offset="1" stop-color="#3d1f0b"/></radialGradient></defs>
  <ellipse cx="180" cy="300" rx="160" ry="40" fill="#e9e4dd"/><ellipse cx="180" cy="292" rx="120" ry="26" fill="#cfc7bb"/>
  <path d="M70 130 H290 L270 270 Q262 300 230 300 H130 Q98 300 90 270 Z" fill="#f4f1ec"/><ellipse cx="180" cy="130" rx="110" ry="30" fill="#f8f6f2"/><ellipse cx="180" cy="132" rx="94" ry="22" fill="url(#cfe)"/>
  <path d="M286 160 Q340 165 330 210 Q322 245 276 240" stroke="#f4f1ec" stroke-width="20" fill="none"/>
  <g stroke="#fff" stroke-opacity=".35" stroke-width="7" fill="none" stroke-linecap="round"><path d="M150 90 q-14 -24 0 -44 q14 -20 0 -40"/><path d="M200 90 q-14 -24 0 -44 q14 -20 0 -40"/></g></svg>`

const miniShops = `<div style="position:absolute;left:110px;top:1210px;display:flex;gap:30px">${[0, 1, 2].map(i => `
  <div style="width:150px;height:150px;position:relative"><div style="height:40px;border-radius:8px 8px 0 0;background:repeating-linear-gradient(90deg,#2997ff 0 18px,#e9f3ff 18px 36px)"></div>
  <div style="height:110px;background:#1b2a40;border:4px solid #2d4a70;position:relative"><div style="position:absolute;left:12px;right:12px;top:12px;height:46px;border-radius:4px;background:linear-gradient(180deg,#ffe2a8,#f5b25f)"></div>
  <div style="position:absolute;left:50%;margin-left:-18px;bottom:0;width:36px;height:42px;background:#3a5e8f"></div></div></div>`).join('')}</div>
${abs(660, 1220, `<div style="display:flex;flex-direction:column;gap:16px">${[0, 1, 2].map(i => `<div style="width:70px;height:70px;border-radius:50%;background:${['#5e9cff', '#e3c9a4', '#a9cdf2'][i]};margin-left:${i * 40}px;border:4px solid #0e0e13"></div>`).join('')}</div>`)}`

const comments = `
<div style="position:absolute;left:80px;top:900px;display:flex;flex-direction:column;gap:26px;width:780px">
  ${[['Karim', 'coiffeur ?', 0], ['Julie', 'fleuriste ?', 120], ['Sam', 'boulangerie ?', 40]].map(([n, t, dx], i) => `
  <div style="margin-left:${dx}px;display:flex;gap:20px;align-items:flex-start;opacity:${1 - i * 0.12}">
    <span style="width:84px;height:84px;border-radius:50%;flex-shrink:0;background:${['#5e9cff', '#e3c9a4', '#9b7fd1'][i]};display:grid;place-items:center;font-size:36px;font-weight:700;color:#0e0e13">${n[0]}</span>
    <div style="padding:24px 34px;border-radius:12px 40px 40px 40px;background:#1f1f24;border:1px solid rgba(255,255,255,.1)">
      <div style="font-size:24px;color:rgba(245,245,247,.5);font-weight:600">${n}</div><div style="font-size:46px;font-weight:600;margin-top:4px">${t}</div></div></div>`).join('')}
</div>`

/* ═════════════ CARROUSELS ═════════════ */
module.exports = [

/* ── C1 — Carte papier vs carte Wallet ── */
{
  dossier: 'c1-carte-papier-vs-wallet',
  legende: `Carte papier vs carte Wallet : le match, en 8 slides. Tu choisis laquelle ?

Ta carte de fidélité dans le téléphone de tes clients (Apple Wallet et Google Wallet), sans appli à installer. Gratuit jusqu'à 15 clients, lien en bio.

#commerçant #cartedefidelite #applewallet #commercelocal`,
  slides: [
    { logo: true, body: `${T({ t: 'Carte papier <span class="dim">vs</span> <span class="grad">carte Wallet.</span>', s: 'Le match.', ts: 108 })}
${paperCard({ x: 10, y: 980, rot: -12, on: 4, w: 470 })}
${phone({ x: 560, y: 820, w: 360, inner: walletScreen(pass({ w: 290 })) })}
${abs(420, 1000, `<div style="display:grid;place-items:center;width:150px;height:150px;border-radius:50%;background:linear-gradient(135deg,#2997ff,#e3c9a4);font-family:'Inter Display';font-weight:900;font-size:64px;box-shadow:0 0 0 12px #0e0e13,0 20px 60px rgba(41,151,255,.5)">VS</div>`, 'z-index:9')}` },
    { body: `${VS({ p: 'oubliée à la maison.', w: 'toujours dans le téléphone.' })}
${abs(40, 1020, emptyWallet, 'transform:rotate(-6deg)')}
${phone({ x: 500, y: 940, w: 380, inner: walletScreen(pass({ w: 306 })) })}` },
    { body: `${VS({ p: 'perdue au 9e tampon.', w: 'impossible à perdre.' })}
${paperCard({ x: 30, y: 980, rot: 24, on: 9, w: 440, style: 'opacity:.75;filter:blur(1.5px)' })}
${abs(10, 940, `<svg width="420" height="200" viewBox="0 0 420 200"><g stroke="#fff" stroke-opacity=".25" stroke-width="6" stroke-linecap="round" fill="none"><path d="M10 60 Q120 20 220 60"/><path d="M40 120 Q150 80 260 120"/><path d="M10 180 Q110 150 200 170"/></g></svg>`)}
${abs(510, 930, card('cafe', { w: 360, points: 90 }).replace('CAFÉS', 'POINTS'), 'transform:rotate(4deg)')}` },
    { body: `${VS({ p: 'un tampon, ça se triche.', w: 'points ajoutés au scan.' })}
${abs(40, 990, rubberStamp)}
${abs(500, 940, pass({ w: 360, points: 490 }))}
${abs(600, 900, chip('+10 pts', 50), 'z-index:5')}` },
    { body: `${VS({ p: 'muette.', w: 'un message sur l\'écran verrouillé.' })}
${lockPhone({ x: 300, y: 900, w: 480, time: '10:12', notifs: N('Maison Lumière', 'Plus que 10 points avant ton café', 'maintenant', 'boulangerie') })}` },
    { body: `${VS({ p: 'rien à analyser.', w: 'tu vois qui revient.' })}
${abs(80, 980, curve)}` },
    { body: `${T({ t: 'Zéro appli <span class="grad">pour tes clients.</span>', s: 'Gratuit jusqu\'à 15 clients.' })}
${fan(['skin:ivory', 'skin:champagne', 'skin:azur', 'skin:graphite'], { y: 900, w: 330, step: 13 })}` },
    { logo: true, body: `${T({ t: 'Crée ta carte <span class="grad">en 5 minutes.</span>', ts: 108 })}
${abs(80, 760, `<div style="display:inline-flex;align-items:center;gap:22px;padding:34px 56px;border-radius:999px;background:#2997ff;font-size:60px;font-weight:700;box-shadow:0 30px 80px -20px rgba(41,151,255,.8)">Lien en bio
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none"><path d="M12 19V5M6 11l6-6 6 6" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></div>`)}
${abs(520, 960, pass({ w: 360 }), 'transform:rotate(8deg)')}` },
  ],
},

/* ── C2 — 5 raisons pour lesquelles tes clients ne reviennent pas ── */
{
  dossier: 'c2-5-raisons-clients-reviennent-pas',
  legende: `5 raisons pour lesquelles tes clients ne reviennent pas. Enregistre ce post et relis-le avant ta prochaine semaine creuse.

La solution : une carte de fidélité dans leur téléphone, qui leur rappelle de revenir. Gratuit pour commencer, lien en bio.

#astuce #commerçant #fidelisation #petitcommerce`,
  slides: [
    { logo: true, body: `${T({ t: '5 raisons', s: 'pour lesquelles tes clients <b>ne reviennent pas.</b>', ts: 150, ss: 64 })}${door}`, glow: [[540, 1100, 520, 0.18], [900, 380, 420, 0.2]] },
    { body: `${T({ t: '<span class="grad">1.</span> Ils ont oublié que tu existes.' })}${abs(140, 860, thinker)}` },
    { body: `${T({ t: '<span class="grad">2.</span> Ta récompense est trop loin :', s: '20 tampons, c\'est décourageant.' })}
${paperCard({ x: 150, y: 1000, rot: -4, on: 3, total: 20, cols: 5, w: 620, sub: '20 tampons = 1 café offert', corner: false })}` },
    { body: `${T({ t: '<span class="grad">3.</span> Ta récompense ne fait envie à personne.' })}${voucher}` },
    { body: `${T({ t: '<span class="grad">4.</span> Ta carte est restée dans un autre portefeuille.', ts: 92 })}${drawer}` },
    { body: `${T({ t: '<span class="grad">5.</span> Le concurrent d\'à côté leur envoie des offres.', s: 'Toi non.', ts: 92 })}
${shopfront({ x: 80, lit: false })}${shopfront({ x: 500, lit: true })}` },
    { body: `${T({ t: 'La solution :', s: 'une carte dans leur téléphone <b>qui leur rappelle de revenir.</b>', ts: 100 })}
${lockPhone({ x: 300, y: 880, w: 480, time: '11:30', notifs: N('Maison Lumière', 'Ta carte : plus que 10 points avant ton café', 'maintenant', 'boulangerie') + `<div style="transform:scale(.92);transform-origin:50% 0;margin-top:6px">${pass({ w: 400 })}</div>` })}` },
    { logo: true, body: `${T({ t: 'Enregistre <span class="grad">ce post.</span>', s: 'Ta carte gratuite : lien en bio.', ts: 120 })}
${abs(560, 900, bookmark)}` },
  ],
},

/* ── C3 — Ta carte de fidélité en 3 étapes ── */
{
  dossier: 'c3-ta-carte-en-3-etapes',
  legende: `Ta carte de fidélité dans le téléphone de tes clients, en 3 étapes :
1. Crée ton espace et importe ton logo
2. Choisis tes couleurs et ta récompense
3. Pose le QR code en caisse

iPhone et Android, aucune appli à installer. Code TIKTOK : 1er mois Pro offert. Lien en bio.

#tuto #commerçant #tpe #applewallet`,
  slides: [
    { logo: true, body: `${T({ t: 'Ta carte de fidélité <span class="grad">dans le téléphone de tes clients.</span>', s: '3 étapes.', ts: 96 })}
${abs(70, 1010, `<div class="price" style="font-size:250px;display:flex;gap:30px"><span class="grad">1</span><span style="color:rgba(255,255,255,.25)">2</span><span style="color:rgba(255,255,255,.12)">3</span></div>`)}
${phone({ x: 560, y: 940, w: 360, inner: walletScreen(card('barbier', { w: 290 })) })}` },
    { body: `${T({ t: '<span class="grad">Étape 1 :</span> crée ton espace et importe ton logo.', s: 'Deux minutes.', ts: 92 })}${formMock}` },
    { body: `${T({ t: '<span class="grad">Étape 2 :</span> choisis tes couleurs et ta récompense.', ts: 92 })}${studioMock}` },
    { body: `${T({ t: '<span class="grad">Étape 3 :</span> pose le QR code en caisse.', ts: 100 })}${easel}` },
    { body: `${T({ t: 'Ton client scanne.', s: 'La carte s\'ajoute <b>à son Wallet.</b>', ts: 104 })}${scanPhone}` },
    { body: `${T({ t: 'Tu scannes sa carte à chaque passage.', s: 'Les points <b>tombent.</b>', ts: 92 })}
${shot({ name: 'caisse-points', x: 150, y: 920, w: 620, y0: 380, y1: 700, fade: false })}
${abs(560, 860, chip('+10 pts', 52), 'z-index:6')}` },
    { body: `${T({ t: 'iPhone et Android.', s: 'Aucune appli <b>à installer.</b>', ts: 108 })}
${phone({ x: 80, y: 860, w: 380, inner: walletScreen(card('barbier', { w: 306 })) })}
${phone({ x: 500, y: 900, w: 380, android: true, inner: `<div style="position:absolute;inset:0;background:#0f1115">${L.sbar()}<div style="position:absolute;top:96px;left:34px;font-size:32px;font-weight:500">Wallet</div><div style="position:absolute;top:168px;left:26px">${L.gpass({ w: 296, bg: '#1c1c1e' }).replace('Maison Lumière', 'Atelier Nord').replace('>L<', '>N<')}</div></div>` })}` },
    { logo: true, body: `${T({ t: '1er mois Pro offert <span class="grad">avec le code TIKTOK.</span>', s: 'Lien en bio.', ts: 96 })}
${abs(110, 990, ticket())}` },
  ],
},

/* ── C4 — Ce que voit ton client sur son écran ── */
{
  dossier: 'c4-ce-que-voit-ton-client',
  legende: `Voilà ce que voit ton client quand tu lui envoies un message : pas un SMS, pas un e-mail, sa carte de fidélité sur son écran verrouillé.

Un message par jour maximum, jamais la nuit. Messages illimités avec l'offre Pro : 19 € TTC par mois, sans engagement. Essaie la carte de démo, lien en bio.

#notification #iphone #commerçant #marketinglocal`,
  slides: [
    { logo: true, body: `${T({ t: 'Ce que voit ton client <span class="grad">quand tu lui envoies un message.</span>', ts: 96 })}
${lockPhone({ x: 310, y: 840, w: 480, time: '11:30', style: 'filter:blur(5px);opacity:.9', notifs: N('Le Comptoir', 'Plus que 10 points avant ton café offert.', 'maintenant', 'cafe') })}` },
    { body: `${T({ t: 'Pas un SMS. Pas un e-mail.', s: '<b>Sa carte de fidélité.</b>', ts: 100, sFirst: false })}
${lockPhone({ x: 300, y: 860, w: 480, time: '11:30', notifs: N('Le Comptoir', 'Plus que 10 points avant ton café offert.', 'maintenant', 'cafe') })}` },
    { body: `${T({ t: '« Plus que 10 points <span class="grad">avant ton café offert.</span> »', ts: 100 })}
${abs(90, 960, bigNotif({ title: 'Le Comptoir', body: 'Plus que 10 points avant ton café offert.', key: 'cafe', scale: 1.5 }))}` },
    { body: `${T({ t: '« Créneaux libres cet après-midi : <span class="grad">−20 % sur ta coupe.</span> »', ts: 92 })}
${lockPhone({ x: 300, y: 900, w: 480, time: '13:05', notifs: N('Atelier Nord', 'Créneaux libres cet après-midi : −20 % sur ta coupe.', 'maintenant', 'barbier') })}` },
    { body: `${T({ t: 'ta carte remonte <span class="grad">sur son écran.</span>', s: 'Et quand il passe devant ta boutique,', ts: 100, sFirst: true })}${streetMap}` },
    { body: `${T({ t: 'Un message par jour maximum. <span class="grad">Jamais la nuit.</span>', s: 'Tes clients ne sont pas spammés.', ts: 92 })}${calendar}` },
    { body: `${T({ t: 'Messages illimités <span class="grad">avec l\'offre Pro :</span>', s: '19 € TTC par mois, sans engagement.', ts: 96 })}
${abs(190, 960, planCard({ name: 'Pro', price: '19 €', accent: true }))}` },
    { logo: true, body: `${T({ t: 'Essaie la carte de démo <span class="grad">dans ton Wallet.</span>', s: 'Lien en bio.', ts: 100 })}
${abs(500, 900, card('demo', { w: 380 }), 'transform:rotate(5deg)')}` },
  ],
},

/* ── C5 — Combien coûte une carte de fidélité ? ── */
{
  dossier: 'c5-combien-ca-coute',
  legende: `Une carte de fidélité dans le Wallet, ça coûte combien ? Réponse claire, prix TTC :

Gratuit : jusqu'à 15 clients
Pro : 19 € TTC/mois, clients illimités + messages sur l'écran verrouillé (1 par jour)
Business : 39 € TTC/mois, jusqu'à 10 boutiques et ton équipe
Annuel : −20 %, sans engagement.

Code TIKTOK : ton premier mois Pro offert. Lien en bio.

#prix #tpe #entrepreneur #commerçant`,
  slides: [
    { logo: true, body: `${T({ t: 'Une carte de fidélité dans le Wallet, <span class="grad">ça coûte combien ?</span>', ts: 96 })}
${abs(420, 880, pass({ w: 400 }), 'transform:rotate(8deg);opacity:.45;filter:blur(2px)')}
${abs(170, 760, `<div class="price grad" style="font-size:640px;line-height:1">?</div>`, 'z-index:3')}` },
    { body: `${T({ t: 'Gratuit : <span class="grad">jusqu\'à 15 clients.</span>', s: 'Pour essayer sans risque.' })}
${abs(190, 960, planCard({ name: 'Gratuit', price: '0 €', per: '' }))}` },
    { body: `${T({ t: 'Pro : <span class="grad">19 € TTC par mois.</span>', s: 'Clients illimités.' })}
${abs(190, 960, planCard({ name: 'Pro', price: '19 €', accent: true }))}` },
    { body: `${T({ t: 'Pro : messages sur l\'écran verrouillé, <span class="grad">un par jour.</span>', ts: 92 })}
${lockPhone({ x: 300, y: 900, w: 480, time: '15:20', notifs: N('Studio Nacre', 'Un créneau vient de se libérer à 16 h.', 'maintenant', 'ongles') })}` },
    { body: `${T({ t: 'Business : <span class="grad">39 € TTC par mois.</span>', s: 'Jusqu\'à 10 boutiques et ton équipe.' })}
${abs(190, 900, planCard({ name: 'Business', price: '39 €' }))}${miniShops}` },
    { body: `${T({ t: 'Annuel : <span class="grad">−20 %.</span>', s: 'Sans engagement, résiliable en deux clics.', ts: 120 })}${toggle}` },
    { body: `${T({ t: 'Moins qu\'un café par jour <span class="grad">pour faire revenir tes clients.</span>', ts: 92 })}
${abs(70, 1020, coffee)}${abs(500, 920, card('cafe', { w: 360 }), 'transform:rotate(6deg)')}` },
    { logo: true, body: `${T({ t: 'Code TIKTOK : <span class="grad">ton premier mois Pro offert.</span>', s: 'Lien en bio.', ts: 96 })}
${abs(110, 990, ticket())}` },
  ],
},

/* ── C6 — Barbier, onglerie, boulangerie : ta carte ── */
{
  dossier: 'c6-ta-carte-par-metier',
  legende: `Barbier, onglerie, boulangerie, café, restaurant : ta carte de fidélité peut ressembler à ça, dans le Wallet de tes clients.

Commente ton métier : je crée ta carte en vidéo.

#barbier #onglerie #boulangerie #commerçant`,
  slides: [
    { logo: true, body: `${T({ t: 'Ta carte de fidélité <span class="grad">peut ressembler à ça.</span>', s: 'Trouve ton métier.', ts: 100 })}
${fan(['fleurs', 'resto', 'cafe', 'boulangerie', 'ongles', 'barbier'], { y: 930, w: 300, step: 11 })}` },
    ...[
      ['barbier', '<span class="grad">Barbier :</span> 10e coupe offerte.'],
      ['ongles', '<span class="grad">Onglerie :</span> une pose offerte toutes les 8 visites.'],
      ['boulangerie', '<span class="grad">Boulangerie :</span> la 10e baguette est pour nous.'],
      ['cafe', '<span class="grad">Café :</span> le 10e café offert.'],
      ['resto', '<span class="grad">Restaurant :</span> ton dessert offert au 5e déjeuner.'],
    ].map(([k, t]) => ({ body: `${T({ t, ts: 100 })}${abs(300, 860, card(k, { w: 460 }), 'transform:rotate(-3deg)')}`, glow: [[900, 420, 560, 0.22], [160, 1300, 520, 0.16]] })),
    { body: `${T({ t: 'Ton logo. Tes couleurs.', s: 'Dans le Wallet <b>de tes clients.</b>', ts: 104 })}
${phone({ x: 300, y: 860, w: 480, inner: `<div style="position:absolute;inset:0;background:#000">${L.sbar()}
<div style="position:absolute;top:88px;left:36px;font-family:'Inter Display';font-weight:700;font-size:44px">Cartes</div>
${['fleurs', 'resto', 'cafe', 'ongles', 'boulangerie'].map((k, i) => `<div style="position:absolute;left:28px;top:${170 + i * 76}px">${card(k, { w: 392 })}</div>`).join('')}
<div style="position:absolute;left:28px;top:${170 + 5 * 76}px">${card('barbier', { w: 392 })}</div></div>` })}` },
    { logo: true, body: `${T({ t: 'Commente ton métier :', s: 'je crée ta carte <b>en vidéo.</b>', ts: 108 })}${comments}` },
  ],
},
]

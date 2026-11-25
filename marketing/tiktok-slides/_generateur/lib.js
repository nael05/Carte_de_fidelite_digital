/* Fidelyz — kit graphique des carrousels TikTok (1080×1350).
   Chaque slide = un fragment HTML ; `page()` l'enveloppe avec le fond, l'en-tête
   et la numérotation. Toutes les maquettes sont dessinées en HTML/CSS/SVG. */
const path = require('path')
const { pathToFileURL } = require('url')

const REPO = path.resolve(__dirname, '../../..')
const asset = rel => pathToFileURL(path.join(REPO, rel)).href
const A = {
  logo: asset('frontend/public/logo-fidelyz.png'),
  apple: asset('frontend/public/apple-wallet-button.png'),
  google: asset('frontend/public/google-wallet-button.svg'),
  ecran: n => asset(`video/public/explication/ecrans/${n}.png`),
}

/* Typographie française : espaces insécables avant ? ! : ; € % et après « */
const fr = s => s
  .replace(/ ([?!:;»€%])/g, ' $1')
  .replace(/« /g, '« ')

/* ───────────── CSS global ───────────── */
const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden;background:#000}
body{font-family:"Inter",sans-serif;color:#f5f5f7;-webkit-font-smoothing:antialiased;font-feature-settings:"cv11","ss01"}
.slide{position:relative;width:1080px;height:1920px;overflow:hidden;background:radial-gradient(120% 60% at 50% 0%,#15151c,#0b0b0f 70%)}
.glow{position:absolute;border-radius:50%;filter:blur(40px);pointer-events:none}
.grain{position:absolute;inset:0;opacity:.05;pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")}
.hd{position:absolute;top:300px;left:80px;right:180px;display:flex;align-items:center;justify-content:space-between;z-index:20}
.brand{display:flex;align-items:center;gap:14px;font-family:"Inter Display";font-weight:700;font-size:30px;letter-spacing:-.01em}
.brand img{width:52px;height:52px}
.num{font-size:24px;font-weight:600;color:rgba(245,245,247,.4);font-variant-numeric:tabular-nums;letter-spacing:.06em}
.c{position:absolute;left:80px;right:180px;z-index:5}
.eyebrow{display:inline-flex;align-items:center;gap:12px;font-size:28px;font-weight:600;color:#2997ff;letter-spacing:.01em;margin-bottom:22px}
.eyebrow .step{display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:#2997ff;color:#fff;font-weight:800;font-size:24px}
h1,h2{font-family:"Inter Display";font-weight:800;letter-spacing:-.035em;line-height:1.02;color:#fff}
h1{font-size:104px}
h2{font-size:96px}
.grad{background-image:linear-gradient(100deg,#5e9cff 0%,#2997ff 30%,#a9cdf2 65%,#e3c9a4 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.dim{color:rgba(245,245,247,.42)}
.lead{font-size:60px;line-height:1.2;color:rgba(245,245,247,.72);font-weight:400;margin-top:26px;letter-spacing:-.01em}
.lead b{color:#fff;font-weight:600}
.small{font-size:28px;line-height:1.35;color:rgba(245,245,247,.55)}
.swipe{position:absolute;left:80px;bottom:190px;display:flex;align-items:center;gap:14px;font-size:30px;font-weight:600;color:#fff;z-index:20;
  padding:16px 28px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14)}
.chip{display:inline-flex;align-items:center;gap:12px;padding:14px 24px;border-radius:999px;background:rgba(28,28,30,.92);
  border:1px solid rgba(255,255,255,.12);font-size:28px;font-weight:600;color:#fff;box-shadow:0 20px 40px -16px rgba(0,0,0,.8)}
.chip i{width:14px;height:14px;border-radius:50%;background:#2997ff;box-shadow:0 0 12px #2997ff}
.list{list-style:none;display:flex;flex-direction:column;gap:22px;margin-top:40px}
.list li{display:flex;gap:20px;align-items:flex-start;font-size:36px;line-height:1.25;color:rgba(245,245,247,.88)}
.list li svg{flex-shrink:0;margin-top:4px}
.tile{border-radius:36px;background:linear-gradient(180deg,#161618,#0d0d0f);border:1px solid rgba(255,255,255,.08)}
.shot{position:absolute;border-radius:32px;overflow:hidden;background-color:#000;background-repeat:no-repeat;
  border:1px solid rgba(255,255,255,.12);box-shadow:0 60px 120px -40px rgba(0,0,0,.95),0 0 0 10px rgba(255,255,255,.03)}
.shot::after{content:"";position:absolute;left:0;right:0;bottom:0;height:90px;background:linear-gradient(transparent,#000)}
.shot.nofade::after{display:none}

/* ── Téléphone générique (pas une copie d'un appareil réel) ── */
.phone{position:absolute;border-radius:76px;background:#0b0b0d;padding:16px;
  box-shadow:inset 0 0 0 2px #2a2a2e,inset 0 0 0 7px #121214,0 80px 140px -50px rgba(0,0,0,1),0 0 120px -30px rgba(41,151,255,.35)}
.phone .scr{position:relative;width:100%;height:100%;border-radius:60px;overflow:hidden;background:#000}
.phone .cam{position:absolute;top:22px;left:50%;transform:translateX(-50%);width:120px;height:34px;border-radius:20px;background:#000;z-index:9}
.phone.android{border-radius:58px}
.phone.android .scr{border-radius:44px}
.phone.android .cam{width:26px;height:26px;border-radius:50%;top:24px;background:#050505;box-shadow:inset 0 0 0 3px #16161a}
.sbar{position:absolute;top:28px;left:48px;right:48px;display:flex;justify-content:space-between;font-size:22px;font-weight:600;color:#fff;z-index:8}
.sbar .r{display:flex;gap:8px;align-items:center}
.sbar .r span{display:block;background:#fff;border-radius:3px}

/* ── Écran verrouillé générique ── */
.lock{position:absolute;inset:0;background:
  radial-gradient(70% 50% at 20% 15%,rgba(41,151,255,.55),transparent 70%),
  radial-gradient(60% 45% at 90% 70%,rgba(140,90,255,.35),transparent 70%),
  radial-gradient(60% 40% at 30% 100%,rgba(227,201,164,.25),transparent 70%),
  linear-gradient(180deg,#06122b,#030712 60%,#000)}
.lock .date{position:absolute;top:110px;width:100%;text-align:center;font-size:28px;font-weight:600;color:rgba(255,255,255,.85)}
.lock .time{position:absolute;top:140px;width:100%;text-align:center;font-family:"Inter Display";font-weight:600;font-size:150px;letter-spacing:-.04em;color:rgba(255,255,255,.95)}

/* ── Notification générique ── */
.notif{display:flex;gap:18px;align-items:flex-start;padding:22px 24px;border-radius:34px;background:rgba(40,40,46,.72);
  backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,.1);box-shadow:0 30px 60px -20px rgba(0,0,0,.8);color:#f5f5f7}
.notif .ico{width:62px;height:62px;border-radius:16px;flex-shrink:0;display:grid;place-items:center;font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:32px}
.notif .tx{flex:1;min-width:0}
.notif .top{display:flex;justify-content:space-between;gap:10px;font-size:24px}
.notif .top b{font-weight:700}
.notif .top span{color:rgba(245,245,247,.5);font-size:21px;white-space:nowrap}
.notif p{font-size:24px;line-height:1.3;margin-top:4px;color:rgba(245,245,247,.9)}

/* ── Pass style Apple Wallet (repris de Home.css / pass.css) ── */
.c3{--cw:var(--card-w,300px);position:relative;width:var(--cw);aspect-ratio:1/1.58;border-radius:calc(var(--cw)*.05);font-size:calc(var(--cw)*.0533)}
.c3-face{position:absolute;inset:0;border-radius:inherit;overflow:hidden;padding:1em 1.25em;display:flex;flex-direction:column;
  box-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 40px 80px -30px rgba(0,0,0,.9)}
.c3-front{background:var(--pass-bg);color:var(--ink)}
.c3-back{background:#1c1c1e;color:#fff;padding:1.4em 1.25em}
.c3-foil{position:absolute;inset:-30%;pointer-events:none;z-index:3;mix-blend-mode:soft-light;
  background:radial-gradient(30% 22% at 30% 25%,rgba(255,255,255,.22),transparent 70%),linear-gradient(115deg,transparent 38%,rgba(255,255,255,.07) 48%,transparent 58%)}
.wp-head{position:relative;display:flex;justify-content:space-between;align-items:center;height:2.5em;margin-bottom:.75em;flex-shrink:0}
.wp-logo{display:flex;align-items:center;gap:.5em;min-width:0}
.wp-mark{width:2em;height:2em;flex-shrink:0;border-radius:.45em;display:grid;place-items:center;background:var(--mark-bg);color:var(--mark-ink);font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:1em}
.wp-org{font-weight:700;font-size:1.05em;letter-spacing:-.02em;white-space:nowrap}
.wp-hfield{display:flex;flex-direction:column;align-items:flex-end}
.wp-hval{font-size:1.5em;line-height:1;font-variant-numeric:tabular-nums}
.wp-label{display:block;font-size:.625em;font-weight:700;color:var(--label);margin-bottom:.3em;white-space:nowrap}
.wp-strip{position:relative;margin:0 -1.25em;height:7.5em;flex-shrink:0;background:#2a1a0f;overflow:hidden}
.wp-strip svg{display:block;width:100%;height:100%;transform:scale(1.08)}
.wp-fields{display:flex;justify-content:space-between;align-items:flex-end;padding:1.25em 0 .6em;flex-shrink:0}
.wp-col{display:flex;flex-direction:column;min-width:0}
.wp-right{align-items:flex-end;text-align:right;max-width:48%}
.wp-right .wp-label{white-space:normal;line-height:1.25}
.wp-val-lg{font-size:1.75em;font-weight:300;line-height:1}
.wp-val{font-size:.8125em;font-weight:500;line-height:1.2}
.wp-barcode{margin-top:auto;align-self:center;width:10em;padding:.625em;border-radius:.5em;background:#fff;display:flex;flex-direction:column;align-items:center;gap:.375em}
.wp-qr{width:100%;aspect-ratio:1;color:#000}
.wp-qr svg{display:block;width:100%;height:100%}
.wp-id{font-size:.625em;font-family:"DejaVu Sans Mono",monospace;font-weight:600;color:#333}
.wp-back-row{display:flex;flex-direction:column;gap:.15em;padding:.7em 0;border-bottom:1px solid rgba(255,255,255,.1);font-size:.8em}
.wp-back-label{font-size:.8em;color:#8e8e93}
.wp-toggle{flex-direction:row;justify-content:space-between;align-items:center}
.wp-toggle i{position:relative;width:2.6em;height:1.55em;border-radius:1em;background:#0a84ff;flex-shrink:0}
.wp-toggle i::after{content:"";position:absolute;top:.12em;right:.12em;width:1.31em;height:1.31em;border-radius:50%;background:#fff}
.c3-graphite{--pass-bg:#1c1c1e;--ink:#fff;--label:#e3c9a4;--mark-bg:linear-gradient(135deg,#f6e4c8,#b8926a);--mark-ink:#1d1d1f}
.c3-azur{--pass-bg:#0b3a8f;--ink:#fff;--label:#9fd0ff;--mark-bg:#fff;--mark-ink:#0b3a8f}
.c3-champagne{--pass-bg:#dcc39d;--ink:#2b1f12;--label:#7a5530;--mark-bg:#2b1f12;--mark-ink:#f1dcc0}
.c3-ivory{--pass-bg:#f5f5f7;--ink:#1d1d1f;--label:#0071e3;--mark-bg:#1d1d1f;--mark-ink:#fff}

/* ── Carte style Android (générique, inspirée du format des cartes Google Wallet) ── */
.gp{--gw:360px;width:var(--gw);border-radius:calc(var(--gw)*.07);overflow:hidden;font-size:calc(var(--gw)*.05);background:#0b3a8f;color:#fff;
  box-shadow:0 40px 80px -30px rgba(0,0,0,.9),inset 0 0 0 1px rgba(255,255,255,.08)}
.gp-in{padding:1.1em 1.2em 1.2em}
.gp-top{display:flex;align-items:center;gap:.6em;font-size:.85em;font-weight:500;opacity:.95}
.gp-top .lg{width:2em;height:2em;border-radius:50%;background:#fff;color:#0b3a8f;display:grid;place-items:center;font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:1.05em}
.gp-title{font-size:1.45em;font-weight:500;margin:.8em 0 .9em;letter-spacing:-.01em}
.gp-row{display:flex;justify-content:space-between;gap:1em}
.gp-row div{display:flex;flex-direction:column;gap:.15em}
.gp-row small{font-size:.62em;opacity:.7;font-weight:500;letter-spacing:.02em}
.gp-row span{font-size:1.05em;font-weight:500}
.gp-qr{margin:1.1em auto 0;width:9.4em;padding:.55em;background:#fff;border-radius:.7em;color:#000}
.gp-qr svg{display:block;width:100%}
.gp-hero{height:6.4em;overflow:hidden}
.gp-hero svg{display:block;width:100%;height:100%}

/* ── Carte papier ── */
.paper{position:absolute;width:560px;height:340px;border-radius:18px;padding:30px 34px;color:#3b2b1a;
  background:radial-gradient(120% 90% at 10% 0%,#fbf3e4,#efe0c4 60%,#e2cda7);box-shadow:0 40px 80px -30px rgba(0,0,0,.9)}
.paper::before{content:"";position:absolute;inset:0;border-radius:inherit;opacity:.35;mix-blend-mode:multiply;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.02 .6' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 .5 0 0 0 0 .35 0 0 0 0 .2 0 0 0 .6 0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")}
.paper .pt{font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:38px}
.paper .ps{font-size:20px;margin-top:6px;opacity:.7}
.paper .stamps{display:grid;grid-template-columns:repeat(5,1fr);gap:16px;margin-top:30px}
.paper .stamps span{aspect-ratio:1;border-radius:50%;border:2.5px dashed rgba(59,43,26,.45);display:grid;place-items:center}
.paper .stamps span.on::after{content:"";width:70%;height:70%;border-radius:50%;background:rgba(150,40,30,.75);transform:rotate(-12deg)}

/* ── Tarifs ── */
.price{font-family:"Inter Display";font-weight:800;letter-spacing:-.05em;line-height:.9}
.ttc{font-size:30px;color:rgba(245,245,247,.6);font-weight:500}
`

/* ───────────── Briques SVG ───────────── */
const qrPath = (() => {
  const N = 25
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const inF = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)
  let d = ''
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { if (!inF(x, y) && rnd() > 0.52) d += `M${x} ${y}h1v1h-1z` }
  const f = (a, b) => `M${a} ${b}h7v7h-7zM${a + 1} ${b + 1}v5h5v-5zM${a + 2} ${b + 2}h3v3h-3z`
  return d + f(0, 0) + f(N - 7, 0) + f(0, N - 7)
})()
const qr = () => `<svg viewBox="0 0 25 25" shape-rendering="crispEdges"><path d="${qrPath}" fill-rule="evenodd" fill="currentColor"/></svg>`

let uid = 0
const strip = () => {
  const u = `s${++uid}`
  return `<svg viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice"><defs>
<linearGradient id="${u}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5b3a22"/><stop offset=".55" stop-color="#3f2615"/><stop offset="1" stop-color="#24150b"/></linearGradient>
<filter id="${u}g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.32" numOctaves="3" seed="8"/><feColorMatrix values="0 0 0 0 0.08  0 0 0 0 0.04  0 0 0 0 0.01  0 0 0 1.1 -0.35"/></filter>
<filter id="${u}b6"><feGaussianBlur stdDeviation="6"/></filter><filter id="${u}b2"><feGaussianBlur stdDeviation="1.6"/></filter><filter id="${u}s"><feGaussianBlur stdDeviation="0.5"/></filter>
<radialGradient id="${u}sa" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#ebe6df"/><stop offset="1" stop-color="#c9c1b6"/></radialGradient>
<radialGradient id="${u}cu" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#fff"/><stop offset=".8" stop-color="#e9e4dd"/><stop offset="1" stop-color="#bdb4a8"/></radialGradient>
<radialGradient id="${u}co" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#d9a46a"/><stop offset=".55" stop-color="#a5642f"/><stop offset=".88" stop-color="#6a3816"/><stop offset="1" stop-color="#3d1f0b"/></radialGradient>
<radialGradient id="${u}be" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#7a4523"/><stop offset="1" stop-color="#24120a"/></radialGradient>
<linearGradient id="${u}sp" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f4f6"/><stop offset=".5" stop-color="#a9a9b0"/><stop offset="1" stop-color="#e3e3e8"/></linearGradient>
<radialGradient id="${u}v" cx="50%" cy="50%" r="75%"><stop offset=".6" stop-opacity="0"/><stop offset="1" stop-opacity=".55"/></radialGradient></defs>
<rect width="320" height="120" fill="url(#${u}w)"/><rect width="320" height="120" filter="url(#${u}g)"/>
<path d="M0 38 H320 M0 82 H320" stroke="#1a0e06" stroke-opacity=".5" stroke-width="1.2"/>
${[[46, 30, -20], [72, 86, 35], [104, 52, 10], [30, 72, 60], [128, 98, -40], [150, 22, 25]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><ellipse cx="2" cy="3" rx="7.5" ry="5.4" opacity=".45" filter="url(#${u}b2)"/><ellipse rx="7.5" ry="5.4" fill="url(#${u}be)"/><path d="M-6 0 C -2 -2.4, 2 2.4, 6 0" stroke="#160a04" stroke-width="1.1" fill="none"/></g>`).join('')}
<ellipse cx="232" cy="70" rx="54" ry="52" opacity=".55" filter="url(#${u}b6)"/><circle cx="224" cy="60" r="50" fill="url(#${u}sa)"/>
<g transform="rotate(-38 190 92)"><rect x="150" y="89" width="40" height="3.4" rx="1.7" fill="url(#${u}sp)"/><ellipse cx="196" cy="90.7" rx="9" ry="5.5" fill="url(#${u}sp)"/></g>
<rect x="250" y="53" width="24" height="13" rx="6.5" fill="url(#${u}cu)"/><circle cx="226" cy="58" r="31" opacity=".25" filter="url(#${u}b2)"/>
<circle cx="224" cy="58" r="30" fill="url(#${u}cu)"/><circle cx="224" cy="58" r="24.5" fill="url(#${u}co)"/>
<path d="M224 66 C 213 59, 211 50, 217 47.5 C 221 46, 224 49, 224 51.5 C 224 49, 227 46, 231 47.5 C 237 50, 235 59, 224 66 Z" fill="#f6e8d2" filter="url(#${u}s)"/>
<rect width="320" height="120" fill="url(#${u}v)"/></svg>`
}

/* ───────────── Composants ───────────── */
const pass = ({ w = 380, skin = 'graphite', points = 480, name = 'Maison Lumière', holder = 'CAMILLE', style = '' } = {}) => `
<div class="c3 c3-${skin}" style="--card-w:${w}px;${style}"><div class="c3-face c3-front"><div class="c3-foil"></div>
<div class="wp-head"><div class="wp-logo"><span class="wp-mark">L</span><span class="wp-org">${name}</span></div>
<div class="wp-hfield"><span class="wp-label">POINTS</span><span class="wp-hval">${points}</span></div></div>
<div class="wp-strip">${strip()}</div>
<div class="wp-fields"><div class="wp-col"><span class="wp-label">BONJOUR</span><span class="wp-val-lg">${holder}</span></div>
<div class="wp-col wp-right"><span class="wp-label">DÉTAILS DES RÉCOMPENSES</span><span class="wp-val">Au dos</span></div></div>
<div class="wp-barcode"><div class="wp-qr">${qr()}</div><span class="wp-id">N° Carte : 2BF10B</span></div></div></div>`

const passBack = ({ w = 380, points = 480, name = 'Maison Lumière', style = '' } = {}) => `
<div class="c3" style="--card-w:${w}px;${style}"><div class="c3-face c3-back">
<div class="wp-back-row"><span class="wp-back-label">Détails des récompenses</span><span>500 points = 1 café offert</span></div>
<div class="wp-back-row"><span class="wp-back-label">Solde</span><span>${points} points</span></div>
<div class="wp-back-row"><span class="wp-back-label">Prochaine récompense</span><span>Plus que ${500 - points} points</span></div>
<div class="wp-back-row"><span class="wp-back-label">Boutique</span><span>${name}, 12 rue des Lilas</span></div>
<div class="wp-back-row wp-toggle"><span>Mises à jour automatiques</span><i></i></div>
<div class="wp-back-row wp-toggle"><span>Autoriser les notifications</span><i></i></div></div></div>`

const gpass = ({ w = 360, points = 480, bg = '#0b3a8f', style = '' } = {}) => `
<div class="gp" style="--gw:${w}px;background:${bg};${style}"><div class="gp-in">
<div class="gp-top"><span class="lg">L</span>Maison Lumière</div>
<div class="gp-title">Carte de fidélité</div>
<div class="gp-row"><div><small>TITULAIRE</small><span>Camille R.</span></div><div style="text-align:right"><small>POINTS</small><span>${points}</span></div></div>
<div class="gp-qr">${qr()}</div></div><div class="gp-hero">${strip()}</div></div>`

const notif = ({ title = 'Maison Lumière', body, time = 'maintenant', ico = 'L', icoBg = 'linear-gradient(135deg,#f6e4c8,#b8926a)', icoInk = '#1d1d1f', style = '' }) => `
<div class="notif" style="${style}"><span class="ico" style="background:${icoBg};color:${icoInk}">${ico}</span>
<div class="tx"><div class="top"><b>${title}</b><span>${time}</span></div><p>${body}</p></div></div>`

const sbar = (time = '10:24', dark = false) => `<div class="sbar" style="${dark ? 'color:#000' : ''}"><span>${time}</span><span class="r">
<span style="width:6px;height:10px;opacity:.9"></span><span style="width:6px;height:14px"></span><span style="width:6px;height:18px"></span>
<span style="width:40px;height:20px;border-radius:6px;margin-left:8px"></span></span></div>`

/* Téléphone : x, y, w (h déduit), contenu de l'écran */
const phone = ({ x, y, w = 460, h, inner = '', android = false, style = '' }) => {
  const H = h || Math.round(w * 2.08)
  return `<div class="phone${android ? ' android' : ''}" style="left:${x}px;top:${y}px;width:${w}px;height:${H}px;${style}"><div class="scr">${inner}<div class="cam"></div></div></div>`
}

const lockscreen = ({ time = '10:24', date = 'mardi 25 novembre', notifs = '' } = {}) => `
<div class="lock"><div class="date">${date}</div><div class="time">${time}</div>
<div style="position:absolute;left:22px;right:22px;top:400px;display:flex;flex-direction:column;gap:14px">${notifs}</div></div>`

/* Fond Wallet générique : pile de cartes + carte principale */
const walletScreen = (main, { title = 'Cartes' } = {}) => `
<div style="position:absolute;inset:0;background:#000">${sbar()}
<div style="position:absolute;top:88px;left:36px;font-family:'Inter Display';font-weight:700;font-size:44px;letter-spacing:-.02em">${title}</div>
<div style="position:absolute;top:168px;left:30px;right:30px;height:70px;border-radius:22px 22px 0 0;background:linear-gradient(90deg,#4b1f6e,#7b2f8f)"></div>
<div style="position:absolute;top:205px;left:30px;right:30px;height:70px;border-radius:22px 22px 0 0;background:#0f5c45"></div>
<div style="position:absolute;top:242px;left:30px">${main}</div></div>`

/* Capture réelle de l'app (1170 px de large = 390 px CSS ×3), recadrée */
const shot = ({ name, x, y, w, y0, y1, fade = true, style = '' }) => {
  const k = w / 390
  const h = Math.round((y1 - y0) * k)
  return `<div class="shot${fade ? '' : ' nofade'}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background-image:url('${A.ecran(name)}');background-size:${w}px auto;background-position:0 ${-Math.round(y0 * k)}px;${style}"></div>`
}

const check = (c = '#2997ff', s = 36) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="${c}" fill-opacity=".16"/><path d="M7 12.5l3.2 3.2L17 9" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`
const cross = (s = 36) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="#ff453a" fill-opacity=".14"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#ff6a60" stroke-width="2.4" stroke-linecap="round"/></svg>`
const pin = (s = 60, c = '#2997ff') => `<svg width="${s}" height="${s * 1.25}" viewBox="0 0 24 30"><path d="M12 29s10-10.2 10-17A10 10 0 0 0 2 12c0 6.8 10 17 10 17z" fill="${c}"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>`
const li = (txt, ok = true) => `<li>${ok ? check() : cross()}<span>${txt}</span></li>`

const glows = (spec = []) => spec.map(([x, y, r, a = 0.3, c = '41,151,255']) =>
  `<div class="glow" style="left:${x - r}px;top:${y - r}px;width:${r * 2}px;height:${r * 2}px;background:radial-gradient(circle,rgba(${c},${a}),rgba(${c},0) 70%)"></div>`).join('')


/* Enveloppe d'une slide (1080×1920). Zones sûres : 220 ≤ y ≤ 1500, x ≤ 900. */
const DEFAULT_GLOWS = [[900, 420, 560, 0.26], [120, 1500, 520, 0.14]]
const signature = () => `<div style="position:absolute;left:80px;top:1376px;display:flex;align-items:center;gap:20px;z-index:20">
<img src="${A.logo}" style="width:96px;height:96px"><div style="display:flex;flex-direction:column;gap:2px">
<span style="font-family:'Inter Display';font-weight:800;font-size:40px;letter-spacing:-.02em">Fidelyz</span>
<span style="font-size:28px;font-weight:500;color:rgba(245,245,247,.6)">fidelyzapp.fr</span></div></div>`
const page = ({ body, i, n, glow = DEFAULT_GLOWS, logo = false }) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>${CSS}</style></head>
<body><div class="slide">${glows(glow)}<div class="grain"></div>
<div class="hd"><div class="num">${i}/${n}</div></div>
${fr(body)}${logo ? signature() : ''}</div></body></html>`

module.exports = { A, fr, page, pass, passBack, gpass, notif, phone, lockscreen, walletScreen, shot, sbar, check, cross, pin, li, qr, strip, glows }

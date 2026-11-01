import { AbsoluteFill, Img, staticFile } from 'remotion'
import { Check, Clock } from 'lucide-react'
import { C, W, fontFamily, inE, ioE, lerp, outE, springy, ts, useT } from '../../lib'
import { Notif, Pass } from '../../Pass'
import { Flash, Ring, shake, shakeStyle } from '../../tiktok/kit'
import { AppScreen, Device, Focus, RECTS, Tap, VH, VW, devPoint, scrollTo } from '../device'
import { StepBadge } from '../common'
import { PageCrop, Slam, Sparks } from '../fx'

/* LES TROIS ÉTAPES (22,8 – 38,6 s), sur les vrais écrans du site.
   L'élément important de chaque écran sort du téléphone et vient au premier plan :
   1. l'aperçu de la carte (logo, quatre couleurs) ; 2. le QR code, qui file vers le téléphone du client ;
   3. la fenêtre d'ajout de points (+20, Valider), puis la carte du client qui passe à 480 points. */

/* Trajet d'un élément de l'écran (rect, pixels CSS) vers le premier plan : position et échelle à l'image */
const popOut = (dev, rect, scroll, to, p) => {
  const from = devPoint(dev, rect.x, rect.y, scroll)
  const k = lerp(dev.k, to.k, p)
  const w = rect.w * k
  const h = rect.h * k
  const cx = lerp(from.x + (rect.w * dev.k) / 2, to.x, p)
  const cy = lerp(from.y + (rect.h * dev.k) / 2, to.y, p)
  return { left: cx - w / 2, top: cy - h / 2, k }
}

/* ── 1. Ma carte ─────────────────────────────────────────── */
const DEV8 = { x: 540, y: 430, k: 1.3 }
const SKINS = [
  { id: 'graphite', c: '#1c1c1e' },
  { id: 'azur', c: '#0b3a8f' },
  { id: 'champagne', c: '#dcc39d' },
  { id: 'ivory', c: '#f5f5f7' },
]

export const S8_Creer = () => {
  const t = useT()
  const prev = RECTS['design-graphite'].preview
  const SC = scrollTo('design-graphite', 'preview', -10)
  const scroll = lerp(0, SC, ts(t, 23.2, 23.95, 0, 1, ioE))
  const tPop = W('e08', 5) - 0.12
  const pop = ts(t, tPop, tPop + 0.5, 0, 1, outE)
  const tLogo = W('e08', 6)
  // Quatre couleurs, une toutes les 0,2 s à partir de « couleurs » ; chaque changement fait pivoter la carte
  const changes = [0, 1, 2, 3].map(i => W('e08', 8) + i * 0.2)
  const order = [1, 2, 3, 0]
  const idx = changes.filter(c => t >= c).length - 1
  const cur = idx < 0 ? 0 : order[idx]
  const flip = changes.reduce((acc, c) => acc + Math.max(0, 1 - Math.abs(t - c) / 0.1), 0)
  const tMin = W('e08', 10)
  const enter = springy(t, 22.82, 1.6, 8)
  const dev = { ...DEV8, k: DEV8.k * lerp(0.75, 1, Math.min(1, enter)) }
  const to = { x: 540, y: 1010, k: 2.0 }
  const box = popOut(DEV8, prev, SC, to, pop)
  const rel = { x: 57 - prev.x, y: 950 - prev.y, w: 186, h: 34 } // logo + nom dans l'aperçu
  return (
    <AbsoluteFill>
      <div style={{ opacity: 1 - 0.6 * pop, filter: pop > 0 ? `blur(${pop * 6}px)` : undefined }}>
        <Device {...dev} ry={-16 + 8 * ts(t, 22.82, 27.2) + Math.sin(t * 1.3) * 2} rx={5}>
          <AppScreen page="design-graphite" scroll={scroll} />
        </Device>
      </div>
      {t >= tPop && (
        <div style={{ position: 'absolute', left: box.left, top: box.top, transform: `perspective(1600px) rotateY(${lerp(0, -12, pop) + Math.sin(t * 1.5) * 5 + flip * 85}deg) rotateX(${lerp(0, 8, pop)}deg)`, zIndex: 5 }}>
          <PageCrop page={`design-${SKINS[cur].id}`} rect={prev} k={box.k} radius={16} />
          {t >= tLogo && t < changes[0] && (
            <div style={{ position: 'absolute', left: (rel.x - 6) * box.k, top: (rel.y - 6) * box.k, width: (rel.w + 12) * box.k, height: (rel.h + 12) * box.k, borderRadius: 12 * box.k, border: `${2 * box.k}px solid ${C.champagne}`, boxShadow: `0 0 30px ${C.champagne}`, transform: `scale(${1.3 - 0.3 * Math.min(1, springy(t, tLogo, 2.2, 10))})` }} />
          )}
        </div>
      )}
      {changes.map((c, i) => <Ring key={i} t={t} at={c} x={540} y={1010} size={1100} width={6} color={SKINS[order[i]].id === 'ivory' ? 'rgba(255,255,255,0.8)' : SKINS[order[i]].id === 'champagne' ? '#dcc39d' : C.blue} dur={0.45} />)}
      {/* Nuancier de la page d'accueil */}
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 400, display: 'flex', justifyContent: 'center', gap: 34, opacity: ts(t, changes[0] - 0.25, changes[0]) }}>
        {SKINS.map((sk, i) => (
          <span key={sk.id} style={{ width: 74, height: 74, borderRadius: 37, background: sk.c, border: '2px solid rgba(255,255,255,0.25)', boxShadow: cur === i ? `0 0 0 6px #000, 0 0 0 10px ${C.blue}` : 'none', transform: `scale(${cur === i ? 1.15 : 1})` }} />
        ))}
      </div>
      <Slam t={t} at={tMin} out={27.3} size={96} rot={-8} x={790} y={560}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 18, padding: '22px 40px', borderRadius: 999, background: C.champagne, color: '#2b1f12' }}><Clock size={84} strokeWidth={2.6} /> 5 min</span>
      </Slam>
      <StepBadge t={t} at={22.9} out={27.1} n={1} label="Crée ta carte" />
    </AbsoluteFill>
  )
}

/* ── 2. Le client s'inscrit ─────────────────────────────── */
const QR = { x: 78, y: 266, w: 234, h: 232 }
const WALLET_BTN = { x: 195, y: 714 }
const REG_SCROLL = 30

const Viewfinder = ({ t, at, lock }) => {
  const focus = ts(t, at, at + 0.5, 0, 1, outE)
  const line = ((t - at) * 1.6) % 1
  const locked = t >= lock
  const k = locked ? springy(t, lock, 2.4, 10) : 0
  const size = lerp(270, 240, k)
  const c = locked ? '#ffd60a' : 'rgba(255,255,255,0.9)'
  const L = 38
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: VW / 2, top: VH / 2 - 40, transform: `translate(-50%, -50%) scale(${1 + 0.1 * focus}) rotate(-4deg)`, filter: `blur(${(1 - focus) * 6}px) brightness(0.9)` }}>
        <div style={{ position: 'relative', width: VW, height: 560, overflow: 'hidden' }}>
          <Img src={staticFile('explication/ecrans/register.png')} style={{ position: 'absolute', left: 0, top: 280 - (QR.y + QR.h / 2), width: VW, height: RECTS.register.height }} />
        </div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(closest-side, transparent 60%, rgba(0,0,0,0.6))' }} />
      <div style={{ position: 'absolute', left: VW / 2 - size / 2, top: VH / 2 - 40 - size / 2, width: size, height: size }}>
        {[[0, 0, 1, 1], [1, 0, -1, 1], [0, 1, 1, -1], [1, 1, -1, -1]].map(([ax, ay, sx, sy], i) => (
          <div key={i} style={{ position: 'absolute', left: ax * size - (ax ? L : 0), top: ay * size - (ay ? L : 0), width: L, height: L, borderTop: sy > 0 ? `4px solid ${c}` : 'none', borderBottom: sy < 0 ? `4px solid ${c}` : 'none', borderLeft: sx > 0 ? `4px solid ${c}` : 'none', borderRight: sx < 0 ? `4px solid ${c}` : 'none', borderRadius: 8 }} />
        ))}
        {!locked && <div style={{ position: 'absolute', left: 10, right: 10, top: line * size, height: 3, background: 'rgba(255,255,255,0.7)', boxShadow: '0 0 14px rgba(255,255,255,0.9)' }} />}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 190, background: 'rgba(0,0,0,0.82)' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 18, textAlign: 'center', fontFamily, fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', color: '#ffd60a' }}>PHOTO</div>
        <div style={{ position: 'absolute', left: VW / 2 - 37, top: 60, width: 74, height: 74, borderRadius: 37, border: '4px solid #fff', boxSizing: 'border-box', padding: 4 }}><div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#fff' }} /></div>
      </div>
      {locked && (
        <div style={{ position: 'absolute', left: VW / 2, top: VH / 2 + 130, transform: `translate(-50%, 0) scale(${Math.max(0, Math.min(1.05, k))})`, padding: '9px 16px', borderRadius: 999, background: '#ffd60a', color: '#000', fontFamily, fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap' }}>
          Carte de fidélité · Maison Lumière
        </div>
      )}
    </div>
  )
}

export const S9_Inscrire = () => {
  const t = useT()
  const tClient = W('e09', 2)
  const tLock = W('e09', 6)
  const tJoin = tLock + 0.3
  const tTap = W('e09', 7)
  const tAdd = tTap + 0.18
  const tPhone = W('e09', 13)
  const swap = ts(t, tClient - 0.15, tClient + 0.45, 0, 1, ioE)
  const bIn = springy(t, tClient - 0.1, 1.4, 8)
  const enter = springy(t, 27.22, 1.6, 8)
  const A = { x: lerp(540, 250, swap), y: lerp(440, 600, swap), k: lerp(1.28 * lerp(0.8, 1, Math.min(1, enter)), 0.85, swap) }
  const push = ts(t, tPhone - 0.2, tPhone + 0.5, 0, 1, ioE)
  const B = { x: lerp(1450, lerp(660, 540, push), Math.min(1.02, bIn)), y: lerp(520, 400, swap), k: lerp(1.0, 1.24, swap) * (1 + 0.1 * push) }
  const joinIn = ts(t, tJoin, tJoin + 0.32, 0, 1, outE)
  const add = ts(t, tAdd, tAdd + 0.5, 0, 1, outE)
  const chip = springy(t, tAdd + 0.35, 2.2, 10)
  // Le QR code sort du téléphone du commerçant et file dans le viseur du client
  const qrFly = ts(t, tClient - 0.05, tLock - 0.1, 0, 1, ioE)
  const qrA = popOut({ x: 540, y: 440, k: 1.28 }, QR, REG_SCROLL, { x: 540, y: 980, k: 2.4 }, Math.min(1, qrFly * 2.2))
  const vf = devPoint(B, VW / 2, VH / 2 - 40)
  const qrT = Math.max(0, qrFly * 2.2 - 1.2) / 1
  const qx = lerp(qrA.left + (QR.w * qrA.k) / 2, vf.x, Math.min(1, qrT))
  const qy = lerp(qrA.top + (QR.h * qrA.k) / 2, vf.y, Math.min(1, qrT))
  const qk = lerp(qrA.k, 1.1 * B.k, Math.min(1, qrT))
  return (
    <AbsoluteFill>
      <Device {...A} ry={lerp(-10, 18, swap)} rx={4} opacity={1 - 0.5 * swap}>
        <AppScreen page="register" scroll={REG_SCROLL} />
        <Focus t={t} at={27.6} out={tClient - 0.1} rect={QR} scroll={REG_SCROLL} />
      </Device>
      {t >= tClient - 0.1 && (
        <Device {...B} ry={lerp(-26, -4, Math.min(1, bIn)) + 4 * push} rx={3}>
          {t < tJoin + 0.35 && <Viewfinder t={t} at={tClient} lock={tLock} />}
          {t >= tJoin && (
            <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - joinIn) * VH}px)` }}>
              <AppScreen page="join-filled" scroll={0} />
              <Tap t={t} at={tTap} x={WALLET_BTN.x} y={WALLET_BTN.y} />
            </div>
          )}
          {t >= tAdd && (
            <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.85 * add})` }}>
              <div style={{ position: 'absolute', left: 25, top: 30 + (1 - add) * VH }}>
                <Pass width={340} points={0} holder="CAMILLE" light={0.4} />
              </div>
              {t >= tAdd + 0.35 && (
                <div style={{ position: 'absolute', left: VW / 2, top: 620, transform: `translateX(-50%) scale(${Math.max(0, Math.min(1.05, chip))})`, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px 10px 10px', borderRadius: 999, background: 'rgba(38,38,42,0.92)', border: '1px solid rgba(255,255,255,0.12)', fontFamily, fontSize: 17, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>
                  <span style={{ width: 28, height: 28, borderRadius: 14, background: C.blueBtn, display: 'grid', placeItems: 'center' }}><Check size={17} strokeWidth={3} /></span>
                  Ajoutée au Wallet
                </div>
              )}
            </div>
          )}
        </Device>
      )}
      {qrFly > 0 && qrFly < 1 && (
        <div style={{ position: 'absolute', left: qx - (QR.w * qk) / 2, top: qy - (QR.h * qk) / 2, transform: `perspective(1400px) rotateY(${Math.sin(qrFly * Math.PI) * -25}deg) rotateZ(${Math.sin(qrFly * Math.PI) * 8}deg)`, opacity: 1 - ts(qrFly, 0.85, 1), zIndex: 8 }}>
          <PageCrop page="register" rect={QR} k={qk} radius={18} />
        </div>
      )}
      <Ring t={t} at={tLock} x={vf.x} y={vf.y} size={560} color="rgba(255,214,10,0.85)" width={6} />
      <Sparks t={t} at={tAdd + 0.3} x={devPoint(B, VW / 2, 280).x} y={devPoint(B, VW / 2, 280).y} n={22} dist={420} />
      <Flash t={t} at={tAdd + 0.3} color={C.blue} strength={0.14} />
      <StepBadge t={t} at={27.3} out={32.3} n={2} label="Ton client l’ajoute" />
    </AbsoluteFill>
  )
}

/* ── 3. En caisse ───────────────────────────────────────── */
const DEV10 = { x: 540, y: 330, k: 1.36 }
const SCROLL10 = RECTS['caisse-scrolled'].scrollY
const mid = r => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })

export const S10_Caisse = () => {
  const t = useT()
  const Rr = RECTS
  const tCredit = 33.15
  const tReward = tCredit + 0.1
  const tCont = W('e10', 3)
  const tPts = tCont + 0.1
  const t20 = W('e10', 6)
  const tOk = W('e10', 10) - 0.1
  const tDone = tOk + 0.08
  const tCard = W('e10', 11) - 0.15
  const tRoll = W('e10', 14) - 0.05
  const tNotif = W('e10', 16)
  const enter = springy(t, 32.42, 1.6, 8)
  const scroll = lerp(40, SCROLL10, ts(t, 32.5, 33.0, 0, 1, ioE))
  const sheet = ts(t, tReward, tReward + 0.3, 0, 1, outE)
  let view = null
  if (t >= tReward) view = { page: 'caisse-reward', opacity: Math.min(1, sheet * 1.5) }
  if (t >= tPts) view = { page: 'caisse-points', opacity: 1 }
  if (t >= t20 + 0.06) view = { page: 'caisse-points20', opacity: 1 }
  if (t >= tDone) view = { page: 'caisse-done', opacity: 1 }
  // La fenêtre « Combien de points ajouter ? » sort du téléphone, on y valide +20, puis elle y retourne
  const modal = Rr['caisse-points'].modal
  const pop = ts(t, tPts + 0.15, tPts + 0.6, 0, 1, outE) * (1 - ts(t, tOk + 0.12, tOk + 0.4, 0, 1, inE))
  const devK = DEV10.k * lerp(0.8, 1, Math.min(1, enter))
  const side = ts(t, tCard, tCard + 0.5, 0, 1, ioE)
  const dev = { x: lerp(DEV10.x, -300, side), y: lerp(DEV10.y, 480, side), k: lerp(devK, 1.0, side) }
  const box = popOut({ ...DEV10 }, { ...modal, y: modal.y }, 0, { x: 540, y: 1130, k: 2.35 }, pop)
  const page20 = t >= t20 + 0.06 ? 'caisse-points20' : 'caisse-points'
  const p20 = mid(Rr['caisse-points'].plus20)
  const ok = mid(Rr['caisse-points20'].ok)
  const credit = Rr['caisse-search'].credit
  const passIn = springy(t, tCard + 0.1, 1.4, 8)
  const pts = 460 + 20 * ts(t, tRoll, tRoll + 0.5, 0, 1, ioE)
  const notif = springy(t, tNotif, 1.8, 9)
  const sh = shake(t, tDone, 18, 0.35)
  return (
    <AbsoluteFill style={shakeStyle(sh)}>
      <div style={{ opacity: 1 - 0.55 * pop, filter: pop > 0.05 ? `blur(${pop * 5}px)` : undefined }}>
        <Device {...dev} ry={lerp(-8, 24, side) + Math.sin(t * 1.2) * 2} rx={4} opacity={1 - side}>
          <AppScreen page="caisse-search" scroll={scroll} />
          <Tap t={t} at={tCredit} x={credit.x + credit.w / 2} y={credit.y + credit.h / 2} scroll={scroll} />
          {view && (
            <div style={{ position: 'absolute', inset: 0, opacity: view.opacity, transform: view.page === 'caisse-reward' ? `translateY(${(1 - sheet) * 140}px)` : undefined }}>
              <Img src={staticFile(`explication/ecrans/${view.page}.png`)} style={{ width: VW, height: VH }} />
            </div>
          )}
          <Tap t={t} at={tCont} x={mid(Rr['caisse-reward'].cont).x} y={mid(Rr['caisse-reward'].cont).y} />
          <Focus t={t} at={tDone + 0.05} out={tCard} rect={Rr['caisse-done'].toast} radius={18} />
        </Device>
      </div>
      {pop > 0 && (
        <div style={{ position: 'absolute', left: box.left, top: box.top, transform: `perspective(1600px) rotateX(${lerp(0, 10, pop)}deg) rotateY(${Math.sin(t * 1.4) * 4}deg)`, zIndex: 6 }}>
          <PageCrop page={page20} view rect={{ ...modal, h: VH - modal.y }} k={box.k} radius={22} />
          <div style={{ position: 'absolute', left: 0, top: 0, width: modal.w * box.k, height: (VH - modal.y) * box.k, transformOrigin: '0 0' }}>
            <div style={{ position: 'absolute', left: 0, top: -modal.y * box.k, transform: `scale(${box.k})`, transformOrigin: '0 0', width: VW, height: VH }}>
              <Tap t={t} at={t20} x={p20.x} y={p20.y} />
              <Tap t={t} at={tOk} x={ok.x} y={ok.y} />
            </div>
          </div>
        </div>
      )}
      <Slam t={t} at={tDone + 0.05} out={tCard + 0.1} size={230} color={C.champagne} rot={-6} y={560} glow="rgba(227,201,164,0.6)">+20</Slam>
      <Sparks t={t} at={tDone + 0.05} x={540} y={560} n={26} dist={460} />
      <Flash t={t} at={tDone} color={C.blue} strength={0.18} />
      {/* La carte du client se met à jour */}
      {t >= tCard && (
        <div style={{ position: 'absolute', left: lerp(1300, 280, Math.min(1.02, passIn)), top: 650 }}>
          <Pass width={520} points={pts} rx={5} ry={lerp(-50, -8, Math.min(1, passIn)) + Math.sin(t * 1.5) * 4} light={0.45} />
        </div>
      )}
      <Ring t={t} at={tRoll + 0.5} x={720} y={700} size={520} color="rgba(227,201,164,0.95)" width={6} />
      <Sparks t={t} at={tRoll + 0.5} x={720} y={700} n={18} dist={300} />
      {t >= tNotif && (
        <div style={{ position: 'absolute', left: 120, top: 400, width: 420, transformOrigin: '0 0', transform: `scale(2) translateY(${(1 - Math.min(1, notif)) * -50}px)`, opacity: Math.min(1, notif * 1.6), zIndex: 9 }}>
          <div className="fzx"><Notif title="Maison Lumière" body="+20 points. Plus que 20 avant votre café." time="maintenant" /></div>
        </div>
      )}
      <StepBadge t={t} at={32.5} out={38.5} n={3} label="Tu crédites ses points" />
    </AbsoluteFill>
  )
}

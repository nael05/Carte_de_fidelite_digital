import { AbsoluteFill } from 'remotion'
import { ArrowUpRight, Check } from 'lucide-react'
import { C, Logo, W, fontFamily, inE, ioE, lerp, outE, springy, ts, useT } from '../../lib'
import { Flash, Ring, shake, shakeStyle } from '../../tiktok/kit'
import { AppScreen, Device, RECTS, Tap, devPoint, scrollTo, typeClip } from '../device'
import { GeoVis, LockVis, WALLET_STACK } from '../site'
import { zoomAt } from '../common'
import { PageCrop, Sparks } from '../fx'
import { Pass } from '../../Pass'

/* POUR LES FAIRE REVENIR (38,6 – 53,5 s)
   11. Campagnes : le formulaire sort du téléphone, le message s'écrit, envoi ; le téléphone pivote sur l'écran verrouillé.
   12. Géolocalisation (visuel de la page d'accueil), carte inclinée en 3D : le client passe, « Maison Lumière est à 50 m ».
   13. Fin : Fidelyz, gratuit jusqu'à 15 clients, sans engagement, lien en bio. */

const DEV11 = { x: 540, y: 420, k: 1.3 }
const SC11 = scrollTo('campaigns', 'form')

export const S11_Campagne = () => {
  const t = useT()
  const R0 = RECTS.campaigns
  const H = R0.height
  const form = R0.form
  const tPop = 38.85
  const pTitle = ts(t, 39.0, 39.75, 0, 1, x => x)
  const pMsg = ts(t, 39.75, 40.4, 0, 1, x => x)
  const full = ts(t, 40.38, 40.45)
  const tSend = W('e11', 9) - 0.12
  const sent = ts(t, tSend + 0.08, tSend + 0.2)
  const tBack = W('e11', 10) - 0.1
  const pop = ts(t, tPop, tPop + 0.45, 0, 1, outE) * (1 - ts(t, tBack, tBack + 0.35, 0, 1, inE))
  const tFlip = tBack + 0.2
  const f1 = ts(t, tFlip, tFlip + 0.2, 0, 1, inE)
  const f2 = ts(t, tFlip + 0.2, tFlip + 0.45, 0, 1, outE)
  const lock = t >= tFlip + 0.2
  const ry = lock ? lerp(-90, 0, f2) : lerp(0, 90, f1)
  const tNotif = W('e11', 13) - 0.05
  const zoom = ts(t, tNotif + 0.15, tNotif + 0.65, 0, 1, ioE)
  const enter = springy(t, 38.62, 1.6, 8)
  const dev = { ...DEV11, k: DEV11.k * lerp(0.8, 1, Math.min(1, enter)) * (1 + 0.1 * ts(t, tFlip, tFlip + 0.5, 0, 1, ioE)) }
  const notifPt = devPoint(dev, 195, 186)
  const layers = [
    { page: 'campaigns-filled', clip: typeClip(R0.title, pTitle, H), opacity: pTitle > 0 ? 1 : 0 },
    { page: 'campaigns-filled', clip: typeClip(R0.msg, pMsg, H), opacity: pMsg > 0 ? 1 : 0 },
    { page: 'campaigns-filled', opacity: full },
    { page: 'campaigns-sent', opacity: sent },
  ]
  // position du formulaire sorti du téléphone
  const from = devPoint(DEV11, form.x, form.y, SC11)
  const k = lerp(DEV11.k, 2.25, pop)
  const cx = lerp(from.x + (form.w * DEV11.k) / 2, 540, pop)
  const cy = lerp(from.y + (form.h * DEV11.k) / 2, 1010, pop)
  const send = { x: R0.send.x + R0.send.w / 2 - form.x, y: R0.send.y + R0.send.h / 2 - form.y }
  const sh = shake(t, tSend, 12, 0.3)
  return (
    <AbsoluteFill style={shakeStyle(sh)}>
      <AbsoluteFill style={zoomAt(notifPt.x, notifPt.y, lerp(1, 2.1, zoom), zoom * 0.9)}>
        <div style={{ opacity: 1 - 0.55 * pop, filter: pop > 0.05 ? `blur(${pop * 5}px)` : undefined }}>
          <Device {...dev} ry={ry + (lock ? 0 : Math.sin(t * 1.3) * 3 - 6)} rx={4} full={lock}>
            {!lock && <AppScreen page="campaigns" scroll={SC11} layers={layers} />}
            {lock && (
              <LockVis
                t={t}
                notifs={[
                  { at: tNotif, title: 'Maison Lumière', body: 'Le croissant du mois est là : -20 % sur les viennoiseries ce week-end.', time: 'maintenant' },
                  { at: 0, title: 'Maison Lumière', body: '+20 points. Plus que 20 avant votre café.', time: '2 j', dim: true },
                ]}
              />
            )}
          </Device>
        </div>
      </AbsoluteFill>
      {pop > 0 && (
        <div style={{ position: 'absolute', left: cx - (form.w * k) / 2, top: cy - (form.h * k) / 2, transform: `perspective(1600px) rotateX(${lerp(0, 8, pop)}deg) rotateY(${Math.sin(t * 1.4) * 4}deg)`, zIndex: 6 }}>
          <PageCrop page="campaigns" rect={form} k={k} layers={layers} radius={22} />
          <div style={{ position: 'absolute', left: 0, top: 0, transform: `scale(${k})`, transformOrigin: '0 0' }}>
            <Tap t={t} at={tSend} x={send.x} y={send.y} />
          </div>
        </div>
      )}
      <Ring t={t} at={tSend + 0.1} x={540} y={1180} size={900} color="rgba(48,209,88,0.8)" width={6} />
      <Flash t={t} at={tNotif} color={C.blue} strength={0.14} />
      <Ring t={t} at={tNotif} x={540} y={960} size={1300} width={5} />
    </AbsoluteFill>
  )
}

/* Le client passe devant la boutique : carte du quartier inclinée en 3D */
const MAP = { w: 1024, h: 672, k: 3.2 }
const WALK = [[4, 94], [22, 72], [40, 57], [49, 50]]
const bez = u => {
  const v = 1 - u
  const [a, b, c, d] = WALK
  return [0, 1].map(i => v * v * v * a[i] + 3 * v * v * u * b[i] + 3 * v * u * u * c[i] + u * u * u * d[i])
}

export const S12_Geo = () => {
  const t = useT()
  const appear = ts(t, 43.22, 43.7, 0, 1, outE)
  const walk = ts(t, 43.45, W('e12', 6) + 0.2, 0, 1, ioE)
  const [wx, wy] = bez(walk)
  const tToast = W('e12', 8) - 0.05
  const toast = springy(t, tToast, 1.8, 9)
  const flat = ts(t, tToast - 0.4, tToast + 0.3, 0, 1, ioE)
  const tilt = lerp(52, 14, flat)
  const spin = lerp(-18, 0, ts(t, 43.22, tToast, 0, 1, ioE))
  const zoomT = ts(t, tToast + 0.1, tToast + 0.7, 0, 1, ioE)
  return (
    <AbsoluteFill>
      <AbsoluteFill style={zoomAt(540, 1190, lerp(1, 1.45, zoomT), zoomT * 0.8)}>
        <div style={{ position: 'absolute', left: 540 - MAP.w / 2, top: 1000 - MAP.h / 2, width: MAP.w, height: MAP.h, transform: `perspective(1300px) rotateX(${tilt}deg) rotateZ(${spin}deg) scale(${lerp(0.8, 1.15, appear)})`, opacity: appear }}>
          <div style={{ width: 320, height: 210, transform: `scale(${MAP.k})`, transformOrigin: '0 0' }}>
            <GeoVis t={t} toast={t >= tToast ? toast : 0} walker={{ x: wx, y: wy, o: ts(t, 43.3, 43.5) }} />
          </div>
        </div>
      </AbsoluteFill>
      <Ring t={t} at={W('e12', 6)} x={540} y={1000} size={1000} width={5} />
      <Sparks t={t} at={tToast} x={540} y={1190} n={18} dist={360} />
    </AbsoluteFill>
  )
}

/* Fin */
const Pill = ({ t, at, y, children, strong = false }) => {
  const a = springy(t, at, 2, 9)
  if (t < at) return null
  const beatK = strong ? Math.exp(-(((t - at) % 0.4) * 9)) : 0
  return (
    <div style={{ position: 'absolute', left: 0, width: 1080, top: y, display: 'flex', justifyContent: 'center', zIndex: 5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: strong ? '32px 60px' : '22px 40px', borderRadius: 999, background: strong ? '#fff' : 'rgba(20,20,24,0.85)', border: strong ? 'none' : '1.5px solid rgba(255,255,255,0.18)', color: strong ? '#000' : C.text, fontFamily, fontSize: strong ? 80 : 56, fontWeight: strong ? 900 : 700, letterSpacing: '-0.035em', transform: `translateY(${(1 - Math.min(1, a)) * 70}px) scale(${(0.7 + 0.3 * Math.min(1.05, a)) * (1 + 0.04 * beatK)})`, opacity: Math.min(1, a * 1.6), boxShadow: strong ? `0 0 ${50 + 50 * beatK}px rgba(41,151,255,0.7)` : '0 20px 50px rgba(0,0,0,0.5)' }}>
        {children}
      </div>
    </div>
  )
}

export const S13_Fin = () => {
  const t = useT()
  const tL = W('e13', 0)
  const logo = springy(t, tL, 1.6, 7)
  const word = springy(t, tL + 0.1, 1.8, 8)
  const sh = shake(t, tL, 24, 0.4)
  const fan = springy(t, tL + 0.2, 1.4, 8)
  return (
    <AbsoluteFill style={shakeStyle(sh)}>
      {/* Les cartes en éventail derrière, très en retrait */}
      <div style={{ opacity: 0.22 * Math.min(1, fan) }}>
        {WALLET_STACK.map((c, k) => (
          <div key={c.name} style={{ position: 'absolute', left: 540 - 170, top: 1350, transformOrigin: '50% 140%', transform: `rotate(${[-30, -10, 10, 30][k] * Math.min(1.05, fan)}deg) translateY(${(1 - Math.min(1, fan)) * 500}px)`, filter: 'blur(2px)' }}>
            <Pass width={340} skin={c.skin} name={c.name} mark={c.mark} points={c.pts} light={0.3} />
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 540 - 130, top: 360, transform: `scale(${Math.max(0, logo)}) rotate(${(1 - Math.min(1, logo)) * 30}deg)` }}><Logo size={260} /></div>
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 650, textAlign: 'center', fontFamily, fontWeight: 900, fontSize: 160, letterSpacing: '-0.055em', color: C.text, opacity: Math.min(1, word * 1.5), transform: `translateY(${(1 - Math.min(1, word)) * 60}px)`, textShadow: '0 0 70px rgba(41,151,255,0.55)' }}>Fidelyz</div>
      <Pill t={t} at={W('e13', 1) - 0.05} y={900}>
        <span style={{ color: C.blue }}>Gratuit</span> jusqu’à 15 clients
      </Pill>
      <Pill t={t} at={W('e13', 5) - 0.05} y={1030}>
        <Check size={50} strokeWidth={3} color="#30d158" /> Sans engagement
      </Pill>
      <Pill t={t} at={W('e13', 7) - 0.05} y={1190} strong>
        Lien en bio <ArrowUpRight size={76} strokeWidth={3} />
      </Pill>
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 1370, textAlign: 'center', fontFamily, fontSize: 42, fontWeight: 600, color: C.muted, opacity: ts(t, W('e13', 9), W('e13', 9) + 0.4), zIndex: 5 }}>fidelyzapp.fr</div>
      <Ring t={t} at={tL} x={540} y={490} size={1600} width={7} />
      <Sparks t={t} at={tL} x={540} y={490} n={30} dist={560} color={C.blue} />
      <Sparks t={t} at={W('e13', 7) - 0.05} x={540} y={1250} n={22} dist={420} />
      <Flash t={t} at={tL} color="#fff" strength={0.4} dur={0.28} />
    </AbsoluteFill>
  )
}

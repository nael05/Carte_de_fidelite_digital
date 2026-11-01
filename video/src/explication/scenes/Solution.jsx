import { AbsoluteFill, Img, staticFile } from 'remotion'
import { C, W, fontFamily, inE, ioE, lerp, outE, springy, ts, useT } from '../../lib'
import { Pass } from '../../Pass'
import { Ring } from '../../tiktok/kit'
import { Device, devPoint } from '../device'
import { WALLET_STACK } from '../site'
import { Sparks, beat } from '../fx'

/* SOLUTION (12,8 – 22,8 s)
   5. La carte du site arrive du fond en tournoyant, puis se range dans le téléphone qui monte.
   6. Les cartes Wallet s'ouvrent en éventail, Apple Wallet / Google Wallet ; « 0 téléchargement ».
   7. Trois étapes : 1, 2, 3 sur trois temps. */

const DEV5 = { x: 540, y: 470, k: 1.2 }
const IN_PASS = { x: 25, y: 34, w: 340 }

export const S5_Carte = () => {
  const t = useT()
  const tD = W('e05', 4)
  const p = ts(t, 12.82, 13.5, 0, 1, outE)
  const rise = springy(t, tD - 0.1, 1.3, 7.5)
  const orbit = ts(t, tD, 16.4, 0, 1, ioE)
  const dev = { ...DEV5, y: lerp(1980, DEV5.y, Math.min(1.02, rise)) }
  const slot = ts(t, tD + 0.25, tD + 0.85, 0, 1, ioE)
  const target = devPoint(DEV5, IN_PASS.x, IN_PASS.y)
  const inPhone = slot >= 1
  const glint = ts(t, W('e05', 7) - 0.1, W('e05', 7) + 0.5, 0, 1, ioE)
  const cardAt = tt => {
    const pp = ts(tt, 12.82, 13.5, 0, 1, outE)
    return { s: lerp(0.1, 1, pp), ry: lerp(560, 0, pp), rx: lerp(30, 0, pp), y: lerp(-200, 0, pp) }
  }
  const w = lerp(540, IN_PASS.w * DEV5.k, slot)
  const cx = lerp(540, target.x + (IN_PASS.w * DEV5.k) / 2, slot)
  const cy = lerp(1000, target.y + (IN_PASS.w * DEV5.k * 1.58) / 2, slot)
  const float = Math.sin(t * 2.4) * 10 * (1 - slot)
  return (
    <AbsoluteFill>
      <Device {...dev} ry={lerp(-24, 0, orbit) + Math.sin(t * 1.4) * 3} rx={4}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 60% at 50% 0%, #10213f, #000 70%)' }} />
        {inPhone && (
          <div style={{ position: 'absolute', left: IN_PASS.x, top: IN_PASS.y }}>
            <Pass width={IN_PASS.w} points={460} light={0.4} />
            {/* reflet qui balaie la carte */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: 14, overflow: 'hidden', pointerEvents: 'none' }}>
              <div style={{ position: 'absolute', top: -200, left: lerp(-300, 500, glint), width: 120, height: 1000, transform: 'rotate(20deg)', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)', opacity: glint > 0 && glint < 1 ? 1 : 0 }} />
            </div>
          </div>
        )}
      </Device>
      {!inPhone && [4, 3, 2, 1, 0].map(i => {
        const c = cardAt(t - i * 0.035)
        if (i > 0 && p >= 1) return null
        return (
          <div key={i} style={{ position: 'absolute', left: cx - w / 2, top: cy - (w * 1.58) / 2 + float + c.y, opacity: i ? 0.22 / i : 1, transform: `scale(${c.s})` }}>
            <Pass width={w} points={460} rx={c.rx + Math.sin(t * 1.7) * 4 * (1 - slot)} ry={c.ry + Math.sin(t * 1.3) * 12 * (1 - slot)} light={0.3 + 0.4 * p} />
          </div>
        )
      })}
      <Ring t={t} at={13.45} x={540} y={1000} size={1100} width={5} />
      <Sparks t={t} at={tD + 0.85} x={target.x + (IN_PASS.w * DEV5.k) / 2} y={target.y + 160} n={20} dist={380} />
    </AbsoluteFill>
  )
}

/* Les cartes s'ouvrent en éventail */
const FAN = [-24, -8, 8, 24]
export const S6_Wallets = () => {
  const t = useT()
  const tA = W('e06', 1)
  const tG = W('e06', 4)
  const tZ = beat(17) // « Aucune », sur le temps
  const fan = springy(t, tA - 0.1, 1.6, 8)
  const away = ts(t, tZ - 0.2, tZ, 0, 1, inE)
  const zero = springy(t, tZ, 1.6, 8)
  const txt = springy(t, W('e06', 9) - 0.25, 2, 9)
  const badge = (at, from) => {
    const a = springy(t, at, 1.8, 9)
    return { transform: `translateX(${(1 - Math.min(1, a)) * from}px) rotate(${(1 - Math.min(1, a)) * (from > 0 ? 12 : -12)}deg)`, opacity: t >= at ? 1 : 0 }
  }
  return (
    <AbsoluteFill>
      {away < 1 && (
        <AbsoluteFill style={{ transform: `scale(${1 + 1.6 * away})`, filter: away > 0 ? `blur(${away * 26}px)` : undefined, opacity: 1 - away }}>
          {WALLET_STACK.map((c, k) => {
            const a = Math.min(1.05, fan)
            const rise = springy(t, 16.42 + k * 0.06, 2, 9)
            return (
              <div key={c.name} style={{ position: 'absolute', left: 540 - 200, top: 600 + (1 - Math.min(1, rise)) * 900, transformOrigin: '50% 130%', transform: `rotate(${FAN[k] * a}deg) translateY(${-Math.abs(FAN[k]) * 1.5 * a}px)`, zIndex: k }}>
                <Pass width={400} skin={c.skin} name={c.name} mark={c.mark} points={c.pts} light={0.35} ry={Math.sin(t * 1.2 + k) * 6} />
              </div>
            )
          })}
          <div style={{ position: 'absolute', left: 0, width: 1080, top: 1340, display: 'flex', justifyContent: 'center', gap: 36, zIndex: 10 }}>
            <Img src={staticFile('explication/apple-wallet-button.png')} style={{ height: 124, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.8))', ...badge(tA, -900) }} />
            <Img src={staticFile('explication/google-wallet-button.svg')} style={{ height: 124, filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.8))', ...badge(tG, 900) }} />
          </div>
        </AbsoluteFill>
      )}
      {t >= tZ && (
        <div style={{ position: 'absolute', left: 0, width: 1080, top: 520, textAlign: 'center', fontFamily }}>
          <div className="zero" style={{ fontSize: 720, display: 'inline-block', transform: `scale(${Math.max(0, 2.2 - 1.2 * Math.min(1.05, zero))})`, opacity: Math.min(1, (t - tZ) / 0.08), paddingRight: 30 }}>0</div>
          <div style={{ fontSize: 86, fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1, color: C.text, marginTop: 30, opacity: Math.min(1, txt * 1.4), transform: `translateY(${(1 - Math.min(1, txt)) * 50}px)` }}>
            téléchargement.<br /><span style={{ color: C.muted }}>Zéro friction.</span>
          </div>
        </div>
      )}
      <Ring t={t} at={tZ} x={540} y={900} size={1400} width={6} />
    </AbsoluteFill>
  )
}

export const STEPS = [
  { x: 230, label: 'Ta carte' },
  { x: 540, label: 'Ton client' },
  { x: 850, label: 'Ses points' },
]
export const SY = 1180

export const S7_Etapes = () => {
  const t = useT()
  const times = [beat(24), beat(25), beat(26)] // 1, 2, 3 sur trois temps
  const line = ts(t, times[0], times[2] + 0.2, 0, 1, ioE)
  return (
    <AbsoluteFill>
      <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0 }}>
        <line x1={STEPS[0].x} y1={SY} x2={lerp(STEPS[0].x, STEPS[2].x, line)} y2={SY} stroke="rgba(41,151,255,0.7)" strokeWidth="7" strokeDasharray="2 18" strokeLinecap="round" />
      </svg>
      {STEPS.map((st, i) => {
        const a = springy(t, times[i], 2, 9)
        if (t < times[i]) return null
        return (
          <div key={i}>
            <div style={{ position: 'absolute', left: st.x - 115, top: SY - 115, width: 230, height: 230, borderRadius: 115, background: C.blueBtn, border: '4px solid #5ab0ff', display: 'grid', placeItems: 'center', fontFamily, fontWeight: 900, fontSize: 130, color: C.text, transform: `scale(${Math.max(0, 2 - Math.min(1.06, a))})`, opacity: Math.min(1, (t - times[i]) / 0.06), boxShadow: '0 0 90px rgba(41,151,255,0.6)' }}>{i + 1}</div>
            <div style={{ position: 'absolute', left: st.x - 170, width: 340, top: SY + 150, textAlign: 'center', fontFamily, fontSize: 46, fontWeight: 700, color: C.text, opacity: Math.min(1, a) }}>{st.label}</div>
            <Ring t={t} at={times[i]} x={st.x} y={SY} size={520} width={4} />
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

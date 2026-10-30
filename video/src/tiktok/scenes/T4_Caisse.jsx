import { AbsoluteFill } from 'remotion'
import { Check } from 'lucide-react'
import { C, W, fontFamily, inE, ioE, lerp, springy, ts, useT } from '../../lib'
import { Odometer, Pass } from '../../Pass'
import { AuroraV, Flash, Pop, Ring, Sticker, shake, shakeStyle } from '../kit'
import { CARD_D } from './T3_Design'

/* 4 — En caisse (13,0 – 15,3 s)
   Un faisceau balaie le QR code de la carte, « bip », la carte est lue.
   Vingt points jaillissent du QR code et grimpent dans le compteur, qui roule de 460 à 480.
   La carte tombe ensuite hors du cadre (scène 5). */

const QR = { x: CARD_D.x, y: CARD_D.y - (CARD_D.w * 1.58) / 2 + CARD_D.w * 1.2003 }
const COUNTER = { x: 540, y: 560 }

export const T4_Caisse = () => {
  const t = useT()
  if (t < 13.05 || t > 15.5) return null

  const tScan = 13.45
  const tBeep = 14.05
  const tPts = W('t06', 3)
  const scan = t >= tScan && t <= tBeep ? ts(t, tScan, tBeep, 0, 1, ioE) : null
  const landAt = i => tPts + 0.28 + i * 0.03
  const landed = Array.from({ length: 20 }, (_, i) => i).filter(i => t >= landAt(i)).length
  const pts = 460 + landed
  const panel = springy(t, 13.1, 1.8, 8)
  const sh = shake(t, tBeep, 14, 0.3)
  const out = ts(t, 15.0, 15.4, 0, 1, inE)

  return (
    <AbsoluteFill>
      <AuroraV t={t} intensity={0.75} hue={3.4} />
      <AbsoluteFill style={{ ...shakeStyle(sh), opacity: 1 - out * 0.0 }}>
        {/* Compteur de points */}
        <div style={{ position: 'absolute', left: 90, top: 330, width: 900, height: 440, borderRadius: 56, background: 'rgba(22,22,24,0.92)', border: `1px solid ${C.line}`, boxShadow: '0 60px 120px -40px rgba(0,0,0,0.9)', fontFamily, transform: `scale(${Math.max(0, panel)})`, opacity: 1 - out }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '34px 44px 0' }}>
            <div style={{ width: 74, height: 74, borderRadius: 37, background: 'linear-gradient(135deg, #2997ff, #0b3a8f)', display: 'grid', placeItems: 'center', fontSize: 34, fontWeight: 800, color: '#fff' }}>C</div>
            <div>
              <div style={{ fontSize: 36, fontWeight: 700, color: C.text, letterSpacing: '-0.03em' }}>Camille R.</div>
              <div style={{ fontSize: 24, color: C.muted }}>Maison Lumière · Apple Wallet</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 20, marginTop: 16 }}>
            <div style={{ fontSize: 250, fontWeight: 700, color: C.text, letterSpacing: '-0.06em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              <Odometer value={pts} />
            </div>
            <div style={{ fontSize: 42, color: C.muted, fontWeight: 600 }}>pts</div>
          </div>
          <div style={{ margin: '14px 54px 0', height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div style={{ width: `${(pts / 500) * 100}%`, height: '100%', borderRadius: 7, background: `linear-gradient(90deg, ${C.blue}, ${C.champagne})` }} />
          </div>
        </div>

        {/* La carte, de face, pendant le scan */}
        <div style={{ position: 'absolute', left: CARD_D.x - CARD_D.w / 2, top: CARD_D.y - (CARD_D.w * 1.58) / 2 + out * 900, opacity: 1 - out * 0.4 }}>
          <Pass width={CARD_D.w} light={0.7} points={pts} scan={scan} />
        </div>
        {scan != null && (
          <div style={{ position: 'absolute', left: QR.x - 240, top: QR.y - 240, width: 480, height: 480, borderRadius: 40, boxShadow: `0 0 0 ${3 + 6 * scan}px rgba(41,151,255,${0.5 * scan})`, pointerEvents: 'none' }} />
        )}

        {/* Les points qui montent du QR code vers le compteur */}
        {Array.from({ length: 20 }, (_, i) => {
          const a = landAt(i) - 0.5
          const p = ts(t, a, landAt(i), 0, 1, x => x * x * (3 - 2 * x))
          if (p <= 0 || p >= 1) return null
          const dx = Math.sin(i * 2.1) * 230
          const x = lerp(QR.x + Math.sin(i * 5.7) * 60, COUNTER.x + Math.sin(i * 3.3) * 120, p) + Math.sin(p * Math.PI) * dx
          const y = lerp(QR.y, COUNTER.y, p)
          return <div key={i} style={{ position: 'absolute', left: x - 13, top: y - 13, width: 26, height: 26, borderRadius: 13, background: i % 3 ? C.champagne : C.blue, boxShadow: `0 0 26px ${i % 3 ? 'rgba(227,201,164,0.95)' : 'rgba(41,151,255,0.95)'}`, opacity: 1 - 0.3 * p }} />
        })}
      </AbsoluteFill>

      <Ring t={t} at={tBeep} x={QR.x} y={QR.y} size={900} />
      <Flash t={t} at={tBeep} color={C.blue} strength={0.28} />
      <div style={{ opacity: 1 - out }}>
      <Sticker t={t} at={tBeep + 0.03} x={540} y={1000} rot={-4} size={50} bg={C.blueBtn} fg="#fff">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}><Check size={46} strokeWidth={3.4} /> Carte lue</span>
      </Sticker>
      <Sticker t={t} at={tPts + 0.2} x={800} y={380} rot={7} size={62} bg={C.champagne} fg="#2b1f12">+20</Sticker>
      </div>

      <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Pop id="t06" only={[0, 1]} size={122} out={13.72} accent={{ 1: C.blue }} />
      </div>
      <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Pop id="t06" only={[2, 4]} size={122} out={15.0} accent={{ 3: C.champagne, 4: C.champagne }} />
      </div>
    </AbsoluteFill>
  )
}

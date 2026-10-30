import { AbsoluteFill } from 'remotion'
import { Aurora, C, W, Words, camera, fontFamily, geo, inE, ioE, lerp, outE, springy, ts, useT } from '../lib'
import { Odometer, QRCode } from '../Pass'
import { QR_FILL } from './D_Signup'

/* E — En caisse (25 – 30 s)
   On ressort du QR code : il est maintenant dans le scanner de la caisse.
   « un scan » : l'anneau se ferme. « les points tombent » : vingt points tombent du haut du cadre
   dans le compteur, qui roule de 460 à 480. */

const PANEL = { x: 240, y: 210, w: 1440, h: 700 }
const VIEW = { x: PANEL.x + 56, y: PANEL.y + 140, s: 480 }
const QR_PX = 220
const QR_C = { x: VIEW.x + VIEW.s / 2, y: VIEW.y + VIEW.s / 2 - 10 }
const PTS = { x: PANEL.x + 640 + 46, y: PANEL.y + 330 } // haut à gauche du compteur

// Instants d'arrivée des 20 points
const landings = Array.from({ length: 20 }, (_, i) => i)

export const TOAST = { x: PANEL.x + PANEL.w - 24 - 320, y: PANEL.y + 24, w: 320, h: 62 }

export const E_Caisse = () => {
  const t = useT()
  if (t < 24.98 || t > 30.4) return null

  const tScan = W('v07', 3)
  const tPts = W('v07', 6)
  const land = i => tPts - 0.05 + i * 0.045 + Math.sin(i * 2.3) * 0.02

  // Entrée : la caméra ressort du QR code
  const pull = ts(t, 24.98, 25.75, 0, 1, x => 1 - Math.pow(1 - x, 3))
  const cam = camera(QR_C.x, QR_C.y, geo(pull, QR_FILL / QR_PX, 1), 1 - pull)

  const ring = ts(t, tScan - 0.55, tScan, 0, 1, ioE)
  const ok = ts(t, tScan, tScan + 0.15)
  const flash = ok * (1 - ts(t, tScan + 0.1, tScan + 0.5))
  const client = ts(t, tScan + 0.05, tScan + 0.45, 0, 1, outE)
  const landed = landings.filter(i => t >= land(i)).length
  const pts = 460 + landed
  const plus = springy(t, tPts, 2.4, 7) * (1 - ts(t, 28.6, 28.9))
  const toast = ts(t, 28.05, 28.35, 0, 1, outE)
  const out = ts(t, 29.6, 30.25, 0, 1, inE)

  return (
    <AbsoluteFill>
      <Aurora t={t} intensity={0.55 * pull * (1 - out)} hue={3} />
      <AbsoluteFill style={{ ...(pull < 1 ? cam : {}), opacity: 1 - out, filter: out ? `blur(${out * 12}px)` : undefined }}>
        <AbsoluteFill style={{ transform: `scale(${1 - out * 0.08})` }}>
          {/* Panneau caisse */}
          <div style={{ position: 'absolute', left: PANEL.x, top: PANEL.y, width: PANEL.w, height: PANEL.h, borderRadius: 30, background: C.surface, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 60px 140px -40px rgba(0,0,0,0.95)', fontFamily, opacity: ts(t, 25.2, 25.6) }}>
            <div style={{ position: 'absolute', left: 56, top: 44 }}>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.14em', color: C.blue }}>ENCAISSER</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: C.text, letterSpacing: '-0.035em', marginTop: 6 }}>Caisse</div>
            </div>
            {/* Fiche client */}
            <div style={{ position: 'absolute', left: 640, top: 140, width: 744, height: 480, borderRadius: 26, background: '#161618', border: `1px solid ${C.line}`, padding: 46, opacity: client, transform: `translateX(${(1 - client) * 40}px)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <div style={{ width: 68, height: 68, borderRadius: 34, background: 'linear-gradient(135deg, #2997ff, #0b3a8f)', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 700, color: '#fff' }}>C</div>
                <div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: C.text, letterSpacing: '-0.03em' }}>Camille R.</div>
                  <div style={{ fontSize: 17, color: C.muted, marginTop: 4 }}>Carte 2BF10B · Apple Wallet</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 46 }}>
                <div style={{ fontSize: 132, fontWeight: 600, color: C.text, letterSpacing: '-0.05em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  <Odometer value={pts} />
                </div>
                <div style={{ fontSize: 28, color: C.muted }}>points</div>
                <div style={{ marginLeft: 18, fontSize: 44, fontWeight: 700, color: C.champagne, transform: `scale(${Math.max(0, plus)})`, transformOrigin: 'left center' }}>+20</div>
              </div>
              <div style={{ marginTop: 34, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ width: `${(pts / 500) * 100}%`, height: '100%', borderRadius: 5, background: `linear-gradient(90deg, ${C.blue}, ${C.champagne})` }} />
              </div>
              <div style={{ marginTop: 14, fontSize: 19, color: C.muted }}>Plus que {500 - pts} points avant le café offert</div>
            </div>
          </div>

          {/* Scanner */}
          <div style={{ position: 'absolute', left: VIEW.x, top: VIEW.y, width: VIEW.s, height: VIEW.s, borderRadius: 28, overflow: 'hidden', background: 'radial-gradient(circle at 50% 40%, #26262a, #0c0c0e)' }}>
            {[[0, 0, 0], [1, 0, 90], [1, 1, 180], [0, 1, 270]].map(([x, y, r], i) => (
              <div key={i} style={{ position: 'absolute', left: 60 + x * (VIEW.s - 160), top: 60 + y * (VIEW.s - 160), width: 40, height: 40, borderTop: '4px solid #fff', borderLeft: '4px solid #fff', borderTopLeftRadius: 14, transform: `rotate(${r}deg)`, transformOrigin: '20px 20px', opacity: 0.85 * ts(t, 25.3, 25.6) }} />
            ))}
            <svg width={VIEW.s} height={VIEW.s} style={{ position: 'absolute', inset: 0 }}>
              <circle cx={VIEW.s / 2} cy={VIEW.s / 2} r={VIEW.s / 2 - 26} fill="none" stroke={C.blue} strokeWidth="5" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - ring} transform={`rotate(-90 ${VIEW.s / 2} ${VIEW.s / 2})`} style={{ filter: 'drop-shadow(0 0 10px rgba(41,151,255,0.8))' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, background: `rgba(41,151,255,${0.22 * flash})` }} />
          </div>
          {/* Le QR code présenté par le client (même proportions que sur le pass) */}
          <div style={{ position: 'absolute', left: QR_C.x - QR_PX / 2 - 16, top: QR_C.y - QR_PX / 2 - 16, width: QR_PX + 32, padding: 16, paddingBottom: 10, borderRadius: 14, background: '#fff', textAlign: 'center' }}>
            <div style={{ width: QR_PX, height: QR_PX, color: '#000' }}><QRCode /></div>
            <div style={{ fontFamily: 'Consolas, monospace', fontSize: 15, fontWeight: 600, color: '#333', marginTop: 6 }}>N° Carte : 2BF10B</div>
          </div>
          {ok > 0 && (
            <div style={{ position: 'absolute', left: QR_C.x - 36, top: QR_C.y - 36, width: 72, height: 72, borderRadius: 36, background: C.blueBtn, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 36, fontWeight: 700, transform: `scale(${Math.max(0, springy(t, tScan, 2.4, 8))})`, opacity: 1 - ts(t, tScan + 0.8, tScan + 1.1), boxShadow: '0 10px 40px rgba(41,151,255,0.6)' }}>✓</div>
          )}

          {/* Les points qui tombent dans le compteur */}
          {landings.map(i => {
            const a = land(i) - 0.55
            const p = ts(t, a, land(i), 0, 1, x => x * x)
            if (p <= 0 || p >= 1) return null
            const x = PTS.x + 60 + Math.sin(i * 7.1) * 160
            return (
              <div key={i} style={{ position: 'absolute', left: lerp(x, PTS.x + 120, p) - 9, top: lerp(-40, PTS.y + 60, p) - 9, width: 18, height: 18, borderRadius: 9, background: i % 3 ? C.champagne : C.blue, boxShadow: `0 0 18px ${i % 3 ? 'rgba(227,201,164,0.9)' : 'rgba(41,151,255,0.9)'}`, opacity: 1 - p * 0.3 }} />
            )
          })}
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Confirmation, qui deviendra la fenêtre de notification (scène F) */}
      {toast > 0 && t < 29.62 && (
        <div style={{ position: 'absolute', left: TOAST.x, top: TOAST.y, width: TOAST.w, height: TOAST.h, opacity: toast, transform: `translateY(${(1 - toast) * -20}px)`, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px', borderRadius: 31, background: '#1c1c1e', border: `1px solid ${C.line}`, boxShadow: '0 20px 40px rgba(0,0,0,0.5)', fontFamily }}>
          <div style={{ width: 26, height: 26, borderRadius: 13, background: C.blueBtn, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 700 }}>✓</div>
          <div style={{ fontSize: 19, fontWeight: 600, color: C.text }}>+20 points ajoutés</div>
        </div>
      )}

      <div style={{ position: 'absolute', top: 76, width: '100%', display: 'flex', justifyContent: 'center', opacity: 1 - out }}>
        <Words id="v07" size={60} weight={650} out={29.5} accent={{ 3: C.blue, 6: C.champagne, 7: C.champagne }} />
      </div>
    </AbsoluteFill>
  )
}

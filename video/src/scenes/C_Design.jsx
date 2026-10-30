import { AbsoluteFill } from 'remotion'
import { ImagePlus } from 'lucide-react'
import { Aurora, C, Logo, W, Words, fontFamily, inE, ioE, lerp, outE, springy, ts, useT } from '../lib'
import { Pass, StripPhoto } from '../Pass'
import { STUDIO } from './B_Reveal'

/* C — Personnalisation (14 – 20 s)
   La carte se « vide » en gabarit, puis se reconstruit mot après mot :
   logo (il vole du panneau jusqu'à la carte), trois couleurs (vagues circulaires depuis le nuancier),
   photo. Tour complet de la carte, puis elle pivote sur sa tranche et devient un téléphone (scène D). */

const CW = STUDIO.w
const CH = CW * 1.58
const EM = CW * 0.0533
const CARD = { left: STUDIO.x - CW / 2, top: STUDIO.y - CH / 2 }
const MARK = { x: CARD.left + 1.25 * EM + EM, y: CARD.top + 1.25 * EM + EM }

const SKINS = [
  { id: 'azur', sw: '#0b3a8f' },
  { id: 'champagne', sw: '#dcc39d' },
  { id: 'graphite', sw: '#1c1c1e' },
]
const RIGHT = { x: 1330, y: 300, w: 380 }
const LEFT = { x: 210, y: 330, w: 380 }
const swatch = i => ({ x: RIGHT.x + 40 + 22 + i * 64, y: RIGHT.y + 96 + 22 })

const Panel = ({ x, y, w, h, side, t, children }) => {
  const inP = ts(t, 14.08 + (side > 0 ? 0.08 : 0), 14.6 + (side > 0 ? 0.08 : 0), 0, 1, outE)
  const outP = ts(t, 16.9, 17.3, 0, 1, inE)
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, perspective: 1400 }}>
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 26,
          background: 'rgba(28,28,30,0.72)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 40px 80px -30px rgba(0,0,0,0.9)',
          fontFamily,
          color: C.text,
          padding: 30,
          opacity: inP * (1 - outP),
          transform: `translateX(${side * ((1 - inP) * 140 + outP * 260)}px) rotateY(${side * (-14 - (1 - inP) * 50)}deg)`,
          filter: outP > 0 ? `blur(${outP * 8}px)` : undefined,
        }}
      >
        {children}
      </div>
    </div>
  )
}

const Pointer = ({ x, y, press }) => (
  <svg width="34" height="34" viewBox="0 0 24 24" style={{ position: 'absolute', left: x - 6, top: y - 3, transform: `scale(${1 - press * 0.15})`, transformOrigin: '6px 3px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.6))' }}>
    <path d="M5 3l14 7.5-6.2 1.6L9.6 18z" fill="#fff" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
)

export const C_Design = () => {
  const t = useT()
  if (t < 13.98 || t > 19.7) return null

  const tLogo = W('v05', 1)
  const tColor = W('v05', 3)
  const tPhoto = W('v05', 5)
  const colorAt = [tColor, tColor + 0.42, tColor + 0.84]

  // Gabarit : la carte terminée s'efface de gauche à droite et laisse le gabarit vierge
  const wipeOut = ts(t, 14.05, 14.4, 0, 1, ioE)
  const mark = springy(t, tLogo + 0.05, 2.2, 8)
  const name = 'Maison Lumière'.slice(0, Math.round(ts(t, tLogo + 0.1, tLogo + 0.5, 0, 14, x => x)))
  const strip = t < 14.4 ? 1 : ts(t, tPhoto - 0.05, tPhoto + 0.45, 0, 1, ioE)
  const stripShift = lerp(60, 0, ts(t, tPhoto, tPhoto + 1.4, 0, 1, outE))

  // Rotation : tour complet sur « elle vous ressemble », puis pivot sur la tranche (vers D)
  const spin = ts(t, W('v05', 6) - 0.05, W('v05', 6) + 0.85, 0, 1, ioE)
  const flip = ts(t, 19.3, 19.66, 0, 1, inE)
  const ry = spin * 360 + flip * 90 + Math.sin(t * 1.6) * 4 * (1 - flip)
  const rx = Math.sin(t * 1.1) * 3
  const cx = lerp(STUDIO.x, 1240, flip)
  const sc = lerp(1, 1.25, flip)

  const common = {
    width: CW,
    rx,
    ry,
    points: 480,
    light: lerp(0.1, 1, ts(t, 14, 19.6, 0, 1, x => x)),
    markScale: Math.max(0, mark),
    markOpacity: Math.min(1, Math.max(0, mark * 2)),
    name: t < 14.4 ? 'Maison Lumière' : name,
    strip,
    stripShift,
  }

  // Couches de couleur : chacune s'étend en cercle depuis le nuancier
  const layers = [{ skin: 'blank', r: 1 }, ...SKINS.map((s, i) => ({ skin: s.id, r: ts(t, colorAt[i], colorAt[i] + 0.45, 0, 1, ioE) }))]
  let base = 0
  layers.forEach((l, i) => { if (l.r >= 1) base = i })

  // Logo qui vole du panneau à la carte
  const fly = ts(t, tLogo - 0.28, tLogo + 0.08, 0, 1, ioE)
  const logoFrom = { x: LEFT.x + 30 + 30, y: LEFT.y + 96 + 30 }

  // Pointeur : du nuancier, un clic par couleur
  const pi = colorAt.findIndex(a => t < a + 0.1)
  const target = swatch(pi < 0 ? 2 : pi)
  const prev = swatch(Math.max(0, (pi < 0 ? 2 : pi) - 1))
  const mv = pi <= 0 ? ts(t, 14.9, colorAt[0] - 0.05, 0, 1, ioE) : ts(t, colorAt[pi - 1] + 0.1, colorAt[pi] - 0.05, 0, 1, ioE)
  const start = pi <= 0 ? { x: 1500, y: 700 } : prev
  const px = lerp(start.x, target.x, mv)
  const py = lerp(start.y, target.y, mv)
  const press = Math.max(...colorAt.map(a => Math.sin(Math.PI * ts(t, a - 0.06, a + 0.08, 0, 1, x => x))))
  const pointerOn = ts(t, 14.85, 15.05) * (1 - ts(t, 16.6, 16.9))

  return (
    <AbsoluteFill>
      <Aurora t={t} intensity={0.75} hue={1} />

      <Panel x={LEFT.x} y={LEFT.y} w={LEFT.w} h={250} side={-1} t={t}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: C.blue }}>LOGO</div>
        <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 16, padding: 0 }}>
          <div style={{ width: 60, height: 60, borderRadius: 14, background: 'linear-gradient(135deg, #f6e4c8, #b8926a)', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: 30, color: '#1d1d1f', opacity: fly > 0 && fly < 1 ? 0.35 : 1 }}>L</div>
          <div>
            <div style={{ fontSize: 19, fontWeight: 600 }}>maison-lumiere.png</div>
            <div style={{ fontSize: 15, color: C.muted, marginTop: 4 }}>{t >= tLogo ? 'Importé' : 'Importation…'}</div>
          </div>
        </div>
        <div style={{ marginTop: 26, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ width: `${ts(t, 14.3, tLogo, 0, 100, x => x)}%`, height: '100%', background: C.blue }} />
        </div>
      </Panel>

      <Panel x={RIGHT.x} y={RIGHT.y} w={RIGHT.w} h={190} side={1} t={t}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: C.blue }}>COULEUR</div>
        <div style={{ display: 'flex', gap: 20, marginTop: 30 }}>
          {[...SKINS, { id: 'ivory', sw: '#f5f5f7' }].map((s, i) => {
            const on = i < 3 && t >= colorAt[i] && (i === 2 || t < colorAt[i + 1])
            return <div key={s.id} style={{ width: 44, height: 44, borderRadius: 22, background: s.sw, border: '1px solid rgba(255,255,255,0.25)', boxShadow: on ? `0 0 0 3px #1c1c1e, 0 0 0 6px ${C.blue}` : 'none' }} />
          })}
        </div>
      </Panel>

      <Panel x={RIGHT.x} y={RIGHT.y + 230} w={RIGHT.w} h={250} side={1} t={t}>
        <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: C.blue }}>PHOTO</div>
        <div style={{ marginTop: 20, height: 130, borderRadius: 16, overflow: 'hidden', position: 'relative', background: '#1c1c1e', border: `1px dashed ${C.line}` }}>
          <div style={{ position: 'absolute', inset: 0, opacity: ts(t, tPhoto - 0.4, tPhoto - 0.1) }}><StripPhoto /></div>
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: C.muted, opacity: 1 - ts(t, tPhoto - 0.4, tPhoto - 0.1) }}><ImagePlus size={34} /></div>
        </div>
      </Panel>

      {/* La carte */}
      <div style={{ position: 'absolute', left: cx - CW / 2, top: CARD.top, transform: `scale(${sc})` }}>
        {t < 14.4 ? (
          <div style={{ position: 'relative' }}>
            <Pass {...common} skin="blank" name="" strip={0} markOpacity={0} />
            <div style={{ position: 'absolute', inset: 0, clipPath: `inset(-10% -10% -10% ${wipeOut * 110 - 5}%)` }}>
              <Pass {...common} skin="graphite" markScale={1} markOpacity={1} />
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', transformStyle: 'preserve-3d' }}>
            {layers.slice(base).map((l, k) => (
              <div key={l.skin} style={k === 0 ? { position: 'relative', transformStyle: 'preserve-3d' } : { position: 'absolute', inset: 0, clipPath: `circle(${l.r * 125}% at 108% 22%)` }}>
                <Pass {...common} skin={l.skin} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logo en vol */}
      {fly > 0 && fly < 1 && (
        <div style={{ position: 'absolute', left: lerp(logoFrom.x, MARK.x, fly) - 30, top: lerp(logoFrom.y, MARK.y, fly) - 30 - Math.sin(Math.PI * fly) * 120, width: 60, height: 60, borderRadius: 14, background: 'linear-gradient(135deg, #f6e4c8, #b8926a)', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: 30, color: '#1d1d1f', transform: `scale(${lerp(1, 0.75, fly)}) rotate(${fly * 360}deg)`, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}>L</div>
      )}

      {pointerOn > 0 && (
        <div style={{ opacity: pointerOn }}>
          {colorAt.map((a, i) => {
            const r = ts(t, a, a + 0.4, 0, 1, outE)
            if (r <= 0 || r >= 1) return null
            const s = swatch(i)
            return <div key={i} style={{ position: 'absolute', left: s.x - 22 - r * 30, top: s.y - 22 - r * 30, width: 44 + r * 60, height: 44 + r * 60, borderRadius: '50%', border: `2px solid rgba(41,151,255,${1 - r})` }} />
          })}
          <Pointer x={px} y={py} press={press} />
        </div>
      )}

      {/* Texte */}
      <div style={{ position: 'absolute', top: 918, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Words id="v05" only={[0, 5]} size={52} weight={600} out={16.95} accent={{ 1: C.champagne, 3: C.champagne, 5: C.champagne }} />
      </div>
      <div style={{ position: 'absolute', top: 918, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Words id="v05" only={[6, 11]} size={52} weight={600} out={19.25} accent={{ 8: C.blue }} />
      </div>
      <div style={{ position: 'absolute', left: 64, top: 56, opacity: ts(t, 14.1, 14.5) * (1 - ts(t, 16.9, 17.3)) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily, fontSize: 20, fontWeight: 600, color: C.muted }}>
          <Logo size={34} style={{ boxShadow: 'none' }} /> Studio de la carte
        </div>
      </div>
    </AbsoluteFill>
  )
}

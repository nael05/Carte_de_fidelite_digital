import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { C, Spot, Type, camera, fontFamily, geo, inE, ioE, lerp, tw } from '../lib'
import { Pass } from '../Pass'

/* Scène 4 — Personnalisation (24 – 40 s)
   Gabarit en fil → logo → quatre skins sur quatre temps → bannière photo
   → le studio se dessine autour de la carte → le contour devient un écran de téléphone. */

const W = 380
const H = W * 1.58
const EM = W * 0.0533

const SKINS = [
  { id: 'ivory', label: 'Ivoire', at: 90, sw: '#f5f5f7' },
  { id: 'champagne', label: 'Champagne', at: 118, sw: '#dcc39d' },
  { id: 'azur', label: 'Bleu nuit', at: 146, sw: '#0b3a8f' },
  { id: 'graphite', label: 'Graphite', at: 174, sw: '#1c1c1e' },
]

const typed = (text, f, a, b) => text.slice(0, Math.round(tw(f, a, b, 0, text.length, t => t)))

const Wire = ({ f }) => {
  const draw = tw(f, 4, 44, 0, 1, ioE)
  const dash = { pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - draw }
  const stripTop = EM + 2.5 * EM + 0.75 * EM
  const qrW = 10 * EM
  const qrTop = H - EM - qrW * 1.2
  return (
    <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }} fill="none" stroke="rgba(245,245,247,0.75)" strokeWidth="1.5">
      <rect x="0.75" y="0.75" width={W - 1.5} height={H - 1.5} rx={W * 0.05} {...dash} />
      <rect x={1.25 * EM} y={EM + 0.25 * EM} width={2 * EM} height={2 * EM} rx={0.45 * EM} strokeDasharray="4 4" opacity={draw} />
      <path d={`M${3.8 * EM} ${EM + 1.25 * EM}h${7 * EM}`} {...dash} strokeWidth="6" strokeLinecap="round" stroke="rgba(245,245,247,0.18)" />
      <path d={`M${W - 4.2 * EM} ${EM + 0.9 * EM}h${3 * EM}M${W - 3.4 * EM} ${EM + 1.7 * EM}h${2.2 * EM}`} {...dash} strokeWidth="5" strokeLinecap="round" stroke="rgba(245,245,247,0.18)" />
      <rect x="0" y={stripTop} width={W} height={7.5 * EM} {...dash} />
      <path d={`M${1.25 * EM} ${stripTop + 7.5 * EM + 1.6 * EM}h${4 * EM}M${1.25 * EM} ${stripTop + 7.5 * EM + 2.6 * EM}h${6 * EM}`} {...dash} strokeWidth="6" strokeLinecap="round" stroke="rgba(245,245,247,0.18)" />
      <rect x={(W - qrW) / 2} y={qrTop} width={qrW} height={qrW * 1.2} rx={0.5 * EM} {...dash} />
    </svg>
  )
}

const Field = ({ label, value, caret, style }) => (
  <div style={style}>
    <div style={{ fontSize: 15, fontWeight: 600, color: C.muted, marginBottom: 10 }}>{label}</div>
    <div style={{ height: 52, borderRadius: 14, background: '#1c1c1e', border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 18px', fontSize: 19, color: C.text }}>
      {value}
      {caret && <span style={{ width: 2, height: 22, background: C.blue, marginLeft: 2 }} />}
    </div>
  </div>
)

const Studio = ({ f }) => {
  const frame = tw(f, 338, 372, 0, 1, ioE)
  const fill = tw(f, 360, 390)
  const item = n => {
    const p = tw(f, 368 + n * 7, 392 + n * 7)
    return { opacity: p, transform: `translateY(${(1 - p) * 14}px)` }
  }
  const name = typed('Maison Lumière', f, 384, 408)
  const reward = typed('500 points = 1 café offert', f, 404, 440)
  return (
    <div style={{ position: 'absolute', left: 200, top: 250, width: 660, height: 650, fontFamily }}>
      <svg width="660" height="650" style={{ position: 'absolute', inset: 0 }}>
        <rect x="1" y="1" width="658" height="648" rx="28" fill={`rgba(17,17,19,${fill})`} stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - frame} />
      </svg>
      <div style={{ position: 'relative', padding: 40 }}>
        <div style={{ ...item(0), display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: C.text, letterSpacing: '-0.03em' }}>Studio de la carte</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.blue }}>Aperçu en direct</div>
        </div>

        <div style={{ ...item(1), marginTop: 34 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Couleur</div>
          <div style={{ display: 'flex', gap: 14 }}>
            {SKINS.map(s => (
              <div key={s.id} style={{ width: 44, height: 44, borderRadius: 22, background: s.sw, border: '1px solid rgba(255,255,255,0.2)', boxShadow: s.id === 'graphite' ? `0 0 0 3px #000, 0 0 0 5px ${C.blue}` : 'none' }} />
            ))}
          </div>
        </div>

        <div style={{ ...item(2), marginTop: 30 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: C.muted, marginBottom: 12 }}>Logo</div>
          <div style={{ height: 60, borderRadius: 14, background: '#1c1c1e', border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 12px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: 'linear-gradient(135deg, #f6e4c8, #b8926a)', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, color: '#1d1d1f' }}>L</div>
            <div style={{ fontSize: 18, color: C.text, flex: 1 }}>maison-lumiere.png</div>
            <div style={{ width: 26, height: 26, borderRadius: 13, background: C.blueBtn, color: '#fff', fontSize: 15, display: 'grid', placeItems: 'center', fontWeight: 700 }}>✓</div>
          </div>
        </div>

        <Field label="Nom du commerce" value={name} caret={f >= 384 && f < 412} style={{ ...item(3), marginTop: 30 }} />
        <Field label="Récompense" value={reward} caret={f >= 404 && f < 446} style={{ ...item(4), marginTop: 24 }} />
      </div>
    </div>
  )
}

export const S4Design = () => {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()

  const dissolve = tw(f, 8, 40)
  const toLeft = tw(f, 18, 70, 0, 1, ioE)
  const toStudio = tw(f, 330, 384, 0, 1, ioE)
  // Sortie : le studio file hors champ, la caméra plonge dans le noir de la carte
  const panelOut = tw(f, 434, 460, 0, 1, inE)
  const push = tw(f, 444, 480, 0, 1, t => Math.pow(t, 1.6))

  const cx = lerp(lerp(960, 620, toLeft), 1290, toStudio)
  const cy = lerp(540, 560, toStudio)
  const s = lerp(1, 0.92, toStudio)

  const drop = spring({ frame: f - 46, fps, config: { damping: 15, stiffness: 140, mass: 0.8 } })
  const orgName = typed('Maison Lumière', f, 62, 84)
  const wireOut = tw(f, 112, 130)

  const strip = tw(f, 214, 262, 0, 1, ioE)
  const stripShift = lerp(40, 0, tw(f, 214, 330, 0, 1, t => t))
  const light = lerp(0.1, 1.0, tw(f, 0, 480, 0, 1, t => t))

  // Point visé : zone sombre de la carte, à gauche du QR code (coordonnées carte 44 × 470)
  const aimX = cx - (W * s) / 2 + 44 * s
  const aimY = cy - (H * s) / 2 + 470 * s
  const cam = camera(aimX, aimY, geo(push, 1, 80), Math.min(1, push * 1.4))

  const skinIdx = SKINS.reduce((acc, sk, i) => (f >= sk.at ? i : acc), -1)

  return (
    <AbsoluteFill style={{ background: C.black }}>
      <AbsoluteFill style={{ ...cam, filter: push > 0 ? `blur(${push * push * 5}px)` : undefined }}>
      <Spot x={cx} y={cy - 80} size={1200} color="rgba(255,255,255,0.07)" />

      <div style={{ position: 'absolute', left: cx - W / 2, top: cy - H / 2, width: W, height: H, transform: `scale(${s})` }}>
        {/* Le pass de la scène 3 se dissout en gabarit */}
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - dissolve }}>
          <Pass width={W} light={0.9} />
        </div>

        <div style={{ position: 'absolute', inset: 0, opacity: dissolve * (1 - wireOut) }}>
          <Wire f={f} />
          <div
            style={{
              position: 'absolute',
              left: 1.25 * EM,
              top: 1.25 * EM,
              width: 2 * EM,
              height: 2 * EM,
              borderRadius: 0.45 * EM,
              background: 'linear-gradient(135deg, #f6e4c8, #b8926a)',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: EM,
              color: '#1d1d1f',
              opacity: f >= 46 ? 1 : 0,
              transform: `translateY(${(1 - drop) * -260}px) scale(${0.6 + 0.4 * drop})`,
            }}
          >
            L
          </div>
          <div style={{ position: 'absolute', left: 3.75 * EM, top: 1.25 * EM, height: 2 * EM, display: 'flex', alignItems: 'center', fontFamily, fontSize: 1.05 * EM, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            {orgName}
          </div>
        </div>

        {/* Quatre skins, la couleur se répand depuis le coin comme une encre */}
        {SKINS.map((sk, i) => {
          const spread = tw(f, sk.at, sk.at + 26, 0, 1, ioE)
          const covered = i < 3 && f >= SKINS[i + 1].at + 26
          // Une couche recouverte n'est plus rendue : les ombres empilées formeraient un halo sombre
          if (spread <= 0 || covered) return null
          return (
            <div key={sk.id} style={{ position: 'absolute', inset: -2, clipPath: spread < 1 ? `circle(${spread * 820}px at 0% 0%)` : 'none' }}>
              <div style={{ position: 'absolute', left: 2, top: 2 }}>
                <Pass width={W} skin={sk.id} light={light} strip={i === 3 ? strip : 0} stripShift={stripShift} />
              </div>
            </div>
          )
        })}
      </div>

      </AbsoluteFill>

      {/* Textes */}
      <div style={{ position: 'absolute', left: 1000, top: 430, width: 800 }}>
        <Type at={44} out={100} size={96}>Votre logo.</Type>
      </div>
      <div style={{ position: 'absolute', left: 1000, top: 400, width: 800 }}>
        <Type at={96} out={204} size={96}>Vos couleurs.</Type>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 34, opacity: tw(f, 100, 120) * (1 - tw(f, 200, 214)) }}>
          {SKINS.map((sk, i) => (
            <div key={sk.id} style={{ width: 34, height: 34, borderRadius: 17, background: sk.sw, border: '1px solid rgba(255,255,255,0.25)', boxShadow: i === skinIdx ? `0 0 0 3px #000, 0 0 0 5px ${C.blue}` : 'none' }} />
          ))}
          <div style={{ position: 'relative', marginLeft: 12, height: 34, width: 260 }}>
            {SKINS.map((sk, i) => (
              <div key={sk.id} style={{ position: 'absolute', fontFamily, fontSize: 28, fontWeight: 500, color: C.muted, opacity: i === skinIdx ? tw(f, sk.at, sk.at + 12) : 0 }}>
                {sk.label}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 1000, top: 430, width: 800 }}>
        <Type at={214} out={322} size={96}>Votre photo.</Type>
      </div>

      <div style={{ opacity: 1 - panelOut, transform: `translateX(${-160 * panelOut}px)`, filter: panelOut > 0 ? `blur(${panelOut * 10}px)` : undefined }}>
        <Studio f={f} />
      </div>
      <div style={{ position: 'absolute', top: 100, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Type at={346} out={430} size={52}>En quelques gestes, la carte prend votre identité.</Type>
      </div>
    </AbsoluteFill>
  )
}

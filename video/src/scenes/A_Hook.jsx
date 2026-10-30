import { AbsoluteFill } from 'remotion'
import { C, MBlur, W, Words, Aurora, fontFamily, geo, inE, ioE, lerp, outE, springy, ts, useT } from '../lib'
import { Pass } from '../Pass'
import { PAPER, PaperCard } from '../ui'

/* A — Accroche (0 – 8 s)
   La carte papier tombe dans le cadre. « Oubliées » : l'encre des tampons s'efface.
   « Perdues » : elle bascule dans le noir. « Jetées » : elle se déchire en deux,
   et dans la déchirure apparaît, au loin, la carte Fidelyz qui arrive sur le temps fort de 8 s. */

// Ligne de déchirure (coordonnées de la carte papier)
const TEAR = (() => {
  let s = 11
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const pts = []
  for (let y = 0; y <= PAPER.h; y += 18) pts.push([300 + (r() - 0.5) * 34 + (y / PAPER.h) * 20, y])
  pts[pts.length - 1][1] = PAPER.h
  return pts
})()
const poly = pts => `polygon(${pts.map(([x, y]) => `${x}px ${y}px`).join(', ')})`
const LEFT = poly([[-40, -40], ...TEAR.map(([x, y], i) => (i === 0 ? [x, -40] : [x, y])), [TEAR[TEAR.length - 1][0], PAPER.h + 40], [-40, PAPER.h + 40]])
const RIGHT = poly([[PAPER.w + 40, -40], ...TEAR.map(([x, y], i) => (i === 0 ? [x, -40] : [x, y])), [TEAR[TEAR.length - 1][0], PAPER.h + 40], [PAPER.w + 40, PAPER.h + 40]])

// La carte numérique arrive ici à 8 s, où la scène B la reprend
export const HERO = { x: 1250, y: 540, w: 380 }

// Particules : la carte papier se désagrège et ses fragments vont former la carte numérique
const PARTICLES = (() => {
  let s = 29
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  return Array.from({ length: 110 }, (_, i) => ({
    side: i % 2 ? 1 : -1,
    ox: (r() - 0.5) * 300,
    oy: (r() - 0.5) * 360,
    born: 5.05 + r() * 0.55,
    arrive: 6.1 + Math.pow(r(), 0.8) * 1.75,
    turn: (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.9),
    size: 5 + r() * 8,
  }))
})()
// Centre d'une moitié de carte déchirée à l'instant t (même mouvement que le rendu)
const halfCenter = (side, t, tJ) => {
  const dt = Math.max(0, t - tJ)
  const apart = ts(t, tJ - 0.02, tJ + 0.25, 0, 1, outE)
  return side < 0
    ? { x: 960 - 155 - apart * 60 - dt * 120, y: 600 + dt * dt * 900 }
    : { x: 960 + 160 + apart * 60 + dt * 150, y: 600 + dt * dt * 1050 }
}

export const A_Hook = () => {
  const t = useT()
  if (t > 8.05) return null

  const tO = W('v02', 0)
  const tP = W('v02', 1)
  const tJ = W('v02', 2)

  // Arrivée : chute avec rebond
  const drop = springy(t, 0.05, 1.6, 7)
  const ink = ts(t, tO - 0.05, tO + 0.7, 0, 1, ioE)
  // « Perdues » : bascule dans le noir
  const lost = ts(t, tP - 0.05, tP + 0.55, 0, 1, outE)
  const whip = Math.sin(Math.PI * ts(t, tP - 0.05, tP + 0.35, 0, 1, x => x))
  // « Jetées » : déchirure puis chute des deux moitiés
  const torn = t >= tJ - 0.02
  const dt = Math.max(0, t - tJ)
  const apart = ts(t, tJ - 0.02, tJ + 0.25, 0, 1, outE)

  const cardY = lerp(-760, 0, drop) + lost * 30
  const rz = lerp(-14, 0, drop) + lost * -8
  const rx = 10 + lost * 34
  const sc = 1 - lost * 0.14
  const dim = 1 - lost * 0.35

  // Carte numérique : naît au loin dans la déchirure et arrive en zoom géométrique
  const born = ts(t, tJ + 0.1, tJ + 0.6, 0, 1, x => x)
  const come = ts(t, tJ + 0.1, 8, 0, 1, x => x * x * (3 - 2 * x))
  const heroW = HERO.w * geo(come, 0.06, 1)
  const hx = lerp(960, HERO.x, ts(t, 6.3, 8, 0, 1, ioE))
  const glow = ts(t, tJ, 8, 0, 1, x => x * x)

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Aurora t={t} intensity={glow * 0.9} />
      {/* Lueur chaude au-dessus de la carte papier, qui s'éteint quand elle est perdue */}
      <div style={{ position: 'absolute', left: 960 - 700, top: 640 - 500, width: 1400, height: 1000, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(239,230,211,0.10), transparent)', opacity: (1 - lost * 0.7) * (torn ? 1 - apart : 1) }} />

      {/* La carte Fidelyz, au loin */}
      {born > 0 && (
        <div style={{ position: 'absolute', left: hx - heroW / 2, top: HERO.y - (heroW * 1.58) / 2, opacity: born }}>
          <Pass width={heroW} ry={lerp(38, -10, come)} rx={lerp(14, 4, come)} light={lerp(-0.4, 0.5, come)} points={480} />
        </div>
      )}

      {/* La carte papier */}
      <div style={{ position: 'absolute', left: 960 - PAPER.w / 2, top: 600 - PAPER.h / 2, perspective: 1600 }}>
        <MBlur id="paperBlur" x={whip * 18} y={whip * 4} />
        <div style={{ transform: `translateY(${cardY}px) rotateX(${rx}deg) rotateZ(${rz}deg) scale(${sc})`, filter: `brightness(${dim}) url(#paperBlur)`, transformStyle: 'preserve-3d' }}>
          {!torn && (
            <div style={{ boxShadow: '0 60px 90px -30px rgba(0,0,0,0.9)', borderRadius: 16 }}>
              <PaperCard inkFade={ink} />
            </div>
          )}
          {torn && (
            <div style={{ opacity: 1 - ts(t, 5.1, 5.7, 0, 1, x => x) }}>
              <div style={{ position: 'absolute', clipPath: LEFT, transformOrigin: '300px 388px', transform: `translate(${-apart * 60 - dt * 120}px, ${dt * dt * 900}px) rotate(${-apart * 8 - dt * 30}deg)` }}>
                <PaperCard inkFade={ink} />
              </div>
              <div style={{ position: 'absolute', clipPath: RIGHT, transformOrigin: '300px 388px', transform: `translate(${apart * 60 + dt * 150}px, ${dt * dt * 1050}px) rotate(${apart * 10 + dt * 38}deg)` }}>
                <PaperCard inkFade={ink} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fragments de papier qui s'envolent en spirale vers la carte numérique */}
      {t > 5.0 &&
        PARTICLES.map((p, i) => {
          if (t < p.born || t > p.arrive) return null
          const from = halfCenter(p.side, p.born, tJ)
          const x0 = from.x + p.ox
          const y0 = from.y + p.oy
          const e = ts(t, p.born, p.arrive, 0, 1, x => x * x * (3 - 2 * x))
          const tx = hx
          const ty = HERO.y
          const a = e * Math.PI * p.turn
          const vx = (x0 - tx) * (1 - e)
          const vy = (y0 - ty) * (1 - e)
          const x = tx + vx * Math.cos(a) - vy * Math.sin(a)
          const y = ty + vx * Math.sin(a) + vy * Math.cos(a)
          const blue = ts(e, 0.3, 0.9)
          const sz = p.size * (1 - e * 0.5)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x - sz / 2,
                top: y - sz / 2,
                width: sz,
                height: sz,
                borderRadius: blue > 0.5 ? '50%' : 1,
                background: blue > 0.5 ? C.blue : '#efe6d3',
                boxShadow: `0 0 ${6 + 10 * blue}px ${blue > 0.5 ? 'rgba(41,151,255,0.9)' : 'rgba(239,230,211,0.6)'}`,
                opacity: ts(t, p.born, p.born + 0.15) * (1 - ts(e, 0.92, 1)),
                transform: `rotate(${e * 400 * p.turn}deg)`,
              }}
            />
          )
        })}

      {/* Texte : la question, puis trois mots qui roulent dans la même fenêtre */}
      <div style={{ position: 'absolute', top: 110, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Words id="v01" size={68} weight={600} out={tO - 0.25} color="rgba(245,245,247,0.92)" />
      </div>
      <div style={{ position: 'absolute', top: 80, left: 0, width: '100%', height: 190, overflow: 'hidden', fontFamily }}>
        {[
          ['Oubliées.', tO, tP],
          ['Perdues.', tP, tJ],
          ['Jetées.', tJ, 6.0],
        ].map(([w, a, b], i) => {
          const p = ts(t, a - 0.06, a + 0.24, 0, 1, outE)
          const q = ts(t, b - 0.08, b + 0.18, 0, 1, inE)
          if (p <= 0 || q >= 1) return null
          return (
            <div key={i} style={{ position: 'absolute', width: '100%', textAlign: 'center', fontSize: 168, fontWeight: 800, letterSpacing: '-0.055em', color: i === 2 ? C.champagne : C.text, transform: `translateY(${(1 - p) * 190 - q * 190}px)`, lineHeight: '190px' }}>
              {w}
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}

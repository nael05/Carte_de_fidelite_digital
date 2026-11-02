import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { spline } from '../../tt/kit3d'
import { ACCENT, Backdrop, Cam, Caption, END, EndCard, Finish, INK, MUTED, Pass, Plate, Scrim, Shot, Sound, Stage, Sweep, W, clamp, easeInOut, mix, pr, silk, tex, usePreload } from '../kit'

/* 7. « À ton image » : plan esthétique, un seul plan-séquence.
   Le pass tourne sous les projecteurs ; à chaque couleur prononcée il change de teinte dans un balayage de lumière,
   le fond prend la couleur ; puis vue éclatée (fond, logo, nom, points) et la carte se referme → fin. */

export const TEX_DESIGN = ['pass-graphite', 'pass-azur', 'pass-champagne', 'pass-ivory', 'pass-back', 'couche-fond', 'couche-logo', 'couche-points', 'couche-details']
const FIN = () => W('de04', 0) - 0.15
export const duree = () => END('de04') + 2.6
const COLORS = [
  { k: 'graphite', name: 'Graphite', tint: '70, 72, 78', dot: '#3a3a3c' },
  { k: 'azur', name: 'Azur', tint: '30, 70, 140', dot: '#2f6fd6' },
  { k: 'champagne', name: 'Champagne', tint: '120, 96, 62', dot: '#e3c9a4' },
  { k: 'ivory', name: 'Ivoire', tint: '110, 106, 96', dot: '#f2efe8' },
]
const at = i => W('de02', i) - 0.1
const current = t => COLORS.reduce((acc, _, i) => (t >= at(i) ? i : acc), 0)

const Hero = ({ t }) => {
  const c = current(t)
  const spins = [0, 1, 2, 3].reduce((a, i) => a + (i ? pr(t, at(i) - 0.35, at(i) + 0.4, easeInOut) : 0), 0)
  const explode = pr(t, W('de03', 0) - 0.4, W('de03', 0) + 0.8, easeInOut) * (1 - pr(t, END('de03') - 0.1, END('de03') + 0.7, easeInOut))
  const layer = i => pr(t, W('de03', [0, 1, 3, 4][i]) - 0.3, W('de03', [0, 1, 3, 4][i]) + 0.3) // la couche nommée s'éclaire
  const pos = spline(t, [
    [0, [0.25, -0.1, 5.4]],
    [at(0), [0.4, 0.0, 6.6]],
    [W('de03', 0), [2.4, 0.4, 6.4]],
    [END('de03'), [2.7, 0.3, 5.9]],
    [FIN() + 1, [0.3, 0.0, 6.4]],
  ])
  const look = spline(t, [[0, [0, -0.1, 0]], [at(0), [0, -0.2, 0]], [W('de03', 0), [0, -0.15, 0.1]], [FIN() + 1, [0, -0.2, 0]]])
  const ry = Math.PI * 2 * spins + Math.sin(t * 0.5) * 0.18 * (1 - explode) - 0.15
  const LAYERS = ['couche-fond', 'couche-details', 'couche-logo', 'couche-points']
  return (
    <>
      <Cam pos={pos} look={look} fov={30} />
      <spotLight position={[2, 3, 3]} angle={0.5} penumbra={1} intensity={8} />
      {explode < 0.02 ? (
        <Pass map={tex(`pass-${COLORS[c].k}`)} back={tex('pass-back')} rotation={[0.05, ry, 0]} />
      ) : (
        <group rotation={[0.05, mix(-0.15, -0.35, explode), 0]}>
          {LAYERS.map((n, i) => (
            <Plate key={n} map={tex(n)} w={1} h={1.58} r={0.05} position={[0, 0, (i - 1.5) * 0.32 * explode]} opacity={i === 0 ? 1 : mix(0.75, 1, i === 1 ? layer(1) : i === 2 ? layer(0) : layer(3))} />
          ))}
        </group>
      )}
    </>
  )
}

export const Design = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX_DESIGN)
  const D = duree()
  const c = current(t)
  const show = silk((t - at(0) + 0.1) / 0.5) * (1 - pr(t, END('de02') + 0.2, END('de02') + 0.7, easeInOut))
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* fond teinté qui change avec la couleur */}
      {COLORS.map((col, i) => (
        <AbsoluteFill key={col.k} style={{ opacity: i === 0 ? 1 : pr(t, at(i) - 0.3, at(i) + 0.5, easeInOut) * (t < END('de03') + 2 ? 1 : 1) }}>
          <Backdrop y={48} tint={col.tint} glow={0.9} />
        </AbsoluteFill>
      ))}
      <Shot t={t} a={0} b={FIN()}>
        {ready && <Stage><Hero t={t} /></Stage>}
      </Shot>
      {COLORS.map((_, i) => (i ? <Sweep key={i} t={t} at={at(i) - 0.4} dur={0.8} strength={0.2} /> : null))}
      <Scrim k={0.8} />

      <Caption t={t} id="de01" top={260} size={84} accent={[3, 4]} />
      <Caption t={t} id="de03" top={260} size={64} accent={[1, 3, 5]} out={FIN() - 0.3} />
      {/* nom de la couleur, en grand et fin, et les quatre pastilles */}
      {show > 0.001 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1450, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: show, fontFamily }}>
          <div style={{ position: 'relative', height: 110, width: 900 }}>
            {COLORS.map((col, i) => {
              const k = pr(t, at(i) - 0.15, at(i) + 0.35, easeInOut) * (i < 3 ? 1 - pr(t, at(i + 1) - 0.25, at(i + 1) + 0.15, easeInOut) : 1)
              return (
                <div key={col.k} style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 96, fontWeight: 250, letterSpacing: '-0.04em', color: INK, opacity: k, filter: `blur(${(1 - k) * 12}px)`, transform: `translateY(${(1 - k) * 20}px)` }}>
                  {col.name}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 26, marginTop: 22 }}>
            {COLORS.map((col, i) => (
              <div key={col.k} style={{ width: 30, height: 30, borderRadius: 15, background: col.dot, boxShadow: i === c ? `0 0 0 4px #000, 0 0 0 6px ${INK}` : '0 0 0 1px rgba(255,255,255,0.25)' }} />
            ))}
          </div>
        </div>
      )}

      <EndCard t={t} at={FIN()} dur={D} line="Ta carte. À ton image." />
      <Finish t={t} />
      <Sound set="design" son={son} />
    </AbsoluteFill>
  )
}

import { AbsoluteFill } from 'remotion'
import { W, springy, inE, ts, useT } from '../../lib'
import { MBlur } from '../../lib'
import { PaperCard } from '../../ui'
import { Flash, Pop, Ring, shake, shakeStyle } from '../kit'

/* 1 — Accroche (0 – 3,8 s)
   Dès la première image : une carte papier géante claque à l'écran. « Perdue » : un tampon rouge
   s'abat dessus et l'encre des tampons s'efface. La carte est balayée vers le haut, comme dans un fil
   qui défile ; le téléphone de la scène suivante monte du bas dans le même mouvement. */

const CX = 540
const CY = 1010
const RED = '#ff4a3d'

export const T1_Hook = () => {
  const t = useT()
  if (t > 3.95) return null

  const tPerdue = W('t02', 4)
  const sp = springy(t, 0, 2.2, 14) // claque de la carte : part de 1,35 et se pose
  const stamp = springy(t, tPerdue, 2.4, 11)
  const sh = shake(t, tPerdue, 26)
  const sh0 = shake(t, 0.05, 20, 0.3)
  const exit = ts(t, 3.18, 3.72, 0, 1, inE)
  const ink = ts(t, 1.95, 2.55, 0, 1, x => x)

  const scale = 1.45 * (1.35 - 0.35 * Math.min(1.15, sp))
  const rz = -6 + (1 - Math.min(1, sp)) * 9 - exit * 14
  const y = CY - exit * 2300

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <MBlur id="t1Blur" x={0} y={exit * 26} />
      <AbsoluteFill style={shakeStyle({ x: sh.x + sh0.x, y: sh.y + sh0.y, r: sh.r })}>
        {/* Lumière chaude de table */}
        <div style={{ position: 'absolute', left: CX - 800, top: CY - 700, width: 1600, height: 1400, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(239,230,211,0.14), transparent)', opacity: 1 - exit }} />

        {/* Cartes perdues, en pile derrière */}
        {[[-250, -330, -16, 0.62], [220, 360, 12, 0.7], [-120, 470, -4, 0.55]].map(([dx, dy, r, s], i) => (
          <div key={i} style={{ position: 'absolute', left: CX + dx - 310, top: CY + dy - 194, transform: `translateY(${-exit * (1500 + i * 400)}px) rotate(${r - exit * 10}deg) scale(${s * (1.15 - 0.15 * Math.min(1, sp))})`, opacity: 0.4 - i * 0.04, filter: 'blur(5px) brightness(0.6)' }}>
            <PaperCard inkFade={ink} />
          </div>
        ))}

        {/* La carte principale */}
        <div style={{ position: 'absolute', left: CX - 310, top: y - 194, transform: `rotate(${rz}deg) scale(${scale})`, filter: exit > 0 ? 'url(#t1Blur)' : undefined }}>
          <div style={{ borderRadius: 16, boxShadow: '0 70px 120px -30px rgba(0,0,0,0.95)' }}>
            <PaperCard inkFade={ink} />
          </div>
          {/* Tampon « PERDUE » */}
          {t >= tPerdue && (
            <div
              style={{
                position: 'absolute',
                left: 120,
                top: 120,
                padding: '6px 34px',
                border: `10px solid ${RED}`,
                borderRadius: 18,
                color: RED,
                fontFamily: 'Inter Variable, sans-serif',
                fontSize: 112,
                fontWeight: 900,
                letterSpacing: '0.02em',
                lineHeight: 1.1,
                transform: `rotate(-12deg) scale(${1 + (1 - Math.min(1, stamp)) * 2.4})`,
                opacity: ts(t, tPerdue, tPerdue + 0.05, 0, 1, x => x) * 0.92,
                mixBlendMode: 'normal',
                textShadow: '0 0 30px rgba(255,74,61,0.35)',
              }}
            >
              PERDUE
            </div>
          )}
        </div>
      </AbsoluteFill>

      <Ring t={t} at={tPerdue} x={CX} y={CY + 30} size={1500} color="rgba(255,74,61,0.55)" width={8} />
      <Flash t={t} at={0.04} strength={0.35} />
      <Flash t={t} at={tPerdue} color="#ff4a3d" strength={0.4} />

      {/* Légendes */}
      <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Pop id="t01" size={118} out={1.82} accent={{ 3: '#e3c9a4' }} />
      </div>
      <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Pop id="t02" size={124} out={3.2} accent={{ 4: RED }} />
      </div>
    </AbsoluteFill>
  )
}

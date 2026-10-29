import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { C, LetterType, Type, fontFamily, lerp, tw } from '../lib'
import { Pass } from '../Pass'

/* Scène 7 — Confiance (70 – 80 s)
   Le point de lumière s'élargit en halo champagne, le verso de la carte apparaît.
   La scène 8 s'ouvre par-dessus comme un iris. */

const PROOFS = ['Conforme au RGPD', 'Export et suppression à la demande']

export const S7Trust = () => {
  const f = useCurrentFrame()
  const halo = tw(f, 0, 50)
  const card = tw(f, 22, 72)

  return (
    <AbsoluteFill style={{ background: C.black }}>
      <div
        style={{
          position: 'absolute',
          left: 960 - lerp(8, 620, halo),
          top: 540 - lerp(8, 620, halo),
          width: lerp(16, 1240, halo),
          height: lerp(16, 1240, halo),
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(227,201,164,0.42), rgba(227,201,164,0.12) 55%, transparent)',
        }}
      />
      <div style={{ position: 'absolute', left: 952, top: 532, width: 16, height: 16, borderRadius: 8, background: '#fff8ec', boxShadow: '0 0 30px 10px rgba(227,201,164,0.8)', opacity: 1 - halo }} />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ opacity: card, transform: `scale(${lerp(0.9, 1, card)})`, filter: `blur(${(1 - card) * 10 + 1.2}px)` }}>
          <Pass width={380} ry={lerp(172, 186, tw(f, 22, 300, 0, 1, t => t))} rx={4} />
        </div>
      </AbsoluteFill>

      <div style={{ position: 'absolute', left: 170, top: 430, width: 560 }}>
        <Type at={44} out={150} size={56}>Les données de vos clients restent maîtrisées.</Type>
      </div>
      <div style={{ position: 'absolute', left: 1330, top: 450, fontFamily }}>
        {PROOFS.map((p, i) => {
          const t = tw(f, 70 + i * 10, 94 + i * 10) * (1 - tw(f, 150, 166))
          return (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, fontSize: 26, fontWeight: 500, color: 'rgba(245,245,247,0.78)', opacity: t, transform: `translateX(${(1 - t) * 16}px)` }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: C.champagne, boxShadow: '0 0 12px rgba(227,201,164,0.8)' }} />
              {p}
            </div>
          )
        })}
      </div>

      <div style={{ position: 'absolute', left: 150, top: 476 }}>
        <LetterType text="Rien de compliqué." at={164} out={252} size={62} stagger={2} />
      </div>
    </AbsoluteFill>
  )
}

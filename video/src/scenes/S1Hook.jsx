import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { C, Spot, Type, inE, ioE, tw } from '../lib'
import { Pass } from '../Pass'

/* Scène 1 — Accroche (0 – 6 s)
   Une ligne de lumière devient la tranche d'une carte, qui pivote vers nous.
   Un scan, un point : le compteur roule de 460 à 480. */
export const S1Hook = () => {
  const f = useCurrentFrame()

  const line = tw(f, 4, 44)
  const lineOut = tw(f, 46, 70, 1, 0)
  const turn = tw(f, 40, 104, 0, 1)
  // Sortie : la carte accélère sur elle-même jusqu'à la tranche ;
  // la scène 2 repart de la tranche avec la carte papier (raccord invisible).
  const spin = tw(f, 146, 165, 0, 1, inE)
  const ry = interpolate(turn, [0, 1], [90, -14]) + spin * 104
  const rx = interpolate(turn, [0, 1], [0, 7]) * (1 - spin)
  const lift = interpolate(f, [40, 180], [0, -14])
  const light = interpolate(f, [40, 180], [-0.3, 1.2])
  const scan = f >= 96 && f <= 130 ? tw(f, 96, 130, 0, 1, ioE) : null
  const points = tw(f, 120, 146, 460, 480)
  const credit = tw(f, 126, 140) * (1 - tw(f, 140, 160))

  return (
    <AbsoluteFill style={{ background: C.black }}>
      <Spot x={960} y={470} size={1300} color="rgba(255,255,255,0.07)" opacity={turn} />
      <Spot x={960} y={470} size={900} color="rgba(41,151,255,0.28)" opacity={credit} />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ transform: `translateY(${-50 + lift}px) scale(${1 + 0.08 * spin})`, filter: `blur(${spin * 3}px)` }}>
          <Pass width={360} rx={rx} ry={ry} points={points} scan={scan} light={light} />
        </div>
      </AbsoluteFill>

      {/* La ligne d'horizon */}
      <div
        style={{
          position: 'absolute',
          left: 960 - 560 * line,
          top: 489,
          width: 1120 * line,
          height: 2,
          opacity: lineOut,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.95) 30%, #fff 50%, rgba(255,255,255,0.95) 70%, transparent)',
          boxShadow: '0 0 24px 4px rgba(255,255,255,0.35)',
        }}
      />

      <div style={{ position: 'absolute', top: 870, width: '100%', display: 'flex', justifyContent: 'center', gap: 22 }}>
        <Type at={56} out={142} size={66}>Un scan.</Type>
        <Type at={116} out={146} size={66} color={C.champagne}>Un point.</Type>
      </div>
    </AbsoluteFill>
  )
}

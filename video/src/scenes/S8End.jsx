import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { C, Logo, Spot, Type, fontFamily, inE, ioE, lerp, tw } from '../lib'
import { Pass } from '../Pass'

/* Scène 8 — Signature (79 – 90 s)
   Prise en continu sur la scène 7 : même carte vue de dos, même halo.
   Le halo s'éteint, la carte se retourne, une seconde de silence,
   puis la signature et le domaine. Le logo reste seul pour finir. */

export const S8End = () => {
  const f = useCurrentFrame()
  const halo = 1 - tw(f, 0, 50, 0, 1, ioE)

  const flip = tw(f, 34, 100, 0, 1, ioE)
  const settle = tw(f, 96, 140)
  // 184,5° : l'angle de la carte de la scène 7 à l'image du raccord
  const ry = lerp(184.5, 360, flip) - 12 * settle
  const move = tw(f, 70, 124, 0, 1, ioE)
  const light = lerp(-0.2, 1.2, tw(f, 40, 160, 0, 1, t => t))

  const outro = tw(f, 252, 286, 0, 1, ioE)
  const fade = tw(f, 316, 330, 0, 1, inE)

  const logoIn = tw(f, 112, 136)
  const L = {
    x: lerp(1020, 960 - 90, outro),
    y: lerp(300, 540 - 90, outro),
    s: lerp(120, 180, outro),
  }

  return (
    <AbsoluteFill style={{ opacity: 1 - fade }}>
      <AbsoluteFill style={{ background: C.black }} />
      <div
        style={{
          position: 'absolute',
          left: 960 - 620,
          top: 540 - 620,
          width: 1240,
          height: 1240,
          borderRadius: '50%',
          background: 'radial-gradient(closest-side, rgba(227,201,164,0.42), rgba(227,201,164,0.12) 55%, transparent)',
          opacity: halo,
        }}
      />
      <Spot x={520} y={180} size={1400} color="rgba(227,201,164,0.16)" opacity={1 - halo} />
      <Spot x={960} y={1040} size={1600} color="rgba(227,201,164,0.06)" opacity={1 - halo} />
      <Spot x={960} y={540} size={900} color="rgba(41,151,255,0.10)" opacity={outro} />

      <div
        style={{
          position: 'absolute',
          left: lerp(960, 640, move) - 190,
          top: 540 - 300,
          opacity: 1 - outro,
          transform: `scale(${(1 - 0.1 * outro) * lerp(1, 1.05, move)})`,
          filter: `blur(${outro * 8 + 1.2 * (1 - tw(f, 0, 24))}px)`,
        }}
      >
        <Pass width={380} ry={ry} rx={lerp(4, 6, flip)} light={light} />
      </div>

      <div style={{ position: 'absolute', left: 1020, top: 448, width: 820, opacity: 1 - outro, filter: `blur(${outro * 10}px)` }}>
        <Type at={126} size={92}>Votre fidélité,</Type>
        <Type at={138} size={92} color={C.champagne}>sans tampon.</Type>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginTop: 44 }}>
          <div style={{ opacity: tw(f, 170, 190), transform: `translateY(${(1 - tw(f, 170, 190)) * 14}px)`, padding: '18px 34px', borderRadius: 999, background: C.blueBtn, color: '#fff', fontFamily, fontSize: 28, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Commencer aujourd’hui
          </div>
          <Type at={182} size={36} weight={500}>fidelyzapp.fr</Type>
        </div>
        <Type at={196} size={24} weight={500} color={C.muted} style={{ marginTop: 26 }}>
          Apple Wallet · Google Wallet
        </Type>
      </div>

      <div style={{ position: 'absolute', left: L.x, top: L.y, opacity: logoIn, filter: `blur(${(1 - logoIn) * 12}px)` }}>
        <Logo size={L.s} />
      </div>
    </AbsoluteFill>
  )
}

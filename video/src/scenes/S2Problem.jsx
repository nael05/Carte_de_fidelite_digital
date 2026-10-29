import { AbsoluteFill, interpolate, random, useCurrentFrame } from 'remotion'
import { C, Type, inE, ioE, lerp, outE, tw } from '../lib'

/* Scène 2 — Problème (6 – 15 s), lumière froide.
   Entrée : la carte Wallet de la scène 1 arrive sur la tranche ; la carte papier
   repart de la tranche et finit de tourner pendant que la lumière se refroidit.
   Sortie : le papier se défait en particules qui dessinent le contour d'une carte. */

const PaperCard = ({ w, x, y, rot = 0, ry = 0, dim = 0, opacity = 1, stamped = 6, seed = 'a', scale = 1, blur = 0 }) => {
  const u = w / 520
  const h = w * 0.62
  return (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        opacity,
        transform: `perspective(2200px) rotateY(${ry}deg) rotate(${rot}deg) scale(${scale})`,
        filter: blur ? `blur(${blur}px)` : undefined,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 8 * u,
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #f1e8d6, #ddd0b4)',
          boxShadow: `0 ${28 * u}px ${54 * u}px -${16 * u}px rgba(0,0,0,0.85)`,
          filter: `grayscale(${dim * 0.8}) brightness(${1 - dim * 0.72})`,
          padding: 26 * u,
          fontFamily: 'Georgia, "Times New Roman", serif',
          color: '#3b2a1a',
        }}
      >
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'multiply', opacity: 0.35 }}>
          <filter id={`fib${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed={seed.length * 7} />
            <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.3  0 0 0 0.9 -0.2" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#fib${seed})`} />
        </svg>
        {/* Pliures et tache */}
        <div style={{ position: 'absolute', left: '-10%', top: '58%', width: '120%', height: 2 * u, background: 'linear-gradient(90deg, transparent, rgba(80,60,40,0.35), transparent)', transform: 'rotate(-7deg)' }} />
        <div style={{ position: 'absolute', left: '62%', top: '-10%', width: 1.5 * u, height: '120%', background: 'linear-gradient(transparent, rgba(80,60,40,0.25), transparent)', transform: 'rotate(4deg)' }} />
        <div style={{ position: 'absolute', left: '70%', top: '55%', width: 120 * u, height: 120 * u, borderRadius: '50%', border: `${6 * u}px solid rgba(120,80,40,0.16)`, filter: `blur(${2 * u}px)` }} />

        <div style={{ position: 'relative', fontSize: 34 * u, fontStyle: 'italic', fontWeight: 700 }}>Le Petit Comptoir</div>
        <div style={{ position: 'relative', fontFamily: 'Arial, sans-serif', fontSize: 12 * u, letterSpacing: '0.25em', color: '#7a6248', marginTop: 4 * u }}>
          CARTE DE FIDÉLITÉ
        </div>
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: `repeat(5, ${50 * u}px)`, gap: 16 * u, marginTop: 22 * u }}>
          {Array.from({ length: 10 }, (_, i) => {
            const on = i < stamped
            const fade = 0.18 + random(`${seed}s${i}`) * 0.5
            return (
              <div key={i} style={{ width: 50 * u, height: 50 * u, borderRadius: '50%', border: `${2 * u}px solid #b6a283`, display: 'grid', placeItems: 'center' }}>
                {on && (
                  <div
                    style={{
                      width: 42 * u,
                      height: 42 * u,
                      borderRadius: '50%',
                      border: `${3 * u}px solid rgba(130,38,38,${fade})`,
                      color: `rgba(130,38,38,${fade})`,
                      fontSize: 14 * u,
                      fontWeight: 700,
                      display: 'grid',
                      placeItems: 'center',
                      transform: `rotate(${(random(`${seed}r${i}`) - 0.5) * 50}deg)`,
                    }}
                  >
                    PC
                  </div>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ position: 'relative', fontSize: 15 * u, fontStyle: 'italic', color: '#7a6248', marginTop: 18 * u }}>Le 10e café est offert</div>

        {/* Coin corné */}
        <div style={{ position: 'absolute', right: 0, top: 0, width: 46 * u, height: 46 * u, background: 'linear-gradient(225deg, #07090d 50%, #c9bb9c 50%, #efe4cf 100%)' }} />
      </div>
    </div>
  )
}

// Contour de la carte de la scène 3 : 380 × 600, centré
const OUT = { w: 380, h: 600, cx: 960, cy: 540 }
const onOutline = t => {
  const P = 2 * (OUT.w + OUT.h)
  let s = t * P
  const x0 = OUT.cx - OUT.w / 2
  const y0 = OUT.cy - OUT.h / 2
  if (s < OUT.w) return [x0 + s, y0]
  s -= OUT.w
  if (s < OUT.h) return [x0 + OUT.w, y0 + s]
  s -= OUT.h
  if (s < OUT.w) return [x0 + OUT.w - s, y0 + OUT.h]
  s -= OUT.w
  return [x0, y0 + OUT.h - s]
}

const ROW = [-2, -1, 0, 1, 2].map(i => 960 + i * 330)
const PARTICLES = Array.from({ length: 460 }, (_, i) => {
  const card = Math.floor(random(`c${i}`) * 5)
  const sx = ROW[card] + (random(`x${i}`) - 0.5) * 300
  const sy = 500 + (random(`y${i}`) - 0.5) * 186
  const [tx, ty] = onOutline(i / 460)
  return { sx, sy, tx, ty, d: random(`d${i}`) * 16, sw: (random(`w${i}`) - 0.5) * 220, r: 1.6 + random(`r${i}`) * 2.2 }
})

export const S2Problem = () => {
  const fl = useCurrentFrame()
  // La scène commence à 5,5 s ; les temps ci-dessous restent comptés depuis 5 s
  const f = fl + 15

  // Raccord : fin de rotation de la carte papier, la lumière se refroidit
  const unspin = tw(fl, 0, 30, 0, 1, outE)
  const cold = tw(fl, 0, 36)

  // Temps A : la carte abîmée en macro
  const aOut = tw(f, 100, 118, 0, 1, inE)
  const aFocus = lerp(3, 0, unspin)
  const aZoom = interpolate(f, [15, 118], [1, 1.08])

  // Temps B : la pile
  const bIn = tw(f, 106, 128)
  const bOut = tw(f, 178, 194, 0, 1, inE)
  const strike = tw(f, 142, 158)

  // Temps C : la rangée qui s'éteint
  const cIn = tw(f, 186, 206)
  const cOut = tw(f, 246, 264, 0, 1, inE)

  // Temps D : particules
  const outline = tw(f, 282, 300)

  return (
    <AbsoluteFill style={{ background: C.black }}>
      <AbsoluteFill>
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 28%, #1c2532 0%, #0a0d12 55%, #000 100%)', opacity: cold }} />

        {aOut < 1 && (
          <PaperCard w={880} x={960} y={472} rot={-5 * unspin} ry={lerp(-90, -4, unspin)} seed="hero" stamped={6} scale={aZoom} blur={aFocus + aOut * 10} opacity={1 - aOut} />
        )}

        {bIn > 0 && bOut < 1 && (
          <AbsoluteFill style={{ opacity: bIn * (1 - bOut), filter: `blur(${(1 - bIn) * 10 + bOut * 10}px)` }}>
            <PaperCard w={560} x={700 - f * 0.15} y={500} rot={-14} seed="p1" stamped={3} />
            <PaperCard w={560} x={1230 + f * 0.12} y={455} rot={9} seed="p2" stamped={8} />
            <PaperCard w={600} x={960} y={420 - f * 0.08} rot={-2} seed="p3" stamped={5} />
          </AbsoluteFill>
        )}

        {cIn > 0 && cOut < 1 && (
          <AbsoluteFill style={{ opacity: cIn * (1 - cOut) }}>
            {ROW.map((x, i) => (
              <PaperCard key={i} w={300} x={x} y={500} seed={`row${i}`} stamped={2 + i} dim={tw(f, 198 + i * 9, 214 + i * 9)} />
            ))}
          </AbsoluteFill>
        )}

        {f >= 244 &&
          PARTICLES.map((p, i) => {
            const t = tw(f, 248 + p.d, 284 + p.d, 0, 1, ioE)
            const bend = Math.sin(Math.PI * t) * p.sw
            const born = tw(f, 244 + p.d * 0.5, 252 + p.d * 0.5)
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: lerp(p.sx, p.tx, t) - p.r / 2,
                  top: lerp(p.sy, p.ty, t) + bend * 0.35 - p.r / 2,
                  width: p.r,
                  height: p.r,
                  borderRadius: '50%',
                  background: C.champagne,
                  opacity: born * (1 - outline * 0.6),
                  boxShadow: `0 0 ${6 + 6 * t}px rgba(227,201,164,0.9)`,
                }}
              />
            )
          })}

        <div
          style={{
            position: 'absolute',
            left: OUT.cx - OUT.w / 2,
            top: OUT.cy - OUT.h / 2,
            width: OUT.w,
            height: OUT.h,
            borderRadius: OUT.w * 0.05,
            border: `2px solid ${C.champagne}`,
            boxShadow: '0 0 30px rgba(227,201,164,0.45), inset 0 0 30px rgba(227,201,164,0.2)',
            opacity: outline,
          }}
        />

        <div style={{ position: 'absolute', top: 870, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Type at={36} out={100} size={58}>Des cartes en papier qui s’abîment.</Type>
        </div>
        <div style={{ position: 'absolute', top: 870, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Type at={118} out={180} size={58}>
            Des{' '}
            <span style={{ position: 'relative', color: C.champagne }}>
              tampons
              <span style={{ position: 'absolute', left: 0, top: '54%', height: 4, width: `${strike * 100}%`, background: C.text, borderRadius: 2 }} />
            </span>{' '}
            oubliés.
          </Type>
        </div>
        <div style={{ position: 'absolute', top: 870, width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Type at={192} out={244} size={58}>Des clients qui ne reviennent pas.</Type>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

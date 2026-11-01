import { AbsoluteFill } from 'remotion'
import { Home, Trash2, User } from 'lucide-react'
import { C, Logo, W, fontFamily, inE, ioE, lerp, outE, springy, ts, useT } from '../../lib'
import { PAPER, PaperCard } from '../../ui'
import { Flash, Ring, shake, shakeStyle } from '../../tiktok/kit'
import { R, Slam, Sparks } from '../fx'
import { RED } from '../common'

/* PROBLÈME → SOLUTION (0 – 12,8 s)
   1. La carte papier, en 3D, se déchire sur « perdre ».
   2. Trois plans sur les temps : OUBLIÉE, PERDUE, JETÉE.
   3. Les clients s'effacent sur un plan incliné ; il en reste un, sans visage.
   4. Le « ? » aspire tout et éclate sur le drop : Fidelyz. */

const tear = 'polygon(0 0, 52% 0, 47% 14%, 54% 28%, 46% 43%, 53% 57%, 47% 71%, 54% 86%, 49% 100%, 0 100%)'
const tearR = 'polygon(52% 0, 100% 0, 100% 100%, 49% 100%, 54% 86%, 47% 71%, 53% 57%, 46% 43%, 54% 28%, 47% 14%)'

export const S1_Hook = () => {
  const t = useT()
  const tRip = W('e01', 8)
  const intro = ts(t, 0, 0.7, 0, 1, outE)
  const rip = ts(t, tRip, tRip + 0.55, 0, 1, outE)
  const away = ts(t, 2.3, 2.85, 0, 1, inE)
  const sh = shake(t, tRip, 26, 0.45)
  const k = 1.45 + 0.12 * t
  const w = PAPER.w
  const h = PAPER.h
  const half = (side, clip) => (
    <div style={{ position: 'absolute', inset: 0, clipPath: t >= tRip ? clip : undefined, transform: `translate(${side * (150 * rip + 500 * away)}px, ${60 * rip + 300 * away}px) rotate(${side * (14 * rip + 30 * away)}deg)` }}>
      <PaperCard />
    </div>
  )
  return (
    <AbsoluteFill style={shakeStyle(sh)}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 52%, rgba(255,60,50,${0.35 * rip}), transparent 60%)` }} />
      <div style={{ position: 'absolute', left: 540 - w / 2, top: 1040 - h / 2, width: w, height: h, transform: `perspective(1600px) scale(${k}) rotateX(${lerp(26, 12, intro) + Math.sin(t * 2) * 3}deg) rotateY(${lerp(-34, -16, intro) + t * 5}deg) rotateZ(${lerp(-18, -6, intro)}deg)`, transformStyle: 'preserve-3d', filter: 'drop-shadow(0 50px 70px rgba(0,0,0,0.7))' }}>
        {half(-1, tear)}
        {t >= tRip && half(1, tearR)}
      </div>
      {/* Fibres de papier qui s'échappent de la déchirure */}
      {t >= tRip && Array.from({ length: 22 }, (_, i) => {
        const p = ts(t, tRip, tRip + 0.9, 0, 1, outE)
        const a = (i / 22) * Math.PI * 2 + i
        return <div key={i} style={{ position: 'absolute', left: 540 + Math.cos(a) * 460 * p, top: 1040 + (i / 22 - 0.5) * 520 + Math.sin(a) * 260 * p + 360 * p * p, width: 16 + (i % 3) * 10, height: 9 + (i % 4) * 6, background: '#efe6d3', borderRadius: 2, transform: `rotate(${i * 47 + p * 400}deg)`, opacity: 1 - p }} />
      })}
      <Flash t={t} at={tRip} color={RED} strength={0.35} />
    </AbsoluteFill>
  )
}

/* Trois plans : maison, perdue, poubelle */
export const S2_Probleme = () => {
  const t = useT()
  const tB = 4.02
  const tC = 4.82
  const icon = { position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, display: 'grid', placeItems: 'center' }
  const card = (wd, style) => (
    <div style={{ position: 'absolute', width: wd, height: wd * (PAPER.h / PAPER.w), ...style }}>
      <div style={{ transform: `scale(${wd / PAPER.w})`, transformOrigin: '0 0' }}><PaperCard /></div>
    </div>
  )
  const sh = shake(t, W('e02', 4), 18, 0.3)
  const sh2 = shake(t, W('e02', 7), 18, 0.3)
  const sh3 = shake(t, W('e02', 12), 24, 0.4)
  const S = { x: sh.x + sh2.x + sh3.x, y: sh.y + sh2.y + sh3.y, r: sh.r + sh2.r + sh3.r }

  if (t < tB) {
    // A. Elle reste à la maison
    const slide = ts(t, 2.85, 3.5, 0, 1, ioE)
    const shrink = ts(t, 3.45, 3.85, 0, 1, inE)
    return (
      <AbsoluteFill style={shakeStyle(S)}>
        <div style={{ ...icon, transform: `perspective(1400px) rotateY(${-14 + (t - 2.82) * 10}deg) translateY(90px)` }}>
          <Home size={640} strokeWidth={1.1} color={C.champagne} style={{ filter: `drop-shadow(0 0 ${30 + 30 * shrink}px rgba(227,201,164,0.45))` }} />
        </div>
        {card(330, { left: lerp(1150, 540, slide) - 165, top: lerp(980, 1220, slide), transform: `scale(${lerp(1, 0.18, shrink)}) rotate(${lerp(24, 0, slide)}deg)`, opacity: 1 - ts(t, 3.75, 3.9) })}
        <Slam t={t} at={W('e02', 4)} out={3.95} size={170} color={RED} rot={-10} y={1000} stamp>Oubliée</Slam>
      </AbsoluteFill>
    )
  }
  if (t < tC) {
    // B. Elle se perd
    const lost = ts(t, tB, tC, 0, 1, x => x * x)
    return (
      <AbsoluteFill style={shakeStyle(S)}>
        {[0, 1, 2, 3, 4].map(i => {
          const l = Math.max(0, lost - i * 0.05)
          return card(560, { left: 540 - 280, top: 940 - 175, transform: `translate(${l * 120}px, ${l * 420}px) rotate(${l * 720 - 10}deg) scale(${lerp(1.1, 0.05, l)})`, filter: `blur(${l * 8 + i * 2}px)`, opacity: i === 0 ? 1 : 0.35 / i })
        })}
        <Slam t={t} at={W('e02', 7)} out={4.78} size={180} color={RED} rot={8} y={1000} stamp>Perdue</Slam>
      </AbsoluteFill>
    )
  }
  // C. Elle finit à la poubelle
  const tBin = W('e02', 12) - 0.08
  const crumple = ts(t, tC + 0.1, tBin - 0.15, 0, 1, ioE)
  const into = ts(t, tBin - 0.3, tBin, 0, 1, inE)
  return (
    <AbsoluteFill style={shakeStyle(S)}>
      <div style={{ ...icon }}>
        <div style={{ transform: `translateY(300px) scale(${1 + 0.08 * Math.exp(-Math.max(0, t - tBin) * 8) * (t > tBin ? 1 : 0)})` }}>
          <Trash2 size={540} strokeWidth={1.1} color={RED} style={{ filter: 'drop-shadow(0 0 40px rgba(255,90,78,0.45))' }} />
        </div>
      </div>
      {card(440, { left: 540 - 220, top: 640, transform: `translateY(${into * 660}px) rotate(${crumple * 200}deg) scale(${lerp(1, 0.32, crumple)}, ${lerp(1, 0.4, crumple)})`, borderRadius: 18 * (1 + crumple * 4), overflow: 'hidden', opacity: 1 - ts(t, tBin - 0.04, tBin + 0.04) })}
      <Ring t={t} at={tBin} x={540} y={1360} size={1000} color="rgba(255,90,78,0.7)" width={6} />
      <Slam t={t} at={W('e02', 12)} out={6.3} size={190} color={RED} rot={-6} y={720} stamp>Jetée</Slam>
    </AbsoluteFill>
  )
}

/* Les clients qui ne reviennent pas, sur un plan incliné */
const COLS = 4
const ROWS = 5
const KEEP = 9
const ORDER = [3, 14, 7, 18, 0, 11, 16, 5, 12, 1, 19, 8, 15, 2, 10, 6, 17, 4, 13]
export const QMARK = { x: 540, y: 1000, r: 180 }

export const S3_Clients = () => {
  const t = useT()
  const tGone = W('e03', 1)
  const tGoneEnd = W('e03', 5) + 0.3
  const tLone = W('e03', 6)
  const tQ = W('e03', 10)
  const lone = ts(t, tLone, tLone + 0.6, 0, 1, ioE)
  const q = springy(t, tQ, 1.8, 8)
  const tilt = lerp(38, 0, lone)
  const gx = i => 540 + ((i % COLS) - 1.5) * 220
  const gy = i => 1040 + (Math.floor(i / COLS) - 2) * 200
  const push = ts(t, 10.3, 11.3, 0, 1, inE)
  return (
    <AbsoluteFill style={{ transform: `scale(${1 + 0.35 * push})`, transformOrigin: `${QMARK.x}px ${QMARK.y}px` }}>
      <AbsoluteFill style={{ transform: `perspective(1500px) rotateX(${tilt}deg) rotateZ(${lerp(-6, 0, lone)}deg)`, transformOrigin: '50% 60%' }}>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          if (i === KEEP) return null
          const pop = springy(t, 6.45 + ((i * 7) % 20) * 0.018, 2.2, 10)
          const k = ORDER.indexOf(i)
          const at = tGone + (k / ORDER.length) * (tGoneEnd - tGone - 0.2)
          const gone = ts(t, at, at + 0.22)
          const fade = 1 - ts(t, tLone, tLone + 0.35)
          return (
            <div key={i}>
              <div style={{ position: 'absolute', left: gx(i) - 70, top: gy(i) - 70, width: 140, height: 140, borderRadius: 70, transform: `scale(${Math.max(0, Math.min(1.05, pop)) * (1 - 0.2 * gone)})`, opacity: fade, border: `3px ${gone > 0.5 ? 'dashed' : 'solid'} ${gone > 0.5 ? 'rgba(255,255,255,0.2)' : 'rgba(227,201,164,0.6)'}`, background: `rgba(227,201,164,${0.14 * (1 - gone)})`, display: 'grid', placeItems: 'center' }}>
                <User size={70} strokeWidth={1.6} color={C.champagne} style={{ opacity: 1 - gone, transform: `translateY(${-40 * gone}px) scale(${1 + 0.4 * gone})` }} />
              </div>
              {gone > 0 && gone < 1 && <div style={{ position: 'absolute', left: gx(i) - 70 - 60 * gone, top: gy(i) - 70 - 60 * gone, width: 140 + 120 * gone, height: 140 + 120 * gone, borderRadius: '50%', border: '3px solid rgba(255,90,78,0.8)', opacity: 1 - gone }} />}
            </div>
          )
        })}
        {/* Le dernier client */}
        {(() => {
          const pop = springy(t, 6.45 + ((KEEP * 7) % 20) * 0.018, 2.2, 10)
          const x = lerp(gx(KEEP), QMARK.x, lone)
          const y = lerp(gy(KEEP), QMARK.y, lone)
          const r = lerp(70, QMARK.r, lone)
          return (
            <div style={{ position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: r, transform: `scale(${Math.max(0, Math.min(1.05, pop))})`, border: `${3 + 4 * lone}px solid rgba(227,201,164,${0.6 + 0.3 * lone})`, background: 'rgba(227,201,164,0.12)', display: 'grid', placeItems: 'center', boxShadow: `0 0 ${100 * lone}px rgba(227,201,164,0.3)` }}>
              <User size={r} strokeWidth={1.6} color={C.champagne} style={{ position: 'absolute', opacity: 1 - Math.min(1, q * 1.4) }} />
              {t >= tQ && <span style={{ position: 'absolute', fontFamily, fontWeight: 900, fontSize: r * 1.4, color: C.text, lineHeight: 1, transform: `scale(${Math.max(0, Math.min(1.1, q))})` }}>?</span>}
            </div>
          )
        })()}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/* Le « ? » aspire la lumière puis éclate sur le drop : Fidelyz */
export const S4_Solution = () => {
  const t = useT()
  const tremble = ts(t, 11.3, R, 0, 1, x => x * x)
  const burst = ts(t, R, R + 0.45, 0, 1, outE)
  const logo = springy(t, R, 1.6, 7)
  const word = springy(t, R + 0.1, 1.8, 8)
  const sh = shake(t, R, 30, 0.5)
  const jit = tremble * 9
  return (
    <AbsoluteFill style={shakeStyle(sh)}>
      {/* rayons */}
      <div style={{ position: 'absolute', left: 540 - 1000, top: 900 - 1000, width: 2000, height: 2000, borderRadius: '50%', background: 'repeating-conic-gradient(from 0deg, rgba(41,151,255,0.2) 0deg 5deg, transparent 5deg 15deg)', WebkitMaskImage: 'radial-gradient(closest-side, #000 15%, transparent 75%)', maskImage: 'radial-gradient(closest-side, #000 15%, transparent 75%)', transform: `rotate(${t * 20}deg) scale(${0.5 + 0.5 * burst})`, opacity: burst }} />
      {/* particules aspirées vers le « ? » */}
      {t < R && Array.from({ length: 40 }, (_, i) => {
        const a = (i / 40) * Math.PI * 2 + i * 0.7
        const ph = ((t - 11.2) * 1.6 + (i % 7) / 7) % 1
        const r = 900 * (1 - ph)
        return <div key={i} style={{ position: 'absolute', left: QMARK.x + Math.cos(a) * r - 3, top: QMARK.y + Math.sin(a) * r - 3, width: 6 + (i % 3) * 3, height: 6 + (i % 3) * 3, borderRadius: 6, background: i % 2 ? C.blue : C.champagne, opacity: ph * tremble * 1.5, boxShadow: `0 0 10px ${i % 2 ? C.blue : C.champagne}` }} />
      })}
      {t < R + 0.5 && (
        <div style={{ position: 'absolute', left: QMARK.x - QMARK.r, top: QMARK.y - QMARK.r, width: 2 * QMARK.r, height: 2 * QMARK.r, borderRadius: QMARK.r, border: '7px solid rgba(227,201,164,0.9)', background: 'rgba(227,201,164,0.12)', display: 'grid', placeItems: 'center', transform: `translate(${Math.sin(t * 97) * jit}px, ${Math.cos(t * 83) * jit}px) scale(${(1 - 0.15 * tremble) * (1 + 2.6 * burst)})`, opacity: 1 - burst, boxShadow: `0 0 ${60 + 120 * tremble}px rgba(41,151,255,${0.5 * tremble})` }}>
          <span style={{ fontFamily, fontWeight: 900, fontSize: QMARK.r * 1.4, color: C.text, lineHeight: 1 }}>?</span>
        </div>
      )}
      {t >= R && (
        <>
          <div style={{ position: 'absolute', left: 540 - 170, top: 700, transform: `scale(${Math.max(0, logo)}) rotate(${(1 - Math.min(1, logo)) * -30}deg)` }}><Logo size={340} /></div>
          <div style={{ position: 'absolute', left: 0, width: 1080, top: 1090, textAlign: 'center', fontFamily, fontWeight: 900, fontSize: 190, letterSpacing: '-0.055em', color: C.text, transform: `translateY(${(1 - Math.min(1, word)) * 80}px) scale(${0.8 + 0.2 * Math.min(1, word)})`, opacity: Math.min(1, word * 1.5), textShadow: '0 0 80px rgba(41,151,255,0.6)' }}>Fidelyz</div>
        </>
      )}
      <Sparks t={t} at={R} x={540} y={870} n={36} dist={620} color={C.blue} />
      <Ring t={t} at={R} x={540} y={870} size={1800} width={8} />
      <Ring t={t} at={R + 0.08} x={540} y={870} size={1100} width={4} color="rgba(227,201,164,0.85)" />
      <Flash t={t} at={R} color="#fff" strength={0.6} dur={0.3} />
    </AbsoluteFill>
  )
}

import { ThreeCanvas } from '@remotion/three'
import { AbsoluteFill, Audio, staticFile, useVideoConfig } from 'remotion'
import { Grain, displayTokens, fontFamily, getCue, useT } from '../../lib'
import { clamp, easeOut, mix, pr, spring, usePreloadTextures } from '../kit3d'
import { Scene3D } from './Scene3D'
import { BEAT, COUPES, DUREE_CHRONO, H, affiche } from './temps'

/* « Chrono » — format speedrun : on crée une carte de fidélité, chrono en main (accéléré).
   Laque noire + rubans LED, coupes sur les temps (126 BPM), voix énergique (Simon, ElevenLabs). */

const CYAN = '#3fd4ff'
const VIOLET = '#9a5cff'
const GLOW = `0 0 18px ${CYAN}, 0 0 40px rgba(63,212,255,0.55)`

const fmt = s => {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const c = Math.floor((s * 100) % 100)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(c).padStart(2, '0')}`
}

// Sous-titres : mots en gras qui claquent, mots clés en néon
const Line = ({ t, id, accent = [], top = 1300, size = 66, out, from = 0, to = 99 }) => {
  const cue = getCue(id)
  const toks = displayTokens(cue)
  const end = out ?? cue.at + cue.dur + 0.2
  if (t < cue.at - 0.1 || t > end + 0.2) return null
  const o = pr(t, end, end + 0.2, k => k)
  return (
    <div style={{ position: 'absolute', left: 110, right: 140, top, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 0.25em', fontFamily, fontWeight: 800, fontSize: size, lineHeight: 1.08, textTransform: 'uppercase', letterSpacing: '-0.02em', opacity: 1 - o }}>
      {toks.map((w, i) => {
        if (i < from || i > to) return null
        const at = cue.at + Math.max(0, cue.words[i].t) - 0.04
        if (t < at) return null
        const p = spring(t, at, 2.4, 10)
        return (
          <span key={i} style={{ display: 'inline-block', color: accent.includes(i) ? CYAN : '#fff', textShadow: accent.includes(i) ? GLOW : '0 4px 20px rgba(0,0,0,0.8)', transform: `scale(${mix(1.4, 1, clamp(p))})`, opacity: clamp(p * 3) }}>
            {w}
          </span>
        )
      })}
    </div>
  )
}

// Numéro d'étape géant, en contour
const Etape = ({ t, a, b, n, label }) => {
  if (t < a || t > b) return null
  const k = spring(t, a + 0.05, 1.8, 8)
  return (
    <div style={{ position: 'absolute', left: 70, top: 270, fontFamily, opacity: clamp(k * 2) * (1 - pr(t, b - 0.15, b, x => x)) }}>
      <div style={{ fontSize: 150, fontWeight: 900, lineHeight: 0.9, color: 'transparent', WebkitTextStroke: `3px ${CYAN}`, textShadow: '0 0 30px rgba(63,212,255,0.35)', transform: `translateX(${(1 - clamp(k)) * -80}px)` }}>{n}</div>
      <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.2em', color: '#fff', marginTop: 10, textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}

// Traînée de néon qui balaie l'écran au moment d'une coupe
const Balayage = ({ t, at, dir = 1 }) => {
  const d = (t - at) / 0.32
  if (d < -0.5 || d > 0.5) return null
  const x = mix(-900, 1980, d + 0.5)
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', transform: dir < 0 ? 'scaleX(-1)' : undefined }}>
      <div style={{ position: 'absolute', top: -400, bottom: -400, left: x - 260, width: 520, transform: 'skewX(-18deg)', background: `linear-gradient(90deg, transparent, ${VIOLET} 30%, #fff 50%, ${CYAN} 70%, transparent)`, filter: 'blur(18px)', opacity: 0.95 }} />
      <div style={{ position: 'absolute', top: -400, bottom: -400, left: x - 30, width: 60, transform: 'skewX(-18deg)', background: '#fff', filter: 'blur(4px)' }} />
    </AbsoluteFill>
  )
}

export const Chrono = ({ son = true }) => {
  const t = useT()
  const ready = usePreloadTextures()
  const { width, height } = useVideoConfig()
  // le chrono : en haut pendant les étapes, au centre et en grand au « Stop »
  const center = easeOut(clamp((t - H.stop) / 0.35)) * (1 - easeOut(clamp((t - H.fin) / 0.3)))
  const time = affiche(t)
  const stopped = t >= H.stop
  const blink = stopped && t < H.fin ? (Math.floor((t - H.stop) / 0.18) % 2 === 0 ? 1 : 0.55) : 1
  const sinceBeat = t < H.top ? 1 : ((t - H.top) % BEAT) / BEAT
  const pulse = t < H.top ? 0 : Math.exp(-sinceBeat * 7)
  const flash = Math.max(t >= H.top ? Math.exp(-(t - H.top) * 9) : 0, ...COUPES.map(c => (t >= c ? Math.exp(-(t - c) * 14) * 0.35 : 0)))
  const shake = t >= H.stop && t < H.stop + 0.3 ? (1 - (t - H.stop) / 0.3) * 14 : 0

  return (
    <AbsoluteFill style={{ background: '#020308', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `scale(${1 + pulse * 0.012}) translate(${Math.sin(t * 80) * shake}px, ${Math.cos(t * 70) * shake}px)` }}>
        {ready && (
          <ThreeCanvas width={width} height={height} camera={{ fov: 36, near: 0.05, far: 60, position: [0, 0, 6] }} gl={{ antialias: true }}>
            <Scene3D t={t} />
          </ThreeCanvas>
        )}
      </AbsoluteFill>

      {/* chrono */}
      {t < H.fin + 0.3 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: mix(150, 1050, center), textAlign: 'center', fontFamily, fontWeight: 700, fontVariantNumeric: 'tabular-nums', fontSize: mix(84, 150, center), letterSpacing: '0.02em', color: '#fff', textShadow: GLOW, opacity: blink * (1 - pr(t, H.fin, H.fin + 0.3, x => x)) }}>
          {fmt(time)}
        </div>
      )}

      {/* accroche */}
      {t < H.un && (
        <>
          <Line t={t} id="h01" accent={[4, 5]} top={1180} size={70} out={H.un - 0.1} to={5} />
          {t >= 2.3 && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: 820, textAlign: 'center', fontFamily, fontWeight: 900, fontSize: 150, color: '#fff', textShadow: GLOW, transform: `scale(${mix(1.8, 1, clamp(spring(t, 2.33, 2, 8)))}) rotate(-4deg)`, letterSpacing: '-0.03em', opacity: 1 - pr(t, H.un - 0.15, H.un, x => x) }}>
              TOP CHRONO
            </div>
          )}
        </>
      )}

      <Etape t={t} a={H.un} b={H.deux} n="01" label="Logo & couleurs" />
      <Etape t={t} a={H.deux} b={H.trois} n="02" label="QR code" />
      <Etape t={t} a={H.trois} b={H.bonus} n="03" label="Scan → Wallet" />
      <Etape t={t} a={H.bonus} b={H.stop} n="+" label="Bonus" />

      <Line t={t} id="h02" from={1} accent={[2, 4]} />
      <Line t={t} id="h03" from={1} accent={[4, 5]} />
      <Line t={t} id="h04" from={1} accent={[4, 7, 12]} size={58} />
      <Line t={t} id="h05" from={1} accent={[2, 7]} />
      {stopped && t < H.fin && (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 860, textAlign: 'center', fontFamily, fontWeight: 900, fontSize: 130, color: CYAN, textShadow: GLOW, transform: `scale(${mix(1.6, 1, clamp(spring(t, H.stop, 2, 8)))})` }}>STOP</div>
          <Line t={t} id="h06" from={1} accent={[3, 4, 6]} top={1300} size={60} />
        </>
      )}

      {t >= H.fin && (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 1180, textAlign: 'center', fontFamily, fontWeight: 900, fontSize: 120, letterSpacing: '-0.03em', color: '#fff', textShadow: GLOW, transform: `scale(${mix(1.5, 1, clamp(spring(t, H.fin + 0.05, 2, 8)))})` }}>FIDELYZ</div>
          <Line t={t} id="h07" from={1} accent={[1, 4, 5, 6]} top={1340} size={54} out={DUREE_CHRONO} />
        </>
      )}

      {COUPES.map((c, i) => <Balayage key={c} t={t} at={c} dir={i % 2 ? -1 : 1} />)}
      <AbsoluteFill style={{ background: '#fff', opacity: flash, mixBlendMode: 'screen', pointerEvents: 'none' }} />
      <Grain />
      {son && <Audio src={staticFile('tt/mix-chrono.wav')} />}
    </AbsoluteFill>
  )
}

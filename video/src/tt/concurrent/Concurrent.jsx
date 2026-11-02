import '@fontsource/unbounded/800.css'
import '@fontsource/unbounded/900.css'
import { ThreeCanvas } from '@remotion/three'
import { AbsoluteFill, Audio, staticFile, useVideoConfig } from 'remotion'
import { displayTokens, getCue, useT } from '../../lib'
import { clamp, easeOut, mix, pr, spring, usePreloadTextures } from '../kit3d'
import { Scene3D } from './Scene3D'
import { BEAT, CREAM, DUREE_CC, LIME, P, PINK, VIOLET } from './temps'

/* « Ton concurrent » — TikTok n° 3, format liste rapide (24,4 s, 1080 × 1920).
   Accroche par la peur de rater quelque chose, trois « trucs » numérotés, le secret sur le drop du phonk.
   Voix Corentin (ElevenLabs), phonk Pixabay remonté mesure par mesure (scripts/mix-tt.mjs concurrent). */

const FONT = '"Unbounded", sans-serif'

// Sous-titres en blocs de quelques mots : [réplique, premier mot, dernier mot, mots en couleur, taille]
const CHUNKS = [
  ['c01', 0, 1, {}, 92],
  ['c01', 2, 4, {}, 84],
  ['c01', 5, 7, {}, 84],
  ['c01', 8, 9, { 8: LIME }, 120],
  ['c02', 0, 2, {}, 88],
  ['c02', 3, 4, { 3: LIME }, 104],
  ['c03', 1, 4, {}, 80],
  ['c03', 5, 8, { 8: LIME }, 80],
  ['c03', 9, 12, { 12: PINK }, 88],
  ['c04', 1, 5, {}, 80],
  ['c04', 6, 7, { 7: LIME }, 104],
  ['c04', 8, 11, { 8: LIME, 11: LIME }, 84],
  ['c05', 1, 6, {}, 78],
  ['c05', 7, 10, { 10: LIME }, 80],
  ['c06', 0, 1, {}, 96],
]

const word = (id, n) => {
  const c = getCue(id)
  return c.at + Math.max(0, c.words[n].t)
}

const Chunk = ({ t, id, a, b, accent, size, end, top = 1290 }) => {
  const cue = getCue(id)
  const toks = displayTokens(cue)
  const start = id === 'c01' && a === 0 ? -1 : word(id, a) - 0.04
  if (t < start || t > end) return null
  return (
    <div style={{ position: 'absolute', left: 120, right: 140, top, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '0 0.28em', fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.08, textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
      {toks.slice(a, b + 1).map((w, k) => {
        const i = a + k
        const at = id === 'c01' && i < 2 ? -1 : word(id, i) - 0.04
        const p = spring(t, at, 2.2, 9)
        if (t < at) return null
        return (
          <span key={i} style={{ display: 'inline-block', color: accent[i] ?? '#fff', WebkitTextStroke: `${size * 0.11}px #12002e`, paintOrder: 'stroke fill', textShadow: `0 ${size * 0.08}px 0 #12002e`, transform: `scale(${mix(1.6, 1, clamp(p)) * (1 + (1 - clamp(p)) * 0)}) rotate(${(1 - clamp(p)) * (k % 2 ? 6 : -6)}deg)`, opacity: clamp(p * 3) }}>
            {w}
          </span>
        )
      })}
    </div>
  )
}

// Autocollant arrondi qui claque en biais
const Sticker = ({ t, at, children, x, y, rot, bg, color = '#12002e', size = 64 }) => {
  const p = spring(t, at, 1.8, 7)
  if (t < at) return null
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${clamp(p * 1.2) * (2 - clamp(p))})`, fontFamily: FONT, fontWeight: 900, fontSize: size, color, background: bg, padding: '0.32em 0.62em', borderRadius: 999, border: '8px solid #12002e', boxShadow: '0 12px 0 #12002e', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>
      {children}
    </div>
  )
}

// Fonds colorés derrière le canevas transparent
const BG = [
  [0, `radial-gradient(120% 80% at 50% 35%, #8b4dff 0%, ${VIOLET} 45%, #2a0080 100%)`],
  [P.comment, `radial-gradient(120% 80% at 50% 40%, #7a3cff 0%, #3b0fb0 100%)`],
  [P.un, `radial-gradient(120% 80% at 50% 40%, #ff6bb5 0%, ${PINK} 55%, #b0005c 100%)`],
  [P.tiroir, `radial-gradient(120% 80% at 50% 40%, #8b4dff 0%, #3b0fb0 100%)`],
  [P.deux, `radial-gradient(120% 80% at 50% 40%, #e6ff8a 0%, ${LIME} 50%, #7fbf00 100%)`],
  [P.trois, `radial-gradient(120% 80% at 50% 30%, #ff8ac4 0%, ${PINK} 60%, #a8005a 100%)`],
  [P.secret, `radial-gradient(70% 50% at 50% 42%, #3b1680 0%, #12002e 60%, #05000f 100%)`],
  [P.fidelyz, `radial-gradient(120% 80% at 50% 38%, #9b6bff 0%, ${VIOLET} 50%, #1e0066 100%)`],
  [P.atouts, `radial-gradient(120% 80% at 50% 35%, #ff6bb5 0%, #c0007a 50%, #4a0090 100%)`],
  [P.fin, `radial-gradient(120% 80% at 50% 35%, #8b4dff 0%, ${VIOLET} 45%, #2a0080 100%)`],
]

// Rayons qui tournent (bande dessinée), discrets
const Burst = ({ t, opacity = 0.14 }) => (
  <AbsoluteFill style={{ opacity, background: `repeating-conic-gradient(from ${t * 18}deg at 50% 40%, rgba(255,255,255,0.9) 0deg 6deg, transparent 6deg 18deg)`, maskImage: 'radial-gradient(circle at 50% 40%, transparent 12%, #000 60%)', WebkitMaskImage: 'radial-gradient(circle at 50% 40%, transparent 12%, #000 60%)' }} />
)

export const Concurrent = ({ son = true }) => {
  const t = useT()
  const ready = usePreloadTextures()
  const { width, height } = useVideoConfig()
  const bg = [...BG].reverse().find(([s]) => t >= s)[1]

  // pulsation sur chaque temps, plus forte sur la mesure
  const sinceBeat = (t - 0.05) % BEAT
  const beatN = Math.floor((t - 0.05) / BEAT)
  const inBreak = t >= P.secret && t < P.fidelyz
  const pulse = inBreak ? 0 : Math.exp(-sinceBeat * 14) * (beatN % 4 === 0 ? 0.035 : 0.015)
  // coups de fouet entre les plans
  const whip = c => {
    const d = t - c
    if (Math.abs(d) > 0.13) return [0, 0]
    const k = 1 - Math.abs(d) / 0.13
    return [Math.sign(d || 1) * -k * k * 420, k * 30]
  }
  const ws = [whip(P.comment), whip(P.tiroir), whip(P.atouts), whip(P.fin)]
  const wx = ws.reduce((s, w) => s + w[0], 0)
  const wb = ws.reduce((s, w) => s + w[1], 0)
  const flash = Math.max(t >= P.fidelyz ? Math.exp(-(t - P.fidelyz) * 7) : 0, t >= 0.05 ? Math.exp(-(t - 0.05) * 10) * 0.7 : 0)
  const shake = t >= 7.49 && t < 7.8 ? (1 - (t - 7.49) / 0.31) * 24 : 0

  // fin des blocs de sous-titres : juste avant le suivant
  const ends = CHUNKS.map(([id, a, b], i) => {
    const next = CHUNKS[i + 1]
    const own = word(id, b) + 0.6
    return next ? Math.min(own, word(next[0], next[1]) - 0.06) : own
  })
  const x = t >= 7.49 ? spring(t, 7.49, 1.6, 7) : 0

  return (
    <AbsoluteFill style={{ background: bg, overflow: 'hidden' }}>
      {!inBreak && <Burst t={t} opacity={t < P.comment || (t >= P.fidelyz && t < P.atouts) ? 0.16 : 0.08} />}
      <AbsoluteFill style={{ transform: `translate(${wx + Math.sin(t * 90) * shake}px, ${Math.cos(t * 77) * shake}px) scale(${1 + pulse})`, filter: wb > 0.5 ? `blur(${wb}px)` : undefined }}>
        {ready && (
          <ThreeCanvas width={width} height={height} camera={{ fov: 36, near: 0.05, far: 60, position: [0, 0, 6] }} gl={{ antialias: true, alpha: true, premultipliedAlpha: false }}>
          <Scene3D t={t} />
        </ThreeCanvas>
        )}
      </AbsoluteFill>

      {/* « ✕ » sur le tiroir */}
      {t >= 7.49 && t < P.deux && (
        <div style={{ position: 'absolute', left: 540, top: 760, width: 520, height: 520, transform: `translate(-50%, -50%) rotate(-12deg) scale(${mix(2.2, 1, clamp(x))})`, opacity: clamp(x * 2) }}>
          {[45, -45].map(r => (
            <div key={r} style={{ position: 'absolute', left: -20, right: -20, top: '50%', height: 70, marginTop: -35, background: '#ff2e2e', borderRadius: 40, border: '8px solid #12002e', transform: `rotate(${r}deg)` }} />
          ))}
        </div>
      )}

      {CHUNKS.map(([id, a, b, accent, size], i) => (
        <Chunk key={i} t={t} id={id} a={a} b={b} accent={accent} size={size} end={ends[i]} />
      ))}

      {/* « Fidelyz ! » */}
      {t >= P.fidelyz && t < P.atouts + 0.1 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1290, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 150, color: LIME, WebkitTextStroke: '16px #12002e', paintOrder: 'stroke fill', textShadow: '0 14px 0 #12002e', transform: `scale(${mix(2, 1, clamp(spring(t, P.fidelyz, 1.8, 7)))}) rotate(-4deg)`, letterSpacing: '-0.03em' }}>
          FIDELYZ
        </div>
      )}

      {/* les trois atouts */}
      {t >= P.atouts && t < P.fin + 0.1 && (
        <>
          <Sticker t={t} at={18.46} x={430} y={1160} rot={-8} bg={LIME} size={74}>Zéro appli</Sticker>
          <Sticker t={t} at={19.46} x={530} y={1305} rot={5} bg={CREAM} size={74}>Prêt en 5 min</Sticker>
          <Sticker t={t} at={20.03} x={470} y={1445} rot={-4} bg={PINK} color="#fff" size={74}>Gratuit</Sticker>
        </>
      )}

      {/* lien en bio */}
      {t >= 21.45 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1350, textAlign: 'center' }}>
          <div style={{ display: 'inline-block', fontFamily: FONT, fontWeight: 900, fontSize: 112, color: '#fff', WebkitTextStroke: '12px #12002e', paintOrder: 'stroke fill', textShadow: '0 12px 0 #12002e', transform: `scale(${mix(1.8, 1, clamp(spring(t, 21.45, 1.8, 7)))})`, textTransform: 'uppercase' }}>
            Lien en bio
          </div>
          <div style={{ marginTop: 10, fontSize: 110, lineHeight: 1, color: LIME, transform: `translateY(${Math.abs(Math.sin((t - 21.45) * Math.PI / BEAT / 2)) * 28}px)`, WebkitTextStroke: '10px #12002e', paintOrder: 'stroke fill', fontFamily: FONT, fontWeight: 900 }}>↓</div>
        </div>
      )}
      {t >= 21.45 && <Chunk t={t} id="c09" a={3} b={7} accent={{ 7: LIME }} size={64} end={DUREE_CC + 1} top={1190} />}

      <AbsoluteFill style={{ background: '#fff', opacity: flash, pointerEvents: 'none' }} />
      {son && <Audio src={staticFile('tt/mix-concurrent.wav')} />}
    </AbsoluteFill>
  )
}

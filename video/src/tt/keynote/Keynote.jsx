import { ThreeCanvas } from '@remotion/three'
import { AbsoluteFill, Audio, staticFile, useVideoConfig } from 'remotion'
import { displayTokens, fontFamily, getCue, useT } from '../../lib'
import { clamp, easeOut, mix, pr, spring, usePreloadTextures } from '../kit3d'
import { Scene3D } from './Scene3D'
import { DUREE_KN, T } from './temps'

/* « Elle n'existe pas » — TikTok n° 2, keynote produit (28 s, 1080 × 1920).
   Studio blanc, un seul plan-séquence, voix posée (Victoria, ElevenLabs), musique minimale.
   L'anatomie de la carte : devant (logo, couleurs, points en direct), derrière (les offres), autour (la proximité). */

const INK = '#1d1d1f'
const BLUE = '#0071e3'

// Légende façon keynote : mots qui se posent en fondu, mots clés en bleu
const Line = ({ t, id, accent = [], top = 230, size = 74, out, color = INK, shadow, from = 0 }) => {
  const cue = getCue(id)
  const toks = displayTokens(cue)
  const end = out ?? cue.at + cue.dur + 0.3
  if (t < cue.at - 0.1 || t > end + 0.4) return null
  const o = pr(t, end, end + 0.35, k => k)
  return (
    <div style={{ position: 'absolute', left: 80, right: 80, top, textAlign: 'center', fontFamily, fontWeight: 600, fontSize: size, lineHeight: 1.12, letterSpacing: '-0.035em', color, textShadow: shadow, opacity: 1 - o, transform: `translateY(${-o * 20}px)` }}>
      {toks.map((w, i) => {
        if (i < from) return null
        const at = cue.at + Math.max(0, cue.words[i].t) - 0.06
        const p = pr(t, at, at + 0.4)
        return (
          <span key={i} style={{ display: 'inline-block', whiteSpace: 'pre', opacity: p, filter: `blur(${(1 - p) * 8}px)`, transform: `translateY(${(1 - p) * 16}px)`, color: accent.includes(i) ? BLUE : color }}>
            {w}{i < toks.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </div>
  )
}

// Chiffre géant qui défile verticalement (0 → 5)
const Big = ({ t }) => {
  const appear = pr(t, 20.0, 20.45)
  const roll = pr(t, 21.5, 21.85, k => 1 - Math.pow(1 - k, 4))
  const min = pr(t, 21.75, 22.15)
  const out = pr(t, T.logo - 0.4, T.logo, k => k)
  if (t < 19.9 || t > T.logo + 0.1) return null
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, color: INK, opacity: 1 - out }}>
      <div style={{ display: 'flex', alignItems: 'baseline', transform: `translateY(-80px) scale(${mix(0.92, 1, easeOut(appear))})`, opacity: appear }}>
        <div style={{ height: 560, overflow: 'hidden', fontSize: 560, fontWeight: 200, lineHeight: 1, letterSpacing: '-0.06em' }}>
          <div style={{ transform: `translateY(${-roll * 560}px)` }}>
            <div style={{ height: 560 }}>0</div>
            <div style={{ height: 560 }}>5</div>
          </div>
        </div>
        <div style={{ fontSize: 150, fontWeight: 300, letterSpacing: '-0.04em', width: min * 270, overflow: 'hidden', whiteSpace: 'nowrap', opacity: min, color: BLUE }}>&nbsp;min</div>
      </div>
      <div style={{ position: 'absolute', top: 1260, left: 0, right: 0, textAlign: 'center', fontSize: 58, fontWeight: 500, letterSpacing: '-0.03em' }}>
        <span style={{ display: 'inline-block', opacity: 1 - roll, transform: `translateY(${-roll * 30}px)`, position: 'absolute', left: 0, right: 0 }}>application à télécharger</span>
        <span style={{ display: 'inline-block', opacity: roll, transform: `translateY(${(1 - roll) * 30}px)`, position: 'absolute', left: 0, right: 0 }}>pour la créer</span>
      </div>
    </AbsoluteFill>
  )
}

export const Keynote = ({ son = true }) => {
  const t = useT()
  const ready = usePreloadTextures()
  const { width, height } = useVideoConfig()
  const blur = pr(t, T.flou - 0.2, T.flou + 0.35) * (1 - pr(t, T.logo - 0.35, T.logo, k => k))
  const word = spring(t, T.logo + 0.15, 1.2, 6)
  const pill = spring(t, 24.9, 1.4, 6)
  return (
    <AbsoluteFill style={{ background: '#f3f3f5', overflow: 'hidden' }}>
      <AbsoluteFill style={{ filter: blur > 0.01 ? `blur(${blur * 26}px)` : undefined, transform: `scale(${1 + blur * 0.06})` }}>
        {ready && (
          <ThreeCanvas width={width} height={height} camera={{ fov: 34, near: 0.05, far: 80, position: [0, 0, 5] }} gl={{ antialias: true }}>
          <Scene3D t={t} />
        </ThreeCanvas>
        )}
      </AbsoluteFill>
      <AbsoluteFill style={{ background: '#f5f5f7', opacity: blur * 0.55 }} />

      <Line t={t} id="k01" color="#fff" shadow="0 2px 24px rgba(0,0,0,0.5)" />
      <Line t={t} id="k02" accent={[1]} />
      <Line t={t} id="k03" accent={[8]} size={60} out={6.95} />
      <Line t={t} id="k04" accent={[2, 4, 7, 12]} size={60} out={11.45} />
      <Line t={t} id="k05" accent={[2, 10]} size={60} out={15.65} />
      <Line t={t} id="k06" accent={[10]} size={60} />
      <Big t={t} />

      {t >= T.logo && (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 1190, textAlign: 'center', fontFamily, fontWeight: 650, fontSize: 132, letterSpacing: '-0.05em', color: INK, opacity: clamp(word * 1.4), transform: `translateY(${(1 - clamp(word)) * 40}px)` }}>Fidelyz</div>
          <Line t={t} id="k08" top={1345} size={58} accent={[2]} out={DUREE_KN} from={1} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 1450, display: 'flex', justifyContent: 'center' }}>
            <div style={{ fontFamily, fontWeight: 600, fontSize: 44, color: '#fff', background: BLUE, borderRadius: 999, padding: '22px 54px', transform: `scale(${clamp(pill) * (1 + Math.sin(t * 5) * 0.012)})`, opacity: clamp(pill * 2), boxShadow: '0 20px 50px -12px rgba(0,113,227,0.45)' }}>Lien en bio</div>
          </div>
        </>
      )}
      <AbsoluteFill style={{ background: '#f3f3f5', opacity: pr(t, DUREE_KN - 0.6, DUREE_KN, k => k) }} />
      {son && <Audio src={staticFile('tt/mix-keynote.wav')} />}
    </AbsoluteFill>
  )
}

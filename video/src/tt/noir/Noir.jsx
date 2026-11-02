import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import { ThreeCanvas } from '@remotion/three'
import { AbsoluteFill, Audio, staticFile, useVideoConfig } from 'remotion'
import { Grain, displayTokens, fontFamily, getCue, useT } from '../../lib'
import { clamp, mix, pr, spring, usePreloadTextures } from '../kit3d'
import { CHAMPAGNE } from '../laque'
import { Scene3D } from './Scene3D'
import { DUREE_NOIR, N } from './temps'

/* « Noir » — tout en laque noire, rythme lent, voix grave (Hugo, ElevenLabs), deep house Pixabay.
   Chaque transition est un morphing liquide : un objet fond, redevient une goutte, puis prend la forme suivante. */

const SERIF = '"Instrument Serif", serif'

// Sous-titres fins, mots qui apparaissent dans un flou, mots clés en champagne
const Line = ({ t, id, accent = [], top = 1330, size = 56, out, serif }) => {
  const cue = getCue(id)
  const toks = displayTokens(cue)
  const end = out ?? cue.at + cue.dur + 0.35
  if (t < cue.at - 0.1 || t > end + 0.45) return null
  const o = pr(t, end, end + 0.45, k => k)
  return (
    <div style={{ position: 'absolute', left: 120, right: 120, top, textAlign: 'center', fontFamily: serif ? SERIF : fontFamily, fontWeight: serif ? 400 : 300, fontSize: size, lineHeight: 1.2, letterSpacing: serif ? '0' : '-0.01em', color: '#f5f5f7', opacity: 1 - o, filter: o > 0 ? `blur(${o * 8}px)` : undefined, textShadow: '0 2px 30px rgba(0,0,0,0.8)' }}>
      {toks.map((w, i) => {
        const at = cue.at + Math.max(0, cue.words[i].t) - 0.06
        const p = pr(t, at, at + 0.55)
        return (
          <span key={i} style={{ display: 'inline-block', whiteSpace: 'pre', opacity: p, filter: `blur(${(1 - p) * 9}px)`, transform: `translateY(${(1 - p) * 10}px)`, color: accent.includes(i) ? CHAMPAGNE : undefined, fontStyle: serif && accent.includes(i) ? 'italic' : undefined }}>
            {w}{i < toks.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </div>
  )
}

export const Noir = ({ son = true }) => {
  const t = useT()
  const ready = usePreloadTextures()
  const { width, height } = useVideoConfig()
  const word = spring(t, N.logo + 0.05, 1, 6)
  const pill = spring(t, 21.15, 1.2, 6)
  // reflet qui balaie l'image sur la basse
  const glint = t >= N.drop ? Math.exp(-(t - N.drop) * 5) : 0
  return (
    <AbsoluteFill style={{ background: '#030407', overflow: 'hidden' }}>
      {ready && (
        <ThreeCanvas width={width} height={height} camera={{ fov: 36, near: 0.05, far: 60, position: [0, 0, 6] }} gl={{ antialias: true }}>
          <Scene3D t={t} />
        </ThreeCanvas>
      )}
      <AbsoluteFill style={{ background: `linear-gradient(115deg, transparent ${mix(-30, 130, clamp((t - N.drop) / 0.6)) - 12}%, rgba(255,255,255,0.35) ${mix(-30, 130, clamp((t - N.drop) / 0.6))}%, transparent ${mix(-30, 130, clamp((t - N.drop) / 0.6)) + 12}%)`, opacity: glint > 0.02 ? 1 : 0, mixBlendMode: 'screen' }} />

      <Line t={t} id="n01" serif size={74} accent={[1]} top={1250} out={2.0} />
      <Line t={t} id="n02" serif size={74} accent={[3]} top={1250} out={4.3} />
      <Line t={t} id="n03" accent={[2, 4, 6]} />
      <Line t={t} id="n04" accent={[4, 11]} out={10.85} />
      <Line t={t} id="n05" accent={[3, 5]} top={1250} />
      <Line t={t} id="n06" accent={[12]} />

      {t >= N.logo && (
        <>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 1200, textAlign: 'center', fontFamily: SERIF, fontSize: 150, color: '#f5f5f7', letterSpacing: '0.01em', opacity: clamp(word * 1.3), transform: `translateY(${(1 - clamp(word)) * 30}px)`, filter: `blur(${(1 - clamp(word)) * 10}px)` }}>Fidelyz</div>
          <Line t={t} id="n07" top={1385} size={50} accent={[3, 4]} out={DUREE_NOIR} />
          {t >= 21.15 && (
            <div style={{ position: 'absolute', left: 0, right: 0, top: 1480, display: 'flex', justifyContent: 'center' }}>
              <div style={{ fontFamily, fontWeight: 500, fontSize: 40, letterSpacing: '0.18em', textTransform: 'uppercase', color: CHAMPAGNE, border: `1.5px solid ${CHAMPAGNE}`, borderRadius: 999, padding: '20px 56px', opacity: clamp(pill * 1.5), transform: `scale(${mix(0.9, 1, clamp(pill))})` }}>Lien en bio</div>
            </div>
          )}
        </>
      )}
      <AbsoluteFill style={{ background: '#030407', opacity: pr(t, DUREE_NOIR - 0.7, DUREE_NOIR, k => k) }} />
      <Grain />
      {son && <Audio src={staticFile('tt/mix-noir.wav')} />}
    </AbsoluteFill>
  )
}

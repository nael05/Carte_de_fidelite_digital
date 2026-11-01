import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion'
import { FPS, Grain } from '../lib'
import { T1_Hook } from './scenes/T1_Hook'
import { T2_Reveal } from './scenes/T2_Reveal'
import { T3_Design } from './scenes/T3_Design'
import { T4_Caisse } from './scenes/T4_Caisse'
import { T5_Push } from './scenes/T5_Push'
import { T6_Geo } from './scenes/T6_Geo'
import { T7_Return } from './scenes/T7_Return'
import { T8_End } from './scenes/T8_End'
import { pulse } from './rythme'

/* Version verticale 1080 × 1920 (TikTok, Reels, Shorts), 34 s calés sur la musique (150 BPM, une mesure = 1,6 s).
   Même principe que la version horizontale : chaque scène lit le temps absolu et se superpose à la précédente
   par continuité d'objet. T6 (la carte du quartier) passe sous T5, dont les points convergent vers la boutique. */
const SCENES = [T1_Hook, T2_Reveal, T3_Design, T4_Caisse, T6_Geo, T5_Push, T7_Return, T8_End]

// L'image pulse légèrement sur la grosse caisse (voir rythme.js)
const Pulse = ({ children }) => {
  const s = pulse(useCurrentFrame() / FPS)
  return <AbsoluteFill style={{ transform: `scale(${s})` }}>{children}</AbsoluteFill>
}

export const Tiktok = ({ son = true }) => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Pulse>
      {SCENES.map((S, i) => (
        <S key={i} />
      ))}
    </Pulse>
    <Grain />
    {/* Bande-son complète (musique montée, bruitages, voix) : scripts/mix-tiktok.mjs */}
    {son && <Audio src={staticFile('sons_tiktok/mix.wav')} />}
  </AbsoluteFill>
)

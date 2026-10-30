import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion'
import { FPS, Grain } from '../lib'
import VOIX from '../voix-tiktok.json'
import { T1_Hook } from './scenes/T1_Hook'
import { T2_Reveal } from './scenes/T2_Reveal'
import { T3_Design } from './scenes/T3_Design'
import { T4_Caisse } from './scenes/T4_Caisse'
import { T5_Push } from './scenes/T5_Push'
import { T6_Geo } from './scenes/T6_Geo'
import { T7_Return } from './scenes/T7_Return'
import { T8_End } from './scenes/T8_End'

/* Version verticale 1080 × 1920 (TikTok, Reels, Shorts), 34 s à 128 BPM : une mesure = 1,875 s.
   Même principe que la version horizontale : chaque scène lit le temps absolu et se superpose à la précédente
   par continuité d'objet. T6 (la carte du quartier) passe sous T5, dont les points convergent vers la boutique. */
const SCENES = [T1_Hook, T2_Reveal, T3_Design, T4_Caisse, T6_Geo, T5_Push, T7_Return, T8_End]

const RAMP = 0.2
const voiceLevel = t =>
  VOIX.reduce((acc, v) => {
    const a = v.at - RAMP
    const b = v.at + v.dur - 0.05
    if (t < a || t > b + RAMP) return acc
    const k = t < v.at ? (t - a) / RAMP : t > b ? 1 - (t - b) / RAMP : 1
    return Math.max(acc, k)
  }, 0)
const musicVolume = f => 0.66 - 0.28 * voiceLevel(f / FPS)

export const Tiktok = ({ son = true }) => (
  <AbsoluteFill style={{ background: '#000' }}>
    {SCENES.map((S, i) => (
      <S key={i} />
    ))}
    <Grain />
    {son && (
      <>
        <Audio src={staticFile('musique-tiktok.wav')} volume={musicVolume} />
        <Audio src={staticFile('bruitages-tiktok.wav')} volume={0.5} />
        {VOIX.map(v => (
          <Sequence key={v.id} from={Math.round(v.at * FPS)} layout="none">
            <Audio src={staticFile(`voix/${v.id}.wav`)} volume={1} />
          </Sequence>
        ))}
      </>
    )}
  </AbsoluteFill>
)

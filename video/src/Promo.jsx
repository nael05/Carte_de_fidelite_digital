import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion'
import { FPS, Grain } from './lib'
import VOIX from './voix.json'
import { A_Hook } from './scenes/A_Hook'
import { B_Reveal } from './scenes/B_Reveal'
import { C_Design } from './scenes/C_Design'
import { D_Signup } from './scenes/D_Signup'
import { E_Caisse } from './scenes/E_Caisse'
import { F_Push } from './scenes/F_Push'
import { G_Geo } from './scenes/G_Geo'
import { H_Stats } from './scenes/H_Stats'
import { I_End } from './scenes/I_End'

/* Timeline (60 s à 120 BPM : une mesure = 2 s). Chaque scène lit le temps absolu et ne s'affiche
   que sur sa plage ; les raccords se font par continuité d'objet (la carte, le QR code,
   la notification, les points, le tracé, le point de la courbe).
   Ordre d'empilement : G (quartier) passe sous F, dont les points convergent vers la boutique. */
const SCENES = [A_Hook, B_Reveal, C_Design, D_Signup, E_Caisse, G_Geo, F_Push, H_Stats, I_End]

// La musique baisse pendant que la voix parle (0,25 s de transition)
const RAMP = 0.25
const voiceLevel = t =>
  VOIX.reduce((acc, v) => {
    const a = v.at - RAMP
    const b = v.at + v.dur - 0.1
    if (t < a || t > b + RAMP) return acc
    const k = t < v.at ? (t - a) / RAMP : t > b ? 1 - (t - b) / RAMP : 1
    return Math.max(acc, k)
  }, 0)
const musicVolume = f => 0.62 - 0.3 * voiceLevel(f / FPS)

// Voix (public/voix/, scripts/voice.mjs), musique et bruitages (scripts/music.mjs)
export const Promo = ({ son = true }) => (
  <AbsoluteFill style={{ background: '#000' }}>
    {SCENES.map((S, i) => (
      <S key={i} />
    ))}
    <Grain />
    {son && (
      <>
        <Audio src={staticFile('musique.wav')} volume={musicVolume} />
        <Audio src={staticFile('bruitages.wav')} volume={0.5} />
        {VOIX.map(v => (
          <Sequence key={v.id} from={Math.round(v.at * FPS)} layout="none">
            <Audio src={staticFile(`voix/${v.id}.wav`)} volume={1} />
          </Sequence>
        ))}
      </>
    )}
  </AbsoluteFill>
)

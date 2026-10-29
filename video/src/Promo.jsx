import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion'
import { FPS, Grain, sec } from './lib'
import VOIX from './voix.json'
import { S1Hook } from './scenes/S1Hook'
import { S2Problem } from './scenes/S2Problem'
import { S3Solution } from './scenes/S3Solution'
import { S4Design } from './scenes/S4Design'
import { S5Client } from './scenes/S5Client'
import { S6Pro } from './scenes/S6Pro'
import { S7Trust } from './scenes/S7Trust'
import { S8End } from './scenes/S8End'

/* Timeline (voir le document de conception, section Partition).
   Une scène qui reprend un élément de la précédente (tranche, QR code, dos de carte)
   commence à l'image du raccord et se place au-dessus dans l'ordre ci-dessous. */
const SCENES = [
  { C: S1Hook, from: 0, len: sec(6), z: 1 },
  { C: S2Problem, from: sec(5.5), len: sec(9.5), z: 2 }, // raccord sur la tranche de la carte
  { C: S3Solution, from: sec(15), len: sec(9), z: 3 },
  { C: S4Design, from: sec(24), len: sec(16), z: 4 },
  { C: S5Client, from: sec(40), len: 400, z: 5 }, // plonge dans le QR code du client
  { C: S6Pro, from: 1596, len: 504, z: 6 }, // ressort du QR code, dans le scanner
  { C: S7Trust, from: sec(70), len: sec(10), z: 7 },
  { C: S8End, from: sec(79), len: sec(11), z: 8 }, // reprend la carte de la scène 7 en continu
]

// La musique baisse pendant que la voix parle (avec 0,3 s de transition)
const RAMP = 0.3
const voiceLevel = t =>
  VOIX.reduce((acc, v) => {
    const a = v.at - RAMP
    const b = v.at + (v.dur ?? 2) - 0.2
    if (t < a || t > b + RAMP) return acc
    const k = t < v.at ? (t - a) / RAMP : t > b ? 1 - (t - b) / RAMP : 1
    return Math.max(acc, k)
  }, 0)
const musicVolume = f => 0.55 - 0.3 * voiceLevel(f / FPS)

// Sons : voix off témoin dans public/voix/, musique et bruitages composés par scripts/music.mjs.
// Pour remplacer la voix, déposer les nouveaux fichiers aux mêmes noms (voir README).
export const Promo = ({ son = true }) => (
  <AbsoluteFill style={{ background: '#000' }}>
    {SCENES.map(({ C, from, len, z }, i) => (
      <Sequence key={i} from={from} durationInFrames={len} style={{ zIndex: z }}>
        <C />
      </Sequence>
    ))}
    <Grain />
    {son && (
      <>
        <Audio src={staticFile('musique.wav')} volume={musicVolume} />
        <Audio src={staticFile('bruitages.wav')} volume={0.7} />
        {VOIX.map(v => (
          <Sequence key={v.id} from={Math.round(v.at * FPS)} layout="none">
            <Audio src={staticFile(`voix/${v.id}.mp3`)} volume={1} />
          </Sequence>
        ))}
      </>
    )}
  </AbsoluteFill>
)

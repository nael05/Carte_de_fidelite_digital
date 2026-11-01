import { AbsoluteFill, Audio, staticFile } from 'remotion'
import { C, Grain, W, useT } from '../lib'
import { S1_Hook, S2_Probleme, S3_Clients, S4_Solution } from './scenes/Probleme'
import { S5_Carte, S6_Wallets, S7_Etapes, STEPS, SY } from './scenes/Solution'
import { S8_Creer, S9_Inscrire, S10_Caisse } from './scenes/Etapes'
import { S11_Campagne, S12_Geo, S13_Fin } from './scenes/Plus'
import { Backdrop, CutFx, Progress, Shot, beat } from './fx'
import { Cap, RED } from './common'

/* Vidéo explicative verticale (1080 × 1920, 53,5 s).
   Problème → solution → trois étapes sur les vrais écrans du site → campagnes et proximité → fin.
   Bande-son : scripts/mix-explication.mjs (voix Paul K, musique de fond, six bruitages) → public/explication/mix.wav.
   Toutes les coupes tombent sur un temps de la musique (beat(n) = drop « Fidelyz » + n × 0,4 s). */

export const DUREE = 53.5

// Coupes : [instant, type de transition, options]
const CUTS = [
  [beat(-23), 'glitch'], // 2,82 s : la carte déchirée → les trois plans
  [beat(-14), 'zoom'], // 6,42 s → les clients disparaissent
  [beat(-2), 'cut'], // 11,22 s → le « ? » aspire tout (même plan)
  [beat(2), 'zoom'], // 12,82 s : plongée dans le logo → la carte
  [beat(11), 'whip'], // 16,42 s → éventail Wallet
  [beat(22), 'glitch'], // 20,82 s → trois étapes
  [beat(27), 'iris', { x: STEPS[0].x, y: SY }], // 22,82 s : le « 1 » s'ouvre sur l'étape 1
  [beat(38), 'swipe', { dir: -1 }], // 27,22 s → étape 2
  [beat(51), 'swipe', { dir: 1 }], // 32,42 s → étape 3
  [beat(66.5), 'zoom'], // 38,62 s → campagnes
  [beat(78), 'up'], // 43,22 s → la carte du quartier
  [beat(87), 'flash'], // 46,82 s → fin
]
const SCENES = [S1_Hook, S2_Probleme, S3_Clients, S4_Solution, S5_Carte, S6_Wallets, S7_Etapes, S8_Creer, S9_Inscrire, S10_Caisse, S11_Campagne, S12_Geo, S13_Fin]

// Sous-titres : [réplique, premiers et derniers mots, disparition, couleurs, position, taille]
const B = { b: C.blue, c: C.champagne, r: RED }
const CAPS = [
  ['e01', [0, 5], 2.75, {}, 190, 90],
  ['e01', [6, 10], 2.75, { 8: B.r, 9: B.r, 10: B.r }, 400, 116],
  ['e02', [0, 4], 3.98, {}, 230, 96],
  ['e02', [5, 7], 4.78, {}, 230, 110],
  ['e02', [8, 12], 6.35, { 12: B.r }, 230, 96],
  ['e03', [0, 5], 8.75, { 4: B.r, 5: B.r }, 220, 94],
  ['e03', [6, 15], 11.1, { 13: B.c, 14: B.c, 15: B.c }, 220, 92],
  ['e04', [0, 1], 11.95, {}, 300, 124],
  ['e05', [0, 3], 14.1, {}, 200, 90],
  ['e05', [4, 10], 16.35, { 7: B.b }, 200, 86],
  ['e06', [0, 5], 18.8, { 1: C.text, 4: C.text }, 200, 88],
  ['e06', [6, 9], 20.75, { 6: B.b }, 200, 88],
  ['e07', [0, 2], 21.6, {}, 600, 128],
  ['e07', [3, 4], 22.75, { 3: B.b }, 600, 128],
  ['e08', [0, 4], 24.4, { 4: B.b }, 170, 84],
  ['e08', [5, 8], 26.1, { 6: B.c, 8: B.c }, 170, 84],
  ['e08', [9, 11], 27.15, { 10: B.c, 11: B.c }, 170, 84],
  ['e09', [0, 6], 30.25, { 5: B.b, 6: B.b }, 170, 80],
  ['e09', [7, 13], 32.35, { 13: B.b }, 170, 80],
  ['e10', [0, 3], 34.3, {}, 170, 82],
  ['e10', [4, 10], 36.45, { 7: B.c, 10: B.c }, 170, 82],
  ['e10', [11, 18], 38.55, { 16: B.b, 17: B.b, 18: B.b }, 170, 82],
  ['e11', [0, 4], 39.85, { 4: B.c }, 170, 84],
  ['e11', [5, 9], 41.15, { 9: B.c }, 170, 84],
  ['e11', [10, 14], 43.15, { 13: B.b, 14: B.b }, 170, 84],
  ['e12', [0, 6], 45.1, { 6: B.c }, 220, 88],
  ['e12', [7, 12], 46.75, { 10: B.b, 11: B.b, 12: B.b }, 220, 88],
]

export const Explication = ({ son = true }) => {
  const t = useT()
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Backdrop t={t} />
      {SCENES.map((S, i) => {
        const a = i === 0 ? 0 : CUTS[i - 1][0]
        const b = i === SCENES.length - 1 ? DUREE + 1 : CUTS[i][0]
        const [, tin, oin] = i === 0 ? [0, 'cut', {}] : CUTS[i - 1]
        const [, tout, oout] = i === SCENES.length - 1 ? [0, 'cut', {}] : CUTS[i]
        return (
          <Shot key={i} t={t} a={a} b={b} tin={tin} tout={tout} oin={oin ?? {}} oout={oout ?? {}}>
            <S />
          </Shot>
        )
      })}
      {CUTS.map(([c, type, o], i) => <CutFx key={i} t={t} c={c} type={type} dir={o?.dir ?? -1} />)}
      {CAPS.map(([id, only, out, accent, top, size], i) => {
        // le sous-titre s'efface avant que le suivant n'apparaisse
        const next = CAPS[i + 1]
        const end = next ? Math.min(out, W(next[0], next[1][0]) - 0.22) : out
        return <Cap key={i} id={id} only={only} out={end} accent={accent} top={top} size={size} />
      })}
      <Grain />
      <Progress t={t} dur={DUREE} />
      {son && <Audio src={staticFile('explication/mix.wav')} />}
    </AbsoluteFill>
  )
}

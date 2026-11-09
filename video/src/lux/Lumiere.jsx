import { Perdue, duree as d1 } from './v1/Perdue'
import { Ecran, duree as d2 } from './v2/Ecran'
import { Film, duree as d3 } from './v3/Film'
import { Versus, duree as d4 } from './v4/Versus'
import { Etapes, duree as d5 } from './v5/Etapes'
import { Geo, duree as d6 } from './v6/Geo'
import { Design, duree as d7 } from './v7/Design'
import { Prix, duree as d8 } from './v8/Prix'
import { Coupe, Pain, Resto } from './w2/Metier'
import { Camille, duree as dCam } from './w2/Camille'
import { Relance, duree as dRel } from './w2/Relance'
import { Raisons, duree as dRai } from './w2/Raisons'

/* Série « Lumière » (v2 de la série TikTok, PLAN-TIKTOK.md) : huit vidéos, dans l'ordre de publication */
export const LUMIERE = [
  { id: 'L1Perdue', set: 'lperdue', out: 'lumiere-1-carte-perdue', component: Perdue, duree: d1 },
  { id: 'L2Ecran', set: 'lecran', out: 'lumiere-2-ecran', component: Ecran, duree: d2 },
  { id: 'L3Film', set: 'lfilm', out: 'lumiere-3-film', component: Film, duree: d3 },
  { id: 'L4Versus', set: 'lversus', out: 'lumiere-4-versus', component: Versus, duree: d4 },
  { id: 'L5Etapes', set: 'letapes', out: 'lumiere-5-etapes', component: Etapes, duree: d5 },
  { id: 'L6Geo', set: 'lgeo', out: 'lumiere-6-proximite', component: Geo, duree: d6 },
  { id: 'L7Design', set: 'ldesign', out: 'lumiere-7-design', component: Design, duree: d7 },
  { id: 'L8Prix', set: 'lprix', out: 'lumiere-8-prix', component: Prix, duree: d8 },
  // vague 2
  { id: 'M1Pain', set: 'mpain', out: 'lumiere-9-boulangerie', component: Pain.Video, duree: Pain.duree },
  { id: 'M2Coupe', set: 'mcoupe', out: 'lumiere-10-coiffeur', component: Coupe.Video, duree: Coupe.duree },
  { id: 'M3Resto', set: 'mresto', out: 'lumiere-11-restaurant', component: Resto.Video, duree: Resto.duree },
  { id: 'M4Camille', set: 'mcamille', out: 'lumiere-12-camille', component: Camille, duree: dCam },
  { id: 'M5Relance', set: 'mrelance', out: 'lumiere-13-relance', component: Relance, duree: dRel },
  { id: 'M6Raisons', set: 'mraisons', out: 'lumiere-14-3-raisons', component: Raisons, duree: dRai },
]

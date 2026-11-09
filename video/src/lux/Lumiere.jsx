import { Perdue, duree as d1 } from './v1/Perdue'
import { Ecran, duree as d2 } from './v2/Ecran'
import { Film, duree as d3 } from './v3/Film'
import { Versus, duree as d4 } from './v4/Versus'
import { Etapes, duree as d5 } from './v5/Etapes'
import { Geo, duree as d6 } from './v6/Geo'
import { Design, duree as d7 } from './v7/Design'
import { Prix, duree as d8 } from './v8/Prix'
import { Beaute, Cafe, Coupe, Fleur, Pain, Pizza, Resto } from './w2/Metier'
import { Camille, duree as dCam } from './w2/Camille'
import { Relance, duree as dRel } from './w2/Relance'
import { Raisons, duree as dRai } from './w2/Raisons'
import { Recompenses, duree as dRec } from './w3/Recompenses'
import { Appli, duree as dApp } from './w3/Appli'
import { Pov, duree as dPov } from './w3/Pov'
import { Stats, duree as dSta } from './w4/Stats'
import { Multi, duree as dMul } from './w4/Multi'

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
  // vague 3
  { id: 'N1Cafe', set: 'mcafe', out: 'lumiere-15-cafe', component: Cafe.Video, duree: Cafe.duree },
  { id: 'N2Pizza', set: 'mpizza', out: 'lumiere-16-pizzeria', component: Pizza.Video, duree: Pizza.duree },
  { id: 'N3Recompenses', set: 'mrecomp', out: 'lumiere-17-recompenses', component: Recompenses, duree: dRec },
  { id: 'N4Appli', set: 'mappli', out: 'lumiere-18-sans-appli', component: Appli, duree: dApp },
  { id: 'N5Pov', set: 'mpov', out: 'lumiere-19-pov-client', component: Pov, duree: dPov },
  // vague 4
  { id: 'P1Fleur', set: 'mfleur', out: 'lumiere-20-fleuriste', component: Fleur.Video, duree: Fleur.duree },
  { id: 'P2Beaute', set: 'mbeaute', out: 'lumiere-21-institut-beaute', component: Beaute.Video, duree: Beaute.duree },
  { id: 'P3Stats', set: 'mstats', out: 'lumiere-22-statistiques', component: Stats, duree: dSta },
  { id: 'P4Multi', set: 'mmulti', out: 'lumiere-23-plusieurs-boutiques', component: Multi, duree: dMul },
]

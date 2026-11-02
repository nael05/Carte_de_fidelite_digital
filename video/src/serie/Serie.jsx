import { CartePerdue, duree as dPerdue } from './perdue/CartePerdue'
import { Ecran, duree as dEcran } from './ecran/Ecran'
import { Film, duree as dFilm } from './film/Film'
import { Versus, duree as dVersus } from './versus/Versus'
import { Etapes, duree as dEtapes } from './etapes/Etapes'
import { Geo, duree as dGeo } from './geo/Geo'
import { Design, duree as dDesign } from './design/Design'
import { Offre, duree as dOffre } from './offre/Offre'

/* Série « Studio » : les huit vidéos TikTok du plan de lancement (PLAN-TIKTOK.md), dans l'ordre de publication */
export const SERIE = [
  { id: 'SerieCartePerdue', set: 'perdue', out: 'serie-1-carte-perdue', component: CartePerdue, duree: dPerdue },
  { id: 'SerieFilm', set: 'film', out: 'serie-3-film', component: Film, duree: dFilm },
  { id: 'SerieEcran', set: 'ecran', out: 'serie-2-ecran', component: Ecran, duree: dEcran },
  { id: 'SerieVersus', set: 'versus', out: 'serie-4-versus', component: Versus, duree: dVersus },
  { id: 'SerieEtapes', set: 'etapes', out: 'serie-5-etapes', component: Etapes, duree: dEtapes },
  { id: 'SerieProximite', set: 'geo', out: 'serie-6-proximite', component: Geo, duree: dGeo },
  { id: 'SerieDesign', set: 'design', out: 'serie-7-design', component: Design, duree: dDesign },
  { id: 'SeriePrix', set: 'offre', out: 'serie-8-prix', component: Offre, duree: dOffre },
]

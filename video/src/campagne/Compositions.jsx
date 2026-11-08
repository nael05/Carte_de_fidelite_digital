import { Composition } from 'remotion'
import { FPS } from './kit'
import { Tour, DUREE as D_TOUR } from './tour/Tour'
import { Tampon, DUREE as D_TAMPON } from './tampon/Tampon'
import { Push, DUREE as D_PUSH } from './push/Push'
import { Creer, DUREE as D_CREER } from './creer/Creer'
import { Client, DUREE as D_CLIENT } from './client/Client'
import { Papier, DUREE as D_PAPIER } from './papier/Papier'
import { Proximite, DUREE as D_PROX } from './proximite/Proximite'
import { Site, DUREE as D_SITE } from './site/Site'
import { Questions, DUREE as D_QUESTIONS } from './questions/Questions'
import { Calcul, DUREE as D_CALCUL } from './calcul/Calcul'

/* Vidéos « campagne » : chaque vidéo existe avec voix (C-…) et sans voix (C-…-muet, musique et sous-titres). */
const V = (id, Comp, duree, w = 1080, h = 1920) => [
  <Composition key={id} id={`C-${id}`} component={Comp} durationInFrames={Math.ceil(duree * FPS)} fps={FPS} width={w} height={h} defaultProps={{ voix: true, son: true }} />,
  <Composition key={id + 'm'} id={`C-${id}-muet`} component={Comp} durationInFrames={Math.ceil(duree * FPS)} fps={FPS} width={w} height={h} defaultProps={{ voix: false, son: true }} />,
]

export const Campagne = () => (
  <>
    {V('01-tour', Tour, D_TOUR)}
    {V('02-tampon', Tampon, D_TAMPON)}
    {V('03-push', Push, D_PUSH)}
    {V('04-creer', Creer, D_CREER)}
    {V('05-papier', Papier, D_PAPIER)}
    {V('06-client', Client, D_CLIENT)}
    {V('07-proximite', Proximite, D_PROX)}
    {V('08-questions', Questions, D_QUESTIONS)}
    {V('09-calcul', Calcul, D_CALCUL)}
    {V('site-paysage', Site, D_SITE, 1920, 1080)}
  </>
)

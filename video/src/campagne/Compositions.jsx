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
import { Metier, dureeMetier } from './metier/Metier'
import { Spot, DUREE as D_SPOT } from './spot/Spot'
import { Portefeuille, DUREE as D_PORTEFEUILLE } from './portefeuille/Portefeuille'
import { Couverture } from './Couverture'
import { ExpressVideo, dureeExpress } from './express/videos'
import { SigCarte, D_SIGCARTE, SigMessage, D_SIGMESSAGE, SigDesign, D_SIGDESIGN, SigCaisse, D_SIGCAISSE, SigClient, D_SIGCLIENT, SigFilm, D_SIGFILM } from './signature/Videos'
import { Astuces, DUREE as D_ASTUCES } from './astuces/Astuces'
import { Appli, DUREE as D_APPLI } from './appli/Appli'

/* Vidéos « campagne » : chaque vidéo existe avec voix (C-…) et sans voix (C-…-muet, musique et sous-titres). */
const V = (id, Comp, duree, w = 1080, h = 1920, extra = {}) => [
  <Composition key={id} id={`C-${id}`} component={Comp} durationInFrames={Math.ceil(duree * FPS)} fps={FPS} width={w} height={h} defaultProps={{ voix: true, son: true, ...extra }} />,
  <Composition key={id + 'm'} id={`C-${id}-muet`} component={Comp} durationInFrames={Math.ceil(duree * FPS)} fps={FPS} width={w} height={h} defaultProps={{ voix: false, son: true, ...extra }} />,
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
    {V('10-boulangerie', Metier, dureeMetier('boulangerie'), 1080, 1920, { metier: 'boulangerie' })}
    {V('11-coiffure', Metier, dureeMetier('coiffure'), 1080, 1920, { metier: 'coiffure' })}
    {V('12-restaurant', Metier, dureeMetier('restaurant'), 1080, 1920, { metier: 'restaurant' })}
    {V('13-portefeuille', Portefeuille, D_PORTEFEUILLE)}
    {V('14-barbier', Metier, dureeMetier('barbier'), 1080, 1920, { metier: 'barbier' })}
    {V('15-fleuriste', Metier, dureeMetier('fleuriste'), 1080, 1920, { metier: 'fleuriste' })}
    {V('16-institut', Metier, dureeMetier('institut'), 1080, 1920, { metier: 'institut' })}
    {V('17-astuces', Astuces, D_ASTUCES)}
    {V('18-appli', Appli, D_APPLI)}
    <Composition id="C-couverture" component={Couverture} durationInFrames={40 * FPS} fps={FPS} width={1080} height={1920} defaultProps={{ n: '01' }} />
    {V('19-rep-android', ExpressVideo, dureeExpress('rep-android'), 1080, 1920, { video: 'rep-android' })}
    {V('20-rep-ages', ExpressVideo, dureeExpress('rep-ages'), 1080, 1920, { video: 'rep-ages' })}
    {V('21-rep-telephone', ExpressVideo, dureeExpress('rep-telephone'), 1080, 1920, { video: 'rep-telephone' })}
    {V('22-pov-client', ExpressVideo, dureeExpress('pov-client'), 1080, 1920, { video: 'pov-client' })}
    {V('23-erreurs', ExpressVideo, dureeExpress('erreurs'), 1080, 1920, { video: 'erreurs' })}
    {V('24-paliers', ExpressVideo, dureeExpress('paliers'), 1080, 1920, { video: 'paliers' })}
    {V('25-stats', ExpressVideo, dureeExpress('stats'), 1080, 1920, { video: 'stats' })}
    {V('26-rep-prix', ExpressVideo, dureeExpress('rep-prix'), 1080, 1920, { video: 'rep-prix' })}
    {V('27-relance', ExpressVideo, dureeExpress('relance'), 1080, 1920, { video: 'relance' })}
    {V('28-pov-commercant', ExpressVideo, dureeExpress('pov-commercant'), 1080, 1920, { video: 'pov-commercant' })}
    {V('29-mythe-wallet', ExpressVideo, dureeExpress('mythe-wallet'), 1080, 1920, { video: 'mythe-wallet' })}
    {V('30-rep-donnees', ExpressVideo, dureeExpress('rep-donnees'), 1080, 1920, { video: 'rep-donnees' })}
    {V('31-rep-caisse', ExpressVideo, dureeExpress('rep-caisse'), 1080, 1920, { video: 'rep-caisse' })}
    {V('S1-carte', SigCarte, D_SIGCARTE)}
    {V('S2-message', SigMessage, D_SIGMESSAGE)}
    {V('S3-design', SigDesign, D_SIGDESIGN)}
    {V('S4-caisse', SigCaisse, D_SIGCAISSE)}
    {V('S5-client', SigClient, D_SIGCLIENT)}
    {V('S-film', SigFilm, D_SIGFILM, 1920, 1080)}
    {V('site-paysage', Site, D_SITE, 1920, 1080)}
    {V('spot-paysage', Spot, D_SPOT, 1920, 1080)}
  </>
)

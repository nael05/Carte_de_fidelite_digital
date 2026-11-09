import { AbsoluteFill } from 'remotion'
import { C, FPS, Logo, font } from './kit'
import { Tour } from './tour/Tour'
import { Tampon } from './tampon/Tampon'
import { Push } from './push/Push'
import { Creer } from './creer/Creer'
import { Papier } from './papier/Papier'
import { Client } from './client/Client'
import { Proximite } from './proximite/Proximite'
import { Questions } from './questions/Questions'
import { Calcul } from './calcul/Calcul'
import { Metier } from './metier/Metier'
import { Portefeuille } from './portefeuille/Portefeuille'
import { Astuces } from './astuces/Astuces'
import { Appli } from './appli/Appli'
import { ExpressVideo } from './express/videos'

/* Images de couverture (TikTok, Reels) : une image de la vidéo, un voile, un titre court au centre
   (zone visible aussi dans la grille Instagram, recadrée en 4:5). */
export const COUVERTURES = {
  '01': { C: Tour, at: 5.2, l1: 'Ta carte de fidélité', l2: 'dans leur téléphone', a: C.blue },
  '02': { C: Tampon, at: 3.4, l1: 'Il lui manquait', l2: 'UN tampon', a: C.red },
  '03': { C: Push, at: 1.6, l1: 'Ta boutique', l2: 'sur leur écran', a: C.blue },
  '04': { C: Creer, at: 17.5, l1: 'Ta carte', l2: 'en 2 minutes', a: C.green, light: true, box: true },
  '05': { C: Papier, at: 8.8, l1: 'Papier', l2: 'contre Wallet', a: C.blue },
  '06': { C: Client, at: 13.5, l1: 'Rien à télécharger', l2: '10 secondes', a: C.green },
  '07': { C: Proximite, at: 11.5, l1: 'Il passe devant', l2: 'ta boutique…', a: C.blue },
  '08': { C: Questions, at: 1.4, l1: '3 questions', l2: 'que tu te poses', a: '#ff9f0a' },
  '09': { C: Calcul, at: 19.0, l1: 'Combien te coûte', l2: 'un client perdu ?', a: C.red, light: true },
  '10': { C: Metier, p: { metier: 'boulangerie' }, at: 1.8, l1: 'Si t\'as une', l2: 'boulangerie', a: C.champagne },
  '11': { C: Metier, p: { metier: 'coiffure' }, at: 12.6, l1: 'Si t\'as un salon', l2: 'de coiffure', a: '#c9a7ff' },
  '12': { C: Metier, p: { metier: 'restaurant' }, at: 10.5, l1: 'Si t\'as un', l2: 'restaurant', a: '#9fd0ff' },
  '13': { C: Portefeuille, at: 8.3, l1: 'POV : le portefeuille', l2: 'de ton client', a: C.red },
  '14': { C: Metier, p: { metier: 'barbier' }, at: 1.8, l1: 'Si t\'as un', l2: 'barber shop', a: '#e0b25a' },
  '15': { C: Metier, p: { metier: 'fleuriste' }, at: 1.8, l1: 'Si t\'es', l2: 'fleuriste', a: '#e8a3b5' },
  '17': { C: Astuces, at: 1.6, l1: '3 astuces pour que', l2: 'tes clients reviennent', a: C.blue },
  '18': { C: Appli, at: 3.6, l1: 'Une appli pour', l2: 'ta boutique ?', a: C.red },
  '16': { C: Metier, p: { metier: 'institut' }, at: 1.8, l1: 'Si t\'as un institut', l2: 'de beauté', a: '#f2c6d4' },
  '19': { C: ExpressVideo, p: { video: 'rep-android' }, at: 4.6, l1: 'Et pour mes clients', l2: 'sur Android ?', a: C.green },
  '20': { C: ExpressVideo, p: { video: 'rep-ages' }, at: 8.2, l1: 'Mes clients sont âgés,', l2: 'ils vont y arriver ?', a: '#ff9f0a' },
  '21': { C: ExpressVideo, p: { video: 'rep-telephone' }, at: 10.2, l1: 'Il change de téléphone,', l2: 'il perd ses points ?', a: C.blue },
  '22': { C: ExpressVideo, p: { video: 'pov-client' }, at: 13.0, l1: 'POV :', l2: "t'es le client", a: C.blue },
  '23': { C: ExpressVideo, p: { video: 'erreurs' }, at: 4.6, l1: '3 erreurs qui font', l2: 'fuir tes clients', a: C.red },
  '24': { C: ExpressVideo, p: { video: 'paliers' }, at: 9.2, l1: 'Une récompense ?', l2: 'Mets-en deux', a: C.champagne },
  '25': { C: ExpressVideo, p: { video: 'stats' }, at: 7.6, l1: 'Combien de clients', l2: 'sont revenus ?', a: C.blue },
  '26': { C: ExpressVideo, p: { video: 'rep-prix' }, at: 0, l1: "C'est combien", l2: 'Fidelyz ?', a: C.green },
  '27': { C: ExpressVideo, p: { video: 'relance' }, at: 4.8, l1: 'Les clients qui', l2: 'ne reviennent plus', a: C.red },
  '28': { C: ExpressVideo, p: { video: 'pov-commercant' }, at: 6.0, l1: 'POV :', l2: "t'es le commerçant", a: C.champagne },
  '29': { C: ExpressVideo, p: { video: 'mythe-wallet' }, at: 5.0, l1: 'Le Wallet, pas que', l2: 'pour les billets', a: C.blue },
  '30': { C: ExpressVideo, p: { video: 'rep-donnees' }, at: 13.5, l1: 'Les données de', l2: 'tes clients 🔒', a: C.blue },
  '31': { C: ExpressVideo, p: { video: 'rep-caisse' }, at: 4.5, l1: 'Ça va ralentir', l2: 'ma caisse ?', a: '#ff9f0a' },
}

export const Couverture = ({ n = '01' }) => {
  const v = COUVERTURES[n]
  const V = v.C
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <V voix={false} son={false} {...(v.p ?? {})} />
      {/* on masque les sous-titres de la vidéo et on assombrit le centre pour le titre */}
      <div style={{ position: 'absolute', zIndex: 200, left: 0, right: 0, top: 0, height: 480, background: v.light ? '#f6f6f8' : '#000' }} />
      <div style={{ position: 'absolute', zIndex: 200, left: 0, right: 0, top: 480, height: 200, background: `linear-gradient(180deg, ${v.light ? '#f6f6f8' : '#000'}, transparent)` }} />
      {!v.light && <div style={{ position: 'absolute', zIndex: 200, inset: 0, background: 'radial-gradient(70% 30% at 50% 50%, rgba(0,0,0,0.72), transparent)' }} />}
      {v.light && <div style={{ position: 'absolute', zIndex: 200, inset: 0, background: 'radial-gradient(75% 32% at 50% 50%, rgba(246,246,248,0.9), transparent)' }} />}
      <div style={{ position: 'absolute', zIndex: 201, left: 60, right: 60, top: 760, textAlign: 'center', fontFamily: font, fontWeight: 850, letterSpacing: '-0.045em', lineHeight: 1.02, textShadow: v.light ? 'none' : '0 8px 40px rgba(0,0,0,0.8)' }}>
        <div style={v.box ? { display: 'inline-block', padding: '30px 50px 36px', borderRadius: 48, background: 'rgba(29,29,31,0.92)', boxShadow: '0 30px 80px -20px rgba(0,0,0,0.5)' } : undefined}>
          <div style={{ fontSize: 104, color: v.light && !v.box ? '#1d1d1f' : '#fff' }}>{v.l1}</div>
          <div style={{ fontSize: 108, color: v.a }}>{v.l2}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', zIndex: 201, left: 0, right: 0, top: 230, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 18 }}>
        <Logo size={74} /><span style={{ fontFamily: font, fontSize: 56, fontWeight: 750, letterSpacing: '-0.03em', color: v.light ? '#1d1d1f' : '#fff' }}>Fidelyz</span>
      </div>
    </AbsoluteFill>
  )
}

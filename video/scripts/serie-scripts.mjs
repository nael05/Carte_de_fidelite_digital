// Répliques de la série « Studio » (PLAN-TIKTOK.md) → src/voix-<set>.json
// gap : silence avant la réplique (s), start : instant de la première. Les instants « at » sont recalculés
// par scripts/serie-temps.mjs une fois les voix générées. Usage : node scripts/serie-scripts.mjs [set…] (écrase les fichiers)
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const F = s => s.replace(/Fidelyz/g, 'Fidéliz')
export const SCRIPTS = {
  perdue: { p: 'pa', start: 0.25, lines: [
    [0, '« J’ai perdu ma carte. »', 'J’ai perdu ma carte.'],
    [0.7, 'Neuf tampons. Il n’en manquait qu’un.'],
    [0.5, 'Et ton client repart… sans aucune raison de revenir.'],
    [0.9, 'Avec Fidelyz, sa carte vit dans son téléphone.'],
    [0.45, 'Impossible à perdre. Toujours à jour.'],
    [0.45, 'Et sa récompense l’attend, là, dans son Wallet.'],
    [0.7, 'Fidelyz. Fais revenir tes clients.'],
  ] },
  ecran: { p: 'ec', start: 0.25, lines: [
    [0, 'L’endroit que tes clients regardent cent fois par jour ?'],
    [0.45, 'Leur écran de verrouillage.'],
    [0.8, 'Avec Fidelyz, tu écris ton offre…'],
    [0.9, '… et elle s’affiche ici. Chez tous tes clients. En une seconde.', 'Et elle s’affiche ici. Chez tous tes clients. En une seconde.'],
    [0.6, 'Pas de SMS à payer. Pas d’email perdu dans les spams.'],
    [0.6, 'Fidelyz. Fais revenir tes clients.'],
  ] },
  film: { p: 'fi', start: 0.4, lines: [
    [0, 'Voici la carte de fidélité qui ne se perd jamais.'],
    [0.6, 'Elle vit dans Apple Wallet. Et dans Google Wallet.'],
    [0.5, 'Aucune application à télécharger.'],
    [0.6, 'Ton logo. Tes couleurs. En cinq minutes.'],
    [0.6, 'Un scan en caisse, et les points s’ajoutent.'],
    [0.6, 'Et pour les faire revenir : une notification, directement sur leur écran.'],
    [0.7, 'Fidelyz. Gratuit pour commencer.'],
  ] },
  versus: { p: 'vs', start: 0.25, lines: [
    [0, 'Carte en papier, ou carte dans le téléphone ?'],
    [0.6, 'Le papier se perd. Le téléphone, jamais.'],
    [0.6, 'Le papier s’abîme. Le pass reste impeccable, et toujours à jour.'],
    [0.6, 'Avec le papier, tu ne sais rien de tes clients. Avec Fidelyz, tu leur parles quand tu veux.'],
    [0.7, 'Le choix est vite fait.'],
  ] },
  etapes: { p: 'et', start: 0.25, lines: [
    [0, 'Une carte de fidélité digitale ? Trois étapes.'],
    [0.6, 'Un. Tu importes ton logo et tu choisis tes couleurs.'],
    [0.7, 'Deux. Tu poses ton QR code en caisse. Tes clients scannent, et ajoutent leur carte en un geste.', 'Deux. Tu poses ton QR code en caisse. Tes clients scannent, et ajoutent leur carte en un geste.'],
    [0.7, 'Trois. À chaque passage, un scan, et les points s’ajoutent.'],
    [0.7, 'Moins de cinq minutes. Gratuit jusqu’à quinze clients.'],
    [0.5, 'Lien en bio.'],
  ] },
  geo: { p: 'ge', start: 0.3, lines: [
    [0, 'Ton client passe à cinquante mètres de ta boutique.'],
    [0.6, 'Son téléphone le lui rappelle.'],
    [0.5, 'Ta carte s’affiche sur son écran, avec ses points.'],
    [0.6, 'Il entre. Sans que tu aies rien eu à faire.'],
    [0.7, 'Fidelyz. La carte qui se rappelle à eux.'],
  ] },
  design: { p: 'de', start: 0.5, lines: [
    [0, 'Ta carte. À ton image.'],
    [0.7, 'Graphite. Azur. Champagne. Ivoire.'],
    [0.8, 'Ton logo, ton nom, tes récompenses.'],
    [1.0, 'Fidelyz.'],
  ] },
  offre: { p: 'of', start: 0.25, lines: [
    [0, 'Combien coûte une carte de fidélité digitale ?'],
    [0.5, 'Zéro euro.'],
    [0.6, 'Gratuit jusqu’à quinze clients, Apple et Google Wallet compris.'],
    [0.5, 'Sans engagement. Prête en cinq minutes.'],
    [0.6, 'Fidelyz. Lien en bio.'],
  ] },
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const only = process.argv.slice(2)
  for (const [set, s] of Object.entries(SCRIPTS)) {
    if (only.length && !only.includes(set)) continue
    const cues = s.lines.map(([gap, text, say], i) => ({ id: `${s.p}${String(i + 1).padStart(2, '0')}`, at: 0, gap, text, say: F(say ?? text), dur: 1, words: [] }))
    cues[0].at = s.start
    fs.writeFileSync(path.join(root, `src/voix-${set}.json`), JSON.stringify(cues, null, 2) + '\n')
    console.log(set, cues.length)
  }
}

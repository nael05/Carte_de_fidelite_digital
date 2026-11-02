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
  // ─── Série « Lumière » (v2) : voix ElevenLabs v3 avec émotions (balises entre crochets, non affichées) ───
  lperdue: { p: 'lp', start: 0.3, lines: [
    [0, '« J’ai perdu ma carte. »', '[sighs] J’ai perdu ma carte...'],
    [0.5, 'Neuf tampons. Il n’en manquait qu’un.', 'Neuf tampons. [disappointed] Il n’en manquait qu’un.'],
    [0.4, 'Et ton client repart… sans raison de revenir.', 'Et ton client repart... [sad] sans raison de revenir.'],
    [0.7, 'Fidelyz, c’est la carte de fidélité digitale.', '[confident] Fidelyz, c’est la carte de fidélité digitale.'],
    [0.3, 'Elle vit dans leur téléphone : Apple Wallet, Google Wallet.', 'Elle vit dans leur téléphone. Apple Wallet, Google Wallet.'],
    [0.3, 'Impossible à perdre. Toujours à jour.', '[warmly] Impossible à perdre. Toujours à jour.'],
    [0.5, 'Fidelyz. Fais revenir tes clients.', '[excited] Fidelyz. Fais revenir tes clients !'],
  ] },
  lecran: { p: 'le', start: 0.3, lines: [
    [0, 'Tu sais ce que tes clients regardent cent fois par jour ?', '[curious] Tu sais ce que tes clients regardent... cent fois par jour ?'],
    [0.4, 'Leur écran de verrouillage.', '[whispers] Leur écran de verrouillage.'],
    [0.6, 'Fidelyz met ta carte de fidélité dans leur Wallet.', '[confident] Fidelyz met ta carte de fidélité dans leur Wallet.'],
    [0.3, 'Et quand tu veux les faire revenir…', 'Et quand tu veux les faire revenir...'],
    [0.2, 'ton offre s’affiche ici. Chez tous tes clients.', '[excited] ton offre s’affiche ici. Chez tous tes clients !'],
    [0.4, 'Pas de SMS. Pas d’email perdu.', 'Pas de SMS. Pas d’email perdu.'],
    [0.5, 'Fidelyz. La carte de fidélité digitale.', '[warmly] Fidelyz. La carte de fidélité digitale.'],
  ] },
  lfilm: { p: 'lf', start: 0.6, lines: [
    [0, 'Voici Fidelyz.', '[whispers] Voici... Fidelyz.'],
    [0.3, 'La carte de fidélité digitale de ton commerce.', 'La carte de fidélité digitale de ton commerce.'],
    [0.4, 'Dans Apple Wallet. Et dans Google Wallet.', 'Dans Apple Wallet. Et dans Google Wallet.'],
    [0.3, 'Aucune application à télécharger.', '[confident] Aucune application à télécharger.'],
    [0.4, 'Ton logo. Tes couleurs.', 'Ton logo. Tes couleurs.'],
    [0.4, 'Un scan en caisse, et les points tombent.', 'Un scan en caisse... [excited] et les points tombent !'],
    [0.4, 'Une notification, et ils reviennent.', 'Une notification... [warmly] et ils reviennent.'],
    [0.5, 'Fidelyz. Gratuit pour commencer.', '[excited] Fidelyz. Gratuit pour commencer !'],
  ] },
  lversus: { p: 'lv', start: 0.3, lines: [
    [0, 'Ta carte de fidélité : en papier, ou dans le téléphone ?', '[curious] Ta carte de fidélité... en papier, ou dans le téléphone ?'],
    [0.5, 'Le papier se perd. Le téléphone, jamais.', 'Le papier se perd. [confident] Le téléphone, jamais.'],
    [0.5, 'Le papier s’abîme. Fidelyz reste impeccable, et à jour.', '[sighs] Le papier s’abîme. [confident] Fidelyz reste impeccable, et à jour.'],
    [0.5, 'Le papier ne dit rien. Fidelyz envoie tes offres à tes clients.', 'Le papier ne dit rien. [excited] Fidelyz envoie tes offres à tes clients !'],
    [0.6, 'Fidelyz. La carte de fidélité digitale.', '[warmly] Fidelyz. La carte de fidélité digitale.'],
  ] },
  letapes: { p: 'ls', start: 0.3, lines: [
    [0, 'Ta carte de fidélité digitale ? Trois étapes.', '[curious] Ta carte de fidélité digitale ? [confident] Trois étapes.'],
    [0.5, 'Un. Ton logo, tes couleurs : ta carte est prête.', 'Un. Ton logo, tes couleurs... [warmly] ta carte est prête.'],
    [0.5, 'Deux. Tes clients scannent ton QR code, et l’ajoutent à leur Wallet.', 'Deux. Tes clients scannent ton QR code, et l’ajoutent à leur Wallet.'],
    [0.5, 'Trois. À chaque passage, un scan, et les points s’ajoutent.', 'Trois. À chaque passage, un scan... [excited] et les points s’ajoutent !'],
    [0.5, 'Moins de cinq minutes. Gratuit jusqu’à quinze clients.', '[warmly] Moins de cinq minutes. Gratuit jusqu’à quinze clients.'],
    [0.4, 'Fidelyz. Lien en bio.', '[excited] Fidelyz. Lien en bio !'],
  ] },
  lgeo: { p: 'lg', start: 0.4, lines: [
    [0, 'Ton client passe à cinquante mètres de ta boutique.', '[whispers] Ton client passe à cinquante mètres de ta boutique...'],
    [0.4, 'Et sa carte de fidélité Fidelyz s’affiche sur son écran.', '[excited] Et sa carte de fidélité Fidelyz s’affiche sur son écran.'],
    [0.4, 'Avec ses points. Et l’envie d’entrer.', '[warmly] Avec ses points. Et l’envie d’entrer.'],
    [0.6, 'Fidelyz. La carte de fidélité qui fait revenir tes clients.', '[confident] Fidelyz. La carte de fidélité qui fait revenir tes clients.'],
  ] },
  ldesign: { p: 'ld', start: 0.6, lines: [
    [0, 'Fidelyz. La carte de fidélité digitale.', '[whispers] Fidelyz. La carte de fidélité digitale.'],
    [0.4, 'À ton image.', '[warmly] À ton image.'],
    [0.5, 'Graphite. Azur. Champagne. Ivoire.', 'Graphite. Azur. Champagne. Ivoire.'],
    [0.5, 'Ton logo, tes couleurs, dans le Wallet de tes clients.', 'Ton logo, tes couleurs, dans le Wallet de tes clients.'],
    [0.7, 'Fidelyz.', '[excited] Fidelyz.'],
  ] },
  lprix: { p: 'lx', start: 0.3, lines: [
    [0, 'Combien coûte une carte de fidélité digitale ?', '[curious] Combien coûte une carte de fidélité digitale ?'],
    [0.3, 'Dans Apple Wallet et Google Wallet ?', 'Dans Apple Wallet et Google Wallet ?'],
    [0.5, 'Avec Fidelyz : zéro euro.', 'Avec Fidelyz... [excited] zéro euro.'],
    [0.4, 'Gratuit jusqu’à quinze clients. Sans engagement.', '[warmly] Gratuit jusqu’à quinze clients. Sans engagement.'],
    [0.3, 'Prête en cinq minutes.', 'Prête en cinq minutes.'],
    [0.5, 'Fidelyz. Lien en bio.', '[excited] Fidelyz. Lien en bio !'],
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

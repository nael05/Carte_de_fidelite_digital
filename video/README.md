# Vidéo promotionnelle Fidelyz

Spot de 58 s en 16:9 (1920 × 1080, 30 i/s), codé avec Remotion à partir des vrais composants du site (pass Wallet, caisse, notifications).
Rythme : 120 BPM (une mesure = 2 s). Les textes à l'écran apparaissent mot par mot, au moment où la voix les prononce.

```bash
npm install
npm run studio    # prévisualisation et réglages image par image
npm run render    # encode out/fidelyz-promo.mp4 (version horizontale, 16:9)
npm run render:tiktok   # encode out/fidelyz-tiktok.mp4 (version verticale, 9:16)
npm run stills -- 90 600 1500                 # images fixes (numéros d'image)
npm run stills -- --planche 0.5 3.2 8.4 ...   # planches de 20 vignettes (temps en secondes)
npm run stills -- --planche --vertical 0.5 3.2 ...   # idem pour la version verticale (24 vignettes)
```

## Déroulé

| Temps | Scène | Raccord vers la suivante |
| --- | --- | --- |
| 0 – 8 s | A. Carte papier : oubliée, perdue, déchirée | ses fragments forment la carte numérique |
| 8 – 14 s | B. Fidelyz, iPhone (Apple Wallet) et Android (Google Wallet) | la carte jaillit de l'iPhone |
| 14 – 19,6 s | C. Studio : logo, couleurs, photo | la carte pivote sur sa tranche et devient un téléphone |
| 19,6 – 25 s | D. Inscription et ajout au Wallet en 10 s | plongée dans le QR code |
| 25 – 30 s | E. Caisse : un scan, les points tombent | la confirmation s'étire en fenêtre d'envoi |
| 29,6 – 40,6 s | F. Notifications push : écran verrouillé, puis vague sur des centaines de téléphones | les téléphones deviennent des points qui rejoignent la boutique |
| 39,4 – 45 s | G. Proximité : la carte se rappelle au client qui passe | son tracé devient la courbe |
| 44,4 – 50 s | H. Statistiques en temps réel | plongée dans le dernier point |
| 50 – 58 s | I. Le point devient le logo, fidelyzapp.fr | |

## Son

- **Voix off** : `src/voix.json` liste les répliques, leur instant (`at`, en secondes), le texte affiché (`text`) et le texte prononcé (`say`, avec « Fidéliz » pour la bonne prononciation). `node scripts/voice.mjs` les génère avec la voix neuronale fr-FR « Rémy » (service de lecture de Microsoft Edge), un ton plus grave, puis les traite (coupe-bas, chaleur, présence, compression, niveau commun) dans `public/voix/vNN.wav`. Il note aussi l'instant de chaque mot, utilisé par la typographie animée.
  C'est une **voix témoin** : les conditions de ce service n'autorisent pas forcément la diffusion commerciale. Pour la version diffusée, déposer une voix professionnelle (comédien ou synthèse sous licence commerciale) dans `public/voix/brut/vNN.mp3` ou `.wav`, puis lancer `node scripts/voice.mjs --traiter` : même traitement, mêmes noms. Les mots resteront calés sur les instants de la voix témoin, à revoir si le débit change beaucoup.
- **Musique et bruitages** : `node scripts/music.mjs` compose par synthèse (aucun échantillon externe) une pop électronique à 120 BPM en la bémol majeur, avec deux montées (avant l'apparition de Fidelyz et avant la vague de notifications), dans `public/musique.wav` ; les quelques bruitages (déchirure, clics, bip de caisse, carillons de notification) sont dans `public/bruitages.wav`. La musique baisse automatiquement sous la voix (`src/Promo.jsx`).
- Rendu sans son : `npx remotion render Fidelyz out/muet.mp4 --props='{"son":false}'`.

## Où modifier

- `src/Promo.jsx` : ordre d'empilement des scènes, volumes
- `src/scenes/` : une scène par fichier ; les temps sont en secondes absolues, souvent calés sur un mot (`W('v05', 3)` = instant du 4e mot de la réplique v05)
- `src/lib.jsx` : couleurs, courbes d'animation, typographie cinétique (`Words`), fond (`Aurora`)
- `src/ui.jsx` : écrans de téléphone, carte papier, fenêtre d'envoi de notification
- `src/Pass.jsx` et `src/pass.css` : le pass, repris de `frontend/src/pages/Home.jsx`

## Version verticale (TikTok, Reels, Shorts)

34 s en 1080 × 1920, 128 BPM, tutoiement, accroche dès la première image. Tout est dans `src/tiktok/` (une scène par fichier, `kit.jsx` pour les légendes cinétiques et les effets d'impact).
Les légendes respectent les zones sûres de TikTok : rien d'important sous y = 1500 ni dans la colonne des boutons à droite.

| Temps | Scène | Raccord |
| --- | --- | --- |
| 0 – 3,8 s | 1. Carte papier géante, tampon « PERDUE » | la carte est balayée vers le haut, le téléphone monte du bas |
| 3,4 – 9,5 s | 2. Fidelyz, iPhone puis Android | les téléphones tombent, la carte jaillit |
| 9,4 – 13,3 s | 3. Logo, couleurs sur chaque temps, chrono de 2 minutes | la carte descend vers le scanner |
| 13 – 15,3 s | 4. Scan, les points montent dans le compteur | le tableau d'envoi monte du bas |
| 15 – 21,9 s | 5. Notifications push : envoi, écran verrouillé, vague sur des centaines de téléphones | les téléphones deviennent des points qui rejoignent la boutique |
| 21,4 – 24,5 s | 6. Un client passe, la carte se rappelle à lui | son trajet devient la courbe |
| 24,3 – 28,2 s | 7. Clients actifs, courbe | plongée dans le dernier point |
| 28 – 34 s | 8. Logo, « Lien en bio » | |

Son : `node scripts/music-tiktok.mjs` (musique et bruitages dans `public/musique-tiktok.wav` et `public/bruitages-tiktok.wav`).
Voix : répliques dans `src/voix-tiktok.json` (identifiants `t01` à `t13`). `node scripts/voice.mjs --set=tiktok` génère une voix témoin ; pour la vraie voix, générer les phrases de `voix-tiktok-a-generer.txt`, déposer `t01.mp3` … `t13.mp3` dans `public/voix/brut/`, puis `node scripts/voice.mjs --set=tiktok --traiter --estimer`. Les instants de départ de chaque réplique (`at`) sont à revoir si la durée des phrases change beaucoup.

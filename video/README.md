# Vidéo promotionnelle Fidelyz

Spot de 58 s en 16:9 (1920 × 1080, 30 i/s), codé avec Remotion à partir des vrais composants du site (pass Wallet, caisse, notifications).
Rythme : 120 BPM (une mesure = 2 s). Les textes à l'écran apparaissent mot par mot, au moment où la voix les prononce.

```bash
npm install
npm run studio    # prévisualisation et réglages image par image
npm run render    # encode out/fidelyz-promo.mp4 (version horizontale, 16:9)
npm run render:tiktok   # encode out/fidelyz-tiktok.mp4 (version verticale, 9:16)
npm run render:explication   # encode out/fidelyz-explication.mp4 (vidéo explicative verticale, sans musique)
npm run stills -- 90 600 1500                 # images fixes (numéros d'image)
npm run stills -- --planche 0.5 3.2 8.4 ...   # planches de 20 vignettes (temps en secondes)
npm run stills -- --planche --vertical 0.5 3.2 ...   # idem pour la version verticale (24 vignettes)
npm run stills -- --planche --explication 0.5 3.2 ...   # idem pour la vidéo explicative
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

34 s en 1080 × 1920, calée sur une musique à 150 BPM, tutoiement, accroche dès la première image. Tout est dans `src/tiktok/` (une scène par fichier, `kit.jsx` pour les légendes cinétiques et les effets d'impact).
Les légendes respectent les zones sûres de TikTok : rien d'important sous y = 1500 ni dans la colonne des boutons à droite.

| Temps | Scène | Raccord |
| --- | --- | --- |
| 0 – 4 s | 1. Carte papier géante, tampon « PERDUE » | la carte est balayée vers le haut, le téléphone monte du bas |
| 3,6 – 9,5 s | 2. Fidelyz, iPhone puis Android | les téléphones tombent, la carte jaillit |
| 9,4 – 13,3 s | 3. Logo, couleurs sur chaque temps, chrono de 2 minutes | la carte descend vers le scanner |
| 13 – 15,3 s | 4. Scan, les points montent dans le compteur | le tableau d'envoi monte du bas |
| 15 – 21,9 s | 5. Notifications push : envoi, écran verrouillé, vague sur des centaines de téléphones | les téléphones deviennent des points qui rejoignent la boutique |
| 21,4 – 24,5 s | 6. Un client passe, la carte se rappelle à lui | son trajet devient la courbe |
| 24,3 – 28,2 s | 7. Clients actifs, courbe | plongée dans le dernier point |
| 28 – 34 s | 8. Logo, « Lien en bio » | |

Son : musique et bruitages Pixabay dans `public/sons_tiktok/` (liste et liens dans `SOURCES.md` ; fichiers non versionnés). `node scripts/mix-tiktok.mjs` monte la musique sur ses premiers temps de mesure pour que ses drops tombent sur l'arrivée de la carte, sur « push » et sur le logo, place les bruitages, baisse la musique sous la voix (environ 10 dB) et amène l'ensemble à −14 LUFS dans `public/sons_tiktok/mix.wav`. `node scripts/analyse-musique.mjs <fichier>` donne le tempo et les drops d'un autre morceau ; la grille d'image correspondante est dans `src/tiktok/rythme.js`.
Voix : répliques dans `src/voix-tiktok.json` (identifiants `t01` à `t13`). `node scripts/voice.mjs --set=tiktok` génère une voix témoin ; pour la vraie voix, générer les phrases de `voix-tiktok-a-generer.txt`, déposer `t01.mp3` … `t13.mp3` dans `public/voix/brut/`, puis `node scripts/voice.mjs --set=tiktok --traiter --estimer`. Les instants de départ de chaque réplique (`at`) sont à revoir si la durée des phrases change beaucoup.

## Vidéo explicative (TikTok)

53,5 s en 1080 × 1920 pour faire comprendre l'offre à un commerçant : problème, solution, trois étapes, puis les deux leviers pour faire revenir les clients. Tout est dans `src/explication/`.

| Temps | Plan | Coupe vers le suivant |
| --- | --- | --- |
| 0 – 2,8 s | Accroche : la carte papier en 3D se déchire sur « perdre » | glitch |
| 2,8 – 6,4 s | OUBLIÉE, PERDUE, JETÉE : trois plans sur les temps | zoom |
| 6,4 – 11,2 s | Les clients s'effacent ; il en reste un, sans visage | — |
| 11,2 – 12,8 s | Le « ? » aspire la lumière et éclate sur le drop : Fidelyz | plongée dans le logo |
| 12,8 – 16,4 s | La carte arrive en tournoyant et se range dans le téléphone | fouet |
| 16,4 – 20,8 s | Éventail des cartes Wallet, Apple et Google ; « 0 téléchargement » | glitch |
| 20,8 – 22,8 s | 1, 2, 3 sur trois temps | ouverture depuis le « 1 » |
| 22,8 – 27,2 s | 1. L'aperçu de la carte sort du téléphone, logo, quatre couleurs, 5 min | volet bleu |
| 27,2 – 32,4 s | 2. Le QR code file vers le téléphone du client, inscription, carte ajoutée | volet bleu |
| 32,4 – 38,6 s | 3. La fenêtre d'ajout de points sort du téléphone, +20, la carte passe à 480 | zoom |
| 38,6 – 43,2 s | Campagne : le formulaire sort, s'écrit, part ; écran verrouillé | montée |
| 43,2 – 46,8 s | Carte du quartier en 3D : « Maison Lumière est à 50 m » | éclair |
| 46,8 – 53,5 s | Gratuit jusqu'à 15 clients, sans engagement, lien en bio | |

**Montage** (`src/explication/fx.jsx`) : toutes les coupes tombent sur un temps de la musique (`beat(n)` = drop sur « Fidelyz » + n × 0,4 s), l'image pulse sur la grosse caisse, le décor (sol quadrillé, poussières, lueurs rouges puis bleues) défile en continu, et l'élément important de chaque écran sort du téléphone (`PageCrop`).

**Son** : `node scripts/mix-explication.mjs` → `public/explication/mix.wav`. Voix Paul K, musique Pixabay recoupée pour que le drop tombe sur « Fidelyz », très en retrait (environ 15 dB sous la voix), six bruitages seulement, tous différents. Niveau final −14 LUFS.

**Fidèle au vrai site** :
- les écrans du tableau de bord et la page d'inscription sont des captures du frontend lancé en local avec des données de démonstration (`scripts/ecrans/` : faux serveur d'API, données, script de capture ; marche à suivre en tête de `capture.mjs`). Les images sont dans `public/explication/ecrans/`, la position des boutons et des champs dans `src/explication/rects.json` ;
- la carte, la pile Wallet, l'écran verrouillé et la carte du quartier reprennent les composants et les styles de la page d'accueil (`Pass.jsx`, `src/explication/site.jsx` et `site.css`) ;
- les textes affichés reprennent ceux du site et du serveur (« Points ajoutés ! », « Notification envoyée à 164 client(s) », « +20 points. Plus que 20 avant votre café. », offre gratuite jusqu'à 15 clients).

**Voix** : répliques dans `src/voix-explication.json` (`e01` à `e13`). `node scripts/voice-elevenlabs.mjs --set=explication` régénère la voix ElevenLabs (vitesse réglable : `ELEVENLABS_SPEED=1.12`), avec l'instant de chaque mot ; les animations sont calées sur ces mots (`W('e10', 5)`). Si les durées changent, revoir les instants `at` des répliques puis relancer `mix-explication.mjs`.

## Trois TikToks en 3D (`src/tt/`)

Trois vidéos verticales (1080 × 1920) qui ne se ressemblent ni dans le ton, ni dans le texte, ni dans le mouvement. La 3D est rendue en WebGL avec three.js (`@remotion/three`, `@react-three/drei`, `@react-three/postprocessing`) : rendre avec `--gl=angle`.

| Vidéo | Genre | Voix ElevenLabs | Musique | Durée |
| --- | --- | --- | --- | --- |
| `BandeAnnonce` → `tt-1-bande-annonce.mp4` | Bande-annonce de film : la carte papier, héroïne tragique, prend sa retraite | François Louis (grave) | trailer épique | 40 s |
| `Keynote` → `tt-2-keynote.mp4` | Présentation produit, studio blanc, un seul plan-séquence | Victoria (posée) | électro minimale | 28 s |
| `Concurrent` → `tt-3-concurrent.mp4` | Liste rapide « 3 trucs », jouets en pâte, couleurs saturées | Corentin (énergique) | phonk | 24,4 s |
| `Noir` → `tt-4-noir.mp4` | Laque noire, rythme lent, chaque transition est un morphing liquide (goutte → téléphone → carte → chiffres → logo) | Hugo (grave) | deep house | 24 s |
| `Chrono` → `tt-5-chrono.mp4` | Speedrun « chrono en main », laque noire + rubans LED, traînées de néon sur les coupes | Simon (rapide) | électro 126 BPM | 23 s |

**Accroches** : « Elle a survécu à trois machines à laver. » · « Regarde bien cette carte. Elle n'existe pas. » · « Ton concurrent vient de s'afficher sur l'écran de TES clients. »

**Fabrication**

```bash
node scripts/voice-elevenlabs.mjs --set=bandeannonce   # idem keynote, concurrent : voix et instants des mots
node scripts/textures-tt.mjs                           # textures 3D (pass, écran verrouillé, Wallet, carte papier…) → public/tt/tex/
npm run mix:tt                                         # bandes-son → public/tt/mix-<set>.wav (−14 LUFS)
npm run render:bande-annonce                           # puis render:keynote, render:concurrent
node scripts/stills-tt.mjs Keynote 2.5 9.2 17.6        # images de contrôle (out/stills/)
```

- Voix : `src/voix-<set>.json` (`aNN`, `kNN`, `cNN`). Une voix et des réglages par vidéo dans `PROFILS` (`scripts/voice-elevenlabs.mjs`). Si une réplique change de durée, revoir son `at` et les instants de `src/tt/<set>/temps.js`.
- Musique : chaque morceau est recoupé dans `scripts/mix-tt.mjs` pour que ses coups tombent sur l'image (`segments`) ; les bruitages y sont placés à la main (`sfx`). Sources et licences : `public/sons_tt/SOURCES.md`.
- `src/tt/laque.jsx` : laque noire (matériau, éclairage), morphing liquide entre formes (`Morph`), bassin à ondes, carte bancaire, ruban LED.
- `src/tt/formes/` : planches de propositions de formes (`Formes`, `Laque`), `node scripts/formes-tt.mjs`.
- `src/tt/kit3d.jsx` : carte Wallet et téléphone en 3D, texte extrudé (polices converties par `scripts/typeface-tt.mjs`), particules, matériau qui se consume, trajectoire de caméra continue.
- Chaque vidéo : `temps.js` (instants clés), `Scene3D.jsx` (la 3D, plan par plan), le composant principal (légendes, transitions, étalonnage, son).

### Dans le cloud (agent IA)

Rien de secret ni de lourd n'est dans le dépôt : l'agent reconstruit tout.

1. **Clé ElevenLabs** : variable d'environnement secrète `ELEVENLABS_API_KEY` dans les réglages de l'environnement cloud (jamais dans le dépôt, qui est public). Le script la lit quand il n'y a pas de `video/.env`. Les voix utilisées sont déjà ajoutées au compte ElevenLabs.
2. Puis, dans `video/` :

```bash
npm install
npm run sons:tt                                       # musiques et bruitages Pixabay → public/sons_tt/
npm run textures:tt                                   # textures 3D → public/tt/tex/
node scripts/voice-elevenlabs.mjs --set=noir          # voix d'une vidéo (bandeannonce, keynote, concurrent, noir, chrono)
node scripts/mix-tt.mjs noir                          # sa bande-son
npx remotion render Noir out/tt-4-noir.mp4 --gl=swangle --crf=16
```

Sans carte graphique (cas des serveurs cloud), rendre avec `--gl=swangle` (WebGL logiciel, plus lent) au lieu de `--gl=angle`.

## Série « Studio » : plan de lancement TikTok (`src/serie/`)

Huit vidéos verticales au même style (studio sombre, un seul bleu d'accent, Inter serrée, 3D, transitions en fondu flouté et balayage de lumière), une seule voix ElevenLabs (Paul K). Stratégie, ordre de publication et scripts : **`PLAN-TIKTOK.md`**.

| Ordre | Composition | Fichier | Durée |
| --- | --- | --- | --- |
| 1 | `SerieCartePerdue` | `out/serie-1-carte-perdue.mp4` | 23 s |
| 2 | `SerieEcran` | `out/serie-2-ecran.mp4` | 21,5 s |
| 3 | `SerieFilm` | `out/serie-3-film.mp4` | 25,7 s |
| 4 | `SerieVersus` | `out/serie-4-versus.mp4` | 21,7 s |
| 5 | `SerieEtapes` | `out/serie-5-etapes.mp4` | 27 s |
| 6 | `SerieProximite` | `out/serie-6-proximite.mp4` | 17,6 s |
| 7 | `SerieDesign` | `out/serie-7-design.mp4` | 14 s |
| 8 | `SeriePrix` | `out/serie-8-prix.mp4` | 15,9 s |

- `src/serie/kit.jsx` : kit commun (plans et transitions `Shot`, légendes calées sur la voix `Caption`, balayage `Sweep`, plan de fin `EndCard`, téléphone 3D iPhone/Android, pass, textures préchargées, captures d'écran longues vues dans un téléphone `screenTex`).
- Les écrans du tableau de bord sont les vraies captures de `public/explication/ecrans/` ; le pass, l'écran verrouillé et le Wallet sont les textures de `scripts/textures-tt.mjs`.
- Tous les instants sont calés sur les mots de la voix (`W('pa04', 2)` = 3ᵉ mot de la réplique pa04) : si une voix est régénérée, l'image suit.

```bash
node scripts/serie-scripts.mjs [set…]                 # (ré)écrit les répliques à partir des scripts (écrase src/voix-<set>.json)
node scripts/voice-elevenlabs.mjs --set=perdue        # voix (sets : perdue ecran film versus etapes geo design offre)
node scripts/serie-temps.mjs perdue                   # enchaîne les répliques
node scripts/mix-tt.mjs perdue                        # bande-son → public/tt/mix-perdue.wav (−14 LUFS)
node scripts/serie-planche.mjs SerieCartePerdue 0.5 3 6 9   # planche contact de contrôle
sh scripts/serie-render.sh SerieCartePerdue:serie-1-carte-perdue   # rendu (GL=angle avec une carte graphique)
```

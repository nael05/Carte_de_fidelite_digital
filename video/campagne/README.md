# Campagne TikTok / Reels / Shorts + film du site

Plan marketing : [`PLAN-MARKETING.md`](PLAN-MARKETING.md). Légendes prêtes à publier : [`LEGENDES.md`](LEGENDES.md).
Code des vidéos : `video/src/campagne/` (Remotion). Rendus : `video/out/campagne/` (non versionnés).

## Les vidéos

| N° | Composition | Fichier | Format | Idée | Accroche |
| --- | --- | --- | --- | --- | --- |
| 01 | `C-01-tour` | `01-tour-complet` | 9:16 | Le tour complet : carte papier → pass Wallet → Apple et Google → création → inscription → points → notification → statistiques | « Tes clients oublient ta carte de fidélité. » |
| 02 | `C-02-tampon` | `02-tampon-manquant` | 9:16 | Mise en scène : 9 tampons, la carte oubliée, le client va en face… on rembobine, cette fois avec Fidelyz | « Neuf tampons. Il lui en manquait un seul. » |
| 03 | `C-03-push` | `03-notifications-push` | 9:16 | Les notifications sur l'écran verrouillé (contre SMS et email), la vague sur tous les téléphones | « Et si ta boutique s'affichait sur l'écran de tes clients ? » |
| 04 | `C-04-creer` | `04-carte-en-2-minutes` | 9:16 | Studio blanc, chrono : la carte se construit pièce par pièce à côté du vrai écran « Ma carte » | « Je crée une carte de fidélité en deux minutes. Chrono. » |
| 05 | `C-05-papier` | `05-papier-contre-fidelyz` | 9:16 | Match en 3 rounds, écran partagé, K.O. | « Carte papier contre carte dans le téléphone. Round un. » |
| 06 | `C-06-client` | `06-dix-secondes-cote-client` | 9:16 | Un seul plan sur le téléphone du client : appareil photo → inscription → Wallet, chrono 10 s | « Ton client n'a rien à télécharger. Regarde. » |
| 07 | `C-07-proximite` | `07-rappel-de-proximite` | 9:16 | Plan du quartier en 3D, la carte apparaît quand le client passe ; le vrai réglage Géolocalisation | « Ton client passe devant ta boutique. » |
| 08 | `C-08-questions` | `08-trois-questions` | 9:16 | FAQ : application ? points ? prix ? Appel aux commentaires | « Les trois questions que les commerçants nous posent. » |
| 09 | `C-09-calcul` | `09-le-calcul` | 9:16 | Grands chiffres : 1 café/semaine × 50 × 3 € = 150 €, × 10 clients perdus = 1 500 € | « Combien te coûte un client qui ne revient pas ? » |
| 10 | `C-10-boulangerie` | `10-si-tas-une-boulangerie` | 9:16 | Série par métier : façade, carte aux couleurs du commerce, récompense, caisse et message adaptés (« Fournil Doré ») | « Si t'as une boulangerie, regarde ça. » |
| 11 | `C-11-coiffure` | `11-si-tas-un-salon-de-coiffure` | 9:16 | Même série, salon de coiffure (« Studio Élise ») | « Si t'as un salon de coiffure, regarde ça. » |
| 12 | `C-12-restaurant` | `12-si-tas-un-restaurant` | 9:16 | Même série, restaurant (« Chez Paolo ») | « Si t'as un restaurant, regarde ça. » |
| 13 | `C-13-portefeuille` | `13-pov-portefeuille` | 9:16 | Avalanche de cartes papier de toutes les boutiques, la tienne perdue au milieu ; puis toutes rangées dans le Wallet | « POV : le portefeuille de ton client. » |
| 14 | `C-14-barbier` | `14-si-tas-un-barber-shop` | 9:16 | Série par métier, barber shop (« Barbier Léon ») | « Si t'as un barber shop, regarde ça. » |
| 15 | `C-15-fleuriste` | `15-si-tes-fleuriste` | 9:16 | Série par métier, fleuriste (« Fleurs & Co ») | « Si t'es fleuriste, regarde ça. » |
| 16 | `C-16-institut` | `16-si-tas-un-institut-de-beaute` | 9:16 | Série par métier, institut de beauté (« Institut Iris ») | « Si t'as un institut de beauté, regarde ça. » |
| 17 | `C-17-astuces` | `17-trois-astuces` | 9:16 | Contenu utile : récompense atteignable, rappels sans spam, carte impossible à perdre ; Fidelyz en conclusion | « Trois astuces pour que tes clients reviennent. La troisième, presque personne ne la fait. » |
| 18 | `C-18-appli` | `18-le-mythe-de-lappli` | 9:16 | « Personne ne télécharge l'appli d'une boulangerie » : le Wallet est déjà sur le téléphone | « Tu veux créer une appli pour ta boutique ? Attends. » |
| — | `C-site-paysage` | `site-fidelyz-de-a-a-z-paysage` | 16:9 | Film du site (1 min 30, vouvoiement) : tout le parcours, de A à Z | — |
| — | `C-spot-paysage` | `spot-30s-paysage` | 16:9 | Spot de 25 s façon publicité, peu de mots, slogan « La fidélité, réinventée. » (haut de la page d'accueil, pré-diffusion YouTube) | — |

Chaque composition existe **avec voix** (`C-…`) et **sans voix** (`C-…-muet` : musique, bruitages et sous-titres animés).

## Réalisme

- **Écrans** : captures du **frontend actuel** lancé en local sur un faux serveur d'API (`scripts/campagne/`), en ×3 (mobile) et ×2 (bureau). Aucune ancienne capture n'est réutilisée.
- **Pass Apple Wallet** : même balisage que le site, style recopié de `frontend/src/pages/Home.css` (`scripts/campagne/carte-css.sh`) ; champs réels du pass (POINTS, BONJOUR, DÉTAILS DES RÉCOMPENSES).
- **Carte Google Wallet** : mise en page d'un programme de fidélité Google Wallet.
- **iOS** : écran verrouillé, notification d'un pass, feuille « Ajouter », appli Cartes, appareil photo, barre Safari.

## Refaire les captures

```bash
cd video
node scripts/campagne/data.mjs && node scripts/campagne/server.mjs &          # faux serveur d'API (port 5056)
(cd ../frontend && VITE_API_URL=http://localhost:5056/api npx vite --port 3100 &)
NODE_PATH=$(npm root -g) node scripts/campagne/capture.cjs mobile               # puis : desktop
# série par métier : écrans au nom d'un autre commerce
NODE_PATH=$(npm root -g) node scripts/campagne/capture-metier.cjs boulangerie "Fournil Doré" "Les croissants sortent du four 🥐" "Ils sont encore chauds : venez vite, votre carte vous attend." "#dcc39d" "#2b1f12" "#7a5530"
```
Nouveau métier : ajouter son entrée dans `METIERS` (`src/campagne/metier/Metier.jsx`), ses textes dans `textes.json`, et une ligne dans `Compositions.jsx`.

## Voix (ElevenLabs, voix d'homme)

Textes : `src/campagne/textes.json` (une réplique = une ligne ; `say` = prononciation, « Fidéliz »).
Voix par vidéo (toutes masculines, réglées pour l'intonation : stabilité basse, style élevé) dans `scripts/campagne/voix.mjs` : Paul (film du site), Corentin (énergique), Hugo (narration), François (grave), Simon (rapide).

```bash
NODE_USE_ENV_PROXY=1 node scripts/campagne/voix.mjs --toutes      # ou : … voix.mjs tour
```

Le script écrit `public/campagne/voix/<id>.mp3` et `src/campagne/voix-data.json` (durée et instant de chaque mot).
**La timeline de chaque vidéo se recale toute seule sur la vraie durée des voix** : il suffit de relancer les rendus.
Clé : jamais dans le dépôt (secret réseau de l'environnement cloud, ou `video/.env` en local).

## Couvertures

`scripts/campagne/couvertures.sh` (ou `… couvertures.sh 04 09`) → `out/campagne/couvertures/NN.jpg` : une image de la vidéo, un voile et un titre court, centré pour rester visible dans la grille Instagram (4:5). Titres et instants dans `src/campagne/Couverture.jsx` et `couvertures-liste.mjs`.

## Rendu

```bash
scripts/campagne/rendu.sh C-01-tour out/campagne/01-tour-complet.mp4          # avec voix
scripts/campagne/rendu.sh C-01-tour-muet out/campagne/01-tour-complet-sans-voix.mp4
scripts/campagne/stills.sh C-01-tour-muet 0.5 3 8 12                            # planche d'images de contrôle
```

Le son est normalisé à −14 LUFS (standard TikTok/Reels). Sans carte graphique, un rendu prend environ 6 à 10 min par vidéo :
lancer deux rendus en parallèle (chacun a son propre processus graphique).

## Musique et bruitages

Pixabay (licence commerciale), téléchargés par `npm run sons:tt` : voir `public/sons_tt/SOURCES.md`.
Musiques : « Minimal Technology » (01, 04, 09, site), « Deep Bass House » (02, 06, 07), « Fashion Electro » (03, 05, 08).

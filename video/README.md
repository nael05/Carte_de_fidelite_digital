# Vidéo promotionnelle Fidelyz

Spot de 90 s en 16:9 (1920 × 1080, 30 i/s), codé avec Remotion à partir des vrais composants du site (pass Wallet, studio, espace pro).
Le découpage suit le document de conception : 8 scènes, une transition signature par scène.

```bash
npm install
npm run studio    # prévisualisation et réglages image par image
npm run render    # encode out/fidelyz-promo.mp4
npm run stills -- 90 600 1500   # images fixes de contrôle dans out/stills
```

## Son

- **Voix off** : `src/voix.json` liste les répliques et leur instant (en secondes). `node scripts/voice.mjs` les génère dans `public/voix/` avec la voix neuronale fr-FR « Henri » du service de lecture de Microsoft Edge. C'est une **voix témoin** : pour la diffusion, enregistrer une voix professionnelle (ou un service de synthèse sous licence commerciale), déposer les fichiers aux mêmes noms (`v01.mp3`…), puis lancer `node scripts/voice.mjs --durees`.
- **Musique et bruitages** : `node scripts/music.mjs` les compose par synthèse (aucun échantillon externe) dans `public/musique.wav` et `public/bruitages.wav`. La musique baisse automatiquement sous la voix (`src/Promo.jsx`).
- Rendu sans son : `npx remotion render Fidelyz out/muet.mp4 --props='{"son":false}'`.

## Où modifier

- `src/Promo.jsx` : ordre et début de chaque scène
- `src/scenes/` : une scène par fichier, temps en images (30 = 1 s)
- `src/lib.jsx` : couleurs, courbes d'animation, textes animés
- `src/Pass.jsx` et `src/pass.css` : le pass, repris de `frontend/src/pages/Home.jsx`

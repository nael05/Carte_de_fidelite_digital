# 05 — Plan marketing de lancement (90 jours, TikTok au centre)

> Rôle : responsable marketing du conseil. Période : **lundi 30 novembre 2026 → dimanche 28 février 2027** (13 semaines).
> Cible : les **commerçants indépendants** (pas les consommateurs). Ton TikTok : **tutoiement**, direct, concret, comme dans `video/voix-tiktok-a-generer.txt`. Ton site / e-mail : vouvoiement, comme `frontend/src/pages/Home.jsx`.

---

## 0. Résumé en 10 lignes

1. TikTok sert à **créer la demande et la confiance** ; la vente se fait surtout par **démo en boutique** et par **messages privés** (TikTok + Instagram).
2. Promesse unique : **« Ta carte de fidélité dans le téléphone de tes clients. Zéro carte perdue, zéro appli. »**
3. Le levier qui fait « waouh » et que personne ne montre : **la notification sur l'écran verrouillé** du client. On la montre en direct dans presque toutes les vidéos.
4. Série phare : **« Je démarche 100 commerçants pour ma start-up »** (épisodes numérotés, face caméra + terrain).
5. Rythme : **1 vidéo par jour** les 4 premières semaines (5 à 7 / semaine) + **2 carrousels / semaine**.
6. Offre d'appel : **Gratuit (15 clients)** pour essayer, code **TIKTOK = 1 mois Pro offert** pour passer à 19 € TTC.
7. TikTok Ads seulement à partir de la semaine 5, en **Spark Ads** sur les meilleures vidéos organiques (budget test 450 €).
8. Objectifs à J90 : **120 comptes créés, 60 activés (≥ 5 clients avec la carte), 25 payants (≈ 550 € de revenu mensuel)**.
9. Avant la première vidéo : page démo, liens traqués, codes promo, nettoyage des chiffres non vérifiés du site (voir §2).
10. On pivote sur des seuils chiffrés (voir §15), pas au ressenti.

---

## 1. Cibles

### 1.1 Segments prioritaires (dans cet ordre)

| Rang | Segment | Pourquoi | Où ils sont | Douleur n° 1 |
|---|---|---|---|---|
| 1 | **Coiffeurs / barbiers** | Clientèle récurrente (4–8 semaines), panier 20–40 €, déjà fans de réseaux sociaux | Instagram > TikTok | Le client « infidèle » qui va chez le barbier d'à côté |
| 2 | **Onglerie / esthétique** | Rendez-vous récurrents, clientèle 18–40 ans **qui a Apple Wallet** | Instagram, TikTok | Remplissage des créneaux creux |
| 3 | **Boulangeries / pâtisseries** | Passage quotidien, cartes papier omniprésentes, pic galette des rois en janvier | Facebook, bouche-à-oreille, TikTok (artisans) | Cartes tamponnées perdues, triche aux tampons |
| 4 | **Cafés / coffee shops / snacking** | Fréquence très élevée, clientèle jeune | Instagram, TikTok | Concurrence des chaînes avec appli (Starbucks, etc.) |
| 5 | **Restaurants (midi, bistrots)** | Clients du midi récurrents | Instagram, Google | Le creux du mardi/mercredi |

Secondaires (ne pas viser activement, accepter s'ils viennent) : fleuristes (pic Saint-Valentin), cavistes, épiceries fines, pressings, instituts.

### 1.2 Personas

- **Karim, 31 ans, barbier, 1 salon + 1 employé.** Poste ses dégradés sur TikTok. Veut « faire pro ». Sensible au style de la carte (noir/graphite, son logo). Décide seul, paie à la carte bancaire. Message : *« Ta carte de fidélité aussi stylée que tes coupes. »*
- **Sandrine, 46 ans, boulangère.** Peu de temps, méfiante envers les « applis ». Ne regarde pas TikTok pour le travail mais tombe dessus le soir. Message : *« Tes clients n'installent rien. Toi, tu scannes, c'est tout. »* Arguments : simplicité, 0 € pour commencer, sans engagement.
- **Léa, 27 ans, prothésiste ongulaire, en salon ou à domicile.** Très active sur Instagram. Message : *« Rappelle tes clientes quand tu as un créneau libre — directement sur leur écran. »*
- **Le gérant multi-sites (Business 39 €)** : 2 à 10 boutiques, comptes caissiers. Cible secondaire au J60+, via LinkedIn et terrain.

### 1.3 Ce qu'on NE fait pas

- Pas de contenu pour les consommateurs (« ajoute ta carte ») sur le compte Fidelyz : ça attire la mauvaise audience et brouille l'algorithme. Les consommateurs, ce sont les commerçants qui les convainquent en caisse.
- Pas de jargon : on ne dit pas « SaaS », « pass .pkpass », « APNs », « multi-tenant ». On dit « carte », « téléphone », « notification », « points ».

---

## 2. À préparer côté produit AVANT la première vidéo (semaine 0)

Ce sont des demandes au conseil produit/tech ; aucun code n'est modifié par ce plan.

| # | Élément | Détail | Priorité |
|---|---|---|---|
| P1 | **Commerce de démo « Fidelyz Café »** | Un vrai compte entreprise avec une carte jolie (logo, couleurs), récompense « café offert à 100 pts ». Lien public `/join/<id>` + QR code. Sert à **toutes** les démos (TikTok, boutique, salon). Le fondateur ajoute la carte sur un iPhone ET un Android de démo. | Bloquant |
| P2 | **Page `/demo`** (ou `fidelyzapp.fr/demo`) | Une page courte : vidéo explicative (composition `Explication`), bouton « Essaie la carte de démo dans ton Wallet » (→ lien P1), bouton « Créer ma carte gratuitement ». C'est la **page du lien en bio**. | Bloquant |
| P3 | **Liens d'inscription traqués** | `/pro/signup?utm_source=tiktok&utm_medium=bio&utm_campaign=lancement` (et `instagram`, `terrain`, `gbp`, `email`, `ads`). Il faut **enregistrer la source** au moment de la création du compte (colonnes `utm_source`/`utm_campaign` sur `entreprises` ou table dédiée), sinon on ne saura jamais ce que rapporte TikTok. Ajouter aussi une question à l'inscription : « Comment nous avez-vous connus ? » (liste : TikTok, Instagram, passage en boutique, Google, bouche-à-oreille, autre). | Bloquant |
| P4 | **Codes promo** | Le produit sait déjà créer des codes Stripe depuis l'admin (`adminPromoController.js`) et les valider à l'inscription (`ProSignup.jsx`). À créer : **TIKTOK** (1 mois Pro offert), **INSTA** (idem), **TERRAIN** (1 mois offert, pour la prospection), **NOEL26** (−30 % 3 mois, jusqu'au 31/12). Un code distinct par canal = mesure d'attribution de secours. | Bloquant |
| P5 | **Pré-remplir le code depuis l'URL** | Aujourd'hui le champ code promo de `ProSignup.jsx` démarre vide. Demander : `?promo=TIKTOK` pré-remplit et valide le code. Lien bio final : `fidelyzapp.fr/pro/signup?tier=pro&promo=TIKTOK&utm_source=tiktok`. | Haute |
| P6 | **Redirections courtes** | `fidelyzapp.fr/tiktok`, `/insta`, `/demo`, `/terrain` → URLs traquées. Faciles à dire à l'oral (« fidelyzapp point fr slash tiktok »). | Haute |
| P7 | **Vérifier les chiffres du site** | `Home.jsx` affiche « 2 400+ cartes actives », « 98 % de clients satisfaits », « +38 % de visites récurrentes ». **Au lancement ces chiffres ne sont pas étayés** : ne jamais les reprendre dans une vidéo ou une pub, et les retirer/remplacer sur le site avant d'y envoyer du trafic payant (risque de pratique commerciale trompeuse, et un commentaire « source ? » sous une vidéo virale détruit la crédibilité). Remplacer par des faits vérifiables : « 5 min pour lancer sa carte », « 0 appli à installer », « 15 clients gratuits ». | Bloquant pour les Ads |
| P8 | **Section « Le film »** du site | Affiche « Bientôt disponible ». Y mettre la vidéo explicative existante. | Moyenne |
| P9 | **Pixel TikTok + événement « inscription »** | Pour optimiser les Ads sur les inscriptions (semaine 5). Nécessite le **consentement cookies** (bandeau CNIL) ; sinon se contenter des UTM. | Avant S5 |
| P10 | **Kit PLV imprimable** | Généré depuis l'espace pro : chevalet A6 « Votre carte de fidélité est dans votre téléphone — scannez » avec le QR du commerce. Activer un commerçant = lui faire afficher ce QR. | Haute |
| P11 | **Parrainage** | N'existe pas dans le produit. Phase 1 (manuelle) : un code Stripe par commerçant parrain (`PARRAIN-<BOUTIQUE>`), crédit d'un mois appliqué à la main au parrain. Phase 2 (J60+) : lien de parrainage dans l'espace pro. Voir §12. | Moyenne |
| P12 | **Voix off sous licence** | Le `video/README.md` précise que la voix « témoin » (Edge) n'est pas forcément autorisée en diffusion commerciale : **publier uniquement avec la voix ElevenLabs sous offre payante** (ou la voix du fondateur). Musiques Pixabay : OK, garder `SOURCES.md`. | Bloquant pour les vidéos Remotion |

Rappel des règles produit à ne **jamais** sur-promettre dans le contenu :
- Notifications promotionnelles : **offres payantes uniquement**, **1 par jour et par commerce**, **pas entre 21 h et 8 h** (`PUSH_RULES` dans `backend/utils/plans.js`). L'offre gratuite n'envoie pas de campagne → c'est l'argument d'upgrade.
- Géolocalisation : la carte **remonte sur l'écran verrouillé** quand le client est près de la boutique (Apple Wallet) ; on ne dit pas « on envoie une notification à tous les passants ». Google Wallet a un comportement plus limité : montrer l'iPhone pour ce point.
- Offre gratuite : **15 clients**, pas « illimité ».

---

## 3. Compte TikTok : réglages, bio, lien

- **Type de compte : Compte Entreprise** (Paramètres → Compte → Passer à un compte Entreprise, catégorie « Logiciel / Services aux entreprises »). Avantages : statistiques, lien cliquable dans la bio, Spark Ads. Contrainte : **musiques limitées à la bibliothèque commerciale (CML)** — c'est la règle, on la respecte (une vidéo promotionnelle sur un son non licencié peut être rendue muette).
  Si le lien cliquable n'apparaît pas encore dans les paramètres, mettre l'URL courte en texte dans la bio et l'épingler dans les commentaires.
- **Nom d'utilisateur** : `@fidelyz` (sinon `@fidelyzapp`, cohérent avec le domaine). Même nom sur Instagram.
- **Nom affiché** : `Fidelyz | Carte de fidélité Wallet`  (le nom affiché est indexé par la recherche TikTok).
- **Photo** : logo `video/public/logo-fidelyz.png` sur fond sombre, ou visage du fondateur si on mise tout sur le face caméra (recommandé dès que la série démarre : les gens suivent une personne, pas un logo).
- **Bio (80 caractères max)** — 3 variantes à tester 3 semaines chacune :
  - A : `Ta carte de fidélité dans le Wallet de tes clients 📲 Gratuit pour démarrer ⬇️`
  - B : `Fondateur. Je démarche 100 commerçants. Carte fidélité Apple/Google Wallet ⬇️`
  - C : `Commerçant ? Fini la carte papier. 1 mois Pro offert : code TIKTOK ⬇️`
- **Lien en bio** : `fidelyzapp.fr/tiktok` → page `/demo` (P2) avec UTM `utm_source=tiktok&utm_medium=bio`. **Un seul lien** (pas de Linktree : une étape de plus = des clics perdus).
- **Vidéos épinglées (3)** : 1) la vidéo explicative (composition `Explication`, 53 s) ; 2) l'épisode 1 de « Je démarche 100 commerçants » ; 3) la meilleure démo « notification en direct ».
- **Playlists** (dès 6 vidéos par thème) : « 100 commerçants », « Tutos 2 minutes », « Astuces fidélité », « Coulisses ».
- Activer les **messages privés** pour tout le monde + réponse automatique : *« Salut ! Tu as un commerce ? Dis-moi lequel et ta ville, je te montre ta future carte en vidéo 🙂 »*.

---

## 4. Piliers de contenu

| Pilier | Part | Objectif | Exemples |
|---|---|---|---|
| **P1. La douleur (carte papier)** | 20 % | Arrêter le pouce, faire hocher la tête | Carte déchirée, tampons trichés, « j'ai oublié ma carte » |
| **P2. La démo « waouh »** | 25 % | Montrer le produit en 20 s : carte qui s'ajoute, scan, notif sur écran verrouillé | Tuto 2 min, notif en direct, géoloc |
| **P3. Terrain — « Je démarche 100 commerçants »** | 25 % | Histoire, preuve sociale, attachement au fondateur | Pitch en boutique, refus, oui, « 1 semaine après » |
| **P4. Conseils business pour commerçants** | 20 % | Valeur gratuite → abonnés qualifiés, partages entre commerçants | « 3 erreurs de carte de fidélité », « comment remplir ton mardi » |
| **P5. Coulisses du fondateur (build in public)** | 10 % | Authenticité, commentaires, communauté | Chiffres réels, bug du jour, « j'ai gagné mon 10e client » |

Règle de séries : chaque vidéo de P3 porte un numéro (« Commerçant n° 7/100 ») → les gens reviennent voir la suite et parcourent le profil.

---

## 5. Format « face caméra » du fondateur (le cœur du compte)

**Pourquoi** : sur TikTok, un fondateur qui se filme bat n'importe quelle vidéo de marque. Les commerçants achètent à quelqu'un qu'ils ont l'impression de connaître.

**Règles de tournage**
- Téléphone à hauteur des yeux, **9:16**, lumière face fenêtre, micro-cravate sans fil (≈ 30 €) — le son compte plus que l'image.
- **Premier mot dans les 0,3 premières seconde.** Pas de « Salut tout le monde », pas de logo d'intro.
- Accroche écrite à l'écran **en même temps** que dite (gros texte blanc, contour noir, en haut du tiers central — rien sous y = 1500 px ni dans la colonne des boutons à droite, comme dans les vidéos Remotion).
- Durée : **20–40 s** pour la portée, **45–75 s** pour les tutos/storytime. Une coupe toutes les 2–3 s (jump cut).
- Sous-titres incrustés (80 % regardent sans le son au travail… ou en boutique).
- **Toujours un plan téléphone** (B-roll) : la carte dans le Wallet, l'écran verrouillé avec la notif. Filmer l'écran avec un 2e téléphone ou capture d'écran enregistrée.
- Fin : CTA oral **et** écrit, puis **boucle** (la dernière phrase relance la première quand c'est possible).
- Tenue identique reconnaissable (ex. sweat bleu Fidelyz) = signature visuelle.

**Structure type 30 s (« PAS + démo »)**
1. 0–2 s : accroche (question ou affirmation qui pique).
2. 2–8 s : le problème, avec un exemple vécu.
3. 8–22 s : la démo à l'écran (carte, scan, notif).
4. 22–27 s : le chiffre / le résultat concret.
5. 27–30 s : CTA (« Commente ton métier », « lien en bio », « code TIKTOK »).

**Banque d'accroches réutilisables**
- « Ta carte de fidélité en papier, tes clients l'ont déjà perdue. »
- « Si t'as un commerce, regarde ce qui s'affiche sur l'écran de ton client. »
- « Le truc que Starbucks fait et que ta boulangerie peut faire gratuitement. »
- « J'ai démarché X commerçants aujourd'hui. Y m'ont dit non. Voilà pourquoi. »
- « Arrête de tamponner des cartes. »
- « Ce barbier ne savait pas que c'était possible. »
- « 3 erreurs qui font que tes clients ne reviennent pas. »

---

## 6. 30 idées de vidéos

Légende : **Accroche** = ce qui est dit + écrit dans les 2 premières secondes. **Durée** cible. **Son** = type de son (toujours pris dans la bibliothèque commerciale TikTok ou son original). Hashtags : 3 à 5 par vidéo, toujours 1 large + 1 métier + 1 niche.

### Pilier 1 — La douleur

**V01 — « La carte papier, autopsie »** (25 s, Remotion `Tiktok` existante, 34 s)
- Accroche : « Ta carte de fidélité en papier ? Tes clients l'ont déjà perdue. »
- Script : vidéo existante (`npm run render:tiktok`) avec voix sous licence (P12). Publier telle quelle en vidéo n° 1.
- CTA : « Lien en bio, c'est gratuit pour commencer. »
- Son : la piste mixée de la vidéo (Pixabay, licence OK).
- #commerçant #cartedefidelite #commercelocal #applewallet #pourtoi

**V02 — « Ce que contient le portefeuille de tes clients »** (20 s)
- Accroche : (on vide un portefeuille sur la table) « 9 cartes de fidélité. Il en utilise zéro. »
- Script : on étale les cartes papier froissées, tickets, cartes plastique. « Il a oublié la tienne à la maison. Comme d'hab. » Cut : iPhone, Wallet, la pile de cartes Fidelyz. « Là, il l'a toujours sur lui. »
- CTA : « T'as un commerce ? Commente ton métier, je te montre ta carte. »
- Son : son tendance « oups / malaise » (CML), puis transition « bass drop ».
- #commerçant #petitcommerce #fidelisation #astuce

**V03 — « La triche au tampon »** (25 s, sketch)
- Accroche : « Ton client a un tampon dans la poche. Ta carte de fidélité ne vaut plus rien. »
- Script : sketch : un client sort un tampon acheté sur internet et remplit sa carte. Le commerçant (le fondateur déguisé) découvre. « Avec une carte dans le Wallet, les points ne s'ajoutent qu'au scan en caisse. Impossible de tricher. »
- CTA : « Partage à un commerçant qui tamponne encore. »
- Son : musique de film d'espionnage (CML).
- #boulangerie #commerçant #humour #fidelisation

**V04 — « J'ai compté les cartes perdues »** (30 s, face caméra)
- Accroche : « J'ai demandé à 10 commerçants combien de cartes ils imprimaient par an. »
- Script : réponses réelles collectées sur le terrain (ne citer que des chiffres effectivement entendus, à l'écran « réponse de Sandrine, boulangère à … »). Coût impression vs 0 € de départ.
- CTA : « Et toi, tu en imprimes combien ? Commente. »
- Son : beat lo-fi discret.
- #commerçant #entrepreneur #tpe #boulangerie

**V05 — « POV : t'es la carte de fidélité papier »** (15 s, trend POV)
- Accroche : « POV : t'es une carte de fidélité en papier. »
- Script : caméra subjective : rangée dans un portefeuille, passée à la machine à laver, oubliée dans une veste, jetée. Fin : « Remplacée par une carte Wallet. RIP. »
- CTA : texte « Lien en bio pour la remplacer ».
- Son : son dramatique / triste tendance (CML).
- #pov #commerçant #humour #cartedefidelite

**V06 — « Le client qui a 9 tampons sur 10 »** (20 s, storytime)
- Accroche : « Il avait 9 tampons sur 10. Il a perdu la carte. Il n'est jamais revenu. »
- Script : histoire racontée par un commerçant (terrain) ou par le fondateur. Morale : la carte perdue = client perdu. Démo : la carte dans le Wallet ne se perd pas, et quand il manque 1 point, la notif le rappelle.
- CTA : « Lien en bio. »
- #storytime #commerçant #coiffeur #fidelisation

### Pilier 2 — Démo « waouh »

**V07 — « Je t'envoie une notif en direct »** (30 s) — **vidéo cœur, à décliner**
- Accroche : « Regarde ce qui s'affiche sur l'écran de ton client quand tu appuies ici. »
- Script : écran partagé : à gauche l'espace pro (taper le message « Croissant offert ce matin pour tout café acheté »), à droite l'iPhone verrouillé du client. Envoi → la notification arrive. « Pas de SMS, pas d'appli. Juste sa carte de fidélité. »
- CTA : « Tu veux la même ? Lien en bio, code TIKTOK. »
- Son : son « ding » + beat montant (CML).
- #commerçant #notification #applewallet #marketinglocal

**V08 — « Créer sa carte en 2 minutes, chrono »** (60 s, Remotion `Chrono` en intro + capture d'écran réelle)
- Accroche : « Je crée une carte de fidélité pour un barbier. Chrono : 2 minutes. »
- Script : chrono à l'écran, capture du studio (`CardCustomizer`) : logo, couleur, paliers, QR. Ajout dans le Wallet. Arrêt du chrono.
- CTA : « Fais pareil, c'est gratuit jusqu'à 15 clients. »
- Son : tic-tac + beat rapide (CML).
- #tuto #barbier #commerçant #applewallet

**V09 — « iPhone ET Android »** (20 s)
- Accroche : « "Mes clients sont sur Android." Pas de souci. »
- Script : deux téléphones côte à côte, même QR scanné, la carte arrive dans Apple Wallet et dans Google Wallet.
- CTA : « Commente "ANDROID" si tu croyais que c'était que pour iPhone. »
- #android #iphone #commerçant #googlewallet

**V10 — « Le scan en caisse, version ASMR »** (15 s)
- Accroche : (gros plan, aucun mot, juste le bip) texte : « Le bruit le plus satisfaisant pour un commerçant. »
- Script : scan de la carte, « +10 points », la carte se met à jour sur le téléphone du client. Plusieurs scans en boucle.
- CTA : texte « Lien en bio ».
- Son : son original (bip caisse, `public/bruitages.wav`), pas de musique.
- #asmr #satisfaisant #commerçant #caisse

**V11 — « La carte qui se rappelle toute seule »** (25 s, géoloc)
- Accroche : « Ton client passe devant ta boutique. Regarde son écran. »
- Script : filmer en marchant vers une boutique partenaire, l'iPhone verrouillé affiche la carte Fidelyz en suggestion. Expliquer honnêtement : « La carte remonte sur son écran quand il est à côté. »
- CTA : « Lien en bio. »
- #commercelocal #geolocalisation #iphone #commerçant

**V12 — « 0 appli à télécharger »** (20 s, test grandeur nature)
- Accroche : « Je demande à des passants d'installer une appli de fidélité. »
- Script : 2–3 passants (avec accord) refusent « encore une appli ? ». Puis : « Et si c'est juste ajouter une carte dans ton Wallet ? » → ils le font en 10 s.
- CTA : « Ton commerce, c'est quoi ? En commentaire. »
- #microtrottoir #commerçant #applewallet #paris (ou ville)

**V13 — « Ta carte aussi belle que ta boutique »** (15 s, Remotion `Laque` / `Keynote`)
- Accroche : « Ta carte de fidélité peut ressembler à ça. »
- Script : défilé de 6 cartes de métiers (barbier noir, onglerie rose, boulangerie crème, café vert…) — maquettes avec noms fictifs (Maison Lumière, Atelier Nord…).
- CTA : « Commente ton métier, je te fais la tienne. » (→ alimente V24)
- Son : trend « glow up » (CML).
- #design #barbier #onglerie #boulangerie

**V14 — « Combien ça coûte vraiment ? »** (35 s, face caméra)
- Accroche : « Une carte de fidélité numérique, ça coûte combien ? Je te montre. »
- Script : Gratuit 15 clients → Pro 19 € TTC/mois (« moins qu'un café par jour ») → Business 39 € pour plusieurs boutiques. Sans engagement. Comparer à l'impression de cartes papier et aux SMS (à chiffrer avec devis réels uniquement).
- CTA : « Code TIKTOK : le premier mois Pro est offert. »
- #prix #commerçant #tpe #entrepreneur

**V15 — « Le client qui revient grâce à la notif »** (30 s, reconstitution avec un commerçant partenaire)
- Accroche : « Mardi, 14 h, salon vide. Il a envoyé une notification. »
- Script : le coiffeur envoie « −20 % cet après-midi », filmer les rendez-vous qui arrivent (uniquement si c'est réel, sinon ne pas tourner).
- CTA : « Lien en bio. »
- #coiffeur #salon #commerçant #astuce

### Pilier 3 — Terrain : « Je démarche 100 commerçants »

**V16 — Épisode 0 : l'annonce** (30 s)
- Accroche : « J'ai créé une start-up. Pour trouver mes clients, je vais démarcher 100 commerçants. Et tout filmer. »
- Script : qui tu es, pourquoi Fidelyz (une anecdote perso de carte perdue), le défi, le compteur 0/100.
- CTA : « Abonne-toi pour voir combien disent oui. »
- Son : beat motivation (CML).
- #entrepreneur #startup #defi #commerçant

**V17 à V22 — Épisodes 1 à 6+ (format récurrent, 30–50 s chacun)**
- Accroche type : « Commerçant n° 7 : un barbier à [ville]. Il m'a dit… [citation la plus forte]. »
- Script : avant (dehors, « j'y vais »), pitch (si accord de filmer), réaction, verdict (OUI / NON / « repasse »), compteur.
- Variantes à garder dans la série :
  - **V17** — le premier « non » (et ce que tu en apprends) ;
  - **V18** — le premier « oui » : on installe la carte en boutique, le premier client l'ajoute ;
  - **V19** — « La boulangère m'a mis dehors » (honnêteté = engagement) ;
  - **V20** — l'objection « mes clients sont vieux » et la réponse (Android + carte papier conservée en parallèle au début) ;
  - **V21** — « 1 semaine après » : retour chez le commerçant du V18, combien de clients ont ajouté la carte (chiffre réel) ;
  - **V22** — bilan 25/100 : taux de oui, meilleures objections, ce qui marche.
- CTA : « Dis-moi en commentaire quel commerce je dois aller voir. »
- #entrepreneur #startup #commerçant #vlog #[ville]

**V23 — « Les 5 objections des commerçants (et mes réponses) »** (45 s, face caméra)
- Accroche : « "J'ai pas le temps", "c'est trop cher", "mes clients sont vieux"… J'ai tout entendu. »
- CTA : « C'est quoi TON objection ? Commente, je réponds en vidéo. » (→ réponses vidéo aux commentaires)
- #commerçant #vente #entrepreneur #objection

### Pilier 4 — Conseils business

**V24 — « Je crée la carte de ton commerce » (réponse à commentaire)** (20 s, série infinie)
- Accroche : (bulle du commentaire à l'écran) « Tu m'as dit "onglerie". Voilà ta carte. »
- Script : création en accéléré de la carte pour le métier/nom proposé, rendu final dans le Wallet.
- CTA : « Commente ton métier, je fais la suivante. »
- #onglerie #nails #commerçant #design

**V25 — « 3 erreurs de carte de fidélité »** (35 s)
- Accroche : « Ta carte de fidélité ne fidélise personne. Voilà pourquoi. »
- Script : 1) récompense trop lointaine (20 tampons) ; 2) récompense sans valeur ; 3) aucun rappel au client. Solution pour chacune, Fidelyz en démo sur la 3e.
- CTA : « Enregistre pour plus tard. »
- #astuce #commerçant #marketing #fidelisation

**V26 — « Comment remplir ton mardi »** (30 s)
- Accroche : « Ton mardi après-midi est vide ? Voilà ce que font les commerçants malins. »
- Script : double points le mardi, notif à 11 h, offre limitée dans le temps. Rappel : 1 notif par jour max, et jamais après 21 h → « on ne spamme pas ses clients ».
- #restaurant #coiffeur #commerçant #astuce

**V27 — « Galette des rois : l'astuce fidélité »** (30 s, à publier début janvier)
- Accroche : « Boulangers : la galette, c'est le moment de récupérer le numéro… non, le Wallet de tes clients. »
- Script : QR en caisse pendant le rush de janvier, « 1 galette achetée = 2× points », notif à l'Épiphanie (dimanche 3 janvier 2027 en France).
- #boulangerie #galettedesrois #boulanger #commerçant

**V28 — « Saint-Valentin : la notif qui remplit l'agenda »** (30 s, publier ~1er février)
- Accroche : « Onglerie, fleuriste, resto : le 14 février se prépare maintenant. »
- #saintvalentin #onglerie #fleuriste #restaurant

### Pilier 5 — Coulisses du fondateur

**V29 — « Mes vrais chiffres après 30 jours »** (45 s, à J30, puis J60, J90)
- Accroche : « 30 jours de TikTok pour ma start-up. Voilà ce que ça m'a rapporté. »
- Script : vues, abonnés, inscriptions, clients payants — **chiffres réels**, même petits (c'est ce qui marche).
- CTA : « Abonne-toi pour le bilan à 60 jours. »
- #buildinpublic #startup #entrepreneur #tiktokbusiness

**V30 — « Pourquoi j'ai créé Fidelyz »** (40 s, storytime)
- Accroche : « Tout a commencé avec une carte de boulangerie à 9 tampons. »
- Script : l'histoire perso + la vision « que les petits commerces aient les mêmes armes que les chaînes ».
- CTA : « Si t'es commerçant, je construis ça pour toi. Dis-moi ce qu'il te manque. »
- #startup #histoire #commerçant #france

> Stock déjà prêt dans `video/` (à rendre en 9:16, voix sous licence) : `Tiktok` (34 s), `Explication` (53 s), `BandeAnnonce`, `Keynote`, `Concurrent`, `Noir`, `Chrono`, `Laque`. Les utiliser en **intros / B-roll** et en vidéos de semaine 1, mais ne pas dépasser **1 vidéo « motion design » pour 3 vidéos filmées** : le face caméra et le terrain performent mieux sur TikTok pour un compte neuf.

---

## 7. 15 idées de carrousels photo (« slides »)

Format : mode photo TikTok, **1080 × 1920** (ou 1080 × 1350 pour réutilisation Instagram), 5 à 8 images, texte gros et court, musique CML douce. Le carrousel se fait en 20 min et marche très bien pour les **contenus à enregistrer** (listes, comparatifs). Les 6 prioritaires sont détaillés dans `05b-carrousels-brief.md` (C1–C6).

| # | Titre / accroche slide 1 | Slides suivantes (texte) | CTA dernière slide | Hashtags |
|---|---|---|---|---|
| C1 | « Carte papier vs carte Wallet » | voir brief | Lien en bio | #commerçant #cartedefidelite #applewallet |
| C2 | « 5 raisons pour lesquelles tes clients ne reviennent pas » | voir brief | Enregistre | #astuce #commerçant #fidelisation |
| C3 | « Ta carte de fidélité en 3 étapes » | voir brief | Code TIKTOK | #tuto #commerçant #tpe |
| C4 | « Ce que voit ton client sur son écran » | voir brief | Lien en bio | #notification #iphone #commerçant |
| C5 | « Combien coûte une carte de fidélité ? » | voir brief | Code TIKTOK | #prix #tpe #entrepreneur |
| C6 | « Barbier, onglerie, boulangerie : ta carte » | voir brief | Commente ton métier | #barbier #onglerie #boulangerie |
| C7 | « 7 idées de récompenses qui marchent » | 1 café offert au 10e · −50 % sur la 5e coupe · un soin offert · le dessert du chef · accès prioritaire aux rendez-vous · cadeau d'anniversaire · double points le mardi | « Laquelle tu choisis ? » | #idee #commerçant #fidelisation |
| C8 | « Le calendrier fidélité de janvier pour les boulangers » | Semaine 1 : galette ×2 points · S2 : notif « fève d'or » · S3 : soldes, rappel · S4 : Chandeleur 2 fév | Enregistre | #boulangerie #galettedesrois #boulanger |
| C9 | « Les 5 objections que j'entends en boutique » | « Pas le temps » → 5 min · « Trop cher » → 0 € pour démarrer · « Clients âgés » → Android aussi, papier en parallèle · « Une appli ? » → aucune · « Mes données ? » → RGPD, export | « La tienne ? » | #commerçant #vente #entrepreneur |
| C10 | « Ce que j'ai appris après 25 commerçants démarchés » | 5 leçons réelles tirées du terrain (à écrire à J21) | Abonne-toi pour la suite | #startup #entrepreneur #buildinpublic |
| C11 | « Les 4 messages à envoyer à tes clients ce mois-ci » | « Plus que 1 point avant ton café » · « −20 % cet après-midi, créneaux libres » · « Joyeux anniversaire, cadeau en boutique » · « Nouveauté : la galette est arrivée » | Enregistre | #marketing #commerçant #astuce |
| C12 | « Les erreurs qui font fuir les clients d'un salon » | trop de SMS · aucune relance · carte papier · pas de récompense rapide · pas de lien Instagram→fidélité | Lien en bio | #coiffeur #barbier #salon |
| C13 | « Avant / après : la caisse de Sandrine » (commerçant partenaire, avec accord) | Photo boîte à cartes papier → photo chevalet QR → capture « 37 clients inscrits » (chiffre réel) | Lien en bio | #boulangerie #avantapres #commerçant |
| C14 | « Ce que les chaînes font et pas toi » | appli de fidélité · notifications · récompenses · données clients → « maintenant tu peux, sans appli » | Code TIKTOK | #commercelocal #independant #starbucks |
| C15 | « Checklist : lancer ta carte de fidélité ce soir » | ☐ logo ☐ récompense ☐ paliers ☐ QR imprimé ☐ phrase en caisse ☐ 1re notif | Enregistre + lien en bio | #checklist #commerçant #tuto |

---

## 8. Hashtags FR

Toujours **3 à 5** hashtags. TikTok indexe surtout le **texte dit, écrit et la légende** : mettre les mots-clés (« carte de fidélité », « commerçant », « Apple Wallet ») dans la légende en phrase normale.

- **Larges (1 par vidéo)** : #commerçant #entrepreneur #pourtoi #tpe #petitcommerce
- **Métier (1–2)** : #boulangerie #boulanger #coiffeur #barbier #barbershop #onglerie #nails #prothesisteongulaire #restaurant #restaurateur #cafe #coffeeshop #fleuriste #esthetique
- **Niche / sujet (1–2)** : #cartedefidelite #fidelisation #fidelisationclient #applewallet #googlewallet #commercelocal #marketinglocal #astucecommerçant #independant #artisan
- **Format** : #storytime #pov #tuto #buildinpublic #startup #vlog
- **Ville** (vidéos terrain) : #paris #lyon #marseille #lille… (la ville réelle du tournage).

---

## 9. Sons

- Compte Entreprise ⇒ **bibliothèque musicale commerciale (CML)** uniquement. Dans le Centre créatif TikTok, filtrer « Tendances » de la CML chaque lundi et noter 5 sons de la semaine.
- Types qui marchent pour ce compte :
  - **Voix + beat lo-fi bas** (face caméra, tutos) : musique à −20 dB sous la voix.
  - **Son « reveal / drop »** pour les transitions papier → Wallet (V01, V13).
  - **Son dramatique / triste** pour les POV (V05).
  - **Tic-tac / chrono** (V08).
  - **Son original ASMR** : bip caisse, ding de notification (V10) — les sons originaux peuvent devenir réutilisables par d'autres.
  - **Son « storytime » calme** (piano léger) pour le terrain et les bilans.
- Sur les vidéos Remotion : garder les mix existants (`scripts/mix-tiktok.mjs`, −14 LUFS), musiques Pixabay sourcées dans `public/sons_tiktok/SOURCES.md`.

---

## 10. Fréquence et horaires

- **Semaines 1–4** : 1 vidéo / jour, 6 jours sur 7 (repos le samedi) + 2 carrousels / semaine. Objectif : trouver vite les formats qui prennent.
- **Semaines 5–13** : 4–5 vidéos / semaine + 2 carrousels, en doublant les formats gagnants.
- **Horaires de départ** (heure de Paris), calés sur le rythme des commerçants, à corriger dès J21 avec *Statistiques → Abonnés → Activité* :
  - **12 h 45** (pause déjeuner, creux de l'après-midi en boutique) — créneau principal ;
  - **20 h 45** (après la fermeture, canapé) — créneau secondaire, meilleur pour le storytime ;
  - **lundi 10 h** : coiffeurs/barbiers et beaucoup de restaurants sont fermés le lundi → publier les contenus salon/barbier ce jour-là.
- Les **30 premières minutes** après publication : répondre à chaque commentaire (de préférence par une vidéo-réponse pour les meilleurs).
- **Routine quotidienne du fondateur (≈ 1 h 30)** : 30 min tournage (en batch le dimanche pour 3–4 vidéos), 20 min montage CapCut, 10 min publication, 30 min commentaires + messages privés à 10 commerçants.

---

## 11. Calendrier des 4 premières semaines

Abréviations : V = vidéo (§6), C = carrousel (§7). Heures : 12 h 45 sauf mention.

### Semaine 0 — 23 → 29 novembre 2026 (préparation)
- [ ] Livrables produit P1–P7 et P12 (§2).
- [ ] Compte TikTok Entreprise + Instagram professionnel + Google Business Profile (§13).
- [ ] Rendre `Tiktok` et `Explication` avec la voix sous licence.
- [ ] Tourner en batch : V16, V02, V07, V09, V08 (5 vidéos d'avance).
- [ ] Imprimer 50 flyers A6 avec QR démo + code TERRAIN ; un chevalet de démo.
- [ ] Liste de 100 commerces cibles dans un tableur (nom, métier, adresse, Instagram, statut).
- [ ] 10 min/jour : liker et commenter (utilement) des vidéos de barbiers, boulangers, ongleries FR pour « éduquer » l'algorithme du compte.

### Semaine 1 — 30 nov → 6 déc : « Le problème + qui je suis »
| Jour | Vidéo (12 h 45) | Carrousel | Terrain / autre |
|---|---|---|---|
| Lun 30 | V01 papier → Wallet (Remotion) | — | Épingler V01 |
| Mar 1 | V16 Épisode 0 : « je démarche 100 commerçants » | — | 1re demi-journée terrain (10 commerces) |
| Mer 2 | V07 Notif en direct | C1 Papier vs Wallet | Reels : V01 |
| Jeu 3 | V17 Ép. 1 (premier non / premier échange) | — | Terrain (10 commerces) |
| Ven 4 | V02 Le portefeuille | — | Reels : V07 |
| Sam 5 | — | C3 En 3 étapes | Bilan des stats de la semaine |
| Dim 6 | V30 Pourquoi j'ai créé Fidelyz (20 h 45) | — | Batch tournage semaine 2 |

### Semaine 2 — 7 → 13 déc : « La démo »
| Jour | Vidéo | Carrousel | Terrain / autre |
|---|---|---|---|
| Lun 7 | V13 Ta carte aussi belle (10 h, cible salons) | — | — |
| Mar 8 | V08 Chrono 2 minutes | — | Terrain |
| Mer 9 | V18 Ép. 2 : premier OUI | C4 L'écran du client | — |
| Jeu 10 | V09 iPhone ET Android | — | Terrain |
| Ven 11 | V03 La triche au tampon | — | Lancer code NOEL26 |
| Sam 12 | — | C2 5 raisons | — |
| Dim 13 | V24 Je crée la carte de ton commerce (réponse commentaire) | — | Batch |

### Semaine 3 — 14 → 20 déc : « Terrain + Noël »
| Jour | Vidéo | Carrousel | Terrain / autre |
|---|---|---|---|
| Lun 14 | V24 bis (autre métier commenté) — 10 h | — | — |
| Mar 15 | V19 Ép. 3 : « elle m'a mis dehors » | — | Terrain |
| Mer 16 | V10 ASMR scan | C5 Combien ça coûte | — |
| Jeu 17 | V14 Combien ça coûte vraiment | — | Terrain |
| Ven 18 | V21 « 1 semaine après » chez le commerçant du V18 | — | Demander un témoignage |
| Sam 19 | — | C6 Ta carte par métier | — |
| Dim 20 | V05 POV carte papier (20 h 45) | — | Batch |

### Semaine 4 — 21 → 27 déc : « Fêtes : moins de terrain, plus de conseils »
(Les commerçants sont débordés : on ne démarche pas, on prépare janvier.)
| Jour | Vidéo | Carrousel | Terrain / autre |
|---|---|---|---|
| Lun 21 | V25 3 erreurs de carte de fidélité | — | — |
| Mar 22 | V23 Les 5 objections | C9 Objections | — |
| Mer 23 | V11 La carte qui se rappelle (géoloc) | — | — |
| Jeu 24 | V06 Storytime 9 tampons sur 10 (12 h) | — | — |
| Ven 25 | — (Noël) | — | — |
| Sam 26 | V12 Micro-trottoir « encore une appli ? » | C8 Calendrier de janvier boulangers | — |
| Dim 27 | V29 « Mes vrais chiffres après 4 semaines » (20 h 45) | — | Revue KPI J30 (§15), choisir les 3 vidéos pour les Spark Ads |

### Semaines 5–13 (aperçu)
- **S5 (28 déc–3 jan)** : V27 galette des rois (publier le 28/12), V22 bilan 25/100, démarrage TikTok Ads (§14).
- **S6–S7 (janvier)** : terrain intensif (les commerçants ont du temps après les fêtes, soldes), épisodes 30→50/100, C10, C11, C13.
- **S8–S9** : V28 Saint-Valentin (publier le 1er février), C12 salons, collaboration n° 1 (§12), webinaire live TikTok « je crée ta carte en direct ».
- **S10–S11** : V29 bilan J60, témoignages commerçants (UGC), lancement parrainage phase 1.
- **S12–S13** : épisode 100/100 (grand final), bilan J90, décision de budget Ads pour le trimestre suivant.

---

## 12. Démarchage filmé, UGC et collaborations

### 12.1 Démarchage filmé — protocole

1. **Entrer sans filmer.** Se présenter, pitcher (30 s, ci-dessous). Si l'échange est intéressant : « Ça vous dérange si je filme la suite pour mon TikTok ? Je ne publie rien sans votre accord. »
2. **Accord écrit** : faire signer une **autorisation de droit à l'image** d'une demi-page (prévoir un formulaire sur téléphone). Sans accord : on filme seulement le fondateur dehors, qui raconte (« il m'a dit… »), et on ne montre ni le visage, ni l'enseigne.
3. **Clients du commerce** : jamais de visage identifiable sans accord ; flouter ou cadrer serré sur les mains/téléphones.
4. **Jamais pendant le rush** (boulangerie 7–9 h et 12–13 h 30, restaurant 12–14 h et 19 h+). Bons créneaux : boulangeries 14 h 30–16 h 30, salons mardi/mercredi matin, cafés 15–17 h.
5. Matériel : téléphone + micro-cravate, iPhone ET Android de démo avec la carte « Fidelyz Café ».
6. Ne jamais se moquer d'un commerçant qui refuse : le refus est raconté avec respect (sinon l'audience cible se retourne contre le compte).

**Pitch 30 secondes (terrain)**
> « Bonjour, je m'appelle X, j'ai créé Fidelyz, une carte de fidélité qui va directement dans le téléphone de vos clients, dans Apple Wallet ou Google Wallet, sans appli. Je vous montre en 20 secondes ? [Scanner le QR de démo avec SON téléphone → la carte s'ajoute.] Voilà, vous êtes client. [Envoyer une notification depuis l'espace pro démo → elle arrive sur son écran verrouillé.] Vous pouvez faire ça avec vos clients. C'est gratuit jusqu'à 15 clients, et je vous crée votre carte maintenant, en 5 minutes, avec votre logo. »

**Ce qu'on laisse** : flyer A6 avec le QR de démo + `fidelyzapp.fr/terrain` + code TERRAIN (1 mois Pro offert). Relance J+3 par SMS/Instagram, J+7 visite (« 1 semaine après » filmable).

**Objectifs terrain** : 2 demi-journées/semaine × 10–15 commerces = 25/semaine ⇒ ~300 commerces en 90 jours. Cible de conversion : 25 % démo acceptée, 10 % carte créée sur place, 4 % payant à J30.

### 12.2 UGC / témoignages

- Dès qu'un commerçant a **≥ 20 clients sur sa carte**, lui proposer un témoignage filmé (30 s, 3 questions : « avant ? », « ce qui a changé ? », « tu le conseillerais à qui ? »).
- Kit envoyé : script de 3 questions + consignes (vertical, lumière, en boutique, montrer le QR et la carte).
- Contrepartie : **2 mois Pro offerts**. ⚠️ S'il publie sur **son** compte en échange d'un avantage, c'est une **collaboration commerciale** : mention obligatoire (« Collaboration commerciale avec @fidelyz ») et bouton « contenu commercial » activé sur TikTok (loi n° 2023-451 sur l'influence commerciale). Sur le compte Fidelyz, indiquer « Client Fidelyz, mois offerts en échange du témoignage » en légende.
- Réutiliser : TikTok, Reels, site (section témoignages à créer), Google Business Profile, e-mails, Ads (Spark Ads avec code d'autorisation du commerçant).
- Format UGC très efficace : **la caméra du commerçant pendant qu'un client ajoute la carte** (« regarde, il l'a ajoutée en 5 secondes »).

### 12.3 Collaborations

| Type | Exemples de cibles | Proposition | Quand |
|---|---|---|---|
| **Commerçants-créateurs TikTok** (barbiers, boulangers, ongleries avec 5–100 k abonnés) | Chercher #barbier #boulangerie #nailsfrance | Carte créée gratuitement + 6 mois Pro, contre une vidéo « j'ai testé » (mention collaboration commerciale) | S6–S9 |
| **Duos / Stitch** | Vidéos virales de commerçants qui se plaignent (« les clients oublient leur carte ») | Stitch avec la solution, ton bienveillant | Dès S2, opportuniste |
| **Créateurs « entrepreneuriat / business local »** (10–50 k) | Comptes FR qui parlent de TPE, de marketing local | Vidéo sponsorisée 150–400 € ou affiliation (code personnel −1 mois + commission manuelle) | S8+, si budget |
| **Fournisseurs et formateurs** | Grossistes coiffure/onglerie, écoles de barbiers, formateurs CAP boulangerie | Live commun, code partenaire | S8+ |
| **Réseaux locaux** | Associations de commerçants, unions commerciales, CCI / CMA | Atelier « la fidélité numérique en 30 min » + démo | S6+ (janvier : vœux et assemblées) |

---

## 13. Les autres canaux

### 13.1 Instagram Reels (et messages privés)
- **Republier chaque vidéo TikTok en Reel** le lendemain, **sans filigrane TikTok** (exporter depuis CapCut / le fichier source), légende adaptée, 3–5 hashtags.
- Les **coiffeurs, barbiers, ongleries vivent sur Instagram** : c'est là que se fait la prospection à distance.
  - 15 messages privés par jour aux commerces de la liste. Modèle : *« Salut [prénom] ! J'adore tes [coupes/poses]. J'ai fait une maquette de ta carte de fidélité version Apple Wallet, je te l'envoie ? »* → envoyer une capture de la carte faite avec son logo (5 min dans le studio). Ne pas mettre de lien au premier message.
- Stories quotidiennes : coulisses du terrain, sondages (« Ta carte de fidélité, papier ou téléphone ? »).
- Highlights : « Démo », « Tarifs », « Avis », « Tuto ».

### 13.2 Google Business Profile
- **Pour Fidelyz** : créer une fiche seulement si le fondateur reçoit ou se déplace réellement chez les clients (« établissement de prestation de services » avec zone desservie, adresse masquée) — c'est le cas avec les démos en boutique. Catégorie « Conseil en marketing » / « Éditeur de logiciels ». Demander un avis Google à **chaque** commerçant activé (lien d'avis dans l'e-mail J+14). Objectif 20 avis à J90.
- **Pour les commerçants clients** (argument + contenu) : leur conseiller d'ajouter le lien de leur carte (`/join/<id>`) dans leur fiche Google (lien du site ou post « Notre carte de fidélité ») → vidéo/carrousel « Mets ta carte de fidélité sur ta fiche Google ».

### 13.3 Prospection terrain avec démo en boutique
Voir §12.1. Compléments :
- **Zone** : 1 quartier = 1 demi-journée, commencer par les rues commerçantes du quartier du fondateur (effet voisinage : « ton voisin le barbier l'a »).
- **Tableur CRM** (colonnes) : commerce, métier, adresse, Instagram, date visite, résultat (refus / à relancer / carte créée / payant), objection, code donné, source.
- **Offre terrain** : création de la carte **sur place**, chevalet QR offert, code TERRAIN.
- **Activation** : un commerçant n'est « activé » qu'à 5 clients avec la carte. Repasser à J+7 pour l'aider (phrase en caisse : « Vous voulez votre carte de fidélité dans votre téléphone ? Scannez ici. »).

### 13.4 Parrainage
- **Mécanique** : commerçant parrain → filleul ; **1 mois Pro offert à chacun** dès que le filleul passe payant.
- Phase 1 (S10, manuel) : code `PARRAIN-<BOUTIQUE>` créé dans l'admin promo (1 mois offert pour le filleul) ; mois du parrain appliqué à la main (avoir Stripe). Suivi dans le tableur.
- Phase 2 (après J90) : lien de parrainage dans l'espace pro + compteur.
- Communication : e-mail dédié, carrousel « Ton voisin commerçant mérite ça aussi », et à chaque visite terrain : « Vous connaissez un commerçant à qui ça plairait ? »
- Le parrainage le plus naturel : **un client consommateur qui a 3 cartes Fidelyz dans son Wallet parle de la carte à son 4e commerçant** → ajouter au dos de la carte (champ du pass) une ligne discrète « Commerçant ? Votre carte sur fidelyzapp.fr » (à valider produit : ne pas polluer la carte du marchand, peut-être réservé à l'offre gratuite).

### 13.5 SEO local
- **Pages par métier** (à créer sur le site) : « Carte de fidélité pour boulangerie », « … coiffeur », « … barbier », « … onglerie », « … restaurant », « … café ». Chacune : problème du métier, exemple de carte, 3 idées de récompenses, FAQ, CTA. Titre type : *« Carte de fidélité boulangerie dans Apple Wallet et Google Wallet — Fidelyz »*.
- **Articles** (1 / semaine à partir de S3, 800–1 200 mots) : « Carte de fidélité papier ou numérique ? », « Comment créer une carte de fidélité Apple Wallet », « 15 idées de récompenses pour un salon de coiffure », « Fidéliser ses clients en boulangerie », « Notifications Wallet : comment ça marche ? ». Intégrer la vidéo TikTok correspondante dans chaque article.
- **Pages ville** : seulement pour les villes où il y a de vrais clients (avec cartes et témoignages réels), pas de pages ville générées à la chaîne.
- Technique (à transmettre au produit) : le site est une SPA React → vérifier que les pages sont bien indexables (pré-rendu ou pages statiques), sitemap, Search Console dès S0.
- Annuaires : fiches sur les comparateurs de logiciels FR (Capterra, Appvizer, GetApp) — demander aux premiers clients d'y laisser un avis.

### 13.6 E-mail (Brevo, déjà utilisé par le produit)
**Séquence d'activation (commerçant inscrit gratuit)**
| Jour | Objet | Contenu |
|---|---|---|
| J0 | Votre carte est prête — 3 choses à faire aujourd'hui | Logo, récompense, imprimer le QR |
| J1 | La phrase à dire en caisse | Script de 10 mots + photo du chevalet |
| J3 | Votre premier client l'a ajoutée ? | Vidéo 30 s, lien d'aide, réponse directe du fondateur |
| J7 | Ce que font les commerçants qui réussissent | Exemples de récompenses + lien vers la série TikTok |
| Quand 12/15 clients | Vous approchez de la limite gratuite | Passage en Pro : clients illimités + notifications sur l'écran verrouillé, code TIKTOK / TERRAIN |
| J14 | Un petit service ? | Avis Google + parrainage |

**Prospects terrain non convertis** : 1 e-mail J+2 (récap + vidéo de démo + code TERRAIN), 1 e-mail J+10 (témoignage). Prospection à froid par e-mail possible vers des adresses professionnelles si le message concerne leur activité, avec identification claire et lien de désinscription (règles CNIL B2B) ; rester en volume faible et personnalisé.

---

## 14. TikTok Ads (budget test)

**Quand** : à partir de la **semaine 5**, une fois qu'on a ≥ 20 vidéos organiques et 3 vidéos au-dessus de la médiane du compte. Pré-requis : P3 (UTM), P7 (chiffres du site corrigés), idéalement P9 (pixel).

**Format** : **Spark Ads** (on booste les vidéos organiques du compte : les commentaires et abonnés restent sur le compte).

**Budget test : 450 € sur 4 semaines (S5–S8)**
| Phase | Durée | Budget | Contenu |
|---|---|---|---|
| Test créatif | S5–S6 (14 j) | 3 vidéos × 5 €/j = 210 € | Les 3 meilleures organiques (probablement V07 notif, V18 premier oui, V08 chrono) |
| Scale du gagnant | S7–S8 (14 j) | ~15 €/j = 210 € | La vidéo au meilleur coût par inscription + 1 nouvelle variante |
| Réserve | — | 30 € | Re-test d'une accroche |

**Ciblage** : France, 25–55 ans, ciblage large + centres d'intérêt « Petites entreprises / Entrepreneuriat », « Beauté et soins », « Restauration ». Exclure les inscrits (si audience disponible). Placement TikTok uniquement.
**Objectif de campagne** : « Trafic » vers `/demo` avec UTM `utm_source=tiktok&utm_medium=ads&utm_content=<V07>` ; passer à « Conversions » (inscription) si le pixel remonte ≥ 50 événements/semaine.
**Seuils (indicatifs, à ajuster après la phase 1)**
- CTR < 0,6 % après 3 000 impressions → couper la vidéo.
- CPC > 0,80 € → couper ou changer l'accroche.
- Coût par inscription gratuite > 20 € → arrêter le scale.
- Coût par client payant > 80 € (≈ 4 mois de Pro) → ne pas augmenter le budget ; < 50 € → doubler le budget en S9.
- Toujours **pré-tester l'accroche** : une Spark Ad dont la rétention à 2 s est < 30 % ne sera jamais rentable.

---

## 15. KPI et seuils pour pivoter

### 15.1 Tableau de bord hebdomadaire (tableur, chaque dimanche)

| Étape | KPI | Source |
|---|---|---|
| Attention | Vues médianes par vidéo, % de rétention à 2 s et 3 s, durée moyenne de visionnage, % vues complètes | TikTok Statistiques |
| Intérêt | Abonnés gagnés, visites de profil / 1 000 vues, commentaires « métier » | TikTok |
| Action | Clics sur le lien en bio, visites `/demo`, ajouts de la carte de démo | TikTok + analytics site |
| Conversion | Comptes créés par source (UTM + « comment nous avez-vous connus »), utilisations des codes TIKTOK / TERRAIN | Back-office / Stripe |
| Activation | Commerçants avec ≥ 5 clients sur leur carte dans les 14 jours | Back-office |
| Revenu | Passages en Pro/Business, revenu mensuel, résiliations | Stripe |
| Terrain | Commerces visités, démos, cartes créées sur place | Tableur CRM |

### 15.2 Objectifs

| | J30 | J60 | J90 |
|---|---|---|---|
| Abonnés TikTok | 500 | 2 000 | 5 000 |
| Vues médianes / vidéo | 500 | 1 500 | 3 000 |
| Comptes commerçants créés (toutes sources) | 25 | 70 | 120 |
| …dont TikTok/Instagram (déclaré ou UTM) | 8 | 25 | 45 |
| Commerçants activés (≥ 5 clients) | 12 | 35 | 60 |
| Clients payants | 4 | 12 | 25 |
| Revenu mensuel | ≈ 80 € | ≈ 250 € | ≈ 550 € |
| Avis Google | 5 | 12 | 20 |

### 15.3 Règles de pivot

| Signal (mesuré sur 10 vidéos glissantes) | Diagnostic | Action |
|---|---|---|
| Rétention à 2 s < 40 % | L'accroche ne stoppe pas | Réécrire les 2 premières secondes : mouvement dès la 1re image, texte plus court, montrer le téléphone tout de suite. Tester 3 accroches sur la même vidéo (repost à 1 semaine d'écart). |
| Vues médianes < 300 après 20 vidéos | Distribution faible / sujet trop niche | Plus de pilier P1 (douleur, humour) et de trends ; vérifier que le compte n'est pas pénalisé (musique, liens) ; augmenter le face caméra. |
| Bonnes vues mais visites de profil < 1 % des vues | Contenu divertissant sans intérêt pour la marque | Plus de démos et de séries numérotées, CTA plus explicite. |
| Visites profil OK mais clics lien < 5 % des visites | Bio / lien pas convaincants | Tester la bio suivante (A/B/C §3), épingler une vidéo « clique ici ». |
| Clics OK mais inscriptions < 5 % des visites `/demo` | Page démo faible | Raccourcir `/demo`, carte de démo en un clic, code TIKTOK visible. |
| Audience majoritairement < 18 ans ou consommateurs (Statistiques → Abonnés) | Mauvaise cible | Arrêter les contenus « POV client » / humour généraliste, revenir à « si t'as un commerce… » dans chaque accroche. |
| J45 : < 10 comptes venant de TikTok/Instagram | TikTok ne convertit pas (encore) | Garder TikTok à 3 vidéos/semaine comme **outil de crédibilité** (on l'envoie aux prospects), basculer le temps libéré vers le terrain et Instagram DM. |
| Terrain : taux de carte créée sur place < 5 % sur 50 visites | Pitch ou offre à revoir | Changer d'offre (création de carte faite par nous + chevalet offert), changer de segment (passer en tête celui qui convertit le mieux). |
| Activés qui ne passent pas payants (< 15 % à J30) | La valeur du Pro n'est pas perçue | Mettre en avant la notification sur l'écran verrouillé dès l'onboarding, e-mail « 12/15 clients », essai Pro 14 jours pour les comptes actifs (décision produit). |
| Une vidéo dépasse 50 k vues | Format gagnant | La décliner 3 fois dans les 10 jours (même structure, autre métier), la passer en Spark Ad, l'épingler. |

---

## 16. Règles de conformité et de crédibilité (à afficher au mur)

1. **Aucun chiffre non vérifiable** dans une vidéo, un carrousel ou une pub (pas de « 2 400 cartes », « 98 % », « +38 % » tant qu'ils ne sont pas réels et sourcés).
2. **Droit à l'image** : accord écrit de chaque commerçant filmé, clients floutés.
3. **Collaborations rémunérées ou avec avantage** : mention « collaboration commerciale » + option contenu commercial TikTok.
4. **Musique** : bibliothèque commerciale TikTok ou musiques sous licence (Pixabay sourcées), voix off sous licence commerciale.
5. **Notifications** : ne jamais promettre « illimité » sans préciser « 1 par jour » ; ne jamais montrer d'envoi après 21 h ; ne jamais suggérer de l'envoyer à des personnes qui ne sont pas clientes.
6. **Prix** : toujours « TTC », toujours « sans engagement », gratuit = « jusqu'à 15 clients ».
7. **Noms de marques** : Apple Wallet / Google Wallet en citation descriptive uniquement ; pas de logo Apple/Google en grand dans les miniatures ; pas de dénigrement nommé de concurrents.

---

## 17. Budget 90 jours

| Poste | Montant |
|---|---|
| TikTok Ads (test S5–S8) | 450 € |
| Éventuel scale S9–S13 (si coût par payant < 50 €) | 0–600 € |
| Matériel (micro-cravate, trépied, lumière) | 80 € |
| Impression (300 flyers A6, 30 chevalets QR) | 120 € |
| Voix sous licence (ElevenLabs, 2 mois) | ≈ 50 € |
| Collaboration créateur (1 à 2) | 0–400 € |
| Mois offerts (TIKTOK, TERRAIN, UGC, parrainage) | coût d'opportunité, ≈ 25 × 19 € |
| **Total cash minimum** | **≈ 700 €** |

---

## 18. Check-list « jour J » (lundi 30 novembre)

- [ ] `/demo` en ligne, carte de démo testée sur iPhone et Android.
- [ ] `fidelyzapp.fr/tiktok` redirige vers `/demo` avec UTM ; inscription test → source enregistrée.
- [ ] Codes TIKTOK, TERRAIN, NOEL26 actifs et testés dans `ProSignup`.
- [ ] Chiffres non vérifiés retirés du site.
- [ ] Bio A en place, lien cliquable vérifié.
- [ ] 5 vidéos d'avance, V01 programmée à 12 h 45.
- [ ] Tableur KPI + tableur CRM terrain créés.
- [ ] Notifications TikTok activées sur le téléphone du fondateur pour répondre aux commentaires dans les 30 min.

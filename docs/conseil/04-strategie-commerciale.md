# 04 — Stratégie commerciale de Fidelyz

> Conseil d'audit avant mise en ligne. Rôle : stratège commercial, objectif **maximiser le profit**.
> Date : 25 novembre 2026. Base : lecture du dépôt (`frontend/src/pages/Home.jsx`, `frontend/src/utils/usePlans.js`, `backend/utils/plans.js`, `backend/utils/pushGuard.js`, `backend/controllers/proSignupController.js`, `frontend/src/App.jsx`, `frontend/src/pages/ProSignup.jsx`) et recherche web.

---

## 0. Synthèse en 10 points

1. **Le prix de 19 € / 39 € est bien placé** (sous Kard, Loopy, Stamp Me, PassKit et Zerosix), mais il est **affiché TTC à une clientèle de professionnels** qui raisonne en HT et récupère la TVA. Passer à **19 € HT / 39 € HT** rapporte **+20 % de chiffre d'affaires** sans que le prix perçu change. C'est le levier le plus rentable du document.
2. **La page d'accueil affiche des chiffres inventés** : « 2 400+ cartes actives », « 98 % de clients satisfaits », « +38 % de visites récurrentes ». Avant le lancement, c'est une **pratique commerciale trompeuse** (art. L121-2 du Code de la consommation, applicable aussi entre professionnels). À retirer avant la mise en ligne.
3. **Contradiction sur l'offre** : la tuile « Notifications push : gratuites et illimitées » est fausse pour l'offre Gratuite (0 notification, `PUSH_RULES.dailyLimit.free = 0`).
4. **Il manque des CGV**. Seules les « mentions légales » existent (`/mentions-legales`), et c'est sur elles que porte la case à cocher de l'inscription. Il faut des CGV B2B (art. L441-1 du Code de commerce), une politique de confidentialité et un DPA (Fidelyz est sous-traitant RGPD des données clients du commerçant).
5. **Offre gratuite (15 clients)** : elle force bien le passage au payant (une boulangerie atteint 15 clients en un jour), mais **trop tôt pour que le commerçant voie la valeur**, qui est le retour des clients au bout de 3 à 6 semaines. Je recommande **30 jours d'essai Pro sans carte bancaire**, puis un retour à une offre gratuite de 15 clients. Le code sait déjà gérer `trial_period_days` (`stripeService.js`), mais rien ne l'utilise.
6. **Business est mal différencié et sous-tarifé pour les réseaux** : même limite de notifications que Pro (1 par jour), et jusqu'à 10 établissements pour 39 € fixes. Il faut un **prix par établissement supplémentaire**.
7. **Économie unitaire** : la marge brute est d'environ 90 %. Les frais fixes, de 150 à 300 € par mois, sont couverts dès **12 à 20 abonnés Pro**. Le profit dépend de la vitesse d'acquisition et du churn, pas du coût de service.
8. **Le canal n°1 est le terrain** : porte-à-porte en centre-ville avec démonstration sur téléphone en 3 minutes, et kit QR offert. Le **canal n°2 est la recommandation** : experts-comptables, éditeurs de caisse, CCI/CMA, unions de commerçants.
9. **Objectifs** : 40 abonnés payants à 3 mois (~700 € de revenu mensuel récurrent HT), 120 à 6 mois (~2 200 €), 350 à 12 mois (~6 500 €, soit ~78 k€ par an).
10. **Il manque pour vendre** : la vidéo (« Bientôt disponible »), une démo commerçant, de vrais témoignages, un parcours de prise en main, un kit de mise en caisse et des pages par métier pour le référencement.

---

## 1. Marché France

### 1.1 Taille et cible

Les chiffres ci-dessous sont des **estimations d'ordre de grandeur** (sources INSEE et fédérations professionnelles, de mémoire, non revérifiées) :

| Segment | Établissements (ordre de grandeur) | Pertinence |
|---|---|---|
| Boulangeries-pâtisseries | ~33 000 | ★★★ fréquence très élevée, carte tampons très ancrée |
| Cafés, bars, coffee shops | ~35 000 à 40 000 | ★★★ |
| Restauration rapide / à emporter | ~50 000+ | ★★★ |
| Coiffure / barbiers / instituts | ~85 000 coiffure + ~40 000 esthétique | ★★★ fréquence mensuelle, panier élevé |
| Restaurants traditionnels | ~100 000 | ★★ |
| Commerces de bouche (boucherie, primeur, fromager, caviste) | ~60 000 | ★★ |
| Pressing, fleuristes, librairies, animaleries… | ~50 000 | ★ |

**Cible réaliste** : environ 300 000 établissements indépendants à fréquence de visite élevée. À 1 % de pénétration, cela fait 3 000 clients et environ 57 k€ de revenu mensuel récurrent. Le marché n'est donc pas le facteur limitant. Ce qui limite, c'est **la distribution**.

### 1.2 Concurrents : prix relevés (recherche du 25/11/2026)

Les sites des éditeurs étaient **inaccessibles depuis cet environnement** (réseau limité). Les prix viennent donc des **résultats de recherche et de comparateurs tiers**. À revérifier sur les grilles officielles avant toute communication comparative.

| Concurrent | Prix d'entrée relevé | Offre gratuite / essai | Sources (consultées le 25/11/2026) |
|---|---|---|---|
| **Zerosix** (FR) | ~49 € HT/mois **par établissement** + ~190 € HT de mise en service | non | La Fabrique du Net, Appvizer (comparateurs tiers) |
| **Kard** (FR) | à partir de 29 €/mois, sans engagement | essai 14 j | page éditeur, via un résultat de recherche |
| **Fidme / Fidmarques** (FR) | Fidme Stamps gratuit de 1 à 9 points de vente ; ~20 € HT/mois à partir de 10 | gratuit (modèle porté par l'appli grand public et les marques) | La Fabrique du Net |
| **Loopy Loyalty** (AU) | 25 $/mois (Starter), 69 $ (Growth), 95 $ (Ultimate) | essai 15 j | centre d'aide Loopy, G2, Capterra |
| **Stamp Me** (AU) | 49 $ / 79 $ / 199 $ par mois (Lite / Pro / Elite) | essai | CostBench (août 2026), G2, Capterra |
| **Boomerangme** | ~69 $/mois en annuel (Grow), jusqu'à ~199 à 299 $/mois | essai, pas de gratuit | SpotSaaS, xpay.sh (mai 2026) ; sources contradictoires |
| **PassKit** | ~39,50 $/mois + facturation au volume de pass | — | Capterra, SoftwareSuggest |
| **Toky Woky** (FR) | aucun prix public trouvé (vente sur devis, cible enseignes / grande distribution) | — | aucune source fiable : **estimation** > 200 €/mois |

Liens :
[La Fabrique du Net – Zerosix](https://www.lafabriquedunet.fr/logiciel/zerosix) ·
[La Fabrique du Net – fidélité commerce de proximité](https://www.lafabriquedunet.fr/logiciels/marketing-digital/carte-fidelite/fidelite-commerce) ·
[Appvizer – Zerosix](https://www.appvizer.fr/relation-client/fidelite-client/zerosix) ·
[La Fabrique du Net – Kard](https://www.lafabriquedunet.fr/logiciel/kard) ·
[La Fabrique du Net – Fidme](https://www.lafabriquedunet.fr/logiciel/fidme) ·
[Loopy – tarifs (aide)](https://docs.loopyloyalty.com/en/articles/803301-what-are-your-pricing-plans) ·
[Capterra – Loopy](https://www.capterra.com/p/160859/Loopy-Loyalty/pricing/) ·
[CostBench – Stamp Me](https://www.costbench.com/software/loyalty-program/stamp-me/) ·
[G2 – Stamp Me](https://g2.com/products/stamp-me/pricing) ·
[SpotSaaS – Boomerangme](https://www.spotsaas.com/product/boomerangme/pricing) ·
[xpay – Boomerangme](https://www.xpay.sh/saas-pricing/boomerangme-biz/) ·
[Capterra – PassKit](https://www.capterra.com/p/10033797/PassKit/)

### 1.3 Positionnement recommandé

- **Où se place Fidelyz** : « la carte tampon de votre boulangerie, mais dans l'iPhone » : **simple, française, sans application, prix d'une baguette par jour**. Fidelyz est moins cher que Zerosix (49 € HT par établissement plus 190 € de frais d'installation) et plus local et francophone que Loopy, Stamp Me ou Boomerangme (interfaces anglophones, dollars, assistance hors fuseau).
- **Différenciateurs à mettre en avant** :
  1. sans application à télécharger, contrairement à Fidme ;
  2. notification sur l'écran verrouillé, sans SMS payant ;
  3. géolocalisation, qui rappelle la carte devant la boutique ;
  4. éditeur, hébergement et assistance en France, RGPD ;
  5. aucun frais d'installation, sans engagement.
- **Menace principale** : Fidme est gratuit jusqu'à 9 points de vente. La réponse : chez Fidme, le client final doit installer l'appli Fidme et le commerçant n'est qu'une enseigne parmi d'autres ; chez Fidelyz, la carte est **à la marque du commerçant**, dans le Wallet natif, avec ses propres notifications.

---

## 2. Grille tarifaire

### 2.1 Constat sur la grille actuelle

| Offre | Prix affiché | HT réel | Contenu |
|---|---|---|---|
| Gratuit | 0 € | 0 € | 15 clients, 0 notification |
| Pro | 19 € TTC/mois | 15,83 € | clients illimités, 1 notification/jour |
| Business | 39 € TTC/mois | 32,50 € | + jusqu'à 10 établissements, équipe, export CSV, clients à relancer |
| Annuel | −20 % | | Pro 182,40 € TTC ; Business 374,40 € TTC |

Problèmes :
- **Le prix est affiché TTC à des professionnels.** Un boulanger compare des prix HT, puisqu'il récupère la TVA. Afficher 19 € TTC, c'est renoncer à 3,17 € par mois et par client sans aucun gain de conversion. *Exception* : si l'éditeur est en franchise de TVA (micro-entreprise), afficher « 19 € HT, TVA non applicable, art. 293 B du CGI ».
- **Pro et Business ont exactement les mêmes notifications** (`dailyLimit: { pro: 1, business: 1 }`). Business ne se vend donc que sur le multi-site et l'équipe, ce qui concerne moins de 10 % de la cible.
- **10 établissements pour 39 €** : une chaîne de 10 boulangeries paierait 3,90 € par site, contre 49 € chez Zerosix. C'est une perte de revenu sur le segment le plus rentable.
- **Remise annuelle de −20 %** : elle est généreuse. La norme du marché est « 2 mois offerts » (−16,7 %).

### 2.2 Grille recommandée au lancement

| Offre | Prix | Contenu | Rôle |
|---|---|---|---|
| **Essai Pro 30 jours** | 0 €, sans carte bancaire | tout Pro | montrer la valeur (retours clients, 1re campagne) |
| **Découverte** (gratuit) | 0 € | 15 clients actifs, pas de notifications, mention « Propulsé par Fidelyz » sur la carte et la page `/join` | viralité et filet de sécurité |
| **Pro** | **19 € HT/mois** ou **190 € HT/an** (2 mois offerts) | clients illimités, notifications (1/jour), géolocalisation, statistiques complètes, sans marque Fidelyz | cœur de revenu |
| **Business** | **39 € HT/mois pour 1 à 2 établissements**, **+15 € HT par établissement supplémentaire** (au-delà de 10 : sur devis) | équipe, export, relances automatiques, statistiques par site, assistance prioritaire | réseaux et franchises |
| **Offre fondateurs** (limitée aux 100 premiers) | Pro à **14 € HT/mois garanti 12 mois** si engagement annuel, ou 1er mois offert (code promo existant) | | lever l'objection du prix, créer l'urgence, obtenir des témoignages |

Pourquoi ne pas monter le prix catalogue de Pro (par exemple à 24 € HT) ? Au lancement, sans preuve sociale, la vitesse d'acquisition vaut plus que 5 € de marge. **Réévaluer à 6 mois** : si l'essai convertit à plus de 25 % et que le churn mensuel reste sous 3 %, tester 24 à 29 € HT pour les nouveaux clients. L'outil d'administration des prix (`adminPricingController.js`, changements planifiés à 04:00) le permet déjà.

### 2.3 Essai, engagement, moyens de paiement

- **Essai de 30 jours sans carte bancaire**, avec des relances par e-mail à J+3, J+10, J+20, J+27 et J+30 (via Brevo). Une variante **avec carte bancaire** convertit généralement mieux (50 à 60 % contre 15 à 25 %) mais attire 3 à 5 fois moins d'essais. **Tester les deux**, 50/50.
- **Sans engagement** au mois : c'est un argument de vente majeur en TPE, à garder. Pousser l'annuel à la caisse : « 2 mois offerts + kit QR offert ».
- **Prélèvement SEPA** via Stripe : 0,35 € par transaction au lieu de 1,5 % + 0,25 €. Il réduit aussi le churn involontaire (cartes expirées), qui représente 20 à 40 % du churn des petits SaaS.

### 2.4 Services complémentaires (marge élevée, ponctuels)

| Service | Prix | Coût | Commentaire |
|---|---|---|---|
| **Kit caisse** : chevalet QR + autocollant vitrine + 1 sticker NFC | 29 € HT, **offert avec l'annuel** | ~4 à 8 € (impression en ligne) | augmente fortement les inscriptions des clients finaux, donc la rétention du commerçant |
| **Installation clé en main** : carte conçue pour le commerçant, logo, paliers, mise en place en boutique | 79 € HT (49 € en visio) | 30 à 45 min | les commerçants pressés paient pour ne pas configurer eux-mêmes |
| **Pack SMS** (relance des clients sans Wallet), plus tard | 100 SMS = 12 € HT | ~5 € chez Brevo | à ne lancer qu'à la demande |
| **Marque blanche agences** (sous-domaine, logo agence), plus tard | 99 € HT/mois pour 10 commerces | | canal revendeur |

---

## 3. Économie unitaire

### 3.1 Revenu net par abonné

Hypothèse : carte européenne standard, Stripe 1,5 % + 0,25 €, plus **Stripe Billing ~0,7 %** du volume d'abonnements (tarif à l'usage, à vérifier sur le contrat Stripe).

| Formule | Encaissé TTC | HT | Frais Stripe (≈2,2 % + 0,25 €) | **Net HT / mois** |
|---|---|---|---|---|
| Pro mensuel, actuel (19 € TTC) | 19,00 | 15,83 | ~0,67 | **~15,16 €** |
| Pro mensuel, recommandé (19 € HT) | 22,80 | 19,00 | ~0,75 | **~18,25 €** (+20 %) |
| Pro annuel, actuel (182,40 € TTC) | 182,40 | 152,00 | ~4,26 /an | **~12,31 €** |
| Pro annuel, recommandé (190 € HT) | 228,00 | 190,00 | ~5,27 /an | **~15,39 €** |
| Business mensuel, actuel (39 € TTC) | 39,00 | 32,50 | ~1,11 | **~31,39 €** |
| Business recommandé, 3 sites (39 + 15 € HT) | 64,80 | 54,00 | ~1,68 | **~52,32 €** |

Stripe calcule ses frais sur le montant TTC. Le prélèvement SEPA les ramène à environ 0,35 € + 0,7 %.

### 3.2 Coûts fixes mensuels (estimations)

| Poste | €/mois |
|---|---|
| Serveur VPS + MySQL managé ou sauvegardes (OVH / Scaleway / Hetzner) | 20 à 60 |
| Apple Developer Program (99 $/an) | ~8 |
| Google Wallet API | 0 |
| Brevo (gratuit jusqu'à 300 e-mails/jour ; offre Starter si besoin) | 0 à 25 |
| Nom de domaine, e-mail professionnel | 5 à 10 |
| Expert-comptable en ligne | 60 à 150 |
| RC Pro / cyber (recommandé, Fidelyz étant sous-traitant RGPD) | 20 à 40 |
| Outils (CRM gratuit, Canva…) | 0 à 30 |
| **Total** | **~115 à 320 €/mois** |

Le coût variable par commerçant (stockage, push APNs gratuits, e-mails) reste sous 0,30 € par mois, soit une **marge brute d'environ 95 %**.

**Point mort** (hors rémunération du fondateur) : 320 / 15,16 ≈ **21 abonnés Pro** avec la grille actuelle, et **18** avec la grille HT recommandée.

### 3.3 CAC, durée de vie, LTV (estimations)

| Indicateur | Hypothèse | Valeur |
|---|---|---|
| Revenu moyen par compte payant (mélange 85 % Pro, 15 % Business, 30 % annuel) | grille recommandée | **~20 € HT net / mois** |
| Churn mensuel des TPE (secteur) | 3 à 5 % (fermetures, changements de gérant, désintérêt) | durée de vie de 20 à 33 mois |
| **LTV** (marge brute 95 %) | 20 × 0,95 × 25 mois | **~475 €** (fourchette 380 à 630 €) |
| CAC terrain (temps du fondateur valorisé 25 €/h ; 1 signature pour 8 visites de 10 min et environ 1 h de suivi par signature ; kit offert 6 €) | | **~60 à 90 €** |
| CAC payant (Meta / Google local), non recommandé avant 6 mois | CPC 0,8 à 1,5 €, 3 % d'inscriptions, 20 % de conversion | ~150 à 250 € |
| CAC partenaire (20 % de commission la première année) | 20 × 12 × 20 % | ~48 € |
| **Ratio LTV/CAC** | terrain et partenaires | **5 à 8** : très sain |
| **Retour sur CAC** | | **3 à 5 mois** |

---

## 4. Objectifs chiffrés

Hypothèses : le fondateur fait du terrain 2 demi-journées par semaine, ~25 visites par semaine.

| Horizon | Comptes créés (cumul) | Payants actifs | Revenu mensuel récurrent HT net | Indicateurs clés |
|---|---|---|---|---|
| **M+3** (fin février 2027) | 200 | **40** | **~700 €** | 10 témoignages vidéo ; 1 partenaire prescripteur actif ; essai→payant ≥ 20 % |
| **M+6** (fin mai 2027) | 550 | **120** | **~2 200 €** | churn < 4 %/mois ; 30 % en annuel ; 3 villes couvertes ; 2 partenaires (comptable + éditeur de caisse) |
| **M+12** (fin novembre 2027) | 1 500 | **350** | **~6 500 € (~78 k€/an)** | 20 % des nouveaux clients viennent des partenaires ou de la recommandation ; 25 comptes Business multi-sites ; test d'un prix Pro à 24 € HT |

Indicateurs à suivre chaque semaine (à ajouter au tableau de bord admin si absents) : inscriptions, activation (≥ 10 cartes client ajoutées en 7 jours), conversion essai→payant, revenu mensuel récurrent nouveau / en extension / perdu, churn logo et revenu, cartes client actives par commerçant, campagnes envoyées par commerçant.

**Indicateur d'activation clé** : un commerçant ayant au moins **30 cartes dans des Wallets** et **1 campagne envoyée** au bout de 14 jours a très probablement atteint le déclic. Tout le parcours de prise en main doit viser cet objectif.

---

## 5. Acquisition

### 5.1 Prospection terrain (canal n°1, dès la semaine 1)

- **Zone** : rues commerçantes de 2 ou 3 villes moyennes ou quartiers denses. Ordre des métiers : **boulangeries, coffee shops, barbiers et coiffeurs, snacks et kebabs, primeurs et fromagers.**
- **Créneaux** : 14 h 30 à 16 h 30, hors coup de feu. Jamais le samedi matin ni à midi.
- **Argumentaire en 90 secondes** :
  1. « Vous avez encore des cartes tampons ? Combien de clients les perdent ? »
  2. Démonstration : scanner le QR sur le téléphone **du commerçant**, la carte apparaît dans son Wallet, il tamponne lui-même.
  3. « Demain je peux envoyer "Croissant offert ce matin" sur l'écran verrouillé de vos 200 habitués. Sans SMS, sans appli. »
  4. « 30 jours gratuits, je vous installe tout maintenant, sans carte bancaire. »
- **Laisser sur place** : chevalet QR déjà configuré (créé dans la visite) et flyer avec code « 1 mois offert » (le code promo existe déjà).
- **Suivi** : appel à J+3 (« combien de cartes ajoutées ? ») et visite à J+21 pour convertir, avec les statistiques à l'écran.
- **Rendement visé** : 25 visites par semaine, 8 essais, 3 abonnés payants à J+30. Soit environ 12 abonnés par mois et par fondateur.

### 5.2 Partenariats et prescription (canal n°2, à partir du 2e mois)

| Partenaire | Pourquoi | Offre |
|---|---|---|
| **Experts-comptables de TPE** | conseillers de confiance du commerçant | 20 % de commission la 1re année + offre pour leurs clients |
| **Éditeurs et revendeurs de caisse** (SumUp, Zelty, Lightspeed, L'Addition, Tiller… et installateurs locaux) | présents au moment de l'équipement | apport d'affaires, puis intégration (créditer des points à l'encaissement) |
| **CCI, CMA, unions de commerçants, managers de centre-ville** | opérations « commerce local » et budgets de redynamisation | **carte collective de ville ou de quartier** (offre Business par établissement, payée par la collectivité) |
| **Fournisseurs du métier** (meuniers, torréfacteurs, distributeurs de cosmétiques pour coiffeurs) | force commerciale terrain chez exactement la bonne cible | co-marquage et kit offert |
| **Agences web et freelances locaux** | vendent déjà du digital aux TPE | revendeur en marque blanche (à venir) |

### 5.3 Boucles de croissance intégrées au produit

- **« Propulsé par Fidelyz »** sur la carte de l'offre gratuite et sur `/join` : chaque client final devient une impression. Les commerçants voisins voient la carte chez leurs propres clients.
- **Parrainage commerçant** : 1 mois offert au parrain et au filleul. Le mécanisme de code promo est déjà présent dans `proSignupController.js` ; il ne manque que la génération automatique de codes par commerçant.
- **SEO local** : pages « Carte de fidélité pour boulangerie / coiffeur / café… » et « Remplacer les cartes tampons », plus un comparatif « Fidelyz vs Fidme / Zerosix ». Ce sont des recherches à intention forte et peu concurrentielles.
- **Fiche Google Business et avis** : demander un avis à chaque commerçant satisfait à J+45.

---

## 6. Conversion gratuit→payant et rétention

### 6.1 Conversion

- **Le déclencheur actuel est bon mais brutal** : au-delà de 15 clients, l'accès est bloqué (`getAccess().locked`, `PlanBanner.jsx`). À ajouter :
  - un e-mail et une bannière à 10/15 (« Plus que 5 places, vos clients suivants ne pourront pas s'inscrire ») ;
  - au blocage, afficher **le manque à gagner** : « 12 clients ont essayé de s'inscrire cette semaine ». Cela suppose de **compter les inscriptions refusées** (`FreeLimitError`), une petite évolution utile.
- **Rendre visible la fonction payante n°1** : sur l'offre gratuite, afficher l'écran des campagnes avec un aperçu de la notification sur un iPhone et le bouton « Débloquer avec Pro ». C'est déjà partiellement fait (`CampaignsPanel.jsx`, état `locked`).
- **Mettre en avant le retour sur investissement** : « 1 croissant fidélisé par jour (1,20 €) rembourse Fidelyz. »

### 6.2 Rétention et churn

Le churn d'un outil de fidélité est surtout de l'**inactivité** : le commerçant n'envoie rien, ses clients oublient la carte, il résilie. Contre-mesures :

1. **Bilan mensuel automatique par e-mail** : « Ce mois-ci : 84 passages enregistrés, 12 récompenses, 31 clients revenus au moins 2 fois, +9 nouvelles cartes. » L'abonnement se justifie tout seul.
2. **Suggestions de campagnes** (calendrier : galette des rois, Saint-Valentin, fête des mères, rentrée…) avec texte prérempli, une par mois.
3. **Alerte d'inactivité** : aucun scan depuis 7 jours, donc e-mail puis appel. Cela révèle souvent un problème de caisse (personnel non formé, QR retiré).
4. **Parcours de résiliation** : proposer une **pause de 1 à 3 mois** (saisonniers, travaux) et une offre de rétention (−50 % pendant 2 mois) avant la résiliation définitive.
5. **SEPA et relances de paiement Stripe** (Smart Retries + e-mails) contre le churn involontaire.
6. **Annuel** : pousser à 30 % ou plus de la base ; le churn y est 3 à 4 fois plus faible.

---

## 7. Ce qui manque au produit pour vendre (audit du site et du parcours)

| # | Constat (fichier) | Risque / impact | Action |
|---|---|---|---|
| 1 | Statistiques inventées : « 2 400+ cartes actives », « 98 % satisfaits » (`Home.jsx`, section `stats`), « +38 % de visites récurrentes » (tuile `tile-chart`) | **Juridique** (pratique trompeuse) et **crédibilité** si un prospect demande des références | Retirer avant le lancement. Remplacer par des chiffres vrais (« prête en 5 min », « 0 appli à installer ») puis par des chiffres réels dès 3 mois. |
| 2 | Tuile « Notifications push : gratuites et illimitées » alors que l'offre gratuite n'en a pas | promesse non tenue, déception à l'inscription | « Sans SMS ni coût par envoi, dès l'offre Pro » |
| 3 | Pas de CGV ni de politique de confidentialité ; la case à cocher renvoie aux mentions légales (`ProSignup.jsx`, l. 175-178) | non-conformité (CGV B2B, RGPD art. 28 : contrat de sous-traitance), litiges de facturation | Rédiger CGV + politique de confidentialité + DPA ; 2 routes publiques ; case « J'accepte les CGV ». |
| 4 | Vidéo « Bientôt disponible · 2 min 30 » (`Home.jsx`, section `film-sec`) | bouton qui ne fait rien, perte de confiance | Masquer jusqu'à la livraison, ou mettre une vidéo de 45 s tournée au téléphone en boutique. |
| 5 | Aucune démo commerçant (`DemoClientAccess` sert à chercher son enseigne côté client final) | le prospect web ne peut pas « toucher » le produit | Bouton « **Recevoir une carte de démo sur mon téléphone** » (QR/lien vers une entreprise démo), et un compte démo en lecture seule. |
| 6 | Aucun témoignage ni logo client | pas de preuve sociale | Offre fondateurs en échange d'un témoignage (photo + citation + chiffre). |
| 7 | Pas de parcours de prise en main guidé | activation lente, churn d'essai | Liste en 5 étapes dans le tableau de bord : logo → paliers → imprimer le QR → ajouter sa propre carte → 1re campagne. Barre de progression. |
| 8 | Pas d'essai gratuit malgré la prise en charge technique (`stripeService.js` : `trialDays`) | conversion plus faible | Brancher `trial_period_days: 30` sur Pro. |
| 9 | Pas de PDF ou d'affiche QR imprimable prête à l'emploi (à vérifier dans `CardCustomizer`) | un QR mal affiché tue l'adoption en caisse | Générateur d'affiche A5/A6 « Votre carte de fidélité est dans votre téléphone » aux couleurs du commerçant. |
| 10 | Pas de chat ni de numéro d'assistance visible | les TPE achètent à quelqu'un, pas à un site | Bouton WhatsApp Business ou numéro et nom du fondateur en bas de page. |
| 11 | Écart entre la doc (`CLAUDE.md` : 48 h entre campagnes) et le code (`pushGuard.js` : 1 par jour) | incohérence des arguments de vente | Aligner la doc sur le code (1 par jour), à transmettre au conseil technique. |

---

## 8. Recommandations priorisées (impact / effort)

Échelle : impact sur le profit à 12 mois ; effort en jours-homme.

| Priorité | Action | Impact | Effort | Quand |
|---|---|---|---|---|
| **P0** | Retirer les statistiques inventées et corriger la tuile « notifications gratuites » | évite un risque juridique et de crédibilité | 0,25 j | **avant le lancement** |
| **P0** | CGV + politique de confidentialité + DPA, et case à cocher CGV | conformité, condition pour encaisser | 1 à 2 j (+ relecture juridique) | **avant le lancement** |
| **P0** | Afficher les prix **HT** (19 € HT / 39 € HT ; annuel « 2 mois offerts ») | **+20 % de revenu par abonné** | 0,5 j (prix Stripe + textes) | **avant le lancement** |
| **P1** | Essai Pro de 30 jours sans carte + 5 e-mails de relance | +30 à 50 % de payants | 1 à 2 j | semaine 1 |
| **P1** | Offre fondateurs (100 places, 14 € HT garantis 12 mois en annuel, ou 1er mois offert) contre témoignage | vitesse d'acquisition et preuve sociale | 0,5 j (code promo existant) | semaine 1 |
| **P1** | Kit terrain : chevalet QR, flyer, argumentaire, CRM simple (tableur ou HubSpot gratuit) | canal n°1 | 1 j + ~150 € d'impression | semaine 1 |
| **P1** | Liste de prise en main en 5 étapes + générateur d'affiche QR | activation, donc conversion | 2 à 3 j | semaines 2 à 3 |
| **P1** | Carte de démo « sur mon téléphone » sur la page d'accueil | conversion web | 0,5 à 1 j | semaine 2 |
| **P2** | Business au prix par établissement (+15 € HT au-delà de 2) | +revenu sur les réseaux | 1 à 2 j (Stripe, quantité par établissement) | mois 2 |
| **P2** | Bilan mensuel automatique par e-mail + alerte d'inactivité | churn −1 à −2 points par mois | 2 j | mois 2 |
| **P2** | Prélèvement SEPA + Smart Retries + parcours de résiliation (pause / offre) | churn involontaire −30 à −50 % | 1 à 2 j | mois 2 |
| **P2** | Programme partenaires (comptables, caisses, CCI) avec commission de 20 % | canal n°2, CAC le plus bas | 1 j + prospection | mois 2 et 3 |
| **P3** | « Propulsé par Fidelyz » sur l'offre gratuite + parrainage automatique | croissance virale | 1 à 2 j | mois 3 |
| **P3** | Pages SEO par métier + comparatifs | flux entrant durable | 3 à 5 j de contenu | mois 3 à 6 |
| **P3** | Kit caisse payant / installation clé en main | +5 à 10 % de revenu ponctuel | 0,5 j | mois 3 |
| **P4** | Différencier Business (2 notifications/jour, campagnes ciblées par segment ou établissement, relances automatiques) | ventes Business | 3 à 5 j | mois 4 à 6 |
| **P4** | Test de prix Pro à 24 € HT pour les nouveaux clients (si conversion > 25 % et churn < 3 %) | +25 % de revenu par nouvel abonné | 0,5 j (outil admin existant) | mois 6 |
| **P4** | Intégrations caisse, carte collective de ville, marque blanche agences | gros comptes | 10 j et plus | mois 6 à 12 |

---

## 9. Hypothèses et limites

- Les prix concurrents proviennent de comparateurs tiers et de résultats de recherche du 25/11/2026. **Les sites des éditeurs n'ont pas pu être consultés directement** (accès réseau limité dans cet environnement). Toute comparaison publiée doit être revérifiée sur les grilles officielles et datée.
- Taille du marché, churn, CAC, taux de conversion et coûts d'infrastructure sont des **estimations** fondées sur les ordres de grandeur habituels des SaaS pour TPE, pas sur des données Fidelyz (aucune donnée de production disponible).
- Les frais Stripe (1,5 % + 0,25 € pour les cartes de l'Espace économique européen, plus Stripe Billing) doivent être confirmés sur le contrat Stripe du compte.
- Le régime de TVA de l'éditeur (franchise ou assujetti) conditionne la recommandation HT/TTC.

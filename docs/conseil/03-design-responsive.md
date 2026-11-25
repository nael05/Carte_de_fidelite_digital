# 03 — Design UI/UX et responsive

*Conseil d'agents, rôle : designer UI/UX et responsive. Audit du 25/11/2026 sur le build de production (`vite preview`) et le backend de test.*

## Méthode

- Compte de test Business (« Boulangerie Dupont-Lefèvre & Fils », nom long volontaire), 5 clients dont un au nom long (« Jean-Christophe Bernard-Durand »), Master Admin du `.env.test`.
- Script Playwright (deviceScaleFactor 1) : **32 écrans × 5 largeurs (360, 390, 768, 1024, 1440) × 2 thèmes = 320 captures**, avant puis après corrections. L'accueil a été vérifié à part, écran par écran, en faisant défiler la page (ses animations se déclenchent au défilement).
- Écrans couverts : accueil, `/join/:id` (+ modale CGU), inscription, connexion, mot de passe oublié, réinitialisation, mentions légales, retour de paiement (succès / annulation), espace pro (Caisse, Clients, fiche client, Statistiques, Recruter, Ma carte, Campagnes, Business, Réglages et ses 5 sous-pages, Mon compte), connexion admin, admin (vue d'ensemble, commerces, statistiques, tarifs, codes promo, e-mails, mentions légales).
- Contrôles automatiques : débordement horizontal (`scrollWidth > innerWidth`), éléments hors écran, cibles tactiles < 44 px (largeurs ≤ 768), textes coupés sans points de suspension, modales qui dépassent, erreurs console. J'ai regardé moi-même les captures.

## Bilan chiffré (320 captures)

| Contrôle | Avant | Après |
|---|---|---|
| Débordement horizontal de page | 0 | 0 |
| Éléments sortant de l'écran | 0 | 0 |
| Modales qui dépassent | 0 | 0 |
| Cibles tactiles < 44 px (occurrences) | 1 087 | 138 (voir « Ce qui reste ») |
| Erreurs console | 291 (*) | 15 (**) |

(*) Presque toutes dues à la limite de requêtes de l'API (429) pendant ma première passe parallélisée : ce ne sont pas des bugs du frontend. Par contre, la page **plante en entier** (« PAGEERROR ») sur l'onglet Statistiques quand l'API répond 429 : à faire traiter par l'agent backend/front logique (voir plus bas).
(**) 10 × 503 `stripe_not_configured` sur Admin › Tarifs (attendu sans Stripe), 1 × 404 sur `/pro/checkout/cancel`, 4 × 500 passagers du backend.

**Bonne nouvelle : aucun débordement horizontal, sur aucune page, à aucune largeur.** La coquille (sidebar → barre d'onglets du bas), les grilles et les modales « feuille » sur mobile sont saines.

## Problèmes trouvés et corrigés

| # | Page / largeur | Problème | Correction | Captures |
|---|---|---|---|---|
| 1 | `/join/:id`, modale CGU, **thème clair**, toutes largeurs | Fond de la modale bleu-nuit codé en dur (`var(--bg-card, #1e2530)`, variable inexistante) avec titres en noir : **texte quasi illisible** sur la page que voient les clients finaux | Fond `--bg-elevated`, titre en `--text-primary`, bouton fermer 44 × 44 avec `aria-label`, boutons 46 px | `01-rgpd-modale-clair-360-avant/apres.png` |
| 2 | Clients, Caisse (recherche), Recruter (renvoi) — 360/390 | Noms longs **coupés net** sans « … » (texte brut dans un conteneur flex) | `.ui-row-title` en bloc quand il ne contient que du texte, nom enveloppé dans `.ui-row-name` à côté du badge « Opt-in refusé », place des points rendue au nom sur téléphone | `02-clients-noms-360-avant/apres.png` |
| 3 | Business — 360/390 | Onglet « Équipe » coupé (barre défilante sans indice visuel) | Onglets pleine largeur, sans icône, ≤ 480 px | `03-business-onglets-360-avant/apres.png` |
| 4 | Mon compte — 360/390 | Onglet « Suppression » invisible (même cause) | Idem | `04-compte-onglets-360-avant/apres.png` |
| 5 | Admin, barre du bas — 360 à 768 | 7 onglets : « E-mails » coupé, « Vue d'ensemble » sur 2 lignes | 5 onglets (Vue d'ensemble, Commerces, Statistiques, Tarifs, E-mails) ; Codes promo et **Mentions légales** (ajoutée : sur mobile, on ne l'atteignait qu'en faisant défiler la barre sans le savoir) dans les raccourcis de la vue d'ensemble ; libellés sur une ligne | `05-admin-barre-onglets-360-avant/apres.png` |
| 6 | Campagnes — toutes largeurs | Titre « Dernières campagnes » collé au bord de la carte (le style `.acc-table-head` n'était chargé qu'avec la page Compte) | Règle déplacée dans `app.css` | — |
| 7 | Mentions légales — thème clair | Page restée sombre (variables `--bg-main`/`--bg-card` inexistantes), titre dégradé blanc invisible, accent indigo hors charte | Jetons du thème (`--bg-app`, `--bg-surface`, `--bg-sidebar`, `--accent-text`) | — |
| 8 | Ma carte (aperçu Apple) — toutes largeurs | « POINTS96 » collés, nom du commerce sur 2 lignes qui déborde de l'en-tête, « Détails des récompenses » collé au bord (marge −15 px) | Points en colonne, nom tronqué comme dans Wallet, marge négative supprimée | — |
| 9 | Inscription / Mon compte (choix d'offre) — 1024/1440 | 3 offres sur 2 colonnes : « Business » orpheline à gauche | Requête de conteneur : la 3e carte prend toute la largeur quand il y a 2 colonnes | — |
| 10 | Tout l'espace pro/admin — mobile | Boutons ronds 36 px, boutons « sm » 34 px, retours 28 px, onglets 32 px, œil du mot de passe 36 px, boutons de l'historique 34 px… | Bloc « cibles tactiles » (≤ 800 px ou écran tactile ≤ 1024 px) : 44 px pour boutons icônes et boutons, 40 px pour segments et retours, zone de toucher élargie autour des interrupteurs ; même chose pour Auth, Historique, Stats, Personnalisation, Admin | — |
| 11 | Global — contraste | Texte tertiaire clair `#86868b` sur blanc = **3,6:1** ; tertiaire sombre `#6e6e73` sur `#1c1c1e` = **3,4:1** ; `--t3` de l'accueil 4,1:1 (sous AA 4,5:1) | Clair : secondaire `#636366` (5,5:1), tertiaire `#6e6e73` (4,7:1 sur `#f5f5f7`) ; sombre : tertiaire `#8e8e93` (5,2:1) ; accueil et pied de page Auth `#86868b` | — |

### Fichiers modifiés (CSS et JSX purement visuel)

- `frontend/src/index.css` : jetons de contraste
- `frontend/src/styles/app.css` : ellipse des titres de ligne, cibles tactiles, libellés de la barre d'onglets, `.acc-table-head`
- `frontend/src/pages/Join.jsx` : couleurs et tailles de la modale CGU (styles uniquement)
- `frontend/src/pages/ProDashboard.jsx` : `<span className="ui-row-name">` autour du nom du client
- `frontend/src/pages/AdminDashboard.jsx` : `tabbarIds` de la barre du bas et raccourci « Mentions légales »
- `frontend/src/pages/ProDashboard.css`, `ProAccount.css`, `AdminDashboard.css`, `Auth.css`, `Home.css`, `MentionsLegales.css`
- `frontend/src/components/CardCustomizer.css`, `PlanPicker.css`, `ProPanels.css`, `StatsPanel.css`, `HistoryModal.css`

`npm run build` passe.

## Ce qui reste (non corrigé, hors de mon périmètre ou à arbitrer)

1. **Onglet Statistiques : la page entière plante si une requête échoue** (`PAGEERROR Request failed with status code 429`). Il faut une gestion d'erreur dans `StatsPanel.jsx` : c'est de la logique, je n'y ai pas touché. **Priorité haute.**
2. **Mon compte sans Stripe** : le prix s'affiche « ▬ » et « Prochain renouvellement : — 0 ». Il faut un texte de repli (« Offre activée manuellement ») : c'est de la logique d'affichage liée aux données, à confier à l'agent front.
3. **`/pro/checkout/cancel`** déclenche un 404 sur l'API (console).
4. **Cibles restantes < 44 px** (138 occurrences, toutes acceptables ou mineures) : cases à cocher 16 px (elles sont dans un `<label>` cliquable), liens dans le texte (« CGU & Politique de confidentialité », « conditions et mentions légales », « Mot de passe oublié »), noms cliquables des commerces dans l'admin (20 px de haut), pastilles de couleur 32 px dans Ma carte, interrupteur iOS 51 × 31 (zone de toucher élargie par un pseudo-élément, que le script ne mesure pas).
5. **Bleu d'accent du thème sombre** (`#0a84ff`, le bleu système d'Apple) : texte blanc dessus = 3,65:1. C'est conforme pour un texte de 18,66 px gras ou plus, pas pour les boutons en 14-15 px. Pour passer en AA strict, prendre `#0071e3` pour le fond des boutons primaires en sombre. C'est un choix de marque : je ne l'ai pas changé.
6. Petites incohérences : Admin › Codes promo n'a pas de sur-titre (les autres pages en ont un) ; « Libellés (Labels) » dans Ma carte mélange les langues ; le placeholder « Récompense (ex : Café offert) » est coupé à 360 px ; la pastille « +20 points » du visuel de connexion recouvre l'étiquette « POINTS » de la carte d'illustration (1024 px et plus) ; « Mon compte » n'est pas surligné dans la barre latérale quand on est sur la page.
7. Le thème clair n'existe pas sur l'accueil ni sur le panneau visuel d'inscription/connexion, qui restent sombres. C'est voulu (identité visuelle), et c'est cohérent.
8. Le contenu de test des mentions légales (« CGU / x ») doit être remplacé avant la mise en ligne (admin › Mentions légales).

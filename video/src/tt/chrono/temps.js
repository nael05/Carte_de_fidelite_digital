// « Chrono » : instants clés (s), calés sur src/voix-chrono.json. La musique (126 BPM) part sur « chrono » (H.top).
export const DUREE_CHRONO = 23
export const BEAT = 60 / 126.25

export const H = {
  top: 2.645, // « Top chrono ! » : le drop, le chrono démarre
  un: 3.2, // étape 1
  logo: 3.97,
  couleurs: 4.42,
  deux: 5.2, // étape 2
  imprime: 6.2,
  trois: 7.5, // étape 3
  scan: 8.98,
  carte: 9.98,
  wallet: 11.45,
  bonus: 12.35,
  offre: 13.5,
  ecran: 15.05,
  stop: 15.95, // « Stop ! »
  fin: 18.95, // « Fidelyz »
}

// Coupes : une traînée de néon balaie l'écran à chaque changement de plan
export const COUPES = [H.un, H.deux, H.trois, H.bonus, H.stop, H.fin]

// Temps affiché par le chrono (accéléré) : 0 avant « top », 4 min 47 s 32 au « Stop »
export const CHRONO_FINAL = 4 * 60 + 47.32
export const affiche = t => (t < H.top ? 0 : Math.min(CHRONO_FINAL, ((t - H.top) / (H.stop - H.top)) * CHRONO_FINAL))

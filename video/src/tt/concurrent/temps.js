// « Ton concurrent » : grille du phonk (137,75 BPM). La musique est remontée mesure par mesure
// (scripts/mix-tt.mjs concurrent) : mesure n à BAR0 + n × BAR, break sur « Son secret ? », retour sur « Fidelyz ».
export const BAR = 1.7423
export const BEAT = BAR / 4
export const BAR0 = 0.05
export const bar = n => BAR0 + n * BAR
export const DUREE_CC = bar(14) // 24,44 s

// Plans (début de chaque plan, en s)
export const P = {
  hook: 0,
  comment: 2.72, // « Comment il fait ? »
  un: 4.4, // « Un » : le 1 traverse l'écran
  tiroir: 6.98, // « Pas dans un tiroir »
  deux: 8.22,
  trois: 12.02,
  secret: bar(9), // 15,73 : break
  fidelyz: bar(10), // 17,47 : drop
  atouts: 18.4,
  fin: 21.35,
}

// Palette
export const VIOLET = '#5b21ff'
export const LIME = '#c8ff2e'
export const PINK = '#ff2e93'
export const CREAM = '#fff4e0'

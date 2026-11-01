/* Grille rythmique de la version verticale, calée sur la musique montée par scripts/mix-tiktok.mjs :
   150 BPM (une mesure = 1,6 s), premier temps de mesure sur « push » à 16,88 s. */
export const RYTHME = {
  bpm: 150,
  offset: 16.88, // un premier temps de mesure
  // Passages où l'image « pulse » sur la grosse caisse
  groove: [
    [4.08, 15.28],
    [16.88, 26.48],
    [28.08, 31.3],
  ],
  // Temps forts (drops) : coup de zoom plus marqué
  drops: [4.08, 16.88, 28.08],
}

/* Pulsation de l'image : petit coup de zoom sur chaque temps, plus fort sur le premier temps de la mesure
   et sur les temps forts. Renvoie un facteur d'échelle (1 = au repos). */
export const pulse = t => {
  const beat = 60 / RYTHME.bpm
  let k = 0
  if (RYTHME.groove.some(([a, b]) => t >= a && t < b)) {
    const x = t - RYTHME.offset
    const n = Math.floor(x / beat + 1e-6)
    const since = x - n * beat
    const strong = ((n % 4) + 4) % 4 === 0 ? 1.8 : 1
    k += 0.011 * strong * Math.exp(-since * 11)
  }
  for (const d of RYTHME.drops) if (t >= d && t < d + 0.5) k += 0.05 * Math.exp(-(t - d) * 7)
  return 1 + k
}

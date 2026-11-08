import TEXTES from './textes.json'
import DATA from './voix-data.json'

/* Timeline calée sur la voix.
   textes.json : { video: { voix, lignes: [{ id, text, say?, pause?, gap? }] } }
   voix-data.json (écrit par scripts/campagne/voix.mjs) : { id: { dur, lead, words: [t…] } }
   Sans voix générée, la durée et l'instant des mots sont estimés (débit d'une voix off française).
   Chaque réplique suit la précédente : `pause` = silence avant, `gap` = silence après (0,25 s par défaut). */

const CPS = 15.5 // caractères par seconde
const estimate = s => s.length / CPS + 0.2

export const cues = (video, start = 0.35) => {
  const lignes = TEXTES[video].lignes
  const out = {}
  let t = start
  for (const l of lignes) {
    t += l.pause ?? 0
    if (l.at != null) t = l.at
    const words = l.text.split(' ')
    const d = DATA[l.id]
    const dur = d ? d.dur : estimate(l.say ?? l.text)
    let wt
    if (d && d.words.length === words.length) wt = d.words
    else {
      // instants proportionnels à la longueur des mots
      const total = words.reduce((s, w) => s + w.length + 1, 0)
      let acc = 0
      wt = words.map(w => { const v = (acc / total) * dur * 0.95; acc += w.length + 1; return v })
    }
    out[l.id] = { id: l.id, at: t, dur, lead: d?.lead ?? 0, voice: !!d, text: l.text, words: words.map((w, i) => ({ w, t: wt[i] })) }
    t += dur + (l.gap ?? 0.25)
  }
  out.$end = t
  out.$list = lignes.map(l => out[l.id])
  return out
}
/* Instant (s) du n-ième mot d'une réplique */
export const W = (q, id, n = 0) => q[id].at + q[id].words[Math.min(n, q[id].words.length - 1)].t
export const fin = (q, id) => q[id].at + q[id].dur
export const hasVoice = video => TEXTES[video].lignes.every(l => DATA[l.id])

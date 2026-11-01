import { C, fontFamily, inE, outE, springy, ts } from '../lib'
import { Pop } from '../tiktok/kit'

/* Éléments communs de la vidéo explicative (1080 × 1920).
   Zones sûres TikTok : texte important entre y = 120 et y = 1500, rien sous la colonne des boutons à droite. */

export const RED = '#ff5a4e'

/* Sous-titre cinétique (mots calés sur la voix, mot prononcé surligné) */
export const Cap = ({ id, only, out, top = 150, size = 92, accent, lead, highlight }) => (
  <div style={{ position: 'absolute', top, left: 0, width: '100%', display: 'flex', justifyContent: 'center', zIndex: 60 }}>
    <Pop id={id} only={only} size={size} out={out} accent={accent} lead={lead} highlight={highlight} maxWidth={940} />
  </div>
)

/* Pastille d'étape (« ÉTAPE 1 ») */
export const StepBadge = ({ t, at, out, n, label }) => {
  const a = springy(t, at, 2.2, 10)
  const o = out == null ? 1 : 1 - ts(t, out, out + 0.2)
  if (t < at || o <= 0) return null
  return (
    <div style={{ position: 'absolute', top: 74, left: 0, width: '100%', display: 'flex', justifyContent: 'center', zIndex: 61, opacity: o }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 26px 10px 10px', borderRadius: 999, background: 'rgba(41,151,255,0.14)', border: '1.5px solid rgba(41,151,255,0.45)', fontFamily, fontSize: 30, fontWeight: 700, color: C.text, letterSpacing: '0.02em', transform: `scale(${Math.max(0, Math.min(1.08, a))})` }}>
        <span style={{ width: 46, height: 46, borderRadius: 23, background: C.blueBtn, display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 800 }}>{n}</span>
        {label}
      </div>
    </div>
  )
}

/* Coup de fouet horizontal entre deux plans : la scène sortante file, floue, la suivante arrive */
export const whipOut = (t, at, dir = -1, dur = 0.22) => {
  const p = ts(t, at, at + dur, 0, 1, inE)
  return p > 0 ? { transform: `translateX(${dir * 1300 * p}px)`, filter: `blur(${36 * p}px)` } : {}
}
export const whipIn = (t, at, dir = -1, dur = 0.32) => {
  const p = 1 - ts(t, at, at + dur, 0, 1, outE)
  return p > 0 ? { transform: `translateX(${-dir * 1300 * p}px)`, filter: `blur(${36 * p}px)` } : {}
}

/* Zoom de caméra autour d'un point (px, py) de l'image, qui se recentre au fur et à mesure */
export const zoomAt = (px, py, s, center = 1) => ({
  transformOrigin: `${px}px ${py}px`,
  transform: `translate(${(540 - px) * center}px, ${(960 - py) * center}px) scale(${s})`,
})

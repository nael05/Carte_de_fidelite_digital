import { Img, staticFile } from 'remotion'
import { fontFamily, springy, ts } from '../lib'
import RECTS from './rects.json'

/* Téléphone et écrans de l'application.
   Les écrans sont des captures du vrai site (frontend lancé en local avec des données de démonstration,
   voir README) : page entière sans les barres fixes, barre du haut et barre d'onglets à part,
   et captures de la fenêtre pour les fenêtres modales. Les positions des éléments sont dans rects.json
   (pixels CSS d'un écran de 390 × 844). */

export { RECTS }
export const VW = 390 // largeur CSS de l'écran capturé
export const VH = 844 // hauteur de la fenêtre du navigateur
export const STATUS = 44 // barre d'état du téléphone, au-dessus de la page
export const BEZEL = 12
export const DW = VW + 2 * BEZEL
export const DH = VH + STATUS + 2 * BEZEL

const src = name => staticFile(`explication/ecrans/${name}.png`)

/* Position à l'écran (1080 × 1920) d'un point de la page, pour un téléphone placé en (x, y) au facteur k */
export const devPoint = ({ x, y, k }, px, py, scroll = 0) => ({
  x: x - (DW * k) / 2 + (BEZEL + px) * k,
  y: y + (BEZEL + STATUS + py - scroll) * k,
})

/* Défilement qui centre un élément de la page dans la fenêtre */
export const scrollTo = (name, rect, offset = 0) => {
  const r = RECTS[name][rect] ?? rect
  const max = RECTS[name].height - VH
  return Math.max(0, Math.min(max, r.y + r.h / 2 - VH / 2 + offset))
}

const StatusBar = ({ color = '#fff', bg = '#000' }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: VW, height: STATUS, background: bg, fontFamily, color, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 30px 0 34px', boxSizing: 'border-box', zIndex: 5 }}>
    <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em' }}>9:41</span>
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="18" height="11" viewBox="0 0 18 11">{[0, 1, 2, 3].map(i => <rect key={i} x={i * 4.6} y={8 - i * 2.6} width="3.2" height={3 + i * 2.6} rx="0.8" fill={color} />)}</svg>
      <svg width="16" height="11" viewBox="0 0 16 11"><path d="M8 10.5 5.6 8a3.4 3.4 0 0 1 4.8 0zM3.6 6a6.2 6.2 0 0 1 8.8 0l-1.3 1.3a4.4 4.4 0 0 0-6.2 0zM1.3 3.7a9.4 9.4 0 0 1 13.4 0L13.4 5a7.6 7.6 0 0 0-10.8 0z" fill={color} /></svg>
      <svg width="27" height="12" viewBox="0 0 27 12"><rect x="0.5" y="0.5" width="23" height="11" rx="3.4" fill="none" stroke={color} strokeOpacity="0.4" /><rect x="2" y="2" width="20" height="8" rx="2" fill={color} /><rect x="24.6" y="4" width="1.6" height="4" rx="0.8" fill={color} fillOpacity="0.45" /></svg>
    </span>
  </div>
)

/* Le téléphone : (x, y) = centre haut, k = facteur d'échelle, rotations en degrés */
/* full : le contenu passe aussi sous la barre d'état (écran verrouillé) */
export const Device = ({ x = 540, y = 300, k = 1.4, rx = 0, ry = 0, rz = 0, opacity = 1, children, statusBg = '#000', statusColor = '#fff', shadow = 1, full = false, style }) => (
  <div style={{ position: 'absolute', left: x - (DW * k) / 2, top: y, width: DW, height: DH, transformOrigin: '0 0', transform: `scale(${k})`, opacity, ...style }}>
    <div style={{ width: DW, height: DH, transform: `perspective(1800px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`, transformStyle: 'preserve-3d' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 62, background: 'linear-gradient(135deg, #8e8e93 0%, #2c2c2e 22%, #58585d 50%, #1c1c1e 78%, #8e8e93 100%)', boxShadow: `0 ${50 * shadow}px ${110 * shadow}px -30px rgba(0,0,0,${0.9 * shadow}), inset 0 0 0 1.2px rgba(255,255,255,0.3)` }} />
      <div style={{ position: 'absolute', inset: 3, borderRadius: 59, background: '#050505' }} />
      <div style={{ position: 'absolute', left: BEZEL, top: BEZEL, width: VW, height: VH + STATUS, borderRadius: 50, overflow: 'hidden', background: '#000', isolation: 'isolate' }}>
        <div style={{ position: 'absolute', left: 0, top: full ? 0 : STATUS, width: VW, height: full ? VH + STATUS : VH, overflow: 'hidden' }}>{children}</div>
        <StatusBar bg={full ? 'transparent' : statusBg} color={statusColor} />
        <div style={{ position: 'absolute', left: VW / 2 - 62, top: 11, width: 124, height: 35, borderRadius: 18, background: '#000', zIndex: 9 }} />
      </div>
    </div>
  </div>
)

/* Page de l'application qui défile, avec ses barres fixes.
   layers : autres captures de la même page par-dessus (fondus, texte saisi), avec opacité et découpe éventuelle.
   view : capture de la fenêtre (fenêtre modale, notification) par-dessus tout, avec son opacité. */
export const AppScreen = ({ page, scroll = 0, bars = page, layers = [], view, reveal = 1 }) => {
  const r = RECTS[page]
  const b = RECTS[bars] ?? {}
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: VW, transform: `translateY(${-scroll}px)` }}>
        <Img src={src(page)} style={{ display: 'block', width: VW, height: r.height }} />
        {layers.map((l, i) => (l.opacity ?? 1) > 0 && (
          <Img key={i} src={src(l.page)} style={{ position: 'absolute', left: 0, top: 0, width: VW, height: RECTS[l.page].height, opacity: l.opacity ?? 1, clipPath: l.clip }} />
        ))}
      </div>
      {b.top && <Img src={src(`${bars}-top`)} style={{ position: 'absolute', left: 0, top: 0, width: VW, height: b.top }} />}
      {b.tab && <Img src={src(`${bars}-tab`)} style={{ position: 'absolute', left: 0, top: VH - b.tab, width: VW, height: b.tab }} />}
      {view && (view.opacity ?? 1) > 0 && (
        <Img src={src(view.page)} style={{ position: 'absolute', left: 0, top: 0, width: VW, height: VH, opacity: view.opacity ?? 1, clipPath: view.clip }} />
      )}
      {reveal < 1 && <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: 1 - reveal }} />}
    </div>
  )
}

/* Découpe d'un champ de saisie qui se remplit de gauche à droite (texte tapé) */
export const typeClip = (rect, p, pageH) => {
  const right = VW - (rect.x + rect.w * p)
  return `inset(${rect.y}px ${right}px ${pageH - rect.y - rect.h}px ${rect.x}px)`
}

/* Fenêtre modale qui monte du bas : découpe de la capture au-dessus de `top` */
export const sheetClip = (top, p) => `inset(${top + (VH - top) * (1 - p)}px 0 0 0)`

/* Doigt qui tape : rond qui s'enfonce puis onde (coordonnées de la page, dans l'écran) */
export const Tap = ({ t, at, x, y, scroll = 0 }) => {
  const pre = ts(t, at - 0.35, at - 0.05)
  const post = ts(t, at, at + 0.45)
  if (t < at - 0.35 || t > at + 0.5) return null
  const press = t < at ? pre : 1 - post
  return (
    <div style={{ position: 'absolute', left: x, top: y - scroll, width: 0, height: 0, zIndex: 20 }}>
      <div style={{ position: 'absolute', left: -26, top: -26, width: 52, height: 52, borderRadius: 26, background: 'rgba(255,255,255,0.35)', border: '2px solid rgba(255,255,255,0.85)', boxShadow: '0 6px 20px rgba(0,0,0,0.4)', transform: `scale(${0.6 + 0.4 * press - (t > at ? 0.15 * post : 0)})`, opacity: t < at ? pre : 1 - post }} />
      {t >= at && <div style={{ position: 'absolute', left: -60 * post - 14, top: -60 * post - 14, width: 28 + 120 * post, height: 28 + 120 * post, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.8)', opacity: 1 - post }} />}
    </div>
  )
}

/* Cadre lumineux autour d'un élément de la page */
export const Focus = ({ t, at, out = at + 1, rect, scroll = 0, color = '#2997ff', pad = 6, radius = 14 }) => {
  const a = springy(t, at, 2.2, 10)
  const o = 1 - ts(t, out, out + 0.25)
  if (t < at || o <= 0) return null
  return (
    <div style={{ position: 'absolute', left: rect.x - pad, top: rect.y - pad - scroll, width: rect.w + 2 * pad, height: rect.h + 2 * pad, borderRadius: radius, border: `3px solid ${color}`, boxShadow: `0 0 0 ${8 * (1 - Math.min(1, a))}px ${color}55, 0 0 30px ${color}88`, transform: `scale(${1.25 - 0.25 * Math.min(1.1, a)})`, opacity: o * Math.min(1, a * 2), zIndex: 15 }} />
  )
}

import * as THREE from 'three'
import { useEffect, useMemo, useState } from 'react'
import { ThreeCanvas } from '@remotion/three'
import { AbsoluteFill, Audio, Img, continueRender, delayRender, staticFile, useVideoConfig } from 'remotion'
import { Environment, Lightformer } from '@react-three/drei'
import { displayTokens, fontFamily, getCue } from '../lib'
import { Cam, Card, PHONE_H, PHONE_W, RenderOnMount, clamp, easeInOut, easeOut, mix, pr, useFaceGeometry, useSlabGeometry } from '../tt/kit3d'

/* Série « Studio » (PLAN-TIKTOK.md) : kit commun aux huit vidéos.
   Studio sombre, une seule couleur d'accent, typographie Inter serrée, transitions lentes (fondu flouté, balayage de lumière).
   Tout dépend du temps t (s) : chaque image se rend seule. */

export const ACCENT = '#2997ff'
export const INK = '#f5f5f7'
export const MUTED = 'rgba(245, 245, 247, 0.5)'
export { clamp, easeInOut, easeOut, mix, pr }
export const W = (id, n = 0) => {
  const c = getCue(id)
  return c.at + Math.max(0, c.words[Math.min(n, c.words.length - 1)].t)
}
export const END = id => {
  const c = getCue(id)
  return c.at + c.dur
}
// Courbe « Apple » : départ franc, arrivée très douce
export const silk = k => (k >= 1 ? 1 : 1 - Math.pow(1 - clamp(k), 4))

// ─── Textures (préchargées avant la première image) ───────────
// « pass-graphite » → public/tt/tex/pass-graphite.png ; « ecran:caisse » → public/explication/ecrans/caisse.png
const urlOf = n => (n.startsWith('ecran:') ? staticFile(`explication/ecrans/${n.slice(6)}.png`) : n.endsWith('.png') ? staticFile(n) : staticFile(`tt/tex/${n}.png`))
const cache = new Map()
const load = n =>
  new Promise((resolve, reject) => {
    const t = new THREE.TextureLoader().load(urlOf(n), () => resolve(t), undefined, () => reject(new Error('texture introuvable : ' + n)))
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    cache.set(n, t)
  })
let pending = null
export const usePreload = names => {
  const [handle] = useState(() => delayRender('Textures de la série'))
  const [ready, setReady] = useState(false)
  useEffect(() => {
    pending = Promise.all(names.filter(n => !cache.has(n)).map(load))
    pending.then(() => setReady(true))
  }, [])
  useEffect(() => {
    if (ready) continueRender(handle)
  }, [ready, handle])
  return ready
}
export const tex = n => cache.get(n)

/* Capture d'écran longue vue dans un téléphone : fenêtre qui commence à `top` (en pixels de la capture) */
const windows = new Map()
export const screenTex = (n, top = 0, key = '') => {
  const base = cache.get(n)
  if (!base?.image) return base
  const k = n + key
  if (!windows.has(k)) {
    const c = base.clone()
    c.needsUpdate = true
    windows.set(k, c)
  }
  const c = windows.get(k)
  const { width, height } = base.image
  const view = Math.min(height, width * ((PHONE_H - 0.07) / (PHONE_W - 0.07)))
  const y = clamp(top, 0, height - view)
  c.repeat.set(1, view / height)
  c.offset.set(0, 1 - (y + view) / height)
  return c
}

// ─── Scène 3D ─────────────────────────────────────────────────
/* Éclairage de studio : grande boîte à lumière au-dessus, deux bandes latérales (liserés sur les tranches) */
export const Studio = ({ key2 = 1, warm = false }) => (
  <>
    <ambientLight intensity={0.25} />
    <directionalLight position={[2.5, 5, 4]} intensity={1.4 * key2} />
    <directionalLight position={[-4, 1, -2]} intensity={0.9} color={warm ? '#ffd9b0' : '#cfe3ff'} />
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={2.6} position={[0, 5, 2]} rotation-x={Math.PI / 2} scale={[9, 3, 1]} />
      <Lightformer form="rect" intensity={2.2} position={[-5, 0.5, 1]} rotation-y={Math.PI / 2} scale={[1.2, 9, 1]} />
      <Lightformer form="rect" intensity={2.2} position={[5, 0.5, 1]} rotation-y={-Math.PI / 2} scale={[1.2, 9, 1]} />
      <Lightformer form="rect" intensity={0.6} position={[0, 0, 7]} scale={[7, 7, 1]} />
    </Environment>
  </>
)

/* Canevas 3D transparent (le fond est dessiné en dessous, en DOM) */
export const Stage = ({ children, fov = 30, warm }) => {
  const { width, height } = useVideoConfig()
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov, near: 0.4, far: 60, position: [0, 0, 6] }} gl={{ antialias: true, alpha: true }}>
      <Studio warm={warm} />
      {children}
      <RenderOnMount />
    </ThreeCanvas>
  )
}
export { Cam }

/* Téléphone en titane : châssis, verre, écran (texture) qui s'allume (glow 0 → 1), boutons latéraux */
export const Phone = ({ screen, body = '#2c2c2e', glow = 1, android = false, children, ...props }) => {
  const slab = useSlabGeometry(PHONE_W, PHONE_H, 0.15, 0.075, 0.028)
  const glass = useFaceGeometry(PHONE_W - 0.05, PHONE_H - 0.05, 0.13)
  const disp = useFaceGeometry(PHONE_W - 0.07, PHONE_H - 0.07, 0.12)
  const island = useFaceGeometry(0.27, 0.075, 0.0375)
  const g = clamp(glow, 0, 1.5)
  return (
    <group {...props}>
      <mesh geometry={slab}>
        <meshPhysicalMaterial color={body} metalness={0.92} roughness={0.3} clearcoat={0.5} />
      </mesh>
      {[[0.5, 0.42, 0.16], [-0.5, 0.5, 0.09], [-0.5, 0.33, 0.16], [-0.5, 0.13, 0.16]].map(([x, y, h], i) => (
        <mesh key={i} position={[x * (PHONE_W + 0.012), y, 0]}>
          <boxGeometry args={[0.014, h, 0.03]} />
          <meshPhysicalMaterial color={body} metalness={0.95} roughness={0.25} />
        </mesh>
      ))}
      <mesh geometry={glass} position-z={0.061}>
        <meshPhysicalMaterial color="#010102" roughness={0.04} clearcoat={1} clearcoatRoughness={0.02} metalness={0.3} />
      </mesh>
      {screen && g > 0.001 && (
        <mesh geometry={disp} position-z={0.068} renderOrder={2}>
          <meshBasicMaterial map={screen} toneMapped={false} transparent opacity={Math.min(1, g * 1.4)} color={new THREE.Color(g, g, g)} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
        </mesh>
      )}
      {android ? (
        <mesh position={[0, PHONE_H / 2 - 0.09, 0.072]} renderOrder={3}>
          <circleGeometry args={[0.028, 24]} />
          <meshBasicMaterial color="#000" polygonOffset polygonOffsetFactor={-6} polygonOffsetUnits={-6} />
        </mesh>
      ) : (
      <mesh geometry={island} position={[0, PHONE_H / 2 - 0.1, 0.072]} renderOrder={3}>
        <meshBasicMaterial color="#000" polygonOffset polygonOffsetFactor={-6} polygonOffsetUnits={-6} />
      </mesh>
      )}
      {children}
    </group>
  )
}

/* Pass Wallet (recto texturé, tranche sombre) */
export const Pass = ({ map, back, opacity = 1, ...props }) => <Card front={map} back={back} opacity={opacity} gloss={1} edge="#1a1a1c" {...props} />

/* Panneau plat texturé (notification, page de site…) */
export const Plate = ({ map, w, h, r = 0.04, opacity = 1, ...props }) => {
  const g = useFaceGeometry(w, h, r)
  return (
    <mesh geometry={g} {...props}>
      <meshBasicMaterial map={map} transparent opacity={opacity} toneMapped={false} depthWrite={opacity >= 1} />
    </mesh>
  )
}

// ─── DOM ──────────────────────────────────────────────────────
/* Fond de studio : noir profond, halo doux derrière le sujet (x, y en %), teinte facultative */
export const Backdrop = ({ x = 50, y = 46, glow = 1, tint = '40, 44, 52' }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 75% 45% at ${x}% ${y}%, rgba(${tint}, ${0.55 * glow}) 0%, rgba(${tint}, ${0.18 * glow}) 45%, rgba(0,0,0,0) 75%), #000`,
    }}
  />
)

/* Voile sombre en haut de l'image : les légendes restent lisibles sur n'importe quel fond */
export const Scrim = ({ k = 1, h = 38 }) => <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,${0.75 * k}) 0%, rgba(0,0,0,${0.45 * k}) ${h * 0.55}%, transparent ${h}%)`, pointerEvents: 'none' }} />

/* Grain de film et vignette, très légers */
export const Finish = ({ t, vignette = 0.55 }) => {
  const seed = Math.floor(t * 30) % 8
  return (
    <>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 70% at 50% 48%, transparent 55%, rgba(0,0,0,${vignette}) 100%)`, pointerEvents: 'none' }} />
      <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: 'overlay' }}>
        <svg width="100%" height="100%">
          <filter id={`g${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#g${seed})`} />
        </svg>
      </AbsoluteFill>
    </>
  )
}

/* Plan : monté entre a et b + out. Entrée en fondu flouté (le plan précédent reste dessous et se floute en sortant). */
export const Shot = ({ t, a, b, inT = 0.7, outT = 0.7, zoom = 0.04, children, style }) => {
  if (t < a - 0.001 || t > b + outT) return null
  const i = a <= 0 ? 1 : silk((t - a) / inT)
  const o = pr(t, b, b + outT, easeInOut)
  return (
    <AbsoluteFill
      style={{
        opacity: i,
        filter: i < 0.999 || o > 0.001 ? `blur(${(1 - i) * 22 + o * 16}px)` : undefined,
        transform: `scale(${1 + (1 - i) * zoom + o * zoom * 1.2})`,
        ...style,
      }}
    >
      {children}
    </AbsoluteFill>
  )
}

/* Balayage de lumière diagonal (masque une coupe) */
export const Sweep = ({ t, at, dur = 0.8, strength = 0.5, angle = 112 }) => {
  const k = (t - at) / dur
  if (k < 0 || k > 1) return null
  const x = mix(-40, 140, easeInOut(k))
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, transparent ${x - 18}%, rgba(255,255,255,${strength * 0.5}) ${x - 4}%, rgba(255,255,255,${strength}) ${x}%, rgba(255,255,255,${strength * 0.5}) ${x + 4}%, transparent ${x + 18}%)`,
        mixBlendMode: 'screen',
        pointerEvents: 'none',
      }}
    />
  )
}

/* Légende calée sur la voix : chaque mot se pose en sortant du flou au moment où il est prononcé.
   accent : indices des mots en bleu ; from/to : mots affichés ; out : instant de sortie */
export const Caption = ({ t, id, top = 250, size = 70, weight = 600, accent = [], from = 0, to, out, color = INK, align = 'center', left = 90, right = 90, lead = 0.05, tokens, style }) => {
  const cue = getCue(id)
  const toks = tokens ?? displayTokens(cue)
  const last = to ?? toks.length - 1
  const end = out ?? cue.at + cue.dur + 0.35
  if (t < cue.at + Math.max(0, cue.words[from].t) - lead - 0.05 || t > end + 0.5) return null
  const o = pr(t, end, end + 0.45, easeInOut)
  return (
    <div
      style={{
        position: 'absolute',
        left,
        right,
        top,
        textAlign: align,
        fontFamily,
        fontWeight: weight,
        fontSize: size,
        lineHeight: 1.1,
        letterSpacing: '-0.035em',
        color,
        opacity: 1 - o,
        filter: o > 0.001 ? `blur(${o * 12}px)` : undefined,
        transform: `translateY(${-o * 18}px)`,
        textShadow: '0 2px 30px rgba(0,0,0,0.45)',
        ...style,
      }}
    >
      {toks.map((w, i) => {
        if (i < from || i > last) return null
        const wt = cue.words[Math.min(i, cue.words.length - 1)].t
        const at = cue.at + Math.max(0, wt) - lead
        const p = silk((t - at) / 0.5)
        return (
          <span key={i} style={{ display: 'inline-block', whiteSpace: 'pre', opacity: p, filter: p < 0.999 ? `blur(${(1 - p) * 10}px)` : undefined, transform: `translateY(${(1 - p) * 14}px)`, color: accent.includes(i) ? ACCENT : undefined }}>
            {w}
            {i < last ? ' ' : ''}
          </span>
        )
      })}
    </div>
  )
}

/* Petit titre en capitales espacées, avec un filet qui s'allonge */
export const Kicker = ({ t, at, out, text, top = 190, color = MUTED }) => {
  const k = silk((t - at) / 0.7)
  const o = out == null ? 0 : pr(t, out, out + 0.4, easeInOut)
  if (t < at || o >= 1) return null
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, opacity: k * (1 - o), fontFamily }}>
      <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '0.32em', color, textTransform: 'uppercase', transform: `translateY(${(1 - k) * 10}px)` }}>{text}</div>
      <div style={{ width: 90 * k, height: 2, background: color, borderRadius: 1 }} />
    </div>
  )
}

/* Plan de fin : logo, nom, accroche, « Lien en bio ». Le noir de fin raccorde avec la première image (boucle). */
export const EndCard = ({ t, at, line = 'Fais revenir tes clients.', cta = 'Lien en bio', dur }) => {
  if (t < at - 0.05) return null
  const k = silk((t - at) / 1.1)
  const w = silk((t - at - 0.35) / 0.9)
  const l = silk((t - at - 0.75) / 0.9)
  const p = silk((t - at - 1.15) / 0.8)
  const glow = 0.5 + 0.5 * Math.sin((t - at) * 1.6)
  const fade = dur ? pr(t, dur - 0.5, dur, easeInOut) : 0
  return (
    <AbsoluteFill style={{ background: '#000', opacity: clamp((t - at) / 0.6), fontFamily, alignItems: 'center' }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 60% 30% at 50% 40%, rgba(41,151,255,${0.1 + glow * 0.05}) 0%, transparent 70%)` }} />
      <div style={{ position: 'absolute', top: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 1 - fade }}>
        <Img src={staticFile('logo-fidelyz.png')} style={{ width: 200, height: 200, borderRadius: 46, opacity: k, transform: `scale(${mix(0.86, 1, k)})`, filter: `blur(${(1 - k) * 14}px)`, boxShadow: `0 30px 90px -20px rgba(41,151,255,${0.35 * k})` }} />
        <div style={{ marginTop: 56, fontSize: 132, fontWeight: 650, letterSpacing: '-0.055em', color: INK, opacity: w, transform: `translateY(${(1 - w) * 24}px)`, filter: `blur(${(1 - w) * 10}px)` }}>Fidelyz</div>
        <div style={{ marginTop: 18, fontSize: 52, fontWeight: 500, letterSpacing: '-0.03em', color: MUTED, opacity: l, transform: `translateY(${(1 - l) * 18}px)` }}>{line}</div>
        {cta && (
          <div style={{ marginTop: 70, fontSize: 40, fontWeight: 600, color: INK, padding: '20px 50px', borderRadius: 999, border: '2px solid rgba(245,245,247,0.35)', opacity: p, transform: `scale(${mix(0.9, 1, p)})` }}>{cta}</div>
        )}
      </div>
    </AbsoluteFill>
  )
}

/* Bande-son de la vidéo (public/tt/mix-<set>.wav, scripts/mix-tt.mjs) */
export const Sound = ({ set, son }) => (son ? <Audio src={staticFile(`tt/mix-${set}.wav`)} /> : null)

/* Chiffre qui défile (compteur de points) */
export const Counter = ({ from, to, k, style }) => <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{Math.round(mix(from, to, clamp(k)))}</span>

export const useOnce = (f, deps) => useMemo(f, deps)

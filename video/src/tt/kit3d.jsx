import * as THREE from 'three'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { continueRender, delayRender, staticFile } from 'remotion'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

/* Outils 3D communs aux trois TikToks (three.js via @remotion/three).
   Unités : une carte Wallet fait 1 × 1,58 ; un téléphone 0,98 × 2. Tout est calculé à partir du temps t (s),
   jamais d'animation interne : chaque image se rend seule, dans n'importe quel ordre. */

// ─── Maths ───────────────────────────────────────────────────
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x))
export const mix = (a, b, k) => a + (b - a) * k
export const smooth = k => k * k * (3 - 2 * k)
export const easeOut = k => 1 - Math.pow(1 - clamp(k), 3)
export const easeIn = k => Math.pow(clamp(k), 3)
export const easeInOut = k => (k = clamp(k), k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)
export const expoOut = k => (k >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(k)))
// progression 0 → 1 entre a et b, avec courbe
export const pr = (t, a, b, ease = easeOut) => ease(clamp((t - a) / (b - a)))
// ressort amorti : dépasse puis revient
export const spring = (t, a, f = 1.6, d = 6) => (t <= a ? 0 : 1 - Math.exp(-d * (t - a)) * Math.cos(2 * Math.PI * f * (t - a)))
// bruit pseudo-aléatoire déterministe
export const rnd = i => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
export const noise1 = x => {
  const i = Math.floor(x)
  const f = x - i
  return mix(rnd(i), rnd(i + 1), smooth(f)) * 2 - 1
}

// ─── Textures ────────────────────────────────────────────────
// Images de public/tt/tex (scripts/textures-tt.mjs), chargées une fois pour toutes avant la première image :
// usePreloadTextures() dans le composant de la vidéo (hors du canevas) renvoie true quand elles sont prêtes :
// le canevas n'est monté qu'à ce moment-là, sinon sa première image part avec des textures vides.
const TEXTURES = ['couche-details', 'couche-fond-azur', 'couche-fond-champagne', 'couche-fond-ivory', 'couche-fond', 'couche-logo', 'couche-points-500', 'couche-points', 'lock-concurrent', 'lock-offre', 'lock-proche', 'lock-retour', 'lock-toi', 'lock-vide', 'notif-concurrent', 'notif-offre', 'notif-retour', 'notif-toi', 'papier', 'pass-azur', 'pass-back', 'pass-champagne', 'pass-graphite-500', 'pass-graphite', 'pass-ivory', 'toast', 'wallet', 'logo-fidelyz.png']
const texUrl = n => (n.includes('.') ? staticFile(n) : staticFile(`tt/tex/${n}.png`))
const texCache = new Map()
const loadTex = n => {
  if (!texCache.has(n)) {
    const t = new THREE.TextureLoader().load(texUrl(n))
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    texCache.set(n, t)
  }
  return texCache.get(n)
}
let allLoaded = null
const loadAll = () =>
  (allLoaded ??= Promise.all(
    TEXTURES.map(
      n =>
        new Promise((resolve, reject) => {
          const t = new THREE.TextureLoader().load(texUrl(n), resolve, undefined, () => reject(new Error('texture introuvable : ' + n)))
          t.colorSpace = THREE.SRGBColorSpace
          t.anisotropy = 8
          texCache.set(n, t)
        })
    )
  ))
export const usePreloadTextures = () => {
  const [handle] = useState(() => delayRender('Textures 3D'))
  const [ready, setReady] = useState(false)
  useEffect(() => {
    loadAll().then(() => setReady(true))
  }, [])
  // on libère le rendu une fois le canevas monté (il pose alors ses propres attentes)
  useEffect(() => {
    if (ready) continueRender(handle)
  }, [ready, handle])
  return ready
}
export const useTex = (...names) => names.map(loadTex)

// ─── Géométrie ───────────────────────────────────────────────
export const roundedRect = (w, h, r) => {
  const s = new THREE.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return s
}

// Face plate à coins arrondis, coordonnées de texture 0 → 1 sur toute la face (crop : [u0, v0, u1, v1])
export const useFaceGeometry = (w, h, r, crop = [0, 0, 1, 1]) =>
  useMemo(() => {
    const g = new THREE.ShapeGeometry(roundedRect(w, h, r), 24)
    const p = g.attributes.position
    const uv = g.attributes.uv
    for (let i = 0; i < p.count; i++) {
      const u = (p.getX(i) + w / 2) / w
      const v = (p.getY(i) + h / 2) / h
      uv.setXY(i, mix(crop[0], crop[2], u), mix(crop[1], crop[3], v))
    }
    return g
  }, [w, h, r, crop.join()])

export const useSlabGeometry = (w, h, r, depth, bevel = 0.01) =>
  useMemo(() => {
    const g = new THREE.ExtrudeGeometry(roundedRect(w - 2 * bevel, h - 2 * bevel, Math.max(0.001, r - bevel)), {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 20,
    })
    g.translate(0, 0, -depth / 2)
    return g
  }, [w, h, r, depth, bevel])

/* Carte Wallet en 3D : tranche brillante, recto et verso texturés.
   front/back : textures ; opacity pour les fondus ; gloss : vernis. */
export const Card = ({ front, back, w = 1, h = 1.58, r = 0.05, depth = 0.012, edge = '#0e0e10', opacity = 1, gloss = 1, emissive = 0, clip, children, ...props }) => {
  const face = useFaceGeometry(w, h, r)
  const slab = useSlabGeometry(w, h, r, depth, 0.004)
  const transparent = opacity < 1
  const z = depth / 2 + 0.0045
  return (
    <group {...props}>
      <mesh geometry={slab}>
        <meshPhysicalMaterial color={edge} metalness={0.3} roughness={0.35} clearcoat={gloss} transparent={transparent} opacity={opacity} clippingPlanes={clip ?? null} />
      </mesh>
      <mesh geometry={face} position-z={z}>
        <meshPhysicalMaterial map={front} roughness={0.32} clearcoat={gloss} clearcoatRoughness={0.08} transparent={transparent} opacity={opacity} emissive="#ffffff" emissiveMap={front} emissiveIntensity={emissive} clippingPlanes={clip ?? null} />
      </mesh>
      {back && (
        <mesh geometry={face} position-z={-z} rotation-y={Math.PI}>
          <meshPhysicalMaterial map={back} roughness={0.32} clearcoat={gloss} clearcoatRoughness={0.08} transparent={transparent} opacity={opacity} emissive="#ffffff" emissiveMap={back} emissiveIntensity={emissive} clippingPlanes={clip ?? null} />
        </mesh>
      )}
      {children}
    </group>
  )
}

/* Téléphone : châssis métal, écran qui éclaire (emissive), îlot noir.
   body : couleur du châssis ; screen : texture ; glow : luminosité de l'écran */
export const PHONE_W = 0.98
export const PHONE_H = 2
export const Phone = ({ screen, body = '#8e8e93', metal = 0.9, rough = 0.28, glow = 1, screenOpacity = 1, children, ...props }) => {
  const slab = useSlabGeometry(PHONE_W, PHONE_H, 0.15, 0.07, 0.025)
  const glass = useFaceGeometry(PHONE_W - 0.05, PHONE_H - 0.05, 0.13)
  const disp = useFaceGeometry(PHONE_W - 0.07, PHONE_H - 0.07, 0.12)
  const island = useFaceGeometry(0.27, 0.075, 0.0375)
  return (
    <group {...props}>
      <mesh geometry={slab}>
        <meshPhysicalMaterial color={body} metalness={metal} roughness={rough} clearcoat={0.6} />
      </mesh>
      <mesh geometry={glass} position-z={0.0605}>
        <meshPhysicalMaterial color="#020203" roughness={0.05} clearcoat={1} metalness={0.2} />
      </mesh>
      {screen && (
        <mesh geometry={disp} position-z={0.0612}>
          <meshBasicMaterial map={screen} toneMapped={false} transparent opacity={screenOpacity} color={new THREE.Color(glow, glow, glow)} />
        </mesh>
      )}
      <mesh geometry={island} position={[0, PHONE_H / 2 - 0.1, 0.0618]}>
        <meshBasicMaterial color="#000" />
      </mesh>
      {children}
    </group>
  )
}

/* Plan texturé simple (notification, bulle, logo…), coordonnées de texture recadrables */
export const Panel = ({ map, w, h, r = 0, crop, opacity = 1, basic = true, color = '#fff', ...props }) => {
  const g = useFaceGeometry(w, h, r || 0.0001, crop)
  return (
    <mesh geometry={g} {...props}>
      {basic ? (
        <meshBasicMaterial map={map} transparent opacity={opacity} toneMapped={false} color={color} depthWrite={opacity >= 1} />
      ) : (
        <meshPhysicalMaterial map={map} transparent opacity={opacity} roughness={0.25} clearcoat={1} color={color} />
      )}
    </mesh>
  )
}

// ─── Texte extrudé ───────────────────────────────────────────
const fonts = new Map()
export const getFont = json => {
  if (!fonts.has(json)) fonts.set(json, new FontLoader().parse(json))
  return fonts.get(json)
}
export const useTextGeometry = (text, json, { size = 1, depth = 0.2, bevel = 0.02, curve = 10, align = 'center' } = {}) =>
  useMemo(() => {
    const g = new TextGeometry(text, {
      font: getFont(json),
      size,
      depth,
      curveSegments: curve,
      bevelEnabled: bevel > 0,
      bevelThickness: bevel,
      bevelSize: bevel * 0.7,
      bevelSegments: 4,
    })
    g.computeBoundingBox()
    const b = g.boundingBox
    const cx = align === 'left' ? -b.min.x : -(b.min.x + b.max.x) / 2
    g.translate(cx, -(b.min.y + b.max.y) / 2, -depth / 2)
    g.computeVertexNormals()
    return g
  }, [text, json, size, depth, bevel, curve, align])

/* Rend la scène dès qu'elle est montée : à la première image, les textures se chargent (Suspense)
   et rien ne redemande de rendu une fois qu'elles sont là, d'où une image vide sans ce composant */
export const RenderOnMount = () => {
  const { advance } = useThree()
  useLayoutEffect(() => {
    advance(performance.now())
  }, [advance])
  return null
}

// ─── Caméra pilotée par le temps ─────────────────────────────
/* Place la caméra à chaque image : pos [x,y,z], look [x,y,z], fov, roll (rad) */
export const Cam = ({ pos, look = [0, 0, 0], fov = 35, roll = 0 }) => {
  const { camera } = useThree()
  camera.position.set(...pos)
  camera.up.set(Math.sin(roll), Math.cos(roll), 0)
  camera.lookAt(...look)
  if (camera.fov !== fov) {
    camera.fov = fov
    camera.updateProjectionMatrix()
  }
  return null
}

// ─── Particules ──────────────────────────────────────────────
/* Nuage de points dont la position est donnée par fn(i, out) à chaque image (out = [x, y, z, taille, alpha]) */
export const Particles = ({ count, fn, color = '#ffffff', size = 0.03, additive = true, deps }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    g.setAttribute('aScale', new THREE.BufferAttribute(new Float32Array(count), 1))
    g.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(count), 1))
    return g
  }, [count])
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        uniforms: { uColor: { value: new THREE.Color(color) }, uSize: { value: size } },
        vertexShader: `
          attribute float aScale; attribute float aAlpha; varying float vA; uniform float uSize;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = uSize * aScale * 1400.0 / -mv.z;
            vA = aAlpha;
          }`,
        fragmentShader: `
          uniform vec3 uColor; varying float vA;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d);
            gl_FragColor = vec4(uColor, a * a * vA);
          }`,
      }),
    [color, size, additive]
  )
  const out = [0, 0, 0, 1, 1]
  const p = geo.attributes.position
  const s = geo.attributes.aScale
  const a = geo.attributes.aAlpha
  for (let i = 0; i < count; i++) {
    out[3] = 1
    out[4] = 1
    fn(i, out)
    p.setXYZ(i, out[0], out[1], out[2])
    s.setX(i, out[3])
    a.setX(i, out[4])
  }
  p.needsUpdate = true
  s.needsUpdate = true
  a.needsUpdate = true
  return <points geometry={geo} material={mat} frustumCulled={false} />
}

/* Matériau qui se consume : les zones où le bruit < burn disparaissent, avec un liseré incandescent.
   À passer en onBeforeCompile d'un MeshStandardMaterial qui a une map. */
export const burnShader = uniforms => shader => {
  shader.uniforms.uBurn = uniforms.uBurn
  shader.uniforms.uEdge = uniforms.uEdge
  shader.fragmentShader = shader.fragmentShader
    .replace(
      '#include <common>',
      `#include <common>
      uniform float uBurn; uniform vec3 uEdge;
      float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int k = 0; k < 5; k++) { v += a * vn(p); p *= 2.03; a *= 0.5; } return v; }`
    )
    .replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
      float n = fbm(vMapUv * vec2(6.0, 4.0)) * 0.7 + (1.0 - vMapUv.y) * 0.45;
      float edge = n - uBurn;
      if (edge < 0.0) discard;
      float glow = 1.0 - smoothstep(0.0, 0.06, edge);
      float char = 1.0 - smoothstep(0.0, 0.14, edge);
      gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.05, 0.02, 0.01), char * 0.85);
      gl_FragColor.rgb += uEdge * glow * 3.0;`
    )
}

/* Plan de papier froissé : sommets déplacés par un bruit (crumple 0 → plat, 1 → très froissé) */
export const usePaperGeometry = (w, h, crumple, seed = 1) =>
  useMemo(() => {
    const g = new THREE.PlaneGeometry(w, h, 48, 32)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const y = p.getY(i)
      const n = noise1(x * 7 + seed * 13 + noise1(y * 5 + seed) * 2) * 0.5 + noise1(y * 9 - seed * 7 + noise1(x * 4) * 2) * 0.5
      const ridge = Math.abs(noise1(x * 3.1 + y * 2.3 + seed * 3)) * 0.5
      p.setZ(i, crumple * (n * 0.05 + ridge * 0.06) + crumple * 0.04 * Math.sin(x * 2.2 + seed))
    }
    g.computeVertexNormals()
    return g
  }, [w, h, crumple, seed])

// ─── Trajectoire de caméra continue (Catmull-Rom sur des clés [t, [x,y,z]]) ───
const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k)
export const spline = (t, keys) => {
  if (t <= keys[0][0]) return keys[0][1]
  const n = keys.length
  if (t >= keys[n - 1][0]) return keys[n - 1][1]
  let i = 0
  while (keys[i + 1][0] < t) i++
  const u = (t - keys[i][0]) / (keys[i + 1][0] - keys[i][0])
  const p0 = keys[Math.max(0, i - 1)][1]
  const p1 = keys[i][1]
  const p2 = keys[i + 1][1]
  const p3 = keys[Math.min(n - 1, i + 2)][1]
  const u2 = u * u
  const u3 = u2 * u
  return p1.map((_, d) => 0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * u + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * u3))
}
export { lerp3 }

/* Étiquette : texte dessiné sur un canevas (police déjà chargée par la page), renvoie [texture, largeur/hauteur] */
export const useLabel = (text, { font = '500 64px "Inter Variable"', color = '#1d1d1f', pad = 16, bg = null, radius = 0 } = {}) =>
  useMemo(() => {
    const c = document.createElement('canvas')
    const g = c.getContext('2d')
    g.font = font
    const m = g.measureText(text)
    const h = Math.ceil((m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) * 1.5) + pad * 2
    c.width = Math.ceil(m.width) + pad * 2
    c.height = h
    if (bg) {
      g.fillStyle = bg
      g.beginPath()
      g.roundRect(0, 0, c.width, c.height, radius)
      g.fill()
    }
    g.font = font
    g.fillStyle = color
    g.textBaseline = 'middle'
    g.fillText(text, pad, h / 2)
    const tx = new THREE.CanvasTexture(c)
    tx.colorSpace = THREE.SRGBColorSpace
    tx.anisotropy = 8
    return [tx, c.width / c.height]
  }, [text, font, color, pad, bg, radius])

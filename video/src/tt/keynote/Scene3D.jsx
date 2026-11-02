import * as THREE from 'three'
import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Cam, RenderOnMount, Card, Panel, Particles, Phone, burnShader, clamp, easeInOut, easeOut, expoOut, mix, noise1, pr, rnd, spline, spring, useFaceGeometry, useLabel, useSlabGeometry, useTex } from '../kit3d'
import { T } from './temps'

/* Keynote : un seul plan-séquence dans un studio blanc. La caméra suit une trajectoire continue (spline),
   les objets se transforment au lieu de couper : hologramme, papier, plastique, vraie carte, téléphone,
   vue éclatée, verso, notification, quartier en pâte blanche, logo. */

const INK = '#1d1d1f'
const BLUE = '#2997ff'
const SLOT = [0, -0.42, 0.075, 0.807] // place de « Maison Lumière » dans la pile Wallet (x, y, z, échelle)
const NOTIF_SLOT = [0, 0.43, 0.075, 0.88] // place d'une notification sur l'écran verrouillé

// Trajectoire de la caméra : [instant, position] et [instant, point visé]
const POS = [
  [0, [0.3, 0.55, 0.62]],
  [1.5, [0.1, 0.22, 1.3]],
  [2.3, [0.05, 0.05, 4.7]],
  [3.2, [0, 0, 4.1]],
  [5.0, [0, 0, 4.5]],
  [6.4, [0.1, -0.05, 6.6]],
  [7.6, [0.4, 0.05, 5.6]],
  [9.0, [1.9, 0.55, 5.3]],
  [10.3, [1.7, 0.45, 5.4]],
  [11.2, [0.2, 0.0, 5.3]],
  [13.4, [-0.25, 0.1, 5.2]],
  [15.0, [0.2, 0, 6.8]],
  [16.6, [0.5, 5.4, 5.0]],
  [18.6, [-0.2, 3.5, 3.9]],
  [21, [0.2, 3.2, 3.6]],
]
const LOOK = [
  [0, [0.2, 0.55, 0]],
  [1.5, [0.05, 0.22, 0]],
  [2.3, [0, 0, 0]],
  [6.4, [0, -0.25, 0]],
  [7.6, [0, 0, 0.3]],
  [9.0, [0.15, 0.0, 0.3]],
  [10.3, [0.15, 0, 0.3]],
  [11.2, [0, 0, 0]],
  [15.0, [0, -0.15, 0]],
  [16.6, [-0.3, -3, 0.4]],
  [18.6, [-0.8, -3, 0.8]],
  [21, [-0.7, -3, 0.7]],
]

// Hologramme : texture en bleu, lignes de balayage, bord lumineux
const holoMaterial = map =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
    uniforms: { uMap: { value: map }, uTime: { value: 0 }, uAlpha: { value: 1 }, uClip: { value: 10 } },
    vertexShader: `varying vec2 vUv; varying vec3 vW;
      void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uTime; uniform float uAlpha; uniform float uClip; varying vec2 vUv; varying vec3 vW;
      void main(){
        if (vW.y < uClip) discard;
        vec4 c = texture2D(uMap, vUv);
        float l = dot(c.rgb, vec3(0.3, 0.59, 0.11));
        float scan = 0.55 + 0.45 * sin(vUv.y * 420.0 - uTime * 6.0);
        float grid = max(step(0.97, fract(vUv.x * 18.0)), step(0.98, fract(vUv.y * 28.0)));
        vec2 e = min(vUv, 1.0 - vUv);
        float edge = 1.0 - smoothstep(0.0, 0.02, min(e.x, e.y));
        vec3 col = vec3(0.16, 0.59, 1.0) * (0.35 + l * 0.9) * scan + vec3(0.6, 0.85, 1.0) * (grid * 0.35 + edge * 1.2);
        gl_FragColor = vec4(col, (0.28 + l * 0.5 + grid * 0.3 + edge) * uAlpha);
      }`,
  })

// Carte « plastique » générique dessinée au canevas
const usePlasticTexture = () =>
  useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 500
    c.height = 790
    const g = c.getContext('2d')
    const gr = g.createLinearGradient(0, 0, 500, 790)
    gr.addColorStop(0, '#fbfbfd')
    gr.addColorStop(1, '#d9dadf')
    g.fillStyle = gr
    g.fillRect(0, 0, 500, 790)
    g.fillStyle = '#c5c6cc'
    g.fillRect(0, 120, 500, 70)
    g.fillStyle = '#8e8e93'
    g.font = '700 34px "Inter Variable"'
    g.fillText('CARTE CLIENT', 40, 300)
    g.fillStyle = '#b0b1b7'
    for (let i = 0; i < 26; i++) g.fillRect(60 + i * 14, 620, i % 3 ? 6 : 10, 110)
    const tx = new THREE.CanvasTexture(c)
    tx.colorSpace = THREE.SRGBColorSpace
    return tx
  }, [])

/* Carte qui se dissout (papier, plastique) : face texturée avec le shader de combustion, liseré bleu-blanc */
const Dissolve = ({ map, burn, scale = 1, w = 1, h = 1.58, ...props }) => {
  const face = useFaceGeometry(w, h, 0.05)
  const slab = useSlabGeometry(w, h, 0.05, 0.01, 0.003)
  const uniforms = useMemo(() => ({ uBurn: { value: 0 }, uEdge: { value: new THREE.Color('#7cc4ff') } }), [])
  uniforms.uBurn.value = burn
  const ob = useMemo(() => burnShader(uniforms), [uniforms])
  if (burn > 1.25) return null
  return (
    <group scale={scale} {...props}>
      <mesh geometry={face} position-z={0.01}>
        <meshStandardMaterial map={map} roughness={0.7} onBeforeCompile={ob} />
      </mesh>
      <mesh geometry={face} position-z={-0.01} rotation-y={Math.PI}>
        <meshStandardMaterial map={map} roughness={0.7} onBeforeCompile={ob} />
      </mesh>
      {burn < 0.05 && (
        <mesh geometry={slab}>
          <meshStandardMaterial color="#d8d8dc" roughness={0.5} />
        </mesh>
      )}
    </group>
  )
}

// Étiquette de la vue éclatée : texte + trait jusqu'à la couche
const Callout = ({ text, t, at, from, to }) => {
  const [tex, ar] = useLabel(text, { font: '600 72px "Inter Variable"', color: INK })
  const k = pr(t, at, at + 0.4)
  const h = 0.15
  const line = useMemo(() => new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...from), new THREE.Vector3(...to)]), [from.join(), to.join()])
  return (
    <group>
      <line geometry={line}>
        <lineBasicMaterial color={INK} transparent opacity={k * 0.7} />
      </line>
      <mesh position={[to[0] + (h * ar) / 2 + 0.03, to[1], to[2]]} scale={[h * ar, h, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={tex} transparent opacity={k} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh position={from}>
        <sphereGeometry args={[0.015, 16, 16]} />
        <meshBasicMaterial color={BLUE} transparent opacity={k} />
      </mesh>
    </group>
  )
}

// « +20 » qui monte au-dessus du compteur de points
const PlusTwenty = ({ t, open }) => {
  const [tex, ar] = useLabel('+20', { font: '700 80px "Inter Variable"', color: BLUE })
  const a = t - (T.points + 0.25)
  const k = spring(t, T.points + 0.25, 1.8, 6)
  const h = 0.13
  return (
    <mesh position={[0.36, 0.78 + a * 0.12, 0.72 * open + 0.02]} scale={[h * ar * clamp(k), h * clamp(k), 1]}>
      <planeGeometry />
      <meshBasicMaterial map={tex} transparent opacity={1 - clamp((a - 0.7) / 0.4)} toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

// ─── La carte : hologramme → papier → plastique → vraie carte → téléphone → vue éclatée → verso ─
const Hero = ({ t }) => {
  const [front, back, paper, wallet, lockEmpty, notif] = useTex('pass-graphite', 'pass-back', 'papier', 'wallet', 'lock-vide', 'notif-offre')
  const [fond, fondAzur, fondCh, fondIv, logo, pts, pts500, details] = useTex('couche-fond', 'couche-fond-azur', 'couche-fond-champagne', 'couche-fond-ivory', 'couche-logo', 'couche-points', 'couche-points-500', 'couche-details')
  const plastic = usePlasticTexture()
  const face = useFaceGeometry(1, 1.58, 0.05)
  const holo = useMemo(() => holoMaterial(front), [front])
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1.58, 0.02)), [])
  const clipReal = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), 10), [])

  // flottement et rotation lente
  const bob = Math.sin(t * 1.1) * 0.03
  let rotY = Math.sin(t * 0.55) * 0.32 + 0.12
  // balayage hologramme : la limite descend de 0,85 à −0,85 entre T.scan et T.scan + 0,8
  const scanY = mix(0.85, -0.85, pr(t, T.scan, T.scan + 0.8, easeInOut))
  // reconstitution de la vraie carte (de bas en haut)
  const rebuildY = mix(-0.85, 0.85, pr(t, T.vraie, T.vraie + 0.38, easeInOut))
  const holoOn = t >= T.scan && t < T.vraie + 0.4
  const realVisible = t < T.scan + 0.8 || t >= T.vraie
  // la vraie carte reste sous la limite, l'hologramme au-dessus
  clipReal.normal.set(0, -1, 0)
  clipReal.constant = t < T.vraie ? scanY : rebuildY
  holo.uniforms.uTime.value = t
  holo.uniforms.uClip.value = t < T.vraie ? scanY : rebuildY
  holo.uniforms.uAlpha.value = (t < T.papier ? 1 : t < T.vraie ? 0.35 : 1) * (1 + 0.6 * Math.exp(-Math.max(0, t - T.drop) * 5))

  // rangement dans le téléphone puis sortie
  const into = pr(t, T.vit, T.vit + 1.0, easeInOut)
  const out = pr(t, T.sortie, T.sortie + 0.7, easeInOut)
  const phoneY = t < T.sortie ? mix(-4.2, 0, easeOut(pr(t, T.vit - 0.1, T.vit + 0.8, k => k))) : mix(0, -4.6, pr(t, T.sortie + 0.1, T.sortie + 0.9, easeInOut))
  const inPhone = into >= 1 && t < T.sortie
  let pos = [0, bob, 0]
  let scale = 1
  if (t >= T.vit) {
    pos = [mix(0, SLOT[0], into), mix(bob, SLOT[1], into), mix(0, SLOT[2], into)]
    scale = mix(1, SLOT[3], into)
    rotY = mix(rotY, 0, into)
  }
  if (t >= T.sortie) {
    pos = [0, mix(SLOT[1], 0, out), mix(SLOT[2], 0.25, out)]
    scale = mix(SLOT[3], 1, out)
    rotY = 0
  }
  // vue éclatée : écart des couches
  const open = pr(t, T.eclate, T.eclate + 0.55, easeOut) * (1 - pr(t, T.direct, T.direct + 0.25, easeInOut))
  const exploded = t >= T.eclate && t < T.direct + 0.3
  // retournement
  const flip = pr(t, T.derriere, T.derriere + 0.6, easeInOut)
  if (t >= T.derriere) rotY = flip * Math.PI + Math.sin((t - T.derriere) * 0.6) * 0.06
  // départ vers la gauche quand la notification part
  const leave = pr(t, T.envoi, T.envoi + 0.7, easeInOut)
  if (t >= T.envoi) pos = [mix(0, -2.6, leave), mix(0, 0.4, leave), mix(0.25, -0.5, leave)]

  // couleurs successives du fond pendant « tes couleurs »
  const ci = Math.floor(clamp((t - T.couleurs) / 0.22, 0, 3.99))
  const fondMap = t < T.couleurs ? fond : [fondAzur, fondCh, fondIv, fond][ci]
  const ptsMap = t < T.points + 0.25 ? pts : pts500
  const ptsPop = spring(t, T.points + 0.25, 2, 7)

  // notification écrite au dos puis envoyée sur l'écran verrouillé
  const write = pr(t, T.ecris, T.ecris + 0.75, k => k)
  const fly = pr(t, T.envoi, T.ecran, easeInOut)
  const lockX = mix(2.8, 0, pr(t, T.envoi - 0.1, T.ecran - 0.2, easeOut))
  const landed = spring(t, T.ecran, 2, 8)
  const lockAway = pr(t, T.grue - 0.1, T.grue + 0.6, easeInOut)

  return (
    <>
      {/* téléphone avec la pile Wallet */}
      {t >= T.vit - 0.2 && t < T.sortie + 1 && <Phone screen={wallet} body="#e3e4e8" metal={0.7} rough={0.3} position={[0, phoneY, 0]} />}

      {/* papier et plastique : passages éclairs qui se désagrègent */}
      {t >= T.papier && t < T.plastique + 0.1 && (
        <Dissolve map={paper} w={1.58} h={1.02} rotation-z={Math.PI / 2} burn={mix(-0.05, 1.3, pr(t, T.papier + 0.22, T.plastique, k => k))} scale={spring(t, T.papier, 2, 9) * 0.98} position={[0, bob, 0.05]} />
      )}
      {t >= T.plastique && t < T.vraie + 0.1 && <Dissolve map={plastic} burn={mix(-0.05, 1.3, pr(t, T.plastique + 0.25, T.vraie, k => k))} scale={spring(t, T.plastique, 2, 9)} position={[0, bob, 0.05]} />}

      {/* la carte : vraie (coupée par le balayage) + hologramme */}
      {!inPhone && t < T.grue && !exploded && (
        <group position={pos} rotation={[0, rotY, 0]} scale={scale}>
          {realVisible && <Card front={front} back={back} clip={t >= T.scan && t < T.vraie + 0.4 ? [clipReal] : undefined} opacity={t >= T.vit + 0.85 && t < T.sortie ? 1 - pr(t, T.vit + 0.85, T.vit + 1.0, k => k) : 1} />}
          {holoOn && (
            <>
              <mesh geometry={face} position-z={0.012} material={holo} />
              <lineSegments geometry={edges}>
                <lineBasicMaterial color="#7cc4ff" transparent opacity={0.8} />
              </lineSegments>
            </>
          )}
          {/* notification qui s'écrit au dos */}
          {t >= T.ecris && t < T.envoi && (
            <Panel map={notif} w={0.92 * Math.max(0.02, write)} h={0.92 * (168 / 760)} crop={[0, 0, Math.max(0.02, write), 1]} position={[-0.46 + (0.46 * Math.max(0.02, write)), 0.45, -0.03]} rotation-y={Math.PI} />
          )}
        </group>
      )}

      {/* vue éclatée : quatre couches */}
      {exploded && (
        <group position={[-0.3, 0, 0.25]} scale={0.85} rotation-y={-0.35 * open}>
          {[
            [fondMap, 0],
            [details, 0.36],
            [ptsMap, 0.72],
            [logo, 1.08],
          ].map(([map, dz], i) => (
            <group key={i} position-z={dz * open}>
              <Panel map={map} w={1} h={1.58} r={0.05} basic={false} scale={i === 2 ? 1 + ptsPop * 0 : 1} />
              {i > 0 && (
                <mesh geometry={face} position-z={-0.002}>
                  <meshPhysicalMaterial color="#ffffff" transparent opacity={0.05 * open} roughness={0.1} clearcoat={1} depthWrite={false} />
                </mesh>
              )}
            </group>
          ))}
          <Callout t={t} at={8.15} text="Ton logo" from={[-0.38, 0.69, 1.08 * open]} to={[0.62, 0.98, 1.08 * open]} />
          <Callout t={t} at={T.couleurs} text="Tes couleurs" from={[0.42, 0.1, 0]} to={[0.62, -0.35, 0]} />
          <Callout t={t} at={T.points} text="Tes points" from={[0.38, 0.62, 0.72 * open]} to={[0.62, 0.42, 0.72 * open]} />
          {t > T.points + 0.25 && <PlusTwenty t={t} open={open} />}
        </group>
      )}

      {/* écran verrouillé qui reçoit la notification */}
      {t >= T.envoi - 0.1 && t < T.grue + 0.7 && (
        <Phone screen={lockEmpty} body="#e3e4e8" metal={0.7} rough={0.3} position={[lockX + lockAway * -3, lockAway * 2.5, 0]} rotation={[0, mix(-0.4, 0, pr(t, T.envoi, T.ecran, easeOut)), lockAway * 0.6]}>
          {t >= T.ecran && <Panel map={notif} w={0.92} h={0.92 * (168 / 760)} position={[NOTIF_SLOT[0], NOTIF_SLOT[1], NOTIF_SLOT[2] + 0.002]} scale={NOTIF_SLOT[3] * (0.94 + 0.06 * landed)} />}
        </Phone>
      )}
      {/* la notification en vol, du dos de la carte jusqu'à l'écran */}
      {t >= T.envoi && t < T.ecran && (
        <Panel
          map={notif}
          w={0.92}
          h={0.92 * (168 / 760)}
          position={[mix(-0.02, lockX + NOTIF_SLOT[0], fly), mix(0.45, NOTIF_SLOT[1], fly) + Math.sin(fly * Math.PI) * 0.2, mix(0.3, 0.1, fly) + Math.sin(fly * Math.PI) * 0.8]}
          rotation={[0, Math.sin(fly * Math.PI) * -0.5, Math.sin(fly * Math.PI) * 0.15]}
          scale={mix(1, NOTIF_SLOT[3], fly)}
        />
      )}
    </>
  )
}

// ─── Le quartier en pâte blanche ──────────────────────────────
const CITY_Y = -3
const City = ({ t }) => {
  const [toast] = useTex('toast')
  const blocks = useMemo(() => {
    const out = []
    for (let gx = -5; gx <= 5; gx++)
      for (let gz = -5; gz <= 5; gz++) {
        if (gz === 1 || gx === -1 || gx === 2) continue // rues
        if (gx === 0 && gz === 0) continue // la boutique
        const i = gx * 31 + gz * 7
        const h = 0.25 + Math.pow(rnd(i), 2) * 1.3
        out.push([gx * 0.9 + (rnd(i + 1) - 0.5) * 0.08, h, gz * 0.9 + (rnd(i + 2) - 0.5) * 0.08, 0.6 + rnd(i + 3) * 0.18])
      }
    return out
  }, [])
  const rise = pr(t, T.grue - 0.3, T.grue + 1.2, easeOut)
  const walk = pr(t, T.passant, T.rappel + 0.35, k => k)
  const wx = mix(-4.6, -0.75, walk)
  const wz = 0.9
  const inRing = t >= T.rappel
  const ring = ((t - T.passant) % 1.6) / 1.6
  const toastK = spring(t, T.rappel, 1.6, 6)
  return (
    <group position-y={CITY_Y}>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.001}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#f2f2f4" roughness={1} />
      </mesh>
      {blocks.map(([x, h, z, s], i) => (
        <mesh key={i} position={[x, (h * rise) / 2, z]} scale={[s, Math.max(0.001, h * rise), s]}>
          <boxGeometry />
          <meshStandardMaterial color={i % 5 === 0 ? '#e9ecf2' : '#fdfdfe'} roughness={0.85} />
        </mesh>
      ))}
      {/* la boutique et son repère */}
      <mesh position={[0, 0.3 * rise, 0]} scale={[0.66, 0.6 * rise + 0.001, 0.66]}>
        <boxGeometry />
        <meshStandardMaterial color="#ffffff" roughness={0.6} emissive={BLUE} emissiveIntensity={0.08} />
      </mesh>
      <group position={[0, 0.95 + Math.sin(t * 2.2) * 0.05, 0]} scale={rise}>
        <mesh position-y={0.18}>
          <sphereGeometry args={[0.16, 32, 32]} />
          <meshPhysicalMaterial color={BLUE} roughness={0.2} clearcoat={1} emissive={BLUE} emissiveIntensity={0.25} />
        </mesh>
        <mesh position-y={-0.02} rotation-x={Math.PI}>
          <coneGeometry args={[0.1, 0.26, 32]} />
          <meshPhysicalMaterial color={BLUE} roughness={0.2} clearcoat={1} />
        </mesh>
      </group>
      {/* zone de proximité */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.01}>
        <ringGeometry args={[1.48, 1.52, 128]} />
        <meshBasicMaterial color={BLUE} transparent opacity={0.6 * rise} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.008}>
        <circleGeometry args={[1.5, 128]} />
        <meshBasicMaterial color={BLUE} transparent opacity={0.07 * rise + (inRing ? 0.06 * Math.exp(-(t - T.rappel) * 2) : 0)} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.012} scale={0.2 + ring * 1.3}>
        <ringGeometry args={[0.95, 1, 96]} />
        <meshBasicMaterial color={BLUE} transparent opacity={(1 - ring) * 0.5 * rise} />
      </mesh>
      {/* le passant */}
      {t >= T.passant - 0.2 && (
        <group position={[wx, 0, wz]}>
          <mesh position-y={0.17}>
            <capsuleGeometry args={[0.075, 0.18, 8, 16]} />
            <meshStandardMaterial color="#e3c9a4" roughness={0.5} emissive="#e3c9a4" emissiveIntensity={inRing ? 0.3 : 0} />
          </mesh>
          <mesh position-y={0.4}>
            <sphereGeometry args={[0.07, 24, 24]} />
            <meshStandardMaterial color="#e3c9a4" roughness={0.5} />
          </mesh>
          {inRing && (
            <group position={[0, 0.75, 0]} scale={toastK}>
              <Panel map={toast} w={2.1} h={2.1 * (104 / 640)} position={[0.33, 0.1, 0]} rotation-x={-0.75} />
            </group>
          )}
        </group>
      )}
      <ContactShadows position-y={0.002} scale={14} blur={1.6} far={2.5} opacity={0.85} resolution={1024} frames={Infinity} color="#1d2a40" />
    </group>
  )
}

// ─── Fin : l'icône Fidelyz et deux cartes en orbite ───────────
const Finale = ({ t }) => {
  const [logo, a, b, back] = useTex('logo-fidelyz.png', 'pass-graphite', 'pass-azur', 'pass-back')
  const tile = useFaceGeometry(1, 1, 0.225, [0.184, 0.184, 0.816, 0.816])
  const slab = useSlabGeometry(1, 1, 0.225, 0.08, 0.03)
  const k = spring(t, T.logo, 1.1, 5.5)
  const spin = mix(-Math.PI, 0, expoOut(pr(t, T.logo, T.logo + 1.2, k => k))) + Math.sin(t * 0.8) * 0.12
  const orbit = t * 0.7
  return (
    <group>
      <group position={[0, 0.55, 0]} rotation={[0.08, spin, 0]} scale={clamp(k) * 0.95}>
        <mesh geometry={slab}>
          <meshPhysicalMaterial color="#f5f5f7" metalness={0.2} roughness={0.25} clearcoat={1} />
        </mesh>
        <mesh geometry={tile} position-z={0.071}>
          <meshPhysicalMaterial map={logo} roughness={0.15} clearcoat={1} emissive="#ffffff" emissiveMap={logo} emissiveIntensity={0.25} />
        </mesh>
      </group>
      {[a, b].map((m, i) => {
        const ang = orbit + i * Math.PI
        return <Card key={i} front={m} back={back} position={[Math.cos(ang) * 1.35, 0.6 + Math.sin(ang * 2) * 0.1, Math.sin(ang) * 0.45 - 1.0]} rotation={[0.1, -ang + Math.PI / 2, 0.15]} scale={0.34 * clamp(k)} />
      })}
      <ContactShadows position-y={-0.55} scale={6} blur={2.6} far={2} opacity={0.4} frames={Infinity} />
    </group>
  )
}

export const Scene3D = ({ t }) => {
  const { gl } = useThree()
  gl.localClippingEnabled = true
  const p = spline(t, POS)
  const l = spline(t, LOOK)
  const end = t >= T.logo - 0.15
  const pulse = Math.exp(-Math.max(0, t - T.drop) * 4) * (t >= T.drop ? 1 : 0)
  return (
    <>
      <color attach="background" args={['#f3f3f5']} />
      <fog attach="fog" args={['#f3f3f5', 12, 30]} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 5, 3]} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={1.4} position={[5, 1, 2]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="ring" intensity={2} color="#cfe6ff" position={[0, 0, 5]} scale={2} />
      </Environment>
      {end ? <Cam pos={[Math.sin(t * 0.2) * 0.3, 0.75, mix(6.4, 5.6, pr(t, T.logo, T.logo + 4, k => k))]} look={[0, 0.3, 0]} fov={34} /> : <Cam pos={p} look={l} fov={34} roll={noise1(t * 0.4) * 0.01} />}
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 6, 4]} intensity={1.6} />
      <directionalLight position={[-4, 2, 3]} intensity={0.6} color="#dbe9ff" />
      {!end && t < T.grue + 1 && (
        <>
          <Hero t={t} />
          {t < T.grue - 0.2 && (
            <>
              <ContactShadows position-y={-1.45} scale={8} blur={2.4} far={3} opacity={0.35} frames={Infinity} />
              <mesh rotation-x={-Math.PI / 2} position-y={-1.46}>
                <planeGeometry args={[60, 60]} />
                <meshStandardMaterial color="#f3f3f5" roughness={1} />
              </mesh>
            </>
          )}
          {/* éclat de particules sur la montée de la musique */}
          {t >= T.drop && t < T.drop + 1.2 && (
            <Particles
              count={160}
              size={0.025}
              color="#2997ff"
              additive={false}
              fn={(i, o) => {
                const a = rnd(i) * Math.PI * 2
                const b = (rnd(i + 1) - 0.5) * 2
                const v = (0.8 + rnd(i + 2) * 1.6) * easeOut(clamp((t - T.drop) / 0.9))
                o[0] = Math.cos(a) * v * 0.8
                o[1] = b * 0.8 + Math.sin(a) * v * 0.6
                o[2] = Math.sin(a * 3) * v * 0.4
                o[3] = 0.6 + rnd(i + 3)
                o[4] = 1 - clamp((t - T.drop) / 1.2)
              }}
            />
          )}
          {pulse > 0.01 && (
            <mesh rotation-x={-Math.PI / 2} position-y={-1.44} scale={0.5 + (1 - pulse) * 4}>
              <ringGeometry args={[0.96, 1, 96]} />
              <meshBasicMaterial color={BLUE} transparent opacity={pulse * 0.8} />
            </mesh>
          )}
        </>
      )}
      {!end && t >= T.grue - 0.3 && <City t={t} />}
      {end && <Finale t={t} />}
      <RenderOnMount />
      <EffectComposer multisampling={4} disableNormalPass>
        <Bloom mipmapBlur intensity={0.5} luminanceThreshold={0.96} luminanceSmoothing={0.1} />
        <Vignette darkness={0.22} offset={0.35} />
      </EffectComposer>
    </>
  )
}

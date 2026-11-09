import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { useTextGeometry } from '../../tt/kit3d'
import UNB from '../../tt/fonts/unbounded-900.json'
import { Sound, usePreload } from '../../serie/kit'
import { ACCENT, END, EndCard, Finish, Kicker, Line, Montage, ProductTag, W, silk } from '../fx'
import { Cam, Lux, Mirror, NotifDrop, Pass, Phone, Rig, easeInOut, mix, pr, spline, tex } from '../shots'

/* Vague 2 : « 3 raisons » (format liste). Chaque raison est un chiffre chromé géant, extrudé, sur le sol miroir, rayé par les néons,
   avec au premier plan ce qu'il prouve : 1. le téléphone (la carte ne se perd pas), 2. la notification, 3. le pass et « 0 € ». */

export const TEX = ['wallet', 'lock-vide', 'lock-campagne', 'notif-campagne', 'pass-graphite', 'pass-back']
export const duree = () => END('tx05') + 2.4

const Digit = ({ ch, ...props }) => {
  const g = useTextGeometry(ch, UNB, { size: 2.2, depth: 0.5, bevel: 0.05, curve: 12 })
  return (
    <mesh geometry={g} {...props}>
      <meshPhysicalMaterial color="#c9ced8" metalness={1} roughness={0.14} clearcoat={1} clearcoatRoughness={0.05} />
    </mesh>
  )
}

/* Scène d'une raison : chiffre derrière (à gauche), objet devant (à droite) */
const Reason = ({ t, a, b, ch, children, sweep }) => (
  <Lux>
    <Cam pos={spline(t, [[a, [-0.4, 0.5, 8.8]], [b + 0.8, [0.5, 0.4, 8.2]]])} look={[0.05, 0.2, 0]} fov={30} />
    <Mirror y={-1.05}>
      <Digit ch={ch} position={[-0.75, 0.05, -1.8]} rotation={[0, 0.35, 0]} />
      {children}
    </Mirror>
    <Rig t={t} rimAt={-1} sweep={sweep} z={1.2} len={5} />
  </Lux>
)

export const Raisons = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX)
  const C1 = W('tx02', 0) - 0.35
  const C2 = W('tx03', 0) - 0.35
  const C3 = W('tx04', 0) - 0.35
  const C4 = W('tx05', 0) - 0.45
  const shots = [
    {
      a: 0,
      b: C1,
      tr: 'whip',
      render: t =>
        ready && (
          <Lux>
            <Cam pos={spline(t, [[0, [1.6, 0.2, 5.4]], [C1 + 0.6, [-0.4, 0.5, 6.4]]])} look={[0, 0.4, 0]} fov={30} />
            <Mirror y={-1.05}>
              <Digit ch="3" position={[0, 0.25, 0]} rotation={[0, mix(-0.7, 0.15, pr(t, 0, C1, easeInOut)), 0]} />
            </Mirror>
            <Rig t={t} rimAt={0.1} sweep={[0.1, 2.0]} z={1.4} len={5} />
          </Lux>
        ),
    },
    {
      a: C1,
      b: C2,
      tr: 'rise',
      render: t =>
        ready && (
          <Reason t={t} a={C1} b={C2} ch="1" sweep={[C1 + 0.3, C1 + 1.8]}>
            <Phone screen={tex('wallet')} position={[0.5, 0, 0.4]} rotation={[0.02, -0.25, 0]} />
          </Reason>
        ),
    },
    {
      a: C2,
      b: C3,
      tr: 'zoom',
      render: t => {
        const at = W('tx03', 3) + 0.05 // « s'affichent »
        return (
          ready && (
            <Reason t={t} a={C2} b={C3} ch="2" sweep={[C2 + 0.3, C2 + 1.8]}>
              <Phone screen={tex(t >= at ? 'lock-campagne' : 'lock-vide')} glow={1 + Math.max(0, 1 - Math.abs(t - at) * 2.5) * 0.4} position={[0.5, 0, 0.4]} rotation={[0.02, -0.25, 0]}>
                <NotifDrop t={t} at={at} map={tex('notif-campagne')} />
              </Phone>
            </Reason>
          )
        )
      },
    },
    {
      a: C3,
      b: C4,
      tr: 'streak',
      render: t =>
        ready && (
          <Reason t={t} a={C3} b={C4} ch="3" sweep={[C3 + 0.2, C3 + 1.4]}>
            <Pass map={tex('pass-graphite')} back={tex('pass-back')} position={[0.5, -0.15, 0.5]} rotation={[0.04, -0.3 + Math.sin(t) * 0.05, 0]} />
          </Reason>
        ),
    },
    { a: C4, b: 99, render: t => <EndCard t={t} at={C4 + 0.3} dur={duree()} line="Gratuit pour commencer." /> },
  ]
  const zero = silk((t - W('tx04', 2)) / 0.5) * (1 - pr(t, C4 - 0.3, C4, easeInOut))
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Montage t={t} shots={shots} />
      <Finish t={t} />
      <Kicker t={t} at={0.3} out={C1 - 0.3} text="Carte de fidélité digitale" top={172} color={ACCENT} />
      <Line t={t} id="tx01" top={250} size={64} blue={[0, 1]} accent={[6, 7, 8, 9]} />
      <ProductTag t={t} at={W('tx01', 6)} out={C1 - 0.2} top={1520} />
      <Line t={t} id="tx02" top={250} size={62} from={1} accent={[3, 4, 5]} blue={[10]} />
      <Line t={t} id="tx03" top={250} size={58} from={1} blue={[3, 6]} />
      <Line t={t} id="tx04" top={250} size={70} from={1} blue={[2]} />
      {zero > 0.001 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 360, textAlign: 'center', fontFamily, opacity: zero, transform: `translateY(${(1 - zero) * 30}px)` }}>
          <span style={{ fontSize: 190, fontWeight: 150, color: '#fff', textShadow: '0 0 40px rgba(255,255,255,0.6), 0 0 120px rgba(41,151,255,0.8)' }}>0</span>
          <span style={{ fontSize: 80, fontWeight: 400, color: ACCENT, marginLeft: 10, textShadow: '0 0 30px rgba(41,151,255,0.8)' }}>€</span>
        </div>
      )}
      <Sound set="mraisons" son={son} />
    </AbsoluteFill>
  )
}

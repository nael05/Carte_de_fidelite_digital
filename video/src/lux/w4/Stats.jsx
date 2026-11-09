import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { Sound, usePreload } from '../../serie/kit'
import { ACCENT, END, EndCard, Finish, INK, Line, MUTED, Montage, ProductTag, W, silk } from '../fx'
import { Cam, Lux, Mirror, NotifDrop, PhoneShot, Rig, easeInOut, mix, pr, spline, tex } from '../shots'

/* Vague 4 : « Tes statistiques ». Un graphique en barres de verre lumineuses sur le sol miroir : les barres se lèvent « en temps réel »
   → liquide : les chiffres du tableau de bord (illustration) → fouet : une relance sur l'écran d'un client → néon de fin. */

export const TEX = ['lock-vide', 'lock-retour', 'notif-retour']
export const duree = () => END('ks05') + 2.4
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const H = [0.7, 0.95, 0.8, 1.15, 1.5, 1.9, 1.05]

const Bars = ({ t, rise }) => (
  <group>
    {H.map((h, i) => {
      const k = silk((t - rise - i * 0.12) / 0.9)
      const hh = Math.max(0.02, h * k)
      const x = (i - 3) * 0.5
      return (
        <group key={i} position={[x, 0, 0]}>
          <mesh position={[0, hh / 2, 0]}>
            <boxGeometry args={[0.32, hh, 0.32]} />
            <meshPhysicalMaterial color="#9cc8ff" metalness={0.1} roughness={0.05} transmission={0.6} thickness={0.4} transparent opacity={0.55} clearcoat={1} emissive="#2997ff" emissiveIntensity={0.25 + (i === 5 ? 0.35 : 0)} />
          </mesh>
          {/* arête lumineuse au sommet */}
          <mesh position={[0, hh + 0.008, 0]}>
            <boxGeometry args={[0.34, 0.016, 0.34]} />
            <meshBasicMaterial color={[0.6 * 3, 0.85 * 3, 3]} toneMapped={false} />
          </mesh>
        </group>
      )
    })}
  </group>
)

const Kpi = ({ t, at, value, label, x }) => {
  const k = silk((t - at) / 0.6)
  const n = Math.round(value * pr(t, at, at + 0.9, easeInOut))
  return (
    <div style={{ flex: 1, opacity: k, transform: `translateY(${(1 - k) * 30}px)`, filter: `blur(${(1 - k) * 8}px)`, padding: '26px 24px', borderRadius: 28, background: 'rgba(22,22,24,0.85)', border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ fontSize: 64, fontWeight: 650, letterSpacing: '-0.04em', color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{n.toLocaleString('fr-FR')}</div>
      <div style={{ fontSize: 26, color: MUTED, marginTop: 6 }}>{label}</div>
    </div>
  )
}

export const Stats = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX)
  const C1 = W('ks03', 0) - 0.35
  const C2 = W('ks04', 0) - 0.35
  const C3 = W('ks05', 0) - 0.45
  const rise = W('ks02', 10) - 0.4 // « en temps réel »
  const blur = pr(t, C1 - 0.2, C1 + 0.5, easeInOut) * (1 - pr(t, C2 - 0.3, C2, easeInOut))
  const shots = [
    {
      a: 0,
      b: C2,
      tr: 'whip',
      render: t =>
        ready && (
          <AbsoluteFill style={{ filter: blur > 0.01 ? `blur(${blur * 16}px) brightness(${1 - blur * 0.5})` : undefined }}>
            <Lux bloom={1.2}>
              <Cam pos={spline(t, [[0, [-2.8, 1.4, 7.4]], [rise, [-1.4, 1.3, 7.8]], [C1 + 1, [1.2, 1.5, 8.0]], [C2 + 0.6, [1.8, 1.8, 7.6]]])} look={[0, 1.05, 0]} fov={32} />
              <Mirror y={0}>
                <Bars t={t} rise={rise} />
              </Mirror>
              <Rig t={t} rimAt={0.2} sweep={[0.1, 1.8]} center={[0, 0.8, 0]} h={[2.6, -0.2]} len={5} />
            </Lux>
          </AbsoluteFill>
        ),
    },
    {
      a: C2,
      b: C3,
      tr: 'streak',
      render: t => {
        const at = W('ks04', 7) // « fais revenir »
        return (
          ready && (
            <PhoneShot t={t} screen={tex(t >= at ? 'lock-retour' : 'lock-vide')} glow={1 + Math.max(0, 1 - Math.abs(t - at) * 2.5) * 0.4} rot={[0.02, mix(0.35, 0.08, pr(t, C2, C3, easeInOut)), 0]} cam={spline(t, [[C2, [-0.5, 0.35, 5.0]], [C3 + 0.6, [0.1, 0.4, 4.3]]])} look={[0, 0.42, 0]} rig={{ rimAt: -1 }}>
              <NotifDrop t={t} at={at} map={tex('notif-retour')} />
            </PhoneShot>
          )
        )
      },
    },
    { a: C3, b: 99, render: t => <EndCard t={t} at={C3 + 0.3} dur={duree()} line="Fais revenir tes clients." /> },
  ]
  const panel = silk((t - C1) / 0.6) * (1 - pr(t, C2 - 0.4, C2, easeInOut))
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Montage t={t} shots={shots} />
      {panel > 0.001 && (
        <div style={{ position: 'absolute', left: 70, right: 70, top: 560, fontFamily, opacity: panel }}>
          <div style={{ fontSize: 24, fontWeight: 650, letterSpacing: '0.24em', color: ACCENT, marginBottom: 18 }}>CETTE SEMAINE</div>
          <div style={{ display: 'flex', gap: 18 }}>
            <Kpi t={t} at={W('ks03', 0)} value={164} label="clients actifs" />
            <Kpi t={t} at={W('ks03', 2)} value={412} label="passages" />
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 18 }}>
            <Kpi t={t} at={W('ks03', 3)} value={8240} label="points distribués" />
            <Kpi t={t} at={W('ks03', 5)} value={23} label="récompenses" />
          </div>
          <div style={{ fontSize: 22, color: 'rgba(245,245,247,0.35)', marginTop: 16, textAlign: 'center' }}>Données d’exemple</div>
        </div>
      )}
      <Finish t={t} />
      <Line t={t} id="ks01" top={250} size={70} accent={[2, 4]} blue={[5, 6]} />
      <Line t={t} id="ks02" top={230} size={58} blue={[1]} accent={[3, 4, 5, 6]} />
      <ProductTag t={t} at={W('ks02', 5)} out={C1 - 0.2} top={1520} />
      {t < C1 + 0.4 && t > W('ks02', 10) && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1460, display: 'flex', justifyContent: 'center', gap: 46, fontFamily, opacity: silk((t - W('ks02', 10)) / 0.6) * (1 - pr(t, C1 - 0.2, C1 + 0.2)) }}>
          {DAYS.map((d, i) => <span key={i} style={{ fontSize: 28, fontWeight: 600, color: i === 5 ? INK : MUTED }}>{d}</span>)}
        </div>
      )}
      <Line t={t} id="ks03" top={250} size={56} accent={[0, 1, 2, 3, 4]} blue={[9, 10, 11]} />
      <Line t={t} id="ks04" top={250} size={64} accent={[2, 3, 4]} blue={[7, 8]} />
      <Sound set="mstats" son={son} />
    </AbsoluteFill>
  )
}

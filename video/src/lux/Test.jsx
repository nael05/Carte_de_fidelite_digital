import { AbsoluteFill } from 'remotion'
import { useT } from '../lib'
import { tex, usePreload } from '../serie/kit'
import { Cam, Dust, Lux, Mirror, Neon, Pass, Phone, Softbox, Streaks } from './engine'

export const LuxTest = () => {
  const t = useT()
  const ready = usePreload(['lock-campagne', 'pass-graphite', 'wallet'])
  const sweep = -1.6 + ((t * 0.9) % 4)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {ready && (
        <Lux>
          <Cam pos={[1.2 * Math.sin(t * 0.3), 0.35, 5.2]} look={[0, 0.1, 0]} fov={30} />
          <Mirror y={-1.05}>
            <Phone screen={tex('lock-campagne')} glow={0.9} rotation={[0, -0.35 + t * 0.1, 0]} />
            <Pass map={tex('pass-graphite')} scale={0.55} position={[0.85, -0.6, 0.4]} rotation={[0, -0.5, 0]} />
          </Mirror>
          <Neon len={3.2} power={14} position={[0, sweep, 1.3]} />
          <Neon len={2.6} power={10} color="#7fbfff" position={[-1.4, 0.3, -1.2]} rotation-z={Math.PI / 2} rotation-y={0.6} />
          <Neon len={2.6} power={10} color="#ffffff" position={[1.5, 0.3, -1.0]} rotation-z={Math.PI / 2} rotation-y={-0.6} />
          <Softbox w={3} h={0.4} power={4} position={[0, 3, 1.5]} />
          <Dust t={t} center={[0, 0.5, 0.5]} />
          {t > 4 && <Streaks t={t} />}
        </Lux>
      )}
    </AbsoluteFill>
  )
}

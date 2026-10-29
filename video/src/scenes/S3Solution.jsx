import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { C, PHONE, Phone, Spot, Type, fontFamily, inE, ioE, lerp, tw } from '../lib'
import { Pass } from '../Pass'

/* Scène 3 — Solution (15 – 24 s)
   Les particules se solidifient en pass, « Fidelyz » se resserre,
   la carte rejoint la pile du Wallet d'un iPhone, orbite, puis seule la carte reste. */

const PX = 1250 // centre du téléphone
const PY = 540
const SLOT_TOP = 302 // position de la carte dans l'écran
const SLOT = { x: PX, y: PY - PHONE.h / 2 + PHONE.bezel + SLOT_TOP + (360 * 1.58) / 2 }

const STACK = [
  { skin: 'ivory', name: 'Atelier Nord', mark: 'A', pts: 120 },
  { skin: 'champagne', name: 'Fleurs & Co', mark: 'F', pts: 260 },
  { skin: 'azur', name: 'Le Comptoir', mark: 'C', pts: 90 },
]

const WalletChip = ({ label }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 20px',
      borderRadius: 999,
      border: `1px solid ${C.line}`,
      background: 'rgba(255,255,255,0.04)',
      fontFamily,
      fontSize: 24,
      fontWeight: 500,
      color: C.text,
    }}
  >
    <span style={{ position: 'relative', width: 26, height: 20, borderRadius: 5, background: '#2c2c2e', overflow: 'hidden' }}>
      <span style={{ position: 'absolute', left: 0, right: 0, top: 3, height: 4, background: C.blue }} />
      <span style={{ position: 'absolute', left: 0, right: 0, top: 8, height: 4, background: C.champagne }} />
      <span style={{ position: 'absolute', left: 0, right: 0, top: 13, height: 4, background: '#f5f5f7' }} />
    </span>
    {label}
  </div>
)

export const S3Solution = () => {
  const f = useCurrentFrame()

  // P1 : solidification
  const solid = tw(f, 4, 40)
  const warm = tw(f, 0, 44)

  // P2 : la carte glisse à gauche, le nom apparaît
  const side = tw(f, 40, 96, 0, 1, ioE)
  const title = tw(f, 46, 96)
  const titleOut = tw(f, 92, 106, 0, 1, inE)

  // P3 : le téléphone entre, une fois le titre parti
  const phoneIn = tw(f, 106, 146)

  // P4 : la carte vole jusqu'à la pile
  const fly = tw(f, 132, 186, 0, 1, ioE)
  const makeRoom = tw(f, 150, 184, 0, 1, ioE)

  // P5 : orbite
  const orbitT = interpolate(f, [186, 240], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const orbit = -30 * Math.sin(Math.PI * ioE(orbitT))

  // P6 : la carte se détache de l'écran et vient au centre, le téléphone recule dans le noir
  const lift = tw(f, 244, 272, 0, 1, ioE)
  const recede = tw(f, 244, 268, 0, 1, inE)
  const inPhone = f >= 186 && f < 244

  // Carte libre : vol vers la pile, puis décollage vers le centre
  const cardX = f < 244 ? lerp(lerp(960, 530, side), SLOT.x, fly) : lerp(SLOT.x, 960, lift)
  const cardY = f < 244 ? lerp(540, SLOT.y, fly) : lerp(SLOT.y, 540, lift)
  const cardS = f < 244 ? lerp(lerp(1, 0.85, side), 360 / 380, fly) : lerp(360 / 380, 1, lift)
  const cardRy = f < 244 ? lerp(lerp(0, 14, side), 0, fly) + Math.sin(Math.PI * fly) * -18 : 0
  const cardRx = f < 244 ? 0 : Math.sin(Math.PI * lift) * -12
  const cardRz = f < 244 ? Math.sin(Math.PI * fly) * 4 : 0
  const cardLight = f < 244 ? lerp(0.1, 0.8, side) : lerp(0.8, 0.9, lift)

  const phoneX = lerp(PX + 760, PX, phoneIn)
  const phoneY = PY + 160 * recede
  const ui = 1 - tw(f, 232, 250)

  return (
    <AbsoluteFill style={{ background: C.black }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 28%, #1c2532 0%, #0a0d12 55%, #000 100%)', opacity: 1 - warm }} />
      <Spot x={960} y={300} size={1600} color="rgba(255,255,255,0.07)" opacity={warm} />
      <Spot x={PX} y={PY} size={1100} color="rgba(41,151,255,0.10)" opacity={phoneIn * (1 - recede)} />

      {/* Contour hérité de la scène 2 */}
      <div
        style={{
          position: 'absolute',
          left: 960 - 190,
          top: 540 - 300,
          width: 380,
          height: 600,
          borderRadius: 19,
          border: `2px solid ${C.champagne}`,
          boxShadow: '0 0 30px rgba(227,201,164,0.45)',
          opacity: 1 - solid,
        }}
      />

      {/* Titre */}
      <div style={{ position: 'absolute', left: 1000, top: 410, width: 800, opacity: title * (1 - titleOut), filter: `blur(${(1 - title) * 14 + titleOut * 12}px)` }}>
        <div style={{ fontFamily, fontSize: 150, fontWeight: 600, color: C.text, letterSpacing: `${lerp(0.4, -0.045, title)}em`, lineHeight: 1 }}>Fidelyz</div>
        <div style={{ fontFamily, fontSize: 34, fontWeight: 500, color: C.muted, marginTop: 22, letterSpacing: '-0.02em', opacity: tw(f, 66, 92) }}>
          La carte de fidélité qui vit dans le Wallet.
        </div>
      </div>

      {/* Téléphone */}
      {phoneIn > 0 && recede < 1 && (
        <div
          style={{
            position: 'absolute',
            left: phoneX - PHONE.w / 2,
            top: phoneY - PHONE.h / 2,
            perspective: 2400,
            opacity: 1 - recede,
            filter: recede > 0 ? `blur(${recede * 8}px)` : undefined,
          }}
        >
          <div style={{ transform: `rotateY(${orbit + (1 - phoneIn) * -24}deg) rotateX(${recede * 18}deg) scale(${1 - 0.2 * recede})`, transformStyle: 'preserve-3d' }}>
            <Phone island>
              <div style={{ position: 'absolute', inset: 0 }}>
                <div style={{ position: 'absolute', left: 34, top: 22, fontFamily, fontSize: 17, fontWeight: 600, color: '#fff' }}>9:41</div>
                <div style={{ position: 'absolute', left: 24, top: 66, fontFamily, fontSize: 34, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Wallet</div>
                <div style={{ position: 'absolute', right: 26, top: 70, width: 30, height: 30, borderRadius: 15, background: '#2c2c2e', color: C.blue, fontFamily, fontSize: 24, lineHeight: '28px', textAlign: 'center' }}>+</div>
                {STACK.map((c, i) => (
                  <div key={c.name} style={{ position: 'absolute', left: 28, top: 120 + i * 58 - makeRoom * 10, height: 74, width: 360, overflow: 'hidden', borderRadius: 18 }}>
                    <Pass width={360} skin={c.skin} name={c.name} mark={c.mark} points={c.pts} />
                  </div>
                ))}
              </div>
              {inPhone && (
                <div style={{ position: 'absolute', left: 28, top: SLOT_TOP }}>
                  <Pass width={360} light={0.3 + orbitT * 0.6} />
                </div>
              )}
            </Phone>
          </div>
        </div>
      )}

      {/* Carte libre */}
      {!inPhone && (
        <div
          style={{
            position: 'absolute',
            left: cardX - 190,
            top: cardY - 300,
            transform: `scale(${cardS})`,
            opacity: solid,
            filter: solid < 1 ? `blur(${(1 - solid) * 12}px)` : undefined,
          }}
        >
          <Pass width={380} rx={cardRx} ry={cardRy} rz={cardRz} light={cardLight} />
        </div>
      )}

      {/* Légende */}
      <div style={{ position: 'absolute', left: 170, top: 400, width: 700, opacity: ui }}>
        <Type at={146} size={60}>Directement dans le Wallet de vos clients.</Type>
        <div style={{ display: 'flex', gap: 16, marginTop: 40 }}>
          <div style={{ opacity: tw(f, 196, 214), transform: `translateY(${(1 - tw(f, 196, 214)) * 12}px)` }}>
            <WalletChip label="Apple Wallet" />
          </div>
          <div style={{ opacity: tw(f, 206, 224), transform: `translateY(${(1 - tw(f, 206, 224)) * 12}px)` }}>
            <WalletChip label="Google Wallet" />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

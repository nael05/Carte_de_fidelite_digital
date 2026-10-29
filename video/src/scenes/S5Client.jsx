import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { C, PHONE, Phone, SCREEN, Spot, Type, camera, fontFamily, geo, inE, ioE, outE, tw } from '../lib'
import { Notif, Pass } from '../Pass'

/* Scène 5 — Parcours client (40 – 53 s)
   La caméra sort du noir de la carte et recule jusqu'au téléphone.
   Inscription → ajout au Wallet → écran verrouillé → la carte ouverte en caisse,
   puis la caméra plonge dans son QR code, que la scène 6 reprend dans le scanner. */

const PX = 1260
const PY = 540

const typed = (text, f, a, b) => text.slice(0, Math.round(tw(f, a, b, 0, text.length, t => t)))

const Status = ({ color = '#fff' }) => (
  <div style={{ position: 'absolute', left: 34, top: 22, fontFamily, fontSize: 17, fontWeight: 600, color }}>9:41</div>
)

const Input = ({ label, value, caret }) => (
  <div style={{ marginTop: 18 }}>
    <div style={{ fontSize: 14, fontWeight: 600, color: C.muted, marginBottom: 8 }}>{label}</div>
    <div style={{ height: 52, borderRadius: 14, background: '#1c1c1e', border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 18, color: C.text }}>
      {value}
      {caret && <span style={{ width: 2, height: 22, background: C.blue, marginLeft: 2 }} />}
    </div>
  </div>
)

const SignUp = ({ f }) => {
  const press = 1 - 0.04 * Math.sin(Math.PI * tw(f, 90, 104, 0, 1, t => t))
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', fontFamily, padding: '0 28px' }}>
      <Status />
      <div style={{ marginTop: 104, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #f6e4c8, #b8926a)', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: 32, color: '#1d1d1f' }}>L</div>
        <div style={{ marginTop: 14, fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>Maison Lumière</div>
        <div style={{ marginTop: 4, fontSize: 14, color: C.muted }}>Programme de fidélité</div>
      </div>
      <div style={{ marginTop: 42, fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: '-0.03em' }}>Rejoignez le programme</div>
      <div style={{ marginTop: 6, fontSize: 16, color: C.muted }}>Cumulez des points à chaque passage.</div>
      <Input label="Prénom" value={typed('Camille', f, 18, 36)} caret={f >= 14 && f < 40} />
      <Input label="E-mail" value={typed('camille@mail.fr', f, 42, 76)} caret={f >= 40 && f < 84} />
      <div style={{ marginTop: 30, height: 56, borderRadius: 16, background: C.blueBtn, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 600, transform: `scale(${press})`, filter: `brightness(${2 - press * 1})` }}>
        Créer ma carte
      </div>
    </div>
  )
}

const AddPass = ({ f }) => {
  const press = 1 - 0.04 * Math.sin(Math.PI * tw(f, 158, 172, 0, 1, t => t))
  const sheet = tw(f, 172, 204, 0, 1, ioE)
  const sheetOut = tw(f, 232, 250, 0, 1, inE)
  const tap = Math.sin(Math.PI * tw(f, 220, 232, 0, 1, t => t))
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', fontFamily }}>
      <Status />
      <div style={{ position: 'absolute', left: 38, top: 92 }}>
        <Pass width={340} light={0.4} points={0} />
      </div>
      <div style={{ position: 'absolute', left: 38, top: 92 + 340 * 1.58 + 26, width: 340 }}>
        <div style={{ height: 58, borderRadius: 12, background: '#000', border: '1px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#fff', fontSize: 19, fontWeight: 600, transform: `scale(${press})` }}>
          <span style={{ position: 'relative', width: 30, height: 22, borderRadius: 5, background: '#2c2c2e', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', left: 0, right: 0, top: 3, height: 5, background: C.blue }} />
            <span style={{ position: 'absolute', left: 0, right: 0, top: 9, height: 5, background: C.champagne }} />
            <span style={{ position: 'absolute', left: 0, right: 0, top: 15, height: 5, background: '#f5f5f7' }} />
          </span>
          Ajouter à Apple Wallet
        </div>
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 15, color: C.muted }}>ou Google Wallet sur Android</div>
      </div>

      {/* Feuille d'ajout iOS */}
      <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.5 * sheet * (1 - sheetOut)})` }} />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 56,
          bottom: 0,
          borderRadius: '26px 26px 0 0',
          background: '#1c1c1e',
          transform: `translateY(${(1 - sheet) * 880 + sheetOut * 880}px)`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px', fontSize: 18, color: C.blue }}>
          <span>Annuler</span>
          <span style={{ fontWeight: 700, padding: '2px 10px', margin: '-2px -10px', borderRadius: 8, background: `rgba(41,151,255,${0.25 * tap})` }}>Ajouter</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <Pass width={320} light={0.6} points={0} />
        </div>
      </div>
    </div>
  )
}

const Lock = ({ f }) => {
  const n1 = tw(f, 280, 300, 0, 1, ioE)
  const n2 = tw(f, 304, 324, 0, 1, ioE)
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily, background: 'radial-gradient(120% 70% at 30% 0%, #1b2b4d 0%, #070b14 55%, #000 100%)' }}>
      <div style={{ position: 'absolute', left: -120, bottom: -160, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(227,201,164,0.22), transparent)' }} />
      <div style={{ position: 'absolute', top: 78, width: '100%', textAlign: 'center', color: 'rgba(245,245,247,0.85)', fontSize: 19, fontWeight: 600 }}>Mardi 27 octobre</div>
      <div style={{ position: 'absolute', top: 96, width: '100%', textAlign: 'center', color: '#f5f5f7', fontSize: 104, fontWeight: 700, letterSpacing: '-0.03em' }}>9:41</div>
      <div style={{ position: 'absolute', left: 14, right: 14, top: 300 }}>
        <div style={{ opacity: n2, transform: `translateY(${(1 - n2) * -40}px) scale(${0.96 + 0.04 * n2})`, marginBottom: 8 }}>
          <Notif title="Maison Lumière" body="+20 points. Plus que 20 avant votre café offert." time="maintenant" />
        </div>
        <div style={{ opacity: n1, transform: `translateY(${(1 - n1) * -40 - (1 - n2) * 0}px) scale(${0.96 + 0.04 * n1})` }}>
          <Notif title="Wallet" body="Carte Maison Lumière ajoutée." time="il y a 1 min" />
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 12, left: '50%', width: 140, height: 5, marginLeft: -70, borderRadius: 3, background: 'rgba(255,255,255,0.7)' }} />
    </div>
  )
}

/* La carte telle que le client l'ouvre en caisse */
const PASS_TOP = 150
const PassView = ({ f }) => {
  const up = tw(f, 318, 344, 0, 1, ioE)
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', fontFamily, transform: `translateY(${(1 - up) * SCREEN.h}px)`, borderRadius: 40 * (1 - up) }}>
      <Status />
      <div style={{ position: 'absolute', top: 92, width: '100%', textAlign: 'center', fontSize: 15, fontWeight: 600, color: C.muted }}>Wallet</div>
      <div style={{ position: 'absolute', left: 28, top: PASS_TOP }}>
        <Pass width={360} light={0.5} points={480} />
      </div>
      <div style={{ position: 'absolute', top: PASS_TOP + 360 * 1.58 + 28, width: '100%', textAlign: 'center', fontSize: 16, color: C.muted }}>
        Présentez ce code en caisse
      </div>
    </div>
  )
}

// Centre du QR du pass, en coordonnées écran (pass de 360 : em = 19,19 px)
const QR_IN_SCREEN = { x: 28 + 180, y: PASS_TOP + 432.1 }
const QR_GLOBAL = { x: PX - SCREEN.w / 2 + QR_IN_SCREEN.x, y: PY - SCREEN.h / 2 + QR_IN_SCREEN.y }
export const QR_HANDOFF_WIDTH = 2000 // largeur du QR à l'image de raccord : il remplit tout le cadre

export const S5Client = () => {
  const f = useCurrentFrame()

  // Entrée : la caméra sort du noir de la carte (scène 4) et recule jusqu'au téléphone
  const pull = tw(f, 0, 42, 0, 1, outE)
  // Sortie : la caméra plonge dans le QR code présenté en caisse
  // (atteint son maximum à l'image 396, où la scène 6 prend le relais)
  const dive = tw(f, 338, 396, 0, 1, ioE)

  const camIn = camera(PX, PY - SCREEN.h / 2 + 760, geo(pull, 60, 1), 1 - pull)
  // Le QR se centre plus vite qu'il ne grossit : il est en place avant le raccord
  const camOut = camera(QR_GLOBAL.x, QR_GLOBAL.y, geo(dive, 1, QR_HANDOFF_WIDTH / (8.75 * 360 * 0.0533)), Math.min(1, dive * 1.5))
  const cam = f < 200 ? camIn : camOut

  const slide = tw(f, 110, 136, 0, 1, ioE)
  const dark = tw(f, 244, 256) * (1 - tw(f, 256, 272))
  const lock = f >= 256
  const ry = -8 * tw(f, 30, 100, 0, 1, ioE) * (1 - tw(f, 250, 336, 0, 1, ioE))

  return (
    <AbsoluteFill style={{ background: C.black }}>
      <AbsoluteFill style={cam}>
      <Spot x={PX} y={PY} size={1200} color="rgba(41,151,255,0.12)" />
      <Spot x={PX - 200} y={160} size={900} color="rgba(255,255,255,0.06)" />

      <div style={{ position: 'absolute', left: PX - PHONE.w / 2, top: PY - PHONE.h / 2, perspective: 2400 }}>
        <div style={{ transform: `rotateY(${ry}deg)` }}>
          <Phone>
            <div style={{ position: 'absolute', inset: 0 }}>
              {!lock && (
                <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-slide * SCREEN.w}px)` }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, width: SCREEN.w, height: SCREEN.h, overflow: 'hidden' }}>
                    <SignUp f={f} />
                  </div>
                  <div style={{ position: 'absolute', left: SCREEN.w, top: 0, width: SCREEN.w, height: SCREEN.h, overflow: 'hidden' }}>
                    <AddPass f={f} />
                  </div>
                </div>
              )}
              {lock && <Lock f={f} />}
              {f >= 318 && <PassView f={f} />}
              <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: dark }} />
            </div>
          </Phone>
        </div>
      </div>
      </AbsoluteFill>

      {/* Raccord avec le noir de la carte de la scène 4 */}
      <AbsoluteFill style={{ background: '#1c1c1e', opacity: 1 - tw(f, 0, 10) }} />

      <div style={{ position: 'absolute', left: 170, top: 430, width: 760 }}>
        <Type at={14} out={124} size={72}>Le client s’inscrit<br />en un instant.</Type>
      </div>
      <div style={{ position: 'absolute', left: 170, top: 430, width: 760 }}>
        <Type at={138} out={244} size={72}>Il ajoute sa carte.</Type>
        <Type at={154} out={244} size={32} weight={500} color={C.muted} style={{ marginTop: 24 }}>
          Apple Wallet ou Google Wallet, sans application à télécharger.
        </Type>
      </div>
      <div style={{ position: 'absolute', left: 170, top: 430, width: 760 }}>
        <Type at={262} out={322} size={72}>Et la retrouve<br />sur son écran verrouillé.</Type>
      </div>
    </AbsoluteFill>
  )
}

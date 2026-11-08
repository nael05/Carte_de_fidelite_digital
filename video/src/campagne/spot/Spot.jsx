import { AbsoluteFill, Audio, staticFile } from 'remotion'
import { Carte, CarteGoogle } from '../Carte'
import { C, E, FPS, FeuilleAjout, Grain, IPhone, Logo, Nuit, Plan, SH, Son, Titre, Verrouille, WalletApp, clamp, lerp, spring, ts, useT, font } from '../kit'
import { Android, CartePapier, GoogleWalletApp } from '../objets'
import { cues, W } from '../voix'

/* Spot de 25 s (paysage 1920 × 1080) : peu de mots, grandes compositions, slogan du site. */
export const Q = cues('spot')
export const DUREE = Q.$end + 0.4
const A = id => Q[id].at
const WW = 1920, HH = 1080
const N = p => <Nuit w={WW} h={HH} {...p} />
const Haut = ({ t, at, out, text, size = 72, accent, y = 120 }) => (
  <div style={{ position: 'absolute', left: 0, top: y, width: WW, display: 'flex', justifyContent: 'center', zIndex: 30 }}>
    <Titre t={t} at={at} out={out} text={text} size={size} width={1600} accent={accent} />
  </div>
)

const Papier = ({ t }) => {
  const d = ts(t, 0, A('sp02'), 0, 1, E.soft)
  const fall = ts(t, A('sp02') - 1.0, A('sp02') - 0.1, 0, 1, E.in)
  return (
    <AbsoluteFill>
      <N t={t} warm={0.3} cool={0.1} />
      <div style={{ position: 'absolute', left: 960 - 520, top: 640 - 322, perspective: 2000, transform: `translateY(${fall * 900}px) scale(${1.15 - 0.15 * d})`, filter: `saturate(${1 - 0.6 * d}) blur(${fall * 8}px)` }}>
        <div style={{ transform: `rotateX(${30 - 14 * d}deg) rotateZ(${-8 + 5 * d}deg) rotateY(${-10 + 10 * d}deg)` }}><CartePapier width={1040} stamps={7} worn={0.8} /></div>
      </div>
      <Haut t={t} at={A('sp01')} out={A('sp02') - 0.6} text="La carte papier a fait son temps." accent={{ 2: '#e9d5b7' }} />
    </AbsoluteFill>
  )
}

const Voici = ({ t }) => {
  const a = A('sp02')
  const p = ts(t, a - 0.2, a + 1.0, 0, 1, E.out)
  const split = ts(t, W(Q, 'sp02', 3) - 0.1, W(Q, 'sp02', 3) + 1.0, 0, 1, E.io)
  const sweep = ts(t, a + 0.2, a + 1.4, 0, 1, E.io)
  return (
    <AbsoluteFill>
      <N t={t + 2} />
      {split < 1 && (
        <div style={{ position: 'absolute', left: 960 - 200, top: 600 - 316 + (1 - p) * 120, opacity: (1 - split) * p }}>
          <Carte width={400} ry={-90 + 90 * p - 20 * split} rx={8} light={0.2 + 0.6 * sweep} />
        </div>
      )}
      {split > 0 && (
        <>
          <IPhone x={lerp(960, 760, split)} y={600} s={lerp(0.7, 0.86, split)} ry={14} rx={4} o={clamp(split * 2)}>
            <WalletApp><div style={{ position: 'absolute', left: 16, top: 120 }}><Carte width={358} light={0.5} shadow={0.5} /></div></WalletApp>
          </IPhone>
          <Android x={lerp(960, 1160, split)} y={600} s={lerp(0.7, 0.86, split)} ry={-14} o={clamp(split * 2)}>
            <GoogleWalletApp><div style={{ position: 'absolute', left: 16, top: 112 }}><CarteGoogle width={358} /></div></GoogleWalletApp>
          </Android>
        </>
      )}
      <Haut t={t} at={a} out={A('sp03') - 0.6} text="Voici la vôtre." accent={{ 2: C.blue }} y={70} size={64} />
    </AbsoluteFill>
  )
}

const Couleurs = ({ t }) => {
  const a = A('sp03')
  const k = ts(t, a - 0.6, A('sp04'), 0, 1, E.lin)
  const skins = ['graphite', 'azur', 'champagne', 'ivory']
  return (
    <AbsoluteFill>
      <N t={t + 4} />
      {skins.map((s, i) => {
        const ang = (i / 4) * Math.PI * 2 + k * 2.2
        const x = 960 + Math.sin(ang) * 470, z = Math.cos(ang)
        return (
          <div key={s} style={{ position: 'absolute', left: x - 200, top: 610 - 316 + (1 - z) * 20, zIndex: Math.round(z * 10) + 10, transform: `scale(${0.72 + 0.28 * (z + 1) / 2})`, filter: `brightness(${0.55 + 0.45 * (z + 1) / 2}) blur(${(1 - z) * 1.5}px)` }}>
            <Carte width={400} skin={s} ry={-Math.sin(ang) * 30} rx={6} light={0.4} />
          </div>
        )
      })}
      <Haut t={t} at={a} out={A('sp04') - 0.6} text="À vos couleurs." accent={{ 2: C.champagne }} y={70} size={64} />
    </AbsoluteFill>
  )
}

const Ajout = ({ t }) => {
  const a = A('sp04')
  const tAdd = W(Q, 'sp04', 4), tWallet = tAdd + 0.25
  const down = ts(t, tWallet, tWallet + 0.4, 0, 1, E.in)
  const ent = spring(t, a - 0.5, 4, 1)
  return (
    <AbsoluteFill>
      <N t={t + 6} />
      <IPhone x={960} y={640 + (1 - ent) * 700} s={0.88} rx={6} ry={-8 + 14 * ts(t, a, A('sp05'))}>
        <WalletApp><div style={{ position: 'absolute', left: 16, top: 120 + (1 - spring(t, tWallet, 6, 0.85)) * 500 }}><Carte width={358} light={0.5} shadow={0.5} /></div></WalletApp>
        {t < tWallet + 0.5 && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 5, transform: `translateY(${down * SH}px)` }}>
            <FeuilleAjout t={t} at={a - 0.3}><Carte width={300} shadow={0.4} /></FeuilleAjout>
          </div>
        )}
      </IPhone>
      <Haut t={t} at={a} out={A('sp05') - 0.6} text="Ajoutée en 10 secondes." accent={{ 2: C.green, 3: C.green }} y={70} size={64} />
    </AbsoluteFill>
  )
}

const Revenir = ({ t }) => {
  const a = A('sp05')
  const tN = a + 0.3
  const z = ts(t, tN + 0.3, A('sp06'), 0, 1, E.io)
  return (
    <AbsoluteFill>
      <N t={t + 8} />
      <IPhone x={960} y={lerp(640, 560 - (690 - SH / 2) * 1.7, z)} s={lerp(0.88, 1.7, z)} rx={6 * (1 - z)} time="">
        <Verrouille t={t} time="11:24" notifs={[{ at: tN, body: 'Le chocolat chaud est de retour ☕ Votre 2e boisson est offerte cette semaine.' }]} />
      </IPhone>
      <Haut t={t} at={a} out={A('sp06') - 0.5} text="Et capable de les faire revenir." accent={{ 5: C.blue }} y={70} size={64} />
    </AbsoluteFill>
  )
}

const Fin = ({ t }) => {
  const a = A('sp06')
  const l = spring(t, a - 0.1, 4, 1)
  return (
    <AbsoluteFill>
      <N t={t + 10} />
      <div style={{ position: 'absolute', left: 960 - 70, top: 250, opacity: clamp(l), transform: `scale(${0.85 + 0.15 * l})`, filter: `blur(${(1 - clamp(l)) * 10}px)` }}><Logo size={140} /></div>
      <div style={{ position: 'absolute', left: 0, width: WW, top: 430, display: 'flex', justifyContent: 'center' }}><Titre t={t} at={a + 0.1} text="La fidélité," size={130} width={1600} /></div>
      <div style={{ position: 'absolute', left: 0, width: WW, top: 580, display: 'flex', justifyContent: 'center' }}><Titre t={t} at={W(Q, 'sp06', 3)} text="réinventée." size={130} width={1600} accent={{ 0: 'grad' }} /></div>
      <div style={{ position: 'absolute', left: 0, width: WW, top: 800, textAlign: 'center', fontFamily: font, fontSize: 38, fontWeight: 600, color: C.muted, opacity: ts(t, W(Q, 'sp06', 3) + 0.6, W(Q, 'sp06', 3) + 1.1) }}>fidelyzapp.fr</div>
    </AbsoluteFill>
  )
}

export const Spot = ({ voix = true, son = true }) => {
  const t = useT()
  const cut = id => A(id) - 0.45
  const P = { w: WW, h: HH, ox: 960, oy: 540 }
  const speaking = f => Q.$list.some(c => f / FPS > c.at - 0.1 && f / FPS < c.at + c.dur + 0.15)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Plan t={t} a={0} b={cut('sp02')} tin="cut" tout="push" dout={0.9} {...P}><Papier t={t} /></Plan>
      <Plan t={t} a={cut('sp02')} b={cut('sp03')} tin="push" din={0.9} tout="push" dout={0.9} {...P}><Voici t={t} /></Plan>
      <Plan t={t} a={cut('sp03')} b={cut('sp04')} tin="push" din={0.9} tout="push" dout={0.9} {...P}><Couleurs t={t} /></Plan>
      <Plan t={t} a={cut('sp04')} b={cut('sp05')} tin="push" din={0.9} tout="push" dout={0.9} {...P}><Ajout t={t} /></Plan>
      <Plan t={t} a={cut('sp05')} b={cut('sp06')} tin="push" din={0.9} tout="push" dout={1.0} {...P}><Revenir t={t} /></Plan>
      <Plan t={t} a={cut('sp06')} b={DUREE + 1} tin="push" din={1.0} tout="cut" {...P}><Fin t={t} /></Plan>
      <Grain o={0.035} />
      {son && (
        <>
          <Audio src={staticFile('sons_tt/musique-noir.mp3')} startFrom={Math.round(90 * FPS)} volume={f => {
            const tt = f / FPS
            return Math.min(1, tt / 0.8) * Math.min(1, (DUREE - tt) / 2) * (voix && speaking(f) ? 0.1 : 0.45)
          }} />
          {voix && Q.$list.filter(c => c.voice).map(c => <Son key={c.id} src={`campagne/voix/${c.id}.mp3`} at={c.at - c.lead} />)}
          {['sp02', 'sp03', 'sp04', 'sp05', 'sp06'].map(id => <Son key={id} src="sons_tt/whoosh7.mp3" at={A(id) - 0.7} vol={0.3} />)}
          <Son src="sons_tt/scintille.mp3" at={A('sp02')} vol={0.3} />
          <Son src="sons_tt/notif.mp3" at={A('sp05') + 0.3} vol={0.45} />
          <Son src="sons_tt/hit_logo.mp3" at={A('sp06') - 0.15} vol={0.3} />
        </>
      )}
    </AbsoluteFill>
  )
}

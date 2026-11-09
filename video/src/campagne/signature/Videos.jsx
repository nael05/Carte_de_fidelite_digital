import { AbsoluteFill } from 'remotion'
import { Carte, CarteGoogle } from '../Carte'
import { BarreSafari, C, E, FeuilleAjout, IPhone, MacBook, Page, SH, SW, Verrouille, WalletApp, kf, spring, useT } from '../kit'
import { Android, GoogleWalletApp, Presentoir } from '../objets'
import { Accueil } from '../client/Client'
import { cues, W } from '../voix'
import { BandeSig, FinSig, Fondu, Ligne, Reflet, StudioBlanc, StudioNoir, clamp, lerp, ts } from './sig'

const io = E.io
const SOL = 1560
const dur = Q => Q.$end + 0.4

/* La carte en héros : centrée, posée sur le sol, lumière qui glisse */
const CarteHeros = ({ t, w = 540, ry = 0, rx = 6, points = 480, light = 0.4, skin, vars, build, y }) => {
  const h = w * 1.58
  return <div style={{ position: 'absolute', left: 540 - w / 2, top: y ?? SOL - h - 36 }}><Carte width={w} ry={ry} rx={rx} points={points} light={light} skin={skin} vars={vars} build={build} shadow={0.7} /></div>
}
const yPhone = s => SOL - (SH + 26) * s / 2 - 30

/* ─────────── 1. La carte, réinventée ─────────── */
export const QA = cues('sig-carte')
export const SigCarte = ({ voix = true, son = true }) => {
  const t = useT(), Q = QA, A = id => Q[id].at, D = dur(Q)
  const c1 = A('sa3') - 0.3, c2 = A('sa5') - 0.3, c3 = A('sa6') - 0.3, c4 = A('sa7') - 0.3
  const apparition = ts(t, 0, 0.7, 0, 1, io)
  const tour = ts(t, A('sa2') - 0.15, A('sa2') + 1.1, 0, 1, io)
  const ry = lerp(-26, 6, ts(t, 0, c1, 0, 1, io)) + 360 * tour
  const a4 = ts(t, A('sa4') - 0.2, A('sa4') + 1.4, 0, 1, io)
  const maj = ts(t, W(Q, 'sa5', 6), W(Q, 'sa5', 6) + 1.4, 0, 1, io)
  const push = ts(t, c3, c4, 0, 1, io)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Fondu t={t} a={0} b={c1}>
        <StudioNoir glow={apparition} />
        <Reflet sol={SOL}><div style={{ opacity: apparition }}><CarteHeros t={t} ry={ry} light={0.1 + 0.7 * ts(t, 0.2, 2.4, 0, 1, io)} /></div></Reflet>
        <Ligne t={t} at={A('sa1')} out={A('sa2') - 0.5} y={230}>Voici la carte de fidélité.</Ligne>
        <Ligne t={t} at={A('sa2')} out={c1 - 0.5} y={230} color={C.blue} size={96}>Réinventée.</Ligne>
      </Fondu>
      <Fondu t={t} a={c1} b={c2}>
        <StudioNoir />
        <Reflet sol={SOL}>
          <IPhone x={lerp(540, 330, a4)} y={yPhone(lerp(1.1, 0.95, a4))} s={lerp(1.1, 0.95, a4)} ry={lerp(-8, 12, ts(t, c1, c2, 0, 1, io))} rx={2} shadow={0.6}>
            <WalletApp><div style={{ position: 'absolute', left: 16, top: 120 }}><Carte width={358} light={0.45} shadow={0.5} /></div></WalletApp>
          </IPhone>
          {a4 > 0 && <Android x={lerp(1000, 760, a4)} y={yPhone(0.95)} s={0.95} ry={lerp(-20, -10, a4)} o={a4}>
            <GoogleWalletApp><div style={{ position: 'absolute', left: 16, top: 112 }}><CarteGoogle width={358} /></div></GoogleWalletApp>
          </Android>}
        </Reflet>
        <Ligne t={t} at={A('sa3')} out={A('sa4') - 0.5} y={230} size={68}>Elle vit dans le téléphone de vos clients.</Ligne>
        <Ligne t={t} at={A('sa4')} out={c2 - 0.5} y={230} size={68}>Apple Wallet. Google Wallet.</Ligne>
      </Fondu>
      <Fondu t={t} a={c2} b={c3}>
        <StudioNoir glow={0.7} />
        <div style={{ position: 'absolute', left: 540 - 560, top: 600 - 50 * ts(t, c2, c3, 0, 1, io), transform: `scale(${1 + 0.05 * ts(t, c2, c3, 0, 1, io)})`, transformOrigin: '50% 20%' }}>
          <Carte width={1120} rx={4} ry={-4 + 6 * ts(t, c2, c3, 0, 1, io)} points={480 + 20 * maj} light={0.3 + 0.4 * ts(t, c2, c3, 0, 1, io)} shadow={0.6} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1380, bottom: 0, background: 'linear-gradient(180deg, transparent, #000 40%)' }} />
        <Ligne t={t} at={A('sa5')} out={W(Q, 'sa5', 5) - 0.4} y={230} size={68}>Elle ne s'oublie jamais.</Ligne>
        <Ligne t={t} at={W(Q, 'sa5', 5)} out={c3 - 0.5} y={230} size={68}>Elle se met à jour toute seule.</Ligne>
      </Fondu>
      <Fondu t={t} a={c3} b={c4}>
        <StudioNoir />
        <Reflet sol={SOL}>
          <IPhone x={540} y={yPhone(1.1) - 40 * push} s={1.1 + 0.1 * push} ry={lerp(10, -4, push)} rx={2} time="" shadow={0.6}>
            <Verrouille t={t} time="11:24" notifs={[{ at: A('sa6') + 0.5, body: 'Le chocolat chaud est de retour ☕ Votre 2e boisson est offerte cette semaine.' }]} />
          </IPhone>
        </Reflet>
        <Ligne t={t} at={A('sa6')} out={c4 - 0.5} y={230} size={68}>Et elle sait les faire revenir.</Ligne>
      </Fondu>
      <Fondu t={t} a={c4} b={D + 1}>
        <StudioNoir glow={0.6} />
        <FinSig t={t} at={A('sa7') - 0.2} />
      </Fondu>
      {son && <BandeSig Q={Q} video="sig-carte" duree={D} voix={voix} sons={[['sons_tt/notif_douce.mp3', A('sa6') + 0.5]]} />}
    </AbsoluteFill>
  )
}
export const D_SIGCARTE = dur(QA)

/* ─────────── 2. Un message, au bon moment ─────────── */
export const QB = cues('sig-message')
const MSG = [
  { body: '-20 % sur toutes les boissons ce week-end.', time: 'vendredi' },
  { body: 'Nouveau : le croissant aux amandes est arrivé 🥐', time: 'mardi' },
  { body: 'Plus que 20 points avant votre café offert ☕', time: 'maintenant' },
]
export const SigMessage = ({ voix = true, son = true }) => {
  const t = useT(), Q = QB, A = id => Q[id].at, D = dur(Q)
  const c1 = A('sb2') - 0.3, c2 = A('sb5') - 0.3
  const z = ts(t, 0.4, c1 + 0.3, 0, 1, io)
  const n1 = A('sb1') + 0.35
  const tb3 = [W(Q, 'sb3', 1), W(Q, 'sb3', 3), W(Q, 'sb3', 5)]
  const tourne = ts(t, c1, c2, 0, 1, io)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Fondu t={t} a={0} b={c1}>
        <StudioNoir />
        <IPhone x={540} y={lerp(1060 - (700 - SH / 2) * 2.4, 1060 - (700 - SH / 2) * 2.1, z)} s={lerp(2.4, 2.1, z)} time="" shadow={0}>
          <Verrouille t={t} time="9:41" notifs={[{ at: n1, body: 'Le chocolat chaud est de retour ☕ Votre 2e boisson est offerte cette semaine.' }]} />
        </IPhone>
        <Ligne t={t} at={A('sb1')} out={c1 - 0.5} y={260} size={92}>Un message.</Ligne>
      </Fondu>
      <Fondu t={t} a={c1} b={c2}>
        <StudioNoir />
        <Reflet sol={SOL}>
          <IPhone x={540} y={yPhone(1.1)} s={1.1} ry={lerp(-10, 8, tourne)} rx={2} time="" shadow={0.6}>
            <Verrouille t={t} time="9:41" notifs={[{ at: -10, body: 'Le chocolat chaud est de retour ☕ Votre 2e boisson est offerte cette semaine.', time: 'hier', dim: true }, ...MSG.map((m, i) => ({ at: tb3[i], ...m }))]} />
          </IPhone>
        </Reflet>
        <Ligne t={t} at={A('sb2')} out={A('sb3') - 0.5} y={230} size={68}>Sur l'écran verrouillé de vos clients.</Ligne>
        <Ligne t={t} at={A('sb3')} out={A('sb4') - 0.5} y={230} size={68}>Une offre. Une nouveauté. Un rappel.</Ligne>
        <Ligne t={t} at={A('sb4')} out={c2 - 0.5} y={230} size={92} color={C.blue}>Au bon moment.</Ligne>
      </Fondu>
      <Fondu t={t} a={c2} b={D + 1}>
        <StudioNoir glow={0.6} />
        <FinSig t={t} at={A('sb5') - 0.2} promesse="Faites revenir vos clients." />
      </Fondu>
      {son && <BandeSig Q={Q} video="sig-message" duree={D} voix={voix} sons={[['sons_tt/notif_douce.mp3', n1], ...tb3.map(x => ['sons_tt/notif_douce.mp3', x])]} />}
    </AbsoluteFill>
  )
}
export const D_SIGMESSAGE = dur(QB)

/* ─────────── 3. À votre image (studio blanc) ─────────── */
export const QC = cues('sig-design')
const PEAUX = ['ivory', 'azur', 'champagne', 'graphite']
export const SigDesign = ({ voix = true, son = true }) => {
  const t = useT(), Q = QC, A = id => Q[id].at, D = dur(Q)
  const c1 = A('sc4') - 0.3, c2 = A('sc5') - 0.3
  const logo = ts(t, A('sc1'), A('sc1') + 0.9, 0, 1, io)
  const strip = ts(t, A('sc3'), A('sc3') + 1.0, 0, 1, io)
  const ch = [A('sc2'), A('sc2') + 0.55, A('sc2') + 1.1].map(x => ts(t, x, x + 0.6, 0, 1, io))
  const ry = lerp(-18, 14, ts(t, 0, c1, 0, 1, io))
  const build = { mark: logo, org: logo, points: logo, fields: 1, barcode: 1, strip }
  const mb = ts(t, c1, c2, 0, 1, io)
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <Fondu t={t} a={0} b={c1}>
        <StudioBlanc />
        <div style={{ position: 'absolute', left: 540 - 320, top: SOL - 30, width: 640, height: 60, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(0,0,0,0.16), transparent)' }} />
        {PEAUX.map((p, i) => {
          const o = i === 0 ? 1 - ch[0] : i === 3 ? ch[2] : ch[i - 1] * (1 - ch[i])
          return o > 0.001 && <div key={p} style={{ opacity: o }}><CarteHeros t={t} skin={p} ry={ry} build={build} light={0.35} /></div>
        })}
        <Ligne t={t} at={A('sc1')} out={A('sc2') - 0.4} y={230} size={92} color="#1d1d1f">Votre logo.</Ligne>
        <Ligne t={t} at={A('sc2')} out={A('sc3') - 0.4} y={230} size={92} color="#1d1d1f">Vos couleurs.</Ligne>
        <Ligne t={t} at={A('sc3')} out={c1 - 0.5} y={230} size={92} color="#1d1d1f">Votre carte.</Ligne>
      </Fondu>
      <Fondu t={t} a={c1} b={c2}>
        <StudioBlanc />
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transform: `scale(${lerp(0.84, 0.9, mb)})`, transformOrigin: '540px 1000px' }}>
          <MacBook x={540} y={1000} s={0.9} rx={4}>
            <Page name="d-carte-graphite" w={1440} h={900} bars={false} layers={[{ name: 'd-carte-azur', o: ts(t, c1 + 1.2, c1 + 1.8, 0, 1, io) }]} />
          </MacBook>
        </div>
        <Ligne t={t} at={A('sc4')} out={c2 - 0.5} y={230} size={64} color="#1d1d1f" maxW={860}>Créée en quelques minutes, depuis votre espace pro.</Ligne>
      </Fondu>
      <Fondu t={t} a={c2} b={D + 1}>
        <StudioBlanc />
        <FinSig t={t} at={A('sc5') - 0.2} dark={false} promesse="Une carte à votre image." />
      </Fondu>
      {son && <BandeSig Q={Q} video="sig-design" duree={D} voix={voix} />}
    </AbsoluteFill>
  )
}
export const D_SIGDESIGN = dur(QC)

/* ─────────── 4. Un scan ─────────── */
export const QD = cues('sig-caisse')
export const SigCaisse = ({ voix = true, son = true }) => {
  const t = useT(), Q = QD, A = id => Q[id].at, D = dur(Q)
  const c1 = A('sd2') - 0.3, c2 = A('sd3') - 0.3, c3 = A('sd4') - 0.3, c4 = A('sd5') - 0.3
  const scan = ts(t, A('sd2') + 0.1, A('sd2') + 1.3, 0, 1, io)
  const done = t > A('sd3') + 0.2
  const maj = ts(t, A('sd4') + 0.6, A('sd4') + 2.0, 0, 1, io)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Fondu t={t} a={0} b={c1}>
        <StudioNoir />
        <Reflet sol={SOL}>
          <IPhone x={540} y={yPhone(1.1)} s={1.1} ry={lerp(-12, 4, ts(t, 0, c1, 0, 1, io))} rx={2} inset shadow={0.6}><Page name="m-caisse" /></IPhone>
        </Reflet>
        <Ligne t={t} at={A('sd1')} out={c1 - 0.5} y={230} size={92}>En caisse.</Ligne>
      </Fondu>
      <Fondu t={t} a={c1} b={c2}>
        <StudioNoir glow={0.6} />
        <div style={{ position: 'absolute', left: 540 - 800, top: -820 + 30 * ts(t, c1, c2, 0, 1, io) }}>
          <Carte width={1600} rx={2} ry={0} light={0.4} scan={scan > 0 && scan < 1 ? scan : null} shadow={0.4} />
        </div>
        <div style={{ position: 'absolute', left: 540 - 380, top: 1180, width: 760, height: 760, borderRadius: '50%', background: `radial-gradient(closest-side, rgba(41,151,255,${0.35 * Math.sin(Math.PI * scan)}), transparent)`, mixBlendMode: 'screen' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 760, background: 'linear-gradient(180deg, #000 55%, transparent)' }} />
        <Ligne t={t} at={A('sd2')} out={c2 - 0.5} y={230} size={92}>Un scan.</Ligne>
      </Fondu>
      <Fondu t={t} a={c2} b={c3}>
        <StudioNoir />
        <Reflet sol={SOL}>
          <IPhone x={540} y={yPhone(1.1)} s={1.1} ry={lerp(6, -6, ts(t, c2, c3, 0, 1, io))} rx={2} inset shadow={0.6}>
            <Page name="m-caisse-points20" />
            <div style={{ position: 'absolute', inset: 0, opacity: done ? ts(t, A('sd3') + 0.2, A('sd3') + 0.7, 0, 1, io) : 0 }}><Page name="m-caisse-done" /></div>
          </IPhone>
        </Reflet>
        <Ligne t={t} at={A('sd3')} out={c3 - 0.5} y={230} size={80}>Les points sont ajoutés.</Ligne>
      </Fondu>
      <Fondu t={t} a={c3} b={c4}>
        <StudioNoir glow={0.7} />
        <div style={{ position: 'absolute', left: 540 - 560, top: 600 - 50 * ts(t, c3, c4, 0, 1, io) }}>
          <Carte width={1120} rx={4} ry={-3 + 5 * ts(t, c3, c4, 0, 1, io)} points={480 + 20 * maj} light={0.3 + 0.4 * maj} shadow={0.6} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1380, bottom: 0, background: 'linear-gradient(180deg, transparent, #000 40%)' }} />
        <Ligne t={t} at={A('sd4')} out={c4 - 0.5} y={230} size={64} maxW={880}>Et la carte de votre client se met à jour.</Ligne>
      </Fondu>
      <Fondu t={t} a={c4} b={D + 1}>
        <StudioNoir glow={0.6} />
        <FinSig t={t} at={A('sd5') - 0.2} promesse="Un scan, et c'est à jour." />
      </Fondu>
      {son && <BandeSig Q={Q} video="sig-caisse" duree={D} voix={voix} sons={[['sons_tiktok/bip-caisse.mp3', A('sd2') + 1.2]]} />}
    </AbsoluteFill>
  )
}
export const D_SIGCAISSE = dur(QD)

/* ─────────── 5. Rien à installer ─────────── */
export const QE = cues('sig-client')
export const SigClient = ({ voix = true, son = true }) => {
  const t = useT(), Q = QE, A = id => Q[id].at, D = dur(Q)
  const c1 = A('se2') - 0.3, c2 = A('se3') - 0.3, c3 = A('se4') - 0.3, c4 = A('se5') - 0.3, c5 = A('se6') - 0.3
  const sheet = ts(t, A('se4') - 0.2, A('se4') + 0.5, 0, 1, io)
  const wal = spring(t, A('se5') - 0.1, 4, 1)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Fondu t={t} a={0} b={c1}>
        <StudioNoir />
        <Reflet sol={SOL}>
          <IPhone x={540} y={yPhone(1.1)} s={1.1} ry={lerp(-10, 6, ts(t, 0, c1, 0, 1, io))} rx={2} shadow={0.6}><Accueil t={t} noStore={ts(t, A('se1') + 0.6, A('se1') + 1.6, 0, 1, io)} /></IPhone>
        </Reflet>
        <Ligne t={t} at={A('se1')} out={c1 - 0.5} y={230} size={72}>Pour vos clients, rien à installer.</Ligne>
      </Fondu>
      <Fondu t={t} a={c1} b={c2}>
        <StudioNoir />
        <Reflet sol={SOL}>
          <div style={{ position: 'absolute', left: 540 - 250, top: SOL - 710 - 30, perspective: 2000 }}>
            <div style={{ transform: `rotateY(${lerp(-16, 12, ts(t, c1, c2, 0, 1, io))}deg)` }}><Presentoir width={500} /></div>
          </div>
        </Reflet>
        <Ligne t={t} at={A('se2')} out={c2 - 0.5} y={230} size={92}>Un QR code.</Ligne>
      </Fondu>
      <Fondu t={t} a={c2} b={c4}>
        <StudioNoir />
        <Reflet sol={SOL}>
          <IPhone x={540} y={yPhone(1.1)} s={1.1} ry={lerp(8, -6, ts(t, c2, c4, 0, 1, io))} rx={2} shadow={0.6}>
            <div style={{ position: 'absolute', left: 0, top: 50, width: SW, height: SH - 50 }}><Page name="m-join-filled" bars={false} /></div>
            <div style={{ position: 'absolute', left: 0, top: 0, width: SW, height: 50, background: '#000' }} />
            <BarreSafari />
            {sheet > 0 && <div style={{ position: 'absolute', inset: 0, zIndex: 5, opacity: clamp(sheet * 2) }}><FeuilleAjout t={t} at={A('se4') - 0.2}><Carte width={300} shadow={0.4} /></FeuilleAjout></div>}
          </IPhone>
        </Reflet>
        <Ligne t={t} at={A('se3')} out={A('se4') - 0.4} y={230} size={92}>Un prénom.</Ligne>
        <Ligne t={t} at={A('se4')} out={c4 - 0.5} y={230} size={92} color={C.blue}>Ajouter.</Ligne>
      </Fondu>
      <Fondu t={t} a={c4} b={c5}>
        <StudioNoir />
        <Reflet sol={SOL}>
          <IPhone x={540} y={yPhone(1.1)} s={1.1} ry={lerp(-6, 8, ts(t, c4, c5, 0, 1, io))} rx={2} shadow={0.6}>
            <WalletApp><div style={{ position: 'absolute', left: 16, top: 120 + (1 - wal) * 640 }}><Carte width={358} light={0.45} shadow={0.5} /></div></WalletApp>
          </IPhone>
        </Reflet>
        <Ligne t={t} at={A('se5')} out={c5 - 0.5} y={230} size={68} sub="En dix secondes.">Leur carte est dans leur Wallet.</Ligne>
      </Fondu>
      <Fondu t={t} a={c5} b={D + 1}>
        <StudioNoir glow={0.6} />
        <FinSig t={t} at={A('se6') - 0.2} promesse="Sans application." />
      </Fondu>
      {son && <BandeSig Q={Q} video="sig-client" duree={D} voix={voix} sons={[['sons_tt/clic.mp3', A('se4') + 0.3]]} />}
    </AbsoluteFill>
  )
}
export const D_SIGCLIENT = dur(QE)

/* ─────────── Le film (paysage 1920 × 1080) ─────────── */
export const QF = cues('sig-film', 0.6)
const WW = 1920, HH = 1080, SOLP = 900
export const SigFilm = ({ voix = true, son = true }) => {
  const t = useT(), Q = QF, A = id => Q[id].at, D = dur(Q)
  const c = ['sf3', 'sf4', 'sf5', 'sf6', 'sf7', 'sf8', 'sf9'].map(id => A(id) - 0.3)
  const F = (a, b, ch) => <Fondu t={t} a={a} b={b} w={WW} h={HH} d={0.8}>{ch}</Fondu>
  const N = p => <StudioNoir w={WW} h={HH} sol={0.84} {...p} />
  const L = (at, out, txt, extra = {}) => <Ligne t={t} at={at} out={out} y={80} w={WW} size={60} maxW={1500} lent {...extra}>{txt}</Ligne>
  const tour = ts(t, A('sf2') - 0.1, A('sf2') + 1.7, 0, 1, io)
  const yP = s => SOLP - (SH + 26) * s / 2 - 20
  const maj = ts(t, A('sf6') + 1.2, A('sf6') + 2.6, 0, 1, io)
  const wal = spring(t, A('sf5') + 1.4, 4, 1)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {F(0, c[0], <>
        {N({ glow: ts(t, 0, 1.6, 0, 1, io) })}
        <Reflet sol={SOLP} long={220}>
          <div style={{ position: 'absolute', left: WW / 2 - 210, top: SOLP - 664 - 24, opacity: ts(t, 0, 1.4, 0, 1, io) }}>
            <Carte width={420} rx={6} ry={lerp(-24, 6, ts(t, 0, c[0], 0, 1, io)) + 360 * tour} light={0.1 + 0.7 * ts(t, 0.2, 2.4, 0, 1, io)} shadow={0.7} />
          </div>
        </Reflet>
        {L(A('sf1'), A('sf2') - 0.5, 'Voici la carte de fidélité.')}
        {L(A('sf2'), c[0] - 0.5, 'Réinventée.', { color: C.blue, size: 84 })}
      </>)}
      {F(c[0], c[1], <>
        {N()}
        <Reflet sol={SOLP} long={220}>
          <IPhone x={790} y={yP(0.64)} s={0.64} ry={lerp(4, 14, ts(t, c[0], c[1], 0, 1, io))} rx={2} shadow={0.6}><WalletApp><div style={{ position: 'absolute', left: 16, top: 120 }}><Carte width={358} light={0.45} shadow={0.5} /></div></WalletApp></IPhone>
          <Android x={1130} y={yP(0.64)} s={0.64} ry={lerp(-4, -14, ts(t, c[0], c[1], 0, 1, io))} o={ts(t, c[0] + 0.4, c[0] + 1.2, 0, 1, io)}><GoogleWalletApp><div style={{ position: 'absolute', left: 16, top: 112 }}><CarteGoogle width={358} /></div></GoogleWalletApp></Android>
        </Reflet>
        {L(A('sf3'), c[1] - 0.5, 'Dans le téléphone de vos clients.', { sub: 'Apple Wallet · Google Wallet' })}
      </>)}
      {F(c[1], c[2], <>
        <StudioBlanc />
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${lerp(0.96, 1.02, ts(t, c[1], c[2], 0, 1, io))})`, transformOrigin: '960px 560px' }}>
          <MacBook x={960} y={600} s={0.8} rx={4}><Page name="d-carte-graphite" w={1440} h={900} bars={false} layers={[{ name: 'd-carte-azur', o: ts(t, c[1] + 1.0, c[1] + 1.6, 0, 1, io) }, { name: 'd-carte-champagne', o: ts(t, c[1] + 2.0, c[1] + 2.6, 0, 1, io) }]} /></MacBook>
        </div>
        {L(A('sf4'), c[2] - 0.5, 'À votre image. En quelques minutes.', { color: '#1d1d1f' })}
      </>)}
      {F(c[2], c[3], <>
        {N()}
        <Reflet sol={SOLP} long={220}>
          <IPhone x={960} y={yP(0.64)} s={0.64} ry={lerp(-10, 8, ts(t, c[2], c[3], 0, 1, io))} rx={2} shadow={0.6}>
            <div style={{ position: 'absolute', left: 0, top: 50, width: SW, height: SH - 50 }}><Page name="m-join-filled" bars={false} /></div>
            <div style={{ position: 'absolute', left: 0, top: 0, width: SW, height: 50, background: '#000' }} />
            <BarreSafari />
            {t > A('sf5') + 1.3 && <div style={{ position: 'absolute', inset: 0, zIndex: 5, opacity: ts(t, A('sf5') + 1.3, A('sf5') + 1.7, 0, 1, io) }}><WalletApp><div style={{ position: 'absolute', left: 16, top: 120 + (1 - wal) * 640 }}><Carte width={358} light={0.45} shadow={0.5} /></div></WalletApp></div>}
          </IPhone>
        </Reflet>
        {L(A('sf5'), c[3] - 0.5, 'Ajoutée en dix secondes.', { sub: 'Sans rien installer.' })}
      </>)}
      {F(c[3], c[4], <>
        {N({ glow: 0.7 })}
        <div style={{ position: 'absolute', left: WW / 2 - 700, top: 300 - 30 * ts(t, c[3], c[4], 0, 1, io) }}>
          <Carte width={1400} rx={4} ry={-3 + 5 * ts(t, c[3], c[4], 0, 1, io)} points={480 + 20 * maj} light={0.3 + 0.4 * maj} shadow={0.6} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 700, bottom: 0, background: 'linear-gradient(180deg, transparent, #000 50%)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 300, background: 'linear-gradient(0deg, transparent, #000 60%)' }} />
        {L(A('sf6'), c[4] - 0.5, 'Un scan. Et leur carte se met à jour.')}
      </>)}
      {F(c[4], c[6], <>
        {N()}
        <Reflet sol={SOLP} long={220}>
          <IPhone x={960} y={yP(0.64) - 30 * ts(t, c[4], c[6], 0, 1, io)} s={0.64 + 0.05 * ts(t, c[4], c[6], 0, 1, io)} ry={lerp(10, -6, ts(t, c[4], c[6], 0, 1, io))} rx={2} time="" shadow={0.6}>
            <Verrouille t={t} time="11:24" notifs={[{ at: A('sf7') + 1.0, body: 'Le chocolat chaud est de retour ☕ Votre 2e boisson est offerte cette semaine.' }]} />
          </IPhone>
        </Reflet>
        {L(A('sf7'), A('sf8') - 0.5, 'Au bon moment, un message.')}
        {L(A('sf8'), c[6] - 0.5, 'Et ils reviennent.', { color: C.blue, size: 84 })}
      </>)}
      {F(c[6], D + 1, <>
        {N({ glow: 0.6 })}
        <FinSig t={t} at={A('sf9') - 0.2} w={WW} h={HH} />
      </>)}
      {son && <BandeSig Q={Q} video="sig-film" duree={D} voix={voix} sons={[['sons_tt/notif_douce.mp3', A('sf7') + 1.0]]} />}
    </AbsoluteFill>
  )
}
export const D_SIGFILM = dur(QF)

import { AbsoluteFill, Audio, staticFile } from 'remotion'
import { Carte, CarteGoogle } from '../Carte'
import {
  BarreSafari, C, E, FPS, FeuilleAjout, Grain, IPhone, Logo, MacBook, Nuit, Page, Pastille, Plan, SH, SW, Son, SousTitre, Tap, Titre, Verrouille, WalletApp,
  clamp, kf, lerp, rectOf, spring, ts, useT, font, volMusique } from '../kit'
import { Android, BoutonApple, BoutonGoogle, CartePapier, GoogleWalletApp, Presentoir, VueCamera } from '../objets'
import { Carte3D } from '../proximite/Proximite'
import { cues, W } from '../voix'

/* Fidelyz de A à Z — film du site (paysage 1920 × 1080, environ 1 min 30).
   Problème → solution (Apple et Google Wallet) → espace pro (création de la carte) → inscription en caisse
   → points → notifications → proximité → statistiques → offre. */
export const Q = cues('site')
export const DUREE = Q.$end + 0.6
const A = id => Q[id].at
const WW = 1920, HH = 1080
const N = props => <Nuit w={WW} h={HH} {...props} />

/* Titre à gauche (colonne de 760 px) */
const Gauche = ({ t, at, out, text, size = 84, accent, sub, subAt }) => (
  <div style={{ position: 'absolute', left: 140, top: 330, width: 760 }}>
    <Titre t={t} at={at} out={out} text={text} size={size} align="left" width={760} accent={accent} />
    {sub && <div style={{ marginTop: 26 }}><Titre t={t} at={subAt ?? at + 0.5} out={out} text={sub} size={34} weight={500} color={C.muted} align="left" width={700} stagger={0.03} /></div>}
  </div>
)

/* 1. Le problème */
const Probleme = ({ t }) => {
  const k1 = W(Q, 's01', 8), k2 = W(Q, 's01', 10), k3 = W(Q, 's01', 13)
  const f1 = ts(t, k1, k1 + 0.6, 0, 1, E.io), f2 = ts(t, k2, k2 + 0.9, 0, 1, E.in), f3 = ts(t, k3, k3 + 0.8, 0, 1, E.in)
  const gone = ts(t, A('s02') - 0.4, A('s02'), 0, 1, E.io)
  const cards = [
    { x: 1180, y: 300, r: -8, f: c => ({ opacity: 1 - c, filter: `blur(${c * 14}px)` }), k: f1 },
    { x: 1330, y: 470, r: 6, f: c => ({ transform: `translate(${c * 900}px, ${-c * 300}px) rotate(${c * 160}deg)` }), k: f2 },
    { x: 1150, y: 640, r: -3, f: c => ({ transform: `translateY(${c * 700}px) rotate(${-c * 40}deg) scaleY(${1 - 0.4 * c})` }), k: f3 },
  ]
  const dots = ts(t, A('s02') - 0.1, A('s02') + 0.6)
  return (
    <AbsoluteFill>
      <N t={t} warm={0.2} />
      {cards.map((c, i) => (
        <div key={i} style={{ position: 'absolute', left: c.x - 230, top: c.y - 140, perspective: 1800, opacity: 1 - gone }}>
          {i === 0 && <div style={{ position: 'absolute', inset: 0, border: '3px dashed rgba(255,255,255,0.4)', borderRadius: 10, opacity: f1, transform: `rotate(${c.r}deg)` }} />}
          <div style={{ transform: `rotate(${c.r}deg) rotateX(14deg)`, ...c.f(c.k) }}><CartePapier width={460} stamps={[6, 3, 8][i]} /></div>
        </div>
      ))}
      <Gauche t={t} at={0.2} out={A('s02') - 0.3} text={['Oubliée.', 'Perdue.', 'Jetée.']} size={110} accent={{ 0: f1 > 0 ? C.red : undefined }} />
      {/* qui revient ? */}
      {dots > 0 && (
        <div style={{ position: 'absolute', left: 1040, top: 260, display: 'grid', gridTemplateColumns: 'repeat(8, 80px)', gap: 18, opacity: dots }}>
          {[...Array(40)].map((_, i) => {
            const q = ((i * 37) % 11) / 11
            return <div key={i} style={{ width: 80, height: 80, borderRadius: 40, background: '#1c1c1e', display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.35)', fontFamily: font, fontSize: 36, fontWeight: 700, transform: `scale(${0.6 + 0.4 * ts(t, A('s02') + q * 0.6, A('s02') + q * 0.6 + 0.4)})`, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.06)' }}>?</div>
          })}
        </div>
      )}
      <Gauche t={t} at={A('s02')} out={A('s03') - 0.4} text={['Qui', 'revient', '?']} size={110} accent={{ 1: C.blue }} />
    </AbsoluteFill>
  )
}

/* 2. La solution : Apple Wallet et Google Wallet */
const Solution = ({ t }) => {
  const a = A('s03'), b = A('s04')
  const rise = spring(t, a + 0.2, 3.6, 1)
  const ph = kf(t, [[a, { x: 1340, ry: -14 }], [b, { x: 1340, ry: -14 }], [b + 1, { x: 1170, ry: 12 }]])
  const an = kf(t, [[b + 0.1, { x: 2300, ry: -40 }], [b + 1.1, { x: 1560, ry: -12 }, E.out]])
  const logo = spring(t, a, 5, 1)
  return (
    <AbsoluteFill>
      <N t={t + 4} />
      <div style={{ position: 'absolute', left: 140, top: 210, display: 'flex', alignItems: 'center', gap: 22, opacity: clamp(logo), transform: `translateY(${(1 - logo) * 20}px)` }}>
        <Logo size={72} /><span style={{ fontFamily: font, fontSize: 52, fontWeight: 700, color: '#fff', letterSpacing: '-0.03em' }}>Fidelyz</span>
      </div>
      <Gauche t={t} at={W(Q, 's03', 13)} out={b - 0.3} text="Dans le téléphone de vos clients." accent={{ 4: C.blue }} />
      <Gauche t={t} at={b + 0.1} text="Apple Wallet. Google Wallet." accent={{}} sub="Aucune application à télécharger." subAt={W(Q, 's04', 11)} />
      <IPhone x={ph.x} y={lerp(1700, 515, rise)} s={0.88} ry={ph.ry} rx={4}>
        <WalletApp><div style={{ position: 'absolute', left: 16, top: 120 }}><Carte width={358} light={0.5} shadow={0.5} /></div></WalletApp>
      </IPhone>
      {t > b && (
        <Android x={an.x} y={515} s={0.88} ry={an.ry}>
          <GoogleWalletApp><div style={{ position: 'absolute', left: 16, top: 112 }}><CarteGoogle width={358} /></div></GoogleWalletApp>
        </Android>
      )}
      {t > b + 1 && (
        <>
          <div style={{ position: 'absolute', left: 140, top: 640, opacity: ts(t, b + 1, b + 1.4) }}><BoutonApple h={76} /></div>
          <div style={{ position: 'absolute', left: 420, top: 640, opacity: ts(t, b + 1.2, b + 1.6) }}><BoutonGoogle h={76} /></div>
        </>
      )}
    </AbsoluteFill>
  )
}

/* 3. L'espace pro : la carte se crée */
const EspacePro = ({ t }) => {
  const a = A('s05'), c = A('s06'), d = A('s07')
  const mb = spring(t, a - 0.3, 3.5, 1)
  const skins = [['graphite', W(Q, 's06', 0)], ['azur', W(Q, 's06', 10)], ['champagne', W(Q, 's06', 11) + 0.2], ['ivory', W(Q, 's06', 13)], ['graphite', W(Q, 's06', 16)]]
  let page = 'd-caisse'
  if (t >= c - 0.2) page = 'd-carte-graphite'
  const layers = skins.slice(1).map(([s, at]) => ({ name: `d-carte-${s}`, o: ts(t, at, at + 0.35) }))
  // le dernier calque visible prime : on n'affiche que la progression la plus récente
  const shown = []
  layers.forEach((l, i) => { if (l.o > 0) shown.push(l) })
  const zoom = ts(t, c + 0.3, d - 0.2, 0, 1, E.io)
  const phone = spring(t, d - 0.2, 4.5, 1)
  const prog = rectOf('m-reglages-programme', 'add')
  return (
    <AbsoluteFill>
      <N t={t + 8} />
      <Gauche t={t} at={a} out={c - 0.3} text="Votre espace pro." accent={{ 2: C.blue }} />
      <Gauche t={t} at={c} out={d - 0.3} text="Votre carte, à votre image." accent={{ 4: C.champagne }} size={76} />
      <Gauche t={t} at={d} text="Vos récompenses." accent={{ 1: C.champagne }} />
      <MacBook x={lerp(1370, 1390, zoom)} y={lerp(500 + (1 - mb) * 700, 480, zoom)} s={lerp(0.84, 0.88, zoom)} rx={6 * (1 - zoom)}>
        <Page name={page} w={1440} h={900} layers={page === 'd-caisse' ? [] : shown} bars={false} />
      </MacBook>
      {t > d - 0.3 && (
        <IPhone x={1730} y={lerp(1700, 560, phone)} s={0.68} ry={-14} rx={4} inset>
          <Page name="m-reglages-programme" scroll={560} />
          {prog && <div style={{ position: 'absolute', left: 16, top: 980 - 560, width: 358, height: 64, borderRadius: 16, border: `3px solid ${C.champagne}`, opacity: ts(t, d + 0.5, d + 0.9) }} />}
        </IPhone>
      )}
    </AbsoluteFill>
  )
}

/* 4. En caisse : le QR code, l'inscription du client */
const Inscription = ({ t }) => {
  const a = A('s08'), b = A('s09')
  const stand = spring(t, a - 0.2, 4, 1)
  const ph = spring(t, b - 0.4, 4, 1)
  const tDetect = W(Q, 's09', 2), tJoin = W(Q, 's09', 4) - 0.2, tTap = W(Q, 's09', 8), tSheet = tTap + 0.25, tAdd = W(Q, 's09', 12), tWallet = tAdd + 0.25
  const join = ts(t, tJoin, tJoin + 0.5)
  const down = ts(t, tWallet, tWallet + 0.4, 0, 1, E.in)
  return (
    <AbsoluteFill>
      <N t={t + 12} warm={0.24} />
      <Gauche t={t} at={a} out={b - 0.3} text="Votre QR code en caisse." accent={{ 2: C.blue, 3: C.blue }} />
      <Gauche t={t} at={b} text="Dix secondes. Pas plus." accent={{ 0: C.green, 1: C.green }} sub="Prénom, email, et la carte est dans le Wallet." />
      <div style={{ position: 'absolute', left: 1080 - (ph * 120), top: 140 + (1 - stand) * 900, transform: `perspective(2000px) rotateY(${14 - 6 * ph}deg) scale(${1 - 0.15 * ph})` }}><Presentoir width={430} /></div>
      {t > b - 0.5 && (
        <IPhone x={1560} y={lerp(1700, 515, ph)} s={0.88} ry={-10} rx={4}>
          <VueCamera t={t} detect={spring(t, tDetect, 8, 1)} />
          {t > tJoin && (
            <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - join) * SH}px)` }}>
              <div style={{ position: 'absolute', left: 0, top: 50, width: SW, height: SH - 50 }}><Page name="m-join-filled" bars={false} /></div>
              <div style={{ position: 'absolute', left: 0, top: 0, width: SW, height: 50, background: '#000' }} />
              <BarreSafari />
              <Tap t={t} at={tTap} x={195} y={765} />
            </div>
          )}
          {t >= tWallet && <div style={{ position: 'absolute', inset: 0, zIndex: 4 }}><WalletApp><div style={{ position: 'absolute', left: 16, top: 120 + (1 - spring(t, tWallet, 6, 0.85)) * 500 }}><Carte width={358} light={0.5} shadow={0.5} /></div></WalletApp></div>}
          {t >= tSheet && t < tWallet + 0.5 && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 5, transform: `translateY(${down * SH}px)` }}>
              <FeuilleAjout t={t} at={tSheet}><Carte width={300} shadow={0.4} /></FeuilleAjout>
              <Tap t={t} at={tAdd} x={350} y={80} size={0.8} />
            </div>
          )}
        </IPhone>
      )}
    </AbsoluteFill>
  )
}

/* 5. À chaque passage : les points */
const Points = ({ t }) => {
  const a = A('s10'), b = A('s11')
  const tCredit = W(Q, 's10', 9), t20 = W(Q, 's10', 13) - 0.2, tOk = W(Q, 's10', 15), tDone = tOk + 0.25
  const ent = spring(t, a - 0.3, 4, 1)
  const cr = rectOf('m-caisse-search', 'credit'), b20 = rectOf('m-caisse-points', 'b20'), ok = rectOf('m-caisse-points20', 'ok')
  const screen = t < tCredit + 0.3 ? 'm-caisse-search' : t < t20 + 0.05 ? 'm-caisse-points' : t < tDone ? 'm-caisse-points20' : 'm-caisse-done'
  const pts = 460 + 20 * clamp(spring(t, tDone + 0.15, 5, 1))
  const glow = ts(t, tDone, tDone + 0.3) * (1 - ts(t, b + 1, b + 2))
  return (
    <AbsoluteFill>
      <N t={t + 16} />
      <Gauche t={t} at={a} out={b - 0.3} text="Un scan. Les points tombent." accent={{ 3: C.blue, 4: C.blue }} />
      <Gauche t={t} at={b} text="Mise à jour instantanée." accent={{ 2: C.blue }} sub="Dans le téléphone de votre client." />
      <IPhone x={1170} y={515 + (1 - ent) * 900} s={0.88} ry={12} rx={4} inset>
        <Page name={screen} bars={false} />
        <Tap t={t} at={tCredit} x={cr.x + cr.w / 2} y={cr.y + cr.h / 2} />
        <Tap t={t} at={t20} x={b20.x + b20.w / 2} y={b20.y + b20.h / 2} />
        <Tap t={t} at={tOk} x={ok.x + ok.w / 2} y={ok.y + ok.h / 2} />
      </IPhone>
      <div style={{ position: 'absolute', left: 1440, top: 230 + (1 - ent) * 900 }}>
        <div style={{ position: 'absolute', inset: -40, borderRadius: 60, background: 'radial-gradient(closest-side, rgba(41,151,255,0.55), transparent)', opacity: glow }} />
        <Carte width={360} ry={-16} rz={3} points={pts} light={0.4} />
      </div>
      <div style={{ position: 'absolute', left: 1750, top: 200 - 50 * ts(t, tDone + 0.1, tDone + 1.2), opacity: ts(t, tDone, tDone + 0.2) * (1 - ts(t, tDone + 1.2, tDone + 1.6)), fontFamily: font, fontSize: 70, fontWeight: 750, color: C.blue }}>+20</div>
    </AbsoluteFill>
  )
}

/* 6. Vous pouvez leur écrire */
const Campagne = ({ t }) => {
  const a = A('s12'), b = A('s13')
  const send = rectOf('m-campagnes-filled', 'send')
  const tSend = W(Q, 's12', 6), tN = W(Q, 's13', 7)
  const ent = spring(t, a - 0.2, 4, 1), lock = spring(t, b - 0.1, 4, 1)
  const z = ts(t, tN + 0.5, tN + 1.6, 0, 1, E.io)
  const scroll = 330
  return (
    <AbsoluteFill>
      <N t={t + 20} />
      <Gauche t={t} at={a} out={b - 0.3} text="Et vous pouvez leur écrire." accent={{ 4: C.blue }} />
      <Gauche t={t} at={b} text="Sur leur écran verrouillé." accent={{ 2: C.blue, 3: C.blue }} sub="Une offre, une nouveauté, le produit du jour." />
      <IPhone x={lerp(1250, 900, lock)} y={515 + (1 - ent) * 900} s={0.88} ry={12} rx={4} inset o={1 - lock}>
        <Page name="m-campagnes-filled" scroll={scroll} />
        <Tap t={t} at={tSend} x={send.x + send.w / 2} y={send.y + send.h / 2 - scroll} />
      </IPhone>
      <IPhone o={clamp(lock * 3)} x={lerp(1900, 1380, lock)} y={lerp(515, 520 - (690 - SH / 2) * 1.5, z)} s={lerp(0.95, 1.5, z)} ry={-12 * (1 - z)} rx={4 * (1 - z)} time="">
        <Verrouille t={t} time="11:24" notifs={[{ at: tN, body: 'Le chocolat chaud est de retour ☕ Votre 2e boisson est offerte cette semaine.' }]} />
      </IPhone>
    </AbsoluteFill>
  )
}

/* 7. Proximité */
const Proche = ({ t }) => {
  const a = A('s14')
  const tt = 3 + (t - a) * 1.25
  const tN = W(Q, 's14', 9)
  const ph = spring(t, tN - 0.3, 4.5, 1)
  return (
    <AbsoluteFill>
      <N t={t + 24} cool={0.18} />
      <div style={{ position: 'absolute', left: 1180 - 540, top: 520 - 960, width: 1080, height: 1920, transform: 'scale(0.82)' }}><Carte3D t={tt} /></div>
      <Gauche t={t} at={a} text="Près de chez vous, elle se rappelle à eux." accent={{ 6: C.blue }} size={74} />
      <IPhone x={1660} y={lerp(1700, 520, ph)} s={0.8} ry={-12} rx={4} time="">
        <Verrouille t={t} time="17:42" notifs={[{ at: tN, body: 'Maison Lumière est à 50 m ☕ Plus que 20 points avant votre café.', time: 'à proximité' }]} />
      </IPhone>
    </AbsoluteFill>
  )
}

/* 8. Statistiques */
const Stats = ({ t }) => {
  const a = A('s15')
  const mb = spring(t, a - 0.3, 3.5, 1)
  const sw = ts(t, W(Q, 's15', 9), W(Q, 's15', 9) + 0.5)
  return (
    <AbsoluteFill>
      <N t={t + 28} cool={0.3} />
      <Gauche t={t} at={a} text="Tout, en temps réel." accent={{ 2: C.blue, 3: C.blue }} sub="Vos clients, leurs visites, vos récompenses." />
      <MacBook x={1340} y={500 + (1 - mb) * 800} s={0.86} ry={-8} rx={4}>
        <Page name="d-stats" w={1440} h={900} layers={[{ name: 'd-stats-activite', o: sw }]} bars={false} />
      </MacBook>
    </AbsoluteFill>
  )
}

/* 9. Offre et fin */
const Offre = ({ t }) => {
  const a = A('s16'), b = A('s17')
  const l = spring(t, a - 0.1, 4, 1)
  const chips = [["Gratuit jusqu'à 15 clients", W(Q, 's16', 1)], ['Sans carte bancaire', W(Q, 's16', 6)], ['Sans engagement', W(Q, 's16', 9)]]
  return (
    <AbsoluteFill>
      <N t={t + 32} />
      <div style={{ position: 'absolute', left: 960 - 80, top: 190, opacity: clamp(l), transform: `scale(${0.85 + 0.15 * l})`, filter: `blur(${(1 - clamp(l)) * 10}px)` }}><Logo size={160} /></div>
      <div style={{ position: 'absolute', left: 0, top: 380, width: WW, display: 'flex', justifyContent: 'center' }}><Titre t={t} at={a + 0.1} text="Fidelyz" size={130} width={1200} /></div>
      <div style={{ position: 'absolute', left: 0, top: 560, width: WW, display: 'flex', justifyContent: 'center', gap: 22 }}>
        {chips.map(([c, at]) => <Pastille key={c} t={t} at={at} size={34} color={C.text} style={{ background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.18)' }}>{c}</Pastille>)}
      </div>
      <div style={{ position: 'absolute', left: 0, top: 690, width: WW, display: 'flex', justifyContent: 'center' }}>
        <Pastille t={t} at={b + 0.2} size={46} color={C.blue}>fidelyzapp.fr →</Pastille>
      </div>
    </AbsoluteFill>
  )
}

export const Site = ({ voix = true, son = true }) => {
  const t = useT()
  const cut = id => A(id) - 0.3
  const speaking = f => Q.$list.some(c => f / FPS > c.at - 0.1 && f / FPS < c.at + c.dur + 0.15)
  const P = { w: WW, h: HH, ox: 960, oy: 540 }
  const plans = [[Probleme, 0, 's03', 'cut', 'push'], [Solution, 's03', 's05', 'push', 'left'], [EspacePro, 's05', 's08', 'left', 'left'], [Inscription, 's08', 's10', 'left', 'left'], [Points, 's10', 's12', 'left', 'push'], [Campagne, 's12', 's14', 'push', 'up'], [Proche, 's14', 's15', 'up', 'push'], [Stats, 's15', 's16', 'push', 'push'], [Offre, 's16', null, 'push', 'cut']]
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {plans.map(([S, a, b, tin, tout], i) => (
        <Plan key={i} t={t} a={a === 0 ? 0 : cut(a)} b={b ? cut(b) : DUREE + 1} tin={tin} tout={tout} din={0.8} dout={0.8} {...P}><S t={t} /></Plan>
      ))}
      {/* sous-titres en bas, sur un léger dégradé */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 240, background: 'linear-gradient(0deg, rgba(0,0,0,0.7), transparent)', zIndex: 70 }} />
      {Q.$list.map(c => <SousTitre key={c.id} t={t} cue={c} y={958} size={40} w={WW} maxW={1500} scrim={0} />)}
      <Grain o={0.035} />
      {son && (
        <>
          <Audio src={staticFile('campagne/musique/site.mp3')} volume={f => {
            const tt = f / FPS
            return Math.min(1, tt / 0.6) * Math.min(1, (DUREE - tt) / 2) * volMusique(Q.$list, f / FPS, voix, 0.34)
          }} />
          {voix && Q.$list.filter(c => c.voice).map(c => <Son key={c.id} src={`campagne/voix/${c.id}.mp3`} at={c.at - c.lead} />)}
          {['s03', 's05', 's08', 's10', 's12', 's14', 's15', 's16'].map(id => <Son key={id} src="sons_tt/whoosh7.mp3" at={A(id) - 0.5} vol={0.25} />)}
          <Son src="sons_tt/scintille.mp3" at={A('s03') + 0.2} vol={0.3} />
          <Son src="sons_tt/clic.mp3" at={W(Q, 's09', 8)} vol={0.35} />
          <Son src="sons_tt/clic.mp3" at={W(Q, 's09', 12)} vol={0.35} />
          <Son src="sons_tiktok/bip-caisse.mp3" at={W(Q, 's10', 15) + 0.25} vol={0.3} />
          <Son src="sons_tt/notif.mp3" at={W(Q, 's13', 7)} vol={0.45} />
          <Son src="sons_tt/notif_douce.mp3" at={W(Q, 's14', 9)} vol={0.4} />
          <Son src="sons_tt/hit_logo.mp3" at={A('s16') - 0.1} vol={0.3} />
        </>
      )}
    </AbsoluteFill>
  )
}

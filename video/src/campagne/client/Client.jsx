import { AbsoluteFill, Audio, staticFile } from 'remotion'
import { Carte } from '../Carte'
import {
  BarreSafari, C, E, FPS, FeuilleAjout, FondEcran, Fin, Grain, IPhone, Nuit, Page, Plan, SH, SW, Son, SousTitre, Tap, WalletApp,
  clamp, lerp, spring, ts, useT, font,
} from '../kit'
import { VueCamera } from '../objets'
import { cues, W } from '../voix'

/* 06 — 10 secondes côté client (TikTok 1080 × 1920). Un seul plan : le téléphone du client, de l'appareil photo au Wallet. */
export const Q = cues('client')
export const DUREE = Q.$end + 0.4
const A = id => Q[id].at

/* Écran d'accueil iOS (icônes génériques), l'appareil photo en évidence */
const Accueil = ({ t, tapCam, noStore }) => {
  const icons = ['#34c759', '#0a84ff', '#ff9f0a', '#5e5ce6', '#ff375f', '#64d2ff', '#30d158', '#ffd60a', '#bf5af2', '#ff453a', '#8e8e93', '#0a84ff', '#ac8e68', '#32ade6', '#ff9f0a', '#5856d6']
  const labels = ['Messages', 'Plans', 'Photos', 'Podcasts', 'Musique', 'Météo', 'FaceTime', 'Notes', 'Raccourcis', 'Agenda', 'Réglages', 'App Store', 'Cartes', 'Horloge', 'Rappels', 'Fichiers']
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: font }}>
      <FondEcran hue={30} />
      <div style={{ position: 'absolute', left: 26, right: 26, top: 80, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', rowGap: 26, justifyItems: 'center' }}>
        {icons.map((c, i) => {
          const store = labels[i] === 'App Store'
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: store ? 1 : 0.9 }}>
              <div style={{ position: 'relative', width: 62, height: 62, borderRadius: 15, background: `linear-gradient(160deg, ${c}, ${c}bb)`, boxShadow: '0 4px 10px rgba(0,0,0,0.25)', filter: store ? `grayscale(${noStore})` : undefined, opacity: store ? 1 - 0.5 * noStore : 1 }}>
                {store && noStore > 0 && <svg width="62" height="62" viewBox="0 0 62 62" style={{ position: 'absolute', inset: 0 }}><line x1="8" y1="54" x2="54" y2="8" stroke={C.red} strokeWidth="6" strokeLinecap="round" strokeDasharray="66" strokeDashoffset={66 * (1 - noStore)} /></svg>}
              </div>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 500 }}>{labels[i]}</span>
            </div>
          )
        })}
      </div>
      {/* dock avec l'appareil photo */}
      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 22, height: 96, borderRadius: 34, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(20px)', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
        {['#30d158', '#0a84ff', '#1c1c1e', '#ff9f0a'].map((c, i) => (
          <div key={i} style={{ width: 62, height: 62, borderRadius: 15, background: i === 2 ? 'linear-gradient(160deg,#d1d1d6,#8e8e93)' : c, display: 'grid', placeItems: 'center', transform: i === 2 ? `scale(${1 - 0.12 * Math.sin(Math.PI * ts(t, tapCam - 0.1, tapCam + 0.2, 0, 1, E.lin))})` : undefined }}>
            {i === 2 && <svg width="34" height="28" viewBox="0 0 34 28"><rect x="1" y="5" width="32" height="22" rx="5" fill="#1c1c1e" /><rect x="11" y="1" width="12" height="6" rx="2" fill="#1c1c1e" /><circle cx="17" cy="16" r="7" fill="#8e8e93" /><circle cx="17" cy="16" r="4.5" fill="#1c1c1e" /></svg>}
          </div>
        ))}
      </div>
    </div>
  )
}

/* Carte bancaire générique (aucune marque) */
const CarteBancaire = ({ width = 358 }) => (
  <div style={{ width, height: width * 0.63, borderRadius: 18, background: 'linear-gradient(135deg, #2b3a67 0%, #121a33 60%, #3c2a5e 100%)', boxShadow: '0 -6px 20px rgba(0,0,0,0.5)', position: 'relative', fontFamily: font, color: '#fff' }}>
    <div style={{ position: 'absolute', left: 22, top: 18, fontSize: 17, fontWeight: 600, letterSpacing: '0.02em' }}>Ma Banque</div>
    <div style={{ position: 'absolute', right: 22, top: 18, fontSize: 13, opacity: 0.7 }}>DÉBIT</div>
    <div style={{ position: 'absolute', left: 22, top: 70, width: 46, height: 34, borderRadius: 6, background: 'linear-gradient(135deg,#e8d8a8,#b89a5a)' }} />
    <div style={{ position: 'absolute', left: 22, bottom: 18, fontSize: 16, letterSpacing: '0.12em', opacity: 0.85 }}>•••• 4821</div>
  </div>
)

const Telephone = ({ t }) => {
  const tCam = W(Q, 'k02', 1) - 0.25, tDetect = W(Q, 'k02', 4), tPill = W(Q, 'k02', 7), tJoin = tPill + 0.2
  const tType1 = W(Q, 'k03', 2), tType2 = W(Q, 'k03', 4), tTapW = W(Q, 'k04', 1), tSheet = tTapW + 0.25, tAdd = W(Q, 'k04', 3), tWallet = tAdd + 0.25
  const cam = ts(t, tCam, tCam + 0.45, 0, 1, E.out)
  const join = ts(t, tJoin, tJoin + 0.5, 0, 1, E.out)
  const typed = ts(t, tType1 - 0.1, tType2 + 0.5, 0, 1, E.lin)
  const sheetDown = ts(t, tWallet, tWallet + 0.4, 0, 1, E.in)
  const bank = ts(t, W(Q, 'k05', 11) - 0.2, W(Q, 'k05', 11) + 0.5, 0, 1, E.io)
  // caméra : légère rotation continue, puis plan large à la fin
  const out = ts(t, A('k06') - 0.2, A('k07') - 0.3, 0, 1, E.io)
  const ph = { x: 540, y: 1135, s: lerp(1.3, 1.12, out), rx: 6 - 4 * out, ry: lerp(-10, 10, ts(t, 0, A('k06'), 0, 1, E.soft)) }
  return (
    <IPhone {...ph}>
      <Accueil t={t} tapCam={tCam} noStore={ts(t, W(Q, 'k01', 3), W(Q, 'k01', 5), 0, 1, E.io)} />
      <Tap t={t} at={tCam} x={195} y={SH - 70} />
      {t >= tCam && (
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${lerp(0.2, 1, cam)})`, opacity: cam, borderRadius: 50 * (1 - cam), overflow: 'hidden', transformOrigin: `${195}px ${SH - 70}px` }}>
          <VueCamera t={t} detect={spring(t, tDetect, 8, 1)} zoom={1 + 0.12 * ts(t, tCam, tPill)} />
          <Tap t={t} at={tPill} x={195} y={638} />
        </div>
      )}
      {t >= tJoin && (
        <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - join) * SH}px)` }}>
          <div style={{ position: 'absolute', left: 0, top: 50, width: SW, height: SH - 50 }}>
            <Page name="m-join" bars={false} />
            <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 calc(100% - ${150 + 300 * typed}px) 0)` }}><Page name="m-join-filled" bars={false} /></div>
            <div style={{ position: 'absolute', inset: 0, opacity: ts(t, tType2 + 0.4, tType2 + 0.6) }}><Page name="m-join-filled" bars={false} /></div>
          </div>
          <div style={{ position: 'absolute', left: 0, top: 0, width: SW, height: 50, background: '#000' }} />
          <BarreSafari />
          <Tap t={t} at={tTapW} x={195} y={50 + 715} />
        </div>
      )}
      {t >= tWallet && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 4 }}>
          <WalletApp>
            <div style={{ position: 'absolute', left: 16, top: 120 - (1 - bank) * 30, opacity: bank, zIndex: 1 }}><CarteBancaire /></div>
            <div style={{ position: 'absolute', left: 16, top: 120 + bank * 78 + (1 - spring(t, tWallet + 0.05, 6, 0.85)) * 500, zIndex: 2 }}><Carte width={358} light={0.5} shadow={0.6} /></div>
          </WalletApp>
        </div>
      )}
      {t >= tSheet && t < tWallet + 0.5 && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 5, transform: `translateY(${sheetDown * SH}px)` }}>
          <FeuilleAjout t={t} at={tSheet}><Carte width={300} shadow={0.4} /></FeuilleAjout>
          <Tap t={t} at={tAdd} x={350} y={80} size={0.8} />
        </div>
      )}
    </IPhone>
  )
}

/* Chrono : démarre au scan, s'arrête quand la carte est dans le Wallet */
const Chrono = ({ t }) => {
  const a = W(Q, 'k02', 1) - 0.25, b = W(Q, 'k04', 3) + 0.4
  const k = ts(t, a, b, 0, 1, E.lin)
  const v = (10 * k).toFixed(1).replace('.', ',')
  const done = t >= b
  const vis = ts(t, a - 0.3, a)
  const pulse = done ? Math.sin(Math.PI * ts(t, b, b + 0.35, 0, 1, E.lin)) : 0
  return (
    <div style={{ position: 'absolute', left: 0, width: 1080, top: 425, display: 'flex', justifyContent: 'center', opacity: vis * (1 - ts(t, A('k07') - 0.5, A('k07') - 0.2)), zIndex: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 32px', borderRadius: 999, background: done ? C.green : 'rgba(28,28,30,0.85)', color: '#fff', fontFamily: font, fontSize: 48, fontWeight: 750, fontVariantNumeric: 'tabular-nums', transform: `scale(${1 + 0.08 * pulse})`, boxShadow: '0 0 0 1.5px rgba(255,255,255,0.12)' }}>
        {done ? '10 s ✓' : `${v} s`}
      </div>
    </div>
  )
}

export const Client = ({ voix = true, son = true }) => {
  const t = useT()
  const cut = A('k07') - 0.25
  const speaking = f => Q.$list.some(c => f / FPS > c.at - 0.1 && f / FPS < c.at + c.dur + 0.15)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Plan t={t} a={0} b={cut} tin="cut" tout="push" dout={0.8}><Nuit t={t} warm={0.22} /><Telephone t={t} /></Plan>
      <Plan t={t} a={cut} b={DUREE + 1} tin="push" din={0.8} tout="cut"><Nuit t={t} /><Fin t={t} at={A('k07')} sub="Ta carte de fidélité, sans application" /></Plan>
      <Chrono t={t} />
      {Q.$list.filter(c => c.id !== 'k07').map(c => (
        <SousTitre key={c.id} t={t} cue={c} y={165} size={64} maxW={940} accent={{ k01: { 3: C.red, 4: C.red }, k04: { 3: C.blue }, k05: { 9: C.champagne }, k06: { 0: C.green, 1: C.green } }[c.id] ?? {}} />
      ))}
      <Grain o={0.04} />
      {son && (
        <>
          <Audio src={staticFile('sons_tt/musique-noir.mp3')} startFrom={Math.round(40 * FPS)} volume={f => {
            const tt = f / FPS
            return Math.min(1, tt / 0.3) * Math.min(1, (DUREE - tt) / 1.2) * (voix && speaking(f) ? 0.2 : 0.42)
          }} />
          {voix && Q.$list.filter(c => c.voice).map(c => <Son key={c.id} src={`campagne/voix/${c.id}.mp3`} at={c.at - c.lead} />)}
          <Son src="sons_tt/clic.mp3" at={W(Q, 'k02', 1) - 0.25} vol={0.5} />
          <Son src="sons_tt/chrono_tic.mp3" at={W(Q, 'k02', 1) - 0.25} vol={0.1} dur={W(Q, 'k04', 3) + 0.4 - W(Q, 'k02', 1) + 0.25} />
          <Son src="sons_tt/pop.mp3" at={W(Q, 'k02', 4)} vol={0.3} />
          <Son src="sons_tt/clic.mp3" at={W(Q, 'k02', 7)} vol={0.45} />
          <Son src="sons_tt/clic.mp3" at={W(Q, 'k04', 1)} vol={0.45} />
          <Son src="sons_tt/clic.mp3" at={W(Q, 'k04', 3)} vol={0.45} />
          <Son src="sons_tt/chrono_stop.mp3" at={W(Q, 'k04', 3) + 0.4} vol={0.4} dur={1} />
          <Son src="sons_tt/scintille.mp3" at={W(Q, 'k04', 3) + 0.35} vol={0.35} />
          <Son src="sons_tt/hit_logo.mp3" at={A('k07') - 0.05} vol={0.35} />
        </>
      )}
    </AbsoluteFill>
  )
}

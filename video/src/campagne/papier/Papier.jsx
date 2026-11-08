import { AbsoluteFill, Audio, staticFile } from 'remotion'
import { Carte } from '../Carte'
import { C, E, FPS, Fin, Grain, IPhone, Nuit, Page, Plan, Son, SousTitre, Verrouille, WalletApp, clamp, spring, ts, useT, font } from '../kit'
import { CartePapier } from '../objets'
import { cues, W } from '../voix'

/* 05 — Papier contre Fidelyz (TikTok 1080 × 1920). Écran partagé, trois rounds et un bonus, score qui monte. */
export const Q = cues('papier')
export const DUREE = Q.$end + 0.4
const A = id => Q[id].at

const ROUNDS = [
  { n: 'ROUND 1', l: "L'oubli", at: () => W(Q, 'v01', 7), ko: () => W(Q, 'v02', 9) },
  { n: 'ROUND 2', l: 'Le coût', at: () => A('v03'), ko: () => W(Q, 'v03', 12) },
  { n: 'ROUND 3', l: 'Le contact', at: () => A('v04'), ko: () => W(Q, 'v05', 5) },
  { n: 'BONUS', l: 'Les chiffres', at: () => A('v06'), ko: () => W(Q, 'v06', 8) },
]
const roundOf = t => { let r = 0; ROUNDS.forEach((x, i) => { if (t >= x.at() - 0.3) r = i }); return r }

/* Côté papier (gauche) */
const Gauche = ({ t, r }) => {
  const forget = ts(t, W(Q, 'v02', 1), W(Q, 'v02', 3), 0, 1, E.io)
  const pile = ts(t, W(Q, 'v03', 2), W(Q, 'v03', 6), 0, 1, E.io)
  const zz = (t - A('v04')) * 1.2
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 540, height: 1920, overflow: 'hidden', background: 'linear-gradient(180deg, #2a2118, #120e0a)' }}>
      <div style={{ position: 'absolute', left: 270 - 210, top: 940 - 130, transform: 'perspective(1600px) rotateX(18deg) rotateZ(-6deg)' }}>
        {r === 0 && (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 10, border: '3px dashed rgba(255,255,255,0.4)', opacity: forget }} />
            <div style={{ opacity: 1 - forget, filter: `blur(${forget * 12}px)` }}><CartePapier width={420} stamps={6} /></div>
          </div>
        )}
        {r === 1 && [...Array(12)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', left: (i % 3) * 6 - 6, top: -i * 16 * pile, opacity: i === 0 ? 1 : clamp(pile * 12 - i) }}><CartePapier width={420} stamps={0} worn={0} /></div>
        ))}
        {(r === 2 || r === 3) && (
          <div style={{ filter: r === 3 ? 'grayscale(0.6) brightness(0.7)' : undefined }}><CartePapier width={420} stamps={4} /></div>
        )}
      </div>
      {r === 1 && <div style={{ position: 'absolute', left: 0, width: 540, top: 1170, textAlign: 'center', fontFamily: font, fontSize: 58, fontWeight: 800, color: '#ffb340', opacity: ts(t, W(Q, 'v03', 6), W(Q, 'v03', 7)) }}>1 000 × 🖨️ = €€€</div>}
      {r === 2 && [0, 1, 2].map(i => {
        const k = ((zz + i * 0.7) % 2.1) / 2.1
        return <div key={i} style={{ position: 'absolute', left: 340 + k * 60, top: 760 - k * 160, fontFamily: font, fontSize: 40 + i * 12, fontWeight: 800, color: 'rgba(255,255,255,0.5)', opacity: (1 - k) * ts(t, A('v04') + 0.5, A('v04') + 1) }}>z</div>
      })}
      {r === 3 && <div style={{ position: 'absolute', left: 0, width: 540, top: 820, textAlign: 'center', fontFamily: font, fontSize: 260, fontWeight: 800, color: 'rgba(255,255,255,0.22)' }}>?</div>}
    </div>
  )
}

/* Côté Fidelyz (droite) */
const Droite = ({ t, r }) => {
  const notifAt = W(Q, 'v05', 4)
  return (
    <div style={{ position: 'absolute', left: 540, top: 0, width: 540, height: 1920, overflow: 'hidden', background: 'linear-gradient(180deg, #08142b, #000)' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(60% 30% at 50% 50%, rgba(41,151,255,0.25), transparent)' }} />
      {(r === 0 || r === 1) && (
        <IPhone x={270} y={960} s={0.8} rx={6} ry={-12}>
          <WalletApp>
            <div style={{ position: 'absolute', left: 16, top: 120 }}><Carte width={358} light={0.5} shadow={0.5} /></div>
          </WalletApp>
        </IPhone>
      )}
      {r === 1 && <div style={{ position: 'absolute', left: 0, width: 540, top: 1170, textAlign: 'center', zIndex: 5, fontFamily: font, fontSize: 52, fontWeight: 800, color: C.green, textShadow: '0 4px 20px #000', opacity: ts(t, W(Q, 'v03', 10), W(Q, 'v03', 11)) }}>0 impression</div>}
      {r === 2 && (
        <IPhone x={270} y={960} s={0.8} rx={6} ry={-12} time="">
          <Verrouille t={t} time="11:24" notifs={[{ at: notifAt, body: 'Le chocolat chaud est de retour ☕ Votre 2e boisson est offerte cette semaine.' }]} />
        </IPhone>
      )}
      {r === 3 && (
        <IPhone x={270} y={960} s={0.8} rx={6} ry={-12} inset>
          <Page name="m-stats" scroll={160} />
        </IPhone>
      )}
    </div>
  )
}

/* Bandeau du round et score */
const Arbitre = ({ t }) => {
  const r = roundOf(t)
  const R = ROUNDS[r]
  const enter = spring(t, R.at() - 0.3, 7, 0.9)
  const score = ROUNDS.filter(x => t >= x.ko()).length
  return (
    <>
      {/* séparation et VS */}
      <div style={{ position: 'absolute', left: 538, top: 0, width: 4, height: 1920, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.5) 70%, transparent)' }} />
      <div style={{ position: 'absolute', left: 540 - 60, top: 600 - 60, width: 120, height: 120, borderRadius: 60, background: '#fff', color: '#000', display: 'grid', placeItems: 'center', fontFamily: font, fontSize: 48, fontWeight: 900, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 20 }}>VS</div>
      <div style={{ position: 'absolute', left: 0, width: 540, top: 470, textAlign: 'center', fontFamily: font, fontSize: 40, fontWeight: 800, letterSpacing: '0.12em', color: '#e9d5b7' }}>PAPIER</div>
      <div style={{ position: 'absolute', left: 540, width: 540, top: 470, textAlign: 'center', fontFamily: font, fontSize: 40, fontWeight: 800, letterSpacing: '0.12em', color: C.blue }}>FIDELYZ</div>
      {/* round */}
      {t > ROUNDS[0].at() - 0.3 && (
        <div style={{ position: 'absolute', left: 0, width: 1080, top: 1345, display: 'flex', justifyContent: 'center', zIndex: 21 }}>
          <div style={{ padding: '14px 34px', borderRadius: 999, background: '#fff', color: '#000', fontFamily: font, fontSize: 40, fontWeight: 800, opacity: clamp(enter * 1.3), transform: `scale(${0.85 + 0.15 * enter})` }}>
            {R.n} <span style={{ fontWeight: 500, color: '#6e6e73' }}>· {R.l}</span>
          </div>
        </div>
      )}
      {/* K.O. : tampon rouge sur le côté papier */}
      {ROUNDS.map((x, i) => {
        if (i !== r || t < x.ko()) return null
        const p = spring(t, x.ko(), 9, 0.7)
        return <div key={i} style={{ position: 'absolute', left: 270 - 170, top: 880, width: 340, padding: '10px 0', textAlign: 'center', border: `10px solid ${C.red}`, borderRadius: 24, color: C.red, fontFamily: font, fontSize: 120, fontWeight: 900, transform: `rotate(-12deg) scale(${2 - clamp(p)})`, opacity: clamp(p * 2), zIndex: 22, background: 'rgba(0,0,0,0.25)' }}>K.O.</div>
      })}
      {/* score */}
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 1430, display: 'flex', justifyContent: 'center', gap: 60, fontFamily: font, fontSize: 84, fontWeight: 850, color: '#fff', zIndex: 21, fontVariantNumeric: 'tabular-nums' }}>
        <span style={{ color: '#e9d5b7', width: 120, textAlign: 'right' }}>0</span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>–</span>
        <span style={{ color: C.blue, width: 120, transform: `scale(${1 + 0.25 * Math.sin(Math.PI * ts(t, ROUNDS[Math.max(0, score - 1)].ko(), ROUNDS[Math.max(0, score - 1)].ko() + 0.4, 0, 1, E.lin))})` }}>{score}</span>
      </div>
    </>
  )
}

export const Papier = ({ voix = true, son = true }) => {
  const t = useT()
  const r = roundOf(t)
  const cut = A('v07') - 0.25
  const speaking = f => Q.$list.some(c => f / FPS > c.at - 0.1 && f / FPS < c.at + c.dur + 0.15)
  // changement de round : fondu rapide des deux côtés
  const fades = ROUNDS.slice(1).map(x => ts(t, x.at() - 0.45, x.at() - 0.3) * (1 - ts(t, x.at() - 0.3, x.at() - 0.1)))
  const f = Math.max(0, ...fades)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Plan t={t} a={0} b={cut} tin="cut" tout="push" dout={0.8}>
        <AbsoluteFill style={{ filter: f > 0.01 ? `blur(${f * 14}px) brightness(${1 - 0.6 * f})` : undefined }}>
          <Gauche t={t} r={r} />
          <Droite t={t} r={r} />
        </AbsoluteFill>
        <Arbitre t={t} />
      </Plan>
      <Plan t={t} a={cut} b={DUREE + 1} tin="push" din={0.8} tout="cut"><Nuit t={t} /><Fin t={t} at={A('v07')} sub="3 rounds, 3 K.O." /></Plan>
      {Q.$list.filter(c => c.id !== 'v07').map(c => (
        <SousTitre key={c.id} t={t} cue={c} y={160} size={66} maxW={960} accent={{ v01: { 0: '#e9d5b7', 1: '#e9d5b7', 4: C.blue }, v05: { 2: C.blue, 3: C.blue } }[c.id] ?? {}} />
      ))}
      <Grain o={0.04} />
      {son && (
        <>
          <Audio src={staticFile('sons_tt/musique-chrono.mp3')} startFrom={Math.round(20 * FPS)} volume={fr => {
            const tt = fr / FPS
            return Math.min(1, tt / 0.3) * Math.min(1, (DUREE - tt) / 1.2) * (voix && speaking(fr) ? 0.1 : 0.36)
          }} />
          {voix && Q.$list.filter(c => c.voice).map(c => <Son key={c.id} src={`campagne/voix/${c.id}.mp3`} at={c.at - c.lead} />)}
          {ROUNDS.map((x, i) => <Son key={i} src="sons_tt/whoosh_rapide.mp3" at={x.at() - 0.35} vol={0.4} />)}
          {ROUNDS.map((x, i) => <Son key={`k${i}`} src="sons_tt/hit.mp3" at={x.ko()} vol={0.4} />)}
          <Son src="sons_tt/notif.mp3" at={W(Q, 'v05', 4)} vol={0.5} />
          <Son src="sons_tt/hit_logo.mp3" at={A('v07') - 0.05} vol={0.35} />
        </>
      )}
    </AbsoluteFill>
  )
}

import { AbsoluteFill, Audio, staticFile } from 'remotion'
import { Carte, CarteGoogle } from '../Carte'
import { C, E, FPS, Fin, Grain, IPhone, Logo, Nuit, Page, Pastille, Plan, Son, SousTitre, Tap, WalletApp, clamp, rectOf, spring, ts, useT, font } from '../kit'
import { Android, GoogleWalletApp } from '../objets'
import { cues, W } from '../voix'

/* 08 — Trois questions (TikTok 1080 × 1920). Chaque question arrive comme un message, la réponse en image. */
export const Q = cues('questions')
export const DUREE = Q.$end + 0.4
const A = id => Q[id].at

const Question = ({ t, at, n, children }) => {
  const p = spring(t, at - 0.1, 6, 0.85)
  return (
    <div style={{ position: 'absolute', left: 80, top: 430, display: 'flex', alignItems: 'flex-end', gap: 18, opacity: clamp(p * 1.4), transform: `translateY(${(1 - p) * 40}px) scale(${0.95 + 0.05 * p})`, transformOrigin: 'left bottom' }}>
      <div style={{ width: 84, height: 84, borderRadius: 42, background: 'linear-gradient(135deg,#ff9f0a,#ff375f)', display: 'grid', placeItems: 'center', fontFamily: font, fontSize: 40, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{n}</div>
      <div style={{ maxWidth: 800, padding: '26px 34px', borderRadius: '36px 36px 36px 10px', background: '#2c2c2e', color: '#fff', fontFamily: font, fontSize: 46, fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.02em' }}>{children}</div>
    </div>
  )
}

/* Intro : trois bulles empilées */
const Intro = ({ t }) => (
  <AbsoluteFill>
    <Nuit t={t} />
    {['Mes clients doivent télécharger une appli ?', 'Et pour ajouter les points ?', 'Ça coûte combien ?'].map((q, i) => {
      const p = spring(t, 0.02 + i * 0.4, 6, 0.85)
      return (
        <div key={q} style={{ position: 'absolute', left: i % 2 ? 200 : 80, top: 640 + i * 240, display: 'flex', gap: 18, alignItems: 'flex-end', opacity: clamp(p * 1.4), transform: `translateY(${(1 - p) * 50}px)` }}>
          <div style={{ width: 70, height: 70, borderRadius: 35, background: 'linear-gradient(135deg,#ff9f0a,#ff375f)', display: 'grid', placeItems: 'center', fontFamily: font, fontSize: 34, fontWeight: 800, color: '#fff' }}>{i + 1}</div>
          <div style={{ padding: '22px 30px', borderRadius: '32px 32px 32px 8px', background: '#2c2c2e', color: '#fff', fontFamily: font, fontSize: 42, fontWeight: 600 }}>{q}</div>
        </div>
      )
    })}
  </AbsoluteFill>
)

const Q1 = ({ t }) => {
  const a = A('q03')
  const ph = spring(t, a - 0.1, 4.5, 1)
  return (
    <AbsoluteFill>
      <Nuit t={t + 3} />
      <Question t={t} at={A('q02')} n="1">Mes clients doivent télécharger une appli ?</Question>
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 700, textAlign: 'center', fontFamily: font, fontSize: 200, fontWeight: 850, color: C.green, letterSpacing: '-0.05em', opacity: ts(t, a - 0.1, a + 0.2) * (1 - ts(t, a + 1, a + 1.4)), transform: `scale(${0.8 + 0.2 * spring(t, a - 0.1, 7, 0.6)})` }}>Non.</div>
      <IPhone x={340} y={1180 + (1 - ph) * 900} s={0.82} ry={14} rx={4} o={ts(t, a + 1, a + 1.3)}>
        <WalletApp><div style={{ position: 'absolute', left: 16, top: 120 }}><Carte width={358} light={0.5} shadow={0.5} /></div></WalletApp>
      </IPhone>
      <Android x={740} y={1180 + (1 - ph) * 900} s={0.82} ry={-14} o={ts(t, a + 1.2, a + 1.5)}>
        <GoogleWalletApp><div style={{ position: 'absolute', left: 16, top: 112 }}><CarteGoogle width={358} /></div></GoogleWalletApp>
      </Android>
    </AbsoluteFill>
  )
}

const Q2 = ({ t }) => {
  const a = A('q05')
  const ent = spring(t, a - 0.2, 4.5, 1)
  const cr = rectOf('m-caisse-search', 'credit'), b20 = rectOf('m-caisse-points', 'b20'), ok = rectOf('m-caisse-points20', 'ok')
  const tCredit = W(Q, 'q05', 10), t20 = tCredit + 0.5, tOk = W(Q, 'q05', 13) - 0.1
  const screen = t < tCredit + 0.25 ? 'm-caisse-search' : t < t20 + 0.05 ? 'm-caisse-points' : t < tOk + 0.25 ? 'm-caisse-points20' : 'm-caisse-done'
  return (
    <AbsoluteFill>
      <Nuit t={t + 6} />
      <Question t={t} at={A('q04')} n="2">Et pour ajouter les points ?</Question>
      <IPhone x={540} y={1240 + (1 - ent) * 900} s={1.0} ry={-10} rx={4} inset>
        <Page name={screen} bars={false} />
        <Tap t={t} at={tCredit} x={cr.x + cr.w / 2} y={cr.y + cr.h / 2} />
        <Tap t={t} at={t20} x={b20.x + b20.w / 2} y={b20.y + b20.h / 2} />
        <Tap t={t} at={tOk} x={ok.x + ok.w / 2} y={ok.y + ok.h / 2} />
      </IPhone>
    </AbsoluteFill>
  )
}

const Q3 = ({ t }) => {
  const a = A('q07')
  const chips = [['Sans carte bancaire', W(Q, 'q07', 4)], ['Sans engagement', W(Q, 'q07', 7)]]
  return (
    <AbsoluteFill>
      <Nuit t={t + 9} />
      <Question t={t} at={A('q06')} n="3">Ça coûte combien ?</Question>
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 720, textAlign: 'center', fontFamily: font, opacity: ts(t, a - 0.1, a + 0.2), transform: `scale(${0.85 + 0.15 * spring(t, a - 0.1, 6, 0.7)})` }}>
        <div style={{ fontSize: 300, fontWeight: 850, color: '#fff', letterSpacing: '-0.06em', lineHeight: 1 }}>0 €</div>
        <div style={{ fontSize: 54, fontWeight: 650, color: C.muted, marginTop: 20 }}>jusqu'à 15 clients</div>
      </div>
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 1240, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
        {chips.map(([c, at]) => <Pastille key={c} t={t} at={at} size={42} color={C.green}>✓ {c}</Pastille>)}
      </div>
    </AbsoluteFill>
  )
}

const Commentaire = ({ t }) => {
  const a = A('q08')
  const p = spring(t, a + 0.3, 6, 0.8)
  return (
    <AbsoluteFill>
      <Nuit t={t + 12} />
      <div style={{ position: 'absolute', left: 110, top: 700, width: 860, padding: '34px 38px', borderRadius: 36, background: '#1c1c1e', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.08)', fontFamily: font, opacity: clamp(p * 1.4), transform: `translateY(${(1 - p) * 60}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: 'linear-gradient(135deg,#64d2ff,#5e5ce6)' }} />
          <span style={{ color: C.muted, fontSize: 34, fontWeight: 600 }}>Toi</span>
        </div>
        <div style={{ color: '#fff', fontSize: 50, fontWeight: 600, lineHeight: 1.3 }}>Ta question ici…<span style={{ display: 'inline-block', width: 4, height: 52, background: C.blue, marginLeft: 6, verticalAlign: 'middle', opacity: Math.floor(t * 2) % 2 }} /></div>
      </div>
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 1130, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, opacity: ts(t, a + 0.9, a + 1.3) }}>
        <Logo size={84} /><span style={{ fontFamily: font, fontSize: 64, fontWeight: 750, color: '#fff', letterSpacing: '-0.03em' }}>Fidelyz</span>
      </div>
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 1260, display: 'flex', justifyContent: 'center' }}><Pastille t={t} at={a + 1.3} size={42}>Lien en bio →</Pastille></div>
    </AbsoluteFill>
  )
}

export const Questions = ({ voix = true, son = true }) => {
  const t = useT()
  const cut = id => A(id) - 0.25
  const speaking = f => Q.$list.some(c => f / FPS > c.at - 0.1 && f / FPS < c.at + c.dur + 0.15)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Plan t={t} a={0} b={cut('q02')} tin="cut" tout="push"><Intro t={t} /></Plan>
      <Plan t={t} a={cut('q02')} b={cut('q04')} tin="push" tout="left" dout={0.7}><Q1 t={t} /></Plan>
      <Plan t={t} a={cut('q04')} b={cut('q06')} tin="left" din={0.7} tout="left" dout={0.7}><Q2 t={t} /></Plan>
      <Plan t={t} a={cut('q06')} b={cut('q08')} tin="left" din={0.7} tout="push"><Q3 t={t} /></Plan>
      <Plan t={t} a={cut('q08')} b={DUREE + 1} tin="push" tout="cut"><Commentaire t={t} /></Plan>
      {Q.$list.map(c => (
        <SousTitre key={c.id} t={t} cue={c} y={170} size={66} maxW={940} accent={{ q03: { 0: C.green }, q07: { 0: C.green }, q08: { 6: C.blue } }[c.id] ?? {}} />
      ))}
      <Grain o={0.04} />
      {son && (
        <>
          <Audio src={staticFile('sons_tt/musique-chrono.mp3')} startFrom={Math.round(45 * FPS)} volume={f => {
            const tt = f / FPS
            return Math.min(1, tt / 0.3) * Math.min(1, (DUREE - tt) / 1.2) * (voix && speaking(f) ? 0.17 : 0.36)
          }} />
          {voix && Q.$list.filter(c => c.voice).map(c => <Son key={c.id} src={`campagne/voix/${c.id}.mp3`} at={c.at - c.lead} />)}
          {[0.02, 0.42, 0.82].map((x, i) => <Son key={i} src="sons_tt/pop.mp3" at={x} vol={0.3} />)}
          {['q02', 'q04', 'q06'].map(id => <Son key={id} src="sons_tt/notif_douce.mp3" at={A(id) - 0.1} vol={0.35} />)}
          <Son src="sons_tt/hit.mp3" at={A('q03') - 0.1} vol={0.3} />
          <Son src="sons_tiktok/bip-caisse.mp3" at={W(Q, 'q05', 13) + 0.15} vol={0.3} />
          <Son src="sons_tt/hit.mp3" at={A('q07') - 0.1} vol={0.3} />
          <Son src="sons_tt/pop.mp3" at={A('q08') + 0.3} vol={0.3} />
        </>
      )}
    </AbsoluteFill>
  )
}

import { AbsoluteFill, Audio, staticFile } from 'remotion'
import { Carte } from '../Carte'
import { C, E, FPS, Grain, IPhone, Logo, NotifIOS, Nuit, Plan, Son, SousTitre, WalletApp, clamp, spring, ts, useT, font } from '../kit'
import { cues, W } from '../voix'

/* 17 — Trois astuces pour que tes clients reviennent (TikTok 1080 × 1920). Contenu utile, Fidelyz en conclusion. */
export const Q = cues('astuces')
export const DUREE = Q.$end + 0.4
const A = id => Q[id].at

/* Grand chiffre en fond, contour lumineux */
const Chiffre = ({ t, at, n }) => {
  const p = spring(t, at - 0.2, 5, 1)
  return <div style={{ position: 'absolute', right: -40, top: 380, fontFamily: font, fontSize: 900, fontWeight: 900, lineHeight: 1, color: 'transparent', WebkitTextStroke: '4px rgba(41,151,255,0.35)', opacity: clamp(p), transform: `translateX(${(1 - p) * 200}px)` }}>{n}</div>
}

/* Carte à tampons générique : n cases, k remplies */
const Cases = ({ n, k, ok, t, at, label }) => {
  const p = spring(t, at, 6, 0.9)
  const cols = n > 10 ? 10 : 5
  return (
    <div style={{ width: 860, padding: '34px 40px', borderRadius: 28, background: '#f3ead8', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)', fontFamily: font, color: '#5a3a24', opacity: clamp(p * 1.4), transform: `translateY(${(1 - p) * 60}px)`, position: 'relative' }}>
      <div style={{ fontSize: 34, fontWeight: 700, marginBottom: 22 }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: n > 10 ? 12 : 22, justifyItems: 'center' }}>
        {[...Array(n)].map((_, i) => <div key={i} style={{ width: n > 10 ? 62 : 110, height: n > 10 ? 62 : 110, borderRadius: '50%', border: '3px dashed rgba(90,58,36,0.4)', background: i < k ? 'rgba(178,34,52,0.85)' : 'transparent' }} />)}
      </div>
      <div style={{ position: 'absolute', right: -24, top: -24, width: 90, height: 90, borderRadius: 45, background: ok ? C.green : C.red, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 54, fontWeight: 800, transform: `scale(${clamp(spring(t, at + 0.5, 8, 0.6))})` }}>{ok ? '✓' : '✕'}</div>
    </div>
  )
}

const Calendrier = ({ t, at }) => {
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  const marks = [5, 12, 19, 26]
  return (
    <div style={{ width: 860, padding: 36, borderRadius: 32, background: '#1c1c1e', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.08)', fontFamily: font, color: '#fff', opacity: ts(t, at, at + 0.4) }}>
      <div style={{ fontSize: 40, fontWeight: 700, marginBottom: 20 }}>Novembre</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 12, textAlign: 'center' }}>
        {days.map((d, i) => <div key={i} style={{ fontSize: 26, color: C.muted, fontWeight: 600 }}>{d}</div>)}
        {[...Array(30)].map((_, i) => {
          const m = marks.indexOf(i + 1)
          const on = m >= 0 ? clamp(spring(t, at + 0.5 + m * 0.35, 7, 0.7)) : 0
          return <div key={i} style={{ height: 82, borderRadius: 41, display: 'grid', placeItems: 'center', fontSize: 32, fontWeight: 600, background: on ? `rgba(41,151,255,${on})` : 'transparent', color: on > 0.5 ? '#fff' : 'rgba(255,255,255,0.75)', transform: `scale(${1 + 0.15 * on * (1 - on)})` }}>{i + 1}</div>
        })}
      </div>
    </div>
  )
}

export const Astuces = ({ voix = true, son = true }) => {
  const t = useT()
  const speaking = f => Q.$list.some(c => f / FPS > c.at - 0.1 && f / FPS < c.at + c.dur + 0.15)
  const cut = id => A(id) - 0.25
  const a5 = A('a05')
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Plan t={t} a={0} b={cut('a02')} tin="cut" tout="push">
        <Nuit t={t} />
        <div style={{ position: 'absolute', left: 0, width: 1080, top: 560, textAlign: 'center', fontFamily: font, fontSize: 520, fontWeight: 900, letterSpacing: '-0.06em', background: 'linear-gradient(180deg, #fff, #2997ff)', WebkitBackgroundClip: 'text', color: 'transparent', opacity: ts(t, 0, 0.3), transform: `scale(${1.1 - 0.1 * ts(t, 0, 1.5)})` }}>3</div>
        <div style={{ position: 'absolute', left: 0, width: 1080, top: 1200, display: 'flex', justifyContent: 'center', gap: 30 }}>
          {['1', '2', '?'].map((x, i) => {
            const p = spring(t, 0.6 + i * 0.25, 6, 0.8)
            return <div key={i} style={{ width: 150, height: 150, borderRadius: 40, background: i === 2 ? C.blueBtn : '#1c1c1e', display: 'grid', placeItems: 'center', fontFamily: font, fontSize: 80, fontWeight: 800, color: '#fff', opacity: clamp(p), transform: `translateY(${(1 - p) * 60}px)`, boxShadow: i === 2 ? '0 0 50px rgba(41,151,255,0.6)' : 'inset 0 0 0 2px rgba(255,255,255,0.08)' }}>{x}</div>
          })}
        </div>
      </Plan>
      <Plan t={t} a={cut('a02')} b={cut('a03')} tin="push" tout="left" dout={0.7}>
        <Nuit t={t + 3} />
        <Chiffre t={t} at={A('a02')} n="1" />
        <div style={{ position: 'absolute', left: 110, top: 560 }}><Cases n={20} k={6} ok={false} t={t} at={W(Q, 'a02', 5)} label="20 tampons" /></div>
        <div style={{ position: 'absolute', left: 110, top: 1020 }}><Cases n={10} k={6} ok t={t} at={W(Q, 'a02', 10)} label="10 tampons" /></div>
      </Plan>
      <Plan t={t} a={cut('a03')} b={cut('a04')} tin="left" din={0.7} tout="left" dout={0.7}>
        <Nuit t={t + 6} />
        <Chiffre t={t} at={A('a03')} n="2" />
        <div style={{ position: 'absolute', left: 110, top: 560, transform: 'scale(1.0)', transformOrigin: '0 0' }}><Calendrier t={t} at={A('a03') + 0.2} /></div>
        <div style={{ position: 'absolute', left: 540 - 181 * 2.2, top: 1340, transform: 'scale(2.2)', transformOrigin: '0 0', opacity: ts(t, W(Q, 'a03', 8), W(Q, 'a03', 9)) }}><NotifIOS body="Le croissant du mois est là 🥐" /></div>
      </Plan>
      <Plan t={t} a={cut('a04')} b={cut('a05')} tin="left" din={0.7} tout="push" dout={0.8}>
        <Nuit t={t + 9} />
        <Chiffre t={t} at={A('a04')} n="3" />
        <IPhone x={540} y={1100 + (1 - spring(t, A('a04') - 0.3, 4, 1)) * 900} s={1.25} rx={4} ry={-8}>
          <WalletApp>
            <div style={{ position: 'absolute', left: 16, top: 120, width: 358, height: 226, borderRadius: 18, background: 'linear-gradient(135deg, #2b3a67, #121a33 60%, #3c2a5e)', color: '#fff', fontFamily: font, fontSize: 16, fontWeight: 600, padding: '16px 20px', boxSizing: 'border-box' }}>Ma Banque<span style={{ float: 'right', opacity: 0.7, fontSize: 13 }}>DÉBIT</span></div>
            <div style={{ position: 'absolute', left: 16, top: 190 + (1 - spring(t, W(Q, 'a04', 8), 6, 0.85)) * 600 }}><Carte width={358} light={0.5} shadow={0.6} /></div>
          </WalletApp>
        </IPhone>
      </Plan>
      <Plan t={t} a={cut('a05')} b={DUREE + 1} tin="push" din={0.8} tout="cut">
        <Nuit t={t + 12} />
        <div style={{ position: 'absolute', left: 120, top: 560, display: 'flex', flexDirection: 'column', gap: 34 }}>
          {['Une récompense atteignable', 'Des rappels, sans spam', 'Une carte impossible à perdre'].map((x, i) => {
            const p = spring(t, a5 + i * 0.3, 6, 0.85)
            return <div key={x} style={{ display: 'flex', alignItems: 'center', gap: 28, fontFamily: font, fontSize: 52, fontWeight: 700, color: '#fff', opacity: clamp(p), transform: `translateX(${(1 - p) * -60}px)` }}><span style={{ width: 84, height: 84, borderRadius: 42, background: C.green, display: 'grid', placeItems: 'center', fontSize: 46 }}>✓</span>{x}</div>
          })}
        </div>
        <div style={{ position: 'absolute', left: 0, width: 1080, top: 1080, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, opacity: ts(t, W(Q, 'a05', 10), W(Q, 'a05', 10) + 0.4) }}>
          <Logo size={110} /><span style={{ fontFamily: font, fontSize: 100, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em' }}>Fidelyz</span>
        </div>
        <div style={{ position: 'absolute', left: 0, width: 1080, top: 1260, textAlign: 'center', fontFamily: font, fontSize: 44, fontWeight: 650, color: C.blue, opacity: ts(t, W(Q, 'a05', 11), W(Q, 'a05', 11) + 0.4) }}>Lien en bio →</div>
      </Plan>
      {Q.$list.map(c => (
        <SousTitre key={c.id} t={t} cue={c} y={165} size={66} maxW={940} accent={{ a01: { 8: C.blue }, a02: { 0: C.blue }, a03: { 0: C.blue }, a04: { 0: C.blue }, a05: { 10: C.blue } }[c.id] ?? {}} />
      ))}
      <Grain o={0.04} />
      {son && (
        <>
          <Audio src={staticFile('sons_tt/musique-keynote.mp3')} startFrom={Math.round(80 * FPS)} volume={f => {
            const tt = f / FPS
            return Math.min(1, tt / 0.3) * Math.min(1, (DUREE - tt) / 1.2) * (voix && speaking(f) ? 0.1 : 0.42)
          }} />
          {voix && Q.$list.filter(c => c.voice).map(c => <Son key={c.id} src={`campagne/voix/${c.id}.mp3`} at={c.at - c.lead} />)}
          {[0.6, 0.85, 1.1].map((x, i) => <Son key={i} src="sons_tt/pop.mp3" at={x} vol={0.3} />)}
          {['a02', 'a03', 'a04', 'a05'].map(id => <Son key={id} src="sons_tt/whoosh7.mp3" at={A(id) - 0.35} vol={0.35} />)}
          <Son src="sons_tt/hit.mp3" at={W(Q, 'a02', 5) + 0.5} vol={0.25} />
          <Son src="sons_tt/scintille.mp3" at={W(Q, 'a02', 10) + 0.5} vol={0.3} />
          <Son src="sons_tt/notif_douce.mp3" at={W(Q, 'a03', 8)} vol={0.4} />
          <Son src="sons_tt/swoosh.mp3" at={W(Q, 'a04', 8)} vol={0.35} />
          <Son src="sons_tt/hit_logo.mp3" at={W(Q, 'a05', 10)} vol={0.35} />
        </>
      )}
    </AbsoluteFill>
  )
}

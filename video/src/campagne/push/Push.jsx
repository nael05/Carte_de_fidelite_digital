import { AbsoluteFill, Audio, staticFile } from 'remotion'
import {
  C, E, FPS, FondEcran, Fin, Grain, IPhone, NotifIOS, Nuit, Page, Plan, SH, SW, Son, SousTitre, Tap, Verrouille,
  clamp, lerp, rectOf, spring, ts, useT, font, volMusique } from '../kit'
import { cues, W } from '../voix'

/* 03 — Les notifications push (TikTok 1080 × 1920). */
export const Q = cues('push')
export const DUREE = Q.$end + 0.4
const A = id => Q[id].at
const MSG = { title: 'Maison Lumière', body: 'Le chocolat chaud est de retour ☕ Votre 2e boisson est offerte cette semaine.' }

/* 1. Accroche : la notification tombe sur l'écran verrouillé, puis la caméra recule */
const Accroche = ({ t }) => {
  const back = ts(t, 0.9, A('p02') - 0.2, 0, 1, E.io)
  const s = lerp(2.5, 1.3, back)
  const y = lerp(1000 - (700 - SH / 2) * 2.5, 1110, back)
  return (
    <AbsoluteFill>
      <Nuit t={t} />
      <IPhone x={540} y={y} s={s} rx={8 * back} ry={-10 * back} time="">
        <Verrouille t={t} time="11:24" notifs={[{ at: 0.35, ...MSG }]} />
      </IPhone>
    </AbsoluteFill>
  )
}

/* 2. Pas un SMS, pas un email */
const Bulle = ({ children, p, x, y, strike, gray }) => (
  <div style={{ position: 'absolute', left: x, top: y, opacity: clamp(p * 1.4), transform: `translateY(${(1 - p) * 60}px) scale(${0.92 + 0.08 * p})`, filter: `grayscale(${gray}) brightness(${1 - 0.45 * gray})` }}>
    {children}
    <div style={{ position: 'absolute', left: -20, top: '50%', height: 8, width: `calc(${strike * 100}% + 40px)`, background: C.red, borderRadius: 4, boxShadow: '0 0 20px rgba(255,69,58,0.6)' }} />
  </div>
)
const PasSMS = ({ t }) => {
  const a = A('p02')
  const sms = spring(t, a - 0.1, 6, 0.9), mail = spring(t, W(Q, 'p02', 3), 6, 0.9)
  const s1 = ts(t, W(Q, 'p02', 2) - 0.05, W(Q, 'p02', 2) + 0.35, 0, 1, E.io)
  const s2 = ts(t, W(Q, 'p02', 8) - 0.1, W(Q, 'p02', 8) + 0.35, 0, 1, E.io)
  return (
    <AbsoluteFill>
      <Nuit t={t + 2} warm={0.1} cool={0.18} />
      <Bulle p={sms} x={150} y={640} strike={s1} gray={s1}>
        <div style={{ width: 780, padding: '30px 38px', borderRadius: 44, background: '#30d158', color: '#fff', fontFamily: font, fontSize: 40, lineHeight: 1.3 }}>
          <div style={{ fontSize: 28, opacity: 0.85, marginBottom: 6 }}>SMS · 36180</div>
          PROMO -20% CE WE ! Profitez-en vite. STOP au 36180
        </div>
      </Bulle>
      <Bulle p={mail} x={150} y={1050} strike={s2} gray={s2}>
        <div style={{ width: 780, display: 'flex', gap: 30, alignItems: 'center', padding: '30px 38px', borderRadius: 44, background: '#1c1c1e', color: '#fff', fontFamily: font, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.08)' }}>
          <div style={{ position: 'relative', width: 120, height: 120, borderRadius: 28, background: 'linear-gradient(180deg,#1e90ff,#0a64d6)', display: 'grid', placeItems: 'center' }}>
            <svg width="70" height="52" viewBox="0 0 70 52"><rect x="2" y="2" width="66" height="48" rx="6" fill="#fff" /><path d="M4 6l31 24L66 6" stroke="#1e90ff" strokeWidth="5" fill="none" /></svg>
            <div style={{ position: 'absolute', right: -18, top: -18, padding: '6px 14px', borderRadius: 999, background: C.red, fontSize: 30, fontWeight: 700 }}>2 487</div>
          </div>
          <div style={{ fontSize: 40, lineHeight: 1.25 }}>Newsletter de novembre<div style={{ fontSize: 30, opacity: 0.5 }}>Non lu</div></div>
        </div>
      </Bulle>
    </AbsoluteFill>
  )
}

/* 3. La notification sort de l'écran verrouillé, en relief */
const Relief = ({ t }) => {
  const a = A('p03')
  const ent = spring(t, a - 0.4, 4.5, 1)
  const pop = spring(t, W(Q, 'p03', 2), 5, 0.75)
  const ph = { x: 540, y: 1140, s: 1.2, rx: 22 - 6 * ent, ry: -18 + 8 * ent, rz: 4 }
  return (
    <AbsoluteFill>
      <Nuit t={t + 4} />
      <IPhone {...ph} o={ent} time="">
        <Verrouille t={t} time="11:24" notifs={[]} />
      </IPhone>
      {/* la notification, posée sur l'écran puis soulevée vers la caméra */}
      <div style={{ position: 'absolute', left: 540 - 181 * lerp(1.2, 2.4, clamp(pop)), top: lerp(1310, 1080, clamp(pop)), transform: `scale(${lerp(1.2, 2.4, pop)})`, transformOrigin: '0 0', filter: `drop-shadow(0 ${40 * pop}px ${50 * pop}px rgba(0,0,0,0.7))`, opacity: ts(t, a - 0.1, a + 0.2) }}>
        <NotifIOS {...MSG} />
      </div>
    </AbsoluteFill>
  )
}

/* 4-5. Le commerçant écrit et envoie (vrai écran Campagnes du site) */
const Ecrire = ({ t }) => {
  const a = A('p04'), b = A('p05')
  const title = rectOf('m-campagnes-filled', 'title'), msg = rectOf('m-campagnes-filled', 'msg'), send = rectOf('m-campagnes-filled', 'send')
  const scroll = 360
  const pT = ts(t, W(Q, 'p04', 1), W(Q, 'p04', 4), 0, 1, E.lin), pM = ts(t, W(Q, 'p04', 5), W(Q, 'p04', 12), 0, 1, E.lin)
  const tSend = W(Q, 'p05', 3)
  // zoom sur le bouton d'envoi
  const z = ts(t, b - 0.3, tSend - 0.15, 0, 1, E.io)
  const sendPt = { x: send.x + send.w / 2, y: send.y + send.h / 2 - scroll }
  const s = lerp(1.25, 2.4, z)
  const x = lerp(540, 540 - (sendPt.x - SW / 2) * 2.4, z)
  const y = lerp(1100, 1060 - (sendPt.y + 50 - SH / 2) * 2.4, z)
  const chips = [['🏷️', 'Une offre', 6], ['✨', 'Une nouveauté', 8], ['🥐', 'Le produit du jour', 11]]
  const clip = (r, p) => `inset(${r.y}px ${390 - (r.x + 12 + (r.w - 24) * p)}px calc(100% - ${r.y + r.h}px) ${r.x}px)`
  return (
    <AbsoluteFill>
      <Nuit t={t + 6} />
      <IPhone x={x} y={y} s={s} ry={-8 * (1 - z)} rx={3 * (1 - z)} inset>
        <Page name="m-campagnes" scroll={scroll} />
        <div style={{ position: 'absolute', inset: 0, clipPath: clip({ ...title, y: title.y - scroll }, pT) }}><Page name="m-campagnes-filled" scroll={scroll} bars={false} /></div>
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(${msg.y - scroll}px 0 calc(100% - ${msg.y - scroll + msg.h * pM + 2}px) 0)` }}><Page name="m-campagnes-filled" scroll={scroll} bars={false} /></div>
        <Tap t={t} at={tSend} x={sendPt.x} y={sendPt.y} />
        {t > tSend && <div style={{ position: 'absolute', left: send.x, top: send.y - scroll, width: send.w, height: send.h, borderRadius: 21, background: 'rgba(255,255,255,0.3)', opacity: 1 - ts(t, tSend + 0.2, tSend + 0.6), transform: `scaleX(${ts(t, tSend, tSend + 0.3)})`, transformOrigin: 'left' }} />}
      </IPhone>
      {chips.map(([e, l, n], i) => {
        const p = spring(t, W(Q, 'p04', n) - 0.05, 7, 0.8)
        const out = ts(t, b - 0.4, b - 0.1)
        return t > W(Q, 'p04', n) - 0.1 && (
          <div key={l} style={{ position: 'absolute', left: [70, 560, 180][i], top: [560, 640, 1530][i], padding: '18px 30px', borderRadius: 999, background: 'rgba(28,28,30,0.85)', backdropFilter: 'blur(20px)', border: '1.5px solid rgba(255,255,255,0.14)', color: '#fff', fontFamily: font, fontSize: 40, fontWeight: 600, opacity: clamp(p) * (1 - out), transform: `translateY(${(1 - p) * 40}px) scale(${0.9 + 0.1 * p})`, zIndex: 30 }}>{e} {l}</div>
        )
      })}
    </AbsoluteFill>
  )
}

/* 6. La vague : des dizaines d'écrans verrouillés s'allument */
const MiniPhone = ({ on, k }) => (
  <div style={{ width: 150, height: 320, borderRadius: 30, background: '#111', padding: 6, boxSizing: 'border-box', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.8), inset 0 0 0 1.5px #555' }}>
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.36)', transformOrigin: '0 0', width: SW, height: SH }}><FondEcran hue={k * 25} /></div>
      <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: 0.55 * (1 - on) + 0.1 }} />
      <div style={{ position: 'absolute', top: 30, width: '100%', textAlign: 'center', color: '#fff', fontFamily: font, fontSize: 34, fontWeight: 600 }}>11:24</div>
      <div style={{ position: 'absolute', left: 8, right: 8, top: 190, height: 50, borderRadius: 12, background: 'rgba(80,80,90,0.75)', opacity: on, transform: `translateY(${(1 - on) * 20}px)`, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px' }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: 'linear-gradient(135deg,#f6e4c8,#b8926a)' }} />
        <div style={{ flex: 1 }}><div style={{ height: 6, width: '70%', borderRadius: 3, background: '#fff', marginBottom: 6 }} /><div style={{ height: 5, width: '90%', borderRadius: 3, background: 'rgba(255,255,255,0.6)' }} /></div>
      </div>
    </div>
  </div>
)
const Vague = ({ t }) => {
  const a = A('p06')
  const cols = 7, rows = 9
  const cam = ts(t, a - 0.5, A('p07'), 0, 1, E.soft)
  return (
    <AbsoluteFill>
      <Nuit t={t + 8} />
      <div style={{ position: 'absolute', left: 540, top: 1000, transform: `perspective(2400px) rotateX(${38 - 10 * cam}deg) rotateZ(${-12 + 6 * cam}deg) scale(${1.25 - 0.2 * cam})` }}>
        {[...Array(rows)].map((_, r) => [...Array(cols)].map((_, c) => {
          const dx = c - (cols - 1) / 2, dy = r - (rows - 1) / 2
          const d = Math.hypot(dx, dy * 0.9)
          const on = clamp(spring(t, a + 0.2 + d * 0.22, 7, 0.9))
          return <div key={`${r}-${c}`} style={{ position: 'absolute', left: dx * 180 - 75, top: dy * 360 - 160 }}><MiniPhone on={on} k={r * cols + c} /></div>
        }))}
      </div>
    </AbsoluteFill>
  )
}

/* 7. Sans application, sans numéro, sans frais */
const Sans = ({ t }) => {
  const items = [['Application à télécharger', 1, 'M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM11 18h2'], ['Numéro de téléphone', 3, 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2'], ["Frais d'envoi", 7, 'M17 6a7 7 0 1 0 0 12M4 10h9M4 14h9']]
  return (
    <AbsoluteFill>
      <Nuit t={t + 10} />
      {items.map(([l, n, d], i) => {
        const at = W(Q, 'p07', n) - 0.15
        const p = spring(t, at, 6, 0.9), s = ts(t, at + 0.35, at + 0.7, 0, 1, E.io)
        return (
          <div key={l} style={{ position: 'absolute', left: 120, top: 640 + i * 230, display: 'flex', alignItems: 'center', gap: 40, opacity: clamp(p * 1.3), transform: `translateX(${(1 - p) * -80}px)`, fontFamily: font }}>
            <div style={{ position: 'relative', width: 150, height: 150, borderRadius: 40, background: '#1c1c1e', display: 'grid', placeItems: 'center', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.1)' }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#f5f5f7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
              <svg width="150" height="150" viewBox="0 0 150 150" style={{ position: 'absolute', inset: 0 }}><line x1="30" y1="120" x2="120" y2="30" stroke={C.red} strokeWidth="10" strokeLinecap="round" strokeDasharray="128" strokeDashoffset={128 * (1 - s)} /></svg>
            </div>
            <div style={{ color: '#fff', fontSize: 60, fontWeight: 700, letterSpacing: '-0.03em', width: 720 }}>
              <span style={{ color: C.muted, fontWeight: 500 }}>0 </span>{l}
            </div>
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

export const Push = ({ voix = true, son = true }) => {
  const t = useT()
  const cut = id => A(id) - 0.25
  const speaking = f => Q.$list.some(c => f / FPS > c.at - 0.1 && f / FPS < c.at + c.dur + 0.15)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Plan t={t} a={0} b={cut('p02')} tin="cut" tout="push"><Accroche t={t} /></Plan>
      <Plan t={t} a={cut('p02')} b={cut('p03')} tin="push" tout="push"><PasSMS t={t} /></Plan>
      <Plan t={t} a={cut('p03')} b={cut('p04')} tin="push" tout="left" dout={0.7}><Relief t={t} /></Plan>
      <Plan t={t} a={cut('p04')} b={cut('p06')} tin="left" din={0.7} tout="push" dout={0.7}><Ecrire t={t} /></Plan>
      <Plan t={t} a={cut('p06')} b={cut('p07')} tin="push" din={0.7} tout="up" dout={0.7}><Vague t={t} /></Plan>
      <Plan t={t} a={cut('p07')} b={cut('p08')} tin="up" din={0.7} tout="push" dout={0.8}><Sans t={t} /></Plan>
      <Plan t={t} a={cut('p08')} b={DUREE + 1} tin="push" din={0.8} tout="cut"><Nuit t={t} /><Fin t={t} at={A('p08')} sub="Fais revenir tes clients" /></Plan>
      {Q.$list.filter(c => c.id !== 'p08').map(c => (
        <SousTitre key={c.id} t={t} cue={c} y={170} size={70} maxW={920} accent={{ p01: { 7: C.blue }, p02: { 2: C.red, 6: C.red }, p03: { 0: C.blue, 1: C.blue }, p05: { 3: C.blue }, p06: { 1: C.champagne, 3: C.champagne } }[c.id] ?? {}} />
      ))}
      <Grain o={0.04} />
      {son && (
        <>
          <Audio src={staticFile('campagne/musique/push.mp3')} volume={f => {
            const tt = f / FPS
            return Math.min(1, tt / 0.3) * Math.min(1, (DUREE - tt) / 1.2) * volMusique(Q.$list, f / FPS, voix, 0.36)
          }} />
          {voix && Q.$list.filter(c => c.voice).map(c => <Son key={c.id} src={`campagne/voix/${c.id}.mp3`} at={c.at - c.lead} />)}
          <Son src="sons_tt/notif.mp3" at={0.35} vol={0.6} />
          <Son src="sons_tt/whoosh7.mp3" at={A('p02') - 0.35} vol={0.4} />
          <Son src="sons_tt/scratch.mp3" at={W(Q, 'p02', 2)} vol={0.12} dur={0.5} />
          <Son src="sons_tt/scratch.mp3" at={W(Q, 'p02', 8)} vol={0.12} dur={0.5} />
          <Son src="sons_tt/whoosh7.mp3" at={A('p03') - 0.35} vol={0.4} />
          <Son src="sons_tt/notif_douce.mp3" at={W(Q, 'p03', 2)} vol={0.45} />
          <Son src="sons_tt/swoosh2.mp3" at={A('p04') - 0.3} vol={0.4} />
          {[6, 8, 11].map(n => <Son key={n} src="sons_tt/pop.mp3" at={W(Q, 'p04', n) - 0.05} vol={0.3} />)}
          <Son src="sons_tt/clic.mp3" at={W(Q, 'p05', 3)} vol={0.55} />
          <Son src="sons_tt/riser_court.mp3" at={W(Q, 'p05', 3) + 0.1} vol={0.3} />
          <Son src="sons_tt/whoosh.mp3" at={A('p06') - 0.3} vol={0.45} />
          {[0, 0.25, 0.5, 0.8].map((d, i) => <Son key={i} src="sons_tt/notif_douce.mp3" at={A('p06') + 0.2 + d} vol={0.3 - i * 0.05} />)}
          <Son src="sons_tt/swoosh.mp3" at={A('p07') - 0.3} vol={0.35} />
          <Son src="sons_tt/hit_logo.mp3" at={A('p08') - 0.05} vol={0.35} />
        </>
      )}
    </AbsoluteFill>
  )
}

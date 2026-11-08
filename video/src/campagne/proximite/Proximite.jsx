import { AbsoluteFill, Audio, staticFile } from 'remotion'
import { C, E, FPS, Fin, Grain, IPhone, IconePass, Nuit, Page, Plan, SH, Son, SousTitre, Tap, Verrouille, clamp, lerp, rectOf, spring, ts, useT, font, volMusique } from '../kit'
import { cues, W } from '../voix'

/* 07 — Le rappel de proximité (TikTok 1080 × 1920).
   Plan du quartier incliné en 3D, le client marche, entre dans la zone : la carte apparaît sur son écran verrouillé.
   Puis le vrai écran Réglages → Géolocalisation du site. */
export const Q = cues('proximite')
export const DUREE = Q.$end + 0.4
const A = id => Q[id].at

// Trajet du client (coordonnées du plan, 1000 × 1600) et boutique
const SHOP = { x: 790, y: 900 }
const PATH = [[120, 1500], [260, 1180], [420, 980], [560, 860], [700, 700], [820, 520], [930, 300]]
const along = k => {
  const n = PATH.length - 1, f = clamp(k) * n, i = Math.min(n - 1, Math.floor(f)), u = f - i
  return { x: lerp(PATH[i][0], PATH[i + 1][0], u), y: lerp(PATH[i][1], PATH[i + 1][1], u) }
}

export const Carte3D = ({ t }) => {
  const walk = ts(t, 0.2, W(Q, 'x02', 3), 0, 0.62, E.soft) + ts(t, W(Q, 'x03', 4), A('x04'), 0, 0.38, E.soft)
  const p = along(walk)
  const inZone = Math.hypot(p.x - SHOP.x, p.y - SHOP.y) < 260
  const zoneOn = ts(t, W(Q, 'x02', 1), W(Q, 'x02', 3))
  const cam = ts(t, 0, A('x04'), 0, 1, E.soft)
  return (
    <div style={{ position: 'absolute', left: 540 - 500, top: 1000 - 800, width: 1000, height: 1600, transform: `perspective(2200px) rotateX(${52 - 8 * cam}deg) rotateZ(${-18 + 10 * cam}deg) scale(${1.05 + 0.1 * cam})`, transformStyle: 'preserve-3d' }}>
      {/* sol et rues */}
      <div style={{ position: 'absolute', inset: -400, background: '#0e1014', borderRadius: 40 }} />
      <svg width="1000" height="1600" viewBox="0 0 1000 1600" style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
        {[[-300, 1700, 1300, -100], [-300, 600, 1300, 900], [200, -300, 400, 1900], [700, -300, 900, 1900], [-300, 1200, 1300, 1350]].map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#23262d" strokeWidth={i === 0 ? 70 : 46} strokeLinecap="round" />)}
        {[[60, 80, 220, 220], [520, 60, 200, 200], [70, 940, 180, 160], [740, 1000, 220, 260], [300, 1300, 220, 200], [860, 620, 200, 170]].map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} rx="18" fill="#16191f" />)}
        {/* trace du trajet */}
        <polyline points={PATH.map(q => q.join(',')).join(' ')} fill="none" stroke="rgba(227,201,164,0.25)" strokeWidth="8" strokeDasharray="2 22" strokeLinecap="round" />
      </svg>
      {/* zone de proximité autour de la boutique */}
      <div style={{ position: 'absolute', left: SHOP.x - 260, top: SHOP.y - 260, width: 520, height: 520, borderRadius: '50%', background: `radial-gradient(closest-side, rgba(41,151,255,${inZone ? 0.28 : 0.14}), rgba(41,151,255,0.04))`, border: `3px solid rgba(41,151,255,${0.6 * zoneOn})`, opacity: zoneOn, transform: `scale(${0.6 + 0.4 * zoneOn})` }} />
      {[0, 1].map(i => {
        const k = ((t + i * 1.2) % 2.4) / 2.4
        return <div key={i} style={{ position: 'absolute', left: SHOP.x - 60, top: SHOP.y - 60, width: 120, height: 120, borderRadius: '50%', border: '3px solid rgba(41,151,255,0.7)', transform: `scale(${1 + 3 * k})`, opacity: (1 - k) * zoneOn }} />
      })}
      {/* la boutique */}
      <div style={{ position: 'absolute', left: SHOP.x - 46, top: SHOP.y - 46, width: 92, height: 92, borderRadius: 28, background: '#1c1c1e', display: 'grid', placeItems: 'center', boxShadow: '0 0 0 4px rgba(255,255,255,0.15), 0 20px 40px rgba(0,0,0,0.6)' }}><IconePass size={70} /></div>
      <div style={{ position: 'absolute', left: SHOP.x + 60, top: SHOP.y - 22, fontFamily: font, fontSize: 36, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textShadow: '0 4px 12px #000' }}>Maison Lumière</div>
      {/* le client */}
      <div style={{ position: 'absolute', left: p.x - 24, top: p.y - 24, width: 48, height: 48, borderRadius: 24, background: C.champagne, boxShadow: `0 0 0 12px rgba(227,201,164,0.22), 0 0 50px rgba(227,201,164,0.9)` }} />
    </div>
  )
}

const Scene = ({ t }) => {
  const tN = W(Q, 'x02', 7)
  const ph = spring(t, tN - 0.35, 5, 1)
  const zN = ts(t, tN + 0.6, tN + 1.7, 0, 1, E.io)
  const out = ts(t, A('x04') - 0.5, A('x04') + 0.1, 0, 1, E.io)
  return (
    <AbsoluteFill>
      <Nuit t={t} cool={0.18} />
      <div style={{ position: 'absolute', inset: 0, filter: `brightness(${1 - 0.4 * ph})` }}><Carte3D t={t} /></div>
      {/* l'écran verrouillé du client remonte, la carte apparaît */}
      <IPhone x={540} y={lerp(lerp(2900, 1130, ph), 1000 - (690 - SH / 2) * 2.0, zN)} s={lerp(1.25, 2.0, zN)} rx={6 * (1 - zN)} ry={(-6 + 8 * ts(t, tN, A('x04'))) * (1 - zN)} time="">
        <Verrouille t={t} time="17:42" notifs={[{ at: tN, title: 'Maison Lumière', body: 'Maison Lumière est à 50 m ☕ Plus que 20 points avant votre café.', time: 'à proximité' }]} />
      </IPhone>
    </AbsoluteFill>
  )
}

/* Le vrai écran Réglages → Géolocalisation */
const Reglage = ({ t }) => {
  const a = A('x04')
  const msg = rectOf('m-reglages-geo', 'msg'), save = rectOf('m-reglages-geo', 'save')
  const ent = spring(t, a - 0.4, 5, 1)
  const tSave = W(Q, 'x04', 7)
  const pin = spring(t, A('x05') + 0.2, 6, 0.7)
  return (
    <AbsoluteFill>
      <Nuit t={t + 5} />
      <IPhone x={540} y={1130 + (1 - ent) * 600} s={1.22} rx={4} ry={-10 + 14 * ts(t, a, A('x06'))} inset>
        <Page name="m-reglages-geo" scroll={0} />
        {save && <Tap t={t} at={tSave} x={save.x + save.w / 2} y={save.y + save.h / 2} />}
        {msg && <div style={{ position: 'absolute', left: msg.x - 6, top: msg.y - 6, width: msg.w + 12, height: msg.h + 12, borderRadius: 14, border: `3px solid ${C.blue}`, opacity: ts(t, a + 0.6, a + 1) * (1 - ts(t, tSave - 0.2, tSave)) }} />}
      </IPhone>
      {/* « une seule fois » */}
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 405, display: 'flex', justifyContent: 'center', zIndex: 30, opacity: clamp(pin), transform: `translateY(${(1 - pin) * 30}px)` }}>
        <div style={{ padding: '16px 34px', borderRadius: 999, background: 'rgba(48,209,88,0.16)', border: '1.5px solid rgba(48,209,88,0.5)', color: C.green, fontFamily: font, fontSize: 40, fontWeight: 700 }}>✓ Réglé une fois pour toutes</div>
      </div>
    </AbsoluteFill>
  )
}

export const Proximite = ({ voix = true, son = true }) => {
  const t = useT()
  const cut = id => A(id) - 0.25
  const speaking = f => Q.$list.some(c => f / FPS > c.at - 0.1 && f / FPS < c.at + c.dur + 0.15)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Plan t={t} a={0} b={cut('x04')} tin="cut" tout="push" dout={0.8}><Scene t={t} /></Plan>
      <Plan t={t} a={cut('x04')} b={cut('x06')} tin="push" din={0.8} tout="push" dout={0.8}><Reglage t={t} /></Plan>
      <Plan t={t} a={cut('x06')} b={DUREE + 1} tin="push" din={0.8} tout="cut"><Nuit t={t} /><Fin t={t} at={A('x06')} sub="Fais revenir tes clients" /></Plan>
      {Q.$list.filter(c => c.id !== 'x06').map(c => (
        <SousTitre key={c.id} t={t} cue={c} y={170} size={68} maxW={920} accent={{ x01: { 3: C.champagne, 4: C.champagne }, x02: { 7: C.blue, 8: C.blue }, x04: { 6: C.green, 7: C.green } }[c.id] ?? {}} />
      ))}
      <Grain o={0.04} />
      {son && (
        <>
          <Audio src={staticFile('campagne/musique/proximite.mp3')} volume={f => {
            const tt = f / FPS
            return Math.min(1, tt / 0.3) * Math.min(1, (DUREE - tt) / 1.2) * volMusique(Q.$list, f / FPS, voix, 0.42)
          }} />
          {voix && Q.$list.filter(c => c.voice).map(c => <Son key={c.id} src={`campagne/voix/${c.id}.mp3`} at={c.at - c.lead} />)}
          <Son src="sons_tt/scintille.mp3" at={W(Q, 'x02', 1)} vol={0.3} />
          <Son src="sons_tt/whoosh.mp3" at={W(Q, 'x02', 7) - 0.4} vol={0.35} />
          <Son src="sons_tt/notif.mp3" at={W(Q, 'x02', 7)} vol={0.55} />
          <Son src="sons_tt/whoosh7.mp3" at={A('x04') - 0.4} vol={0.4} />
          <Son src="sons_tt/clic.mp3" at={W(Q, 'x04', 7)} vol={0.45} />
          <Son src="sons_tt/pop.mp3" at={A('x05') + 0.2} vol={0.3} />
          <Son src="sons_tt/hit_logo.mp3" at={A('x06') - 0.05} vol={0.35} />
        </>
      )}
    </AbsoluteFill>
  )
}

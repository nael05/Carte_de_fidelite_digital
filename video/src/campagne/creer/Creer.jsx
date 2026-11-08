import { AbsoluteFill, Audio, staticFile } from 'remotion'
import { Carte, CarteGoogle, SKIN } from '../Carte'
import { C, E, FPS, Fin, Grain, IPhone, Nuit, Page, Plan, Son, SousTitre, Studio, clamp, lerp, spring, ts, useT, font, volMusique } from '../kit'
import { Presentoir } from '../objets'
import { cues, W } from '../voix'

/* 04 — Ta carte en 2 minutes (TikTok 1080 × 1920).
   Studio blanc, un chrono qui tourne : la carte se construit pièce par pièce, à côté du vrai écran « Ma carte ». */
export const Q = cues('creer')
export const DUREE = Q.$end + 0.4
const A = id => Q[id].at

/* Chrono : le temps file en accéléré (0:00 → 1:52 à l'enregistrement) */
const Chrono = ({ t, dark }) => {
  const end = W(Q, 'c06', 0)
  const k = ts(t, A('c01') + 0.4, end, 0, 1, E.lin)
  const secs = Math.round(112 * k)
  const done = t >= end
  const p = spring(t, end, 7, 0.6)
  return (
    <div style={{ position: 'absolute', left: 0, width: 1080, top: 470, display: 'flex', justifyContent: 'center', zIndex: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 32px', borderRadius: 999, background: done ? C.green : dark ? '#1d1d1f' : '#fff', color: done || dark ? '#fff' : '#1d1d1f', fontFamily: font, fontSize: 46, fontWeight: 700, fontVariantNumeric: 'tabular-nums', boxShadow: '0 20px 40px -20px rgba(0,0,0,0.35)', transform: `scale(${done ? 1 + 0.08 * Math.sin(Math.PI * clamp(p)) : 1})` }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="13" r="8" /><path d="M9 2h6" /><path d={`M12 13 L${12 + 5 * Math.sin(k * 40)} ${13 - 5 * Math.cos(k * 40)}`} /></svg>
        {done ? '1:52  ✓' : `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`}
      </div>
    </div>
  )
}

const Atelier = ({ t }) => {
  // étapes
  const tOrg = W(Q, 'c02', 1), tLogo = W(Q, 'c02', 5), tBg = W(Q, 'c03', 2), tInk = W(Q, 'c03', 5), tLab = W(Q, 'c03', 8), tStrip = W(Q, 'c04', 3), tBack = W(Q, 'c05', 2), tFront = A('c06') - 0.2
  const p = (a, d = 0.5) => ts(t, a, a + d, 0, 1, E.out)
  const bg = p(tBg, 0.6), ink = p(tInk, 0.4), lab = p(tLab, 0.4)
  const mix = (a, b, k) => {
    const h = x => [1, 3, 5].map(i => parseInt(x.slice(i, i + 2), 16))
    const [r1, g1, b1] = h(a), [r2, g2, b2] = h(b)
    return `rgb(${Math.round(lerp(r1, r2, k))},${Math.round(lerp(g1, g2, k))},${Math.round(lerp(b1, b2, k))})`
  }
  const flip = ts(t, tBack - 0.1, tBack + 0.6, 0, 1, E.io) * (1 - ts(t, tFront, tFront + 0.6, 0, 1, E.io))
  const ry = -14 + 10 * Math.sin(t * 0.5) + 180 * flip
  const split = ts(t, W(Q, 'c06', 6), W(Q, 'c06', 6) + 0.8, 0, 1, E.io)
  const vars = { '--pass-bg': mix('#e8e8ed', '#1c1c1e', bg), '--ink': mix('#1d1d1f', '#ffffff', ink), '--label': mix('#86868b', '#e3c9a4', lab), '--edge': mix('#c7c7cc', '#0e0e10', bg) }
  const build = { org: p(tOrg), mark: clamp(spring(t, tLogo, 8, 0.6)), points: p(tBg + 0.2), strip: ts(t, tStrip, tStrip + 0.7, 0, 1, E.io), fields: p(tInk), barcode: p(tLab + 0.2) }
  const exit = ts(t, A('c07') - 0.3, A('c07') + 0.5, 0, 1, E.io)
  const stand = spring(t, A('c07') + 0.1, 5, 1)
  return (
    <AbsoluteFill>
      <Studio dark={ts(t, A('c07') - 0.3, A('c07') + 0.5)} />
      {/* contour de départ */}
      <div style={{ position: 'absolute', left: 540 - 285, top: 1020 - 450, width: 570, height: 900, borderRadius: 30, border: '4px dashed rgba(0,0,0,0.18)', opacity: 1 - ts(t, tBg - 0.2, tBg + 0.3) }} />
      {/* la carte en construction (Apple), qui se dédouble en Google à l'enregistrement */}
      <div style={{ position: 'absolute', left: 540 - 285 - 230 * split - 600 * exit, top: 1020 - 450 + 40 * split, transform: `scale(${1 - 0.22 * split})`, transformOrigin: '50% 50%', opacity: 1 - exit }}>
        <Carte width={570} ry={ry * (1 - split) + 10 * split} rx={6} vars={vars} build={build} light={0.35} shadow={0.5} />
      </div>
      {split > 0 && (
        <div style={{ position: 'absolute', left: 540 - 285 + 230 * split + 600 * exit, top: 1020 - 450 + 40 * split + 80, transform: `scale(${0.78})`, opacity: clamp(split * 1.5) * (1 - exit) }}>
          <CarteGoogle width={570} ry={-10} rx={6} />
        </div>
      )}
      {split > 0.6 && (
        <div style={{ position: 'absolute', left: 0, width: 1080, top: 1640, display: 'flex', justifyContent: 'space-around', padding: '0 120px', boxSizing: 'border-box', fontFamily: font, fontSize: 40, fontWeight: 650, color: '#1d1d1f', opacity: ts(t, W(Q, 'c06', 6) + 0.4, W(Q, 'c06', 6) + 0.8) * (1 - exit) }}>
          <span>iPhone</span><span>Android</span>
        </div>
      )}
      {/* le QR code en caisse */}
      {exit > 0 && (
        <div style={{ position: 'absolute', left: 540 - 230, top: 700 + (1 - stand) * 1200, transform: `perspective(2000px) rotateX(${8}deg) rotateY(${-12 + 8 * ts(t, A('c07'), A('c08'))}deg)` }}><Presentoir width={460} /></div>
      )}
      {/* le vrai écran Ma carte, en petit, qui suit les étapes */}
      <div style={{ opacity: ts(t, A('c02') - 0.3, A('c02') + 0.3) * (1 - ts(t, A('c06') - 0.4, A('c06'))) }}>
        <IPhone x={900} y={1480} s={0.62} rx={4} ry={-18} inset>
          <Page name={t < tBack ? `m-carte-${t < tBg ? 'ivory' : 'graphite'}` : 'm-carte-images'} scroll={t < tStrip ? 380 : t < tBack ? 900 : 300} />
        </IPhone>
      </div>
    </AbsoluteFill>
  )
}

export const Creer = ({ voix = true, son = true }) => {
  const t = useT()
  const speaking = f => Q.$list.some(c => f / FPS > c.at - 0.1 && f / FPS < c.at + c.dur + 0.15)
  const dark = t > A('c07') - 0.2
  const cut = A('c08') - 0.25
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <Plan t={t} a={0} b={cut} tin="cut" tout="push" dout={0.8}><Atelier t={t} /></Plan>
      <Plan t={t} a={cut} b={DUREE + 1} tin="push" din={0.8} tout="cut"><Nuit t={t} /><Fin t={t} at={A('c08')} /></Plan>
      {t < cut && <Chrono t={t} dark={dark} />}
      {Q.$list.filter(c => c.id !== 'c08').map(c => (
        <SousTitre key={c.id} t={t} cue={c} y={170} size={70} maxW={920} ink={dark ? '#fff' : '#1d1d1f'} dim={dark ? undefined : 'rgba(0,0,0,0.25)'} shadow={dark}
          accent={{ c01: { 6: C.blueBtn, 7: C.blueBtn }, c06: { 0: '#28a745' } }[c.id] ?? {}} />
      ))}
      <Grain o={0.03} />
      {son && (
        <>
          <Audio src={staticFile('campagne/musique/creer.mp3')} volume={f => {
            const tt = f / FPS
            return Math.min(1, tt / 0.3) * Math.min(1, (DUREE - tt) / 1.2) * volMusique(Q.$list, f / FPS, voix, 0.42)
          }} />
          {voix && Q.$list.filter(c => c.voice).map(c => <Son key={c.id} src={`campagne/voix/${c.id}.mp3`} at={c.at - c.lead} />)}
          <Son src="sons_tt/chrono_tic.mp3" at={A('c01') + 0.4} vol={0.12} dur={W(Q, 'c06', 0) - A('c01') - 0.4} />
          {[W(Q, 'c02', 1), W(Q, 'c02', 5), W(Q, 'c03', 2), W(Q, 'c03', 5), W(Q, 'c03', 8), W(Q, 'c04', 3)].map((x, i) => <Son key={i} src="sons_tt/pop.mp3" at={x} vol={0.28} />)}
          <Son src="sons_tt/swoosh.mp3" at={W(Q, 'c05', 2) - 0.1} vol={0.35} />
          <Son src="sons_tt/chrono_stop.mp3" at={W(Q, 'c06', 0)} vol={0.4} dur={1} />
          <Son src="sons_tt/scintille.mp3" at={W(Q, 'c06', 6)} vol={0.35} />
          <Son src="sons_tt/whoosh7.mp3" at={A('c07') - 0.3} vol={0.4} />
          <Son src="sons_tt/hit_logo.mp3" at={A('c08') - 0.05} vol={0.35} />
        </>
      )}
    </AbsoluteFill>
  )
}

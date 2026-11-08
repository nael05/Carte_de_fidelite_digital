import { AbsoluteFill, Audio, staticFile } from 'remotion'
import { Carte } from '../Carte'
import { C, E, FPS, Fin, Grain, NotifIOS, Nuit, Plan, Son, SousTitre, Studio, clamp, lerp, spring, ts, useT, font, volMusique } from '../kit'
import { cues, W } from '../voix'

/* 09 — Le calcul (TikTok 1080 × 1920). Typographie et chiffres, studio blanc puis noir pour la solution. */
export const Q = cues('calcul')
export const DUREE = Q.$end + 0.4
const A = id => Q[id].at
const fmt = n => Math.round(n).toLocaleString('fr-FR').replace(/ | /g, ' ')

const Tasse = ({ size = 70, color = '#1d1d1f' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round"><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" /><path d="M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3" /></svg>
)

/* Grand nombre qui compte, avec unité */
const Nombre = ({ t, a, b, to, unit = '€', color = '#1d1d1f', size = 260, y = 760, label, labelAt }) => {
  const v = to * ts(t, a, b, 0, 1, E.out)
  const p = spring(t, a - 0.1, 6, 1)
  return (
    <div style={{ position: 'absolute', left: 0, width: 1080, top: y, textAlign: 'center', fontFamily: font, opacity: clamp(p * 1.5), transform: `scale(${0.9 + 0.1 * p})` }}>
      <div style={{ fontSize: size, fontWeight: 800, letterSpacing: '-0.06em', color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{fmt(v)}<span style={{ fontSize: size * 0.55, marginLeft: 16 }}>{unit}</span></div>
      {label && <div style={{ fontSize: 46, fontWeight: 600, color: '#6e6e73', marginTop: 20, opacity: ts(t, labelAt ?? b, (labelAt ?? b) + 0.4) }}>{label}</div>}
    </div>
  )
}

const Blanc = ({ t }) => {
  const a2 = A('n02'), a3 = A('n03'), a4 = A('n04')
  const cup1 = spring(t, W(Q, 'n02', 4), 6, 0.8)
  const grid = k => ts(t, W(Q, 'n02', 8) + k * 0.025, W(Q, 'n02', 8) + k * 0.025 + 0.3)
  const toNum = ts(t, a3 - 0.3, a3 + 0.3, 0, 1, E.io)
  const showNum = t > a3 - 0.2 && t < a4 - 0.1
  const lost = ts(t, W(Q, 'n04', 6) - 0.4, W(Q, 'n04', 13), 0, 1, E.io)
  return (
    <AbsoluteFill>
      <Studio />
      {/* n01 : le point d'interrogation */}
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 560, textAlign: 'center', fontFamily: font, fontSize: 520, fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.06em', opacity: ts(t, 0.1, 0.5) * (1 - ts(t, a2 - 0.4, a2 - 0.1)), transform: `scale(${0.9 + 0.1 * ts(t, 0, 2)})` }}>€<span style={{ color: C.blueBtn }}>?</span></div>
      {/* n02 : un café par semaine, puis 50 */}
      {t > a2 - 0.2 && t < a3 + 0.4 && (
        <div style={{ opacity: 1 - toNum }}>
          <div style={{ position: 'absolute', left: 0, width: 1080, top: 560, display: 'grid', gridTemplateColumns: 'repeat(10, 88px)', gap: 8, justifyContent: 'center' }}>
            {[...Array(50)].map((_, k) => <div key={k} style={{ opacity: k === 0 ? clamp(cup1) : grid(k), transform: `scale(${k === 0 ? 0.6 + 0.4 * clamp(cup1) : 0.6 + 0.4 * grid(k)})`, display: 'grid', placeItems: 'center' }}><Tasse size={80} /></div>)}
          </div>
          <div style={{ position: 'absolute', left: 0, width: 1080, top: 1110, textAlign: 'center', fontFamily: font, fontSize: 64, fontWeight: 750, color: '#1d1d1f', letterSpacing: '-0.03em' }}>
            <span style={{ opacity: ts(t, W(Q, 'n02', 5), W(Q, 'n02', 6)) }}>1 café / semaine</span>
            <span style={{ opacity: ts(t, W(Q, 'n02', 8), W(Q, 'n02', 9)), color: C.blueBtn }}>  × 50</span>
          </div>
        </div>
      )}
      {/* n03 : 150 € */}
      {showNum && <Nombre t={t} a={W(Q, 'n03', 7)} b={W(Q, 'n03', 10)} to={150} label="par an, pour un seul client" labelAt={W(Q, 'n03', 12)} />}
      {showNum && <div style={{ position: 'absolute', left: 0, width: 1080, top: 600, textAlign: 'center', fontFamily: font, fontSize: 56, fontWeight: 650, color: '#6e6e73', opacity: ts(t, a3, a3 + 0.4) }}>3 € × 50 cafés</div>}
      {/* n04 : dix clients partent, 1 500 € */}
      {t > a4 - 0.3 && (
        <>
          <div style={{ position: 'absolute', left: 90, top: 640, width: 900 }}>
            {[...Array(10)].map((_, k) => {
              const go = ts(t, W(Q, 'n04', 6) - 0.4 + k * 0.08, W(Q, 'n04', 13) + k * 0.05, 0, 1, E.io)
              return (
                <div key={k} style={{ position: 'absolute', left: (k % 5) * 110 + go * 360, top: Math.floor(k / 5) * 120, width: 92, height: 92, borderRadius: 46, background: go > 0.5 ? '#c9c9ce' : C.blueBtn, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: font, fontSize: 38, fontWeight: 700, opacity: ts(t, a4 - 0.2 + k * 0.03, a4 + 0.2 + k * 0.03) * (1 - 0.4 * go) }}>
                  {'CLHIEANJTM'[k]}
                </div>
              )
            })}
            <div style={{ position: 'absolute', left: 660, top: -90, padding: '12px 22px', borderRadius: 14, background: '#7a1f1f', color: '#f2e6d0', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: 34, opacity: ts(t, W(Q, 'n04', 9), W(Q, 'n04', 10)), whiteSpace: 'nowrap' }}>Le café d'en face</div>
          </div>
          <Nombre t={t} a={W(Q, 'n04', 6)} b={W(Q, 'n04', 9)} to={1500} color={C.red} size={220} y={1020} label="partis chez le concurrent" labelAt={W(Q, 'n04', 11)} />
        </>
      )}
    </AbsoluteFill>
  )
}

const Noir = ({ t }) => {
  const a = A('n05')
  const card = spring(t, a - 0.2, 4, 1)
  const back = ts(t, W(Q, 'n05', 9), W(Q, 'n05', 11) + 0.4, 0, 1, E.io)
  return (
    <AbsoluteFill>
      <Nuit t={t} />
      <div style={{ position: 'absolute', left: 540 - 190, top: 520 + (1 - card) * 800 }}><Carte width={380} ry={-12 + 10 * ts(t, a, A('n06'))} rx={6} light={0.4} /></div>
      <div style={{ position: 'absolute', left: 540 - 181 * 1.6, top: 1180, transform: 'scale(1.6)', transformOrigin: '0 0', opacity: ts(t, W(Q, 'n05', 6), W(Q, 'n05', 7)) }}><NotifIOS body="Le chocolat chaud est de retour ☕ Votre 2e boisson est offerte." /></div>
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 1400, display: 'flex', justifyContent: 'center', gap: 14 }}>
        {[...Array(10)].map((_, k) => <div key={k} style={{ width: 70, height: 70, borderRadius: 35, background: C.blueBtn, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: font, fontSize: 30, fontWeight: 700, opacity: ts(t, W(Q, 'n05', 9) + k * 0.06, W(Q, 'n05', 9) + k * 0.06 + 0.3), transform: `translateX(${(1 - back) * 300}px)` }}>{'CLHIEANJTM'[k]}</div>)}
      </div>
    </AbsoluteFill>
  )
}

export const Calcul = ({ voix = true, son = true }) => {
  const t = useT()
  const speaking = f => Q.$list.some(c => f / FPS > c.at - 0.1 && f / FPS < c.at + c.dur + 0.15)
  const dark = t > A('n05') - 0.3
  return (
    <AbsoluteFill style={{ background: '#fff' }}>
      <Plan t={t} a={0} b={A('n05') - 0.25} tin="cut" tout="push" dout={0.8}><Blanc t={t} /></Plan>
      <Plan t={t} a={A('n05') - 0.25} b={A('n06') - 0.25} tin="push" din={0.8} tout="push" dout={0.8}><Noir t={t} /></Plan>
      <Plan t={t} a={A('n06') - 0.25} b={DUREE + 1} tin="push" din={0.8} tout="cut"><Nuit t={t} /><Fin t={t} at={A('n06')} /></Plan>
      {Q.$list.filter(c => c.id !== 'n06').map(c => (
        <SousTitre key={c.id} t={t} cue={c} y={170} size={68} maxW={920} ink={dark ? '#fff' : '#1d1d1f'} dim={dark ? undefined : 'rgba(0,0,0,0.25)'} shadow={dark}
          accent={{ n01: { 6: C.red, 7: C.red, 8: C.red }, n03: { 7: C.blueBtn, 8: C.blueBtn, 9: C.blueBtn }, n04: { 4: C.red, 5: C.red, 6: C.red, 7: C.red }, n05: { 9: C.blue, 10: C.blue } }[c.id] ?? {}} />
      ))}
      <Grain o={0.03} />
      {son && (
        <>
          <Audio src={staticFile('sons_tt/musique-keynote.mp3')} startFrom={Math.round(60 * FPS)} volume={f => {
            const tt = f / FPS
            return Math.min(1, tt / 0.3) * Math.min(1, (DUREE - tt) / 1.2) * volMusique(Q.$list, f / FPS, voix, 0.42)
          }} />
          {voix && Q.$list.filter(c => c.voice).map(c => <Son key={c.id} src={`campagne/voix/${c.id}.mp3`} at={c.at - c.lead} />)}
          <Son src="sons_tt/hit_grave.mp3" at={0.1} vol={0.35} />
          <Son src="sons_tt/pop.mp3" at={W(Q, 'n02', 4)} vol={0.3} />
          <Son src="sons_tt/scintille.mp3" at={W(Q, 'n02', 8)} vol={0.3} />
          <Son src="sons_tt/riser_court.mp3" at={W(Q, 'n03', 7) - 0.3} vol={0.25} />
          <Son src="sons_tt/whoosh.mp3" at={W(Q, 'n04', 6) - 0.4} vol={0.35} />
          <Son src="sons_tt/hit.mp3" at={W(Q, 'n04', 9)} vol={0.3} />
          <Son src="sons_tt/whoosh7.mp3" at={A('n05') - 0.35} vol={0.4} />
          <Son src="sons_tt/notif.mp3" at={W(Q, 'n05', 6)} vol={0.45} />
          <Son src="sons_tt/hit_logo.mp3" at={A('n06') - 0.05} vol={0.35} />
        </>
      )}
    </AbsoluteFill>
  )
}

import { AbsoluteFill, Audio, staticFile } from 'remotion'
import { Carte } from '../Carte'
import { C, E, FPS, Fin, Grain, IPhone, Nuit, Plan, Son, SousTitre, WalletApp, clamp, lerp, spring, ts, useT, font } from '../kit'
import { CartePapier } from '../objets'
import { cues, W } from '../voix'

/* 13 — POV : le portefeuille de ton client (TikTok 1080 × 1920).
   Une avalanche de cartes papier de toutes les boutiques, la tienne perdue au milieu ; puis toutes rangées dans le Wallet. */
export const Q = cues('portefeuille')
export const DUREE = Q.$end + 0.4
const A = id => Q[id].at

// [nom, papier, encre, tampon, texte, mot de la réplique w02 qui la désigne, couleur du pass]
const SHOPS = [
  ['Pizzeria Roma', '#fbefe2', '#7a2a1a', 'rgba(190,40,30,0.8)', 'La 10<sup>e</sup> pizza offerte', null, '#7a2a1a'],
  ['Fournil Doré', '#f6e7c9', '#7a4a1e', 'rgba(160,82,45,0.85)', 'La 11<sup>e</sup> baguette offerte', 1, '#dcc39d'],
  ['Fleurs & Co', '#eef6ea', '#2f5a2a', 'rgba(60,130,60,0.8)', 'Le 10<sup>e</sup> bouquet offert', null, '#2f5a2a'],
  ['Studio Élise', '#efe6f7', '#4a3a6a', 'rgba(122,74,176,0.8)', 'La 10<sup>e</sup> coupe offerte', 3, '#1d1d1f'],
  ['Pressing Lavande', '#e7f0f7', '#2a4a6a', 'rgba(42,106,176,0.8)', 'Le 8<sup>e</sup> nettoyage offert', 5, '#c9d8f0'],
  ['Le Comptoir', '#f7efe6', '#5a3a24', 'rgba(120,70,40,0.8)', 'Le 10<sup>e</sup> café offert', 7, '#0b3a8f'],
  ['Barbier Léon', '#ececec', '#222', 'rgba(30,30,30,0.8)', 'La 10<sup>e</sup> taille offerte', null, '#3a3a3c'],
]
const POSE = [[-150, -260, -14], [160, -190, 9], [-120, -60, 5], [140, 40, -7], [-160, 150, 11], [120, 250, -4], [-40, 330, 7]]

export const Portefeuille = ({ voix = true, son = true }) => {
  const t = useT()
  const speaking = f => Q.$list.some(c => f / FPS > c.at - 0.1 && f / FPS < c.at + c.dur + 0.15)
  const a3 = A('w03'), a4 = A('w04')
  const fly = k => ts(t, a3 + 0.2 + k * 0.07, a3 + 1.0 + k * 0.07, 0, 1, E.in)
  const ph = spring(t, a3 + 0.1, 4, 1)
  const mineAt = W(Q, 'w02', 10)
  const mine = ts(t, mineAt - 0.1, mineAt + 0.4)
  const stackIn = k => spring(t, a3 + 0.9 + k * 0.1, 6, 0.9)
  const bankHi = ts(t, W(Q, 'w04', 13), W(Q, 'w04', 14) + 0.3)
  const cut = A('w05') - 0.25
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Plan t={t} a={0} b={cut} tin="cut" tout="push" dout={0.8}>
        <Nuit t={t} warm={0.24} />
        {/* l'avalanche de cartes papier */}
        {SHOPS.map(([nom, paper, ink, stamp, sub, word], k) => {
          const drop = spring(t, -0.22 + k * 0.11, 5, 0.75)
          const [dx, dy, r] = POSE[k]
          const hi = word != null ? ts(t, W(Q, 'w02', word) - 0.1, W(Q, 'w02', word) + 0.25) * (1 - ts(t, W(Q, 'w02', word) + 0.6, W(Q, 'w02', word) + 0.9)) : 0
          const f = fly(k)
          return (
            <div key={nom} style={{ position: 'absolute', left: 540 + dx - 240, top: 1000 + dy - 149 - (1 - drop) * 1600 - f * 300 - hi * 40, zIndex: k + (hi > 0 ? 20 : 0), transform: `rotate(${r * (1 - f)}deg) scale(${(1 + 0.06 * hi) * (1 - 0.6 * f)})`, opacity: 1 - f, filter: `blur(${f * 10}px) brightness(${1 - 0.35 * mine * (1 - hi)})` }}>
              <CartePapier width={480} stamps={(k * 3) % 8 + 1} paper={paper} ink={ink} stamp={stamp} shop={nom} sub={sub} worn={0.6} />
            </div>
          )
        })}
        {/* la tienne, perdue au milieu (cachée sous les autres, puis révélée) */}
        <div style={{ position: 'absolute', left: 540 - 250, top: 1020 - 155 - (1 - spring(t, 0.25, 5, 0.75)) * 1600 - fly(3) * 300, zIndex: mine > 0 ? 30 : 3, transform: `rotate(${3 - 3 * mine}deg) scale(${(1 + 0.08 * mine) * (1 - 0.6 * fly(3))})`, opacity: 1 - fly(3) }}>
          <div style={{ position: 'absolute', inset: -10, borderRadius: 22, border: `5px solid ${C.red}`, boxShadow: `0 0 50px rgba(255,69,58,0.6)`, opacity: mine }} />
          <CartePapier width={500} stamps={7} worn={0.7} />
        </div>
        {/* le téléphone : toutes les cartes rangées */}
        {t > a3 && (
          <IPhone x={540} y={lerp(2900, 1110, ph)} s={1.28} rx={4} ry={-6 + 10 * ts(t, a3, A('w05'))}>
            <WalletApp>
              {/* carte bancaire, juste au-dessus de la carte Fidelyz */}
              <div style={{ position: 'absolute', left: 16, top: 120 + 5 * 50, zIndex: 6, width: 358, height: 226, borderRadius: 18, background: 'linear-gradient(135deg, #2b3a67, #121a33 60%, #3c2a5e)', opacity: stackIn(0), transform: `translateY(${(1 - stackIn(0)) * 200}px)`, boxShadow: `0 0 0 ${4 * bankHi}px ${C.champagne}`, color: '#fff', fontFamily: font, fontSize: 16, fontWeight: 600, padding: '16px 20px', boxSizing: 'border-box' }}>Ma Banque<span style={{ float: 'right', opacity: 0.7, fontSize: 13 }}>DÉBIT</span></div>
              {SHOPS.slice(1, 6).map(([nom, , , , , , col], i) => {
                const p = stackIn(i + 1)
                const light = ['#dcc39d', '#c9d8f0'].includes(col)
                return (
                  <div key={nom} style={{ position: 'absolute', left: 16, top: 120 + i * 50, zIndex: i + 1, width: 358, height: 226, borderRadius: 18, background: col, opacity: p, transform: `translateY(${(1 - p) * 300}px)`, boxShadow: '0 -6px 18px rgba(0,0,0,0.45)', fontFamily: font, color: light ? '#1d1d1f' : '#fff', display: 'flex', justifyContent: 'space-between', padding: '14px 18px', boxSizing: 'border-box', fontSize: 15, fontWeight: 700 }}>
                    <span>{nom}</span><span style={{ fontWeight: 400, opacity: 0.8 }}>{(i * 70 + 90) % 400}</span>
                  </div>
                )
              })}
              <div style={{ position: 'absolute', left: 16, top: 120 + 6 * 50, zIndex: 7, opacity: stackIn(6), transform: `translateY(${(1 - stackIn(6)) * 400}px)` }}><Carte width={358} light={0.5} shadow={0.6} /></div>
            </WalletApp>
          </IPhone>
        )}
      </Plan>
      <Plan t={t} a={cut} b={DUREE + 1} tin="push" din={0.8} tout="cut"><Nuit t={t} /><Fin t={t} at={A('w05')} /></Plan>
      {Q.$list.filter(c => c.id !== 'w05').map(c => (
        <SousTitre key={c.id} t={t} cue={c} y={165} size={68} maxW={940} accent={{ w01: { 0: C.champagne }, w02: { 9: C.red, 10: C.red, 11: C.red, 12: C.red, 13: C.red }, w04: { 0: C.blue, 1: C.blue, 2: C.blue }, w03: { 3: C.blue } }[c.id] ?? {}} />
      ))}
      <Grain o={0.04} />
      {son && (
        <>
          <Audio src={staticFile('sons_tt/musique-chrono.mp3')} startFrom={Math.round(80 * FPS)} volume={f => {
            const tt = f / FPS
            return Math.min(1, tt / 0.3) * Math.min(1, (DUREE - tt) / 1.2) * (voix && speaking(f) ? 0.17 : 0.36)
          }} />
          {voix && Q.$list.filter(c => c.voice).map(c => <Son key={c.id} src={`campagne/voix/${c.id}.mp3`} at={c.at - c.lead} />)}
          {SHOPS.map((_, k) => <Son key={k} src="sons_tt/pop.mp3" at={Math.max(0, -0.12 + k * 0.11)} vol={0.22} />)}
          <Son src="sons_tt/hit_grave.mp3" at={W(Q, 'w02', 10) - 0.1} vol={0.3} />
          <Son src="sons_tt/whoosh.mp3" at={a3 + 0.15} vol={0.45} />
          <Son src="sons_tt/scintille.mp3" at={a3 + 1.0} vol={0.35} />
          <Son src="sons_tt/hit_logo.mp3" at={A('w05') - 0.05} vol={0.35} />
        </>
      )}
    </AbsoluteFill>
  )
}

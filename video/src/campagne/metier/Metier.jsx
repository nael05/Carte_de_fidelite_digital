import { AbsoluteFill, Audio, staticFile } from 'remotion'
import { Brush, ChefHat, Croissant, Flower, Flower2, Gem, Leaf, Scissors, Sparkles, UtensilsCrossed, Wheat } from 'lucide-react'
import { Carte, CarteGoogle } from '../Carte'
import { C, E, FPS, Fin, Grain, IPhone, Nuit, Page, Plan, SH, SW, Son, SousTitre, Tap, Verrouille, WalletApp, clamp, lerp, phonePoint, rectOf, spring, ts, useT, font, volMusique } from '../kit'
import { Android, Boutique, GoogleWalletApp } from '../objets'
import { cues, W } from '../voix'

/* Série « Si t'as un(e) … » : la même histoire, adaptée à chaque métier (carte, bannière, récompense, message).
   Les écrans de l'espace pro sont capturés au nom du commerce (scripts/campagne/capture-metier.cjs). */
export const METIERS = {
  boulangerie: {
    p: 'bo', nom: 'Fournil Doré', mark: 'F', holder: 'LÉA', reward: '10 baguettes = la 11e offerte',
    vars: { '--pass-bg': '#dcc39d', '--ink': '#2b1f12', '--label': '#7a5530', '--edge': '#b8986c', '--mark-bg': '#2b1f12', '--mark-ink': '#f1dcc0' }, gbg: '#c9a46f', gink: '#2b1f12',
    strip: ['#e6b877', '#8a5524'], icons: [Croissant, Wheat], awning: '#8a5524', stripe: '#f1dcc0', sign: '#f1dcc0',
    notif: 'Les croissants sortent du four 🥐 Ils sont encore chauds : venez vite !', time: '7:12', musique: 'sons_tt/musique-keynote.mp3', from: 15,
  },
  coiffure: {
    p: 'cf', nom: 'Studio Élise', mark: 'É', holder: 'INÈS', reward: '10 coupes = la 11e offerte',
    vars: { '--pass-bg': '#1d1d1f', '--ink': '#ffffff', '--label': '#c9a7ff', '--edge': '#0e0e10', '--mark-bg': 'linear-gradient(135deg,#e9d7ff,#9a7bd6)', '--mark-ink': '#1d1d1f' }, gbg: '#1d1d1f', gink: '#fff',
    strip: ['#5e4a8a', '#1b1530'], icons: [Scissors, Sparkles], awning: '#1d1d1f', stripe: '#c9a7ff', sign: '#e9d7ff',
    notif: "Une place s'est libérée demain à 10 h ✂️ Appelez le salon pour la réserver.", time: '18:20', musique: 'sons_tt/musique-noir.mp3', from: 20,
  },
  restaurant: {
    p: 'rs', nom: 'Chez Paolo', mark: 'P', holder: 'HUGO', reward: '10 repas = le 11e offert',
    vars: { '--pass-bg': '#0b3a8f', '--ink': '#ffffff', '--label': '#9fd0ff', '--edge': '#072a66', '--mark-bg': '#ffffff', '--mark-ink': '#0b3a8f' }, gbg: '#0b3a8f', gink: '#fff',
    strip: ['#b23a2a', '#4a120c'], icons: [UtensilsCrossed, ChefHat], awning: '#0b3a8f', stripe: '#f5f5f7', sign: '#f5f5f7',
    notif: 'Ce midi : risotto aux cèpes 🍽️ Votre dessert est offert avec votre carte.', time: '11:02', musique: 'sons_tt/musique-chrono.mp3', from: 60,
  },
  barbier: {
    p: 'bb', nom: 'Barbier Léon', mark: 'B', holder: 'KARIM', reward: '10 coupes = la 11e offerte',
    vars: { '--pass-bg': '#2a2a2d', '--ink': '#ffffff', '--label': '#e0b25a', '--edge': '#151517', '--mark-bg': 'linear-gradient(135deg,#f3d58a,#b8862e)', '--mark-ink': '#1d1d1f' }, gbg: '#2a2a2d', gink: '#fff',
    strip: ['#3a3a3f', '#0f0f11'], icons: [Scissors, Brush], awning: '#1d1d1f', stripe: '#b8302a', sign: '#e0b25a',
    notif: 'Une chaise libre à 15 h 💈 Premier arrivé, premier servi.', time: '13:47', musique: 'sons_tt/musique-chrono.mp3', from: 5,
  },
  fleuriste: {
    p: 'fl', nom: 'Fleurs & Co', mark: 'F', holder: 'CLARA', reward: '10 bouquets = le 11e offert',
    vars: { '--pass-bg': '#eef4ea', '--ink': '#1f3a1c', '--label': '#4f8a3c', '--edge': '#c7d6bf', '--mark-bg': '#1f3a1c', '--mark-ink': '#eef4ea' }, gbg: '#2f5a2a', gink: '#fff',
    strip: ['#e8a3b5', '#6b2a45'], icons: [Flower2, Leaf], awning: '#2f5a2a', stripe: '#f4e7ea', sign: '#f4e7ea',
    notif: 'Demain, c\'est la fête des mères 💐 Pensez à réserver votre bouquet.', time: '17:30', musique: 'sons_tt/musique-keynote.mp3', from: 45,
  },
  institut: {
    p: 'ib', nom: 'Institut Iris', mark: 'I', holder: 'SARAH', reward: '5 soins = le 6e offert',
    vars: { '--pass-bg': '#f5f5f7', '--ink': '#1d1d1f', '--label': '#c2185b', '--edge': '#c7c7cc', '--mark-bg': '#1d1d1f', '--mark-ink': '#fff' }, gbg: '#7a2a4a', gink: '#fff',
    strip: ['#f2c6d4', '#8a3a5c'], icons: [Sparkles, Gem], awning: '#7a2a4a', stripe: '#f8e8ee', sign: '#f8e8ee',
    notif: 'Un créneau s\'est libéré jeudi à 18 h ✨ Soin du visage disponible : appelez-nous.', time: '10:15', musique: 'sons_tt/musique-noir.mp3', from: 100,
  },
}

/* Bannière du pass : dégradé du métier, motif discret et grande icône */
const Banniere = ({ m }) => {
  const [I1, I2] = m.icons
  return (
    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${m.strip[0]}, ${m.strip[1]})`, overflow: 'hidden' }}>
      {[...Array(18)].map((_, i) => {
        const I = i % 2 ? I1 : I2
        return <I key={i} size={22} color="rgba(255,255,255,0.3)" strokeWidth={1.8} style={{ position: 'absolute', left: (i % 6) * 60 + (Math.floor(i / 6) % 2) * 30 - 6, top: Math.floor(i / 6) * 42 + 4, transform: `rotate(${(i * 37) % 50 - 25}deg)` }} />
      })}
      <div style={{ position: 'absolute', right: 34, top: '50%', width: 104, height: 104, marginTop: -52, borderRadius: 52, background: 'rgba(255,255,255,0.16)', display: 'grid', placeItems: 'center', boxShadow: '0 0 40px rgba(255,255,255,0.25)' }}><I1 size={64} color="#fff" strokeWidth={1.7} /></div>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(90% 120% at 20% 0%, rgba(255,255,255,0.18), transparent 60%)' }} />
    </div>
  )
}

/* Couleur sur le nom du métier dans « Si t'as un salon de coiffure, regarde ça. » */
const accent1 = c => {
  const w = c.words.map(x => x.w.toLowerCase())
  const a = Math.max(w.indexOf('un'), w.indexOf('une'), w.indexOf("t'es")) + 1
  const b = w.indexOf('regarde')
  const o = {}
  for (let i = a; i < b; i++) o[i] = C.champagne
  return o
}

export const Metier = ({ voix = true, son = true, metier = 'boulangerie' }) => {
  const m = METIERS[metier]
  const Q = cues(metier)
  const id = n => `${m.p}${String(n).padStart(2, '0')}`
  const A = n => Q[id(n)].at
  const Wd = (n, k) => W(Q, id(n), k)
  const DUREE = Q.$end + 0.4
  const t = useT()
  const card = (props = {}) => <Carte vars={m.vars} name={m.nom} mark={m.mark} holder={m.holder} reward={m.reward} strip={<Banniere m={m} />} {...props} />
  const speaking = f => Q.$list.some(c => f / FPS > c.at - 0.1 && f / FPS < c.at + c.dur + 0.15)
  const cut = n => A(n) - 0.25

  // 1. La façade, la vitrine s'allume
  const f1 = ts(t, 0, A(2), 0, 1, E.soft)
  const lit = ts(t, 0.2, 1.2)
  // 2. Le pass sort de la vitrine et rejoint l'iPhone
  const a2 = A(2)
  const out = ts(t, a2 - 0.1, a2 + 0.9, 0, 1, E.io)
  const phoneIn = ts(t, a2 + 0.7, a2 + 1.6, 0, 1, E.out)
  const ph = { x: lerp(540, 380, ts(t, Wd(2, 7), Wd(2, 7) + 0.9, 0, 1, E.io)), y: lerp(2950, 1110, phoneIn), s: 1.22, ry: 10 * ts(t, Wd(2, 7), Wd(2, 7) + 0.9) }
  const target = phonePoint({ x: 540, y: 1110, s: 1.22 }, SW / 2, 403)
  const passW = lerp(160, 358 * 1.22, out)
  const merged = t > a2 + 1.62
  const an = lerp(1700, 790, ts(t, Wd(2, 7) + 0.1, Wd(2, 7) + 1.0, 0, 1, E.out))
  // 3. Le dos du pass : la récompense
  const a3 = A(3)
  const flip = ts(t, a3, a3 + 0.7, 0, 1, E.io) * (1 - ts(t, Wd(3, 6) - 0.2, Wd(3, 6) + 0.5, 0, 1, E.io))
  // 4. La caisse
  const a4 = A(4)
  const cr = rectOf(`m-${metier}-caisse-search`, 'credit'), ok = rectOf(`m-${metier}-caisse-points20`, 'ok')
  const tCr = a4 + 0.3, tOk = Wd(4, 6), tDone = tOk + 0.25
  const scr = t < tCr + 0.3 ? 'caisse-search' : t < tOk ? 'caisse-points20' : 'caisse-done'
  const pts = 460 + 20 * clamp(spring(t, tDone + 0.1, 5, 1))
  // 5. Le message
  const a5 = A(5), send = rectOf(`m-${metier}-campagnes`, 'send')
  const tSend = Wd(5, 4), tN = tSend + 0.9
  const pan = ts(t, tSend + 0.25, tSend + 1.0, 0, 1, E.io)
  const zN = ts(t, tN + 0.5, tN + 1.5, 0, 1, E.io)
  const scroll = send ? Math.max(0, send.y - 560) : 300

  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Plan t={t} a={0} b={cut(3)} tin="cut" tout="push" dout={0.7}>
        <Nuit t={t} warm={0.26} />
        <div style={{ position: 'absolute', left: 540 - 300, top: 760, transform: `scale(${1 + 0.15 * f1 + 0.6 * out})`, transformOrigin: '50% 60%', opacity: 1 - ts(t, a2 + 0.3, a2 + 0.9) }}>
          <Boutique width={600} name={m.nom} awning={m.awning} stripe={m.stripe} sign={m.sign} lit={lit} />
        </div>
        {t > a2 - 0.1 && !merged && (
          <div style={{ position: 'absolute', left: lerp(540, target.x, out) - passW / 2, top: lerp(1180, target.y, out) - (passW * 1.58) / 2, opacity: ts(t, a2 - 0.1, a2 + 0.2), zIndex: 20 }}>{card({ width: passW, ry: 0, light: 0.4 })}</div>
        )}
        {t > a2 + 0.6 && (
          <IPhone {...ph} rx={4}>
            <WalletApp>{merged && <div style={{ position: 'absolute', left: 16, top: 120 }}>{card({ width: 358, light: 0.5, shadow: 0.5 })}</div>}</WalletApp>
          </IPhone>
        )}
        {t > Wd(2, 7) && (
          <Android x={an} y={1110} s={1.0} ry={-14}>
            <GoogleWalletApp><div style={{ position: 'absolute', left: 16, top: 112 }}><CarteGoogle width={358} name={m.nom} mark={m.mark} bg={m.gbg} ink={m.gink} holder={m.holder[0] + m.holder.slice(1).toLowerCase()} strip={<Banniere m={m} />} /></div></GoogleWalletApp>
          </Android>
        )}
      </Plan>
      <Plan t={t} a={cut(3)} b={cut(4)} tin="push" din={0.7} tout="left" dout={0.7}>
        <Nuit t={t + 3} />
        <div style={{ position: 'absolute', left: 540 - 290, top: 1040 - 458 }}>{card({ width: 580, ry: -14 + 180 * flip + 8 * Math.sin(t * 0.6), rx: 6, light: 0.4 })}</div>
      </Plan>
      <Plan t={t} a={cut(4)} b={cut(5)} tin="left" din={0.7} tout="left" dout={0.7}>
        <Nuit t={t + 6} />
        <IPhone x={430} y={1080} s={1.18} ry={12} rx={3} inset>
          <Page name={`m-${metier}-${scr}`} bars={false} />
          {cr && <Tap t={t} at={tCr} x={cr.x + cr.w / 2} y={cr.y + cr.h / 2} />}
          {ok && <Tap t={t} at={tOk} x={ok.x + ok.w / 2} y={ok.y + ok.h / 2} />}
        </IPhone>
        <div style={{ position: 'absolute', left: 790 - 165, top: 1180 }}>{card({ width: 330, ry: -14, rz: 4, points: pts, light: 0.4 })}</div>
        <div style={{ position: 'absolute', left: 860, top: 1100 - 50 * ts(t, tDone + 0.1, tDone + 1.2), opacity: ts(t, tDone, tDone + 0.2) * (1 - ts(t, tDone + 1.1, tDone + 1.5)), fontFamily: font, fontSize: 64, fontWeight: 750, color: C.blue, zIndex: 11 }}>+20</div>
      </Plan>
      <Plan t={t} a={cut(5)} b={cut(6)} tin="left" din={0.7} tout="push" dout={0.8}>
        <Nuit t={t + 9} />
        <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-pan * 1080}px)` }}>
          <IPhone x={540} y={1090} s={1.24} ry={-8} rx={3} inset>
            <Page name={`m-${metier}-campagnes`} scroll={scroll} />
            {send && <Tap t={t} at={tSend} x={send.x + send.w / 2} y={send.y + send.h / 2 - scroll} />}
          </IPhone>
          <IPhone x={1620} y={lerp(1090, 1000 - (690 - SH / 2) * 2.05, zN)} s={lerp(1.24, 2.05, zN)} ry={8 * (1 - zN)} rx={3 * (1 - zN)} time="">
            <Verrouille t={t} time={m.time} notifs={[{ at: tN, title: m.nom, body: m.notif, mark: m.mark }]} />
          </IPhone>
        </div>
      </Plan>
      <Plan t={t} a={cut(6)} b={DUREE + 1} tin="push" din={0.8} tout="cut"><Nuit t={t} /><Fin t={t} at={A(6)} /></Plan>
      {Q.$list.slice(0, 5).map(c => (
        <SousTitre key={c.id} t={t} cue={c} y={170} size={70} maxW={920} accent={c.id === id(1) ? accent1(c) : {}} />
      ))}
      <Grain o={0.04} />
      {son && (
        <>
          <Audio src={staticFile(`campagne/musique/${metier}.mp3`)} volume={f => {
            const tt = f / FPS
            return Math.min(1, tt / 0.3) * Math.min(1, (DUREE - tt) / 1.2) * volMusique(Q.$list, f / FPS, voix, 0.42)
          }} />
          {voix && Q.$list.filter(c => c.voice).map(c => <Son key={c.id} src={`campagne/voix/${c.id}.mp3`} at={c.at - c.lead} />)}
          <Son src="sons_tt/scintille.mp3" at={0.25} vol={0.3} />
          <Son src="sons_tt/whoosh.mp3" at={a2 - 0.1} vol={0.45} />
          <Son src="sons_tt/swoosh.mp3" at={Wd(2, 7)} vol={0.35} />
          <Son src="sons_tt/swoosh2.mp3" at={a3} vol={0.35} />
          <Son src="sons_tt/clic.mp3" at={tCr} vol={0.45} />
          <Son src="sons_tiktok/bip-caisse.mp3" at={tDone} vol={0.35} />
          <Son src="sons_tt/clic.mp3" at={tSend} vol={0.45} />
          <Son src="sons_tt/whoosh.mp3" at={tSend + 0.2} vol={0.35} />
          <Son src="sons_tt/notif.mp3" at={tN} vol={0.55} />
          <Son src="sons_tt/hit_logo.mp3" at={A(6) - 0.05} vol={0.35} />
        </>
      )}
    </AbsoluteFill>
  )
}

export const dureeMetier = metier => cues(metier).$end + 0.4

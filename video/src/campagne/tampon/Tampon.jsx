import { AbsoluteFill, Audio, staticFile } from 'remotion'
import { Carte } from '../Carte'
import {
  C, E, FPS, Fin, Grain, IPhone, Nuit, Page, Plan, SH, SW, Son, SousTitre, Verrouille, WalletApp,
  clamp, kf, lerp, phonePoint, spring, ts, useT, font, volMusique } from '../kit'
import { Boutique, CartePapier } from '../objets'
import { cues, W } from '../voix'

/* 02 — Le tampon manquant (mise en scène, TikTok 1080 × 1920).
   La carte papier (9 tampons sur 10) est oubliée, le client va en face. On rembobine : l'image repart vraiment
   en arrière jusqu'à la carte tamponnée, qui se retourne en pass Wallet. Cette fois : scan, points, notification. */

export const Q = cues('tampon')
export const DUREE = Q.$end + 0.4
const A = id => Q[id].at
const STAMPS = [0.25, 0.55, 0.8, 1.02, 1.22, 1.4, 1.56, 1.7, 1.83]

// Rembobinage : de r0 à r1, le temps de l'histoire repart de r0 jusqu'à BACK (la carte juste tamponnée)
const r0 = A('m04') - 0.1
const r1 = A('m04') + Q.m04.dur + 0.3
const BACK = 2.6
const storyTime = t => {
  if (t < r0) return t
  if (t > r1) return null
  const k = E.io(clamp((t - r0) / (r1 - r0)))
  return lerp(r0, BACK, k)
}

/* L'histoire « sans Fidelyz » en fonction de son propre temps s */
const Histoire = ({ s, rewind = 0 }) => {
  const forget = ts(s, A('m02') + 0.9, A('m02') + 2.0, 0, 1, E.io) // la carte s'efface
  const toShops = ts(s, A('m03') - 0.3, A('m03') + 0.6, 0, 1, E.io) // la caméra recule vers la rue
  const walk = ts(s, W(Q, 'm03', 8), W(Q, 'm03', 12) + 0.4, 0, 1, E.io)
  const dim = ts(s, W(Q, 'm03', 9), W(Q, 'm03', 12) + 0.4)
  const dolly = ts(s, 0, A('m02') + 2, 0, 1, E.soft)
  const glow = ts(s, W(Q, 'm01', 5), W(Q, 'm01', 7)) * (1 - forget)
  return (
    <AbsoluteFill>
      <Nuit t={s} warm={0.28} cool={0.12} />
      {/* la carte, en gros plan, puis réduite dans un coin pendant la scène de rue */}
      <div style={{ position: 'absolute', left: 540 - 450, top: 1020 - 279, perspective: 2200, transform: `translateY(${-toShops * 700}px) scale(${(1.0 + 0.08 * dolly) * (1 - 0.55 * toShops)})`, opacity: 1 - toShops }}>
        <div style={{ transform: `rotateX(${16 - 8 * dolly}deg) rotateY(${-10 + 14 * dolly}deg) rotateZ(${-4 + 3 * dolly}deg)` }}>
          {/* contour pointillé qui reste quand la carte s'efface */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: 14, border: '4px dashed rgba(245,245,247,0.45)', opacity: forget }} />
          <div style={{ opacity: 1 - forget, filter: forget > 0 ? `blur(${forget * 16}px)` : undefined, transform: `scale(${1 - 0.06 * forget})` }}>
            <CartePapier width={900} stamps={9} t={s} pop={STAMPS} glowLast={glow * (0.7 + 0.3 * Math.sin(s * 5))} />
          </div>
        </div>
      </div>
      {/* poussière de la carte qui s'efface */}
      {forget > 0 && forget < 1 && [...Array(28)].map((_, i) => {
        const a = (i * 137.5) % 360, r = 120 + (i * 53) % 380
        return <div key={i} style={{ position: 'absolute', left: 540 + Math.cos(a) * r * forget - 4, top: 1020 + Math.sin(a) * r * 0.6 * forget - 160 * forget - 4, width: 8, height: 8, borderRadius: 4, background: '#f3ead8', opacity: (1 - forget) * 0.8 }} />
      })}
      {/* la rue : Maison Lumière et le café d'en face */}
      {toShops > 0 && (
        <div style={{ position: 'absolute', inset: 0, opacity: toShops, transform: `scale(${1.15 - 0.15 * toShops})` }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 1360, height: 560, background: 'linear-gradient(180deg, #1a1a1d, #0c0c0e)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: 1480, height: 6, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0 60px, transparent 60px 120px)' }} />
          <div style={{ position: 'absolute', left: 20, top: 820, filter: `brightness(${1 - 0.55 * dim})` }}><Boutique width={490} lit={1 - 0.8 * dim} /></div>
          <div style={{ position: 'absolute', left: 570, top: 820 }}><Boutique width={490} name="Le Café d'en face" awning="#7a1f1f" stripe="#f2e6d0" sign="#f2e6d0" lit={0.4 + 0.6 * dim} /></div>
          {/* le client : un point lumineux qui traverse */}
          <div style={{ position: 'absolute', left: lerp(265, 815, walk) - 22, top: 1440 - Math.sin(Math.PI * walk) * 40 - 22, width: 44, height: 44, borderRadius: 22, background: C.champagne, boxShadow: `0 0 0 10px rgba(227,201,164,0.2), 0 0 40px rgba(227,201,164,0.8)`, opacity: ts(s, A('m03'), A('m03') + 0.4) }} />
          {[...Array(8)].map((_, i) => {
            const k = (i + 1) / 9
            return walk > k && <div key={i} style={{ position: 'absolute', left: lerp(265, 815, k) - 6, top: 1430 - Math.sin(Math.PI * k) * 40 - 6 + (i % 2 ? 10 : -10), width: 12, height: 12, borderRadius: 6, background: 'rgba(227,201,164,0.45)' }} />
          })}
        </div>
      )}
      {/* rembobinage : traits horizontaux discrets et teinte froide */}
      {rewind > 0 && <AbsoluteFill style={{ background: `rgba(30,60,120,${0.18 * rewind})`, mixBlendMode: 'screen' }} />}
    </AbsoluteFill>
  )
}

/* Le pass naît de la carte papier (même geste que dans « Le tour complet ») puis entre dans l'iPhone */
const Fidelyz = ({ t }) => {
  const a = r1 - 0.05
  const flip = ts(t, a, a + 0.42, 0, 1, E.in), unflip = ts(t, a + 0.42, a + 0.95)
  const phoneIn = ts(t, a + 0.9, a + 1.8, 0, 1, E.out)
  const ph = { x: 540, y: lerp(2950, 1100, phoneIn), s: 1.3 }
  const target = phonePoint({ x: 540, y: 1100, s: 1.3 }, SW / 2, 403)
  const k = phoneIn
  const merged = t >= a + 1.82
  // départ du plan suivant : le téléphone recule et part à gauche pour le scan
  return (
    <AbsoluteFill>
      <Nuit t={t} />
      {flip < 1 && (
        <div style={{ position: 'absolute', left: 540 - 450, top: 1020 - 279, perspective: 2200, transform: 'scale(1.08)' }}>
          <div style={{ transform: `rotateX(8deg) rotateY(${4 + 86 * flip}deg) rotateZ(-1deg)` }}><CartePapier width={900} stamps={9} t={10} /></div>
        </div>
      )}
      <div style={{ position: 'absolute', left: 40, top: 520, width: 1000, height: 1000, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(41,151,255,0.35), transparent)', opacity: ts(t, a + 0.3, a + 0.6) * (1 - ts(t, a + 1.2, a + 2)) }} />
      {flip >= 1 && !merged && (
        <div style={{ position: 'absolute', left: lerp(540, target.x, k) - lerp(470, 465.4, k) / 2, top: lerp(1080, target.y, k) - (lerp(470, 465.4, k) * 1.58) / 2, zIndex: 20 }}>
          <Carte width={lerp(470, 465.4, k)} ry={-90 + 90 * unflip} light={0.3} />
        </div>
      )}
      {t >= a + 0.9 && (
        <IPhone {...ph}>
          <WalletApp>{merged && <div style={{ position: 'absolute', left: 16, top: 120 }}><Carte width={358} light={0.5} shadow={0.6} /></div>}</WalletApp>
        </IPhone>
      )}
    </AbsoluteFill>
  )
}

/* Le scan en caisse : le téléphone du commerçant vise le pass, les points montent */
const Scan = ({ t }) => {
  const a = A('m06')
  const tScan = W(Q, 'm06', 1), tOk = W(Q, 'm06', 6), sweep = ts(t, tScan - 0.1, tOk, 0, 1, E.lin)
  const pts = 480 + 20 * clamp(spring(t, tOk + 0.1, 5, 1))
  const ent = spring(t, a - 0.5, 4.5, 1)
  const glow = ts(t, tOk, tOk + 0.3) * (1 - ts(t, tOk + 0.9, tOk + 1.6))
  return (
    <AbsoluteFill>
      <Nuit t={t + 4} />
      {/* téléphone du client, posé, la carte affichée */}
      <IPhone x={360} y={1140} s={1.18} rx={18} ry={14} rz={-6}>
        <WalletApp>
          <div style={{ position: 'absolute', left: 16, top: 120 }}><Carte width={358} points={pts} light={0.5} shadow={0.5} scan={t > tScan && t < tOk + 0.1 ? Math.abs(Math.sin(sweep * Math.PI * 1.5)) : null} /></div>
          <div style={{ position: 'absolute', left: 16, top: 120, width: 358, height: 566, borderRadius: 18, boxShadow: `0 0 0 4px rgba(41,151,255,${glow}), 0 0 60px rgba(41,151,255,${0.6 * glow})` }} />
        </WalletApp>
      </IPhone>
      {/* téléphone du commerçant (écran Caisse du site), qui arrive par la droite */}
      <IPhone x={lerp(1400, 790, ent)} y={900} s={0.92} rx={4} ry={-22} rz={6} inset>
        <Page name={t < tOk ? 'm-caisse' : 'm-caisse-done'} scroll={0} bars={t < tOk} />
      </IPhone>
      <div style={{ position: 'absolute', left: 300, top: 560 - 60 * ts(t, tOk + 0.1, tOk + 1.2), fontFamily: font, fontSize: 80, fontWeight: 750, color: C.blue, opacity: ts(t, tOk, tOk + 0.2) * (1 - ts(t, tOk + 1.2, tOk + 1.6)) }}>+20</div>
    </AbsoluteFill>
  )
}

/* La notification : 500 points, le café est offert */
const Notif = ({ t }) => {
  const a = A('m07')
  const tN = W(Q, 'm07', 8)
  const z = ts(t, tN + 0.4, tN + 1.5, 0, 1, E.io)
  return (
    <AbsoluteFill>
      <Nuit t={t + 8} hue={1.5} />
      <IPhone x={540} y={lerp(1110, 1010 - (690 - SH / 2) * 2.05, z)} s={lerp(1.28, 2.05, z)} rx={6 * (1 - z)} ry={-8 * (1 - z)} time="">
        <Verrouille t={t} time="16:08" notifs={[{ at: tN, body: 'Votre café est offert ☕ Présentez votre carte en caisse : 500 points.' }]} />
      </IPhone>
    </AbsoluteFill>
  )
}

export const Tampon = ({ voix = true, son = true }) => {
  const t = useT()
  const s = storyTime(t)
  const rw = t >= r0 && t <= r1 ? Math.sin(Math.PI * clamp((t - r0) / (r1 - r0))) : 0
  const cut = id => A(id) - 0.25
  const speaking = f => Q.$list.some(c => f / FPS > c.at - 0.1 && f / FPS < c.at + c.dur + 0.15)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {s != null && <AbsoluteFill style={{ filter: rw > 0.02 ? `blur(${rw * 3}px) saturate(${1 - 0.6 * rw})` : undefined }}><Histoire s={s} rewind={rw} /></AbsoluteFill>}
      {/* icône de retour arrière */}
      {rw > 0 && (
        <div style={{ position: 'absolute', left: 0, width: 1080, top: 1500, display: 'flex', justifyContent: 'center', opacity: Math.min(1, rw * 2) }}>
          <div style={{ padding: '18px 34px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', color: '#fff', fontFamily: font, fontSize: 40, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="52" height="34" viewBox="0 0 52 34"><path d="M24 2 2 17l22 15zM50 2 28 17l22 15z" fill="#fff" /></svg>
          </div>
        </div>
      )}
      <Plan t={t} a={r1 - 0.1} b={cut('m06')} tin="cut" tout="left" dout={0.7}><Fidelyz t={t} /></Plan>
      <Plan t={t} a={cut('m06')} b={cut('m07')} tin="left" din={0.7} tout="push" dout={0.7}><Scan t={t} /></Plan>
      <Plan t={t} a={cut('m07')} b={cut('m08')} tin="push" din={0.7} tout="push" dout={0.8}><Notif t={t} /></Plan>
      <Plan t={t} a={cut('m08')} b={DUREE + 1} tin="push" din={0.8} tout="cut"><Nuit t={t} /><Fin t={t} at={A('m08')} sub="Ta carte de fidélité dans le Wallet" /></Plan>
      {Q.$list.filter(c => c.id !== 'm08').map(c => (
        <SousTitre key={c.id} t={t} cue={c} y={170} size={70} maxW={920} accent={{ m01: { 6: C.red, 7: C.red }, m02: { 6: C.red }, m04: { 1: C.blue }, m05: { 5: C.blue, 6: C.blue }, m07: { 8: C.champagne } }[c.id] ?? {}} />
      ))}
      <Grain o={0.05} />
      {son && (
        <>
          <Audio src={staticFile('sons_tt/musique-noir.mp3')} startFrom={Math.round(16.2 * FPS)} volume={f => {
            const tt = f / FPS
            const rwv = tt >= r0 && tt <= r1 ? 0.25 : 1
            return Math.min(1, tt / 0.3) * Math.min(1, (DUREE - tt) / 1.2) * rwv * volMusique(Q.$list, f / FPS, voix, 0.45)
          }} />
          {voix && Q.$list.filter(c => c.voice).map(c => <Son key={c.id} src={`campagne/voix/${c.id}.mp3`} at={c.at - c.lead} />)}
          {STAMPS.map((x, i) => <Son key={i} src="sons_tt/hit_grave.mp3" at={x - 0.02} vol={0.18 + i * 0.02} dur={0.4} />)}
          <Son src="sons_tt/scintille.mp3" at={A('m02') + 0.9} vol={0.35} />
          <Son src="sons_tt/whoosh.mp3" at={A('m03') - 0.4} vol={0.4} />
          <Son src="sons_tt/laser_long.mp3" at={r0} vol={0.35} dur={r1 - r0 + 0.3} />
          <Son src="sons_tt/whoosh.mp3" at={r1 - 0.1} vol={0.45} />
          <Son src="sons_tt/scintille.mp3" at={r1 + 0.4} vol={0.35} />
          <Son src="sons_tt/swoosh2.mp3" at={A('m06') - 0.35} vol={0.4} />
          <Son src="sons_tiktok/bip-caisse.mp3" at={W(Q, 'm06', 6)} vol={0.35} />
          <Son src="sons_tt/notif.mp3" at={W(Q, 'm07', 8)} vol={0.55} />
          <Son src="sons_tt/hit_logo.mp3" at={A('m08') - 0.05} vol={0.35} />
        </>
      )}
    </AbsoluteFill>
  )
}

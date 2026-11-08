import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion'
import { Carte, CarteGoogle, SKIN } from '../Carte'
import {
  C, E, FPS, FeuilleAjout, Fin, Grain, IPhone, Nuit, Page, Plan, SH, SW, Son, SousTitre, Studio, Tap, Verrouille, WalletApp,
  BarreSafari, clamp, kf, lerp, phonePoint, rectOf, spring, ts, useT, font, volMusique } from '../kit'
import { Android, BoutonApple, BoutonGoogle, CartePapier, GoogleWalletApp, VueCamera } from '../objets'
import { cues, W, fin } from '../voix'

/* 01 — Le tour complet (TikTok, 1080 × 1920).
   Carte papier → pass Wallet dans l'iPhone → Apple et Google → création de la carte → inscription en caisse
   → points → notification → retour du client → fin. Toute la timeline suit la voix (src/campagne/textes.json). */

export const Q = cues('tour')
export const DUREE = Q.$end + 0.4

const center = { x: 540 }
const cueAt = id => Q[id].at

/* Voix + musique + bruitages */
export const BandeSon = ({ voix = true }) => {
  const speaking = f => Q.$list.some(c => f / FPS > c.at - 0.1 && f / FPS < c.at + c.dur + 0.15)
  return (
    <>
      <Audio src={staticFile('sons_tt/musique-keynote.mp3')} startFrom={Math.round(1.2 * FPS)} volume={f => {
        const t = f / FPS
        const fade = Math.min(1, t / 0.4) * Math.min(1, (DUREE - t) / 1.2)
        return fade * volMusique(Q.$list, f / FPS, voix, 0.42)
      }} />
      {voix && Q.$list.filter(c => c.voice).map(c => <Son key={c.id} src={`campagne/voix/${c.id}.mp3`} at={c.at - c.lead} vol={1} />)}
      {[...Array(9)].map((_, i) => <Son key={i} src="sons_tt/pop.mp3" at={0.05 + i * 0.13} vol={0.35} />)}
      <Son src="sons_tt/whoosh.mp3" at={cueAt('g02') - 0.15} vol={0.5} />
      <Son src="sons_tt/scintille.mp3" at={cueAt('g02') + 0.5} vol={0.35} />
      <Son src="sons_tt/swoosh.mp3" at={cueAt('g03') - 0.1} vol={0.4} />
      <Son src="sons_tt/whoosh7.mp3" at={cueAt('g04') - 0.3} vol={0.45} />
      {[11, 12].map(n => <Son key={n} src="sons_tt/clic.mp3" at={W(Q, 'g04', n)} vol={0.5} />)}
      <Son src="sons_tt/whoosh7.mp3" at={cueAt('g05') - 0.3} vol={0.45} />
      <Son src="sons_tt/clic.mp3" at={W(Q, 'g05', 8)} vol={0.5} />
      <Son src="sons_tt/clic.mp3" at={W(Q, 'g05', 11) - 0.15} vol={0.5} />
      <Son src="sons_tt/notif_douce.mp3" at={W(Q, 'g05', 11) + 0.1} vol={0.4} />
      <Son src="sons_tt/swoosh2.mp3" at={cueAt('g06') - 0.25} vol={0.4} />
      <Son src="sons_tt/clic.mp3" at={cueAt('g06') + 0.4} vol={0.45} />
      <Son src="sons_tt/clic.mp3" at={W(Q, 'g06', 4) - 0.1} vol={0.45} />
      <Son src="sons_tiktok/bip-caisse.mp3" at={W(Q, 'g06', 5) + 0.05} vol={0.35} />
      <Son src="sons_tt/swoosh2.mp3" at={cueAt('g07') - 0.25} vol={0.4} />
      <Son src="sons_tt/clic.mp3" at={W(Q, 'g07', 6)} vol={0.45} />
      <Son src="sons_tt/whoosh.mp3" at={W(Q, 'g07', 8) - 0.2} vol={0.4} />
      <Son src="sons_tt/notif.mp3" at={W(Q, 'g07', 9)} vol={0.55} />
      <Son src="sons_tt/whoosh7.mp3" at={cueAt('g08') - 0.3} vol={0.4} />
      <Son src="sons_tt/hit_logo.mp3" at={cueAt('g09') - 0.05} vol={0.35} />
    </>
  )
}

/* ── A : carte papier → pass → iPhone → Apple et Google ── */
const PlanA = ({ t }) => {
  const a1 = cueAt('g02'), a2 = cueAt('g03')
  // carte papier : tamponnée, puis elle se retourne (rotation Y jusqu'à 90°)
  const flip = ts(t, a1, a1 + 0.42, 0, 1, E.in)
  const unflip = ts(t, a1 + 0.42, a1 + 0.95, 0, 1, E.out)
  const drift = ts(t, 0, a1, 0, 1, E.soft)
  const forget = ts(t, W(Q, 'g01', 2), W(Q, 'g01', 2) + 1.2, 0, 1, E.io)
  // téléphone
  const ph = kf(t, [
    [a1 + 0.95, { x: 540, y: 2950, s: 1.3, ry: 0 }],
    [a1 + 1.85, { x: 540, y: 1100, s: 1.3, ry: 0 }, E.out],
    [a2, { x: 540, y: 1100, s: 1.3, ry: 0 }],
    [a2 + 1.0, { x: 318, y: 1130, s: 0.96, ry: 16 }, E.io],
    [a2 + 6, { x: 312, y: 1120, s: 0.97, ry: 10 }, E.soft],
  ])
  const an = kf(t, [
    [a2 + 0.1, { x: 1600, ry: -40 }],
    [a2 + 1.1, { x: 768, ry: -16 }, E.out],
    [a2 + 6, { x: 774, ry: -10 }, E.soft],
  ])
  const merged = t >= a1 + 1.86
  // pass flottant (avant d'entrer dans le téléphone) : centre et largeur
  const passTarget = phonePoint({ x: 540, y: 1100, s: 1.3 }, SW / 2, 120 + 283)
  const passK = ts(t, a1 + 0.95, a1 + 1.85, 0, 1, E.out)
  const passX = lerp(540, passTarget.x, passK), passY = lerp(1080, passTarget.y, passK)
  const passW = lerp(470, SW * 0.0 + 358 * ph.s, passK)
  const walletHead = ts(t, a1 + 1.5, a1 + 2.0)
  return (
    <AbsoluteFill>
      <Nuit t={t} a={1} />
      {/* carte papier */}
      {flip < 1 && (
        <div style={{ position: 'absolute', left: 540 - 430, top: 1060 - 267, perspective: 2200, transform: `scale(${1 - 0.12 * forget})`, filter: `saturate(${1 - 0.5 * forget}) brightness(${1 - 0.25 * forget})` }}>
          <div style={{ transform: `rotateX(${12 - 6 * drift}deg) rotateY(${-16 + 10 * drift + 90 * flip}deg) rotateZ(${-3 + 2 * drift}deg)` }}>
            <CartePapier width={860} stamps={9} t={t} pop={[...Array(9)].map((_, i) => 0.05 + i * 0.13)} glowLast={ts(t, 1.3, 1.8) * (0.6 + 0.4 * Math.sin((t - 1.3) * 4))} />
          </div>
        </div>
      )}
      {/* le pass naît du retournement */}
      {flip >= 1 && !merged && (
        <div style={{ position: 'absolute', left: passX - passW / 2, top: passY - (passW * 1.58) / 2, zIndex: 20 }}>
          <Carte width={passW} ry={-90 + 90 * unflip} rx={6 * (1 - passK)} light={0.2 + 0.3 * unflip} />
        </div>
      )}
      {/* lueur de naissance */}
      <div style={{ position: 'absolute', left: 540 - 500, top: 1080 - 500, width: 1000, height: 1000, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(41,151,255,0.35), transparent)', opacity: ts(t, a1 + 0.3, a1 + 0.6) * (1 - ts(t, a1 + 1.2, a1 + 2)) }} />
      {t >= a1 + 0.9 && (
        <IPhone {...ph}>
          <WalletApp>
            <div style={{ position: 'absolute', inset: 0, opacity: walletHead, background: '#000' }} />
            {merged && <div style={{ position: 'absolute', left: 16, top: 120 }}><Carte width={358} light={0.5} shadow={0.6} /></div>}
            {/* cartes rangées dessous (pile du Wallet) */}
            <div style={{ position: 'absolute', left: 16, top: 720, width: 358, opacity: walletHead }}>
              {['#0b3a8f', '#dcc39d', '#f5f5f7'].map((c, i) => <div key={i} style={{ height: 60, marginTop: i ? -6 : 0, borderRadius: 18, background: c, boxShadow: '0 -6px 20px rgba(0,0,0,0.5)' }} />)}
            </div>
          </WalletApp>
        </IPhone>
      )}
      {!merged && flip >= 1 && null}
      {t >= a2 && (
        <Android x={an.x} y={1120} s={0.96} ry={an.ry}>
          <GoogleWalletApp><div style={{ position: 'absolute', left: 16, top: 112 }}><CarteGoogle width={358} /></div></GoogleWalletApp>
        </Android>
      )}
      {t >= a2 + 0.9 && (
        <>
          <div style={{ position: 'absolute', left: 312 - 128, top: 1600, opacity: ts(t, a2 + 0.9, a2 + 1.3), transform: `translateY(${(1 - ts(t, a2 + 0.9, a2 + 1.4)) * 30}px)` }}><BoutonApple h={80} /></div>
          <div style={{ position: 'absolute', left: 774 - 145, top: 1600, opacity: ts(t, a2 + 1.05, a2 + 1.45), transform: `translateY(${(1 - ts(t, a2 + 1.05, a2 + 1.55)) * 30}px)` }}><BoutonGoogle h={80} /></div>
        </>
      )}
    </AbsoluteFill>
  )
}

/* ── B : studio blanc, la carte change de couleur ── */
const SKINS = ['graphite', 'azur', 'champagne', 'ivory', 'graphite']
const NOMS = { graphite: 'Graphite', azur: 'Bleu nuit', champagne: 'Champagne', ivory: 'Ivoire' }
const PlanB = ({ t }) => {
  const a = cueAt('g04'), b = cueAt('g05')
  const changes = [W(Q, 'g04', 11), W(Q, 'g04', 12), W(Q, 'g04', 12) + 0.45, W(Q, 'g04', 12) + 0.9]
  let k = 0
  changes.forEach((c, i) => { if (t >= c) k = i + 1 })
  const prev = SKINS[Math.max(0, k - 1)], cur = SKINS[k]
  const p = k === 0 ? 1 : ts(t, changes[k - 1], changes[k - 1] + 0.38, 0, 1, E.io)
  const ry = -18 + 26 * ts(t, a - 0.3, b + 0.3, 0, 1, E.soft)
  const rx = 8 - 4 * ts(t, a, b, 0, 1, E.soft)
  const logo = spring(t, W(Q, 'g04', 10) - 0.05, 9, 0.6)
  const card = (skin, clip) => (
    <div style={{ position: 'absolute', left: 540 - 290, top: 1010 - 458, clipPath: clip }}>
      <Carte width={580} skin={skin} ry={ry} rx={rx} light={0.3 + 0.2 * Math.sin(t)} shadow={0.55} />
    </div>
  )
  const sel = SKINS.indexOf(cur) % 4
  return (
    <AbsoluteFill>
      <Studio />
      <div style={{ position: 'absolute', left: 540 - 330, top: 1490, width: 660, height: 80, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(0,0,0,0.22), transparent)' }} />
      {card(prev)}
      {k > 0 && p < 1 && card(cur, `inset(0 ${(1 - p) * 100}% 0 0)`)}
      {k > 0 && p >= 1 && card(cur)}
      {/* reflet de balayage pendant le changement */}
      {k > 0 && p < 1 && <div style={{ position: 'absolute', left: 540 - 290 + 580 * p - 40, top: 520, width: 80, height: 940, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)', filter: 'blur(8px)' }} />}
      {/* anneau sur le logo */}
      {t > W(Q, 'g04', 10) - 0.1 && <div style={{ position: 'absolute', left: 540 - 290 + 22, top: 1010 - 458 + 18, width: 70, height: 70, borderRadius: 18, border: `4px solid ${C.blue}`, opacity: clamp(logo) * (1 - ts(t, W(Q, 'g04', 11), W(Q, 'g04', 11) + 0.3)), transform: `scale(${1.5 - 0.5 * clamp(logo)})` }} />}
      {/* nuancier du site */}
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 1560, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 26, opacity: ts(t, a + 0.5, a + 1), fontFamily: font }}>
        {['graphite', 'azur', 'champagne', 'ivory'].map((s, i) => (
          <div key={s} style={{ width: 62, height: 62, borderRadius: 31, background: SKIN[s].bg, boxShadow: `0 0 0 ${i === sel ? 5 : 1.5}px ${i === sel ? C.blueBtn : 'rgba(0,0,0,0.15)'}, 0 0 0 ${i === sel ? 10 : 0}px #fbfbfd` }} />
        ))}
        <span style={{ fontSize: 34, color: '#6e6e73', fontWeight: 500, marginLeft: 10, width: 200 }}>{NOMS[cur]}</span>
      </div>
      {/* chrono 2 min */}
      <div style={{ position: 'absolute', left: 0, width: 1080, top: 480, display: 'flex', justifyContent: 'center', opacity: ts(t, W(Q, 'g04', 6) - 0.1, W(Q, 'g04', 6) + 0.3) }}>
        <div style={{ padding: '10px 26px', borderRadius: 999, background: '#1d1d1f', color: '#fff', fontFamily: font, fontSize: 34, fontWeight: 650, display: 'flex', gap: 12, alignItems: 'center' }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6" strokeLinecap="round" /></svg>
          2 min
        </div>
      </div>
    </AbsoluteFill>
  )
}

/* ── C : inscription du client en caisse ── */
const PlanC = ({ t }) => {
  const a = cueAt('g05')
  const detect = spring(t, W(Q, 'g05', 4), 8, 1)
  const tJoin = W(Q, 'g05', 7) - 0.1, tTapW = W(Q, 'g05', 8), tSheet = tTapW + 0.25, tAdd = W(Q, 'g05', 11) - 0.15, tWallet = tAdd + 0.25
  const ph = { x: 540, y: 1090, s: 1.3, ry: -8 + 12 * ts(t, a - 0.4, tWallet + 1, 0, 1, E.soft), rx: 4 }
  const join = ts(t, tJoin, tJoin + 0.55, 0, 1, E.out)
  const sheetDown = ts(t, tWallet, tWallet + 0.45, 0, 1, E.in)
  return (
    <AbsoluteFill>
      <Nuit t={t + 3} warm={0.2} />
      <IPhone {...ph}>
        <VueCamera t={t} detect={detect} zoom={1 + 0.15 * ts(t, a - 0.4, tJoin)} />
        {t >= tJoin && (
          <div style={{ position: 'absolute', inset: 0, transform: `translateY(${(1 - join) * SH}px)` }}>
            <div style={{ position: 'absolute', left: 0, top: 50, width: SW, height: SH - 50 }}><Page name="m-join-filled" h={844} bars={false} /></div>
            <div style={{ position: 'absolute', left: 0, top: 0, width: SW, height: 50, background: '#000' }} />
            <BarreSafari />
            <Tap t={t} at={tTapW} x={195} y={50 + 715} />
          </div>
        )}
        {t >= tSheet && t < tWallet + 0.5 && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 5, transform: `translateY(${sheetDown * SH}px)` }}>
            <FeuilleAjout t={t} at={tSheet} tapAdd={1 - 0.1 * Math.sin(Math.PI * ts(t, tAdd - 0.1, tAdd + 0.15, 0, 1, E.lin))}>
              <Carte width={300} shadow={0.4} />
            </FeuilleAjout>
            <Tap t={t} at={tAdd} x={350} y={54 + 26} size={0.8} />
          </div>
        )}
        {t >= tWallet && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 4 }}>
            <WalletApp>
              <div style={{ position: 'absolute', left: 16, top: 120 + (1 - spring(t, tWallet + 0.1, 6, 0.85)) * 500, opacity: ts(t, tWallet, tWallet + 0.3) }}><Carte width={358} light={0.5} shadow={0.5} /></div>
            </WalletApp>
          </div>
        )}
        <Tap t={t} at={W(Q, 'g05', 6)} x={195} y={638} />
      </IPhone>
    </AbsoluteFill>
  )
}

/* ── D : en caisse, les points tombent ── */
const PlanD = ({ t }) => {
  const a = cueAt('g06')
  const tCredit = a + 0.35, tSheet = tCredit + 0.3, t20 = W(Q, 'g06', 4) - 0.15, tOk = W(Q, 'g06', 5) - 0.05, tDone = tOk + 0.25
  const ph = { x: 430, y: 1070, s: 1.2, ry: 12, rx: 3 }
  const sheet = ts(t, tSheet, tSheet + 0.45, 0, 1, E.out)
  const pts = 460 + 20 * clamp(spring(t, tDone + 0.1, 5, 1))
  const passIn = spring(t, a + 0.15, 5, 0.9)
  const glow = ts(t, tDone, tDone + 0.3) * (1 - ts(t, tDone + 0.8, tDone + 1.6))
  const r = n => rectOf(n.split('.')[0], n.split('.')[1])
  const cr = r('m-caisse-search.credit'), b20 = r('m-caisse-points.b20'), ok = r('m-caisse-points20.ok')
  const screen = t < tSheet ? 'm-caisse-search' : t < t20 + 0.05 ? 'm-caisse-points' : t < tDone ? 'm-caisse-points20' : 'm-caisse-done'
  return (
    <AbsoluteFill>
      <Nuit t={t + 6} />
      <IPhone {...ph} inset>
        <Page name="m-caisse-search" bars={false} />
        {t >= tSheet && (
          <div style={{ position: 'absolute', inset: 0, opacity: sheet, transform: `translateY(${(1 - sheet) * 160}px)` }}>
            <Page name={screen} bars={false} />
          </div>
        )}
        <Tap t={t} at={tCredit} x={cr.x + cr.w / 2} y={cr.y + cr.h / 2} />
        <Tap t={t} at={t20} x={b20.x + b20.w / 2} y={b20.y + b20.h / 2} />
        <Tap t={t} at={tOk} x={ok.x + ok.w / 2} y={ok.y + ok.h / 2} />
      </IPhone>
      {/* la carte du client, à jour */}
      <div style={{ position: 'absolute', left: 790 - 165 + (1 - passIn) * 500, top: 1180, zIndex: 10 }}>
        <div style={{ position: 'absolute', inset: -40, borderRadius: 60, background: 'radial-gradient(closest-side, rgba(41,151,255,0.55), transparent)', opacity: glow }} />
        <Carte width={330} ry={-14} rz={4} points={pts} light={0.4} />
      </div>
      <div style={{ position: 'absolute', left: 860, top: 1100 - 50 * ts(t, tDone + 0.1, tDone + 1.2), opacity: ts(t, tDone, tDone + 0.2) * (1 - ts(t, tDone + 1.1, tDone + 1.5)), fontFamily: font, fontSize: 64, fontWeight: 750, color: C.blue, zIndex: 11 }}>+20</div>
    </AbsoluteFill>
  )
}

/* ── E : campagne, puis l'écran verrouillé du client ── */
const PlanE = ({ t }) => {
  const a = cueAt('g07')
  const tSend = W(Q, 'g07', 6), tPan = W(Q, 'g07', 8) - 0.25, tNotif = W(Q, 'g07', 9)
  const pan = ts(t, tPan, tPan + 0.8, 0, 1, E.io)
  const zoomN = ts(t, tNotif + 0.5, tNotif + 1.6, 0, 1, E.io)
  const send = rectOf('m-campagnes-filled', 'send')
  const scroll = 330
  return (
    <AbsoluteFill>
      <Nuit t={t + 9} hue={1} />
      <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-pan * 1080}px)` }}>
        <IPhone x={540} y={1090} s={1.26} ry={-10 + 6 * ts(t, a, tPan)} rx={3} inset>
          <Page name="m-campagnes-filled" scroll={scroll} />
          <Tap t={t} at={tSend} x={send.x + send.w / 2} y={send.y + send.h / 2 - scroll} />
          {/* envoi : le bouton se remplit */}
          <div style={{ position: 'absolute', left: send.x, top: send.y - scroll, width: send.w * ts(t, tSend, tSend + 0.4), height: send.h, borderRadius: 21, background: 'rgba(255,255,255,0.25)' }} />
        </IPhone>
        <IPhone x={1620 + zoomN * 0} y={lerp(1090, 1000 - (690 - SH / 2) * 2.05, zoomN)} s={lerp(1.26, 2.05, zoomN)} ry={(10 - 8 * ts(t, tPan, tNotif + 1)) * (1 - zoomN)} rx={3 * (1 - zoomN)} time="">
          <Verrouille t={t} notifs={[
            { at: tNotif - 30, body: '+20 points. Plus que 20 avant votre café.', time: 'hier', dim: true },
            { at: tNotif, body: 'Le chocolat chaud est de retour ☕ Venez le goûter : votre 2e boisson est offerte cette semaine.' },
          ]} />
        </IPhone>
      </div>
      {/* trajectoire de l'envoi */}
      {t > tSend && t < tPan + 0.8 && (
        <div style={{ position: 'absolute', left: 540 + 500 * ts(t, tSend + 0.2, tPan + 0.8, 0, 1, E.in) - pan * 300, top: 1000 - 260 * Math.sin(Math.PI * ts(t, tSend + 0.2, tPan + 0.8, 0, 1, E.lin)), width: 26, height: 26, borderRadius: 13, background: C.blue, boxShadow: `0 0 40px 12px rgba(41,151,255,0.6)`, opacity: 1 - ts(t, tPan + 0.5, tPan + 0.8) }} />
      )}
    </AbsoluteFill>
  )
}

/* ── F : il revient (statistiques) ── */
const PlanF = ({ t }) => {
  const a = cueAt('g08')
  const s = spring(t, a - 0.75, 7, 1)
  const scroll = 250 * ts(t, a, a + 2.5, 0, 1, E.soft)
  return (
    <AbsoluteFill>
      <Nuit t={t + 12} cool={0.32} />
      <IPhone x={540} y={1120 + (1 - s) * 900} s={1.26} rx={10 - 6 * s} ry={-6} inset>
        <Page name="m-stats-activite" scroll={scroll} />
      </IPhone>
    </AbsoluteFill>
  )
}

export const Tour = ({ voix = true, son = true }) => {
  const t = useT()
  const cut = (id, d = 0) => cueAt(id) - 0.25 + d
  const ink = { g04: '#1d1d1f' }
  return (
    <AbsoluteFill style={{ background: '#000', fontFamily: font }}>
      <Plan t={t} a={0} b={cut('g04')} tin="cut" tout="push" dout={0.7}><PlanA t={t} /></Plan>
      <Plan t={t} a={cut('g04')} b={cut('g05')} tin="push" din={0.7} tout="up" dout={0.7}><PlanB t={t} /></Plan>
      <Plan t={t} a={cut('g05')} b={cut('g06')} tin="up" din={0.7} tout="left" dout={0.7}><PlanC t={t} /></Plan>
      <Plan t={t} a={cut('g06')} b={cut('g07')} tin="left" din={0.7} tout="push" dout={0.7}><PlanD t={t} /></Plan>
      <Plan t={t} a={cut('g07')} b={cut('g08')} tin="push" din={0.7} tout="up" dout={0.7}><PlanE t={t} /></Plan>
      <Plan t={t} a={cut('g08')} b={cut('g09')} tin="up" din={0.7} tout="push" dout={0.8}><PlanF t={t} /></Plan>
      <Plan t={t} a={cut('g09')} b={DUREE + 1} tin="push" din={0.8} tout="cut"><Nuit t={t} /><Fin t={t} at={cueAt('g09')} /></Plan>
      {Q.$list.filter(c => c.id !== 'g09').map(c => (
        <SousTitre key={c.id} t={t} cue={c} y={170} size={68} maxW={920} ink={ink[c.id] ?? '#fff'} dim={ink[c.id] ? 'rgba(0,0,0,0.28)' : undefined} shadow={!ink[c.id]}
          accent={{ g01: { 2: C.red }, g02: { 5: C.blue }, g03: { 0: '#fff', 2: '#fff' }, g07: { 8: C.blue }, g08: { 2: C.blue } }[c.id] ?? {}} />
      ))}
      <Grain o={0.04} />
      {son && <BandeSon voix={voix} />}
    </AbsoluteFill>
  )
}

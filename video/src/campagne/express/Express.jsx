import { AbsoluteFill, Audio, staticFile } from 'remotion'
import { Carte, CarteGoogle } from '../Carte'
import {
  BarreSafari, C, E, FPS, FeuilleAjout, Fin, Grain, IPhone, Logo, Nuit, Page, Plan, SH, SW, Son, SousTitre, Studio, Verrouille, WalletApp,
  clamp, lerp, spring, ts, useT, font, volMusique,
} from '../kit'
import { Android, CartePapier, GoogleWalletApp, Presentoir, VueCamera } from '../objets'
import { Accueil } from '../client/Client'
import { cues, W } from '../voix'

/* ═══════════ Moteur « Express » : une vidéo = une liste de plans, chacun calé sur une réplique ═══════════
   Plan : { cue, type, …réglages }. Le plan dure de sa réplique jusqu'à la réplique du plan suivant.
   Transitions vives, léger zoom continu (dans Plan), sous-titres en haut, musique entraînante, sons discrets. */

const io = E.io
const TRANS = ['push', 'left', 'up', 'left', 'push', 'up']

/* Carte « commentaire » (format réponse à un commentaire) */
const Commentaire = ({ t, at, user, text }) => {
  const p = spring(t, at - 0.15, 7, 0.8)
  return (
    <div style={{ position: 'absolute', left: 90, top: 640, width: 900, opacity: clamp(p * 1.5), transform: `translateY(${(1 - p) * 50}px) scale(${0.94 + 0.06 * p}) rotate(${-2 * (1 - p)}deg)` }}>
      <div style={{ background: '#fff', borderRadius: 34, padding: '30px 36px', boxShadow: '0 40px 80px -30px rgba(0,0,0,0.8)', fontFamily: font }}>
        <div style={{ fontSize: 28, color: '#8a8a8e', fontWeight: 600, marginBottom: 16 }}>Réponse au commentaire de {user}</div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: 'linear-gradient(135deg,#ffb36b,#ff5f8a)', flexShrink: 0 }} />
          <div style={{ fontSize: 52, fontWeight: 700, color: '#111', lineHeight: 1.18, letterSpacing: '-0.02em' }}>{text}</div>
        </div>
      </div>
    </div>
  )
}

/* Grand texte central (chiffre, mot-clé) */
const Gros = ({ t, at, text, sub, color = '#fff', size = 220 }) => {
  const p = spring(t, at - 0.1, 7, 0.75)
  return (
    <div style={{ position: 'absolute', left: 0, width: 1080, top: 760, textAlign: 'center', fontFamily: font, opacity: clamp(p * 1.4), transform: `scale(${0.85 + 0.15 * clamp(p)})` }}>
      <div style={{ fontSize: size, fontWeight: 850, letterSpacing: '-0.05em', lineHeight: 1, color }}>{text}</div>
      {sub && <div style={{ fontSize: 50, fontWeight: 650, color: C.muted, marginTop: 26 }}>{sub}</div>}
    </div>
  )
}

/* Liste cochée : chaque ligne apparaît sur un mot de la réplique */
const Liste = ({ t, items, ok = true }) => (
  <div style={{ position: 'absolute', left: 110, top: 640, display: 'flex', flexDirection: 'column', gap: 34 }}>
    {items.map(([txt, at]) => {
      const p = spring(t, at, 7, 0.85)
      return (
        <div key={txt} style={{ display: 'flex', alignItems: 'center', gap: 26, fontFamily: font, fontSize: 52, fontWeight: 700, color: '#fff', opacity: clamp(p * 1.4), transform: `translateX(${(1 - p) * -70}px)` }}>
          <span style={{ width: 84, height: 84, borderRadius: 42, background: ok ? C.green : C.red, display: 'grid', placeItems: 'center', fontSize: 46, flexShrink: 0 }}>{ok ? '✓' : '✕'}</span>{txt}
        </div>
      )
    })}
  </div>
)

/* Jauge de paliers : le curseur avance, les paliers s'allument */
const Jauge = ({ t, a, b, paliers, max }) => {
  const k = ts(t, a, b, 0, 1, io)
  const v = max * k
  return (
    <div style={{ position: 'absolute', left: 170, top: 1150, width: 740, fontFamily: font }}>
      <div style={{ position: 'relative', height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.12)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${k * 100}%`, borderRadius: 11, background: `linear-gradient(90deg, ${C.blue}, #64d2ff)` }} />
        {paliers.map(([pts, label, emoji]) => {
          const on = v >= pts
          const x = (pts / max) * 740
          return (
            <div key={pts} style={{ position: 'absolute', left: x - 50, top: -40, width: 100, textAlign: 'center' }}>
              <div style={{ width: 100, height: 100, borderRadius: 50, background: on ? C.blue : '#1c1c1e', boxShadow: on ? '0 0 40px rgba(41,151,255,0.7)' : 'inset 0 0 0 3px rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center', fontSize: 48, transform: `scale(${on ? 1.08 : 1})` }}>{emoji}</div>
              <div style={{ marginTop: 18, color: on ? '#fff' : C.muted, fontSize: 32, fontWeight: 700, whiteSpace: 'nowrap', marginLeft: -60, marginRight: -60 }}>{pts} pts</div>
              <div style={{ color: on ? C.champagne : 'rgba(255,255,255,0.35)', fontSize: 28, fontWeight: 600, whiteSpace: 'nowrap', marginLeft: -80, marginRight: -80 }}>{label}</div>
            </div>
          )
        })}
      </div>
      <div style={{ position: 'absolute', left: 0, width: 740, top: -330, textAlign: 'center', fontSize: 150, fontWeight: 850, color: '#fff', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>{Math.round(v)}<span style={{ fontSize: 60, color: C.muted }}> pts</span></div>
    </div>
  )
}

/* Contenu de l'écran d'un iPhone selon le réglage `ecran` */
const Ecran = ({ t, s, a }) => {
  switch (s.ecran) {
    case 'page': return <Page name={s.page} scroll={s.scroll ?? 0} />
    case 'wallet': {
      const pts = s.points ? lerp(s.points[0], s.points[1], ts(t, s.ptsAt ?? a + 0.6, (s.ptsAt ?? a + 0.6) + 1.0, 0, 1, io)) : 480
      return <WalletApp><div style={{ position: 'absolute', left: 16, top: 120 + (1 - spring(t, a + 0.1, 6, 0.85)) * (s.slide ? 640 : 0) }}><Carte width={358} light={0.5} shadow={0.5} points={pts} /></div></WalletApp>
    }
    case 'lock': return <Verrouille t={t} time={s.heure ?? '9:41'} notifs={s.notifs ?? []} />
    case 'home': return <Accueil t={t} noStore={s.noStore ? ts(t, a + 0.5, a + 1.2, 0, 1, io) : 0} />
    case 'camera': return <VueCamera t={t} detect={spring(t, a + 0.6, 8, 1)} />
    case 'ajout': return (
      <>
        <div style={{ position: 'absolute', left: 0, top: 50, width: SW, height: SH - 50 }}><Page name="m-join-filled" bars={false} /></div>
        <div style={{ position: 'absolute', left: 0, top: 0, width: SW, height: 50, background: '#000' }} />
        <BarreSafari />
        <div style={{ position: 'absolute', inset: 0, zIndex: 5 }}><FeuilleAjout t={t} at={a + 0.15}><Carte width={300} shadow={0.4} /></FeuilleAjout></div>
      </>
    )
    default: return null
  }
}

/* Un plan */
const Scene = ({ t, s, a, b, Q }) => {
  const k = ts(t, a, b, 0, 1, io)
  const fond = s.blanc ? <Studio /> : <Nuit t={t + a} warm={s.warm ?? 0.16} />
  switch (s.type) {
    case 'commentaire': return <>{fond}<Commentaire t={t} at={a} user={s.user} text={s.text} /></>
    case 'gros': return <>{fond}<Gros t={t} at={s.at ?? a} text={s.text} sub={s.sub} color={s.color} size={s.size} /></>
    case 'liste': return <>{fond}<Liste t={t} items={s.items} ok={s.ok !== false} />
      {s.logo && <div style={{ position: 'absolute', left: 0, width: 1080, top: 1180, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22, opacity: ts(t, s.logo, s.logo + 0.4) }}><Logo size={96} /><span style={{ fontFamily: font, fontSize: 84, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em' }}>Fidelyz</span></div>}
      {s.logo && <div style={{ position: 'absolute', left: 0, width: 1080, top: 1320, textAlign: 'center', fontFamily: font, fontSize: 44, fontWeight: 650, color: C.blue, opacity: ts(t, s.logo + 0.3, s.logo + 0.7) }}>Lien en bio →</div>}
    </>
    case 'jauge': return <>{fond}<Jauge t={t} a={a + 0.2} b={b - 0.2} paliers={s.paliers} max={s.max} /></>
    case 'carte': {
      const pts = s.points ? lerp(s.points[0], s.points[1], ts(t, s.ptsAt ?? a + 0.5, (s.ptsAt ?? a + 0.5) + 1.0, 0, 1, io)) : 480
      return <>{fond}<div style={{ position: 'absolute', left: 540 - 290, top: 1030 - 458 }}><Carte width={580} ry={lerp(-16, 12, k)} rx={6} points={pts} light={0.4} skin={s.skin} /></div></>
    }
    case 'papier': {
      const f = s.efface ? ts(t, s.efface, s.efface + 0.8, 0, 1, io) : 0
      return <>{fond}<div style={{ position: 'absolute', left: 540 - 420, top: 1000 - 260, transform: `perspective(1800px) rotateX(14deg) rotateZ(${-4 + 3 * k}deg)` }}>
        <div style={{ position: 'absolute', inset: 0, border: '4px dashed rgba(255,255,255,0.4)', borderRadius: 14, opacity: f }} />
        <div style={{ opacity: 1 - f, filter: f > 0 ? `blur(${f * 14}px)` : undefined }}><CartePapier width={840} stamps={s.stamps ?? 4} /></div>
      </div></>
    }
    case 'presentoir': return <>{fond}<div style={{ position: 'absolute', left: 540 - 250, top: 600, transform: `perspective(2000px) rotateY(${lerp(-14, 10, k)}deg)` }}><Presentoir width={500} /></div></>
    case 'android': return <>{fond}<Android x={540} y={1100} s={1.2} ry={lerp(-12, 8, k)}><GoogleWalletApp><div style={{ position: 'absolute', left: 16, top: 112 }}><CarteGoogle width={358} /></div></GoogleWalletApp></Android></>
    case 'duo': return <>{fond}
      <IPhone x={320} y={1110} s={0.98} ry={lerp(18, 10, k)} rx={3}><WalletApp><div style={{ position: 'absolute', left: 16, top: 120 }}><Carte width={358} light={0.5} shadow={0.5} /></div></WalletApp></IPhone>
      <Android x={770} y={1110} s={0.98} ry={lerp(-18, -10, k)}><GoogleWalletApp><div style={{ position: 'absolute', left: 16, top: 112 }}><CarteGoogle width={358} /></div></GoogleWalletApp></Android>
    </>
    case 'iphone': {
      const z = s.zoomNotif ? ts(t, s.zoomNotif, s.zoomNotif + 0.9, 0, 1, io) : 0
      const sc = lerp(1.22, 2.0, z)
      const y = lerp(1110, 1000 - (690 - SH / 2) * 2.0, z)
      return <>{fond}<IPhone x={540} y={y} s={sc} ry={lerp(-10, 8, k) * (1 - z)} rx={3 * (1 - z)} inset={s.ecran === 'page'} time={s.ecran === 'lock' ? '' : '9:41'}><Ecran t={t} s={s} a={a} /></IPhone></>
    }
    case 'fin': return <><Nuit t={t} /><Fin t={t} at={a} sub={s.sub ?? "Gratuit jusqu'à 15 clients"} /></>
    default: return fond
  }
}

/* La vidéo : plans + sous-titres + bande-son */
export const Express = ({ voix = true, son = true, video, plans }) => {
  const t = useT()
  const Q = cues(video)
  const D = Q.$end + 0.4
  const deb = plans.map(p => Q[p.cue].at - (p.cue === plans[0].cue ? Q[p.cue].at : 0.15))
  const accent = Object.fromEntries(plans.filter(p => p.accent).map(p => [p.cue, p.accent]))
  const sons = []
  plans.forEach((p, i) => {
    if (i > 0) sons.push(['sons_tt/whoosh.mp3', deb[i] - 0.1])
    if (p.son) sons.push([p.son, typeof p.sonAt === 'function' ? p.sonAt(Q) : Q[p.cue].at + (p.sonAt ?? 0.6)])
  })
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {plans.map((p, i) => {
        const a = i === 0 ? 0 : deb[i], b = i === plans.length - 1 ? D + 1 : deb[i + 1]
        const s = { ...p }
        // réglages exprimés en fonction de la voix : (Q) => instant
        for (const key of ['zoomNotif', 'ptsAt', 'efface', 'at', 'logo']) if (typeof s[key] === 'function') s[key] = s[key](Q)
        if (s.notifs) s.notifs = s.notifs.map(n => ({ ...n, at: typeof n.at === 'function' ? n.at(Q) : n.at }))
        if (s.items) s.items = s.items.map(([txt, at]) => [txt, typeof at === 'function' ? at(Q) : at])
        return (
          <Plan key={i} t={t} a={a} b={b} tin={i === 0 ? 'cut' : TRANS[i % TRANS.length]} tout={i === plans.length - 1 ? 'cut' : TRANS[(i + 1) % TRANS.length]} din={0.4} dout={0.4}>
            <Scene t={t} s={s} a={i === 0 ? 0 : Q[p.cue].at} b={b} Q={Q} />
          </Plan>
        )
      })}
      {Q.$list.filter(c => !(plans[plans.length - 1].type === 'fin' && c.id === plans[plans.length - 1].cue)).map(c => (
        <SousTitre key={c.id} t={t} cue={c} y={165} size={66} maxW={940} accent={accent[c.id] ?? {}} />
      ))}
      <Grain o={0.04} />
      {son && (
        <>
          <Audio src={staticFile(`campagne/musique/${video}.mp3`)} volume={f => {
            const tt = f / FPS
            return Math.min(1, tt / 0.3) * Math.min(1, Math.max(0, (D - tt) / 1.2)) * volMusique(Q.$list, tt, voix)
          }} />
          {voix && Q.$list.filter(c => c.voice).map(c => <Son key={c.id} src={`campagne/voix/${c.id}.mp3`} at={c.at - c.lead} />)}
          {sons.map(([src, at], i) => <Son key={i} src={src} at={at} />)}
          <Son src="sons_tt/hit_logo.mp3" at={Q[plans[plans.length - 1].cue].at - 0.05} />
        </>
      )}
    </AbsoluteFill>
  )
}
export const dureeExpress = video => cues(video).$end + 0.4

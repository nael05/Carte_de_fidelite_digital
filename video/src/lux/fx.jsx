import { AbsoluteFill, Img, staticFile } from 'remotion'
import { displayTokens, fontFamily, getCue } from '../lib'
import { clamp, easeInOut, mix, pr } from '../tt/kit3d'

/* Série « Lumière » : montage. Transitions de cinéma (en DOM, sur les plans 3D), typographie, plan de fin.
   Un plan = { a, b, tr, d, render(t) } : visible de a à b ; la transition `tr` (durée d) commence à b et fait entrer le plan suivant. */

export const ACCENT = '#2997ff'
export const INK = '#f5f5f7'
export const MUTED = 'rgba(245, 245, 247, 0.55)'
export const silk = k => (k >= 1 ? 1 : k <= 0 ? 0 : 1 - Math.pow(1 - k, 4))
export const expo = k => (k <= 0 ? 0 : k >= 1 ? 1 : k < 0.5 ? Math.pow(2, 20 * k - 10) / 2 : (2 - Math.pow(2, -20 * k + 10)) / 2)
export const W = (id, n = 0) => {
  const c = getCue(id)
  return c.at + Math.max(0, c.words[Math.min(n, c.words.length - 1)].t)
}
export const END = id => {
  const c = getCue(id)
  return c.at + c.dur
}

const SILVER = 'linear-gradient(180deg, #ffffff 0%, #f2f2f4 45%, #a1a1a6 100%)'

// ─── Filtres SVG dynamiques (flou de bougé horizontal, liquide) ───
const Filters = ({ id, hblur = 0, vblur = 0, liquid = 0, seed = 1 }) => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <defs>
      <filter id={`hb-${id}`} x="-20%" y="-5%" width="140%" height="110%">
        <feGaussianBlur stdDeviation={`${hblur} ${vblur}`} />
      </filter>
      <filter id={`lq-${id}`} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.006 0.012" numOctaves="2" seed={seed} result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale={liquid} xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  </svg>
)

/* Style d'un plan pendant sa sortie (k : 0 → 1) ou son entrée (k : 1 → 0, sens « in ») selon la transition */
const styleFor = (tr, k, dir, id, extra = {}) => {
  // dir : 'out' (k monte de 0 à 1) ou 'in' (k descend de 1 à 0 : 1 = pas encore entré)
  if (k <= 0.0005) return { style: {}, svg: null }
  switch (tr) {
    case 'whip': {
      const x = (dir === 'out' ? -1 : 1) * k * 1150
      const blur = Math.sin(Math.min(1, k) * Math.PI * 0.5) * 70
      return { style: { transform: `translateX(${x}px)`, filter: `url(#hb-${id}) brightness(${1 + k * 0.6})` }, svg: <Filters id={id} hblur={blur} /> }
    }
    case 'rise': {
      const y = (dir === 'out' ? -1 : 1) * k * 2000
      return { style: { transform: `translateY(${y}px)`, filter: `url(#hb-${id})` }, svg: <Filters id={id} vblur={k * 70} /> }
    }
    case 'zoom': {
      const s = dir === 'out' ? 1 + k * k * 3.2 : 1 + k * 0.35
      return { style: { transform: `scale(${s})`, filter: `blur(${k * 18}px) brightness(${1 + k * 2.6})`, opacity: dir === 'out' ? 1 - k * k * 0.3 : 1 - k * 0.2 } }
    }
    case 'liquid':
      return { style: { filter: `url(#lq-${id}) blur(${k * 6}px)`, opacity: 1 - k, transform: `scale(${1 + (dir === 'out' ? 0.06 : -0.04) * k})` }, svg: <Filters id={id} liquid={k * 260} seed={dir === 'out' ? 3 : 7} /> }
    case 'light':
      return { style: { filter: `brightness(${1 + k * 4}) blur(${k * 10}px)`, opacity: dir === 'out' ? 1 : 1 - k * 0.6 } }
    default:
      return { style: { opacity: 1 - k, filter: `blur(${k * 20}px)`, transform: `scale(${1 + k * 0.05})` } }
  }
}
export const TR_DUR = { whip: 0.55, rise: 0.6, zoom: 0.6, streak: 0.9, iris: 1.0, liquid: 1.0, light: 0.8, fade: 0.8 }

/* Montage : enchaîne les plans et leurs transitions. Le plan entrant est dessous pendant les transitions masquées (streak, iris). */
export const Montage = ({ t, shots }) => (
  <AbsoluteFill style={{ zIndex: 0 }}>
    {shots.map((s, i) => {
      const prev = shots[i - 1]
      const din = prev ? (prev.d ?? TR_DUR[prev.tr] ?? 0.8) : 0
      const dout = s.d ?? TR_DUR[s.tr] ?? 0.8
      const start = prev ? s.a : 0
      const end = s.b + (i < shots.length - 1 ? dout : 0)
      if (t < start - 0.001 || t > end) return null
      const kin = prev ? 1 - pr(t, s.a, s.a + din, easeInOut) : 0
      const kout = i < shots.length - 1 ? pr(t, s.b, s.b + dout, easeInOut) : 0
      const trIn = prev?.tr
      // transitions masquées : le plan entrant se dévoile derrière une lumière
      let clip
      if (prev && kin > 0 && trIn === 'streak') clip = `inset(0 0 ${kin * 100}% 0)`
      if (prev && kin > 0 && trIn === 'iris') clip = `circle(${(1 - kin) * 120}% at ${prev.ix ?? 50}% ${prev.iy ?? 46}%)`
      const io = prev && !['streak', 'iris'].includes(trIn) ? styleFor(trIn, kin, 'in', `in${i}`) : { style: {} }
      const oo = ['streak', 'iris'].includes(s.tr) ? { style: { filter: kout > 0 ? `brightness(${1 + kout * 0.8})` : undefined } } : styleFor(s.tr, kout, 'out', `out${i}`)
      return (
        <AbsoluteFill key={i} style={{ zIndex: ['streak', 'iris'].includes(trIn) ? i + 10 : i, clipPath: clip }}>
          {io.svg}
          {oo.svg}
          <AbsoluteFill style={{ ...io.style }}>
            <AbsoluteFill style={{ ...oo.style }}>{s.render(t)}</AbsoluteFill>
          </AbsoluteFill>
        </AbsoluteFill>
      )
    })}
    {/* lumières des transitions, par-dessus */}
    {shots.map((s, i) => (i < shots.length - 1 ? <TransitionLight key={`l${i}`} t={t} s={s} /> : null))}
  </AbsoluteFill>
)

/* Lumière propre à chaque transition : traînée anamorphique, anneau néon, éclair */
const TransitionLight = ({ t, s }) => {
  const d = s.d ?? TR_DUR[s.tr] ?? 0.8
  const k = (t - s.b) / d
  if (k < -0.2 || k > 1.2) return null
  const e = easeInOut(clamp(k))
  if (s.tr === 'streak') {
    const y = e * 100
    const o = Math.sin(clamp(k) * Math.PI)
    return (
      <AbsoluteFill style={{ zIndex: 200, pointerEvents: 'none', mixBlendMode: 'screen' }}>
        <div style={{ position: 'absolute', left: -100, right: -100, top: `calc(${y}% - 3px)`, height: 6, background: '#fff', boxShadow: `0 0 30px 8px rgba(255,255,255,${0.9 * o}), 0 0 120px 40px rgba(41,151,255,${0.55 * o})`, opacity: o }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: `calc(${y}% - 160px)`, height: 320, background: `radial-gradient(ellipse 60% 50% at 50% 50%, rgba(160,205,255,${0.35 * o}), transparent 70%)` }} />
      </AbsoluteFill>
    )
  }
  if (s.tr === 'iris') {
    const r = e * 120
    const o = Math.sin(clamp(k) * Math.PI)
    return (
      <AbsoluteFill style={{ zIndex: 200, pointerEvents: 'none', mixBlendMode: 'screen' }}>
        <div style={{ position: 'absolute', left: `${s.ix ?? 50}%`, top: `${s.iy ?? 46}%`, width: `${r * 2 * 19.2}px`, height: `${r * 2 * 19.2}px`, transform: 'translate(-50%, -50%)', borderRadius: '50%', border: `${3 + 6 * o}px solid rgba(255,255,255,${o})`, boxShadow: `0 0 40px 10px rgba(41,151,255,${0.8 * o}), inset 0 0 40px 10px rgba(41,151,255,${0.6 * o})` }} />
      </AbsoluteFill>
    )
  }
  if (s.tr === 'whip') {
    const o = Math.sin(clamp(k) * Math.PI)
    return (
      <AbsoluteFill style={{ zIndex: 200, pointerEvents: 'none', mixBlendMode: 'screen', opacity: o }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: '47%', height: 4, background: '#fff', boxShadow: '0 0 40px 12px rgba(160,205,255,0.8), 0 0 200px 60px rgba(41,151,255,0.35)' }} />
      </AbsoluteFill>
    )
  }
  if (s.tr === 'zoom' || s.tr === 'light') {
    const o = Math.pow(Math.sin(clamp(k) * Math.PI), 2)
    return <AbsoluteFill style={{ zIndex: 200, pointerEvents: 'none', background: `radial-gradient(circle at 50% 46%, rgba(255,255,255,${0.95 * o}) 0%, rgba(200,225,255,${0.6 * o}) 30%, rgba(41,151,255,${0.15 * o}) 60%, transparent 80%)` }} />
  }
  return null
}

// ─── Typographie ─────────────────────────────────────────────
/* Légende calée sur la voix : chaque mot monte de derrière un cache, en argent ; mots clés en blanc pur ou bleu */
export const Line = ({ t, id, top = 240, size = 66, accent = [], blue = [], from = 0, to, out, tokens, lead = 0.06, weight = 650, style }) => {
  const cue = getCue(id)
  const toks = tokens ?? displayTokens(cue)
  const last = to ?? toks.length - 1
  // la réplique suivante de la même vidéo (lp03 → lp04) : on s'efface avant qu'elle n'arrive
  const nid = cue.id.replace(/\d+$/, d => String(Number(d) + 1).padStart(d.length, '0'))
  const next = getCue(nid)
  const end = Math.min(out ?? cue.at + cue.dur + 0.3, next ? next.at + Math.max(0, next.words[0]?.t ?? 0) - 0.62 : 1e9)
  const first = cue.at + Math.max(0, cue.words[Math.min(from, cue.words.length - 1)].t) - lead
  if (t < first - 0.05 || t > end + 0.6) return null
  const o = pr(t, end, end + 0.5, easeInOut)
  return (
    <div style={{ position: 'absolute', left: 70, right: 70, top, textAlign: 'center', fontFamily, fontWeight: weight, fontSize: size, lineHeight: 1.12, letterSpacing: '-0.04em', opacity: 1 - o, filter: o > 0.001 ? `blur(${o * 14}px)` : undefined, transform: `translateY(${-o * 24}px) scale(${1 + o * 0.03})`, ...style }}>
      {toks.map((w, i) => {
        if (i < from || i > last) return null
        const at = cue.at + Math.max(0, cue.words[Math.min(i, cue.words.length - 1)].t) - lead
        const p = silk((t - at) / 0.55)
        const isBlue = blue.includes(i)
        const isAcc = accent.includes(i)
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.1em', marginBottom: '-0.1em' }}>
            <span
              style={{
                display: 'inline-block',
                whiteSpace: 'pre',
                transform: `translateY(${(1 - p) * 105}%)`,
                filter: p < 0.999 ? `blur(${(1 - p) * 6}px)` : undefined,
                ...(isBlue ? { color: ACCENT, textShadow: `0 0 ${24 * p}px rgba(41,151,255,0.55)` } : isAcc ? { color: '#fff' } : { backgroundImage: SILVER, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }),
              }}
            >
              {w}
              {i < last ? ' ' : ''}
            </span>
          </span>
        )
      })}
    </div>
  )
}

/* Bandeau produit : ce qu'on vend, dit clairement (apparaît sur la réplique qui présente Fidelyz) */
export const ProductTag = ({ t, at, out, top = 1420 }) => {
  const k = silk((t - at) / 0.8)
  const o = pr(t, out, out + 0.5, easeInOut)
  if (k <= 0 || o >= 1) return null
  const chip = (txt, i) => (
    <div key={txt} style={{ opacity: silk((t - at - 0.25 - i * 0.12) / 0.6), transform: `translateY(${(1 - silk((t - at - 0.25 - i * 0.12) / 0.6)) * 14}px)`, fontSize: 30, fontWeight: 600, color: INK, padding: '12px 24px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(20,20,22,0.6)', backdropFilter: 'blur(8px)' }}>
      {txt}
    </div>
  )
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, fontFamily, opacity: k * (1 - o), filter: o > 0 ? `blur(${o * 10}px)` : undefined }}>
      <div style={{ fontSize: 26, fontWeight: 650, letterSpacing: '0.3em', color: ACCENT, textShadow: '0 0 20px rgba(41,151,255,0.5)' }}>CARTE DE FIDÉLITÉ DIGITALE</div>
      <div style={{ display: 'flex', gap: 14 }}>{['Apple Wallet', 'Google Wallet'].map(chip)}</div>
    </div>
  )
}

/* Petit titre espacé, avec filet lumineux */
export const Kicker = ({ t, at, out, text, top = 175, color = MUTED }) => {
  const k = silk((t - at) / 0.7)
  const o = out == null ? 0 : pr(t, out, out + 0.4, easeInOut)
  if (k <= 0 || o >= 1) return null
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, opacity: k * (1 - o), fontFamily }}>
      <div style={{ fontSize: 25, fontWeight: 650, letterSpacing: '0.34em', color, textTransform: 'uppercase' }}>{text}</div>
      <div style={{ width: 120 * k, height: 2, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
    </div>
  )
}

/* Plan de fin : un néon s'allume au centre, le logo naît dans sa lumière, puis ce que c'est et l'appel à l'action */
export const EndCard = ({ t, at, line = 'Fais revenir tes clients.', cta = 'Lien en bio', dur }) => {
  if (t < at - 0.05) return null
  const u = t - at
  const neon = expo(clamp(u / 0.9))
  const logo = silk((u - 0.35) / 1.0)
  const word = silk((u - 0.6) / 0.9)
  const sub = silk((u - 0.95) / 0.8)
  const chips = silk((u - 1.2) / 0.8)
  const fade = dur ? pr(t, dur - 0.45, dur, easeInOut) : 0
  const flick = u < 0.5 ? (Math.sin(u * 90) > 0.2 ? 1 : 0.35) : 1
  return (
    <AbsoluteFill style={{ background: '#000', opacity: clamp(u / 0.4), fontFamily, alignItems: 'center' }}>
      {/* néon horizontal et son reflet au sol */}
      <div style={{ position: 'absolute', top: 1090, left: `${50 - neon * 38}%`, right: `${50 - neon * 38}%`, height: 5, borderRadius: 3, background: '#fff', opacity: flick * (1 - fade), boxShadow: '0 0 24px 6px rgba(255,255,255,0.9), 0 0 90px 30px rgba(41,151,255,0.55), 0 0 260px 90px rgba(41,151,255,0.18)' }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 28% at 50% 57%, rgba(41,151,255,${0.22 * neon * flick}) 0%, transparent 70%)`, opacity: 1 - fade }} />
      <div style={{ position: 'absolute', top: 470, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 1 - fade }}>
        <Img src={staticFile('logo-fidelyz.png')} style={{ width: 190, height: 190, borderRadius: 44, opacity: logo, transform: `translateY(${(1 - logo) * 40}px) scale(${mix(0.9, 1, logo)})`, filter: `blur(${(1 - logo) * 16}px)`, boxShadow: `0 40px 100px -20px rgba(41,151,255,${0.55 * logo})` }} />
        <div style={{ marginTop: 44, fontSize: 140, fontWeight: 650, letterSpacing: '-0.055em', backgroundImage: SILVER, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', opacity: word, transform: `translateY(${(1 - word) * 26}px)`, filter: `blur(${(1 - word) * 10}px)` }}>Fidelyz</div>
        <div style={{ marginTop: 6, fontSize: 30, fontWeight: 650, letterSpacing: '0.3em', color: ACCENT, opacity: sub, textShadow: '0 0 20px rgba(41,151,255,0.5)' }}>CARTE DE FIDÉLITÉ DIGITALE</div>
      </div>
      <div style={{ position: 'absolute', top: 1150, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, opacity: chips * (1 - fade), transform: `translateY(${(1 - chips) * 20}px)` }}>
        <div style={{ fontSize: 50, fontWeight: 550, letterSpacing: '-0.03em', color: INK }}>{line}</div>
        <div style={{ display: 'flex', gap: 14 }}>
          {['Apple Wallet', 'Google Wallet'].map(x => (
            <div key={x} style={{ fontSize: 28, fontWeight: 600, color: MUTED, padding: '10px 22px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.18)' }}>{x}</div>
          ))}
        </div>
        {cta && <div style={{ fontSize: 40, fontWeight: 650, color: '#fff', padding: '20px 54px', borderRadius: 999, background: ACCENT, boxShadow: '0 20px 60px -10px rgba(41,151,255,0.6)', transform: `scale(${1 + Math.sin(u * 4) * 0.012})` }}>{cta}</div>}
      </div>
    </AbsoluteFill>
  )
}

/* Finition : voile en haut (légendes lisibles), vignette, grain */
export const Finish = ({ t, scrim = 1 }) => {
  const seed = Math.floor(t * 30) % 6
  return (
    <>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,${0.7 * scrim}) 0%, rgba(0,0,0,${0.35 * scrim}) 18%, transparent 30%)`, pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 85% 75% at 50% 48%, transparent 55%, rgba(0,0,0,0.6) 100%)', pointerEvents: 'none' }} />
      <AbsoluteFill style={{ opacity: 0.06, mixBlendMode: 'overlay' }}>
        <svg width="100%" height="100%">
          <filter id={`gr${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#gr${seed})`} />
        </svg>
      </AbsoluteFill>
    </>
  )
}

import '@fontsource/cinzel/600.css'
import '@fontsource/cinzel/700.css'
import { ThreeCanvas } from '@remotion/three'
import { AbsoluteFill, Audio, staticFile, useVideoConfig } from 'remotion'
import { Grain, displayTokens, fontFamily, getCue, useT } from '../../lib'
import { clamp, easeOut, mix, pr, usePreloadTextures } from '../kit3d'
import { Scene3D } from './Scene3D'
import { DUREE_BA, HITS, SH } from './temps'

/* « La retraite » — TikTok n° 1, bande-annonce de film (40 s, 1080 × 1920).
   La carte papier, héroïne tragique : machine à laver, fond de sac, dixième tampon jamais atteint, elle se consume ;
   Fidelyz présente sa remplaçante. Voix François Louis (ElevenLabs), musique de bande-annonce Pixabay recoupée
   pour que ses coups tombent sur les HITS (scripts/mix-tt.mjs bandeannonce). */

const SERIF = '"Cinzel", serif'
const BAR = 150 // bandes noires (format cinéma)

// Sous-titres de film : mots qui sortent d'un flou, espacement qui se resserre
const Sub = ({ t, id, out, top = 1270, size = 66 }) => {
  const cue = getCue(id)
  const toks = displayTokens(cue)
  const end = out ?? cue.at + cue.dur + 0.35
  if (t < cue.at - 0.1 || t > end + 0.4) return null
  const o = pr(t, end, end + 0.35, k => k)
  return (
    <div style={{ position: 'absolute', left: 120, right: 120, top, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: size, lineHeight: 1.18, color: '#f4efe6', textTransform: 'uppercase', opacity: 1 - o, filter: o > 0 ? `blur(${o * 8}px)` : undefined, textShadow: '0 4px 30px rgba(0,0,0,0.9)' }}>
      {toks.map((w, i) => {
        const at = cue.at + Math.max(0, cue.words[i].t) - 0.05
        const p = pr(t, at, at + 0.45)
        return (
          <span key={i} style={{ display: 'inline-block', whiteSpace: 'pre', opacity: p, filter: `blur(${(1 - p) * 10}px)`, letterSpacing: `${mix(0.35, 0.04, p)}em`, transform: `translateY(${(1 - p) * 14}px)` }}>
            {w}{i < toks.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </div>
  )
}

// Carton de titre centré, lettres très espacées, balayage de lumière
const Card = ({ t, a, b, children, size = 52, top = 900, spacing = 0.42 }) => {
  if (t < a || t > b + 0.5) return null
  const i = pr(t, a, a + 0.9)
  const o = pr(t, b, b + 0.45, k => k)
  const sweep = mix(-30, 130, pr(t, a + 0.2, a + 1.6, k => k))
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, textAlign: 'center', fontFamily: SERIF, fontWeight: 600, fontSize: size, letterSpacing: `${mix(spacing + 0.25, spacing, i)}em`, paddingLeft: `${spacing}em`, opacity: i * (1 - o), filter: `blur(${(1 - i) * 6 + o * 6}px)`, color: 'transparent', backgroundImage: `linear-gradient(100deg, #b9a98f 0%, #b9a98f ${sweep - 20}%, #fffaf0 ${sweep}%, #b9a98f ${sweep + 20}%, #b9a98f 100%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>
      {children}
    </div>
  )
}

// Reflet anamorphique horizontal (bleu), sur les coups
const Flare = ({ t, at, y = 860, strength = 1 }) => {
  const a = t - at
  if (a < 0 || a > 1.2) return null
  const k = Math.exp(-a * 3.2) * strength
  return (
    <>
      <div style={{ position: 'absolute', left: -200, right: -200, top: y - 3, height: 6, background: 'linear-gradient(90deg, transparent, rgba(120,190,255,0.9) 35%, #fff 50%, rgba(120,190,255,0.9) 65%, transparent)', opacity: k, filter: 'blur(2px)', mixBlendMode: 'screen' }} />
      <div style={{ position: 'absolute', left: -200, right: -200, top: y - 40, height: 80, background: 'radial-gradient(50% 50% at 50% 50%, rgba(80,160,255,0.55), transparent)', opacity: k, mixBlendMode: 'screen' }} />
    </>
  )
}

// Générique de fin (« billing block »)
const Billing = ({ t }) => {
  const k = pr(t, HITS[5] + 0.3, HITS[5] + 1.3)
  return (
    <div style={{ position: 'absolute', left: 90, right: 90, top: 1420, textAlign: 'center', fontFamily: SERIF, color: 'rgba(230,224,214,0.7)', fontSize: 21, lineHeight: 1.6, letterSpacing: '0.16em', opacity: k }}>
      <div style={{ transform: 'scaleY(1.35)' }}>
        UNE PRODUCTION FIDELYZ · AVEC APPLE WALLET ET GOOGLE WALLET · AUCUNE APPLICATION À TÉLÉCHARGER · NOTIFICATIONS ILLIMITÉES · PRÊTE EN 5 MINUTES · SANS ENGAGEMENT
      </div>
      <div style={{ marginTop: 18, fontFamily, fontWeight: 600, letterSpacing: '0.2em', fontSize: 24, color: 'rgba(240,236,228,0.85)' }}>FIDELYZAPP.FR</div>
    </div>
  )
}

export const BandeAnnonce = ({ son = true }) => {
  const t = useT()
  const ready = usePreloadTextures()
  const { width, height } = useVideoConfig()

  // Transitions appliquées à l'image 3D : fouet (flou + glissement), plongée au noir, pulsation sur les coups
  const whip = (c, dir = 1) => {
    const d = t - c
    if (Math.abs(d) > 0.16) return { x: 0, blur: 0 }
    const k = 1 - Math.abs(d) / 0.16
    return { x: dir * Math.sign(d || 1) * -k * k * 260, blur: k * 26 }
  }
  const w1 = whip(SH.sac, 1)
  const w2 = whip(SH.telephone, -1)
  const w3 = whip(SH.froisse, 1)
  const wx = w1.x + w2.x + w3.x
  const wb = w1.blur + w2.blur + w3.blur
  const dip = Math.max(
    1 - clamp(Math.abs(t - SH.retraite) / 0.3),
    1 - clamp(Math.abs(t - SH.tampon) / 0.12),
    t > SH.silence - 0.4 && t < HITS[4] ? pr(t, SH.silence - 0.4, SH.silence, k => k) : 0
  )
  const kick = HITS.reduce((m, h) => (t >= h ? Math.max(m, Math.exp(-(t - h) * 7)) : m), 0)
  const flash = HITS.reduce((m, h, i) => (t >= h - 0.02 ? Math.max(m, Math.exp(-(t - h) * (i === 0 ? 12 : 11)) * (i === 1 || i === 5 ? 0.5 : 0.85)) : m), 0)

  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translateX(${wx}px) scale(${1 + kick * 0.05})`, filter: wb > 0.5 ? `blur(${wb}px)` : undefined }}>
        {ready && (
          <ThreeCanvas width={width} height={height} camera={{ fov: 35, near: 0.05, far: 60, position: [0, 0, 4] }} gl={{ antialias: true }}>
          <Scene3D t={t} />
        </ThreeCanvas>
        )}
      </AbsoluteFill>

      {/* étalonnage : ombres bleu-vert, hautes lumières orangées */}
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,90,110,0.35), rgba(0,0,0,0) 45%, rgba(255,140,40,0.18))', mixBlendMode: 'soft-light', pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: '#000', opacity: dip }} />
      <AbsoluteFill style={{ background: '#fff', opacity: flash, mixBlendMode: 'screen' }} />
      {HITS.slice(1).map((h, i) => <Flare key={i} t={t} at={h} y={[880, 820, 900, 860, 900][i]} strength={i === 0 ? 0.6 : 1} />)}

      {/* accroche */}
      <Card t={t} a={0.25} b={3.1} size={26} top={BAR + 70} spacing={0.5}>D’APRÈS UNE HISTOIRE VRAIE</Card>

      <Sub t={t} id="a01" />
      <Sub t={t} id="a02" />
      <Sub t={t} id="a03" />
      <Sub t={t} id="a04" />
      <Card t={t} a={17.3} b={18.85} size={44} top={1250}>FIDELYZ PRÉSENTE</Card>
      <Sub t={t} id="a06" size={92} top={1240} />
      <Sub t={t} id="a07" />
      <Sub t={t} id="a08" />
      <Sub t={t} id="a09" />
      <Card t={t} a={30.85} b={32.75} size={58} top={820} spacing={0.3}>
        LA CARTE<br />QUI NE SE PERD<br />JAMAIS
      </Card>
      <Card t={t} a={35.0} b={DUREE_BA} size={40} top={1235} spacing={0.32}>GRATUIT POUR COMMENCER</Card>
      {t >= HITS[5] && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1310, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 64, letterSpacing: '0.2em', paddingLeft: '0.2em', color: '#fffaf0', opacity: easeOut(clamp((t - HITS[5]) / 0.25)), transform: `scale(${mix(1.25, 1, easeOut(clamp((t - HITS[5]) / 0.4)))})`, textShadow: '0 0 30px rgba(120,190,255,0.6)' }}>
          LIEN EN BIO
        </div>
      )}
      {t >= HITS[5] && <Billing t={t} />}

      {/* format cinéma */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: BAR, background: '#000' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: BAR, background: '#000' }} />
      <AbsoluteFill style={{ background: '#000', opacity: pr(t, DUREE_BA - 0.9, DUREE_BA, k => k) }} />
      <Grain />
      {son && <Audio src={staticFile('tt/mix-bandeannonce.wav')} />}
    </AbsoluteFill>
  )
}

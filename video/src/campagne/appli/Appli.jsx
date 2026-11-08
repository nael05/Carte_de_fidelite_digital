import { AbsoluteFill, Audio, staticFile } from 'remotion'
import { Carte, CarteGoogle } from '../Carte'
import { C, E, FPS, Fin, Grain, IPhone, Nuit, Plan, SH, SW, Son, SousTitre, Verrouille, WalletApp, clamp, lerp, spring, ts, useT, font } from '../kit'
import { Android, GoogleWalletApp } from '../objets'
import { Accueil } from '../client/Client'
import { cues, W } from '../voix'

/* 18 — Le mythe de l'appli (TikTok 1080 × 1920). Personne ne télécharge l'appli d'un commerce ; le Wallet est déjà là. */
export const Q = cues('appli')
export const DUREE = Q.$end + 0.4
const A = id => Q[id].at

/* Fiche d'une appli de boutique dans un magasin d'applications (générique) : 0 téléchargement */
const Fiche = ({ t, at }) => {
  const p = spring(t, at, 5, 1)
  const zero = ts(t, W(Q, 'y03', 2), W(Q, 'y03', 4))
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', fontFamily: font, color: '#fff', padding: '70px 22px 0', boxSizing: 'border-box', opacity: clamp(p) }}>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
        <div style={{ width: 110, height: 110, borderRadius: 26, background: 'linear-gradient(135deg,#e6b877,#8a5524)', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: 52 }}>F</div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>Le Fournil</div>
          <div style={{ fontSize: 15, color: C.muted, marginTop: 2 }}>Boulangerie de quartier</div>
          <div style={{ marginTop: 10, display: 'inline-block', padding: '6px 22px', borderRadius: 16, background: '#0a84ff', fontSize: 15, fontWeight: 700 }}>OBTENIR</div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 16, borderTop: '0.5px solid rgba(255,255,255,0.2)', textAlign: 'center' }}>
        {[['AVIS', '—'], ['TÉLÉCHARGEMENTS', '0'], ['ÂGE', '4+']].map(([l, v], i) => (
          <div key={l} style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{l}</div>
            <div style={{ fontSize: i === 1 ? 26 + 30 * zero : 26, fontWeight: 800, color: i === 1 ? (zero > 0.5 ? C.red : '#fff') : '#fff', marginTop: 4 }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 30, height: 380, borderRadius: 18, background: 'linear-gradient(160deg,#2a1d14,#120c08)' }} />
    </div>
  )
}

export const Appli = ({ voix = true, son = true }) => {
  const t = useT()
  const speaking = f => Q.$list.some(c => f / FPS > c.at - 0.1 && f / FPS < c.at + c.dur + 0.15)
  const cut = id => A(id) - 0.25
  const a2 = A('y02'), a4 = A('y04'), a5 = A('y05')
  const stop = spring(t, W(Q, 'y01', 9), 7, 0.6)
  const count = ts(t, W(Q, 'y02', 9) - 0.1, W(Q, 'y02', 9) + 0.3)
  const glow = ts(t, W(Q, 'y04', 3), W(Q, 'y04', 4))
  const tN = W(Q, 'y05', 16)
  const zN = ts(t, tN + 0.4, tN + 1.4, 0, 1, E.io)
  const z1 = ts(t, W(Q, 'y04', 3) - 0.2, W(Q, 'y04', 3) + 0.7, 0, 1, E.io) * (1 - ts(t, W(Q, 'y04', 11) - 0.3, W(Q, 'y04', 12) + 0.2, 0, 1, E.io))
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Plan t={t} a={0} b={cut('y02')} tin="cut" tout="push">
        <Nuit t={t} />
        <IPhone x={540} y={1110} s={1.28} rx={4} ry={-8 + 6 * ts(t, 0, a2)}>
          <Fiche t={t} at={0} />
        </IPhone>
        <div style={{ position: 'absolute', left: 540 - 170, top: 820, width: 340, height: 340, borderRadius: 170, background: C.red, display: 'grid', placeItems: 'center', fontFamily: font, fontSize: 92, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', boxShadow: '0 30px 80px rgba(255,69,58,0.5)', opacity: clamp(stop), transform: `scale(${clamp(stop) * (1 + 0.08 * (1 - clamp(stop)))}) rotate(-8deg)` }}>STOP</div>
      </Plan>
      <Plan t={t} a={cut('y02')} b={cut('y04')} tin="push" tout="push">
        <Nuit t={t + 3} />
        <IPhone x={540} y={1110} s={1.28} rx={4} ry={8 - 10 * ts(t, a2, a4)}>
          {t < A('y03') - 0.2 ? <Accueil t={t} /> : <Fiche t={t} at={A('y03') - 0.4} />}
        </IPhone>
        {t < A('y03') - 0.2 && (
          <div style={{ position: 'absolute', left: 0, width: 1080, top: 1500, display: 'flex', justifyContent: 'center', opacity: ts(t, a2 + 0.3, a2 + 0.7) }}>
            <div style={{ padding: '16px 34px', borderRadius: 999, background: 'rgba(28,28,30,0.9)', border: '1.5px solid rgba(255,255,255,0.14)', fontFamily: font, fontSize: 44, fontWeight: 700, color: '#fff' }}>
              Applis de commerçants : <span style={{ color: C.red, display: 'inline-block', transform: `scale(${1 + 0.3 * Math.sin(Math.PI * count)})` }}>{count > 0 ? '0' : '…'}</span>
            </div>
          </div>
        )}
      </Plan>
      <Plan t={t} a={cut('y04')} b={cut('y06')} tin="push" tout="push" dout={0.8}>
        <Nuit t={t + 6} />
        <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-ts(t, W(Q, 'y04', 12) - 0.2, W(Q, 'y04', 12) + 0.6, 0, 1, E.io) * 260 * (1 - ts(t, a5 - 0.3, a5 + 0.4, 0, 1, E.io))}px)` }}>
          <IPhone x={lerp(540, 540 - (68 - SW / 2) * 2.2, z1)} y={z1 > 0 ? lerp(1110, 1000 - (425 - SH / 2) * 2.2, z1) : lerp(1110, 1010 - (690 - SH / 2) * 2.0, zN)} s={z1 > 0 ? lerp(1.28, 2.2, z1) : lerp(1.28, 2.0, zN)} rx={4 * (1 - zN) * (1 - z1)} ry={-6 * (1 - zN) * (1 - z1)} time={t > tN - 1 ? '' : '9:41'}>
            {t < a5 - 0.1 ? <Accueil t={t} glow={glow} /> : t < tN - 1 ? (
              <WalletApp><div style={{ position: 'absolute', left: 16, top: 120 + (1 - spring(t, a5, 6, 0.85)) * 600 }}><Carte width={358} light={0.5} shadow={0.6} /></div></WalletApp>
            ) : <Verrouille t={t} time="7:12" notifs={[{ at: tN, body: 'Les croissants sortent du four 🥐 Ils sont encore chauds : venez vite !' }]} />}
          </IPhone>
          {t > W(Q, 'y04', 12) - 0.3 && t < a5 + 0.4 && (
            <Android x={1060} y={1180} s={0.95} ry={-16} o={ts(t, W(Q, 'y04', 12) - 0.2, W(Q, 'y04', 12) + 0.3) * (1 - ts(t, a5 - 0.2, a5 + 0.3))}>
              <GoogleWalletApp><div style={{ position: 'absolute', left: 16, top: 112 }}><CarteGoogle width={358} /></div></GoogleWalletApp>
            </Android>
          )}
        </div>
      </Plan>
      <Plan t={t} a={cut('y06')} b={DUREE + 1} tin="push" din={0.8} tout="cut"><Nuit t={t} /><Fin t={t} at={A('y06')} sub="Ta carte de fidélité, sans application" /></Plan>
      {Q.$list.filter(c => c.id !== 'y06').map(c => (
        <SousTitre key={c.id} t={t} cue={c} y={165} size={66} maxW={940} accent={{ y01: { 9: C.red }, y02: { 9: C.red }, y04: { 3: C.blue }, y05: { 7: C.green, 8: C.green, 9: C.green } }[c.id] ?? {}} />
      ))}
      <Grain o={0.04} />
      {son && (
        <>
          <Audio src={staticFile('sons_tt/musique-chrono.mp3')} startFrom={Math.round(100 * FPS)} volume={f => {
            const tt = f / FPS
            return Math.min(1, tt / 0.3) * Math.min(1, (DUREE - tt) / 1.2) * (voix && speaking(f) ? 0.17 : 0.36)
          }} />
          {voix && Q.$list.filter(c => c.voice).map(c => <Son key={c.id} src={`campagne/voix/${c.id}.mp3`} at={c.at - c.lead} />)}
          <Son src="sons_tt/hit.mp3" at={W(Q, 'y01', 9)} vol={0.35} />
          <Son src="sons_tt/whoosh7.mp3" at={a2 - 0.35} vol={0.35} />
          <Son src="sons_tt/pop.mp3" at={W(Q, 'y02', 9)} vol={0.35} />
          <Son src="sons_tt/scintille.mp3" at={W(Q, 'y04', 3)} vol={0.35} />
          <Son src="sons_tt/swoosh.mp3" at={a5} vol={0.35} />
          <Son src="sons_tt/notif.mp3" at={tN} vol={0.5} />
          <Son src="sons_tt/hit_logo.mp3" at={A('y06') - 0.05} vol={0.35} />
        </>
      )}
    </AbsoluteFill>
  )
}

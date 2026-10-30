import { AbsoluteFill, Composition, Freeze } from 'remotion'
import { Promo } from './Promo'
import { Tiktok } from './tiktok/Tiktok'
import { FPS, fontFamily, sec } from './lib'

/* Planche contact : 20 images de la vidéo sur une seule image, pour vérifier le montage */
const Planche = ({ times = [] }) => (
  <AbsoluteFill style={{ background: '#222', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start' }}>
    {times.map(s => (
      <div key={s} style={{ position: 'relative', width: 384, height: 216, overflow: 'hidden', outline: '1px solid #444' }}>
        <div style={{ width: 1920, height: 1080, transform: 'scale(0.2)', transformOrigin: '0 0' }}>
          <Freeze frame={Math.round(s * FPS)}>
            <Promo son={false} />
          </Freeze>
        </div>
        <div style={{ position: 'absolute', left: 4, top: 2, fontFamily, fontSize: 14, fontWeight: 700, color: '#ff0', textShadow: '0 0 3px #000' }}>{s}</div>
      </div>
    ))}
  </AbsoluteFill>
)

/* Même planche pour la version verticale : 24 vignettes de 216 × 384 */
const PlancheV = ({ times = [] }) => (
  <AbsoluteFill style={{ background: '#222', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start' }}>
    {times.map(s => (
      <div key={s} style={{ position: 'relative', width: 216, height: 384, overflow: 'hidden', outline: '1px solid #444' }}>
        <div style={{ width: 1080, height: 1920, transform: 'scale(0.2)', transformOrigin: '0 0' }}>
          <Freeze frame={Math.round(s * FPS)}>
            <Tiktok son={false} />
          </Freeze>
        </div>
        <div style={{ position: 'absolute', left: 4, top: 2, fontFamily, fontSize: 14, fontWeight: 700, color: '#ff0', textShadow: '0 0 3px #000' }}>{s}</div>
      </div>
    ))}
  </AbsoluteFill>
)

export const Root = () => (
  <>
    <Composition
      id="Fidelyz"
      component={Promo}
      durationInFrames={sec(58)}
      fps={FPS}
      width={1920}
      height={1080}
      defaultProps={{ son: true }}
    />
    <Composition id="Planche" component={Planche} durationInFrames={sec(58)} fps={FPS} width={1920} height={864} defaultProps={{ times: [] }} />
    <Composition id="Tiktok" component={Tiktok} durationInFrames={sec(34)} fps={FPS} width={1080} height={1920} defaultProps={{ son: true }} />
    <Composition id="PlancheV" component={PlancheV} durationInFrames={sec(34)} fps={FPS} width={1728} height={1152} defaultProps={{ times: [] }} />
  </>
)

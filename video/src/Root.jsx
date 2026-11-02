import { AbsoluteFill, Composition, Freeze } from 'remotion'
import { Promo } from './Promo'
import { Tiktok } from './tiktok/Tiktok'
import { DUREE, Explication } from './explication/Explication'
import { Tex, texMetadata } from './tt/Textures'
import { BandeAnnonce } from './tt/bandeannonce/BandeAnnonce'
import { DUREE_BA } from './tt/bandeannonce/temps'
import { Keynote } from './tt/keynote/Keynote'
import { DUREE_KN } from './tt/keynote/temps'
import { Concurrent } from './tt/concurrent/Concurrent'
import { DUREE_CC } from './tt/concurrent/temps'
import { Formes } from './tt/formes/Formes'
import { DUREE_LAQUE, Laque } from './tt/formes/Laque'
import { Noir } from './tt/noir/Noir'
import { DUREE_NOIR } from './tt/noir/temps'
import { Chrono } from './tt/chrono/Chrono'
import { DUREE_CHRONO } from './tt/chrono/temps'
import { FPS, fontFamily, sec } from './lib'
import { SERIE } from './serie/Serie'
import { LuxTest } from './lux/Test'
import { LUMIERE } from './lux/Lumiere'

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

/* Même planche pour les versions verticales : 24 vignettes de 216 × 384 */
const PlancheV = ({ times = [], video = 'tiktok' }) => (
  <AbsoluteFill style={{ background: '#222', display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start' }}>
    {times.map(s => (
      <div key={s} style={{ position: 'relative', width: 216, height: 384, overflow: 'hidden', outline: '1px solid #444' }}>
        <div style={{ width: 1080, height: 1920, transform: 'scale(0.2)', transformOrigin: '0 0' }}>
          <Freeze frame={Math.round(s * FPS)}>
            {video === 'explication' ? <Explication son={false} /> : <Tiktok son={false} />}
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
    <Composition id="PlancheV" component={PlancheV} durationInFrames={sec(DUREE)} fps={FPS} width={1728} height={1152} defaultProps={{ times: [], video: 'tiktok' }} />
    <Composition id="Explication" component={Explication} durationInFrames={sec(DUREE)} fps={FPS} width={1080} height={1920} defaultProps={{ son: true }} />
    <Composition id="Tex" component={Tex} durationInFrames={1} fps={FPS} width={1000} height={1000} defaultProps={{ kind: "pass" }} calculateMetadata={texMetadata} />
    <Composition id="BandeAnnonce" component={BandeAnnonce} durationInFrames={sec(DUREE_BA)} fps={FPS} width={1080} height={1920} defaultProps={{ son: true }} />
    <Composition id="Keynote" component={Keynote} durationInFrames={sec(DUREE_KN)} fps={FPS} width={1080} height={1920} defaultProps={{ son: true }} />
    <Composition id="Concurrent" component={Concurrent} durationInFrames={sec(DUREE_CC)} fps={FPS} width={1080} height={1920} defaultProps={{ son: true }} />
    <Composition id="Formes" component={Formes} durationInFrames={1} fps={FPS} width={1080} height={1080} defaultProps={{ idee: 1, k: 0 }} />
    <Composition id="Laque" component={Laque} durationInFrames={sec(DUREE_LAQUE)} fps={FPS} width={1080} height={1920} defaultProps={{ variante: 1 }} />
    <Composition id="Noir" component={Noir} durationInFrames={sec(DUREE_NOIR)} fps={FPS} width={1080} height={1920} defaultProps={{ son: true }} />
    <Composition id="LuxTest" component={LuxTest} durationInFrames={300} fps={FPS} width={1080} height={1920} />
    {LUMIERE.map(v => (
      <Composition key={v.id} id={v.id} component={v.component} durationInFrames={sec(v.duree())} fps={FPS} width={1080} height={1920} defaultProps={{ son: true }} />
    ))}
    {SERIE.map(v => (
      <Composition key={v.id} id={v.id} component={v.component} durationInFrames={sec(v.duree())} fps={FPS} width={1080} height={1920} defaultProps={{ son: true }} />
    ))}
    <Composition id="Chrono" component={Chrono} durationInFrames={sec(DUREE_CHRONO)} fps={FPS} width={1080} height={1920} defaultProps={{ son: true }} />
  </>
)

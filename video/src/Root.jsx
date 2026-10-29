import { Composition } from 'remotion'
import { Promo } from './Promo'
import { FPS, sec } from './lib'

export const Root = () => (
  <Composition
    id="Fidelyz"
    component={Promo}
    durationInFrames={sec(90)}
    fps={FPS}
    width={1920}
    height={1080}
    defaultProps={{ son: true }}
  />
)

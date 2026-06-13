import { For, type JSX } from 'solid-js';
import arenaImg from './assets/arena/arena.png';
import sprite1 from './assets/arena/arena-sprite1.png';
import sprite2 from './assets/arena/arena-sprite2.png';
import sprite3 from './assets/arena/arena-sprite3.png';
import sprite4 from './assets/arena/arena-sprite4.png';
import sprite5 from './assets/arena/arena-sprite5.png';
import sprite6 from './assets/arena/arena-sprite6.png';
import sprite7 from './assets/arena/arena-sprite7.png';
import sprite8 from './assets/arena/arena-sprite8.png';

// Animated overlay pieces of the arena art. Each renders on top of the
// background; size/position/animation are tuned per-sprite in CSS
// (.arena-sprite-1 … .arena-sprite-8).
const ARENA_SPRITES = [sprite1, sprite2, sprite3, sprite4, sprite5, sprite6, sprite7, sprite8];

export interface ArenaGeometry {
  width: number;
  height: number;
  floor: { top: number; right: number; bottom: number; left: number };
}

// The arena stage: background art, the floor oval, the moving battle content
// (passed as children), and the animated sprite overlays on top.
// How far to zoom in on the winner at the end of a match.
const WIN_ZOOM = 2.2;

export default function Arena(props: {
  geometry: ArenaGeometry;
  greyscale?: boolean;
  zoom?: { x: number; y: number } | null;
  children?: JSX.Element;
}) {
  return (
    <div
      class="arena"
      style={{
        'background-image': `url(${arenaImg})`,
        '--arena-w': `${props.geometry.width}px`,
        '--arena-h': `${props.geometry.height}px`,
        '--floor-top': `${props.geometry.floor.top}px`,
        '--floor-right': `${props.geometry.floor.right}px`,
        '--floor-bottom': `${props.geometry.floor.bottom}px`,
        '--floor-left': `${props.geometry.floor.left}px`,
        // Zoom in on the winner: scale up about their position in arena coords.
        ...(props.zoom
          ? {
              'transform-origin': `${props.zoom.x}px ${props.zoom.y}px`,
              transform: `scale(${WIN_ZOOM})`,
            }
          : {}),
      }}
    >
      <div class="arena-floor" />
      {props.children}
      <For each={ARENA_SPRITES}>
        {(src, i) => (
          <img class={`arena-sprite arena-sprite-${i() + 1}`} src={src} alt="" draggable={false} />
        )}
      </For>
      {/* Edge fade over the background, floor and sprites (see .arena-vignette).
          Greys out the scenery once the match is decided. */}
      <div class={`arena-vignette${props.greyscale ? ' greyscale' : ''}`} />
    </div>
  );
}

import { createSignal, onCleanup, Show } from 'solid-js';
import type { Battler } from './battlers';
import Streaks from './Streaks';
import BattlerSprite from './BattlerSprite';
import { t, tx } from './i18n';

const PER_BATTLER_MS = 1400;

// Pool of entrance animations and streak tilts, cycled per fighter so each
// intro feels distinct rather than a repeat of the last.
const ENTRANCES = ['intro-left', 'intro-right', 'intro-zoom', 'intro-drop', 'intro-rise', 'intro-spin'];
const STREAK_ANGLES = [14, -20, 24, -10, 18, -26, 8, -16];

// Looping idle animations for the sprite itself, cycled per fighter: a springy
// bounce, a wobble, a couple of x-scale flips, and a 3D matrix swing.
const SPRITE_ANIMS = ['sprite-spring', 'sprite-wobble', 'sprite-flip', 'sprite-tilt3d'];

// Dramatic pre-battle intro: each fighter gets a full-screen card with a block
// colour background and falling speed streaks, shown one after another.
export default function Intro(props: { battlers: Battler[]; onDone: () => void }) {
  const [index, setIndex] = createSignal(0);

  const timer = setInterval(() => {
    if (index() >= props.battlers.length - 1) {
      clearInterval(timer);
      props.onDone();
    } else {
      setIndex((i) => i + 1);
    }
  }, PER_BATTLER_MS);

  onCleanup(() => clearInterval(timer));

  const current = () => props.battlers[index()];

  return (
    <div class="screen intro" style={{ background: current().color }}>
      {/* keyed wrapper so the streaks + enter animation restart on each fighter */}
      <Show when={current()} keyed>
        {(b) => (
          <>
            <Streaks count={50} baseAngle={STREAK_ANGLES[index() % STREAK_ANGLES.length]} />
            <div
              class="intro-card"
              style={{
                animation: `${ENTRANCES[index() % ENTRANCES.length]} 0.55s cubic-bezier(0.2, 1.4, 0.4, 1) both`,
              }}
            >
              <div class={`intro-fighter-anim ${SPRITE_ANIMS[index() % SPRITE_ANIMS.length]}`}>
                <BattlerSprite battler={b} width={240} height={360} class="intro-fighter" />
              </div>
              <div class="intro-name">{tx(b.name)}</div>
              <Show when={b.artist}>
                <div class="intro-by">{t('by')} {tx(b.artist!)}</div>
              </Show>
              <div class="intro-vs">
                {t('fighter')} {index() + 1} / {props.battlers.length}
              </div>
            </div>
          </>
        )}
      </Show>
    </div>
  );
}

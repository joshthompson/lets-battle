import { createSignal, onCleanup, Show } from 'solid-js';
import type { Battler } from './battlers';
import Streaks from './Streaks';
import BattlerSprite from './BattlerSprite';

const PER_BATTLER_MS = 1400;

// Pool of entrance animations and streak tilts, cycled per fighter so each
// intro feels distinct rather than a repeat of the last.
const ENTRANCES = ['intro-left', 'intro-right', 'intro-zoom', 'intro-drop', 'intro-rise', 'intro-spin'];
const STREAK_ANGLES = [14, -20, 24, -10, 18, -26, 8, -16];

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
              <BattlerSprite battler={b} width={240} height={360} class="intro-fighter" />
              <div class="intro-name">{b.name}</div>
              <Show when={b.by}>
                <div class="intro-by">by {b.by}</div>
              </Show>
              <div class="intro-vs">
                Fighter {index() + 1} / {props.battlers.length}
              </div>
            </div>
          </>
        )}
      </Show>
    </div>
  );
}

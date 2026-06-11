import { onCleanup, Show } from 'solid-js';
import type { Battler } from './battlers';
import Streaks from './Streaks';
import BattlerSprite from './BattlerSprite';

// Auto-return to the menu after a celebratory pause.
const RETURN_MS = 6000;

export default function Victory(props: { winner: Battler; onDone: () => void }) {
  const timer = setTimeout(props.onDone, RETURN_MS);
  onCleanup(() => clearTimeout(timer));

  return (
    <div class="screen victory" style={{ background: props.winner.color }}>
      <Streaks count={60} />
      <div class="victory-banner">Winner</div>
      <BattlerSprite battler={props.winner} width={280} height={420} class="victory-fighter" />
      <div class="victory-name">{props.winner.name}</div>
      <Show when={props.winner.by}>
        <div class="victory-by">by {props.winner.by}</div>
      </Show>
      <button class="start-btn" style={{ 'margin-top': '32px' }} onClick={props.onDone}>
        Menu
      </button>
    </div>
  );
}

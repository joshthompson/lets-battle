import { For, onCleanup } from 'solid-js';
import type { Battler } from './battlers';
import Streaks from './Streaks';
import BattlerSprite from './BattlerSprite';
import { t, tx } from './i18n';

// Shown when the last 2+ fighters fall on the same tick. Auto-returns to the
// menu after a pause.
const RETURN_MS = 6000;

export default function Draw(props: { battlers: Battler[]; onDone: () => void }) {
  const timer = setTimeout(props.onDone, RETURN_MS);
  onCleanup(() => clearTimeout(timer));

  return (
    <div class="screen draw">
      <Streaks count={60} />
      <div class="victory-banner">{t('draw')}</div>
      <div class="draw-row">
        <For each={props.battlers}>
          {(b) => (
            <div class="draw-card">
              <BattlerSprite battler={b} width={140} height={210} class="draw-fighter" />
              <div class="draw-name">{tx(b.name)}</div>
            </div>
          )}
        </For>
      </div>
      <button class="start-btn" style={{ 'margin-top': '32px' }} onClick={props.onDone}>
        {t('menu')}
      </button>
    </div>
  );
}

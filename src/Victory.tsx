import { onCleanup, Show } from 'solid-js';
import type { Battler } from './battlers';
import Streaks from './Streaks';
import BattlerSprite from './BattlerSprite';
import { t, tx } from './i18n';

// Auto-return to the menu after a celebratory pause.
const RETURN_MS = 6000;

export default function Victory(props: { winner: Battler; onDone: () => void }) {
  const timer = setTimeout(props.onDone, RETURN_MS);
  onCleanup(() => clearTimeout(timer));

  return (
    <div class="screen victory" style={{ background: props.winner.color }}>
      <Streaks count={60} />
      <div class="victory-banner">{t('winner')}</div>
      <BattlerSprite battler={props.winner} width={280} height={420} class="victory-fighter" />
      <div class="victory-name">{tx(props.winner.name)}</div>
      <Show when={props.winner.artist}>
        <div class="victory-by">{t('by')} {tx(props.winner.artist!)}</div>
      </Show>
      <button class="start-btn" style={{ 'margin-top': '32px' }} onClick={props.onDone}>
        {t('menu')}
      </button>
    </div>
  );
}

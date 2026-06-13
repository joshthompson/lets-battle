import { Show } from 'solid-js';
import type { Battler } from './battlers';
import Streaks from './Streaks';
import BattlerSprite from './BattlerSprite';
import { t, tx } from './i18n';
import { backgroundGradient } from './colors';
import trophyImg from './assets/misc/trophy.png';

export default function Victory(props: { winner: Battler; onDone: () => void }) {
  return (
    <div class="screen victory" style={{ background: backgroundGradient(props.winner.color) }}>
      <Streaks count={60} />
      <div class="victory-banner">{t('winner')}</div>
      <div class="victory-stage">
        <img class="victory-trophy" src={trophyImg} alt="" draggable={false} />
        <BattlerSprite battler={props.winner} width={280} height={420} class="victory-fighter" />
        <img class="victory-trophy victory-trophy-right" src={trophyImg} alt="" draggable={false} />
      </div>
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

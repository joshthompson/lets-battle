import type { Battler } from './battlers';
import Streaks from './Streaks';
import TeamLineup from './TeamLineup';
import { t, tx } from './i18n';
import { backgroundGradient } from './colors';
import trophyImg from './assets/misc/trophy.png';

// A member of the winning team and whether they survived. Fallen members are
// shown lying down (rotated) and greyed out, as they ended the match.
export interface WinningMember {
  battler: Battler;
  ko: boolean;
  koDir: 1 | -1;
}

export default function Victory(props: { team: WinningMember[]; onDone: () => void }) {
  // All members share an artist, so the first carries the team's colour and name.
  const lead = () => props.team[0].battler;

  return (
    <div class="screen victory" style={{ background: backgroundGradient(lead().teamColor ?? lead().color) }}>
      <Streaks count={60} />
      <div class="victory-banner">{t('winner')}</div>
      <div class="victory-team">
        <img class="victory-trophy" src={trophyImg} alt="" draggable={false} />
        <span class="victory-team-name">{t('team')} {tx(lead().artist ?? lead().name)}</span>
        <img class="victory-trophy victory-trophy-right" src={trophyImg} alt="" draggable={false} />
      </div>
      {/* Same row/honeycomb layout as the intro, shrunk to leave room for the
          banner and menu button. */}
      <TeamLineup members={props.team} scale={0.7} />
      <button class="start-btn" style={{ 'margin-top': '16px' }} onClick={props.onDone}>
        {t('menu')}
      </button>
    </div>
  );
}

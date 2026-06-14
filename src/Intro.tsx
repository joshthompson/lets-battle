import { createSignal, onCleanup, Show } from 'solid-js';
import { groupByTeam, type Battler } from './battlers';
import Streaks from './Streaks';
import TeamLineup from './TeamLineup';
import { t, tx } from './i18n';
import { backgroundGradient } from './colors';

const PER_TEAM_MS = 2850;

// Streak tilts, cycled per team so each slide's speed-line rain looks fresh.
const STREAK_ANGLES = [14, -20, 24, -10, 18, -26, 8, -16];

// Dramatic pre-battle intro: one team per slide, on a full-screen block of the
// team's colour, with the team name and every fighter on that team.
export default function Intro(props: { battlers: Battler[]; onDone: () => void }) {
  const teams = groupByTeam(props.battlers);
  const [index, setIndex] = createSignal(0);

  const timer = setInterval(() => {
    if (index() >= teams.length - 1) {
      clearInterval(timer);
      props.onDone();
    } else {
      setIndex((i) => i + 1);
    }
  }, PER_TEAM_MS);

  onCleanup(() => clearInterval(timer));

  const skip = () => {
    clearInterval(timer);
    props.onDone();
  };

  const current = () => teams[index()];

  return (
    <div class="screen intro">
      {/* keyed on the team so streaks and entrance animations restart each slide */}
      <Show when={current()} keyed>
        {(team) => (
          <div class="intro-team" style={{ background: backgroundGradient(team.color) }}>
            <Streaks count={50} baseAngle={STREAK_ANGLES[index() % STREAK_ANGLES.length]} />
            <div class="intro-team-title">
              {t('team')} {tx(team.artist)}
            </div>
            <TeamLineup members={team.battlers.map((b) => ({ battler: b }))} offset={index()} />
          </div>
        )}
      </Show>
      <button class="skip-intro-btn" onClick={skip} type="button">
        {t('skipIntro')}
      </button>
    </div>
  );
}

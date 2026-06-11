import { createSignal, Match, Switch, type Component } from 'solid-js';
import { generateBattlers, type Battler } from './battlers';
import Menu from './Menu';
import Intro from './Intro';
import Battle from './Battle';
import Victory from './Victory';
import Draw from './Draw';
import './styles.css';

type Phase = 'menu' | 'intro' | 'battle' | 'victory' | 'draw';

// Dev toggle: jump straight from the menu into the battle, skipping the intro.
const SKIP_INTRO = false;

const App: Component = () => {
  const [phase, setPhase] = createSignal<Phase>('menu');
  const [roster, setRoster] = createSignal<Battler[]>([]);
  const [winner, setWinner] = createSignal<Battler | null>(null);
  const [drawn, setDrawn] = createSignal<Battler[]>([]);

  const start = () => {
    // Fresh randomised roster each match.
    setRoster(generateBattlers(8));
    setPhase(SKIP_INTRO ? 'battle' : 'intro');
  };

  return (
    <Switch>
      <Match when={phase() === 'menu'}>
        <Menu onStart={start} />
      </Match>
      <Match when={phase() === 'intro'}>
        <Intro battlers={roster()} onDone={() => setPhase('battle')} />
      </Match>
      <Match when={phase() === 'battle'}>
        <Battle
          battlers={roster()}
          onWin={(b) => {
            setWinner(b);
            setPhase('victory');
          }}
          onDraw={(bs) => {
            setDrawn(bs);
            setPhase('draw');
          }}
        />
      </Match>
      <Match when={phase() === 'victory' && winner()}>
        <Victory winner={winner()!} onDone={() => setPhase('menu')} />
      </Match>
      <Match when={phase() === 'draw'}>
        <Draw battlers={drawn()} onDone={() => setPhase('menu')} />
      </Match>
    </Switch>
  );
};

export default App;

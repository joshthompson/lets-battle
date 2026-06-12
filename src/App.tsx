import { createEffect, createSignal, onCleanup, onMount, Match, Switch, type Component } from 'solid-js';
import { generateBattlers, type Battler } from './battlers';
import { t } from './i18n';
import Menu from './Menu';
import Intro from './Intro';
import Battle from './Battle';
import Victory from './Victory';
import Draw from './Draw';
import Credits from './Credits';
import './styles.css';

type Phase = 'menu' | 'intro' | 'battle' | 'victory' | 'draw' | 'credits';

// Dev toggle: jump straight from the menu into the battle, skipping the intro.
const SKIP_INTRO = false;

// The app is laid out at a fixed base size (the 1200x800 arena) and scaled to
// fit the window — shrinking on small windows and enlarging on big ones — so it
// always fills as much of the viewport as its aspect ratio allows.
const BASE_W = 1200;
const BASE_H = 800;

const App: Component = () => {
  const [phase, setPhase] = createSignal<Phase>('menu');
  const [roster, setRoster] = createSignal<Battler[]>([]);
  const [winner, setWinner] = createSignal<Battler | null>(null);
  const [drawn, setDrawn] = createSignal<Battler[]>([]);

  const start = () => {
    // Every fighter battles each match.
    setRoster(generateBattlers());
    setPhase(SKIP_INTRO ? 'battle' : 'intro');
  };

  // Keep the document title in sync with the chosen locale.
  createEffect(() => {
    document.title = t('title');
  });

  // Scale the whole stage to fit the window (both shrinking and enlarging).
  const [scale, setScale] = createSignal(1);
  const fit = () => setScale(Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H));
  onMount(() => {
    fit();
    window.addEventListener('resize', fit);
    onCleanup(() => window.removeEventListener('resize', fit));
  });

  return (
    <div class="app-stage" style={{ width: `${BASE_W}px`, height: `${BASE_H}px`, transform: `scale(${scale()})` }}>
    <Switch>
      <Match when={phase() === 'menu'}>
        <Menu onStart={start} onCredits={() => setPhase('credits')} />
      </Match>
      <Match when={phase() === 'credits'}>
        <Credits onDone={() => setPhase('menu')} />
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
    </div>
  );
};

export default App;

import { createSignal, onCleanup, For, Show } from 'solid-js';
import type { Battler } from './battlers';
import Streaks from './Streaks';
import BattlerSprite from './BattlerSprite';
import { t, tx } from './i18n';
import { backgroundGradient } from './colors';

const PER_SLIDE_MS = 1700;

// Pool of entrance animations and streak tilts, cycled per fighter so each
// intro feels distinct rather than a repeat of the last.
const ENTRANCES = ['intro-left', 'intro-right', 'intro-zoom', 'intro-drop', 'intro-rise', 'intro-spin'];
const STREAK_ANGLES = [14, -20, 24, -10, 18, -26, 8, -16];

// Looping idle animations for the sprite itself, cycled per fighter: a springy
// bounce, a wobble, a couple of x-scale flips, and a 3D matrix swing.
const SPRITE_ANIMS = ['sprite-spring', 'sprite-wobble', 'sprite-flip', 'sprite-tilt3d'];

// Sprites shrink as a slide gets more crowded so columns stay tidy.
const SPRITE_SIZE: Record<number, { w: number; h: number }> = {
  1: { w: 240, h: 360 },
  2: { w: 200, h: 300 },
  3: { w: 150, h: 225 },
};

interface Slide {
  battlers: Battler[];
  offset: number; // global index of this slide's first fighter
}

// Group fighters into slides that alternate 3, 2, 3, 2 … and never leave a
// single fighter stranded on the final slide.
function buildSlides(battlers: Battler[]): Slide[] {
  const sizes: number[] = [];
  let rem = battlers.length;
  let want = 3;
  while (rem > 0) {
    const take = Math.min(want, rem);
    sizes.push(take);
    rem -= take;
    want = want === 3 ? 2 : 3;
  }
  // A lone trailing fighter looks lost — fold it back into the previous slide
  // (2 → 3, or split a 3 into 2 + 2 to stay within three columns).
  if (sizes.length > 1 && sizes[sizes.length - 1] === 1) {
    sizes.pop();
    const last = sizes.length - 1;
    if (sizes[last] < 3) sizes[last] += 1;
    else {
      sizes[last] = 2;
      sizes.push(2);
    }
  }

  const slides: Slide[] = [];
  let offset = 0;
  for (const size of sizes) {
    slides.push({ battlers: battlers.slice(offset, offset + size), offset });
    offset += size;
  }
  return slides;
}

// Random slant (in % of width) for each interior column boundary. The two outer
// screen edges (k === 0 and k === n) stay square; every divide in between leans
// its own random amount and direction, so the splits aren't parallel.
function randomSlants(n: number): number[] {
  return Array.from({ length: n + 1 }, (_, k) =>
    k === 0 || k === n ? 0 : (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 7),
  );
}

// Clip a full-screen panel down to its column. Each edge leans by its boundary's
// slant: top pushed out by +s, bottom pulled in by −s.
function panelClip(i: number, n: number, s: number[]): string {
  const b = (k: number) => (k / n) * 100;
  const lTop = b(i) + s[i];
  const lBot = b(i) - s[i];
  const rTop = b(i + 1) + s[i + 1];
  const rBot = b(i + 1) - s[i + 1];
  return `polygon(${lTop}% 0, ${rTop}% 0, ${rBot}% 100%, ${lBot}% 100%)`;
}

// A thin parallelogram sitting on boundary k, sharing that boundary's slant so
// it lands exactly over the seam between the two columns.
function dividerClip(k: number, n: number, s: number[]): string {
  const thick = 0.9;
  const b = (k / n) * 100;
  const a = s[k];
  return `polygon(${b + a - thick}% 0, ${b + a + thick}% 0, ${b - a + thick}% 100%, ${b - a - thick}% 100%)`;
}

// Dramatic pre-battle intro: fighters are grouped into slides of alternating
// size, each fighter getting an angled split-screen column with their own block
// colour, speed streaks, sprite and name — the same card as the old full-screen
// intro. The slant of every divide is randomised per slide.
export default function Intro(props: { battlers: Battler[]; onDone: () => void }) {
  const slides = buildSlides(props.battlers);
  const [slide, setSlide] = createSignal(0);

  const timer = setInterval(() => {
    if (slide() >= slides.length - 1) {
      clearInterval(timer);
      props.onDone();
    } else {
      setSlide((i) => i + 1);
    }
  }, PER_SLIDE_MS);

  onCleanup(() => clearInterval(timer));

  const skip = () => {
    clearInterval(timer);
    props.onDone();
  };

  const current = () => slides[slide()];

  return (
    <div class="screen intro">
      {/* keyed on the slide so panels, streaks and entrances restart each time */}
      <Show when={current()} keyed>
        {(s) => {
          const group = s.battlers;
          const n = group.length;
          const size = SPRITE_SIZE[n] ?? SPRITE_SIZE[3];
          const slants = randomSlants(n);
          return (
            <>
              {/* angled colour panels with their own streaks, clipped to columns */}
              <For each={group}>
                {(b, i) => (
                  <div
                    class="intro-panel"
                    style={{ 'clip-path': panelClip(i(), n, slants), background: backgroundGradient(b.color) }}
                  >
                    <Streaks
                      count={n >= 3 ? 28 : 50}
                      baseAngle={STREAK_ANGLES[(s.offset + i()) % STREAK_ANGLES.length]}
                    />
                  </div>
                )}
              </For>

              {/* white slashes over the seams between columns */}
              <For each={Array.from({ length: n - 1 }, (_, k) => k + 1)}>
                {(k) => <div class="intro-divider" style={{ 'clip-path': dividerClip(k, n, slants) }} />}
              </For>

              {/* fighter cards, centred over each column and left unclipped so
                  long names spill past the slant rather than getting cut off */}
              <For each={group}>
                {(b, i) => {
                  const gi = s.offset + i();
                  return (
                    <div class={`intro-slot intro-slot--${n}`} style={{ left: `${((i() + 0.5) / n) * 100}%` }}>
                      <div
                        class="intro-card"
                        style={{
                          animation: `${ENTRANCES[gi % ENTRANCES.length]} 0.55s cubic-bezier(0.2, 1.4, 0.4, 1) both`,
                        }}
                      >
                        <div class={`intro-fighter-anim ${SPRITE_ANIMS[gi % SPRITE_ANIMS.length]}`}>
                          <BattlerSprite battler={b} width={size.w} height={size.h} class="intro-fighter" />
                        </div>
                        <div class="intro-name">{tx(b.name)}</div>
                        <Show when={b.artist}>
                          <div class="intro-by">{t('by')} {tx(b.artist!)}</div>
                        </Show>
                        <div class="intro-vs">
                          {t('fighter')} {gi + 1} / {props.battlers.length}
                        </div>
                      </div>
                    </div>
                  );
                }}
              </For>
            </>
          );
        }}
      </Show>
      <button class="skip-intro-btn" onClick={skip} type="button">
        {t('skipIntro')}
      </button>
    </div>
  );
}

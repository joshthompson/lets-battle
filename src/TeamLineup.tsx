import { For, Show } from 'solid-js';
import type { Battler } from './battlers';
import BattlerSprite from './BattlerSprite';
import { tx } from './i18n';

// Pool of entrance animations and idle sprite animations, cycled per card so a
// team reads as a lively bunch rather than a row of clones.
const ENTRANCES = ['intro-left', 'intro-right', 'intro-zoom', 'intro-drop', 'intro-rise', 'intro-spin'];
// Six distinct idle animations — one for each member of a full team, so no two
// fighters on a slide loop the same motion.
const SPRITE_ANIMS = [
  'sprite-spring',
  'sprite-wobble',
  'sprite-flip',
  'sprite-tilt3d',
  'sprite-pulse',
  'sprite-sway',
];

// Fixed formations for the larger teams. Cards are absolutely placed inside a
// box (sized w×h before scaling), so they never wrap on small screens the way a
// flex row does. Each entry is a card's centre: left %, and top px (scaled).
//   5:  ..1..2..        6:  ..1..2..
//      .3..4..5.            3......4
//                           ..5..6..
const FORMATIONS: Record<number, { w: number; h: number; pos: { left: number; top: number }[] }> = {
  5: {
    w: 760,
    h: 460,
    pos: [
      { left: 36, top: 0 },
      { left: 64, top: 0 },
      { left: 18, top: 215 },
      { left: 50, top: 215 },
      { left: 82, top: 215 },
    ],
  },
  6: {
    w: 800,
    h: 480,
    pos: [
      { left: 30, top: 0 },
      { left: 70, top: 0 },
      { left: 8, top: 120 },
      { left: 92, top: 120 },
      { left: 30, top: 240 },
      { left: 70, top: 240 },
    ],
  },
};

// Base sprite/name sizes by team size; the lineup's `scale` shrinks these.
export function teamSizing(n: number): { w: number; h: number; name: number } {
  if (n === 1) return { w: 240, h: 360, name: 52 };
  if (n <= 3) return { w: 180, h: 270, name: 36 };
  return { w: 130, h: 195, name: 26 };
}

export interface LineupMember {
  battler: Battler;
  // Fallen members are shown lying down (rotated) and greyed out.
  ko?: boolean;
  koDir?: 1 | -1;
}

// Shared team layout for the intro and the victory screen: a centred row for
// teams of up to five, and an interlocking honeycomb for a team of six. `scale`
// shrinks the whole formation — sprites, names and the hex box — together.
// `offset` shifts where the animation cycle starts (the intro passes the slide
// number) so the same motion doesn't land in the same spot on every slide.
export default function TeamLineup(props: { members: LineupMember[]; scale?: number; offset?: number }) {
  const scale = () => props.scale ?? 1;
  const size = () => {
    const b = teamSizing(props.members.length);
    const s = scale();
    return { w: Math.round(b.w * s), h: Math.round(b.h * s), name: Math.round(b.name * s) };
  };

  const card = (m: LineupMember, i: number) => {
    const sz = size();
    // Shift the cycle by the slide offset so each slide starts on a different
    // animation and no motion repeats in the same position across slides.
    const a = i + (props.offset ?? 0);
    return (
      <div
        class={`intro-team-card${m.ko ? ' ko' : ''}`}
        style={{
          animation: `${ENTRANCES[a % ENTRANCES.length]} 0.5s cubic-bezier(0.2, 1.4, 0.4, 1) both`,
          'animation-delay': `${0.15 + i * 0.08}s`,
        }}
      >
        <div
          class={`intro-fighter-anim${m.ko ? '' : ' ' + SPRITE_ANIMS[a % SPRITE_ANIMS.length]}`}
          style={m.ko ? { transform: `rotate(${(m.koDir ?? 1) * 90}deg)` } : undefined}
        >
          <BattlerSprite battler={m.battler} width={sz.w} height={sz.h} class="intro-fighter" />
        </div>
        <div class="intro-team-name" style={{ 'font-size': `${sz.name}px` }}>
          {tx(m.battler.name)}
        </div>
      </div>
    );
  };

  const formation = () => FORMATIONS[props.members.length];

  return (
    <Show
      when={formation()}
      fallback={
        <div class="intro-team-row">
          <For each={props.members}>{(m, i) => card(m, i())}</For>
        </div>
      }
    >
      {(f) => (
        <div
          class="intro-team-hex"
          style={{ width: `${Math.round(f().w * scale())}px`, height: `${Math.round(f().h * scale())}px` }}
        >
          <For each={props.members}>
            {(m, i) => (
              <div
                class="intro-team-hex-slot"
                style={{ left: `${f().pos[i()].left}%`, top: `${Math.round(f().pos[i()].top * scale())}px` }}
              >
                {card(m, i())}
              </div>
            )}
          </For>
        </div>
      )}
    </Show>
  );
}
